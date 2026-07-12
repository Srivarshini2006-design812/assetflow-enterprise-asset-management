const express = require("express");
const { readDB } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/dashboard", (req, res) => {
  const db = readDB();
  const today = new Date().toISOString().slice(0, 10);

  const available = db.assets.filter((a) => a.status === "Available").length;
  const allocated = db.assets.filter((a) => a.status === "Allocated").length;
  const underMaintenance = db.assets.filter((a) => a.status === "Under Maintenance").length;
  const activeBookings = db.bookings.filter((b) => b.status === "Upcoming" || b.status === "Ongoing").length;
  const pendingTransfers = db.transferRequests.filter((t) => t.status === "Pending").length;
  const overdueAllocations = db.allocations.filter((a) => a.status === "Active" && a.expectedReturnDate && a.expectedReturnDate < today);
  const upcomingReturns = db.allocations.filter((a) => a.status === "Active" && a.expectedReturnDate && a.expectedReturnDate >= today).length;

  res.json({
    kpis: {
      available, allocated, underMaintenance,
      activeBookings, pendingTransfers,
      upcomingReturns, overdueReturns: overdueAllocations.length,
      maintenanceToday: db.maintenanceRequests.filter((m) => m.requestedDate === today).length
    },
    overdueAllocations,
    recentActivity: db.activityLogs.slice(0, 8)
  });
});

router.get("/analytics", (req, res) => {
  const db = readDB();
  const { department, category, from, to } = req.query;

  let filteredAssets = db.assets.filter((a) => {
    if (department && a.department !== department) return false;
    if (category && a.category !== category) return false;
    return true;
  });

  let filteredBookings = db.bookings.filter((b) => {
    if (department && b.department !== department) return false;
    if (from && b.date < from) return false;
    if (to && b.date > to) return false;
    return true;
  });

  const byCategory = {};
  filteredAssets.forEach((a) => {
    byCategory[a.category] = byCategory[a.category] || { total: 0, allocated: 0 };
    byCategory[a.category].total += 1;
    if (a.status === "Allocated") byCategory[a.category].allocated += 1;
  });
  const utilizationByCategory = Object.entries(byCategory).map(([categoryName, v]) => ({
    category: categoryName,
    utilizationPct: v.total ? Math.round((v.allocated / v.total) * 100) : 0
  }));

  const bookingCounts = {};
  filteredBookings.forEach((b) => {
    bookingCounts[b.resourceName] = (bookingCounts[b.resourceName] || 0) + 1;
  });
  const mostUsed = Object.entries(bookingCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maintenanceByMonth = {};
  db.maintenanceRequests.forEach((m) => {
    const month = (m.requestedDate || "").slice(0, 7);
    if (department && m.department !== department) return;
    if (from && m.requestedDate < from) return;
    if (to && m.requestedDate > to) return;
    maintenanceByMonth[month] = (maintenanceByMonth[month] || 0) + 1;
  });

  const now = new Date();
  const idleAssets = filteredAssets.filter((a) => a.status === "Available" && !filteredBookings.some((b) => b.assetId === a.id));

  const departmentSummary = db.departments.map((d) => ({
    department: d.name,
    allocatedAssets: db.allocations.filter((a) => a.status === "Active" && a.department === d.name).length
  }));

  res.json({
    utilizationByCategory,
    mostUsed,
    idleAssets: idleAssets.map((a) => ({ tag: a.tag, name: a.name })),
    maintenanceByMonth,
    departmentSummary,
    nearingRetirement: filteredAssets.filter((a) => {
      if (!a.acquisitionDate) return false;
      const years = (now - new Date(a.acquisitionDate)) / (1000 * 60 * 60 * 24 * 365);
      return years >= 3;
    }).map((a) => ({ tag: a.tag, name: a.name, ageYears: Math.floor((now - new Date(a.acquisitionDate)) / (1000 * 60 * 60 * 24 * 365)) }))
  });
});

module.exports = router;
