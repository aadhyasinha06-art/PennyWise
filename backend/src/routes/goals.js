const router = require("express").Router();
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const { z, positiveMoney, dateString } = require("../utils/validation");

router.use(requireAuth);
const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  target_amount: positiveMoney,
  current_amount: z.coerce.number().finite().min(0).max(999999999).default(0),
  deadline: dateString.nullable().optional()
}).refine(v => v.current_amount <= v.target_amount, {
  message: "Current amount cannot exceed target amount.",
  path: ["current_amount"]
});

router.get("/", asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, name, target_amount, current_amount, deadline, created_at
     FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ goals: rows.map(g => ({
    ...g,
    remaining: Number(g.target_amount) - Number(g.current_amount),
    progress_percent: Math.min(100, Math.round(Number(g.current_amount) / Number(g.target_amount) * 100))
  })) });
}));

router.post("/", asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const [result] = await pool.execute(
    "INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, data.name, data.target_amount, data.current_amount, data.deadline || null]
  );
  res.status(201).json({ message: "Savings goal created.", goal: { id: result.insertId, ...data } });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const patch = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    target_amount: positiveMoney.optional(),
    current_amount: z.coerce.number().finite().min(0).max(999999999).optional(),
    deadline: dateString.nullable().optional()
  }).strict().parse(req.body);
  if (!Object.keys(patch).length) return res.status(400).json({ message: "Provide at least one field to update." });

  const [found] = await pool.execute(
    "SELECT target_amount, current_amount FROM savings_goals WHERE id = ? AND user_id = ?",
    [id, req.user.id]
  );
  if (!found.length) return res.status(404).json({ message: "Savings goal not found." });
  const target = patch.target_amount ?? Number(found[0].target_amount);
  const current = patch.current_amount ?? Number(found[0].current_amount);
  if (current > target) return res.status(400).json({ message: "Current amount cannot exceed target amount." });

  const sets = Object.keys(patch).map(k => `${k} = ?`).join(", ");
  const [result] = await pool.execute(
    `UPDATE savings_goals SET ${sets} WHERE id = ? AND user_id = ?`,
    [...Object.values(patch), id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Savings goal not found." });
  const [rows] = await pool.execute(
    "SELECT id, name, target_amount, current_amount, deadline, created_at FROM savings_goals WHERE id = ? AND user_id = ?",
    [id, req.user.id]
  );
  res.json({ message: "Savings goal updated.", goal: rows[0] });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [result] = await pool.execute("DELETE FROM savings_goals WHERE id = ? AND user_id = ?", [id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "Savings goal not found." });
  res.json({ message: "Savings goal deleted." });
}));

module.exports = router;
