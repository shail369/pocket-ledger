import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Paisa Expense Manager" },
      { name: "description", content: "Sign in to track your expenses, budgets and savings on Paisa." },
    ],
  }),
  component: AuthPage,
});

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: 48,
  boxSizing: "border-box",
  border: "1px solid var(--input)",
  borderRadius: 12,
  background: "var(--background)",
  color: "var(--foreground)",
  padding: "0 12px",
  fontSize: 16,
  lineHeight: "24px",
  outline: "none",
  WebkitAppearance: "none",
  appearance: "none",
  WebkitUserSelect: "text",
  userSelect: "text",
  touchAction: "manipulation",
};

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) void navigate({ to: "/" });
  }, [session, navigate]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = emailRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    const name = nameRef.current?.value.trim() ?? "";
    if (!email || !password || busy) return;

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
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        width: "100%",
        padding: "32px 24px",
        boxSizing: "border-box",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 448, margin: "0 auto" }}>
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 8px",
              display: "grid",
              placeItems: "center",
              borderRadius: 24,
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            ₹
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Paisa</h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--muted-foreground)" }}>
            Your accounts, spending, budgets and insights in one pocket-sized app.
          </p>
        </div>

        <form
          onSubmit={submit}
          autoComplete="off"
          style={{
            padding: 20,
            borderRadius: 24,
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
              padding: 4,
              marginBottom: 16,
              borderRadius: 16,
              background: "var(--secondary)",
            }}
          >
            <button type="button" onClick={() => setMode("signin")} style={{ height: 40, border: 0, borderRadius: 12, background: mode === "signin" ? "var(--card)" : "transparent", color: "var(--foreground)", fontWeight: 600 }}>
              Sign in
            </button>
            <button type="button" onClick={() => setMode("signup")} style={{ height: 40, border: 0, borderRadius: 12, background: mode === "signup" ? "var(--card)" : "transparent", color: "var(--foreground)", fontWeight: 600 }}>
              Create account
            </button>
          </div>

          {mode === "signup" && (
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Name</span>
              <input ref={nameRef} autoComplete="off" name="paisa-name" type="text" style={fieldStyle} />
            </label>
          )}

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Email</span>
            <input ref={emailRef} type="email" autoComplete="off" name="paisa-email" style={fieldStyle} />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Password</span>
            <input ref={passwordRef} type="password" autoComplete="off" name="paisa-password" style={fieldStyle} />
          </label>

          <button type="submit" disabled={busy} style={{ width: "100%", height: 48, border: 0, borderRadius: 12, background: "var(--primary)", color: "var(--primary-foreground)", fontSize: 16, fontWeight: 600 }}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
