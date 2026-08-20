import "./auth-screen.css";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        window.location.hash = "#/";
        window.location.reload();
      }
    });
    return () => { active = false; };
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();
    if (!email || !password) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      window.location.hash = "#/";
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-screen-container">
        <div className="auth-screen-header">
          <img className="auth-screen-logo" src="/spendify.svg" alt="Spendify" />
          <h1 className="auth-screen-title">Spendify</h1>
          <p className="auth-screen-subtitle">
            Your accounts, spending, budgets and insights in one pocket-sized app.
          </p>
        </div>
        <form className="auth-screen-card" autoComplete="off" onSubmit={submit}>
          <div className="auth-screen-tabs">
            <button type="button" className={`auth-screen-tab${mode === "signin" ? " active" : ""}`} onClick={() => setMode("signin")}>
              Sign in
            </button>
            <button type="button" className={`auth-screen-tab${mode === "signup" ? " active" : ""}`} onClick={() => setMode("signup")}>
              Create account
            </button>
          </div>
          {mode === "signup" && (
            <label className="auth-screen-field">
              <span className="auth-screen-label">Name</span>
              <input className="auth-screen-input" name="name" type="text" autoComplete="off" />
            </label>
          )}
          <label className="auth-screen-field">
            <span className="auth-screen-label">Email</span>
            <input className="auth-screen-input" name="email" type="email" autoComplete="off" />
          </label>
          <label className="auth-screen-field">
            <span className="auth-screen-label">Password</span>
            <input className="auth-screen-input" name="password" type="password" autoComplete="off" />
          </label>
          <button className="auth-screen-submit" type="submit" disabled={busy}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
