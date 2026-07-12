const express = require("express");
const { readDB, writeDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.notifications);
});

router.get("/logs", (req, res) => {
  const db = readDB();
  res.json(db.activityLogs);
});

router.get("/preferences", (req, res) => {
  const db = readDB();
  res.json(db.settings?.notifications || {
    email: true,
    inApp: true,
    maintenanceAlerts: true,
    auditAlerts: true,
    bookingReminders: true
  });
});

router.patch("/preferences", (req, res) => {
  const db = readDB();
  const next = {
    ...db.settings?.notifications,
    ...req.body
  };
  db.settings = { ...(db.settings || {}), notifications: next };
  writeDB(db);
  res.json(next);
});

router.patch("/read-all", (req, res) => {
  const db = readDB();
  db.notifications.forEach((n) => (n.read = true));
  writeDB(db);
  res.json({ success: true });
});

module.exports = router;
