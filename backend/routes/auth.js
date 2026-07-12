const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readDB, writeDB, nextId } = require("../db");
const { SECRET } = require("../middleware/auth");

const router = express.Router();

function sign(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    SECRET,
    { expiresIn: "12h" }
  );
}

function publicUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// Signup always creates a plain Employee account - no self-elevation
router.post("/signup", (req, res) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  const db = readDB();
  if (db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }
  const user = {
    id: nextId(db, "user"),
    name,
    email,
    password: bcrypt.hashSync(password, 8),
    role: "Employee",
    department: department || null,
    status: "Active"
  };
  db.users.push(user);
  writeDB(db);
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user || !bcrypt.compareSync(password || "", user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (user.status !== "Active") {
    return res.status(403).json({ error: "This account has been deactivated" });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

router.get("/me", require("../middleware/auth").requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

module.exports = router;
