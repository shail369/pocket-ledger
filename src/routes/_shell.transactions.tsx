import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Search, SlidersHorizontal, X, WalletCards } from "lucide-react";
import { EmptyState, ScreenHeader, Section, TransactionRow } from "@/components/app/pieces";
import { TransactionForm } from "@/components/app/transaction-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export const Route = createFileRoute("/_shell/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Paisa Expense Manager" },
      { name: "description", content: "Search and filter every expense, income and transfer across your accounts." },
      { property: "og:title", content: "Transactions — Paisa Expense Manager" },
      { property: "og:description", content: "Search and filter every expense, income and transfer across your accounts." },
    ],
  }),
  component: TransactionsPage,
});

const ALL = "__all__";

function TransactionsPage() {
  const { data } = useAppData();
  const { currency } = useAppState();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [account, setAccount] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [parent, setParent] = useState(ALL);
  const [sub, setSub] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const parents = data.categories.filter((c) => !c.parent_id);
  const subs = data.categories.filter((c) => c.parent_id === parent);
  const selectedAccount = data.accounts.find((a) => a.id === account);

  const filtered = useMemo(() => {
    const childIds = new Set(data.categories.filter((c) => c.parent_id === parent).map((c) => c.id));
    return data.transactions.filter((t) => {
      if (query && !t.description.toLowerCase().includes(query.toLowerCase())) return false;
      if (account !== ALL && t.account_id !== account && t.transfer_account_id !== account) return false;
      if (type !== ALL && t.type !== type) return false;
      if (sub !== ALL) {
        if (t.category_id !== sub) return false;
      } else if (parent !== ALL) {
        if (!t.category_id || (t.category_id !== parent && !childIds.has(t.category_id))) return false;
      }
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      const amt = Number(t.amount);
      if (min && amt < Number(min)) return false;
      if (max && amt > Number(max)) return false;
      return true;
    });
  }, [data.transactions, data.categories, query, account, type, parent, sub, from, to, min, max]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 60);
  }, [filtered]);

  const activeFilters =
    [type, parent, sub].filter((v) => v !== ALL).length + [from, to, min, max].filter(Boolean).length;

  const reset = () => {
    setType(ALL);
    setParent(ALL);
    setSub(ALL);
    setFrom("");
    setTo("");
    setMin("");
    setMax("");
  };

  const totalShown = filtered.reduce(
    (a, t) => a + (t.type === "expense" ? -Number(t.amount) : t.type === "income" ? Number(t.amount) : 0),
    0,
  );

  return (
    <div className="space-y-4">
      <ScreenHeader
        title="Transactions"
        subtitle={`${filtered.length} results · net ${formatMoney(totalShown, currency)}`}
        right={
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className="h-10 w-[150px] rounded-xl">
              <WalletCards className="mr-1 size-4 shrink-0" />
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All accounts</SelectItem>
              {data.accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="flex items-center gap-2 rounded-2xl bg-secondary/70 px-3 py-2 text-xs text-muted-foreground">
        <WalletCards className="size-3.5" />
        <span>{selectedAccount ? `Showing ${selectedAccount.name}` : "Showing all accounts"}</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search description"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-secondary"
          aria-label="Filters"
        >
          <SlidersHorizontal className="size-4" />
          {activeFilters > 0 && (
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {activeFilters > 0 && (
        <button onClick={reset} className="flex items-center gap-1 text-xs font-semibold text-primary">
          <X className="size-3.5" /> Clear filters
        </button>
      )}

      {grouped.length ? (
        grouped.map(([date, list]) => (
          <Section key={date} title={format(parseISO(date), "EEEE, d MMM yyyy")}>
            <div className="divide-y divide-border/60">
              {list.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} onClick={() => setEditing(tx)} />
              ))}
            </div>
          </Section>
        ))
      ) : (
        <Section>
          <EmptyState text="No transactions match these filters." />
        </Section>
      )}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-8">
            <FilterSelect label="Type" value={type} onChange={setType}>
              {["expense", "income", "transfer"].map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Category"
              value={parent}
              onChange={(v) => {
                setParent(v);
                setSub(ALL);
              }}
            >
              {parents.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </FilterSelect>
            {subs.length > 0 && (
              <FilterSelect label="Subcategory" value={sub} onChange={setSub}>
                {subs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </FilterSelect>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">From</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Min amount</Label>
                <Input inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max amount</Label>
                <Input inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="h-12 rounded-xl" onClick={reset}>
                Reset
              </Button>
              <Button className="h-12 rounded-xl" onClick={() => setFiltersOpen(false)}>
                Show {filtered.length}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <TransactionForm open={!!editing} onOpenChange={(v) => !v && setEditing(null)} existing={editing} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 w-full rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {children}
        </SelectContent>
      </Select>
    </div>
  );
}
