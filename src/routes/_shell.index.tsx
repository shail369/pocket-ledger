import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";
import { AccountSelector, PeriodSelector } from "@/components/app/selectors";
import { CategoryBreakdown } from "@/components/app/category-breakdown";
import { SpendingAreaChart } from "@/components/app/charts";
import { EmptyState, Section, StatCard, TransactionRow } from "@/components/app/pieces";
import { Progress } from "@/components/ui/progress";
import { useAppData } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { formatMoney } from "@/lib/format";
import {
  budgetProgress,
  categoryBreakdown,
  dailySeries,
  periodTransactions,
  totalBalance,
  totals,
} from "@/lib/finance";

export const Route = createFileRoute("/_shell/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Paisa Expense Manager" },
      { name: "description", content: "A compact mobile overview of your balance, spending, budgets and recent activity." },
      { property: "og:title", content: "Dashboard — Paisa Expense Manager" },
      { property: "og:description", content: "A compact mobile overview of your balance, spending, budgets and recent activity." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useAppData();
  const { accountId, range, currency } = useAppState();

  const scoped = useMemo(
    () => periodTransactions(data.transactions, accountId, range),
    [data.transactions, accountId, range],
  );
  const t = totals(scoped);
  const balance = totalBalance(data.accounts, data.transactions, accountId);
  const nodes = useMemo(() => categoryBreakdown(scoped, data.categories), [scoped, data.categories]);
  const series = useMemo(() => dailySeries(scoped, range), [scoped, range]);
  const budgets = useMemo(
    () => budgetProgress(data.budgets, data.transactions, data.categories, accountId),
    [data.budgets, data.transactions, data.categories, accountId],
  );
  const overall = budgets.find((b) => !b.budget.category_id);
  const recent = scoped.slice(0, 6);
  const upcoming = data.recurring
    .filter((r) => r.is_active && (accountId === "all" || r.account_id === accountId))
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Overview</p>
          <AccountSelector />
        </div>
        <PeriodSelector />
      </header>

      <div className="rounded-3xl bg-primary p-4 text-primary-foreground shadow-sm">
        <p className="text-xs opacity-80">Total balance</p>
        <p className="tabular text-2xl font-extrabold">{formatMoney(balance, currency)}</p>
        <p className="mt-1 text-[11px] opacity-80">{range.label}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Income" value={formatMoney(t.income, currency, true)} tone="income" />
        <StatCard label="Expenses" value={formatMoney(t.expenses, currency, true)} tone="expense" />
        <StatCard
          label="Savings"
          value={formatMoney(t.savings, currency, true)}
          tone="primary"
          hint={`${t.savingsRate.toFixed(0)}% rate`}
        />
      </div>

      <Section title="Spending overview" action={<span className="text-[11px] text-muted-foreground">{range.label}</span>}>
        {isLoading ? <EmptyState text="Loading…" /> : <SpendingAreaChart data={series} />}
      </Section>

      <CategoryBreakdown nodes={nodes} budgets={budgets} />

      <Section
        title="Budgets"
        action={
          <Link to="/more/budgets" className="text-xs font-semibold text-primary">
            Manage
          </Link>
        }
      >
        {overall ? (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold">Overall monthly</span>
              <span className="tabular text-muted-foreground">
                {formatMoney(overall.spent, currency)} / {formatMoney(Number(overall.budget.amount), currency)}
              </span>
            </div>
            <Progress value={Math.min(100, overall.percent)} className="h-2" />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatMoney(Math.max(0, overall.remaining), currency)} remaining this month
            </p>
          </div>
        ) : null}
        <div className="space-y-2.5">
          {budgets
            .filter((b) => b.budget.category_id)
            .slice(0, 3)
            .map((b) => (
              <div key={b.budget.id}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium">
                    {b.categoryName} <span className="text-muted-foreground">· {b.rangeLabel}</span>
                  </span>
                  <span className="tabular text-muted-foreground">
                    {formatMoney(b.spent, currency)} / {formatMoney(Number(b.budget.amount), currency)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, b.percent)}
                  className={`mt-1 h-1.5 ${b.state === "over" ? "[&>div]:bg-expense" : b.state === "warning" ? "[&>div]:bg-warning" : ""}`}
                />
              </div>
            ))}
          {!budgets.length && <EmptyState text="No budgets yet." />}
        </div>
      </Section>

      <Section
        title="Upcoming"
        action={
          <Link to="/more/recurring" className="text-xs font-semibold text-primary">
            View all
          </Link>
        }
      >
        {upcoming.length ? (
          <ul className="divide-y divide-border/60">
            {upcoming.map((r) => (
              <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary">
                  <CalendarClock className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{r.description}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {format(parseISO(r.next_occurrence), "d MMM")} · {r.frequency}
                  </span>
                </span>
                <span className={`tabular text-sm font-bold ${r.type === "income" ? "text-income" : ""}`}>
                  {formatMoney(Number(r.amount), currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState text="Nothing scheduled." />
        )}
      </Section>

      <Section
        title="Recent transactions"
        action={
          <Link to="/transactions" className="text-xs font-semibold text-primary">
            View all
          </Link>
        }
      >
        {recent.length ? (
          <div className="divide-y divide-border/60">
            {recent.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        ) : (
          <EmptyState text="No transactions in this period." />
        )}
      </Section>
    </div>
  );
}