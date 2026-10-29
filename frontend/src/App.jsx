import { useCallback, useEffect, useState } from "react";
import Shell from "./Shell";
import AuthScreen from "./pages/AuthScreen";
import { useApiData } from "./hooks/useApiData";
import { useFinanceData } from "./hooks/useFinanceData";
import * as api from "./lib/api";
import { readStorage, writeStorage } from "./lib/storage";

const MODE_KEY = "pw_mode";

// Two completely separate workspaces, so demo data and MySQL data never mix.
function LocalWorkspace({ onSwitchMode }) {
  const data = useFinanceData();
  return <Shell data={data} user={null} onLogout={onSwitchMode} onSwitchMode={onSwitchMode} />;
}
function ApiWorkspace({ user, onLogout }) {
  const data = useApiData(user);
  return <Shell data={data} user={user} onLogout={onLogout} onSwitchMode={onLogout} />;
}

export default function App() {
  const [session, setSession] = useState(() => {
    const user = api.getSavedUser();
    if (user) return { mode: "api", user };
    return readStorage(MODE_KEY, null) === "local" ? { mode: "local" } : null;
  });
  const [notice, setNotice] = useState("");

  const logout = useCallback((message = "") => {
    api.clearSession();
    writeStorage(MODE_KEY, null);
    setNotice(typeof message === "string" ? message : "");
    setSession(null);
  }, []);

  // If the server says our login expired, go back to the login screen.
  useEffect(() => {
    api.setUnauthorizedHandler(() => logout("Your session expired. Please log in again."));
    return () => api.setUnauthorizedHandler(null);
  }, [logout]);

  if (!session) {
    return (
      <AuthScreen
        notice={notice}
        onAuthenticated={(user) => { writeStorage(MODE_KEY, "api"); setNotice(""); setSession({ mode: "api", user }); }}
        onUseLocal={() => { writeStorage(MODE_KEY, "local"); setNotice(""); setSession({ mode: "local" }); }}
      />
    );
  }
  if (session.mode === "api") return <ApiWorkspace key={session.user.id} user={session.user} onLogout={() => logout()} />;
  return <LocalWorkspace onSwitchMode={() => logout()} />;
}
