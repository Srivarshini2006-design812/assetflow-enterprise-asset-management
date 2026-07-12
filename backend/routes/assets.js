const express = require("express");
const { readDB, writeDB, nextId } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { log } = require("../utils/activity");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const db = readDB();
  let list = db.assets;
  const { q, category, status, department, location } = req.query;
  if (q) {
    const term = q.toLowerCase();
    list = list.filter(
      (a) => a.tag.toLowerCase().includes(term) || a.name.toLowerCase().includes(term) || a.serialNumber.toLowerCase().includes(term)
    );
  }
  if (category) list = list.filter((a) => a.category === category);
  if (status) list = list.filter((a) => a.status === status);
  if (department) list = list.filter((a) => a.department === department);
  if (location) list = list.filter((a) => a.location === location);
  res.json(list);
});

router.get("/:id", (req, res) => {
  const db = readDB();
  const asset = db.assets.find((a) => a.id === Number(req.params.id));
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  const allocationHistory = db.allocations.filter((al) => al.assetId === asset.id).sort((a, b) => (a.allocatedDate < b.allocatedDate ? 1 : -1));
  const maintenanceHistory = db.maintenanceRequests.filter((m) => m.assetId === asset.id);
  res.json({ ...asset, allocationHistory, maintenanceHistory });
});

router.post("/", (req, res) => {
  const { name, category, serialNumber, acquisitionDate, acquisitionCost, condition, location, department, status, bookable, notes, tag, warrantyExpiryDate } = req.body;
  if (!name || !category) return res.status(400).json({ error: "Name and category are required" });
  const db = readDB();
  const id = nextId(db, "asset");
  const generatedTag = `AF-${String(id).padStart(4, "0")}`;
  const asset = {
    id,
    tag: tag || generatedTag,
    name,
    category,
    serialNumber: serialNumber || "",
    acquisitionDate: acquisitionDate || null,
    acquisitionCost: acquisitionCost || 0,
    condition: condition || "Good",
    location: location || "",
    department: department || null,
    status: status || "Available",
    bookable: !!bookable,
    notes: notes || "",
    warrantyExpiryDate: warrantyExpiryDate || null
  };
  db.assets.push(asset);
  log(db, `New asset added: ${asset.tag} ${name}`, "Asset");
  writeDB(db);
  res.status(201).json(asset);
});

router.put("/:id", (req, res) => {
  const db = readDB();
  const asset = db.assets.find((a) => a.id === Number(req.params.id));
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  Object.assign(asset, req.body, { id: asset.id, tag: req.body.tag || asset.tag });
  writeDB(db);
  res.json(asset);
});

router.delete("/:id", (req, res) => {
  const db = readDB();
  const idx = db.assets.findIndex((a) => a.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Asset not found" });
  const [removed] = db.assets.splice(idx, 1);
  log(db, `Asset ${removed.tag} deleted`, "Asset");
  writeDB(db);
  res.json({ success: true });
});

module.exports = router;
