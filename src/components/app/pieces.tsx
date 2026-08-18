import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { AppIcon } from "./icon";
import { formatMoney } from "@/lib/format";
import { useAppState } from "@/lib/app-state";
import { useAppData, useRemove } from "@/lib/data";
import type { Transaction } from "@/lib/types";

export function Section({ title, subtitle, action, children, className = "" }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border/60 ${className}`}>{(title || action) && <header className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><div className="min-w-0"><h2 className="truncate text-sm font-bold">{title}</h2>{subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}</div>{action}</header>}{children}</section>;
}
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) { return <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pb-1"><div className="min-w-0"><h1 className="truncate text-xl font-extrabold tracking-tight">{title}</h1>{subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}</div>{right}</header>; }
export function TransactionRow({ tx, onClick }: { tx: Transaction; onClick?: () => void }) {
  const { currency } = useAppState(); const { data } = useAppData(); const remove = useRemove("transactions");
  const account = data.accounts.find((a) => a.id === tx.account_id); const toAccount = data.accounts.find((a) => a.id === tx.transfer_account_id); const category = data.categories.find((c) => c.id === tx.category_id); const parent = category?.parent_id ? data.categories.find((c) => c.id === category.parent_id) : undefined;
  const tone = tx.type === "income" ? "text-income" : tx.type === "expense" ? "text-expense" : "text-muted-foreground";
  const bubble = tx.type === "income" ? "bg-income-soft text-income" : tx.type === "transfer" ? "bg-secondary text-muted-foreground" : "bg-expense-soft text-expense";
  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!window.confirm(`Delete this ${tx.type} transaction? This cannot be undone.`)) return;
    try {
      await remove.mutateAsync(tx.id);
      toast.success("Transaction deleted");
    } catch (e) {
      toast.error((e as Error).message || "Failed to delete transaction");
    }
  };
  return <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-2xl px-1 py-2.5"><button onClick={onClick} className="col-span-3 grid min-w-0 grid-cols-subgrid text-left active:bg-secondary/60"><span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${bubble}`}>{tx.type === "transfer" ? <ArrowLeftRight className="size-4" /> : <AppIcon name={parent?.icon ?? category?.icon} className="size-4" />}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{tx.description}</span><span className="block truncate text-[11px] text-muted-foreground">{tx.type === "transfer" ? `${account?.name ?? "—"} → ${toAccount?.name ?? "—"}` : `${category?.name ?? "Uncategorised"} · ${account?.name ?? "—"}`} · {format(parseISO(tx.date), "d MMM")}</span></span><span className="shrink-0 text-right"><span className={`tabular block text-sm font-bold ${tone}`}>{tx.type === "income" ? "+" : tx.type === "expense" ? "−" : ""}{formatMoney(Number(tx.amount), currency)}</span><span className="flex items-center justify-end gap-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{tx.type === "income" ? <ArrowDownLeft className="size-3" /> : tx.type === "expense" ? <ArrowUpRight className="size-3" /> : null}{tx.type}</span></span></button><button type="button" aria-label="Delete transaction" title="Delete transaction" onClick={handleDelete} disabled={remove.isPending} className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"><Trash2 className="size-4" /></button></div>;
}
export function StatCard({ label, value, tone = "default", hint }: { label: string; value: string; tone?: "default" | "income" | "expense" | "primary" | "warning"; hint?: string }) { const toneClass = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : "text-foreground"; return <div className="rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border/60"><p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p><p className={`tabular mt-0.5 truncate text-base font-extrabold ${toneClass}`}>{value}</p>{hint && <p className="truncate text-[10px] text-muted-foreground">{hint}</p>}</div>; }
export function EmptyState({ text }: { text: string }) { return <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>; }
