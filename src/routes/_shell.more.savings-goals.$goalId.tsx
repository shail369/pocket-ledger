import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Pencil, Plus, Trash2, Archive, Pause, Play, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Section } from "@/components/app/pieces";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAppData, useRemove, useSavingsGoalContribution, useUpsert } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { availableAccountBalance, goalContributions, goalProgress } from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import type { SavingsGoal, SavingsGoalContribution } from "@/lib/types";

export const Route = createFileRoute("/_shell/more/savings-goals/$goalId")({
  head: () => ({ meta: [{ title: "Savings Goal — Paisa Expense Manager" }] }),
  component: SavingsGoalDetailPage,
});

function SavingsGoalDetailPage() {
  const { goalId } = Route.useParams();
  const navigate = useNavigate();
  const { data, error, isLoading } = useAppData();
  const { currency } = useAppState();
  const removeGoal = useRemove("savings_goals");
  const removeContribution = useRemove("savings_goal_contributions");
  const upsert = useUpsert("savings_goals");
  const [contributionOpen, setContributionOpen] = useState(false);
  const [editingContribution, setEditingContribution] = useState<SavingsGoalContribution | null>(null);

  const goal = data.savingsGoals.find((g) => g.id === goalId);
  const account = goal ? data.accounts.find((a) => a.id === goal.account_id) : undefined;
  const contributions = goal ? goalContributions(goal.id, data.savingsGoalContributions) : [];
  const progress = goal ? goalProgress(goal, data.savingsGoalContributions) : null;
  const available = account && goal ? availableAccountBalance(account, data.transactions, data.savingsGoals, data.savingsGoalContributions) : 0;

  const deleteGoal = async () => {
    if (!goal) return;
    if (!confirm(`Delete ${goal.name}?${progress && progress.saved > 0 ? `\n\n${formatMoney(progress.saved, currency)} is allocated and will be released.` : ""}`)) return;
    try { await removeGoal.mutateAsync(goal.id); toast.success("Savings goal deleted"); await navigate({ to: "/more/savings-goals" }); } catch (e) { toast.error((e as Error).message); }
  };

  const updateStatus = async (status: SavingsGoal["status"]) => {
    if (!goal) return;
    try { await upsert.mutateAsync({ id: goal.id, status }); toast.success(status === "archived" ? "Goal archived" : status === "paused" ? "Goal paused" : "Goal resumed"); if (status === "archived") await navigate({ to: "/more/savings-goals" }); } catch (e) { toast.error((e as Error).message); }
  };

  const deleteContribution = async (contribution: SavingsGoalContribution) => {
    if (!confirm(`Delete this ${formatMoney(Number(contribution.amount), currency)} contribution?`)) return;
    try { await removeContribution.mutateAsync(contribution.id); toast.success("Contribution deleted"); } catch (e) { toast.error((e as Error).message); }
  };

  if (isLoading) return <div className="space-y-4"><div className="h-10 animate-pulse rounded-2xl bg-secondary" /><div className="h-64 animate-pulse rounded-3xl bg-secondary" /></div>;
  if (error || !goal || !progress) return <Section><div className="space-y-2"><p className="font-bold">Savings Goal</p><p className="text-sm text-muted-foreground">This goal could not be loaded.</p><Link to="/more/savings-goals" className="inline-flex text-sm font-semibold text-primary">Back to Savings Goals</Link></div></Section>;

  return <div className="space-y-4">
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"><Link to="/more/savings-goals" className="grid size-9 place-items-center rounded-full bg-secondary"><ChevronLeft className="size-5" /></Link><div className="min-w-0"><h1 className="truncate text-lg font-extrabold">{goal.icon} {goal.name}</h1><p className="truncate text-[11px] text-muted-foreground">{account?.name ?? "Unknown account"}</p></div><button onClick={() => setContributionOpen(true)} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Add contribution"><Plus className="size-5" /></button></header>

    <Section>
      <div className="flex items-center justify-between gap-3"><div><p className="text-2xl font-extrabold tabular">{formatMoney(progress.saved, currency)}</p><p className="text-xs text-muted-foreground">of {formatMoney(progress.target, currency)}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold capitalize">{goal.status}</span></div>
      <Progress value={Math.min(100, progress.percent)} className="mt-4 h-3" />
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><span>{Math.min(100, progress.percent).toFixed(1)}%</span><span>{progress.remaining > 0 ? `${formatMoney(progress.remaining, currency)} remaining` : "Target reached"}</span></div>
    </Section>

    <div className="grid grid-cols-2 gap-2"><Section><p className="text-[11px] text-muted-foreground">Target</p><p className="mt-1 font-extrabold tabular">{formatMoney(progress.target, currency)}</p></Section><Section><p className="text-[11px] text-muted-foreground">Saved</p><p className="mt-1 font-extrabold tabular">{formatMoney(progress.saved, currency)}</p></Section><Section><p className="text-[11px] text-muted-foreground">Remaining</p><p className="mt-1 font-extrabold tabular">{formatMoney(progress.remaining, currency)}</p></Section><Section><p className="text-[11px] text-muted-foreground">Available in account</p><p className="mt-1 font-extrabold tabular">{formatMoney(available, currency)}</p></Section></div>

    <Section title="Goal information"><div className="grid grid-cols-2 gap-y-3 text-xs"><div><p className="text-muted-foreground">Target date</p><p className="mt-0.5 font-semibold">{goal.target_date ? format(parseISO(goal.target_date), "d MMM yyyy") : "Not set"}</p></div><div><p className="text-muted-foreground">Priority</p><p className="mt-0.5 font-semibold capitalize">{goal.priority}</p></div><div><p className="text-muted-foreground">Type</p><p className="mt-0.5 font-semibold capitalize">{goal.goal_type}</p></div><div><p className="text-muted-foreground">Account</p><p className="mt-0.5 font-semibold truncate">{account?.name ?? "Unknown"}</p></div></div>{goal.description ? <p className="mt-4 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">{goal.description}</p> : null}</Section>

    <Section title="Contributions"><div className="divide-y divide-border/60">{contributions.length ? contributions.map((contribution) => <div key={contribution.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0 flex-1"><p className="text-sm font-bold tabular">{formatMoney(Number(contribution.amount), currency)}</p><p className="truncate text-[11px] text-muted-foreground">{format(parseISO(contribution.date), "d MMM yyyy")}{contribution.note ? ` · ${contribution.note}` : ""}</p></div><button onClick={() => { setEditingContribution(contribution); setContributionOpen(true); }} className="grid size-8 place-items-center rounded-lg bg-secondary" aria-label="Edit contribution"><Pencil className="size-3.5" /></button><button onClick={() => void deleteContribution(contribution)} className="grid size-8 place-items-center rounded-lg bg-expense/10 text-expense" aria-label="Delete contribution"><Trash2 className="size-3.5" /></button></div>) : <p className="text-sm text-muted-foreground">No contributions yet.</p>}</div></Section>

    <Section title="Goal controls"><div className="grid grid-cols-2 gap-2"><button onClick={() => updateStatus(goal.status === "paused" ? "active" : "paused")} className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-xs font-semibold">{goal.status === "paused" ? <Play className="size-4" /> : <Pause className="size-4" />}{goal.status === "paused" ? "Resume" : "Pause"}</button>{goal.status === "completed" ? <button onClick={() => updateStatus("archived")} className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-xs font-semibold"><Archive className="size-4" /> Archive</button> : <span className="flex items-center justify-center gap-2 rounded-xl bg-income/10 py-3 text-xs font-semibold text-income"><CheckCircle2 className="size-4" /> {goal.status === "active" ? "Saving" : "Paused"}</span>}</div><button onClick={deleteGoal} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-expense/10 py-3 text-xs font-semibold text-expense"><Trash2 className="size-4" /> Delete goal</button></Section>

    <ContributionForm open={contributionOpen} onOpenChange={(open) => { setContributionOpen(open); if (!open) setEditingContribution(null); }} goal={goal} existing={editingContribution} />
  </div>;
}

function ContributionForm({ open, onOpenChange, goal, existing }: { open: boolean; onOpenChange: (v: boolean) => void; goal: SavingsGoal; existing: SavingsGoalContribution | null }) {
  const { data } = useAppData();
  const mutation = useSavingsGoalContribution(existing?.id);
  const { currency } = useAppState();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const account = data.accounts.find((a) => a.id === goal.account_id);
  const available = account ? availableAccountBalance(account, data.transactions, data.savingsGoals, data.savingsGoalContributions) : 0;

  useEffect(() => { if (!open) return; setAmount(existing ? String(existing.amount) : ""); setDate(existing?.date ?? new Date().toISOString().slice(0, 10)); setNote(existing?.note ?? ""); }, [open, existing]);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) { toast.error("Enter a contribution amount"); return; }
    if (!existing && Number(amount) > available) { toast.error(`Not enough available balance. Available: ${formatMoney(available, currency)}`); return; }
    try { await mutation.mutateAsync({ goalId: goal.id, amount: Number(amount), date, note: note.trim() }); toast.success(existing ? "Contribution updated" : "Contribution added"); onOpenChange(false); } catch (e) { toast.error((e as Error).message); }
  };

  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl"><SheetHeader><SheetTitle>{existing ? "Edit contribution" : "Add contribution"}</SheetTitle></SheetHeader><div className="space-y-4 px-4 pb-8"><div className="rounded-2xl bg-secondary p-3 text-xs"><span className="text-muted-foreground">Available in account: </span><span className="font-bold tabular">{formatMoney(available, currency)}</span></div><div className="space-y-1.5"><Label className="text-xs">Amount</Label><Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl" placeholder="5000" /></div><div className="space-y-1.5"><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl" /></div><div className="space-y-1.5"><Label className="text-xs">Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} className="h-12 rounded-xl" placeholder="Optional" /></div><Button className="h-12 w-full rounded-xl" onClick={submit} disabled={mutation.isPending}>{existing ? "Save contribution" : "Add Contribution"}</Button></div></SheetContent></Sheet>;
}
