const router = require("express").Router();
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const { z, positiveMoney, dateString } = require("../utils/validation");

router.use(requireAuth);

const createSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: positiveMoney,
  category: z.string().trim().min(1).max(60),
  description: z.string().trim().max(255).optional().default(""),
  transaction_date: dateString
});
const patchSchema = createSchema.partial();

router.get("/", asyncHandler(async (req, res) => {
  const querySchema = z.object({
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().trim().max(60).optional(),
    from: dateString.optional(),
    to: dateString.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  });
  const q = querySchema.parse(req.query);
  const where = ["user_id = ?"];
  const params = [req.user.id];
  if (q.type) { where.push("type = ?"); params.push(q.type); }
  if (q.category) { where.push("category = ?"); params.push(q.category); }
  if (q.from) { where.push("transaction_date >= ?"); params.push(q.from); }
  if (q.to) { where.push("transaction_date <= ?"); params.push(q.to); }

  const [rows] = await pool.execute(
    `SELECT id, type, amount, category, description, transaction_date, created_at
     FROM transactions WHERE ${where.join(" AND ")}
     ORDER BY transaction_date DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, q.limit, q.offset]
  );
  res.json({ transactions: rows, pagination: { limit: q.limit, offset: q.offset } });
}));

router.post("/", asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const [result] = await pool.execute(
    `INSERT INTO transactions (user_id, type, amount, category, description, transaction_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, data.type, data.amount, data.category, data.description, data.transaction_date]
  );
  const [rows] = await pool.execute(
    `SELECT id, type, amount, category, description, transaction_date, created_at
     FROM transactions WHERE id = ? AND user_id = ?`,
    [result.insertId, req.user.id]
  );
  res.status(201).json({ message: "Transaction created.", transaction: rows[0] });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const data = patchSchema.parse(req.body);
  const fields = Object.keys(data);
  if (!fields.length) return res.status(400).json({ message: "Provide at least one field to update." });

  const allowed = ["type", "amount", "category", "description", "transaction_date"];
  const sets = fields.filter(k => allowed.includes(k)).map(k => `${k} = ?`);
  const values = fields.filter(k => allowed.includes(k)).map(k => data[k]);
  if (!sets.length) return res.status(400).json({ message: "No valid fields supplied." });

  const [result] = await pool.execute(
    `UPDATE transactions SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
    [...values, id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Transaction not found." });

  const [rows] = await pool.execute(
    `SELECT id, type, amount, category, description, transaction_date, created_at
     FROM transactions WHERE id = ? AND user_id = ?`,
    [id, req.user.id]
  );
  res.json({ message: "Transaction updated.", transaction: rows[0] });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [result] = await pool.execute(
    "DELETE FROM transactions WHERE id = ? AND user_id = ?",
    [id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Transaction not found." });
  res.json({ message: "Transaction deleted." });
}));

module.exports = router;
