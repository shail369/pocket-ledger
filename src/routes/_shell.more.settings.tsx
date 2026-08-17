import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Moon, Plus, Sun, Trash2, Download, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Section } from "@/components/app/pieces";
import { AppIcon, ICON_OPTIONS } from "@/components/app/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, useRemove, useUpsert } from "@/lib/data";
import { useAppState } from "@/lib/app-state";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/_shell/more/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Paisa Expense Manager" },
      { name: "description", content: "Currency, appearance, categories and data management for your expense tracker." },
      { property: "og:title", content: "Settings — Paisa Expense Manager" },
      { property: "og:description", content: "Currency, appearance, categories and data management for your expense tracker." },
    ],
  }),
  component: SettingsPage,
});

const NONE = "__none__";

function SettingsPage() {
  const { data } = useAppData();
  const { currency, setCurrency, accountId, setAccountId } = useAppState();
  const { theme, setTheme } = useTheme();
  const { session } = useAuth();
  const removeCategory = useRemove("categories");
  const [catOpen, setCatOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const parents = data.categories.filter((c) => !c.parent_id);

  const openNewCategory = () => {
    setEditingCategory(null);
    setCatOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCatOpen(true);
  };

  const deleteCategory = async (category: Category) => {
    const descendants = data.categories.filter((c) => c.parent_id === category.id);
    const affectedIds = new Set([category.id, ...descendants.map((c) => c.id)]);
    const transactionCount = data.transactions.filter((t) => t.category_id && affectedIds.has(t.category_id)).length;
    const recurringCount = data.recurring.filter((r) => r.category_id && affectedIds.has(r.category_id)).length;
    const budgetCount = data.budgets.filter((b) => b.category_id && affectedIds.has(b.category_id)).length;

    const parts = [
      `Delete ${category.name}${descendants.length ? ` and its ${descendants.length} subcategor${descendants.length === 1 ? "y" : "ies"}` : ""}?`,
      transactionCount ? `${transactionCount} transaction${transactionCount === 1 ? "" : "s"} will become uncategorized.` : "",
      recurringCount ? `${recurringCount} recurring transaction${recurringCount === 1 ? "" : "s"} will become uncategorized.` : "",
      budgetCount ? `${budgetCount} related budget${budgetCount === 1 ? "" : "s"} will be deleted.` : "",
    ].filter(Boolean);

    if (!confirm(parts.join("\n\n"))) return;

    try {
      await removeCategory.mutateAsync(category.id);
      toast.success("Category deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

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

      <Section
        title="Categories"
        action={
          <button onClick={openNewCategory} className="flex items-center gap-1 text-xs font-semibold text-primary">
            <Plus className="size-3.5" /> Add
          </button>
        }
      >
        {parents.length ? (
          <ul className="space-y-3">
            {parents.map((p) => {
              const children = data.categories.filter((c) => c.parent_id === p.id);
              return (
                <li key={p.id}>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary"><AppIcon name={p.icon} className="size-4" /></span>
                    <button className="min-w-0 text-left" onClick={() => openEditCategory(p)}>
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="block text-[11px] capitalize text-muted-foreground">{p.kind}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditCategory(p)} className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground" aria-label={`Edit ${p.name}`}>
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => void deleteCategory(p)} className="grid size-8 place-items-center rounded-lg bg-secondary text-expense" aria-label={`Delete ${p.name}`}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  {children.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 pl-12">
                      {children.map((c) => (
                        <div key={c.id} className="flex items-center gap-1 rounded-full bg-secondary pl-2.5 pr-1 py-1">
                          <button onClick={() => openEditCategory(c)} className="text-[11px] font-medium">{c.name}</button>
                          <button onClick={() => void deleteCategory(c)} className="grid size-5 place-items-center rounded-full text-expense" aria-label={`Delete ${c.name}`}>
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : <EmptyState text="No categories yet." />}
      </Section>

      <Section title="Data">
        <Button variant="secondary" className="h-12 w-full rounded-xl" onClick={exportJson}>
          <Download className="size-4" /> Export backup (JSON)
        </Button>
        <p className="mt-2 text-[11px] text-muted-foreground">Your data is stored securely in the cloud and synced across devices.</p>
      </Section>

      <CategoryForm open={catOpen} onOpenChange={setCatOpen} existing={editingCategory} />
    </div>
  );
}

function CategoryForm({ open, onOpenChange, existing }: { open: boolean; onOpenChange: (v: boolean) => void; existing?: Category | null }) {
  const { data } = useAppData();
  const upsert = useUpsert("categories");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("expense");
  const [parent, setParent] = useState(NONE);
  const [icon, setIcon] = useState("tag");

  const parents = data.categories.filter((c) => !c.parent_id && c.kind === kind && c.id !== existing?.id);
  const isEditing = Boolean(existing);
  const isSubcategory = Boolean(existing?.parent_id);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setName(existing.name);
      setKind(existing.kind);
      setParent(existing.parent_id ?? NONE);
      setIcon(existing.icon);
    } else {
      setName("");
      setKind("expense");
      setParent(NONE);
      setIcon("tag");
    }
  }, [open, existing]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await upsert.mutateAsync({
        ...(existing ? { id: existing.id } : {}),
        name: name.trim(),
        kind,
        parent_id: parent === NONE ? null : parent,
        icon,
      });
      toast.success(isEditing ? "Category updated" : "Category added");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader><SheetTitle>{isEditing ? "Edit category" : "New category"}</SheetTitle></SheetHeader>
        <div className="space-y-4 px-4 pb-8">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
            {["expense", "income"].map((k) => (
              <button
                key={k}
                disabled={isEditing}
                onClick={() => { setKind(k); setParent(NONE); }}
                className={`h-10 rounded-xl text-sm font-semibold capitalize ${kind === k ? "bg-card shadow-sm" : "text-muted-foreground"} ${isEditing ? "cursor-default opacity-80" : ""}`}
              >{k}</button>
            ))}
          </div>
          {isEditing && <p className="text-[11px] text-muted-foreground">Category type is kept unchanged so existing transactions remain consistent.</p>}

          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
          </div>

          {(!isEditing || isSubcategory) && (
            <div className="space-y-1.5">
              <Label className="text-xs">Parent category</Label>
              <Select value={parent} onValueChange={setParent}>
                <SelectTrigger className="h-12 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None (top level)</SelectItem>
                  {parents.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Icon</Label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {ICON_OPTIONS.map((i) => (
                <button key={i} onClick={() => setIcon(i)} className={`grid size-11 shrink-0 place-items-center rounded-xl ${icon === i ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  <AppIcon name={i} className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <Button className="h-12 w-full rounded-xl" onClick={submit} disabled={upsert.isPending}>
            {isEditing ? "Save changes" : "Add category"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
