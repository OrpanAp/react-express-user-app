import { useState } from "react";
import { api } from "../services/api";

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const result = await api.register({
          userName,
          email,
          password,
        });

        setMessage(result.message);
        setMode("login");
        setPassword("");
      } else {
        const result = await api.login({ email, password });

        setMessage(result.message);
        setPassword("");
        onLogin(result.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function changeMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setMessage("");
    setError("");
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">USER MANAGEMENT</p>

      <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>

      <p className="subtitle">
        {mode === "login"
          ? "Sign in to continue to your dashboard."
          : "Register to get started."}
      </p>

      <form onSubmit={handleSubmit}>
        {mode === "register" && (
          <label>
            Full name
            <input
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              minLength={2}
              maxLength={100}
              autoComplete="name"
              required
            />
          </label>
        )}

        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            maxLength={255}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
          />
        </label>

        {error && <p className="feedback error">{error}</p>}
        {message && <p className="feedback success">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="switch-mode">
        {mode === "login"
          ? "Don't have an account?"
          : "Already have an account?"}{" "}
        <button type="button" className="text-button" onClick={changeMode}>
          {mode === "login" ? "Register" : "Sign in"}
        </button>
      </p>
    </section>
  );
}
