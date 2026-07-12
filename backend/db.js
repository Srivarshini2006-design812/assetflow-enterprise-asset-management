const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "data", "db.json");

function seed() {
  const hash = (pw) => bcrypt.hashSync(pw, 8);
  const now = new Date().toISOString();

  return {
    counters: { user: 4, department: 3, category: 4, asset: 4, allocation: 2, transfer: 1, booking: 2, maintenance: 3, audit: 1, notification: 3, log: 3 },

    settings: {
      notifications: {
        email: true,
        inApp: true,
        maintenanceAlerts: true,
        auditAlerts: true,
        bookingReminders: true
      }
    },
    roles: [
      { id: 1, name: "Admin", description: "Platform administrator", status: "Active" },
      { id: 2, name: "AssetManager", description: "Asset lifecycle owner", status: "Active" },
      { id: 3, name: "DeptHead", description: "Department owner", status: "Active" },
      { id: 4, name: "Employee", description: "Standard user", status: "Active" }
    ],
    permissions: [
      { id: 1, name: "org.manage", description: "Manage organization setup", status: "Active" },
      { id: 2, name: "assets.manage", description: "Manage assets", status: "Active" },
      { id: 3, name: "allocations.manage", description: "Allocate and transfer assets", status: "Active" },
      { id: 4, name: "maintenance.approve", description: "Approve maintenance", status: "Active" }
    ],
    locations: [
      { id: 1, name: "Mumbai", description: "Head office", status: "Active" },
      { id: 2, name: "Bengaluru", description: "Regional office", status: "Active" },
      { id: 3, name: "HQ Floor 1", description: "Shared workspace", status: "Active" }
    ],
    suppliers: [
      { id: 1, name: "TechVault", description: "Hardware supplier", status: "Active" }
    ],
    purchaseOrders: [
      { id: 1, poNumber: "PO-1001", supplierId: 1, status: "Completed", createdAt: now }
    ],
    warrantyInformation: [
      { id: 1, assetId: 1, warrantyExpiryDate: "2026-01-10", status: "Active" }
    ],
    assetTags: [
      { id: 1, assetId: 1, tag: "AF-0114", qrCode: "AF-0114" }
    ],
    qrCodes: [
      { id: 1, assetId: 1, code: "AF-0114", status: "Active" }
    ],
    bookingConflicts: [],
    maintenanceSchedules: [],
    transferHistory: [],
    resourceTypes: [
      { id: 1, name: "Conference Room", description: "Shared meeting room", status: "Active" }
    ],
    resourceAvailability: [
      { id: 1, resourceTypeId: 1, date: now.slice(0, 10), availableSlots: 5, status: "Active" }
    ],
    userPreferences: [
      { id: 1, userId: 1, emailNotifications: true, inAppNotifications: true, maintenanceAlerts: true, auditAlerts: true, bookingReminders: true }
    ],
    systemLogs: [
      { id: 1, level: "Info", message: "AssetFlow bootstrapped", createdAt: now }
    ],
    exportHistory: [],
    complianceRecords: [
      { id: 1, name: "Annual asset audit compliance", status: "Active", createdAt: now }
    ],

    users: [
      { id: 1, name: "Admin User", email: "admin@assetflow.com", password: hash("admin123"), role: "Admin", department: "Engineering", status: "Active" },
      { id: 2, name: "Priya Shah", email: "priya@assetflow.com", password: hash("priya123"), role: "Employee", department: "Engineering", status: "Active" },
      { id: 3, name: "Rohan Mehta", email: "rohan@assetflow.com", password: hash("rohan123"), role: "AssetManager", department: "Engineering", status: "Active" },
      { id: 4, name: "Sana Iqbal", email: "sana@assetflow.com", password: hash("sana123"), role: "DeptHead", department: "Facilities", status: "Active" }
    ],

    departments: [
      { id: 1, name: "Engineering", head: "Rohan Mehta", parentId: null, status: "Active" },
      { id: 2, name: "Facilities", head: "Sana Iqbal", parentId: null, status: "Active" },
      { id: 3, name: "Field Ops", head: null, parentId: null, status: "Inactive" }
    ],

    categories: [
      { id: 1, name: "Electronics", status: "Active", warrantyPeriodMonths: 24 },
      { id: 2, name: "Furniture", status: "Active", warrantyPeriodMonths: 0 },
      { id: 3, name: "Equipment", status: "Active", warrantyPeriodMonths: 12 },
      { id: 4, name: "Consumables", status: "Inactive", warrantyPeriodMonths: 0 }
    ],

    assets: [
      { id: 1, tag: "AF-0114", name: "Dell Laptop", category: "Electronics", serialNumber: "SN-114", acquisitionDate: "2024-01-10", acquisitionCost: 85000, condition: "Good", location: "Mumbai", department: "Engineering", status: "Allocated", bookable: false, notes: "" },
      { id: 2, tag: "AF-0062", name: "Projector", category: "Electronics", serialNumber: "SN-062", acquisitionDate: "2023-06-01", acquisitionCost: 45000, condition: "Fair", location: "HQ Floor 2", department: "Facilities", status: "Under Maintenance", bookable: true, notes: "Bulb issue" },
      { id: 3, tag: "AF-0201", name: "Office Chair", category: "Furniture", serialNumber: "SN-201", acquisitionDate: "2022-03-15", acquisitionCost: 8000, condition: "Good", location: "Warehouse", department: "Facilities", status: "Available", bookable: false, notes: "" },
      { id: 4, tag: "AF-0009", name: "Conference Room B2", category: "Equipment", serialNumber: "SN-009", acquisitionDate: "2021-01-01", acquisitionCost: 0, condition: "Good", location: "HQ Floor 1", department: "Facilities", status: "Available", bookable: true, notes: "Shared meeting room" }
    ],

    allocations: [
      { id: 1, assetId: 1, employeeId: 2, employeeName: "Priya Shah", department: "Engineering", allocatedDate: "2026-03-12", expectedReturnDate: "2026-08-01", returnedDate: null, status: "Active", conditionNotes: "" },
      { id: 2, assetId: 1, employeeId: 2, employeeName: "Arjun Nair", department: "Engineering", allocatedDate: "2025-11-01", expectedReturnDate: "2026-01-04", returnedDate: "2026-01-04", status: "Returned", conditionNotes: "Condition: good" }
    ],

    transferRequests: [],

    bookings: [
      { id: 1, assetId: 4, resourceName: "Conference Room B2", bookedBy: "Rohan Mehta", department: "Engineering", date: "2026-07-13", startTime: "09:00", endTime: "10:00", purpose: "Procurement sync", status: "Upcoming" }
    ],

    maintenanceRequests: [
      { id: 1, assetId: 2, type: "Corrective", description: "Projector bulb not turning on", priority: "Medium", technician: null, requestedDate: "2026-07-10", department: "Facilities", status: "Pending" },
      { id: 2, assetId: 3, type: "Preventive", description: "AC unit noisy compressor", priority: "Low", technician: null, requestedDate: "2026-07-09", department: "Facilities", status: "Pending" }
    ],

    auditCycles: [],

    notifications: [
      { id: 1, message: "Laptop AF-0114 allocated to Priya Shah - Engineering", type: "Allocation", read: false, createdAt: now },
      { id: 2, message: "Maintenance request AF-0062 raised", type: "Maintenance", read: false, createdAt: now },
      { id: 3, message: "Overdue return: AF-0021 was due 3 days ago", type: "Alert", read: false, createdAt: now }
    ],

    activityLogs: [
      { id: 1, message: "Laptop AF-0114 allocated to Priya Shah - IT dept", type: "Allocation", createdAt: now },
      { id: 2, message: "Room B2 booking confirmed 9:00-10:00", type: "Booking", createdAt: now },
      { id: 3, message: "Projector AF-0062 maintenance requested", type: "Maintenance", createdAt: now }
    ]
  };
}

function normalizeDB(data) {
  const defaults = seed();
  const normalized = { ...defaults, ...data };
  normalized.settings = {
    ...defaults.settings,
    ...(data.settings || {})
  };
  normalized.settings.notifications = {
    ...defaults.settings.notifications,
    ...(data.settings?.notifications || {})
  };
  return normalized;
}

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(seed(), null, 2));
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  const normalized = normalizeDB(data);
  if (JSON.stringify(normalized) !== JSON.stringify(data)) {
    writeDB(normalized);
  }
  return normalized;
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextId(db, key) {
  db.counters[key] = (db.counters[key] || 0) + 1;
  return db.counters[key];
}

module.exports = { readDB, writeDB, nextId };
