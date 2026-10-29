import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, TriangleAlert, Wallet, TrendingDown } from "lucide-react";
import { Badge, Button, EmptyState, IconButton, PageHeader, ProgressBar, StatCard } from "../components/ui";
import { useApp } from "../hooks/AppContext";
import { budgetStatus, categoryTotals, inMonth } from "../lib/finance";
import { currentMonth } from "../lib/dates";

const COLOR = { ok: "cyan", warn: "amber", over: "pink" };

export default function Budgets({ data, onAddBudget, onEditBudget }) {
  const { fmt, confirmAction, caps } = useApp();
  const [month, setMonth] = useState(currentMonth());
  const spent = useMemo(
    () => Object.fromEntries(categoryTotals(inMonth(data.transactions, month)).map((c) => [c.name, c.value])),
    [data.transactions, month]
  );

  const entries = Object.entries(data.budgets);
  const totalLimit = entries.reduce((s, [, v]) => s + Number(v), 0);
  const totalSpent = entries.reduce((s, [c]) => s + (spent[c] || 0), 0);

  return (
    <div className="page">
      <PageHeader eyebrow="Spending control" title="Budget planner" subtitle={caps.bulkReset ? "Each limit applies every month. Pick a month to see how you did." : "Limits are saved for the current month. Pick a month to compare your spending."}>
        <input className="month-input" type="month" aria-label="Select month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <Button icon={Plus} onClick={onAddBudget}>Create budget</Button>
      </PageHeader>

      <div className="stats-grid two-stats">
        <StatCard label="Total monthly limits" value={fmt(totalLimit)} icon={Wallet} tone="cyan" note={`${entries.length} budgeted categories`} />
        <StatCard label="Spent in budgeted categories" value={fmt(totalSpent)} icon={TrendingDown} tone="violet" note={totalLimit ? `${Math.round((totalSpent / totalLimit) * 100)}% of total limits` : "Selected month"} />
      </div>

      {entries.length === 0 ? (
        <section className="panel"><EmptyState icon={Wallet} title="No budgets yet" message="Set a monthly limit for a category to start tracking." action={<Button onClick={onAddBudget}>Create your first budget</Button>} /></section>
      ) : (
        <div className="card-grid">
          {entries.map(([category, limit]) => {
            const s = spent[category] || 0;
            const st = budgetStatus(s, Number(limit));
            return (
              <div className="budget-card" key={category}>
                <div className="row-between">
                  <h3>{category}</h3>
                  <div className="row-actions">
                    <IconButton icon={Pencil} label={`Edit ${category} budget`} onClick={() => onEditBudget(category)} />
                    <IconButton icon={Trash2} danger label={`Delete ${category} budget`} onClick={() => confirmAction({
                      title: "Delete budget?", message: `The ${category} budget will be removed. Your transactions are not affected.`,
                      onConfirm: () => data.deleteBudget(category), toast: "Budget deleted.",
                    })} />
                  </div>
                </div>
                <div className="budget-spent">{fmt(s)}</div>
                <div className="muted small">of {fmt(limit)} monthly limit</div>
                <ProgressBar value={st.percent} color={COLOR[st.level]} label={`${category} budget used`} />
                <div className="row-between budget-footer">
                  <span className={st.level === "over" ? "negative" : ""}>{st.level === "over" ? `${fmt(-st.remaining)} over budget` : `${fmt(st.remaining)} remaining`}</span>
                  <span>{Math.round(st.percent)}% used</span>
                </div>
                {st.level === "warn" && <Badge tone="amber"><TriangleAlert size={12} /> Nearly used up</Badge>}
                {st.level === "over" && <Badge tone="pink"><TriangleAlert size={12} /> Over budget</Badge>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
