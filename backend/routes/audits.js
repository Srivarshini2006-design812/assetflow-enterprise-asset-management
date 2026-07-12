const express = require("express");
const { readDB, writeDB, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { log, notify } = require("../utils/activity");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.auditCycles);
});

// Create an audit cycle scoped to a department/location; auto-pulls matching assets into the checklist
router.post("/", requireRole("Admin", "AssetManager", "DeptHead"), (req, res) => {
  const { title, department, location, dateRangeStart, dateRangeEnd, auditors } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });
  const db = readDB();
  let scoped = db.assets;
  if (department) scoped = scoped.filter((a) => a.department === department);
  if (location) scoped = scoped.filter((a) => a.location === location);

  const cycle = {
    id: nextId(db, "audit"),
    title,
    department: department || null,
    location: location || null,
    dateRangeStart: dateRangeStart || null,
    dateRangeEnd: dateRangeEnd || null,
    auditors: auditors || [],
    status: "Active",
    items: scoped.map((a) => ({
      assetId: a.id,
      assetTag: a.tag,
      assetName: a.name,
      expectedLocation: a.location,
      verification: null,
      auditStatus: "Pending"
    })),
    discrepancies: [],
    closedAt: null
  };
  db.auditCycles.push(cycle);
  log(db, `Audit cycle "${title}" started`, "Audit");
  writeDB(db);
  res.status(201).json(cycle);
});

// Auditor marks each item: Verified / Missing / Damaged, with observed location
router.patch("/:id/items/:assetId", (req, res) => {
  const { verification, auditStatus } = req.body; // auditStatus: Verified | Missing | Damaged | Mismatch
  const db = readDB();
  const cycle = db.auditCycles.find((c) => c.id === Number(req.params.id));
  if (!cycle) return res.status(404).json({ error: "Audit cycle not found" });
  if (cycle.status === "Closed") return res.status(400).json({ error: "Audit cycle is closed" });
  const item = cycle.items.find((i) => i.assetId === Number(req.params.assetId));
  if (!item) return res.status(404).json({ error: "Asset not in this audit cycle" });
  item.verification = verification || item.expectedLocation;
  item.auditStatus = auditStatus || (item.verification === item.expectedLocation ? "Verified" : "Mismatch");
  writeDB(db);
  res.json(item);
});

// Close cycle: auto-generates discrepancy report and updates asset statuses (Missing -> Lost)
router.post("/:id/close", requireRole("Admin", "AssetManager", "DeptHead"), (req, res) => {
  const db = readDB();
  const cycle = db.auditCycles.find((c) => c.id === Number(req.params.id));
  if (!cycle) return res.status(404).json({ error: "Audit cycle not found" });
  if (cycle.status === "Closed") return res.status(400).json({ error: "Audit cycle already closed" });

  const discrepancies = cycle.items.filter((i) => i.auditStatus === "Missing" || i.auditStatus === "Damaged" || i.auditStatus === "Mismatch");
  discrepancies.forEach((item) => {
    const asset = db.assets.find((a) => a.id === item.assetId);
    if (asset && item.auditStatus === "Missing") {
      asset.status = "Lost";
    }
  });
  cycle.discrepancies = discrepancies;
  cycle.status = "Closed";
  cycle.closedAt = new Date().toISOString().slice(0, 10);

  log(db, `Audit cycle "${cycle.title}" closed - ${discrepancies.length} discrepancies flagged`, "Audit");
  if (discrepancies.length > 0) {
    notify(db, `Audit discrepancy report: ${discrepancies.length} assets flagged in "${cycle.title}"`, "Audit");
  }
  writeDB(db);
  res.json(cycle);
});

module.exports = router;
