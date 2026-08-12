import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Wallet, ArrowLeftRight, PieChart, Menu, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAppData, useInvalidateData } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { TransactionForm } from "@/components/app/transaction-form";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

const NAV = [
  { to: "/", label: "Home", icon: LayoutGrid },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { to: "/insights", label: "Insights", icon: PieChart },
  { to: "/more", label: "More", icon: Menu },
] as const;

function ShellLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useAppData();
  const invalidate = useInvalidateData();
  const [addOpen, setAddOpen] = useState(false);
  const seeded = useRef(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!session || isLoading || seeded.current) return;
    if (data.accounts.length === 0) {
      seeded.current = true;
      void supabase.rpc("seed_demo_data").then(() => invalidate());
    }
  }, [session, isLoading, data.accounts.length, invalidate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-28 pt-5">
        <Outlet />
      </div>

      <button
        onClick={() => setAddOpen(true)}
        aria-label="Add transaction"
        className="fixed bottom-[76px] left-1/2 z-30 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95"
      >
        <Plus className="size-7" />
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <TransactionForm open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}