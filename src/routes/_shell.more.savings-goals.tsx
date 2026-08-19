import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Target } from "lucide-react";
import { format, differenceInCalendarMonths, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, Section } from "@/components/app/pieces";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, useRemove, useUpsert } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { accountGoalAllocation, accountBalance, availableAccountBalance, goalProgress } from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import type { SavingsGoal, SavingsGoalType, SavingsGoalPriority } from "@/lib/types";

export const Route = createFileRoute("/_shell/more/savings-goals")({
  head: () => ({ meta: [{ title: "Savings Goals — Paisa Expense Manager" }, { name: "description", content: "Reserve existing money for what matters without creating transactions." }] }),
  component: SavingsGoalsPage,
});

const GOAL_TYPES: { value: SavingsGoalType; label: string }[] = [
  { value: "emergency", label: "Emergency" }, { value: "travel", label: "Travel" }, { value: "education", label: "Education" },
  { value: "vehicle", label: "Vehicle" }, { value: "home", label: "Home" }, { value: "shopping", label: "Shopping" }, { value: "investment", label: "Investment" }, { value: "other", label: "Other" },
];
const PRIORITIES: { value: SavingsGoalPriority; label: string }[] = [{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }];

function SavingsGoalsPage() {
  const { data, error, isLoading } = useAppData();
  const { accountId, currency } = useAppState();
  const remove = useRemove("savings_goals");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);

  const goals = useMemo(() => data.savingsGoals.filter((g) => g.status !== "archived" && (accountId === "all" || g.account_id === accountId)), [data.savingsGoals, accountId]);
  const activeGoals = goals.filter((g) => g.status === "active");
  const totalAllocated = useMemo(() => accountId === "all"
    ? data.accounts.filter((a) => a.is_active).reduce((sum, a) => sum + accountGoalAllocation(a.id, data.savingsGoals, data.savingsGoalContributions), 0)
    : accountGoalAllocation(accountId, data.savingsGoals, data.savingsGoalContributions), [accountId, data.accounts, data.savingsGoals, data.savingsGoalContributions]);

  const deleteGoal = async (goal: SavingsGoal) => {
    const saved = goalProgress(goal, data.savingsGoalContributions).saved;
    if (!confirm(`Delete ${goal.name}?${saved > 0 ? `\n\n${formatMoney(saved, currency)} is currently allocated and will be released back to the account.` : ""}`)) return;
    try { await remove.mutateAsync(goal.id); toast.success("Savings goal deleted"); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <Link to="/more" className="grid size-9 place-items-center rounded-full bg-secondary"><ChevronLeft className="size-5" /></Link>
        <div className="min-w-0"><h1 className="truncate text-lg font-extrabold">Savings Goals</h1><p className="truncate text-[11px] text-muted-foreground">Reserve existing money for what matters.</p></div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Add savings goal"><Plus className="size-5" /></button>
      </header>

      {error ? <Section><div className="space-y-2"><p className="font-bold">Savings Goals</p><p className="text-sm text-muted-foreground">This page could not be loaded.</p><Link to="/more" className="inline-flex text-sm font-semibold text-primary">Back to More</Link></div></Section> : isLoading ? <Section><div className="h-24 animate-pulse rounded-2xl bg-secondary" /></Section> : <>
        <div className="grid grid-cols-2 gap-2">
          <Section><p className="text-[11px] text-muted-foreground">Active Goals</p><p className="mt-1 text-xl font-extrabold tabular">{activeGoals.length}</p></Section>
          <Section><p className="text-[11px] text-muted-foreground">Total Allocated</p><p className="mt-1 text-xl font-extrabold tabular">{formatMoney(totalAllocated, currency)}</p></Section>
        </div>

        {goals.length ? goals.map((goal) => {
          const progress = goalProgress(goal, data.savingsGoalContributions);
          const account = data.accounts.find((a) => a.id === goal.account_id);
          const available = account ? availableAccountBalance(account, data.transactions, data.savingsGoals, data.savingsGoalContributions) : 0;
          const monthly = goal.target_date && progress.remaining > 0 ? progress.remaining / Math.max(1, differenceInCalendarMonths(parseISO(goal.target_date), new Date())) : 0;
          return <Section key={goal.id}>
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-xl">{goal.icon || "🎯"}</span>
              <Link to="/more/savings-goals/$goalId" params={{ goalId: goal.id }} className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{goal.name}</p><span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold capitalize">{goal.status}</span></div>
                <p className="truncate text-[11px] text-muted-foreground">{account?.name ?? "Unknown account"} · {goal.priority} priority</p>
              </Link>
              <Link to="/more/savings-goals/$goalId" params={{ goalId: goal.id }} className="grid size-8 place-items-center rounded-lg bg-secondary"><ChevronRight className="size-4" /></Link>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-lg font-extrabold tabular">{formatMoney(progress.saved, currency)}</p><p className="text-[11px] text-muted-foreground">of {formatMoney(progress.target, currency)}</p></div><p className="text-sm font-bold tabular">{Math.min(100, progress.percent).toFixed(0)}%</p></div>
            <Progress value={Math.min(100, progress.percent)} className="mt-2 h-2" />
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <span>{progress.remaining > 0 ? `${formatMoney(progress.remaining, currency)} left` : "Target reached"}</span>
              {goal.target_date ? <span className="text-right">Target: {format(parseISO(goal.target_date), "d MMM yyyy")}</span> : <span className="text-right">No target date</span>}
              <span>Need {monthly > 0 ? `${formatMoney(monthly, currency)}/month` : "no monthly target"}</span>
              <span className="text-right">Available: {formatMoney(available, currency)}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
              <button onClick={() => { setEditing(goal); setOpen(true); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary py-2 text-xs font-semibold"><Pencil className="size-3.5" /> Edit</button>
              <button onClick={() => void deleteGoal(goal)} className="grid size-9 place-items-center rounded-xl bg-expense/10 text-expense" aria-label={`Delete ${goal.name}`}><Trash2 className="size-4" /></button>
            </div>
          </Section>;
        }) : <Section><EmptyState text="No savings goals yet. Tap + to reserve money for a goal." /></Section>}
      </>}

      <SavingsGoalForm open={open} onOpenChange={setOpen} existing={editing} />
    </div>
  );
}

function SavingsGoalForm({ open, onOpenChange, existing }: { open: boolean; onOpenChange: (v: boolean) => void; existing: SavingsGoal | null }) {
  const { data } = useAppData();
  const upsert = useUpsert("savings_goals");
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [type, setType] = useState<SavingsGoalType>("other");
  const [priority, setPriority] = useState<SavingsGoalPriority>("medium");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setAccount(existing?.account_id ?? ""); setName(existing?.name ?? ""); setDescription(existing?.description ?? ""); setIcon(existing?.icon ?? "🎯"); setType(existing?.goal_type ?? "other"); setPriority(existing?.priority ?? "medium"); setTarget(existing ? String(existing.target_amount) : ""); setTargetDate(existing?.target_date ?? "");
  }, [open, existing]);

  const hasContributions = existing ? data.savingsGoalContributions.some((c) => c.goal_id === existing.id) : false;
  const submit = async () => {
    if (!account || !name.trim()) { toast.error("Select an account and enter a goal name"); return; }
    if (!target || Number(target) <= 0) { toast.error("Enter a target amount"); return; }
    try {
      await upsert.mutateAsync({ ...(existing ? { id: existing.id } : {}), account_id: account, name: name.trim(), description: description.trim(), icon: icon.trim() || "🎯", goal_type: type, priority, target_amount: Number(target).toFixed(2), target_date: targetDate || null });
      toast.success(existing ? "Savings goal updated" : "Savings goal created"); onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl"><SheetHeader><SheetTitle>{existing ? "Edit savings goal" : "New savings goal"}</SheetTitle></SheetHeader><div className="space-y-4 px-4 pb-8">
    <div className="space-y-1.5"><Label className="text-xs">Goal name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New Laptop" className="h-12 rounded-xl" /></div>
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3"><div className="space-y-1.5"><Label className="text-xs">Icon</Label><Input value={icon} onChange={(e) => setIcon(e.target.value)} className="h-12 rounded-xl text-center text-xl" maxLength={4} /></div><div className="space-y-1.5"><Label className="text-xs">Account</Label><Select value={account} onValueChange={setAccount} disabled={hasContributions}><SelectTrigger className="h-12 w-full rounded-xl"><SelectValue placeholder="Select account" /></SelectTrigger><SelectContent>{data.accounts.filter((a) => a.is_active).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>{hasContributions && <p className="text-[10px] text-muted-foreground">Release the allocation before moving this goal.</p>}</div></div>
    <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">Target amount</Label><Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} className="h-12 rounded-xl" /></div><div className="space-y-1.5"><Label className="text-xs">Target date</Label><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="h-12 rounded-xl" /></div></div>
    <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">Goal type</Label><Select value={type} onValueChange={(v) => setType(v as SavingsGoalType)}><SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{GOAL_TYPES.map((x) => <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label className="text-xs">Priority</Label><Select value={priority} onValueChange={(v) => setPriority(v as SavingsGoalPriority)}><SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((x) => <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>)}</SelectContent></Select></div></div>
    <div className="space-y-1.5"><Label className="text-xs">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="h-12 rounded-xl" /></div>
    <Button className="h-12 w-full rounded-xl" onClick={submit} disabled={upsert.isPending}>{existing ? "Save goal" : "Create goal"}</Button>
  </div></SheetContent></Sheet>;
}
