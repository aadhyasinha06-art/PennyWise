import { useMemo, useState } from "react";
import { Percent, TrendingDown, TrendingUp, Scale } from "lucide-react";
import { EmptyState, PageHeader, SectionHeading, StatCard } from "../components/ui";
import { CategoryDonut, CategoryLegend, IncomeExpenseBars, NetTrendArea } from "../components/Charts";
import { useApp } from "../hooks/AppContext";
import { categoryTotals, monthlySeries, summarize } from "../lib/finance";
import { currentMonth, lastMonths, monthLabel, monthRange } from "../lib/dates";

const PRESETS = [{ id: 3, label: "3 months" }, { id: 6, label: "6 months" }, { id: 12, label: "12 months" }, { id: "custom", label: "Custom" }];

export default function Reports({ data }) {
  const { fmt } = useApp();
  const [preset, setPreset] = useState(6);
  const [from, setFrom] = useState(lastMonths(6)[0]);
  const [to, setTo] = useState(currentMonth());

  const months = useMemo(() => (preset === "custom" ? monthRange(from, to) : lastMonths(preset)), [preset, from, to]);
  const rangeTx = useMemo(() => data.transactions.filter((t) => months.includes((t.date || "").slice(0, 7))), [data.transactions, months]);
  const series = useMemo(() => monthlySeries(data.transactions, months), [data.transactions, months]);
  const summary = summarize(rangeTx);
  const categories = useMemo(() => categoryTotals(rangeTx), [rangeTx]);
  const invalidRange = preset === "custom" && months.length === 0;

  return (
    <div className="page">
      <PageHeader eyebrow="Data intelligence" title="Reports & analytics" subtitle="All figures come from your recorded transactions.">
        <div className="segmented" role="group" aria-label="Date range">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={preset === p.id ? "active" : ""} aria-pressed={preset === p.id} onClick={() => setPreset(p.id)}>{p.label}</button>
          ))}
        </div>
      </PageHeader>

      {preset === "custom" && (
        <section className="panel range-row">
          <label>From <input className="month-input" type="month" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} /></label>
          <label>To <input className="month-input" type="month" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} /></label>
          {invalidRange && <span className="field-error">“From” must not be after “To”.</span>}
          {months.length >= 60 && <span className="field-hint">Showing the first 60 months.</span>}
        </section>
      )}

      <div className="stats-grid">
        <StatCard label="Income" value={fmt(summary.income)} icon={TrendingUp} tone="green" note={`${months.length} month${months.length === 1 ? "" : "s"}`} />
        <StatCard label="Expenses" value={fmt(summary.expenses)} icon={TrendingDown} tone="violet" note="Selected range" />
        <StatCard label="Net cash flow" value={fmt(summary.net)} icon={Scale} tone="cyan" note="Income minus expenses" />
        <StatCard label="Savings rate" value={summary.savingsRate === null ? "—" : `${summary.savingsRate}%`} icon={Percent} tone="blue" note={summary.savingsRate === null ? "No income in range" : "Of income"} />
      </div>

      {rangeTx.length === 0 ? (
        <section className="panel"><EmptyState message={invalidRange ? "Choose a valid date range." : "No transactions in this range."} /></section>
      ) : (
        <>
          <section className="panel">
            <SectionHeading kicker="Cash flow" title="Income vs expenses" />
            <IncomeExpenseBars data={series} fmt={fmt} />
          </section>
          <div className="grid-2">
            <section className="panel">
              <SectionHeading kicker="Trend" title="Net savings per month" />
              <NetTrendArea data={series} fmt={fmt} />
            </section>
            <section className="panel">
              <SectionHeading kicker="Spending" title="Category breakdown" />
              {categories.length ? (
                <><CategoryDonut data={categories} fmt={fmt} height={190} /><CategoryLegend data={categories} fmt={fmt} total={summary.expenses} /></>
              ) : <EmptyState message="No expenses in this range." />}
            </section>
          </div>
          <section className="panel">
            <SectionHeading kicker="Detail" title="Month by month" />
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th></tr></thead>
                <tbody>
                  {series.map((m) => (
                    <tr key={m.key}>
                      <td>{monthLabel(m.key, { month: "long", year: "numeric" })}</td>
                      <td className="positive">{fmt(m.income)}</td>
                      <td className="negative">{fmt(m.expenses)}</td>
                      <td className={m.net >= 0 ? "positive" : "negative"}>{fmt(m.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
