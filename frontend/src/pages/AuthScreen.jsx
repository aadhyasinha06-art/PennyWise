import { useEffect, useState } from "react";
import { Database, LogIn, UserPlus } from "lucide-react";
import { Button, Field } from "../components/ui";
import * as api from "../lib/api";

export default function AuthScreen({ onAuthenticated, onUseLocal, notice }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [server, setServer] = useState("checking"); // checking | up | down

  useEffect(() => {
    let alive = true;
    api.health().then(() => alive && setServer("up")).catch(() => alive && setServer("down"));
    return () => { alive = false; };
  }, []);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (tab === "register" && form.name.trim().length < 2) found.name = "Enter your name (at least 2 characters).";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = "Enter a valid email address.";
    if (tab === "register" ? form.password.length < 8 : !form.password) found.password = tab === "register" ? "Use at least 8 characters." : "Enter your password.";
    setErrors(found); setFormError("");
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const body = tab === "register"
        ? { name: form.name.trim(), email: form.email.trim(), password: form.password }
        : { email: form.email.trim(), password: form.password };
      const res = tab === "register" ? await api.register(body) : await api.login(body);
      api.saveSession(res.token, res.user);
      onAuthenticated(res.user);
    } catch (err) {
      setFormError(err.message);
      if (err.status === 0) setServer("down");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-mark">P</div>
          <div><div className="brand-name">PennyWise</div><div className="brand-caption">Financial intelligence</div></div>
        </div>

        <div className={`auth-status ${server}`}>
          <i /> {server === "checking" ? "Checking server…" : server === "up" ? "Server connected" : "Server not reachable. Start the backend, or use demo mode."}
        </div>
        {notice && <p className="field-hint auth-notice">{notice}</p>}

        <div className="segmented auth-tabs" role="group" aria-label="Login or register">
          <button type="button" className={tab === "login" ? "active" : ""} onClick={() => { setTab("login"); setErrors({}); setFormError(""); }}>Log in</button>
          <button type="button" className={tab === "register" ? "active" : ""} onClick={() => { setTab("register"); setErrors({}); setFormError(""); }}>Create account</button>
        </div>

        <form className="form-stack" onSubmit={submit} noValidate>
          {tab === "register" && <Field label="Name" error={errors.name}><input autoComplete="name" value={form.name} maxLength={80} onChange={set("name")} /></Field>}
          <Field label="Email" error={errors.email}><input type="email" autoComplete="email" value={form.email} onChange={set("email")} /></Field>
          <Field label="Password" error={errors.password}><input type="password" autoComplete={tab === "register" ? "new-password" : "current-password"} value={form.password} maxLength={72} onChange={set("password")} /></Field>
          {formError && <p className="field-error" role="alert">{formError}</p>}
          <Button type="submit" icon={tab === "login" ? LogIn : UserPlus} disabled={busy}>{busy ? "Please wait…" : tab === "login" ? "Log in" : "Create account"}</Button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <Button variant="secondary" icon={Database} onClick={onUseLocal}>Use demo mode (this browser only)</Button>
        <p className="field-hint auth-notice">Demo mode saves to this browser's localStorage, not to MySQL.</p>
      </div>
    </div>
  );
}
