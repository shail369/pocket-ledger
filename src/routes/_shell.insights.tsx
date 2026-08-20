import { createFileRoute } from "@/router";
import { useMemo } from "react";
import { PeriodSelector } from "@/components/app/selectors";
import { CategoryBreakdown } from "@/components/app/category-breakdown";
import { ProjectionChart, SpendingAreaChart } from "@/components/app/charts";
import { EmptyState, ScreenHeader, Section, StatCard } from "@/components/app/pieces";
import { useAppData } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { formatMoney, percent } from "@/lib/format";
import { budgetProgress, categoryBreakdown, dailySeries, periodTransactions, projectMonth, projectionSeries, scopeTransactions, totals } from "@/lib/finance";

export const Route = createFileRoute("/_shell/insights")({
  head: () => ({ meta: [{ title: "Insights — Paisa Expense Manager" }, { name: "description", content: "Spending trends, category analysis and end-of-month projections for your money." }] }),
  component: InsightsPage,
});

function InsightsPage() {
  const { data } = useAppData();
  const { accountId, range, currency } = useAppState();
  const scoped = useMemo(() => periodTransactions(data.transactions, accountId, range), [data.transactions, accountId, range]);
  const all = useMemo(() => scopeTransactions(data.transactions, accountId), [data.transactions, accountId]);
  const t = totals(scoped);
  const nodes = categoryBreakdown(scoped, data.categories);
  const budgets = budgetProgress(data.budgets, data.transactions, data.categories, accountId);
  const projection = projectMonth(all);
  const series = projectionSeries(all);
  const savingsRate = t.income > 0 ? (t.savings / t.income) * 100 : 0;
  const avgDaily = projection.dailyRate;
  return (
    <div className="space-y-4">
      <ScreenHeader title="Insights" />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><PeriodSelector /></div>
      <div className="grid grid-cols-2 gap-2"><StatCard label="Total spent" value={formatMoney(t.expenses, currency, true)} tone="expense" /><StatCard label="Total income" value={formatMoney(t.income, currency, true)} tone="income" /><StatCard label="Savings rate" value={percent(savingsRate)} tone="primary" /><StatCard label="Avg / day" value={formatMoney(avgDaily, currency, true)} /></div>
      <Section title="Spending trend" subtitle={range.label}><SpendingAreaChart data={dailySeries(scoped, range)} /></Section>
      <CategoryBreakdown nodes={nodes} budgets={budgets} />
      <Section title="End-of-month projection" subtitle={`${projection.elapsedDays} of ${projection.totalDays} days elapsed`}><div className="mb-3 grid grid-cols-3 gap-2"><StatCard label="Spent" value={formatMoney(projection.spent, currency, true)} tone="expense" /><StatCard label="Daily rate" value={formatMoney(projection.dailyRate, currency, true)} /><StatCard label="Projected" value={formatMoney(projection.projected, currency, true)} tone="warning" /></div><ProjectionChart data={series} /></Section>
      <Section title="Budget outlook">{budgets.length ? <ul className="space-y-3">{budgets.map((b) => <li key={`${b.budget.id}-${b.categoryName}-${b.rangeLabel}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{b.categoryName}</p><p className="text-[11px] text-muted-foreground">Projected {formatMoney(b.projected, currency)} of {formatMoney(Number(b.budget.amount), currency)}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${b.projectedState === "over" ? "bg-expense/15 text-expense" : b.projectedState === "warning" ? "bg-warning/15 text-warning" : "bg-income/15 text-income"}`}>{b.projectedState === "over" ? "Will exceed" : b.projectedState === "warning" ? "At risk" : "On track"}</span></li>)}</ul> : <EmptyState text="No budgets set yet." />}</Section>
    </div>
  );
}
