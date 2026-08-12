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

  const inputClass =
    "block h-12 w-full box-border appearance-none rounded-xl border border-input bg-background px-3 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring";

  return (
    <main className="min-h-screen w-full px-6 py-8 sm:mx-auto sm:flex sm:min-h-dvh sm:max-w-md sm:flex-col sm:justify-center">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-primary text-primary-foreground">
            <span className="text-xl font-bold">₹</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Paisa</h1>
          <p className="text-sm text-muted-foreground">
            Your accounts, spending, budgets and insights — in one pocket-sized app.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`h-10 rounded-xl text-sm font-semibold ${mode === "signin" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`h-10 rounded-xl text-sm font-semibold ${mode === "signup" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              Create account
            </button>
          </div>

          {mode === "signup" && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium">Name</span>
              <input ref={nameRef} autoComplete="name" className={inputClass} />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Email</span>
            <input ref={emailRef} type="email" inputMode="email" autoComplete="email" className={inputClass} />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium">Password</span>
            <input
              ref={passwordRef}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            New accounts start with clearly marked demo data so you can explore every feature.
          </p>
        </form>
      </div>
    </main>
  );
}
