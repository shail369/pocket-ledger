import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Section } from "@/components/app/pieces";
import { AppIcon } from "@/components/app/icon";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, useRemove, useUpsert } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { formatMoney } from "@/lib/format";
import { budgetProgress } from "@/lib/finance";
import type { Budget } from "@/lib/types";

export const Route = createFileRoute("/_shell/more/budgets")({
  head: () => ({ meta: [{ title: "Budgets — Paisa Expense Manager" }, { name: "description", content: "Set account-specific weekly and monthly spending limits by category." }] }),
  component: BudgetsPage,
});

const OVERALL = "__overall__";

function BudgetsPage() {
  const { data } = useAppData();
  const { accountId, currency } = useAppState();
  const remove = useRemove("budgets");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const progress = budgetProgress(data.budgets, data.transactions, data.categories, accountId);

  return (
    <div className="space-y-4">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"><Link to="/" className="grid size-9 place-items-center rounded-full bg-secondary"><ChevronLeft className="size-5" /></Link><h1 className="truncate text-lg font-extrabold">Budgets</h1><button onClick={() => { setEditing(null); setOpen(true); }} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Add budget"><Plus className="size-5" /></button></header>
      {progress.length ? progress.map((b) => (
        <Section key={`${b.categoryName}-${b.rangeLabel}-${b.budget.id}`}>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary"><AppIcon name={b.icon} className="size-4" /></span>
            <button className="min-w-0 text-left" onClick={() => { if (accountId === "all") return; setEditing(b.budget); setOpen(true); }}>
              <p className="truncate text-sm font-bold">{b.categoryName}</p>
              <p className="text-[11px] capitalize text-muted-foreground">{b.budget.period === "weekly" ? "Weekly" : "Monthly"}{accountId === "all" ? " · Combined" : ""}</p>
            </button>
            <button onClick={async () => { if (accountId === "all") { toast.error("Select an account before deleting a budget"); return; } if (!confirm("Delete this budget?")) return; await remove.mutateAsync(b.budget.id); toast.success("Budget deleted"); }} className="grid size-9 place-items-center rounded-xl bg-secondary text-expense" aria-label="Delete budget"><Trash2 className="size-4" /></button>
          </div>
          <Progress value={Math.min(100, b.percent)} className={`mt-3 h-2 ${b.state === "over" ? "[&>div]:bg-expense" : b.state === "warning" ? "[&>div]:bg-warning" : ""}`} />
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground"><span className="tabular">{formatMoney(b.spent, currency)} of {formatMoney(Number(b.budget.amount), currency)}</span><span className={b.remaining < 0 ? "font-bold text-expense" : ""}>{b.remaining < 0 ? `${formatMoney(Math.abs(b.remaining), currency)} over` : `${formatMoney(b.remaining, currency)} left`}</span></div>
        </Section>
      )) : <Section><EmptyState text={accountId === "all" ? "No account-specific budgets yet. Select an account to create one." : "No budgets yet. Tap + to create one."} /></Section>}
      <BudgetForm open={open} onOpenChange={setOpen} existing={editing} selectedAccountId={accountId} />
    </div>
  );
}

function BudgetForm({ open, onOpenChange, existing, selectedAccountId }: { open: boolean; onOpenChange: (v: boolean) => void; existing?: Budget | null; selectedAccountId: string }) {
  const { data } = useAppData();
  const upsert = useUpsert("budgets");
  const [category, setCategory] = useState(OVERALL);
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  useEffect(() => { if (!open) return; setCategory(existing?.category_id ?? OVERALL); setAccount(existing?.account_id ?? (selectedAccountId === "all" ? "" : selectedAccountId)); setAmount(existing ? String(existing.amount) : ""); setPeriod(existing?.period ?? "monthly"); }, [open, existing, selectedAccountId]);
  const parents = data.categories.filter((c) => !c.parent_id);
  const submit = async () => { if (!account) { toast.error("Select an account for this budget"); return; } if (!amount || Number(amount) <= 0) { toast.error("Enter a budget amount"); return; } try { await upsert.mutateAsync({ ...(existing ? { id: existing.id } : {}), category_id: category === OVERALL ? null : category, account_id: account, amount: Number(amount).toFixed(2), period }); toast.success(existing ? "Budget updated" : "Budget created"); onOpenChange(false); } catch (e) { toast.error((e as Error).message); } };
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl"><SheetHeader><SheetTitle>{existing ? "Edit budget" : "New budget"}</SheetTitle></SheetHeader><div className="space-y-4 px-4 pb-8"><div className="space-y-1.5"><Label className="text-xs">Account</Label><Select value={account} onValueChange={setAccount}><SelectTrigger className="h-12 w-full rounded-xl"><SelectValue placeholder="Select account" /></SelectTrigger><SelectContent>{data.accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label className="text-xs">Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={OVERALL}>Overall budget</SelectItem>{parents.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">Amount</Label><Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl" /></div><div className="space-y-1.5"><Label className="text-xs">Period</Label><Select value={period} onValueChange={setPeriod}><SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div></div><Button className="h-12 w-full rounded-xl" onClick={submit} disabled={upsert.isPending}>{existing ? "Save budget" : "Create budget"}</Button></div></SheetContent></Sheet>;
}