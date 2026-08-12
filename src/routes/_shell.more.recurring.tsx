import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Section } from "@/components/app/pieces";
import { AppIcon } from "@/components/app/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, useRemove, useUpsert } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { formatMoney } from "@/lib/format";
import { iso } from "@/lib/finance";
import type { Recurring } from "@/lib/types";

export const Route = createFileRoute("/_shell/more/recurring")({
  head: () => ({
    meta: [
      { title: "Recurring — Paisa Expense Manager" },
      { name: "description", content: "Track subscriptions, rent and other repeating payments with upcoming due dates." },
      { property: "og:title", content: "Recurring — Paisa Expense Manager" },
      { property: "og:description", content: "Track subscriptions, rent and other repeating payments with upcoming due dates." },
    ],
  }),
  component: RecurringPage,
});

function RecurringPage() {
  const { data } = useAppData();
  const { currency } = useAppState();
  const remove = useRemove("recurring_transactions");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);

  const items = [...data.recurring].sort((a, b) => (a.next_date < b.next_date ? -1 : 1));
  const monthlyTotal = items
    .filter((r) => r.is_active && r.type === "expense")
    .reduce((a, r) => {
      const amt = Number(r.amount);
      const mult = r.frequency === "weekly" ? 4.33 : r.frequency === "yearly" ? 1 / 12 : 1;
      return a + amt * mult;
    }, 0);

  return (
    <div className="space-y-4">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <Link to="/more" className="grid size-9 place-items-center rounded-full bg-secondary">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold">Recurring</h1>
          <p className="text-[11px] text-muted-foreground">≈ {formatMoney(monthlyTotal, currency)} / month</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"
          aria-label="Add recurring"
        >
          <Plus className="size-5" />
        </button>
      </header>

      <Section>
        {items.length ? (
          <ul className="divide-y divide-border/60">
            {items.map((r) => {
              const category = data.categories.find((c) => c.id === r.category_id);
              const account = data.accounts.find((a) => a.id === r.account_id);
              return (
                <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-2xl ${
                      r.is_active ? "bg-secondary" : "bg-secondary/50 opacity-50"
                    }`}
                  >
                    <AppIcon name={category?.icon} className="size-4" />
                  </span>
                  <button
                    className="min-w-0 text-left"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                  >
                    <p className="truncate text-sm font-semibold">{r.description}</p>
                    <p className="truncate text-[11px] capitalize text-muted-foreground">
                      {r.frequency} · next {format(parseISO(r.next_date), "d MMM")} · {account?.name ?? "—"}
                    </p>
                  </button>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={`tabular text-sm font-bold ${r.type === "income" ? "text-income" : ""}`}>
                      {formatMoney(Number(r.amount), currency)}
                    </span>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this recurring item?")) return;
                        await remove.mutateAsync(r.id);
                        toast.success("Deleted");
                      }}
                      className="grid size-8 place-items-center rounded-lg bg-secondary text-expense"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState text="No recurring payments yet." />
        )}
      </Section>

      <RecurringForm open={open} onOpenChange={setOpen} existing={editing} />
    </div>
  );
}

function RecurringForm({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: Recurring | null;
}) {
  const { data } = useAppData();
  const upsert = useUpsert("recurring_transactions");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [account, setAccount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [next, setNext] = useState(iso(new Date()));
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setDescription(existing?.description ?? "");
    setAmount(existing ? String(existing.amount) : "");
    setType(existing?.type ?? "expense");
    setAccount(existing?.account_id ?? data.accounts[0]?.id ?? "");
    setCategory(existing?.category_id ?? "");
    setFrequency(existing?.frequency ?? "monthly");
    setNext(existing?.next_date ?? iso(new Date()));
    setActive(existing?.is_active ?? true);
  }, [open, existing, data.accounts]);

  const categories = data.categories.filter((c) => c.type === type);

  const submit = async () => {
    if (!description.trim() || !amount || !account) {
      toast.error("Description, amount and account are required");
      return;
    }
    try {
      await upsert.mutateAsync({
        ...(existing ? { id: existing.id } : {}),
        description: description.trim(),
        amount: Number(amount).toFixed(2),
        type,
        account_id: account,
        category_id: category || null,
        frequency,
        next_date: next,
        is_active: active,
      });
      toast.success(existing ? "Updated" : "Recurring added");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{existing ? "Edit recurring" : "New recurring"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-8">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
            {["expense", "income"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setCategory("");
                }}
                className={`h-10 rounded-xl text-sm font-semibold capitalize ${
                  type === t ? "bg-card shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Next date</Label>
              <Input type="date" value={next} onChange={(e) => setNext(e.target.value)} className="h-12 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Account</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger className="h-12 w-full rounded-xl">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {data.accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 w-full rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.parent_id ? "— " : ""}
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="h-12 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["weekly", "monthly", "yearly"].map((f) => (
                  <SelectItem key={f} value={f} className="capitalize">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
            <p className="text-sm font-semibold">Active</p>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <Button className="h-12 w-full rounded-xl" onClick={submit} disabled={upsert.isPending}>
            {existing ? "Save" : "Add recurring"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}