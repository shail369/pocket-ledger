import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData, useUpsert } from "@/lib/data";
import { currencySymbol } from "@/lib/format";
import { useAppState } from "@/lib/app-state";
import type { Transaction, TxType } from "@/lib/types";

const TYPES: { key: TxType; label: string }[] = [
  { key: "expense", label: "Expense" },
  { key: "income", label: "Income" },
  { key: "transfer", label: "Transfer" },
];

export function TransactionForm({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: Transaction | null;
}) {
  const { data } = useAppData();
  const { currency } = useAppState();
  const upsert = useUpsert("transactions");

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [parentId, setParentId] = useState("");
  const [subId, setSubId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  const parents = useMemo(
    () => data.categories.filter((c) => !c.parent_id && c.kind === (type === "income" ? "income" : "expense")),
    [data.categories, type],
  );
  const subs = useMemo(
    () => data.categories.filter((c) => c.parent_id === parentId),
    [data.categories, parentId],
  );

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setType(existing.type);
      setAmount(String(existing.amount));
      setAccountId(existing.account_id);
      setToAccountId(existing.transfer_account_id ?? "");
      setDate(existing.date);
      setDescription(existing.description);
      const cat = data.categories.find((c) => c.id === existing.category_id);
      if (cat?.parent_id) {
        setParentId(cat.parent_id);
        setSubId(cat.id);
      } else {
        setParentId(cat?.id ?? "");
        setSubId("");
      }
    } else {
      setType("expense");
      setAmount("");
      setAccountId(data.accounts[0]?.id ?? "");
      setToAccountId("");
      setParentId("");
      setSubId("");
      setDate(new Date().toISOString().slice(0, 10));
      setDescription("");
    }
  }, [open, existing, data.accounts, data.categories]);

  const submit = async (): Promise<void> => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!accountId) {
      toast.error("Select an account");
      return;
    }
    if (type === "transfer") {
      if (!toAccountId) {
        toast.error("Select a destination account");
        return;
      }
      if (toAccountId === accountId) {
        toast.error("Cannot transfer money to the same account");
        return;
      }
    } else if (!parentId) {
      toast.error("Select a category");
      return;
    }

    const row: Record<string, unknown> = {
      ...(existing ? { id: existing.id } : {}),
      account_id: accountId,
      transfer_account_id: type === "transfer" ? toAccountId : null,
      category_id: type === "transfer" ? null : subId || parentId,
      amount: value.toFixed(2),
      type,
      date,
      description: description.trim() || (type === "transfer" ? "Transfer" : "Untitled"),
    };
    try {
      await upsert.mutateAsync(row);
      toast.success(existing ? "Transaction updated" : "Transaction added");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-form-title"
        className="fixed inset-x-0 bottom-0 z-[51] max-h-[92vh] overflow-y-auto rounded-t-3xl bg-background p-6 shadow-lg"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 id="transaction-form-title" className="text-lg font-semibold text-foreground">
            {existing ? "Edit transaction" : "New transaction"}
          </h2>
        </div>

        <div className="space-y-4 px-4 pb-8">
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-secondary p-1">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`h-10 rounded-xl text-sm font-semibold transition-colors ${
                  type === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-surface px-4 py-3">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-muted-foreground">{currencySymbol(currency)}</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="tabular w-full bg-transparent text-3xl font-bold outline-none"
              />
            </div>
          </div>

          <Field label={type === "transfer" ? "From account" : "Account"}>
            <Select value={accountId} onValueChange={setAccountId}>
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
          </Field>

          {type === "transfer" ? (
            <Field label="To account">
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger className="h-12 w-full rounded-xl">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {data.accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <>
              <Field label="Category">
                <Select
                  value={parentId}
                  onValueChange={(v) => {
                    setParentId(v);
                    setSubId("");
                  }}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {type === "expense" && subs.length > 0 && (
                <Field label="Subcategory">
                  <Select value={subId} onValueChange={setSubId}>
                    <SelectTrigger className="h-12 w-full rounded-xl">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {subs.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </>
          )}

          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl" />
          </Field>
          <Field label="Description">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Groceries at DMart"
              className="h-12 rounded-xl"
            />
          </Field>

          <Button className="h-12 w-full rounded-xl text-base" onClick={submit} disabled={upsert.isPending}>
            {existing ? "Save changes" : "Add transaction"}
          </Button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}