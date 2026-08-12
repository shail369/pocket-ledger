import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subDays,
  format,
  eachDayOfInterval,
  differenceInCalendarDays,
  parseISO,
} from "date-fns";
import type { Account, Budget, Category, Transaction } from "./types";

export type PeriodKey =
  | "this_week"
  | "last_7"
  | "this_month"
  | "last_month"
  | "last_30"
  | "this_year"
  | "custom";

export interface Range {
  from: Date;
  to: Date;
  label: string;
}

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  this_week: "This week",
  last_7: "Last 7 days",
  last_30: "Last 30 days",
  this_month: "This month",
  last_month: "Last month",
  this_year: "This year",
  custom: "Custom range",
};

export function resolveRange(
  key: PeriodKey,
  custom?: { from?: string; to?: string },
): Range {
  const now = new Date();
  switch (key) {
    case "this_week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }), label: PERIOD_LABELS.this_week };
    case "last_7":
      return { from: subDays(now, 6), to: now, label: PERIOD_LABELS.last_7 };
    case "last_30":
      return { from: subDays(now, 29), to: now, label: PERIOD_LABELS.last_30 };
    case "last_month": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev), label: format(prev, "MMMM yyyy") };
    }
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now), label: PERIOD_LABELS.this_year };
    case "custom": {
      const from = custom?.from ? parseISO(custom.from) : startOfMonth(now);
      const to = custom?.to ? parseISO(custom.to) : now;
      return { from, to, label: `${format(from, "d MMM")} – ${format(to, "d MMM")}` };
    }
    case "this_month":
    default:
      return { from: startOfMonth(now), to: endOfMonth(now), label: PERIOD_LABELS.this_month };
  }
}

export const iso = (d: Date) => format(d, "yyyy-MM-dd");

export function inRange(t: Transaction, range: Range) {
  const d = t.date;
  return d >= iso(range.from) && d <= iso(range.to);
}

/** Filter by selected account: "all" or an account id. Transfers involving the account count. */
export function scopeTransactions(txs: Transaction[], accountId: string) {
  if (accountId === "all") return txs;
  return txs.filter((t) => t.account_id === accountId || t.transfer_account_id === accountId);
}

export function periodTransactions(txs: Transaction[], accountId: string, range: Range) {
  return scopeTransactions(txs, accountId).filter((t) => inRange(t, range));
}

export const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

export function totals(txs: Transaction[]) {
  const income = sum(txs.filter((t) => t.type === "income").map((t) => Number(t.amount)));
  const expenses = sum(txs.filter((t) => t.type === "expense").map((t) => Number(t.amount)));
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  return { income, expenses, savings, savingsRate };
}

export function accountBalance(account: Account, txs: Transaction[]) {
  let balance = Number(account.opening_balance);
  for (const t of txs) {
    const amt = Number(t.amount);
    if (t.type === "income" && t.account_id === account.id) balance += amt;
    if (t.type === "expense" && t.account_id === account.id) balance -= amt;
    if (t.type === "transfer") {
      if (t.account_id === account.id) balance -= amt;
      if (t.transfer_account_id === account.id) balance += amt;
    }
  }
  return balance;
}

export function totalBalance(accounts: Account[], txs: Transaction[], accountId: string) {
  const list = accountId === "all" ? accounts.filter((a) => a.is_active) : accounts.filter((a) => a.id === accountId);
  return sum(list.map((a) => accountBalance(a, txs)));
}

export interface CategoryNode {
  id: string;
  name: string;
  icon: string;
  amount: number;
  percent: number;
  children: { id: string; name: string; amount: number; percent: number }[];
}

export function categoryBreakdown(
  txs: Transaction[],
  categories: Category[],
  type: "expense" | "income" = "expense",
): CategoryNode[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const roots = new Map<string, CategoryNode>();
  const ensure = (cat: Category) => {
    if (!roots.has(cat.id))
      roots.set(cat.id, { id: cat.id, name: cat.name, icon: cat.icon, amount: 0, percent: 0, children: [] });
    return roots.get(cat.id)!;
  };

  for (const t of txs) {
    if (t.type !== type || !t.category_id) continue;
    const cat = byId.get(t.category_id);
    if (!cat) continue;
    const parent = cat.parent_id ? byId.get(cat.parent_id) : undefined;
    const root = ensure(parent ?? cat);
    const amt = Number(t.amount);
    root.amount += amt;
    const childName = parent ? cat.name : "Uncategorised";
    const childId = parent ? cat.id : `${cat.id}-self`;
    const existing = root.children.find((c) => c.id === childId);
    if (existing) existing.amount += amt;
    else root.children.push({ id: childId, name: childName, amount: amt, percent: 0 });
  }

  const list = [...roots.values()].sort((a, b) => b.amount - a.amount);
  const total = sum(list.map((c) => c.amount));
  for (const c of list) {
    c.percent = total > 0 ? (c.amount / total) * 100 : 0;
    c.children.sort((a, b) => b.amount - a.amount);
    for (const ch of c.children) ch.percent = c.amount > 0 ? (ch.amount / c.amount) * 100 : 0;
  }
  return list;
}

export function dailySeries(txs: Transaction[], range: Range) {
  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const capped = days.length > 120 ? days.filter((_, i) => i % Math.ceil(days.length / 120) === 0) : days;
  const map = new Map<string, { expense: number; income: number }>();
  for (const t of txs) {
    if (t.type === "transfer") continue;
    const key = t.date;
    const cur = map.get(key) ?? { expense: 0, income: 0 };
    if (t.type === "expense") cur.expense += Number(t.amount);
    else cur.income += Number(t.amount);
    map.set(key, cur);
  }
  return capped.map((d) => {
    const key = iso(d);
    const v = map.get(key) ?? { expense: 0, income: 0 };
    return { date: key, label: format(d, days.length > 45 ? "d MMM" : "d MMM"), ...v };
  });
}

export function monthlySeries(txs: Transaction[], months = 6) {
  const now = new Date();
  const out: { key: string; label: string; expense: number; income: number; savings: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = subMonths(now, i);
    const key = format(m, "yyyy-MM");
    const rows = txs.filter((t) => t.date.startsWith(key));
    const { income, expenses } = totals(rows);
    out.push({ key, label: format(m, "MMM"), expense: expenses, income, savings: income - expenses });
  }
  return out;
}

export interface Projection {
  spent: number;
  dailyRate: number;
  projected: number;
  elapsedDays: number;
  totalDays: number;
}

export function projectMonth(txs: Transaction[], reference = new Date()): Projection {
  const from = startOfMonth(reference);
  const to = endOfMonth(reference);
  const totalDays = differenceInCalendarDays(to, from) + 1;
  const elapsedDays = Math.max(1, differenceInCalendarDays(reference, from) + 1);
  const spent = sum(
    txs
      .filter((t) => t.type === "expense" && t.date >= iso(from) && t.date <= iso(reference))
      .map((t) => Number(t.amount)),
  );
  const dailyRate = spent / elapsedDays;
  return { spent, dailyRate, projected: dailyRate * totalDays, elapsedDays, totalDays };
}

export function projectionSeries(txs: Transaction[], reference = new Date()) {
  const from = startOfMonth(reference);
  const to = endOfMonth(reference);
  const { dailyRate } = projectMonth(txs, reference);
  const days = eachDayOfInterval({ start: from, end: to });
  let running = 0;
  return days.map((d) => {
    const key = iso(d);
    const isPast = key <= iso(reference);
    if (isPast) {
      running += sum(txs.filter((t) => t.type === "expense" && t.date === key).map((t) => Number(t.amount)));
    }
    const idx = differenceInCalendarDays(d, from) + 1;
    return {
      label: format(d, "d"),
      actual: isPast ? running : null,
      projected: isPast ? (key === iso(reference) ? running : null) : dailyRate * idx,
    };
  });
}

export type BudgetState = "ok" | "warning" | "over";

export function budgetRange(budget: Budget, reference = new Date()): Range {
  if (budget.period === "weekly")
    return {
      from: startOfWeek(reference, { weekStartsOn: 1 }),
      to: endOfWeek(reference, { weekStartsOn: 1 }),
      label: "This week",
    };
  return { from: startOfMonth(reference), to: endOfMonth(reference), label: "This month" };
}

export function budgetStatus(spent: number, amount: number): BudgetState {
  const pct = amount > 0 ? (spent / amount) * 100 : 0;
  if (pct > 100) return "over";
  if (pct >= 75) return "warning";
  return "ok";
}

export interface BudgetProgress {
  budget: Budget;
  categoryName: string;
  icon: string;
  spent: number;
  remaining: number;
  percent: number;
  state: BudgetState;
  projected: number;
  projectedState: BudgetState;
  rangeLabel: string;
}

export function budgetProgress(
  budgets: Budget[],
  txs: Transaction[],
  categories: Category[],
  accountId: string,
  reference = new Date(),
): BudgetProgress[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id).map((c) => c.id);

  return budgets
    .filter((b) => !b.account_id || accountId === "all" || b.account_id === accountId)
    .map((b) => {
      const range = budgetRange(b, reference);
      const scoped = periodTransactions(txs, b.account_id ?? accountId, range).filter((t) => t.type === "expense");
      const ids = b.category_id ? new Set([b.category_id, ...childrenOf(b.category_id)]) : null;
      const spent = sum(
        scoped.filter((t) => !ids || (t.category_id && ids.has(t.category_id))).map((t) => Number(t.amount)),
      );
      const amount = Number(b.amount);
      const totalDays = differenceInCalendarDays(range.to, range.from) + 1;
      const elapsed = Math.min(
        totalDays,
        Math.max(1, differenceInCalendarDays(reference, range.from) + 1),
      );
      const projected = (spent / elapsed) * totalDays;
      const cat = b.category_id ? byId.get(b.category_id) : undefined;
      return {
        budget: b,
        categoryName: cat?.name ?? "Overall budget",
        icon: cat?.icon ?? "wallet",
        spent,
        remaining: amount - spent,
        percent: amount > 0 ? (spent / amount) * 100 : 0,
        state: budgetStatus(spent, amount),
        projected,
        projectedState: budgetStatus(projected, amount),
        rangeLabel: b.period === "weekly" ? "Weekly" : "Monthly",
      };
    })
    .sort((a, b) => b.percent - a.percent);
}