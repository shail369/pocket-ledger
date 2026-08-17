import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Moon, Sun, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Section } from "@/components/app/pieces";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, useInvalidateData } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { AppData, Account, Category, Transaction, Budget, Recurring } from "@/lib/types";

export const Route = createFileRoute("/_shell/more/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Paisa Expense Manager" },
      { name: "description", content: "Currency, appearance and data management for your expense tracker." },
      { property: "og:title", content: "Settings — Paisa Expense Manager" },
      { property: "og:description", content: "Currency, appearance and data management for your expense tracker." },
    ],
  }),
  component: SettingsPage,
});

type BackupFile = {
  format: "paisa-backup";
  version: number;
  exportedAt: string;
  data: AppData;
};

function SettingsPage() {
  const { data } = useAppData();
  const { currency, setCurrency, accountId, setAccountId } = useAppState();
  const { theme, setTheme } = useTheme();
  const { session } = useAuth();
  const invalidate = useInvalidateData();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const exportJson = async () => {
    try {
      const [accounts, categories, transactions, budgets, recurring] = await Promise.all([
        supabase.from("accounts").select("*").order("created_at"),
        supabase.from("categories").select("*").order("created_at"),
        supabase.from("transactions").select("*").order("date", { ascending: false }),
        supabase.from("budgets").select("*").order("created_at"),
        supabase.from("recurring_transactions").select("*").order("next_occurrence"),
      ]);
      const error = accounts.error || categories.error || transactions.error || budgets.error || recurring.error;
      if (error) throw error;

      const backup: BackupFile = {
        format: "paisa-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          accounts: (accounts.data ?? []) as unknown as Account[],
          categories: (categories.data ?? []) as unknown as Category[],
          transactions: (transactions.data ?? []) as unknown as Transaction[],
          budgets: (budgets.data ?? []) as unknown as Budget[],
          recurring: (recurring.data ?? []) as unknown as Recurring[],
        },
      };

      const filename = `paisa-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const file = new File([blob], filename, { type: "application/json" });

      // Native/mobile WebViews may ignore an anchor download. Use the device share
      // sheet when file sharing is supported, then fall back to a normal download.
      const share = navigator.share as ((data?: ShareData) => Promise<void>) | undefined;
      const canShareFile = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
      if (share && canShareFile) {
        await share({ title: "Paisa backup", text: "Paisa expense manager backup", files: [file] });
        toast.success("Backup ready to share/save");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Backup exported: ${accounts.data?.length ?? 0} accounts, ${transactions.data?.length ?? 0} transactions`);
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
      toast.error(`Export failed: ${(error as Error).message}`);
    }
  };

  const importJson = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<BackupFile> & { data?: Partial<AppData> };
      if (parsed.format !== "paisa-backup" || parsed.version !== 1 || !parsed.data) {
        throw new Error("This is not a valid Paisa backup file");
      }

      const backup = parsed.data;
      const accounts = Array.isArray(backup.accounts) ? backup.accounts : [];
      const categories = Array.isArray(backup.categories) ? backup.categories : [];
      const transactions = Array.isArray(backup.transactions) ? backup.transactions : [];
      const budgets = Array.isArray(backup.budgets) ? backup.budgets : [];
      const recurring = Array.isArray(backup.recurring) ? backup.recurring : [];

      if (!accounts.length && !categories.length && !transactions.length && !budgets.length && !recurring.length) {
        throw new Error("The backup contains no data");
      }

      const current = await fetchCurrentDataForImport();
      const accountMap = new Map<string, string>();
      const categoryMap = new Map<string, string>();

      for (const account of accounts as Account[]) {
        const existing = current.accounts.find(
          (a) => a.name === account.name && a.type === account.type && a.currency === account.currency,
        );
        if (existing) {
          accountMap.set(account.id, existing.id);
          continue;
        }
        const id = crypto.randomUUID();
        const { error } = await supabase.from("accounts").insert({
          id,
          name: account.name,
          type: account.type,
          opening_balance: account.opening_balance,
          currency: account.currency,
          icon: account.icon,
          color: account.color,
          is_active: account.is_active,
        });
        if (error) throw error;
        accountMap.set(account.id, id);
      }

      const categoryRows = [...(categories as Category[])].sort((a, b) => Number(Boolean(a.parent_id)) - Number(Boolean(b.parent_id)));
      for (const category of categoryRows) {
        const mappedParent = category.parent_id ? categoryMap.get(category.parent_id) : null;
        const existing = current.categories.find(
          (c) => c.name === category.name && c.kind === category.kind && (c.parent_id ?? null) === (mappedParent ?? null),
        );
        if (existing) {
          categoryMap.set(category.id, existing.id);
          continue;
        }
        const id = crypto.randomUUID();
        const { error } = await supabase.from("categories").insert({
          id,
          name: category.name,
          parent_id: mappedParent,
          icon: category.icon,
          kind: category.kind,
        });
        if (error) throw error;
        categoryMap.set(category.id, id);
      }

      const importedTransactions = transactions as Transaction[];
      const existingTransactions = current.transactions;
      const transactionRows = importedTransactions
        .map((tx) => ({
          id: crypto.randomUUID(),
          account_id: accountMap.get(tx.account_id),
          transfer_account_id: tx.transfer_account_id ? accountMap.get(tx.transfer_account_id) ?? null : null,
          category_id: tx.category_id ? categoryMap.get(tx.category_id) ?? null : null,
          amount: tx.amount,
          type: tx.type,
          date: tx.date,
          description: tx.description,
        }))
        .filter((tx) => {
          if (!tx.account_id) return false;
          return !existingTransactions.some((existing) => transactionFingerprint(existing) === transactionFingerprint(tx));
        });
      await insertInChunks("transactions", transactionRows);

      const budgetRows = (budgets as Budget[])
        .map((budget) => ({
          id: crypto.randomUUID(),
          category_id: budget.category_id ? categoryMap.get(budget.category_id) ?? null : null,
          account_id: budget.account_id ? accountMap.get(budget.account_id) ?? null : null,
          amount: budget.amount,
          period: budget.period,
          start_date: budget.start_date,
          end_date: budget.end_date ?? null,
        }))
        .filter((budget) => !current.budgets.some((existing) => budgetFingerprint(existing) === budgetFingerprint(budget)));
      await insertInChunks("budgets", budgetRows);

      const recurringRows = (recurring as Recurring[])
        .map((item) => ({
          id: crypto.randomUUID(),
          account_id: accountMap.get(item.account_id),
          category_id: item.category_id ? categoryMap.get(item.category_id) ?? null : null,
          amount: item.amount,
          type: item.type,
          description: item.description,
          frequency: item.frequency,
          start_date: item.start_date,
          next_occurrence: item.next_occurrence,
          end_date: item.end_date ?? null,
          is_active: item.is_active,
        }))
        .filter((item) => item.account_id)
        .filter((item) => !current.recurring.some((existing) => recurringFingerprint(existing) === recurringFingerprint(item)));
      await insertInChunks("recurring_transactions", recurringRows);

      invalidate();
      toast.success(
        `Import complete: ${transactionRows.length} transactions, ${budgetRows.length} budgets and ${recurringRows.length} recurring entries added`,
      );
    } catch (error) {
      toast.error(`Import failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const onImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void importJson(file);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Link to="/more" className="grid size-9 place-items-center rounded-full bg-secondary">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold">Settings</h1>
          <p className="truncate text-[11px] text-muted-foreground">{session?.user.email}</p>
        </div>
      </header>

      <Section title="Preferences">
        <div className="space-y-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Dark mode</p>
              <p className="text-[11px] text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-muted-foreground" />
              <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
              <Moon className="size-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Default currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["INR", "USD", "EUR", "GBP", "AED", "JPY"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Default account view</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {data.accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Data">
        <div className="space-y-2">
          <Button variant="secondary" className="h-12 w-full rounded-xl" onClick={exportJson}>
            <Download className="size-4" /> Export full backup (JSON)
          </Button>
          <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportChange} />
          <Button variant="outline" className="h-12 w-full rounded-xl" onClick={() => importInputRef.current?.click()} disabled={importing}>
            <Upload className="size-4" /> {importing ? "Importing…" : "Import backup (JSON)"}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Export creates a complete JSON backup directly from the cloud. Import merges backup data into this account without deleting your existing data.
        </p>
      </Section>
    </div>
  );
}

async function fetchCurrentDataForImport(): Promise<AppData> {
  const [accounts, categories, transactions, budgets, recurring] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at"),
    supabase.from("categories").select("*").order("created_at"),
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("budgets").select("*").order("created_at"),
    supabase.from("recurring_transactions").select("*").order("next_occurrence"),
  ]);
  const error = accounts.error || categories.error || transactions.error || budgets.error || recurring.error;
  if (error) throw error;
  return {
    accounts: (accounts.data ?? []) as unknown as Account[],
    categories: (categories.data ?? []) as unknown as Category[],
    transactions: (transactions.data ?? []) as unknown as Transaction[],
    budgets: (budgets.data ?? []) as unknown as Budget[],
    recurring: (recurring.data ?? []) as unknown as Recurring[],
  };
}

async function insertInChunks(table: "transactions" | "budgets" | "recurring_transactions", rows: Record<string, unknown>[]) {
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    if (!chunk.length) continue;
    const { error } = await supabase.from(table).insert(chunk as never);
    if (error) throw error;
  }
}

function transactionFingerprint(tx: Partial<Transaction> & Record<string, unknown>): string {
  return [tx.account_id, tx.transfer_account_id ?? "", tx.category_id ?? "", tx.amount, tx.type, tx.date, tx.description].join("|");
}

function budgetFingerprint(budget: Partial<Budget> & Record<string, unknown>): string {
  return [budget.account_id ?? "", budget.category_id ?? "", budget.amount, budget.period, budget.start_date, budget.end_date ?? ""].join("|");
}

function recurringFingerprint(item: Partial<Recurring> & Record<string, unknown>): string {
  return [item.account_id, item.category_id ?? "", item.amount, item.type, item.description, item.frequency, item.start_date, item.next_occurrence, item.end_date ?? ""].join("|");
}
