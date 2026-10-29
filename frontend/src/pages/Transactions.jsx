import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button, PageHeader, SectionHeading } from "../components/ui";
import TransactionList from "../components/TransactionList";
import { useApp } from "../hooks/AppContext";
import { ALL_CATEGORIES } from "../lib/constants";
import { summarize } from "../lib/finance";
import { sortNewest } from "../lib/sort";

const SORTS = {
  newest: { label: "Newest first", fn: (items) => sortNewest(items) },
  oldest: { label: "Oldest first", fn: (items) => sortNewest(items).reverse() },
  highest: { label: "Highest amount", fn: (items) => [...items].sort((a, b) => b.amount - a.amount) },
  lowest: { label: "Lowest amount", fn: (items) => [...items].sort((a, b) => a.amount - b.amount) },
};

export default function Transactions({ data, onAddTransaction, onEditTransaction }) {
  const { fmt, confirmDelete } = useApp();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data.transactions.filter((t) =>
      (!q || `${t.description} ${t.category} ${t.paymentMethod || ""}`.toLowerCase().includes(q)) &&
      (type === "all" || t.type === type) &&
      (category === "all" || t.category === category) &&
      (!month || (t.date || "").startsWith(month))
    );
    return SORTS[sort].fn(list);
  }, [data.transactions, query, type, category, month, sort]);

  const totals = summarize(filtered);
  const filtersActive = query || type !== "all" || category !== "all" || month;
  const clear = () => { setQuery(""); setType("all"); setCategory("all"); setMonth(""); };

  return (
    <div className="page">
      <PageHeader eyebrow="Activity center" title="Transactions" subtitle="Every rupee accounted for.">
        <Button icon={Plus} onClick={onAddTransaction}>New transaction</Button>
      </PageHeader>

      <section className="panel">
        <div className="filter-row">
          <div className="search-wrap">
            <Search size={16} aria-hidden="true" />
            <input className="search-input" placeholder="Search description, category, payment…" aria-label="Search transactions" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select aria-label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="month-input" type="month" aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          {filtersActive && <Button variant="secondary" onClick={clear}>Clear filters</Button>}
        </div>

        <SectionHeading kicker="Results" title={`${filtered.length} transaction${filtered.length === 1 ? "" : "s"}`}>
          <div className="result-totals">
            <span className="positive">+{fmt(totals.income)}</span>
            <span className="negative">−{fmt(totals.expenses)}</span>
          </div>
        </SectionHeading>

        <TransactionList
          items={filtered} fmt={fmt} onEdit={onEditTransaction} onDelete={confirmDelete}
          emptyMessage={filtersActive ? "No transactions match these filters." : "No transactions yet. Add your first one."}
        />
      </section>
    </div>
  );
}
