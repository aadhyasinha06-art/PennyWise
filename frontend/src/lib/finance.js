// All money maths lives here so every page shows the same numbers.
import { lastMonths, monthLabel } from "./dates";

const amountOf = (t) => Number(t.amount) || 0;
const sum = (items) => items.reduce((s, t) => s + amountOf(t), 0);

export const inMonth = (transactions, month) =>
  transactions.filter((t) => (t.date || "").startsWith(month));

export const totalBalance = (transactions) =>
  transactions.reduce((s, t) => s + (t.type === "income" ? 1 : -1) * amountOf(t), 0);

export function summarize(transactions) {
  const income = sum(transactions.filter((t) => t.type === "income"));
  const expenses = sum(transactions.filter((t) => t.type === "expense"));
  const net = income - expenses;
  return { income, expenses, net, savingsRate: income > 0 ? Math.round((net / income) * 100) : null };
}

// Expense totals per category, biggest first. Returns [{ name, value }].
export function categoryTotals(transactions) {
  const map = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    map[t.category] = (map[t.category] || 0) + amountOf(t);
  });
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

// Income vs expenses for each month key. Returns [{ key, label, income, expenses, net }].
export function monthlySeries(transactions, months) {
  return months.map((key) => {
    const s = summarize(inMonth(transactions, key));
    return { key, label: monthLabel(key, { month: "short", year: months.length > 12 ? "2-digit" : undefined }), income: s.income, expenses: s.expenses, net: s.net };
  });
}

export const recentMonths = (count, endMonth) => lastMonths(count, endMonth);

export function goalProgress(goal) {
  const target = Number(goal.target) || 0;
  const saved = Number(goal.saved) || 0;
  const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  return { target, saved, percent, remaining: Math.max(0, target - saved), done: target > 0 && saved >= target };
}

export function budgetStatus(spent, limit) {
  const percent = limit > 0 ? (spent / limit) * 100 : 0;
  let level = "ok";
  if (percent > 100) level = "over";
  else if (percent >= 80) level = "warn";
  return { percent, level, remaining: limit - spent };
}
