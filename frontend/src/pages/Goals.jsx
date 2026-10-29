import { useState } from "react";
import { Pencil, PiggyBank, Plus, Target, Trash2, CircleCheck } from "lucide-react";
import { Button, EmptyState, IconButton, PageHeader, ProgressBar, StatCard } from "../components/ui";
import { useApp } from "../hooks/AppContext";
import { goalProgress } from "../lib/finance";
import { formatDate, today } from "../lib/dates";

function GoalCard({ goal, onEdit, onDelete, onContribute }) {
  const { fmt, caps } = useApp();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const p = goalProgress(goal);
  const history = Array.isArray(goal.history) ? goal.history : [];
  const overdue = goal.deadline && !p.done && goal.deadline < today();

  const add = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError("Enter an amount greater than 0.");
    if (value > p.remaining) return setError(`Only ${fmt(p.remaining)} left to reach this goal.`);
    try {
      await onContribute(goal.id, value, note);
      setAmount(""); setNote(""); setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="goal-card">
      <div className="row-between">
        <div className="goal-icon">{goal.icon || "🎯"}</div>
        <div className="row-actions">
          <IconButton icon={Pencil} label={`Edit ${goal.name}`} onClick={() => onEdit(goal)} />
          <IconButton icon={Trash2} danger label={`Delete ${goal.name}`} onClick={() => onDelete(goal)} />
        </div>
      </div>
      <h3>{goal.name}</h3>
      <p className={`muted small ${overdue ? "negative" : ""}`}>
        {goal.deadline ? `${overdue ? "Past target date" : "Target date"}: ${formatDate(goal.deadline)}` : "No deadline set"}
      </p>

      <div className="row-between goal-numbers"><strong>{fmt(p.saved)}</strong><span>of {fmt(p.target)}</span></div>
      <ProgressBar value={p.percent} color="green" label={`${goal.name} progress`} />
      <div className="row-between goal-bottom"><span>{Math.round(p.percent)}% complete</span><span>{fmt(p.remaining)} left</span></div>
      {p.done && <div className="goal-complete"><CircleCheck size={14} /> Goal achieved!</div>}

      {!p.done && (
        <div className="goal-contribute">
          <input type="number" min="0" step="any" placeholder="Amount" aria-label={`Contribution to ${goal.name}`} value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} />
          <input placeholder="Optional note" aria-label="Contribution note" value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <span className="field-error" role="alert">{error}</span>}
          <Button onClick={add} icon={Plus}>Add savings</Button>
        </div>
      )}

      {caps.contributionHistory && <div className="history-section">
        <div className="row-between history-heading"><span>Contribution history</span><span>{history.length} entries</span></div>
        {history.length === 0 ? <p className="empty-small">Your contributions will appear here.</p> : (
          <ul className="history-list">
            {[...history].reverse().map((h) => (
              <li className="history-row" key={h.id}>
                <div className="history-info"><strong>{h.note || "Savings contribution"}</strong><span>{formatDate(h.date)}</span></div>
                <strong className="positive">+{fmt(h.amount)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>}
    </div>
  );
}

export default function Goals({ data, onAddGoal, onEditGoal }) {
  const { fmt, confirmAction, notify, caps } = useApp();
  const { goals } = data;
  const saved = goals.reduce((s, g) => s + (Number(g.saved) || 0), 0);
  const target = goals.reduce((s, g) => s + (Number(g.target) || 0), 0);

  return (
    <div className="page">
      <PageHeader eyebrow="Build your future" title="Savings goals" subtitle="Every contribution gets you closer.">
        <Button icon={Plus} onClick={onAddGoal}>Create goal</Button>
      </PageHeader>

      <div className="stats-grid two-stats">
        <StatCard label="Total saved" value={fmt(saved)} icon={PiggyBank} tone="green" note="Across all goals" />
        <StatCard label="Total target" value={fmt(target)} icon={Target} tone="violet" note={`${goals.length} goal${goals.length === 1 ? "" : "s"} · ${target ? Math.round((saved / target) * 100) : 0}% overall`} />
      </div>

      {goals.length === 0 ? (
        <section className="panel"><EmptyState icon={Target} title="No goals yet" message="Give your savings a purpose." action={<Button onClick={onAddGoal}>Create your first goal</Button>} /></section>
      ) : (
        <div className="card-grid two">
          {goals.map((g) => (
            <GoalCard
              key={g.id} goal={g} onEdit={onEditGoal}
              onContribute={async (id, amt, note) => { await data.contribute(id, amt, note); notify("Savings contribution added."); }}
              onDelete={(goal) => confirmAction({
                title: "Delete savings goal?",
                message: caps.contributionHistory
                  ? `"${goal.name}" and its contribution history will be removed. The matching "Savings" transactions will also be deleted from your transaction list.`
                  : `"${goal.name}" will be deleted. Savings transactions you already recorded stay in your transaction list.`,
                onConfirm: () => data.deleteGoal(goal.id), toast: "Goal deleted.",
              })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
