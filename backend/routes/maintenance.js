const express = require("express");
const { readDB, writeDB, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { log, notify } = require("../utils/activity");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.maintenanceRequests);
});

router.post("/", (req, res) => {
  const { assetId, type, description, priority, technician, department } = req.body;
  if (!assetId || !description) return res.status(400).json({ error: "assetId and description are required" });
  const db = readDB();
  const asset = db.assets.find((a) => a.id === Number(assetId));
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  const request = {
    id: nextId(db, "maintenance"),
    assetId: asset.id,
    type: type || "Corrective",
    description,
    priority: priority || "Medium",
    technician: technician || null,
    requestedDate: new Date().toISOString().slice(0, 10),
    department: department || asset.department,
    status: "Pending"
  };
  db.maintenanceRequests.push(request);
  log(db, `Maintenance request raised for ${asset.tag}`, "Maintenance");
  writeDB(db);
  res.status(201).json(request);
});

// Kanban transitions: Pending -> Approved (asset -> Under Maintenance) / Rejected
//                      Approved -> Resolved (asset -> Available)
router.patch("/:id/status", requireRole("Admin", "AssetManager"), (req, res) => {
  const { status, technician } = req.body;
  const allowed = ["Pending", "Approved", "Rejected", "In Progress", "Resolved"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const db = readDB();
  const request = db.maintenanceRequests.find((m) => m.id === Number(req.params.id));
  if (!request) return res.status(404).json({ error: "Maintenance request not found" });
  const asset = db.assets.find((a) => a.id === request.assetId);

  request.status = status;
  if (technician) request.technician = technician;

  if (status === "Approved" && asset) {
    asset.status = "Under Maintenance";
    log(db, `Maintenance approved for ${asset.tag} - status set to Under Maintenance`, "Maintenance");
    notify(db, `Maintenance request ${asset.tag} approved`, "Maintenance");
  } else if (status === "Resolved" && asset) {
    asset.status = "Available";
    log(db, `Maintenance resolved for ${asset.tag} - status set to Available`, "Maintenance");
    notify(db, `Maintenance request ${asset.tag} resolved`, "Maintenance");
  } else if (status === "Rejected") {
    log(db, `Maintenance request #${request.id} rejected`, "Maintenance");
    notify(db, `Maintenance request rejected for ${asset ? asset.tag : ""}`, "Maintenance");
  }
  writeDB(db);
  res.json(request);
});

module.exports = router;
