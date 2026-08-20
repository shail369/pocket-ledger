import { createFileRoute, Link, useNavigate } from "@/router";
import { useMemo, useState } from "react";
import { ChevronLeft, Pencil, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppIcon } from "@/components/app/icon";
import { AccountForm } from "@/components/app/account-form";
import { SpendingAreaChart } from "@/components/app/charts";
import { EmptyState, Section, StatCard, TransactionRow } from "@/components/app/pieces";
import { Button } from "@/components/ui/button";
import { useAppData, useRemove, useUpsert } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { formatMoney } from "@/lib/format";
import { accountBalance, dailySeries, periodTransactions, resolveRange, totals } from "@/lib/finance";

export const Route = createFileRoute("/_shell/accounts/$accountId")({
  head: () => ({ meta: [
    { title: "Account details — Paisa Expense Manager" },
    { name: "description", content: "Balance, income, expenses and transaction history for a single account." },
    { property: "og:title", content: "Account details — Paisa Expense Manager" },
    { property: "og:description", content: "Balance, income, expenses and transaction history for a single account." },
  ]}),
  component: AccountDetail,
});

function AccountDetail() {
  const { accountId } = Route.useParams();
  const { data } = useAppData();
  const { currency } = useAppState();
  const navigate = useNavigate();
  const upsert = useUpsert("accounts");
  const remove = useRemove("accounts");
  const [edit, setEdit] = useState(false);
  const account = data.accounts.find((a) => a.id === accountId);
  const range = resolveRange("this_month");
  const scoped = useMemo(() => periodTransactions(data.transactions, accountId, range), [data.transactions, accountId, range]);
  const t = totals(scoped);
  const history = data.transactions.filter((tx) => tx.account_id === accountId || tx.transfer_account_id === accountId).slice(0, 40);
  if (!account) return <EmptyState text="Account not found." />;
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Link to="/accounts" className="grid size-9 place-items-center rounded-full bg-secondary"><ChevronLeft className="size-5" /></Link>
        <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-extrabold">{account.name}</h1><p className="text-[11px] capitalize text-muted-foreground">{account.type} · {account.is_active ? "Active" : "Archived"}</p></div>
        <span className="grid size-10 place-items-center rounded-2xl text-white" style={{ backgroundColor: account.color }}><AppIcon name={account.icon} className="size-4" /></span>
      </header>
      <div className="rounded-3xl bg-primary p-4 text-primary-foreground"><p className="text-xs opacity-80">Current balance</p><p className="tabular text-2xl font-extrabold">{formatMoney(accountBalance(account, data.transactions), account.currency)}</p><p className="mt-1 text-[11px] opacity-80">Opening {formatMoney(Number(account.opening_balance), account.currency)}</p></div>
      <div className="grid grid-cols-3 gap-2"><StatCard label="Income" value={formatMoney(t.income, currency, true)} tone="income" /><StatCard label="Expenses" value={formatMoney(t.expenses, currency, true)} tone="expense" /><StatCard label="Savings" value={formatMoney(t.savings, currency, true)} tone="primary" /></div>
      <Section title="Spending this month"><SpendingAreaChart data={dailySeries(scoped, range)} /></Section>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" className="h-11 rounded-xl" onClick={() => setEdit(true)}><Pencil className="size-4" /> Edit</Button>
        <Button variant="secondary" className="h-11 rounded-xl" onClick={async () => { await upsert.mutateAsync({ id: account.id, is_active: !account.is_active }); toast.success(account.is_active ? "Account archived" : "Account restored"); }}><Archive className="size-4" /> {account.is_active ? "Archive" : "Restore"}</Button>
        <Button variant="destructive" className="h-11 rounded-xl" onClick={async () => { if (!confirm("Delete this account and all its transactions?")) return; await remove.mutateAsync(account.id); toast.success("Account deleted"); void navigate({ to: "/accounts" }); }}><Trash2 className="size-4" /> Delete</Button>
      </div>
      <Section title="Transaction history">{history.length ? <div className="divide-y divide-border/60">{history.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}</div> : <EmptyState text="No transactions yet." />}</Section>
      <AccountForm open={edit} onOpenChange={setEdit} existing={account} />
    </div>
  );
}
