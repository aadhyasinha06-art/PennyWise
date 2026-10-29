const router = require("express").Router();
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const { z, positiveMoney } = require("../utils/validation");

router.use(requireAuth);
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM format");
const createSchema = z.object({
  category: z.string().trim().min(1).max(60),
  amount: positiveMoney,
  month: monthSchema
});

router.get("/", asyncHandler(async (req, res) => {
  const month = req.query.month ? monthSchema.parse(req.query.month) : new Date().toISOString().slice(0, 7);
  const [rows] = await pool.execute(
    `SELECT b.id, b.category, b.amount, b.month,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS spent
     FROM budgets b
     LEFT JOIN transactions t
       ON t.user_id = b.user_id AND t.category = b.category
       AND DATE_FORMAT(t.transaction_date, '%Y-%m') = b.month
     WHERE b.user_id = ? AND b.month = ?
     GROUP BY b.id, b.category, b.amount, b.month
     ORDER BY b.category`,
    [req.user.id, month]
  );
  res.json({ budgets: rows.map(r => ({ ...r, remaining: Number(r.amount) - Number(r.spent) })) });
}));

router.post("/", asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const [existing] = await pool.execute(
    "SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ?",
    [req.user.id, data.category, data.month]
  );
  if (existing.length) return res.status(409).json({ message: "A budget for this category and month already exists. Edit it instead." });

  const [result] = await pool.execute(
    "INSERT INTO budgets (user_id, category, amount, month) VALUES (?, ?, ?, ?)",
    [req.user.id, data.category, data.amount, data.month]
  );
  res.status(201).json({ message: "Budget created.", budget: { id: result.insertId, ...data, spent: 0, remaining: data.amount } });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const data = z.object({ category: z.string().trim().min(1).max(60).optional(), amount: positiveMoney.optional() }).strict().parse(req.body);
  if (!Object.keys(data).length) return res.status(400).json({ message: "Provide category or amount to update." });
  const sets = Object.keys(data).map(k => `${k} = ?`).join(", ");
  const [result] = await pool.execute(
    `UPDATE budgets SET ${sets} WHERE id = ? AND user_id = ?`,
    [...Object.values(data), id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Budget not found." });
  const [rows] = await pool.execute("SELECT id, category, amount, month FROM budgets WHERE id = ? AND user_id = ?", [id, req.user.id]);
  res.json({ message: "Budget updated.", budget: rows[0] });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [result] = await pool.execute("DELETE FROM budgets WHERE id = ? AND user_id = ?", [id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "Budget not found." });
  res.json({ message: "Budget deleted." });
}));

module.exports = router;
