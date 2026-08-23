import { createFileRoute } from "@/router";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Gem, Home, Landmark, MoreHorizontal, Pencil, Plus, Trash2, Wallet, X } from "lucide-react";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { ScreenHeader, Section, EmptyState } from "@/components/app/pieces";
import { useAppData, useRemove, useUpsert } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { accountBalance } from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import type { Asset, AssetCategory, Liability, LiabilityCategory } from "@/lib/types";

export const Route = createFileRoute("/_shell/more/assets")({ component: AssetsPage });

type Group = { key: string; label: string; icon: typeof Wallet; kind: "asset" | "liability"; category: AssetCategory | LiabilityCategory };

type BalanceItem = { group: Group; value: number };

const ASSET_GROUPS: Group[] = [
  { key: "stocks", label: "Stocks", icon: Landmark, kind: "asset", category: "stocks" },
  { key: "mutual_funds", label: "Mutual Funds", icon: Wallet, kind: "asset", category: "mutual_funds" },
  { key: "property", label: "Land & Property", icon: Home, kind: "asset", category: "property" },
  { key: "cash", label: "Cash & Accounts", icon: Wallet, kind: "asset", category: "other" },
  { key: "precious_metals", label: "Gold & Precious Metals", icon: Gem, kind: "asset", category: "precious_metals" },
  { key: "other", label: "Other Assets", icon: MoreHorizontal, kind: "asset", category: "other" },
];

const LIABILITY_GROUPS: Group[] = [
  { key: "loans", label: "Loans", icon: Landmark, kind: "liability", category: "loans" },
  { key: "credit_cards", label: "Credit Cards", icon: Wallet, kind: "liability", category: "credit_cards" },
  { key: "other", label: "Other Liabilities", icon: MoreHorizontal, kind: "liability", category: "other" },
];

const COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)",
  "var(--chart-5)", "var(--chart-6)", "var(--chart-7)", "var(--chart-8)",
];

function AssetsPage() {
  const { data } = useAppData();
  const { currency } = useAppState();
  const [selected, setSelected] = useState<Group | null>(null);

  const totalAccounts = data.accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + accountBalance(a, data.transactions), 0);

  const assetValues: BalanceItem[] = ASSET_GROUPS.map((group) => {
    if (group.key === "cash") return { group, value: totalAccounts };
    return {
      group,
      value: data.assets
        .filter((a) => a.category === group.category)
        .reduce((sum, a) => sum + Number(a.value), 0),
    };
  });

  const liabilityValues: BalanceItem[] = LIABILITY_GROUPS.map((group) => ({
    group,
    value: data.liabilities
      .filter((l) => l.category === group.category)
      .reduce((sum, l) => sum + Number(l.value), 0),
  }));

  const assetTotal = assetValues.reduce((sum, item) => sum + item.value, 0);
  const liabilityTotal = liabilityValues.reduce((sum, item) => sum + item.value, 0);
  const netWorth = assetTotal - liabilityTotal;

  if (selected) return <GroupDetail group={selected} onBack={() => setSelected(null)} currency={currency} />;

  return (
    <div className="space-y-4">
      <ScreenHeader title="Assets & Liabilities" subtitle="Your current net worth" />

      <div className="rounded-3xl bg-primary p-4 text-primary-foreground shadow-sm">
        <p className="text-xs opacity-80">Net worth</p>
        <p className="tabular text-2xl font-extrabold">{formatMoney(netWorth, currency)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-primary-foreground/10 px-3 py-2">
            <p className="text-[10px] opacity-75">Assets</p>
            <p className="tabular text-sm font-bold">{formatMoney(assetTotal, currency, true)}</p>
          </div>
          <div className="rounded-2xl bg-primary-foreground/10 px-3 py-2">
            <p className="text-[10px] opacity-75">Liabilities</p>
            <p className="tabular text-sm font-bold">{formatMoney(liabilityTotal, currency, true)}</p>
          </div>
        </div>
      </div>

      <BalanceBreakdown
        title="Assets"
        subtitle="Where your wealth is held"
        total={assetTotal}
        items={assetValues}
        currency={currency}
        kind="asset"
        onSelect={setSelected}
      />

      <BalanceBreakdown
        title="Liabilities"
        subtitle="What you currently owe"
        total={liabilityTotal}
        items={liabilityValues}
        currency={currency}
        kind="liability"
        onSelect={setSelected}
      />
    </div>
  );
}

function BalanceBreakdown({
  title,
  subtitle,
  total,
  items,
  currency,
  kind,
  onSelect,
}: {
  title: string;
  subtitle: string;
  total: number;
  items: BalanceItem[];
  currency: string;
  kind: "asset" | "liability";
  onSelect: (group: Group) => void;
}) {
  const pieData = useMemo(
    () => items.filter((item) => item.value > 0).map((item) => ({ name: item.group.label, value: item.value })),
    [items],
  );

  return (
    <Section title={title} subtitle={subtitle}>
      <div className="flex items-center gap-4">
        <div className="relative size-28 shrink-0 [&_.recharts-sector:focus]:outline-none">
          {pieData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={36}
                  outerRadius={54}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="size-full rounded-full border-[12px] border-secondary" />
          )}
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Total</p>
              <p className="tabular text-sm font-bold">{formatMoney(total, currency, true)}</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {items.slice(0, 4).map(({ group, value }, index) => (
            <div key={group.key} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="truncate text-xs">{group.label}</span>
              <span className="tabular shrink-0 text-xs font-semibold">{formatMoney(value, currency, true)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 divide-y divide-border/60">
        {items.map(({ group, value }) => (
          <button
            key={group.key}
            type="button"
            onClick={() => onSelect(group)}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5 text-left"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <group.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{group.label}</span>
              <span className="block text-[11px] text-muted-foreground">
                {value === 0 ? "No balance" : kind === "asset" ? "Owned" : "Outstanding"}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <span className="tabular text-sm font-bold">{formatMoney(value, currency)}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </span>
          </button>
        ))}
      </div>
    </Section>
  );
}

function GroupDetail({ group, onBack, currency }: { group: Group; onBack: () => void; currency: string }) {
  const { data } = useAppData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | Liability | null>(null);
  const remove = useRemove(group.kind === "asset" ? "assets" : "liabilities");
  const rows = group.kind === "asset"
    ? data.assets.filter((a) => a.category === group.category)
    : data.liabilities.filter((l) => l.category === group.category);
  const cash = group.key === "cash";
  const total = cash
    ? data.accounts.filter((a) => a.is_active).reduce((sum, a) => sum + accountBalance(a, data.transactions), 0)
    : rows.reduce((sum, row) => sum + Number(row.value), 0);
  const Icon = group.icon;

  const handleDelete = async (row: Asset | Liability) => {
    if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return;
    try {
      await remove.mutateAsync(row.id);
      toast.success(`${row.name} deleted`);
    } catch (e) {
      toast.error((e as Error).message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <ScreenHeader
        title={group.label}
        subtitle={formatMoney(total, currency)}
        right={
          <button type="button" onClick={onBack} className="grid size-10 place-items-center rounded-full bg-secondary hover:bg-secondary/80" aria-label="Back">
            <ArrowLeft className="size-5" />
          </button>
        }
      />
      <Section title={group.key === "cash" ? "Accounts" : "Holdings"}>
        {cash ? (
          <div className="divide-y divide-border/60">
            {data.accounts.filter((a) => a.is_active).map((account) => (
              <div key={account.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3.5">
                <span className="grid size-10 place-items-center rounded-2xl bg-secondary"><Wallet className="size-4" /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-semibold">{account.name}</span><span className="block text-[11px] capitalize text-muted-foreground">{account.type}</span></span>
                <span className="tabular text-sm font-bold">{formatMoney(accountBalance(account, data.transactions), account.currency)}</span>
              </div>
            ))}
          </div>
        ) : rows.length ? (
          <div className="divide-y divide-border/60">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary"><Icon className="size-4" /></span>
                <span className="min-w-0 truncate text-sm font-semibold">{row.name}</span>
                <span className="tabular text-sm font-bold">{formatMoney(Number(row.value), currency)}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => { setEditing(row); setFormOpen(true); }} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Edit ${row.name}`}><Pencil className="size-3.5" /></button>
                  <button type="button" onClick={() => void handleDelete(row)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-expense/10 hover:text-expense" aria-label={`Delete ${row.name}`}><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState text={`No ${group.label.toLowerCase()} yet.`} />}
        {!cash && <button type="button" onClick={() => { setEditing(null); setFormOpen(true); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-sm font-semibold hover:bg-secondary/80"><Plus className="size-4" />Add {group.kind === "asset" ? "Asset" : "Liability"}</button>}
      </Section>
      {formOpen && <BalanceItemForm group={group} item={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />}
    </div>
  );
}

function BalanceItemForm({ group, item, onClose }: { group: Group; item: Asset | Liability | null; onClose: () => void }) {
  const upsert = useUpsert(group.kind === "asset" ? "assets" : "liabilities");
  const [name, setName] = useState(item?.name ?? "");
  const [value, setValue] = useState(item ? String(item.value) : "");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(value);
    if (!name.trim() || !Number.isFinite(amount) || amount < 0) { toast.error("Enter a name and a valid value"); return; }
    try {
      await upsert.mutateAsync({ ...(item ? { id: item.id } : {}), name: name.trim(), category: group.category, value: amount });
      toast.success(item ? "Updated" : "Added");
      onClose();
    } catch (err) { toast.error((err as Error).message || "Failed to save"); }
  };
  return <div className="fixed inset-0 z-50 grid items-end bg-black/40 p-3 sm:items-center sm:justify-center"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-card p-5 shadow-xl ring-1 ring-border/60"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-bold">{item ? "Edit" : "Add"} {group.kind === "asset" ? "Asset" : "Liability"}</h2><p className="mt-0.5 text-[11px] text-muted-foreground">{group.label}</p></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-secondary hover:bg-secondary/80" aria-label="Close"><X className="size-4" /></button></div><label className="block text-xs font-semibold text-muted-foreground">Name<input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" placeholder={group.kind === "liability" ? "e.g. Education Loan" : "e.g. Reliance"} /></label><label className="mt-4 block text-xs font-semibold text-muted-foreground">Current value<input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" placeholder="0" /></label><button disabled={upsert.isPending} className="mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">{upsert.isPending ? "Saving…" : "Save"}</button></form></div>;
}
