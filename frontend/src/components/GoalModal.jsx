import { useState } from "react";
import { Button, Field, Modal } from "./ui";
import { GOAL_ICONS } from "../lib/constants";
import { useApp } from "../hooks/AppContext";

export default function GoalModal({ initial, onClose, onSave }) {
  const editing = Boolean(initial);
  const { caps } = useApp();
  const [form, setForm] = useState(() => ({
    name: initial?.name || "",
    icon: initial?.icon || "🎯",
    target: initial ? String(initial.target) : "",
    saved: initial ? String(initial.saved ?? 0) : "0",
    deadline: initial?.deadline || "",
  }));
  const [errors, setErrors] = useState({});
  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const found = {};
    const target = Number(form.target);
    const saved = Number(form.saved || 0);
    if (!form.name.trim()) found.name = "Give your goal a name.";
    if (!Number.isFinite(target) || target <= 0) found.target = "Target must be greater than 0.";
    if (!Number.isFinite(saved) || saved < 0) found.saved = "Saved amount cannot be negative.";
    else if (!found.target && saved > target) found.saved = "Saved amount cannot be more than the target.";
    setErrors(found);
    if (Object.keys(found).length) return;
    onSave({ name: form.name.trim(), icon: form.icon, target, saved, deadline: form.deadline });
  };

  return (
    <Modal title={editing ? "Edit savings goal" : "Create a savings goal"} subtitle="Turn a future plan into a real target." onClose={onClose}>
      <form className="form-stack" onSubmit={submit} noValidate>
        <Field label="Goal name" error={errors.name}>
          <input autoFocus placeholder="e.g. New laptop" maxLength={100} value={form.name} onChange={set("name")} />
        </Field>
        {caps.goalIcons && (
          <Field label="Icon">
            <select value={form.icon} onChange={set("icon")}>
              {GOAL_ICONS.map((i) => <option key={i.value} value={i.value}>{i.value} {i.label}</option>)}
            </select>
          </Field>
        )}
        <div className="form-grid">
          <Field label="Target amount" error={errors.target}>
            <input type="number" min="0" step="any" placeholder="50000" value={form.target} onChange={set("target")} />
          </Field>
          <Field label="Already saved" error={errors.saved} hint={editing ? "Contributions you add later are tracked separately." : undefined}>
            <input type="number" min="0" step="any" value={form.saved} onChange={set("saved")} />
          </Field>
        </div>
        <Field label="Target date (optional)">
          <input type="date" value={form.deadline} onChange={set("deadline")} />
        </Field>
        <Button type="submit">{editing ? "Save changes" : "Create goal"}</Button>
      </form>
    </Modal>
  );
}
