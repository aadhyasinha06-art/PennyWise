import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartColumn, Database, LogOut, RefreshCw, LayoutDashboard, Menu, PiggyBank, Settings as SettingsIcon, ArrowLeftRight, Target, X, TriangleAlert } from "lucide-react";
import { AppContext } from "./hooks/AppContext";
import { makeFormatter } from "./lib/format";
import { Button, ConfirmDialog, IconButton, Toast } from "./components/ui";
import TransactionModal from "./components/TransactionModal";
import GoalModal from "./components/GoalModal";
import BudgetModal from "./components/BudgetModal";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const NAV = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "budgets", label: "Budgets", icon: PiggyBank },
  { id: "goals", label: "Savings goals", icon: Target },
  { id: "reports", label: "Reports", icon: ChartColumn },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Shell({ data, user, onLogout, onSwitchMode }) {
  const [tab, setTab] = useState(() => {
    const fromHash = window.location.hash.replace("#", "");
    return NAV.some((n) => n.id === fromHash) ? fromHash : "dashboard";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [txModal, setTxModal] = useState(null);       // { initial? }
  const [goalModal, setGoalModal] = useState(null);   // { initial? }
  const [budgetModal, setBudgetModal] = useState(null); // { category? }
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const fmt = useMemo(() => makeFormatter(data.profile.currency), [data.profile.currency]);

  const notify = useCallback((message, kind = "success") => {
    setToast({ message, kind });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const goTo = useCallback((id) => {
    setTab(id);
    setMenuOpen(false);
    window.location.hash = id;
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace("#", "");
      if (NAV.some((n) => n.id === id)) setTab(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const confirmAction = useCallback((opts) => setConfirm(opts), []);
  const { deleteTransaction } = data;
  const confirmDelete = useCallback((t) => setConfirm({
    title: "Delete transaction?",
    message: t.goalId
      ? `"${t.description}" is a savings contribution. Deleting it also removes it from its savings goal.`
      : `"${t.description || t.category}" will be removed and your balance and charts will update.`,
    onConfirm: () => deleteTransaction(t),
    toast: "Transaction deleted.",
  }), [deleteTransaction]);

  const caps = data.caps;
  const ctx = useMemo(() => ({ fmt, notify, confirmAction, confirmDelete, caps }), [fmt, notify, confirmAction, confirmDelete, caps]);

  // Server calls can fail, so keep the form open and show the error instead of closing it.
  const attempt = async (fn, successMessage, close) => {
    try { await fn(); notify(successMessage); close(); }
    catch (err) { notify(err.message || "Something went wrong.", "error"); }
  };
  const saveTransaction = (values) => attempt(
    () => (txModal?.initial ? data.updateTransaction(txModal.initial.id, values) : data.addTransaction(values)),
    txModal?.initial ? "Transaction updated." : "Transaction saved.", () => setTxModal(null));
  const saveGoal = (values) => attempt(
    () => (goalModal?.initial ? data.updateGoal(goalModal.initial.id, values) : data.addGoal(values)),
    goalModal?.initial ? "Goal updated." : "Savings goal created.", () => setGoalModal(null));
  const saveBudget = (category, amount) => attempt(
    () => data.saveBudget(category, amount),
    budgetModal?.category ? "Budget updated." : "Budget saved.", () => setBudgetModal(null));

  const openAddTx = () => setTxModal({});
  const openEditTx = (t) => setTxModal({ initial: t });
  const page = {
    dashboard: <Dashboard data={data} onAddTransaction={openAddTx} onEditTransaction={openEditTx} onNavigate={goTo} />,
    transactions: <Transactions data={data} onAddTransaction={openAddTx} onEditTransaction={openEditTx} />,
    budgets: <Budgets data={data} onAddBudget={() => setBudgetModal({})} onEditBudget={(category) => setBudgetModal({ category })} />,
    goals: <Goals data={data} onAddGoal={() => setGoalModal({})} onEditGoal={(initial) => setGoalModal({ initial })} />,
    reports: <Reports data={data} />,
    settings: <Settings data={data} user={user} onLogout={onLogout} onSwitchMode={onSwitchMode} />,
  }[tab];

  const initial = (data.profile.name || "?").trim().charAt(0).toUpperCase();

  return (
    <AppContext.Provider value={ctx}>
      <div className="app-shell">
        <header className="topbar">
          <button className="icon-button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="brand-name">PennyWise</div>
          <div className="avatar" aria-hidden="true">{initial}</div>
        </header>

        {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

        <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
          <div className="brand">
            <div className="brand-mark">P</div>
            <div>
              <div className="brand-name">PennyWise</div>
              <div className="brand-caption">Financial intelligence</div>
            </div>
          </div>
          <nav aria-label="Main">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button key={id} className={`nav-item ${tab === id ? "active" : ""}`} aria-current={tab === id ? "page" : undefined} onClick={() => goTo(id)}>
                <Icon size={18} aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            {data.mode === "api" ? (
              <div className="storage-card ok"><Database size={15} aria-hidden="true" /><div><strong>Saved to MySQL</strong><p>Signed in as {user?.email}</p></div></div>
            ) : (
              <div className="storage-card"><Database size={15} aria-hidden="true" /><div><strong>Demo mode</strong><p>Saved in this browser only, not in MySQL.</p></div></div>
            )}
            <div className="profile-card">
              <div className="avatar" aria-hidden="true">{initial}</div>
              <div><strong>{data.profile.name}</strong><span>Personal account</span></div>
              <IconButton icon={LogOut} label={data.mode === "api" ? "Log out" : "Leave demo mode"} onClick={data.mode === "api" ? onLogout : onSwitchMode} />
            </div>
          </div>
        </aside>

        <main className="main">
          {data.saveError && (
            <div className="banner-error" role="alert"><TriangleAlert size={16} /> Your latest changes could not be saved to this browser (storage may be full or blocked).</div>
          )}
          {data.loading ? (
            <div className="state-screen" role="status"><div className="spinner" /><p>Loading your finances…</p></div>
          ) : data.error ? (
            <div className="state-screen" role="alert"><TriangleAlert size={28} /><h2>Could not load your data</h2><p>{data.error}</p><Button icon={RefreshCw} onClick={data.reload}>Try again</Button></div>
          ) : page}
        </main>

        {txModal && <TransactionModal initial={txModal.initial} onClose={() => setTxModal(null)} onSave={saveTransaction} />}
        {goalModal && <GoalModal initial={goalModal.initial} onClose={() => setGoalModal(null)} onSave={saveGoal} />}
        {budgetModal && <BudgetModal budgets={data.budgets} editingCategory={budgetModal.category} onClose={() => setBudgetModal(null)} onSave={saveBudget} />}
        {confirm && (
          <ConfirmDialog
            title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel}
            onCancel={() => setConfirm(null)}
            onConfirm={async () => {
              const action = confirm;
              setConfirm(null);
              try { await action.onConfirm(); if (action.toast) notify(action.toast); }
              catch (err) { notify(err.message || "Something went wrong.", "error"); }
            }}
          />
        )}
        <Toast toast={toast} />
      </div>
    </AppContext.Provider>
  );
}

