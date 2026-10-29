import { useMemo, useState } from "react";
import { PiggyBank, Plus, TrendingDown, TrendingUp, TriangleAlert, Wallet, Sparkles } from "lucide-react";
import { Badge, Button, EmptyState, PageHeader, ProgressBar, SectionHeading, StatCard } from "../components/ui";
import { CategoryDonut, CategoryLegend, IncomeExpenseBars } from "../components/Charts";
import TransactionList from "../components/TransactionList";
import { useApp } from "../hooks/AppContext";
import { budgetStatus, categoryTotals, goalProgress, inMonth, monthlySeries, summarize, totalBalance } from "../lib/finance";
import { currentMonth, lastMonths } from "../lib/dates";
import { sortNewest } from "../lib/sort";

export default function Dashboard({ data, onAddTransaction, onEditTransaction, onNavigate }) {
  const { fmt, confirmDelete } = useApp();
  const { transactions, goals, budgets, profile } = data;
  const [month, setMonth] = useState(currentMonth());

  const monthTx = useMemo(() => inMonth(transactions, month), [transactions, month]);
  const summary = useMemo(() => summarize(monthTx), [monthTx]);
  const balance = useMemo(() => totalBalance(transactions), [transactions]);
  const categories = useMemo(() => categoryTotals(monthTx), [monthTx]);
  const trend = useMemo(() => monthlySeries(transactions, lastMonths(6, month)), [transactions, month]);
  const recent = useMemo(() => sortNewest(transactions).slice(0, 5), [transactions]);

  const totalSaved = goals.reduce((s, g) => s + (Number(g.saved) || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + (Number(g.target) || 0), 0);

  const spentByCategory = Object.fromEntries(categories.map((c) => [c.name, c.value]));
  const alerts = Object.entries(budgets)
    .map(([category, limit]) => ({ category, limit, ...budgetStatus(spentByCategory[category] || 0, limit) }))
    .filter((b) => b.level !== "ok");

  let insight = "Add transactions to start seeing insights for this month.";
  if (summary.income || summary.expenses) {
    insight = summary.net >= 0
      ? `You saved ${fmt(summary.net)} this month${summary.savingsRate !== null ? ` (${summary.savingsRate}% of income)` : ""}.`
      : `You spent ${fmt(-summary.net)} more than you earned this month.`;
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Financial command center" title={<>Welcome back, <span className="gradient-text">{profile.name || "there"}</span></>} subtitle="Here is your financial snapshot.">
        <input className="month-input" type="month" aria-label="Select month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <Button icon={Plus} onClick={onAddTransaction}>New transaction</Button>
      </PageHeader>

      <div className="stats-grid">
        <StatCard label="Total balance" value={fmt(balance)} icon={Wallet} tone="cyan" note="All recorded transactions" />
        <StatCard label="Income" value={fmt(summary.income)} icon={TrendingUp} tone="green" note="Selected month" />
        <StatCard label="Expenses" value={fmt(summary.expenses)} icon={TrendingDown} tone="violet" note="Selected month" />
        <StatCard label="Savings goals" value={fmt(totalSaved)} icon={PiggyBank} tone="blue" note={totalTarget ? `of ${fmt(totalTarget)} target` : "No goals yet"} />
      </div>

      <div className="grid-2">
        <section className="panel">
          <SectionHeading kicker="Trends" title="Last 6 months"><Badge>Ending {month}</Badge></SectionHeading>
          {transactions.length ? <IncomeExpenseBars data={trend} fmt={fmt} /> : <EmptyState message="Add transactions to see your trend." />}
          <div className="insight-box"><Sparkles size={18} aria-hidden="true" /><p>{insight}</p></div>
        </section>

        <section className="panel">
          <SectionHeading kicker="Breakdown" title="Where it goes"><Badge>{categories.length} categories</Badge></SectionHeading>
          {categories.length ? (
            <>
              <CategoryDonut data={categories} fmt={fmt} height={190} />
              <CategoryLegend data={categories.slice(0, 5)} fmt={fmt} total={summary.expenses} />
            </>
          ) : <EmptyState message="No spending recorded for this month." />}
        </section>
      </div>

      {alerts.length > 0 && (
        <section className="panel">
          <SectionHeading kicker="Budgets" title="Needs attention" />
          <ul className="alert-list">
            {alerts.map((a) => (
              <li key={a.category} className={`alert-row ${a.level}`}>
                <TriangleAlert size={16} aria-hidden="true" />
                <span><strong>{a.category}</strong> {a.level === "over" ? `is ${fmt(-a.remaining)} over budget` : `is ${Math.round(a.percent)}% used`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid-2">
        <section className="panel">
          <SectionHeading kicker="Latest activity" title="Recent transactions">
            <Button variant="secondary" size="sm" onClick={() => onNavigate("transactions")}>View all</Button>
          </SectionHeading>
          <TransactionList items={recent} fmt={fmt} onEdit={onEditTransaction} onDelete={confirmDelete} emptyMessage="No transactions yet. Add your first one." />
        </section>

        <section className="panel">
          <SectionHeading kicker="Your future" title="Savings goals">
            <Button variant="secondary" size="sm" onClick={() => onNavigate("goals")}>View goals</Button>
          </SectionHeading>
          {goals.length === 0 ? <EmptyState icon={PiggyBank} message="Create a goal to start tracking your savings." /> : (
            <div className="mini-goals">
              {goals.slice(0, 3).map((g) => {
                const p = goalProgress(g);
                return (
                  <div className="mini-goal" key={g.id}>
                    <span className="mini-goal-icon">{g.icon}</span>
                    <div className="mini-goal-content">
                      <div className="row-between"><strong>{g.name}</strong><span>{Math.round(p.percent)}%</span></div>
                      <ProgressBar value={p.percent} color="green" label={`${g.name} progress`} />
                      <small>{fmt(p.saved)} of {fmt(p.target)}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
