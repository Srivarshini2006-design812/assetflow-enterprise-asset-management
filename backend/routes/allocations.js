const express = require("express");
const { readDB, writeDB, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { log, notify } = require("../utils/activity");

const router = express.Router();
router.use(requireAuth);

function activeAllocation(db, assetId) {
  return db.allocations.find((a) => a.assetId === assetId && a.status === "Active");
}

router.get("/", (req, res) => {
  const db = readDB();
  const today = new Date().toISOString().slice(0, 10);
  const enriched = db.allocations.map((a) => ({
    ...a,
    overdue: a.status === "Active" && a.expectedReturnDate && a.expectedReturnDate < today
  }));
  res.json(enriched);
});

router.get("/transfers", (req, res) => {
  const db = readDB();
  res.json(db.transferRequests);
});

// Allocate an asset - BLOCKED if already actively allocated
router.post("/", (req, res) => {
  const { assetId, employeeId, employeeName, department, expectedReturnDate } = req.body;
  const db = readDB();
  const asset = db.assets.find((a) => a.id === Number(assetId));
  if (!asset) return res.status(404).json({ error: "Asset not found" });

  const existing = activeAllocation(db, asset.id);
  if (existing) {
    return res.status(409).json({
      error: "double_allocation_blocked",
      message: `This asset is currently held by ${existing.employeeName}. Allocation blocked - use Transfer Request instead.`,
      currentHolder: existing.employeeName
    });
  }

  const allocation = {
    id: nextId(db, "allocation"),
    assetId: asset.id,
    employeeId: employeeId || null,
    employeeName: employeeName || "Unknown",
    department: department || asset.department,
    allocatedDate: new Date().toISOString().slice(0, 10),
    expectedReturnDate: expectedReturnDate || null,
    returnedDate: null,
    status: "Active",
    conditionNotes: ""
  };
  db.allocations.push(allocation);
  asset.status = "Allocated";
  log(db, `${asset.tag} ${asset.name} allocated to ${allocation.employeeName}`, "Allocation");
  notify(db, `Asset ${asset.tag} allocated to ${allocation.employeeName}`, "Allocation");
  writeDB(db);
  res.status(201).json(allocation);
});

// Return an asset
router.post("/:id/return", (req, res) => {
  const { conditionNotes } = req.body;
  const db = readDB();
  const allocation = db.allocations.find((a) => a.id === Number(req.params.id));
  if (!allocation) return res.status(404).json({ error: "Allocation not found" });
  allocation.status = "Returned";
  allocation.returnedDate = new Date().toISOString().slice(0, 10);
  allocation.conditionNotes = conditionNotes || "";
  const asset = db.assets.find((a) => a.id === allocation.assetId);
  if (asset) asset.status = "Available";
  log(db, `${asset ? asset.tag : "Asset"} returned by ${allocation.employeeName}`, "Allocation");
  writeDB(db);
  res.json(allocation);
});

// Request a transfer for an already-allocated asset
router.post("/transfers", (req, res) => {
  const { assetId, toEmployeeId, toEmployeeName, reason } = req.body;
  const db = readDB();
  const asset = db.assets.find((a) => a.id === Number(assetId));
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  const current = activeAllocation(db, asset.id);

  const transfer = {
    id: nextId(db, "transfer"),
    assetId: asset.id,
    fromEmployeeId: current ? current.employeeId : null,
    fromEmployeeName: current ? current.employeeName : "Unallocated",
    toEmployeeId: toEmployeeId || null,
    toEmployeeName: toEmployeeName || "Unassigned",
    reason: reason || "",
    status: "Pending",
    requestedDate: new Date().toISOString().slice(0, 10)
  };
  db.transferRequests.push(transfer);
  log(db, `Transfer requested for ${asset.tag}: ${transfer.fromEmployeeName} -> ${transfer.toEmployeeName}`, "Transfer");
  writeDB(db);
  res.status(201).json(transfer);
});

// Approve/reject transfer - approval re-allocates and updates history automatically
router.patch("/transfers/:id", requireRole("Admin", "AssetManager", "DeptHead"), (req, res) => {
  const { action } = req.body; // "Approved" or "Rejected"
  const db = readDB();
  const transfer = db.transferRequests.find((t) => t.id === Number(req.params.id));
  if (!transfer) return res.status(404).json({ error: "Transfer request not found" });
  if (transfer.status !== "Pending") return res.status(400).json({ error: "Transfer already processed" });

  transfer.status = action;
  if (action === "Approved") {
    const asset = db.assets.find((a) => a.id === transfer.assetId);
    const current = activeAllocation(db, transfer.assetId);
    if (current) {
      current.status = "Returned";
      current.returnedDate = new Date().toISOString().slice(0, 10);
    }
    const allocation = {
      id: nextId(db, "allocation"),
      assetId: transfer.assetId,
      employeeId: transfer.toEmployeeId,
      employeeName: transfer.toEmployeeName,
      department: asset ? asset.department : null,
      allocatedDate: new Date().toISOString().slice(0, 10),
      expectedReturnDate: null,
      returnedDate: null,
      status: "Active",
      conditionNotes: ""
    };
    db.allocations.push(allocation);
    if (asset) asset.status = "Allocated";
    log(db, `Transfer approved: ${asset ? asset.tag : ""} to ${transfer.toEmployeeName}`, "Transfer");
    notify(db, `Transfer approved: ${asset ? asset.tag : ""} to ${transfer.toEmployeeName}`, "Transfer");
  } else {
    log(db, `Transfer request #${transfer.id} rejected`, "Transfer");
  }
  writeDB(db);
  res.json(transfer);
});

module.exports = router;
