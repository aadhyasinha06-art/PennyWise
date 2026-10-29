const router = require("express").Router();
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const { z } = require("../utils/validation");

router.use(requireAuth);

router.get("/summary", asyncHandler(async (req, res) => {
  const month = req.query.month
    ? z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(req.query.month)
    : new Date().toISOString().slice(0, 7);

  const [totals] = await pool.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
     FROM transactions WHERE user_id = ?`,
    [req.user.id]
  );
  const [monthly] = await pool.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
     FROM transactions
     WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
    [req.user.id, month]
  );
  const [categories] = await pool.execute(
    `SELECT category, SUM(amount) AS total
     FROM transactions
     WHERE user_id = ? AND type = 'expense'
       AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
     GROUP BY category ORDER BY total DESC`,
    [req.user.id, month]
  );
  const [recent] = await pool.execute(
    `SELECT id, type, amount, category, description, transaction_date
     FROM transactions WHERE user_id = ?
     ORDER BY transaction_date DESC, id DESC LIMIT 5`,
    [req.user.id]
  );

  const totalIncome = Number(totals[0].total_income);
  const totalExpenses = Number(totals[0].total_expenses);
  const monthlyIncome = Number(monthly[0].income);
  const monthlyExpenses = Number(monthly[0].expenses);

  res.json({
    month,
    all_time: {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      balance: totalIncome - totalExpenses
    },
    monthly: {
      income: monthlyIncome,
      expenses: monthlyExpenses,
      net: monthlyIncome - monthlyExpenses,
      savings_rate: monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 10000) / 100 : 0
    },
    expense_by_category: categories.map(c => ({ category: c.category, total: Number(c.total) })),
    recent_transactions: recent
  });
}));

module.exports = router;
