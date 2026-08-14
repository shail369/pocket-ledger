import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LayoutGrid, PieChart, Menu, Plus, PiggyBank, FileBarChart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAppData, useInvalidateData } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
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

async function ensureDemoBudgets(data: ReturnType<typeof useAppData>["data"], userId: string) {
  if (!data.transactions.some((t) => t.description.startsWith("[Demo]"))) return;
  if (data.accounts.length < 4 || data.categories.length === 0) return;
  if (data.budgets.filter((b) => b.account_id).length >= 6) return;

  const byAccount = new Map(data.accounts.map((a) => [a.name, a.id]));
  const byCategory = new Map(data.categories.map((c) => [c.name, c.id]));
  const hdfc = byAccount.get("HDFC Savings");
  const cash = byAccount.get("Cash");
  const gpay = byAccount.get("Google Pay");
  const card = byAccount.get("ICICI Credit Card");
  const food = byCategory.get("Food");
  const transport = byCategory.get("Transportation");
  const shopping = byCategory.get("Shopping");
  const entertainment = byCategory.get("Entertainment");
  const restaurants = byCategory.get("Restaurants");
  const fuel = byCategory.get("Fuel");
  const electronics = byCategory.get("Electronics");
  const movies = byCategory.get("Movies");
  if (!hdfc || !cash || !gpay || !card || !food || !transport || !shopping || !entertainment || !restaurants || !fuel || !electronics || !movies) return;

  const { error: deleteError } = await supabase.from("budgets").delete().is("account_id", null);
  if (deleteError) throw deleteError;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekDate = weekStart.toISOString().slice(0, 10);

  const { error: budgetError } = await supabase.from("budgets").insert([
    { user_id: userId, category_id: food, account_id: hdfc, amount: 9000, period: "monthly", start_date: monthStart },
    { user_id: userId, category_id: transport, account_id: hdfc, amount: 5000, period: "monthly", start_date: monthStart },
    { user_id: userId, category_id: shopping, account_id: cash, amount: 7000, period: "monthly", start_date: monthStart },
    { user_id: userId, category_id: food, account_id: cash, amount: 2200, period: "weekly", start_date: weekDate },
    { user_id: userId, category_id: entertainment, account_id: gpay, amount: 3000, period: "monthly", start_date: monthStart },
    { user_id: userId, category_id: shopping, account_id: card, amount: 12000, period: "monthly", start_date: monthStart },
    { user_id: userId, category_id: entertainment, account_id: card, amount: 4500, period: "monthly", start_date: monthStart },
  ]);
  if (budgetError) throw budgetError;

  const date = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };
  const marker = "[Demo Budget Test]";
  const { error: txError } = await supabase.from("transactions").insert([
    { user_id: userId, account_id: hdfc, category_id: restaurants, amount: 1250, type: "expense", date: date(2), description: `${marker} HDFC restaurant` },
    { user_id: userId, account_id: hdfc, category_id: restaurants, amount: 780, type: "expense", date: date(6), description: `${marker} HDFC food` },
    { user_id: userId, account_id: hdfc, category_id: fuel, amount: 1600, type: "expense", date: date(4), description: `${marker} HDFC fuel` },
    { user_id: userId, account_id: hdfc, category_id: fuel, amount: 900, type: "expense", date: date(9), description: `${marker} HDFC transport` },
    { user_id: userId, account_id: cash, category_id: electronics, amount: 2400, type: "expense", date: date(3), description: `${marker} Cash electronics` },
    { user_id: userId, account_id: cash, category_id: electronics, amount: 950, type: "expense", date: date(8), description: `${marker} Cash shopping` },
    { user_id: userId, account_id: cash, category_id: restaurants, amount: 620, type: "expense", date: date(1), description: `${marker} Cash food` },
    { user_id: userId, account_id: cash, category_id: restaurants, amount: 480, type: "expense", date: date(5), description: `${marker} Cash food` },
    { user_id: userId, account_id: gpay, category_id: movies, amount: 550, type: "expense", date: date(2), description: `${marker} GPay movie` },
    { user_id: userId, account_id: gpay, category_id: movies, amount: 420, type: "expense", date: date(10), description: `${marker} GPay entertainment` },
    { user_id: userId, account_id: card, category_id: electronics, amount: 3200, type: "expense", date: date(3), description: `${marker} Card electronics` },
    { user_id: userId, account_id: card, category_id: movies, amount: 900, type: "expense", date: date(5), description: `${marker} Card movie` },
  ]);
  if (txError) throw txError;
}

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
    seeded.current = true;
    void (async () => {
      try {
        if (data.accounts.length === 0) {
          await supabase.rpc("seed_demo_data");
        }
        await ensureDemoBudgets(data, session.user.id);
      } catch {
      } finally {
        invalidate();
      }
    })();
  }, [session, isLoading, data.accounts.length, data.transactions, data.budgets, data.categories, invalidate]);

  if (loading || !session) {
    return <div className="grid min-h-dvh place-items-center bg-background"><div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-4 pt-3"><div className="flex items-center justify-end border-b border-border/40 pb-2"><AccountSelector /></div></div>
      <div className="mx-auto min-h-dvh w-full max-w-md px-4 pb-28 pt-3"><Outlet /></div>
      <button onClick={() => setAddOpen(true)} aria-label="Add transaction" className="fixed bottom-[88px] left-1/2 z-30 grid size-12 -translate-x-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform active:scale-95"><Plus className="size-6" /></button>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur"><div className="mx-auto grid max-w-md grid-cols-5 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">{NAV.map((item) => { const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`); return <Link key={item.to} to={item.to} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}><item.icon className="size-5" />{item.label}</Link>; })}</div></nav>
      <TransactionForm open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}