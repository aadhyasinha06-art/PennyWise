import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Button, Field, Modal } from "./ui";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from "../lib/constants";
import { today } from "../lib/dates";
import { useApp } from "../hooks/AppContext";

function validate(form) {
  const errors = {};
  const amount = Number(form.amount);
  if (!form.amount || !Number.isFinite(amount) || amount <= 0) errors.amount = "Enter an amount greater than 0.";
  else if (amount > 999999999) errors.amount = "That amount is too large.";
  if (!form.description.trim()) errors.description = "Add a short description.";
  else if (form.description.trim().length > 255) errors.description = "Keep it under 255 characters.";
  if (!form.date) errors.date = "Choose a date.";
  return errors;
}

export default function TransactionModal({ initial, onClose, onSave }) {
  const editing = Boolean(initial);
  const { caps } = useApp();
  const [form, setForm] = useState(() => ({
    type: initial?.type || "expense",
    amount: initial ? String(initial.amount) : "",
    category: initial?.category || "Food",
    description: initial?.description || "",
    date: initial?.date || today(),
    paymentMethod: initial?.paymentMethod || "UPI",
  }));
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  // When editing an older record whose category is not in the list, keep it selectable.
  const options = categories.includes(form.category) ? categories : [form.category, ...categories];

  const switchType = (type) =>
    setForm((p) => ({ ...p, type, category: type === "income" ? "Salary" : "Food" }));

  const submit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSave({
      type: form.type,
      amount: Number(form.amount),
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      paymentMethod: form.paymentMethod,
    });
  };

  return (
    <Modal title={editing ? "Edit transaction" : "New transaction"} subtitle="Record money coming in or going out." onClose={onClose}>
      <form className="form-stack" onSubmit={submit} noValidate>
        <div className="type-switch" role="group" aria-label="Transaction type">
          <button type="button" className={form.type === "income" ? "type-active income" : ""} aria-pressed={form.type === "income"} onClick={() => switchType("income")}>
            <TrendingUp size={15} aria-hidden="true" /> Income
          </button>
          <button type="button" className={form.type === "expense" ? "type-active expense" : ""} aria-pressed={form.type === "expense"} onClick={() => switchType("expense")}>
            <TrendingDown size={15} aria-hidden="true" /> Expense
          </button>
        </div>

        <Field label="Amount" error={errors.amount}>
          <input autoFocus type="number" inputMode="decimal" min="0" step="any" placeholder="e.g. 1500" value={form.amount} onChange={set("amount")} />
        </Field>

        <Field label="Description" error={errors.description}>
          <input placeholder="What was this for?" maxLength={255} value={form.description} onChange={set("description")} />
        </Field>

        <div className={caps.paymentMethod ? "form-grid" : ""}>
          <Field label="Category">
            <select value={form.category} onChange={set("category")}>
              {options.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          {caps.paymentMethod && (
            <Field label="Payment method">
              <select value={form.paymentMethod} onChange={set("paymentMethod")}>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
          )}
        </div>

        <Field label="Date" error={errors.date}>
          <input type="date" value={form.date} onChange={set("date")} />
        </Field>

        <Button type="submit">{editing ? "Save changes" : "Save transaction"}</Button>
      </form>
    </Modal>
  );
}
