import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { AppIcon } from "@/components/app/icon";
import { AccountForm } from "@/components/app/account-form";
import { EmptyState, ScreenHeader, Section } from "@/components/app/pieces";
import { useAppData } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { formatMoney } from "@/lib/format";
import { accountBalance, availableAccountBalance, totalBalance, totalAvailableBalance } from "@/lib/finance";

export const Route = createFileRoute("/_shell/accounts/")({
  head: () => ({ meta: [{ title: "Accounts — Paisa Expense Manager" }, { name: "description", content: "Manage your bank, cash, wallet and card accounts and their balances." }, { property: "og:title", content: "Accounts — Paisa Expense Manager" }, { property: "og:description", content: "Manage your bank, cash, wallet and card accounts and their balances." }] }),
  component: AccountsPage,
});

function AccountsPage() {
  const { data } = useAppData();
  const { currency } = useAppState();
  const [open, setOpen] = useState(false);
  const active = data.accounts.filter((a) => a.is_active);
  const archived = data.accounts.filter((a) => !a.is_active);
  const actualTotal = totalBalance(data.accounts, data.transactions, "all");
  const availableTotal = totalAvailableBalance(data.accounts, data.transactions, data.savingsGoals, data.savingsGoalContributions, "all");

  return (
    <div className="space-y-4">
      <ScreenHeader title="Accounts" subtitle={`Actual ${formatMoney(actualTotal, currency)} · Available ${formatMoney(availableTotal, currency)}`} right={<button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground active:scale-95" aria-label="Add account"><Plus className="size-5" /></button>} />
      <Section title="Active">
        {active.length ? <div className="divide-y divide-border/60">{active.map((a) => { const actual = accountBalance(a, data.transactions); const available = availableAccountBalance(a, data.transactions, data.savingsGoals, data.savingsGoalContributions); return <Link key={a.id} to="/accounts/$accountId" params={{ accountId: a.id }} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundColor: a.color }}><AppIcon name={a.icon} className="size-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{a.name}</span><span className="block text-[11px] capitalize text-muted-foreground">{a.type} · {a.currency}</span><span className="block truncate text-[10px] text-muted-foreground">Available {formatMoney(available, a.currency)}</span></span><span className="flex items-center gap-1"><span className="text-right"><span className="block tabular text-sm font-bold">{formatMoney(actual, a.currency)}</span><span className="block text-[10px] text-muted-foreground">actual</span></span><ChevronRight className="size-4 text-muted-foreground" /></span></Link>; })}</div> : <EmptyState text="No accounts yet." />}
      </Section>
      {archived.length > 0 && <Section title="Archived"><div className="divide-y divide-border/60">{archived.map((a) => <Link key={a.id} to="/accounts/$accountId" params={{ accountId: a.id }} className="flex items-center justify-between py-3 opacity-60"><span className="truncate text-sm font-semibold">{a.name}</span><span className="tabular text-sm">{formatMoney(accountBalance(a, data.transactions), a.currency)}</span></Link>)}</div></Section>}
      <AccountForm open={open} onOpenChange={setOpen} />
    </div>
  );
}