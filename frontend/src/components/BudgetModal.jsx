import { useState } from "react";
import { Button, Field, Modal } from "./ui";
import { EXPENSE_CATEGORIES } from "../lib/constants";

// `editingCategory` set => editing that budget's limit; otherwise creating a new one.
export default function BudgetModal({ budgets, editingCategory, onClose, onSave }) {
  const editing = Boolean(editingCategory);
  const available = EXPENSE_CATEGORIES.filter((c) => !(c in budgets));
  const [category, setCategory] = useState(editingCategory || available[0] || "");
  const [amount, setAmount] = useState(editing ? String(budgets[editingCategory]) : "");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!category) return setError("Every category already has a budget.");
    if (!Number.isFinite(value) || value <= 0) return setError("Enter a limit greater than 0.");
    onSave(category, value);
  };

  return (
    <Modal title={editing ? `Edit ${editingCategory} budget` : "Set a budget"} subtitle="Give your spending a monthly limit." onClose={onClose}>
      <form className="form-stack" onSubmit={submit} noValidate>
        {!editing && (
          <Field label="Category">
            {available.length ? (
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {available.map((c) => <option key={c}>{c}</option>)}
              </select>
            ) : (
              <p className="field-hint">Every category already has a budget. Edit an existing one instead.</p>
            )}
          </Field>
        )}
        <Field label="Monthly limit" error={error}>
          <input autoFocus type="number" min="0" step="any" placeholder="5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Button type="submit" disabled={!editing && available.length === 0}>{editing ? "Save changes" : "Save budget"}</Button>
      </form>
    </Modal>
  );
}
