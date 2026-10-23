import { useEffect, useState } from "react";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import { api } from "./services/api";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const result = await api.me();
        setUser(result.user);
      } catch {
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  async function handleLogout() {
    setError("");

    try {
      await api.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (checkingSession) {
    return <main className="app-shell">Checking your session...</main>;
  }

  return (
    <main className="app-shell">
      {error && <p className="feedback error">{error}</p>}

      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <AuthForm onLogin={setUser} />
      )}
    </main>
  );
}
