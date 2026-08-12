import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Section } from "@/components/app/pieces";
import { MonthlyComparisonChart } from "@/components/app/charts";
import { AppIcon } from "@/components/app/icon";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { formatMoney, percent } from "@/lib/format";
import { categoryBreakdown, monthlySeries, scopeTransactions } from "@/lib/finance";

export const Route = createFileRoute("/_shell/more/reports")({
  head: () => ({ meta: [{ title: "Reports — Paisa Expense Manager" }, { name: "description", content: "Monthly and category reports scoped to the selected account." }] }),
  component: ReportsPage,
});

const TABS = ["monthly", "category"] as const;
type Tab = (typeof TABS)[number];

function ReportsPage() {
  const { data } = useAppData();
  const { accountId, currency } = useAppState();
  const [tab, setTab] = useState<Tab>("monthly");
  const scoped = useMemo(() => scopeTransactions(data.transactions, accountId), [data.transactions, accountId]);
  const months = monthlySeries(scoped, 6);
  const thisYear = String(new Date().getFullYear());
  const yearTx = scoped.filter((t) => t.date.startsWith(thisYear));
  const nodes = categoryBreakdown(yearTx, data.categories);

  const exportCsv = () => {
    const rows = [["date", "description", "type", "amount", "account", "category"], ...scoped.map((t) => [t.date, `"${t.description.replace(/"/g, '""')}"`, t.type, String(t.amount), `"${data.accounts.find((a) => a.id === t.account_id)?.name ?? ""}"`, `"${data.categories.find((c) => c.id === t.category_id)?.name ?? ""}"`])];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-4">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <Link to="/" className="grid size-9 place-items-center rounded-full bg-secondary"><ChevronLeft className="size-5" /></Link>
        <h1 className="truncate text-lg font-extrabold">Reports</h1>
        <Button variant="secondary" className="h-10 rounded-xl" onClick={exportCsv}><Download className="size-4" /> CSV</Button>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold capitalize ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{t}</button>)}
      </div>

      {tab === "monthly" && <>
        <Section title="Income vs expenses" subtitle="Last 6 months"><MonthlyComparisonChart data={months} /></Section>
        <Section title="Monthly summary">
          <ul className="divide-y divide-border/60">
            {[...months].reverse().map((m) => {
              const net = m.income - m.expense;
              return (
                <li key={m.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <span className="truncate text-sm font-semibold">{format(parseISO(`${m.key}-01`), "MMMM yyyy")}</span>
                  <span className={`tabular text-sm font-semibold ${net >= 0 ? "text-income" : "text-expense"}`}>
                    {net >= 0 ? "+" : "−"}{formatMoney(Math.abs(net), currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      </>}

      {tab === "category" && <Section title="Category report" subtitle={`Year ${thisYear}`}>
        {nodes.length ? <ul className="divide-y divide-border/60">{nodes.map((n) => <li key={n.id} className="py-2.5"><div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary"><AppIcon name={n.icon} className="size-4" /></span><span className="min-w-0 truncate text-sm font-semibold">{n.name}</span><span className="text-right"><span className="tabular block text-sm font-bold">{formatMoney(n.amount, currency)}</span><span className="block text-[11px] text-muted-foreground">{percent(n.percent)}</span></span></div></li>)}</ul> : <EmptyState text="No spending recorded this year." />}
      </Section>}
    </div>
  );
}