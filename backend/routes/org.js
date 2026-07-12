const express = require("express");
const bcrypt = require("bcryptjs");
const { readDB, writeDB, nextId } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { log } = require("../utils/activity");

const router = express.Router();
router.use(requireAuth);

// ---------- Departments ----------
router.get("/departments", (req, res) => {
  const db = readDB();
  res.json(db.departments);
});

router.post("/departments", requireRole("Admin"), (req, res) => {
  const { name, head, parentId, status } = req.body;
  if (!name) return res.status(400).json({ error: "Department name is required" });
  const db = readDB();
  const dept = { id: nextId(db, "department"), name, head: head || null, parentId: parentId || null, status: status || "Active" };
  db.departments.push(dept);
  log(db, `Department "${name}" created`, "Org");
  writeDB(db);
  res.status(201).json(dept);
});

router.put("/departments/:id", requireRole("Admin"), (req, res) => {
  const db = readDB();
  const dept = db.departments.find((d) => d.id === Number(req.params.id));
  if (!dept) return res.status(404).json({ error: "Department not found" });
  Object.assign(dept, req.body);
  log(db, `Department "${dept.name}" updated`, "Org");
  writeDB(db);
  res.json(dept);
});

// ---------- Categories ----------
router.get("/categories", (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

router.post("/categories", requireRole("Admin"), (req, res) => {
  const { name, status, warrantyPeriodMonths } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });
  const db = readDB();
  const cat = { id: nextId(db, "category"), name, status: status || "Active", warrantyPeriodMonths: warrantyPeriodMonths || 0 };
  db.categories.push(cat);
  log(db, `Category "${name}" created`, "Org");
  writeDB(db);
  res.status(201).json(cat);
});

router.put("/categories/:id", requireRole("Admin"), (req, res) => {
  const db = readDB();
  const cat = db.categories.find((c) => c.id === Number(req.params.id));
  if (!cat) return res.status(404).json({ error: "Category not found" });
  Object.assign(cat, req.body);
  writeDB(db);
  res.json(cat);
});

// ---------- Employees ----------
router.get("/employees", (req, res) => {
  const db = readDB();
  res.json(db.users.map(({ password, ...u }) => u));
});

router.post("/employees", requireRole("Admin"), (req, res) => {
  const { name, email, password, department, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email, password required" });
  const db = readDB();
  if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: "Email already in use" });
  }
  const user = { id: nextId(db, "user"), name, email, password: bcrypt.hashSync(password, 8), role: role || "Employee", department: department || null, status: "Active" };
  db.users.push(user);
  log(db, `Employee "${name}" added to ${department || "no department"}`, "Org");
  writeDB(db);
  const { password: _pw, ...pub } = user;
  res.status(201).json(pub);
});

// Admin-only role promotion - the ONLY place roles are assigned
router.patch("/employees/:id/role", requireRole("Admin"), (req, res) => {
  const { role } = req.body;
  const allowed = ["Employee", "DeptHead", "AssetManager", "Admin"];
  if (!allowed.includes(role)) return res.status(400).json({ error: "Invalid role" });
  const db = readDB();
  const user = db.users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Employee not found" });
  user.role = role;
  log(db, `${user.name} promoted to ${role}`, "Org");
  writeDB(db);
  const { password, ...pub } = user;
  res.json(pub);
});

router.patch("/employees/:id/status", requireRole("Admin"), (req, res) => {
  const { status } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "Employee not found" });
  user.status = status;
  writeDB(db);
  const { password, ...pub } = user;
  res.json(pub);
});

module.exports = router;
