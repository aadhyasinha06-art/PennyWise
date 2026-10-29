import { useEffect, useId, useRef } from "react";
import { X, CircleCheck, CircleAlert, Inbox } from "lucide-react";
import { clampPercent } from "../lib/format";

export function Button({ children, variant = "primary", type = "button", icon: Icon, size, ...rest }) {
  return (
    <button type={type} className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""}`} {...rest}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, danger = false, ...rest }) {
  return (
    <button type="button" className={`icon-button ${danger ? "danger-hover" : ""}`} aria-label={label} title={label} {...rest}>
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}

export function Modal({ title, subtitle, onClose, children }) {
  const titleId = useId();
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="confirm-text">{message}</p>
      <div className="confirm-actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <label className={`field ${error ? "has-error" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error" role="alert">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function ProgressBar({ value, color = "cyan", label }) {
  const percent = clampPercent(value);
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`progress-fill ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "cyan", note }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="muted">{label}</span>
        <span className={`stat-icon tone-${tone}`}><Icon size={18} aria-hidden="true" /></span>
      </div>
      <div className="stat-value">{value}</div>
      {note && <div className="stat-note">{note}</div>}
      <div className={`stat-glow tone-${tone}`} />
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

export function SectionHeading({ kicker, title, children }) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="empty-state">
      <Icon size={30} aria-hidden="true" />
      {title && <h3>{title}</h3>}
      <p>{message}</p>
      {action}
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  const Icon = toast.kind === "error" ? CircleAlert : CircleCheck;
  return (
    <div className={`toast toast-${toast.kind}`} role="status" aria-live="polite">
      <Icon size={16} aria-hidden="true" /> {toast.message}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
