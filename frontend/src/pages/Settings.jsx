import { useState } from "react";
import { Database, Download, LogOut, RotateCcw, Trash2 } from "lucide-react";
import { Badge, Button, Field, PageHeader, SectionHeading } from "../components/ui";
import { useApp } from "../hooks/AppContext";
import { CURRENCIES } from "../lib/constants";

export default function Settings({ data, user, onLogout }) {
  const { notify, confirmAction, caps } = useApp();
  const server = data.mode === "api";
  const [name, setName] = useState(data.profile.name);
  const [currency, setCurrency] = useState(data.profile.currency);
  const [error, setError] = useState("");

  const save = (e) => {
    e.preventDefault();
    if (caps.editName) {
      if (!name.trim()) return setError("Display name cannot be empty.");
      if (name.trim().length > 40) return setError("Keep the name under 40 characters.");
    }
    data.setProfile(caps.editName ? { name: name.trim(), currency } : { currency });
    setError("");
    notify("Preferences saved.");
  };

  const download = () => {
    const blob = new Blob([data.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pennywise-backup.json"; a.click();
    URL.revokeObjectURL(url);
    notify("Backup downloaded.");
  };

  return (
    <div className="page narrow">
      <PageHeader eyebrow="Personalization" title="Settings" subtitle="Make PennyWise feel like yours." />

      <section className="panel">
        <SectionHeading kicker="Profile" title="Preferences" />
        <form className="form-stack" onSubmit={save} noValidate>
          <Field label="Display name" error={error} hint={caps.editName ? undefined : "Your name comes from your account and can't be changed here yet."}><input value={name} maxLength={40} disabled={!caps.editName} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Currency" hint="Changes how amounts are displayed. Stored values are not converted.">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
            </select>
          </Field>
          <Button type="submit">Save preferences</Button>
        </form>
      </section>

      <section className="panel">
        <SectionHeading kicker="Data" title="Storage">{server ? <Badge tone="green"><Database size={12} /> MySQL</Badge> : <Badge tone="amber"><Database size={12} /> Browser only</Badge>}</SectionHeading>
        {server ? (
          <p className="muted body-text">You are signed in as <strong>{user?.email}</strong>. Your transactions, goals and budgets are saved in your MySQL database and are available wherever you log in.</p>
        ) : (
          <p className="muted body-text">
            Demo mode: your data is saved in this browser's localStorage. It is <strong>not</strong> stored in MySQL, and clearing site data or switching browsers will hide it. Download a backup before clearing anything.
          </p>
        )}
        <div className="button-row">
          <Button variant="secondary" icon={Download} onClick={download}>Download backup (JSON)</Button>
          {server && <Button variant="secondary" icon={LogOut} onClick={onLogout}>Log out</Button>}
        </div>
      </section>

      {caps.bulkReset && <section className="panel danger-zone">
        <SectionHeading kicker="Danger zone" title="Manage data" />
        <p className="muted body-text">Every action here asks for confirmation first.</p>
        <div className="button-row">
          {data.hasSampleData && (
            <Button variant="secondary" icon={Trash2} onClick={() => confirmAction({
              title: "Remove sample data?", confirmLabel: "Remove sample data",
              message: "Only the built-in sample transactions and goals will be removed. Everything you added yourself is kept.",
              onConfirm: data.removeSampleData, toast: "Sample data removed.",
            })}>Remove sample data</Button>
          )}
          <Button variant="secondary" icon={RotateCcw} onClick={() => confirmAction({
            title: "Restore sample data?", confirmLabel: "Replace with sample data",
            message: "This REPLACES all your current transactions, goals and budgets with the sample data. Download a backup first if you want to keep them.",
            onConfirm: data.restoreSampleData, toast: "Sample data restored.",
          })}>Restore sample data</Button>
          <Button variant="danger" icon={Trash2} onClick={() => confirmAction({
            title: "Delete all financial data?", confirmLabel: "Delete everything",
            message: "All transactions, goals and budgets will be permanently deleted from this browser. This cannot be undone.",
            onConfirm: data.clearAll, toast: "All financial data cleared.",
          })}>Delete all data</Button>
        </div>
      </section>}
    </div>
  );
}
