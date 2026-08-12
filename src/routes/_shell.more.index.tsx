import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Wallet, ArrowLeftRight, Repeat, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader, Section } from "@/components/app/pieces";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_shell/more/")({
  head: () => ({
    meta: [
      { title: "More — Paisa Expense Manager" },
      { name: "description", content: "Accounts, transactions, recurring payments and settings for your expense manager." },
      { property: "og:title", content: "More — Paisa Expense Manager" },
      { property: "og:description", content: "Accounts, transactions, recurring payments and settings for your expense manager." },
    ],
  }),
  component: MorePage,
});

const LINKS = [
  { to: "/accounts", label: "Accounts", desc: "Manage accounts and balances", icon: Wallet },
  { to: "/transactions", label: "Transactions", desc: "Search and manage activity", icon: ArrowLeftRight },
  { to: "/more/recurring", label: "Recurring", desc: "Subscriptions and repeat bills", icon: Repeat },
  { to: "/more/settings", label: "Settings", desc: "Currency, theme, categories, data", icon: Settings },
] as const;

function MorePage() {
  const { session } = useAuth();

  return (
    <div className="space-y-4">
      <ScreenHeader title="More" subtitle={session?.user.email ?? undefined} />

      <Section>
        <div className="divide-y divide-border/60">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary">
                <l.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{l.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{l.desc}</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
          }}
          className="flex w-full items-center gap-3 py-1 text-sm font-semibold text-expense"
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-expense/10">
            <LogOut className="size-4" />
          </span>
          Sign out
        </button>
      </Section>
    </div>
  );
}