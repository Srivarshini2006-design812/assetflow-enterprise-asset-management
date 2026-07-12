const express = require("express");
const { readDB, writeDB, nextId } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { log, notify } = require("../utils/activity");

const router = express.Router();
router.use(requireAuth);

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

router.get("/", (req, res) => {
  const db = readDB();
  const { assetId, date } = req.query;
  let list = db.bookings;
  if (assetId) list = list.filter((b) => b.assetId === Number(assetId));
  if (date) list = list.filter((b) => b.date === date);
  res.json(list);
});

router.post("/", (req, res) => {
  const { assetId, resourceName, bookedBy, department, date, startTime, endTime, purpose } = req.body;
  if (!assetId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: "assetId, date, startTime, endTime are required" });
  }
  if (toMinutes(startTime) >= toMinutes(endTime)) {
    return res.status(400).json({ error: "End time must be after start time" });
  }
  const db = readDB();
  const asset = db.assets.find((a) => a.id === Number(assetId));
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  if (!asset.bookable) return res.status(400).json({ error: "This asset cannot be booked" });

  const conflict = db.bookings.find(
    (b) => b.assetId === Number(assetId) && b.date === date && b.status !== "Cancelled" && overlaps(startTime, endTime, b.startTime, b.endTime)
  );
  if (conflict) {
    return res.status(409).json({
      error: "booking_conflict",
      message: `Slot unavailable - already booked ${conflict.startTime} to ${conflict.endTime} by ${conflict.bookedBy}`,
      conflict
    });
  }
  const booking = {
    id: nextId(db, "booking"),
    assetId: Number(assetId),
    resourceName: resourceName || "Resource",
    bookedBy: bookedBy || "Unknown",
    department: department || null,
    date, startTime, endTime,
    purpose: purpose || "",
    status: "Upcoming"
  };
  db.bookings.push(booking);
  log(db, `${resourceName || "Resource"} booking confirmed ${startTime} to ${endTime}`, "Booking");
  notify(db, `Booking confirmed: ${resourceName} ${startTime}-${endTime}`, "Booking");
  writeDB(db);
  res.status(201).json(booking);
});

router.patch("/:id/cancel", (req, res) => {
  const db = readDB();
  const booking = db.bookings.find((b) => b.id === Number(req.params.id));
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  booking.status = "Cancelled";
  log(db, `Booking cancelled: ${booking.resourceName} ${booking.startTime}-${booking.endTime}`, "Booking");
  writeDB(db);
  res.json(booking);
});

module.exports = router;
