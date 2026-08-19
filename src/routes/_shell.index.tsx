import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";
import { PeriodSelector } from "@/components/app/selectors";
import { EmptyState, Section, StatCard } from "@/components/app/pieces";
import { Progress } from "@/components/ui/progress";
import { useAppData } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { budgetProgress, goalProgress, periodTransactions, totalBalance, totals } from "@/lib/finance";

export const Route = createFileRoute("/_shell/")({
  head: () => ({ meta: [{ title: "Dashboard — Paisa Expense Manager" }, { name: "description", content: "A compact mobile overview of your balance, spending, budgets and savings goals." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useAppData();
  const { accountId, range, currency } = useAppState();
  const scoped = periodTransactions(data.transactions, accountId, range);
  const t = totals(scoped);
  const balance = totalBalance(data.accounts, data.transactions, accountId);
  const budgets = budgetProgress(data.budgets, data.transactions, data.categories, accountId);
  const savingsGoals = data.savingsGoals.filter((g) => g.status !== "archived" && (accountId === "all" || g.account_id === accountId)).slice(0, 3);
  const upcoming = data.recurring.filter((r) => r.is_active && (accountId === "all" || r.account_id === accountId)).slice(0, 3);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Overview</p><PeriodSelector /></header>
      <div className="rounded-3xl bg-primary p-4 text-primary-foreground shadow-sm"><p className="text-xs opacity-80">Total balance</p><p className="tabular text-2xl font-extrabold">{formatMoney(balance, currency)}</p><p className="mt-1 text-[11px] opacity-80">{range.label}</p></div>
      <div className="grid grid-cols-3 gap-2"><StatCard label="Income" value={formatMoney(t.income, currency, true)} tone="income" /><StatCard label="Expenses" value={formatMoney(t.expenses, currency, true)} tone="expense" /><StatCard label="Savings" value={formatMoney(t.savings, currency, true)} tone="primary" hint={`${t.savingsRate.toFixed(0)}% rate`} /></div>

      <Section title="Budgets" action={<Link to="/more/budgets" className="text-xs font-semibold text-primary">Manage</Link>}>
        {budgets.length ? <div className="space-y-2.5">{budgets.filter((b) => b.budget.category_id).slice(0, 3).map((b) => <div key={`${b.budget.id}-${b.categoryName}`}><div className="flex items-center justify-between text-xs"><span className="truncate font-medium">{b.categoryName}</span><span className="tabular text-muted-foreground">{formatMoney(b.spent, currency)} / {formatMoney(Number(b.budget.amount), currency)}</span></div><Progress value={Math.min(100, b.percent)} className={`mt-1 h-1.5 ${b.state === "over" ? "[&>div]:bg-expense" : b.state === "warning" ? "[&>div]:bg-warning" : ""}`} /></div>)}</div> : <EmptyState text="No budgets set for this account yet." />}
      </Section>

      <Section title="Savings Goals" action={<Link to="/more/savings-goals" className="text-xs font-semibold text-primary">View all</Link>}>
        {savingsGoals.length ? <div className="space-y-3">{savingsGoals.map((goal) => { const p = goalProgress(goal, data.savingsGoalContributions); return <Link key={goal.id} to="/more/savings-goals/$goalId" params={{ goalId: goal.id }} className="block"><div className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate font-medium">{goal.icon} {goal.name}</span><span className="tabular text-muted-foreground">{formatMoney(p.saved, currency)} / {formatMoney(p.target, currency)}</span></div><Progress value={Math.min(100, p.percent)} className="mt-1 h-1.5" /></Link>; })}</div> : <EmptyState text="No savings goals yet." />}
      </Section>

      <Section title="Upcoming" action={<Link to="/more/recurring" className="text-xs font-semibold text-primary">View all</Link>}>
        {upcoming.length ? <ul className="divide-y divide-border/60">{upcoming.map((r) => <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary"><CalendarClock className="size-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{r.description}</span><span className="block text-[11px] text-muted-foreground">{format(parseISO(r.next_occurrence), "d MMM")} · {r.frequency}</span></span><span className={`tabular text-sm font-bold ${r.type === "income" ? "text-income" : "text-expense"}`}>{formatMoney(Number(r.amount), currency)}</span></li>)}</ul> : <EmptyState text="Nothing scheduled." />}
      </Section>
    </div>
  );
}