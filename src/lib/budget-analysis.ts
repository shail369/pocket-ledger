import { endOfMonth, format, parseISO, startOfMonth, startOfWeek, endOfWeek, differenceInCalendarDays, addMonths, isBefore, isAfter } from "date-fns";
import type { Budget, Category, Transaction } from "./types";

export type BudgetState = "ok" | "warning" | "over";
export interface BudgetProgress { budget: Budget; categoryName: string; icon: string; spent: number; remaining: number; percent: number; state: BudgetState; projected: number; projectedState: BudgetState; rangeLabel: string; }
export interface MonthlyBudgetReport { key: string; label: string; overall: { budget: number; spent: number; remaining: number; percent: number; state: BudgetState }; categories: BudgetProgress[]; }

function status(spent: number, amount: number): BudgetState { const pct = amount > 0 ? (spent / amount) * 100 : 0; return pct > 100 ? "over" : pct >= 75 ? "warning" : "ok"; }
function inRange(tx: Transaction, from: Date, to: Date) { return tx.date >= format(from, "yyyy-MM-dd") && tx.date <= format(to, "yyyy-MM-dd"); }
function scoped(tx: Transaction[], accountId: string) { return accountId === "all" ? tx : tx.filter((t) => t.account_id === accountId || t.transfer_account_id === accountId); }
function amount(rows: Transaction[]) { return rows.reduce((sum, t) => sum + Number(t.amount), 0); }

function rangeForMonth(month: Date) { return { from: startOfMonth(month), to: endOfMonth(month), label: format(month, "MMMM yyyy") }; }

export function calculateBudgetProgress(budget: Budget, txs: Transaction[], categories: Category[], reference = new Date(), monthOverride?: Date): BudgetProgress {
  const month = monthOverride ?? parseISO(budget.start_date);
  const range = rangeForMonth(month);
  const rows = scoped(txs, budget.account_id ?? "all").filter((t) => t.type === "expense" && inRange(t, range.from, range.to));
  const ids = budget.category_id ? new Set([budget.category_id, ...categories.filter((c) => c.parent_id === budget.category_id).map((c) => c.id)]) : null;
  const spent = amount(rows.filter((t) => !ids || (t.category_id && ids.has(t.category_id))));
  const budgetAmount = Number(budget.amount);
  const now = new Date();
  const totalDays = differenceInCalendarDays(range.to, range.from) + 1;
  const current = range.from <= now && now <= range.to;
  const elapsed = current ? Math.min(totalDays, Math.max(1, differenceInCalendarDays(now, range.from) + 1)) : totalDays;
  const projected = current ? (spent / elapsed) * totalDays : spent;
  const cat = budget.category_id ? categories.find((c) => c.id === budget.category_id) : undefined;
  return { budget, categoryName: cat?.name ?? "Overall budget", icon: cat?.icon ?? "wallet", spent, remaining: budgetAmount - spent, percent: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0, state: status(spent, budgetAmount), projected, projectedState: status(projected, budgetAmount), rangeLabel: range.label };
}

export function budgetProgressFixed(budgets: Budget[], txs: Transaction[], categories: Category[], accountId: string): BudgetProgress[] {
  const source = budgets.filter((b) => b.account_id && (accountId === "all" || b.account_id === accountId));
  if (accountId !== "all") return source.map((b) => calculateBudgetProgress(b, txs, categories)).sort((a, b) => b.percent - a.percent);
  const groups = new Map<string, BudgetProgress>();
  for (const b of source) {
    const row = calculateBudgetProgress(b, txs, categories);
    const key = `${b.category_id ?? "overall"}|${b.period}`;
    const existing = groups.get(key);
    if (!existing) { groups.set(key, { ...row, budget: { ...row.budget, account_id: null } }); continue; }
    const total = Number(existing.budget.amount) + Number(row.budget.amount);
    existing.budget.amount = total; existing.spent += row.spent; existing.remaining = total - existing.spent; existing.percent = total > 0 ? existing.spent / total * 100 : 0; existing.state = status(existing.spent, total); existing.projected += row.projected; existing.projectedState = status(existing.projected, total);
  }
  return [...groups.values()].sort((a, b) => b.percent - a.percent);
}

function activeMonthlyBudgetsForMonth(budgets: Budget[], month: Date, accountId: string): Budget[] {
  const monthKey = format(month, "yyyy-MM");
  const eligible = budgets.filter((b) => b.period === "monthly" && b.account_id && (accountId === "all" || b.account_id === accountId) && format(parseISO(b.start_date), "yyyy-MM") <= monthKey);
  // A budget remains active until it is deleted. If multiple budget rows exist for
  // the same account/category, the most recently created/start-dated one wins.
  const latest = new Map<string, Budget>();
  for (const budget of eligible) {
    const key = `${budget.account_id}|${budget.category_id ?? "overall"}`;
    const existing = latest.get(key);
    if (!existing || budget.start_date > existing.start_date || (budget.start_date === existing.start_date && budget.id > existing.id)) latest.set(key, budget);
  }
  return [...latest.values()];
}

export function monthlyBudgetReport(budgets: Budget[], txs: Transaction[], categories: Category[], accountId: string, months = 6): MonthlyBudgetReport[] {
  const now = startOfMonth(new Date());
  const output: MonthlyBudgetReport[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const month = addMonths(now, -i);
    const active = activeMonthlyBudgetsForMonth(budgets, month, accountId);
    if (!active.length) continue;
    const details = active.map((b) => calculateBudgetProgress(b, txs, categories, new Date(), month));
    const categoryBudgets = details.filter((d) => d.budget.category_id !== null);
    const explicitOverall = details.filter((d) => d.budget.category_id === null);
    const budgetAmount = explicitOverall.length ? explicitOverall.reduce((s, d) => s + Number(d.budget.amount), 0) : categoryBudgets.reduce((s, d) => s + Number(d.budget.amount), 0);
    const spent = amount(scoped(txs, accountId).filter((t) => t.type === "expense" && inRange(t, startOfMonth(month), endOfMonth(month))));
    output.push({ key: format(month, "yyyy-MM"), label: format(month, "MMMM yyyy"), overall: { budget: budgetAmount, spent, remaining: budgetAmount - spent, percent: budgetAmount > 0 ? spent / budgetAmount * 100 : 0, state: status(spent, budgetAmount) }, categories: categoryBudgets.sort((a, b) => b.percent - a.percent) });
  }
  return output.reverse();
}
