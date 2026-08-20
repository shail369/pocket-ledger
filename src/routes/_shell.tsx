import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutGrid, PieChart, Menu, Plus, PiggyBank, FileBarChart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { TransactionForm } from "@/components/app/transaction-form";
import { AccountSelector } from "@/components/app/selectors";

export const Route = createFileRoute("/_shell")({ component: ShellLayout });

const NAV = [
  { to: "/", label: "Home", icon: LayoutGrid },
  { to: "/insights", label: "Insights", icon: PieChart },
  { to: "/more/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/more/reports", label: "Reports", icon: FileBarChart },
  { to: "/more", label: "More", icon: Menu },
] as const;

function ShellLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) return <div className="grid min-h-dvh place-items-center bg-background"><div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),24px)]">
        <div className="flex items-center justify-end border-b border-border/40 pb-2">
          <AccountSelector />
        </div>
      </div>
      <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-28 pt-3"><Outlet /></div>
      <button onClick={() => setAddOpen(true)} aria-label="Add transaction" className="fixed bottom-[88px] z-30 left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform active:scale-95"><Plus className="size-6" /></button>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur"><div className="mx-auto grid max-w-md grid-cols-5 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">{NAV.map((item) => { const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`); return <Link key={item.to} to={item.to} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}><item.icon className="size-5" />{item.label}</Link>; })}</div></nav>
      {addOpen && <TransactionForm open onOpenChange={setAddOpen} />}
    </div>
  );
}
