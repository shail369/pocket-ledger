import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Moon, Sun, Download } from "lucide-react";
import { toast } from "sonner";
import { Section } from "@/components/app/pieces";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

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

function SettingsPage() {
  const { data } = useAppData();
  const { currency, setCurrency, accountId, setAccountId } = useAppState();
  const { theme, setTheme } = useTheme();
  const { session } = useAuth();

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paisa-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
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
        <Button variant="secondary" className="h-12 w-full rounded-xl" onClick={exportJson}>
          <Download className="size-4" /> Export backup (JSON)
        </Button>
        <p className="mt-2 text-[11px] text-muted-foreground">Your data is stored securely in the cloud and synced across devices.</p>
      </Section>
    </div>
  );
}
