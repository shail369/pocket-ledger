import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Paisa Expense Manager" },
      { name: "description", content: "Sign in to track your expenses, budgets and savings on Paisa." },
      { property: "og:title", content: "Sign in — Paisa Expense Manager" },
      { property: "og:description", content: "Sign in to track your expenses, budgets and insights on Paisa." },
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

  const submit = async () => {
    const email = emailRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    const name = nameRef.current?.value.trim() ?? "";
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
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="space-y-2 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-primary text-primary-foreground">
          <Wallet className="size-7" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">Paisa</h1>
        <p className="text-sm text-muted-foreground">
          Your accounts, spending, budgets and insights — in one pocket-sized app.
        </p>
      </div>

      <div className="space-y-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/60">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`h-10 rounded-xl text-sm font-semibold ${
                mode === m ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input ref={nameRef} autoComplete="name" className="h-12 rounded-xl text-base" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            className="h-12 rounded-xl text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Password</Label>
          <Input
            ref={passwordRef}
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="h-12 rounded-xl text-base"
          />
        </div>
        <Button
          className="h-12 w-full rounded-xl text-base"
          onClick={submit}
          disabled={busy}
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          New accounts start with clearly marked demo data so you can explore every feature.
        </p>
      </div>
    </main>
  );
}
