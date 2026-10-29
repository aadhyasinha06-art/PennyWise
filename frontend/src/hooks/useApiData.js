import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as api from "../lib/api";
import { readStorage, writeStorage } from "../lib/storage";
import { currentMonth, today } from "../lib/dates";

const CURRENCY_KEY = "pw_currency";
const day = (v) => (v ? String(v).slice(0, 10) : "");

// The server stores snake_case fields; the UI uses the shapes below.
const toTx = (r) => ({ id: String(r.id), type: r.type, amount: Number(r.amount), category: r.category, description: r.description || "", date: day(r.transaction_date) });
const toGoal = (r) => ({ id: String(r.id), name: r.name, icon: "🎯", target: Number(r.target_amount), saved: Number(r.current_amount), deadline: day(r.deadline), history: null });

// Same interface as useFinanceData, but every change goes to MySQL through the API.
export function useApiData(user) {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState(() => readStorage(CURRENCY_KEY, "₹"));
  const budgetIds = useRef({});

  const refreshTransactions = useCallback(async () => {
    const rows = await api.listTransactions();
    setTransactions(rows.map(toTx));
  }, []);
  const refreshGoals = useCallback(async () => {
    const { goals: rows } = await api.listGoals();
    setGoals(rows.map(toGoal));
  }, []);
  const applyBudgets = useCallback((rows) => {
    budgetIds.current = Object.fromEntries(rows.map((b) => [b.category, b.id]));
    setBudgets(Object.fromEntries(rows.map((b) => [b.category, Number(b.amount)])));
  }, []);
  const refreshBudgets = useCallback(async () => {
    const { budgets: rows } = await api.listBudgets(currentMonth());
    applyBudgets(rows);
  }, [applyBudgets]);

  const fetchAll = useCallback(() => Promise.all([api.listTransactions(), api.listGoals(), api.listBudgets(currentMonth())]), []);
  const applyAll = useCallback(([tx, g, b]) => {
    setTransactions(tx.map(toTx));
    setGoals(g.goals.map(toGoal));
    applyBudgets(b.budgets);
    setError("");
    setLoading(false);
  }, [applyBudgets]);

  // First load. State is only set inside promise callbacks, never synchronously.
  useEffect(() => {
    let alive = true;
    fetchAll()
      .then((res) => { if (alive) applyAll(res); })
      .catch((e) => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, [fetchAll, applyAll]);

  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    return fetchAll().then(applyAll).catch((e) => { setError(e.message); setLoading(false); });
  }, [fetchAll, applyAll]);

  const toBody = (d) => ({ type: d.type, amount: d.amount, category: d.category, description: d.description, transaction_date: d.date });

  const addTransaction = useCallback(async (d) => { await api.createTransaction(toBody(d)); await refreshTransactions(); }, [refreshTransactions]);
  const updateTransaction = useCallback(async (id, d) => { await api.updateTransaction(id, toBody(d)); await refreshTransactions(); }, [refreshTransactions]);
  const deleteTransaction = useCallback(async (t) => { await api.deleteTransaction(t.id); await refreshTransactions(); }, [refreshTransactions]);

  const goalBody = (d) => ({ name: d.name, target_amount: d.target, current_amount: d.saved, deadline: d.deadline || null });
  const addGoal = useCallback(async (d) => { await api.createGoal(goalBody(d)); await refreshGoals(); }, [refreshGoals]);
  const updateGoal = useCallback(async (id, d) => { await api.updateGoal(id, goalBody(d)); await refreshGoals(); }, [refreshGoals]);
  const deleteGoal = useCallback(async (id) => { await api.deleteGoal(id); await refreshGoals(); }, [refreshGoals]);

  // The server has no contributions table, so a contribution raises the goal's saved
  // amount and also records a "Savings" expense, the same as local mode.
  const contribute = useCallback(async (goalId, amount, note) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) throw new Error("Goal not found. Please refresh.");
    await api.updateGoal(goalId, { current_amount: goal.saved + amount });
    await api.createTransaction({ type: "expense", amount, category: "Savings", description: note?.trim() || "Savings contribution", transaction_date: today() });
    await Promise.all([refreshGoals(), refreshTransactions()]);
  }, [goals, refreshGoals, refreshTransactions]);

  // Budgets on the server belong to one month; these are for the current month.
  const saveBudget = useCallback(async (category, amount) => {
    const id = budgetIds.current[category];
    if (id) await api.updateBudget(id, { amount });
    else await api.createBudget({ category, amount, month: currentMonth() });
    await refreshBudgets();
  }, [refreshBudgets]);
  const deleteBudget = useCallback(async (category) => {
    await api.deleteBudget(budgetIds.current[category]);
    await refreshBudgets();
  }, [refreshBudgets]);

  const setProfile = useCallback((p) => {
    if (p.currency) { setCurrency(p.currency); writeStorage(CURRENCY_KEY, p.currency); }
  }, []);

  const exportData = useCallback(() => JSON.stringify({ exportedAt: new Date().toISOString(), user, transactions, goals, budgets }, null, 2), [user, transactions, goals, budgets]);

  const profile = useMemo(() => ({ name: user.name, currency }), [user.name, currency]);

  return {
    mode: "api",
    caps: { paymentMethod: false, goalIcons: false, contributionHistory: false, editName: false, bulkReset: false },
    transactions, goals, budgets, profile, saveError: false, hasSampleData: false,
    loading, error, reload,
    addTransaction, updateTransaction, deleteTransaction,
    addGoal, updateGoal, deleteGoal, contribute,
    saveBudget, deleteBudget, setProfile, exportData,
  };
}
