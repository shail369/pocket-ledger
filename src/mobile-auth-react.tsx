import "./mobile-auth.css";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function MobileAuthReact() {
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
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { name } } });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      window.location.hash = "#/";
      window.location.reload();
    } catch (error) { console.error(error); }
    finally { setBusy(false); }
  };

  return (
    <main className="mobile-auth-page">
      <div className="mobile-auth-container">
        <div className="mobile-auth-header">
          <img className="mobile-auth-logo" src="/spendify.svg" alt="Spendify" />
          <h1 className="mobile-auth-title">Spendify</h1>
          <p className="mobile-auth-subtitle">Your accounts, spending, budgets and insights in one pocket-sized app.</p>
        </div>
        <form className="mobile-auth-card" autoComplete="off" onSubmit={submit}>
          <div className="mobile-auth-tabs">
            <button type="button" className={`mobile-auth-tab${mode === "signin" ? " active" : ""}`} onClick={() => setMode("signin")}>Sign in</button>
            <button type="button" className={`mobile-auth-tab${mode === "signup" ? " active" : ""}`} onClick={() => setMode("signup")}>Create account</button>
          </div>
          {mode === "signup" && <label className="mobile-auth-field"><span className="mobile-auth-label">Name</span><input className="mobile-auth-input" name="name" type="text" autoComplete="off" /></label>}
          <label className="mobile-auth-field"><span className="mobile-auth-label">Email</span><input className="mobile-auth-input" name="email" type="email" autoComplete="off" /></label>
          <label className="mobile-auth-field"><span className="mobile-auth-label">Password</span><input className="mobile-auth-input" name="password" type="password" autoComplete="off" /></label>
          <button className="mobile-auth-submit" type="submit" disabled={busy}>{mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
      </div>
    </main>
  );
}
