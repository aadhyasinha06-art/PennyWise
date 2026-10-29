const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const { z } = require("../utils/validation");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(190).transform(v => v.toLowerCase()),
  password: z.string().min(8).max(72)
});
const loginSchema = z.object({
  email: z.string().trim().email().max(190).transform(v => v.toLowerCase()),
  password: z.string().min(1).max(72)
});

function createToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    const error = new Error("JWT_SECRET must be at least 32 characters. Configure it in .env.");
    error.status = 500;
    throw error;
  }
  return jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    { subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN || "1d", algorithm: "HS256" }
  );
}

router.post("/register", asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [data.email]);
  if (existing.length) return res.status(409).json({ message: "An account with this email already exists." });

  const rounds = Math.min(14, Math.max(10, Number(process.env.BCRYPT_ROUNDS || 12)));
  const passwordHash = await bcrypt.hash(data.password, rounds);
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [data.name, data.email, passwordHash]
  );
  const user = { id: result.insertId, name: data.name, email: data.email };
  res.status(201).json({ message: "Account created successfully.", token: createToken(user), user });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const [rows] = await pool.execute(
    "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [data.email]
  );
  if (!rows.length || !(await bcrypt.compare(data.password, rows[0].password_hash))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email };
  res.json({ message: "Login successful.", token: createToken(user), user });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1",
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ message: "User account not found." });
  res.json({ user: rows[0] });
}));

module.exports = router;
