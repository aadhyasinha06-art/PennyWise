import { Pencil, Trash2, TrendingDown, TrendingUp, ArrowLeftRight } from "lucide-react";
import { Badge, EmptyState, IconButton } from "./ui";
import { formatDate } from "../lib/dates";
import { isSample } from "../lib/sampleData";

export default function TransactionList({ items, fmt, onEdit, onDelete, emptyMessage }) {
  if (!items.length) {
    return <EmptyState icon={ArrowLeftRight} message={emptyMessage || "No transactions found."} />;
  }
  return (
    <ul className="transaction-list">
      {items.map((t) => (
        <li className="transaction-row" key={t.id}>
          <div className={`transaction-symbol ${t.type}`}>
            {t.type === "income" ? <TrendingUp size={17} aria-hidden="true" /> : <TrendingDown size={17} aria-hidden="true" />}
          </div>
          <div className="transaction-description">
            <strong>{t.description || t.category}{isSample(t) && <> <Badge tone="violet">Sample</Badge></>}</strong>
            <span>{t.category} · {formatDate(t.date)}{t.paymentMethod ? ` · ${t.paymentMethod}` : ""}</span>
          </div>
          <strong className={`transaction-amount ${t.type === "income" ? "positive" : "negative"}`}>
            {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
          </strong>
          {(onEdit || onDelete) && (
            <div className="row-actions">
              {onEdit && !t.goalId && <IconButton icon={Pencil} label={`Edit ${t.description || t.category}`} onClick={() => onEdit(t)} />}
              {onDelete && <IconButton icon={Trash2} danger label={`Delete ${t.description || t.category}`} onClick={() => onDelete(t)} />}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
