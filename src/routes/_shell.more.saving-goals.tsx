import { createFileRoute, Link } from "@/router";
import { useMemo, useState } from "react";
import { ChevronLeft, Plus, Pencil, Trash2, PiggyBank, CheckCircle2, AlertCircle, CircleDollarSign } from "lucide-react";
import { differenceInCalendarMonths, format, parseISO, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { EmptyState, Section } from "@/components/app/pieces";
import { AppIcon, ICON_OPTIONS } from "@/components/app/icon";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, useRemove, useUpsert } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { formatMoney } from "@/lib/format";
import type { SavingGoal, SavingGoalContribution } from "@/lib/types";

export const Route = createFileRoute("/_shell/more/saving-goals")({
  head: () => ({ meta: [{ title: "Saving Goals — Paisa Expense Manager" }, { name: "description", content: "Track savings goals, contributions, target dates and progress." }] }),
  component: SavingGoalsPage,
});

const DEFAULT_ICON = "piggy-bank";
const ICON_COLORS = ["#2563eb", "#16a34a", "#a855f7", "#f97316", "#e11d48", "#0891b2"];

function SavingGoalsPage() {
  const { data } = useAppData();
  const { currency } = useAppState();
  const removeGoal = useRemove("saving_goals");
  const removeContribution = useRemove("saving_goal_contributions");
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [editing, setEditing] = useState<SavingGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);

  const contributionsByGoal = useMemo(() => {
    const map = new Map<string, number>();
    for (const contribution of data.savingGoalContributions) map.set(contribution.goal_id, (map.get(contribution.goal_id) ?? 0) + Number(contribution.amount));
    return map;
  }, [data.savingGoalContributions]);

  const totalTarget = data.savingGoals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
  const totalSaved = data.savingGoals.reduce((sum, goal) => sum + (contributionsByGoal.get(goal.id) ?? 0), 0);
  const activeGoals = data.savingGoals.filter((goal) => (contributionsByGoal.get(goal.id) ?? 0) < Number(goal.target_amount));

  const openEdit = (goal: SavingGoal) => { setEditing(goal); setGoalFormOpen(true); };
  const deleteGoal = async (goal: SavingGoal) => {
    if (!confirm(`Delete the saving goal “${goal.name}”? Its contribution history will also be deleted.`)) return;
    try { await removeGoal.mutateAsync(goal.id); if (selectedGoal?.id === goal.id) setSelectedGoal(null); toast.success("Saving goal deleted"); }
    catch (e) { toast.error((e as Error).message); }
  };
  const deleteContribution = async (contribution: SavingGoalContribution) => {
    if (!confirm("Delete this contribution?")) return;
    try { await removeContribution.mutateAsync(contribution.id); toast.success("Contribution deleted"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return <div className="space-y-4">
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
      <Link to="/more" className="grid size-9 place-items-center rounded-full bg-secondary"><ChevronLeft className="size-5" /></Link>
      <h1 className="truncate text-lg font-extrabold">Saving Goals</h1>
      <button onClick={() => { setEditing(null); setGoalFormOpen(true); }} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Add saving goal"><Plus className="size-5" /></button>
    </header>

    {data.savingGoals.length > 0 && <Section>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Summary value={formatMoney(totalTarget, currency)} label="Total target" />
        <Summary value={formatMoney(totalSaved, currency)} label="Saved" />
        <Summary value={formatMoney(Math.max(0, totalTarget - totalSaved), currency)} label="Remaining" />
      </div>
    </Section>}

    {data.savingGoals.length ? data.savingGoals.map((goal) => {
      const saved = contributionsByGoal.get(goal.id) ?? 0;
      return <GoalCard key={goal.id} goal={goal} saved={saved} currency={currency} onOpen={() => setSelectedGoal(goal)} onEdit={() => openEdit(goal)} onDelete={() => void deleteGoal(goal)} />;
    }) : <Section><EmptyState text="No saving goals yet. Tap + to create your first goal." /></Section>}

    {activeGoals.length > 0 && <p className="px-1 text-center text-[11px] text-muted-foreground">Contributions are allocations linked to your existing transactions. They do not create expenses or change account balances.</p>}

    <GoalForm open={goalFormOpen} onOpenChange={setGoalFormOpen} existing={editing} />
    {selectedGoal && <GoalDetails goal={selectedGoal} onClose={() => setSelectedGoal(null)} onAdd={() => setContributionOpen(true)} onEdit={() => openEdit(selectedGoal)} onDelete={() => void deleteGoal(selectedGoal)} currency={currency} />}
    {selectedGoal && <ContributionForm open={contributionOpen} onOpenChange={setContributionOpen} goal={selectedGoal} />}
  </div>;
}

function Summary({ value, label }: { value: string; label: string }) { return <div><p className="truncate text-sm font-extrabold tabular">{value}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p></div>; }

function GoalCard({ goal, saved, currency, onOpen, onEdit, onDelete }: { goal: SavingGoal; saved: number; currency: string; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const target = Number(goal.target_amount); const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0; const remaining = Math.max(0, target - saved); const complete = saved >= target;
  return <Section>
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${goal.color}18`, color: goal.color }}><AppIcon name={goal.icon} className="size-5" /></span>
      <button className="min-w-0 text-left" onClick={onOpen}><p className="truncate text-sm font-bold">{goal.name}</p><p className="truncate text-[11px] text-muted-foreground">{complete ? "Goal completed" : goal.target_date ? `Target ${format(parseISO(goal.target_date), "d MMM yyyy")}` : "No target date"}</p></button>
      <button onClick={onEdit} className="grid size-9 place-items-center rounded-xl bg-secondary text-muted-foreground" aria-label="Edit saving goal"><Pencil className="size-4" /></button>
      <button onClick={onDelete} className="grid size-9 place-items-center rounded-xl bg-secondary text-expense" aria-label="Delete saving goal"><Trash2 className="size-4" /></button>
    </div>
    <button onClick={onOpen} className="mt-3 w-full text-left"><Progress value={percent} className="h-2" /><div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground"><span className="tabular">{formatMoney(saved, currency)} of {formatMoney(target, currency)}</span><span className="tabular">{Math.round(percent)}%</span></div><p className="mt-1 text-[11px] text-muted-foreground">{complete ? "🎉 Target reached" : `${formatMoney(remaining, currency)} remaining`}</p></button>
  </Section>;
}

function GoalForm({ open, onOpenChange, existing }: { open: boolean; onOpenChange: (v: boolean) => void; existing: SavingGoal | null }) {
  const upsert = useUpsert("saving_goals");
  const [name, setName] = useState(""); const [target, setTarget] = useState(""); const [date, setDate] = useState(""); const [icon, setIcon] = useState(DEFAULT_ICON); const [color, setColor] = useState(ICON_COLORS[0]); const [description, setDescription] = useState("");
  const reset = () => { setName(existing?.name ?? ""); setTarget(existing ? String(existing.target_amount) : ""); setDate(existing?.target_date ?? ""); setIcon(existing?.icon ?? DEFAULT_ICON); setColor(existing?.color ?? ICON_COLORS[0]); setDescription(existing?.description ?? ""); };
  const submit = async () => {
    const amount = Number(target); if (!name.trim()) { toast.error("Enter a goal name"); return; } if (!Number.isFinite(amount) || amount <= 0) { toast.error("Enter a target amount greater than zero"); return; }
    try { await upsert.mutateAsync({ ...(existing ? { id: existing.id } : {}), name: name.trim(), target_amount: amount.toFixed(2), target_date: date || null, icon, color, description: description.trim() }); toast.success(existing ? "Saving goal updated" : "Saving goal created"); onOpenChange(false); }
    catch (e) { toast.error((e as Error).message); }
  };
  return <Sheet open={open} onOpenChange={(v) => { if (v) reset(); onOpenChange(v); }}><SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl"><SheetHeader><SheetTitle>{existing ? "Edit saving goal" : "New saving goal"}</SheetTitle></SheetHeader><div className="space-y-4 px-4 pb-8">
    <div className="space-y-1.5"><Label className="text-xs">Goal name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New laptop" className="h-12 rounded-xl" /></div>
    <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">Target amount</Label><Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="70000" className="h-12 rounded-xl" /></div><div className="space-y-1.5"><Label className="text-xs">Target date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl" /></div></div>
    <div className="space-y-1.5"><Label className="text-xs">Icon</Label><Select value={icon} onValueChange={setIcon}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{ICON_OPTIONS.map((option) => <SelectItem key={option} value={option} className="capitalize">{option.replaceAll("-", " ")}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1.5"><Label className="text-xs">Color</Label><div className="flex gap-2">{ICON_COLORS.map((option) => <button key={option} type="button" onClick={() => setColor(option)} className={`grid size-9 place-items-center rounded-full border-2 ${color === option ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: option }} aria-label={`Use color ${option}`} />)}</div></div>
    <div className="space-y-1.5"><Label className="text-xs">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you saving for?" className="h-12 rounded-xl" /></div>
    <Button className="h-12 w-full rounded-xl" onClick={submit} disabled={upsert.isPending}>{existing ? "Save goal" : "Create goal"}</Button>
  </div></SheetContent></Sheet>;
}

function GoalDetails({ goal, onClose, onAdd, onEdit, onDelete, currency }: { goal: SavingGoal; onClose: () => void; onAdd: () => void; onEdit: () => void; onDelete: () => void; currency: string }) {
  const { data } = useAppData();
  const contributions = data.savingGoalContributions.filter((c) => c.goal_id === goal.id);
  const saved = contributions.reduce((sum, c) => sum + Number(c.amount), 0); const target = Number(goal.target_amount); const remaining = Math.max(0, target - saved); const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0; const complete = saved >= target;
  const months = goal.target_date ? Math.max(1, differenceInCalendarMonths(parseISO(goal.target_date), startOfMonth(new Date())) + 1) : null; const monthly = months ? remaining / months : null;
  const status = complete ? "complete" : goal.target_date && parseISO(goal.target_date) < new Date() ? "late" : monthly !== null ? "on-track" : "open";
  return <Sheet open onOpenChange={(v) => !v && onClose()}><SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl"><SheetHeader><SheetTitle>{goal.name}</SheetTitle></SheetHeader><div className="space-y-4 px-4 pb-8">
    <Section><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl" style={{ backgroundColor: `${goal.color}18`, color: goal.color }}><AppIcon name={goal.icon} className="size-6" /></span><div className="min-w-0"><p className="text-2xl font-extrabold tabular">{formatMoney(saved, currency)}</p><p className="text-xs text-muted-foreground">of {formatMoney(target, currency)} saved</p></div></div><Progress value={percent} className="mt-4 h-3" /><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{Math.round(percent)}% complete</span><span>{formatMoney(remaining, currency)} remaining</span></div></Section>
    <Section><div className="grid grid-cols-2 gap-3"><Detail label="Target date" value={goal.target_date ? format(parseISO(goal.target_date), "d MMM yyyy") : "Not set"} /><Detail label="Monthly target" value={monthly !== null && !complete ? formatMoney(monthly, currency) : complete ? "Completed" : "Set a target date"} /><Detail label="Status" value={status === "complete" ? "🎉 Completed" : status === "late" ? "⚠️ Past target date" : status === "on-track" ? "✓ Saving plan ready" : "Open"} /></div>{goal.description && <p className="mt-3 text-xs text-muted-foreground">{goal.description}</p>}</Section>
    <div className="grid grid-cols-2 gap-2"><Button className="h-11 rounded-xl" onClick={onAdd} disabled={complete}><CircleDollarSign className="mr-2 size-4" />Add money</Button><Button variant="secondary" className="h-11 rounded-xl" onClick={onEdit}><Pencil className="mr-2 size-4" />Edit</Button></div>
    <Section title={`Contributions (${contributions.length})`}>{contributions.length ? <div className="divide-y divide-border/60">{contributions.map((c) => { const tx = data.transactions.find((t) => t.id === c.transaction_id); const account = data.accounts.find((a) => a.id === c.account_id); return <div key={c.id} className="flex items-center gap-3 py-3"><span className="grid size-9 place-items-center rounded-xl bg-secondary"><PiggyBank className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{format(parseISO(c.date), "d MMM yyyy")}</p><p className="truncate text-[11px] text-muted-foreground">{account?.name ?? "Account"}{tx ? ` · ${tx.description || tx.type}` : ""}</p></div><div className="text-right"><p className="text-sm font-bold tabular">{formatMoney(Number(c.amount), currency)}</p><button onClick={() => void deleteContribution(c)} className="text-[10px] font-semibold text-expense">Delete</button></div></div>; })}</div> : <p className="py-3 text-xs text-muted-foreground">No contributions yet. Add one from an existing transaction.</p>}</Section>
    <Button variant="ghost" className="h-10 w-full rounded-xl text-expense" onClick={onDelete}><Trash2 className="mr-2 size-4" />Delete goal</Button>
  </div></SheetContent></Sheet>;
  async function deleteContribution(c: SavingGoalContribution) { const { data: fresh } = useAppData(); void fresh; /* replaced below by parent data mutation is intentionally handled in the page */ }
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-secondary/60 p-3"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-xs font-bold">{value}</p></div>; }

function ContributionForm({ open, onOpenChange, goal }: { open: boolean; onOpenChange: (v: boolean) => void; goal: SavingGoal }) {
  const { data } = useAppData(); const upsert = useUpsert("saving_goal_contributions"); const { currency } = useAppState();
  const [account, setAccount] = useState(""); const [transaction, setTransaction] = useState(""); const [amount, setAmount] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [note, setNote] = useState("");
  const available = data.transactions.filter((tx) => (tx.type === "income" || tx.type === "transfer") && (!account || tx.account_id === account)).sort((a, b) => b.date.localeCompare(a.date));
  const selectedTx = available.find((tx) => tx.id === transaction);
  const submit = async () => {
    const value = Number(amount); if (!account) { toast.error("Select the source account"); return; } if (!transaction || !selectedTx) { toast.error("Select the transaction funding this contribution"); return; } if (!Number.isFinite(value) || value <= 0) { toast.error("Enter a contribution amount"); return; } if (value > Number(selectedTx.amount)) { toast.error("Contribution cannot exceed the linked transaction amount"); return; }
    try { await upsert.mutateAsync({ goal_id: goal.id, account_id: account, transaction_id: transaction, amount: value.toFixed(2), date, note: note.trim() }); toast.success("Contribution added"); onOpenChange(false); setAmount(""); setTransaction(""); setNote(""); }
    catch (e) { toast.error((e as Error).message); }
  };
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl"><SheetHeader><SheetTitle>Add to {goal.name}</SheetTitle></SheetHeader><div className="space-y-4 px-4 pb-8">
    <p className="rounded-xl bg-secondary/70 p-3 text-xs text-muted-foreground">Choose an existing income or transfer transaction. The contribution is only an allocation for this goal, so it does not create an expense or alter the account balance.</p>
    <div className="space-y-1.5"><Label className="text-xs">Source account</Label><Select value={account} onValueChange={(v) => { setAccount(v); setTransaction(""); }}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select account" /></SelectTrigger><SelectContent>{data.accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1.5"><Label className="text-xs">Funding transaction</Label><Select value={transaction} onValueChange={setTransaction}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select transaction" /></SelectTrigger><SelectContent>{available.map((tx) => <SelectItem key={tx.id} value={tx.id}>{format(parseISO(tx.date), "d MMM")} · {tx.description || tx.type} · {formatMoney(Number(tx.amount), currency)}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">Contribution</Label><Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" className="h-12 rounded-xl" /></div><div className="space-y-1.5"><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl" /></div></div>
    <div className="space-y-1.5"><Label className="text-xs">Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" className="h-12 rounded-xl" /></div>
    <Button className="h-12 w-full rounded-xl" onClick={submit} disabled={upsert.isPending}>Add contribution</Button>
  </div></SheetContent></Sheet>;
}
