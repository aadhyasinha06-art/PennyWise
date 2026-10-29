import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "../lib/constants";
import { getSaveFailed, readStorage, subscribeSaveStatus, writeStorage } from "../lib/storage";
import { makeSampleBudgets, makeSampleGoals, makeSampleTransactions, isSample } from "../lib/sampleData";
import { today } from "../lib/dates";
import { uid } from "../lib/format";

const DEFAULT_PROFILE = { name: "Alex", currency: "₹" };

// Stores everything in this browser's localStorage using the SAME keys as the
// original app, so existing data is picked up automatically.
export function useFinanceData() {
  const [transactions, setTransactions] = useState(() => readStorage(STORAGE_KEYS.transactions, makeSampleTransactions()));
  const [goals, setGoals] = useState(() => readStorage(STORAGE_KEYS.goals, makeSampleGoals()));
  const [budgets, setBudgets] = useState(() => readStorage(STORAGE_KEYS.budgets, makeSampleBudgets()));
  const [profile, setProfileState] = useState(() => ({ ...DEFAULT_PROFILE, ...readStorage(STORAGE_KEYS.profile, {}) }));
  const saveError = useSyncExternalStore(subscribeSaveStatus, getSaveFailed, () => false);

  useEffect(() => { writeStorage(STORAGE_KEYS.transactions, transactions); }, [transactions]);
  useEffect(() => { writeStorage(STORAGE_KEYS.goals, goals); }, [goals]);
  useEffect(() => { writeStorage(STORAGE_KEYS.budgets, budgets); }, [budgets]);
  useEffect(() => { writeStorage(STORAGE_KEYS.profile, profile); }, [profile]);

  /* ---------- transactions ---------- */
  const addTransaction = useCallback((data) => {
    setTransactions((prev) => [{ ...data, id: uid() }, ...prev]);
  }, []);

  const updateTransaction = useCallback((id, data) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, []);

  // Takes the whole transaction (not just its id) so we never run one state
  // update inside another - that would double-apply in React StrictMode.
  const deleteTransaction = useCallback((transaction) => {
    if (transaction.goalId) {
      // A savings contribution is also stored on its goal, so undo it there too.
      setGoals((gs) => gs.map((g) => g.id !== transaction.goalId ? g : {
        ...g,
        saved: Math.max(0, Number(g.saved || 0) - Number(transaction.amount || 0)),
        history: (g.history || []).filter((h) => h.id !== transaction.contributionId),
      }));
    }
    setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
  }, []);

  /* ---------- goals ---------- */
  const addGoal = useCallback((data) => {
    setGoals((prev) => [{ ...data, id: uid(), history: [] }, ...prev]);
  }, []);

  const updateGoal = useCallback((id, data) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));
  }, []);

  const deleteGoal = useCallback((id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setTransactions((prev) => prev.filter((t) => t.goalId !== id));
  }, []);

  const contribute = useCallback((goalId, amount, note) => {
    const contributionId = uid();
    const date = today();
    const text = note?.trim() || "Savings contribution";
    setGoals((prev) => prev.map((g) => g.id !== goalId ? g : {
      ...g,
      saved: Number(g.saved || 0) + amount,
      history: [...(g.history || []), { id: contributionId, amount, note: text, date }],
    }));
    setTransactions((prev) => [{
      id: uid(), type: "expense", amount, category: "Savings", description: text, date,
      goalId, contributionId,
    }, ...prev]);
  }, []);

  /* ---------- budgets (monthly limit per category) ---------- */
  const saveBudget = useCallback((category, amount) => setBudgets((p) => ({ ...p, [category]: amount })), []);
  const deleteBudget = useCallback((category) => setBudgets((p) => { const n = { ...p }; delete n[category]; return n; }), []);

  /* ---------- profile & data management ---------- */
  const setProfile = useCallback((p) => setProfileState((prev) => ({ ...prev, ...p })), []);

  const removeSampleData = useCallback(() => {
    setTransactions((p) => p.filter((t) => !isSample(t)));
    setGoals((p) => p.filter((g) => !isSample(g)));
  }, []);

  const restoreSampleData = useCallback(() => {
    setTransactions(makeSampleTransactions());
    setGoals(makeSampleGoals());
    setBudgets(makeSampleBudgets());
  }, []);

  const clearAll = useCallback(() => { setTransactions([]); setGoals([]); setBudgets({}); }, []);

  const exportData = useCallback(() => JSON.stringify({ exportedAt: new Date().toISOString(), profile, transactions, goals, budgets }, null, 2), [profile, transactions, goals, budgets]);

  const hasSampleData = useMemo(() => transactions.some(isSample) || goals.some(isSample), [transactions, goals]);

  return {
    mode: "local",
    caps: { paymentMethod: true, goalIcons: true, contributionHistory: true, editName: true, bulkReset: true },
    loading: false, error: "", reload: () => {},
    transactions, goals, budgets, profile, saveError, hasSampleData,
    addTransaction, updateTransaction, deleteTransaction,
    addGoal, updateGoal, deleteGoal, contribute,
    saveBudget, deleteBudget,
    setProfile, removeSampleData, restoreSampleData, clearAll, exportData,
  };
}
