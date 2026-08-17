import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState, Section } from "@/components/app/pieces";
import { AppIcon, ICON_OPTIONS } from "@/components/app/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, useRemove, useUpsert } from "@/lib/data";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/_shell/more/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Paisa Expense Manager" },
      { name: "description", content: "Manage expense and income categories and subcategories." },
    ],
  }),
  component: CategoriesPage,
});

const NONE = "__none__";

function CategoriesPage() {
  const { data } = useAppData();
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

  return (
    <div className="space-y-4 pb-2">
      <header className="flex items-center gap-2">
        <Link to="/more" className="grid size-9 place-items-center rounded-full bg-secondary">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold">Categories</h1>
          <p className="truncate text-[11px] text-muted-foreground">Organize your transactions</p>
        </div>
        <Button onClick={openNewCategory} className="h-9 rounded-xl px-3 text-xs">
          <Plus className="size-3.5" /> Add
        </Button>
      </header>

      {parents.length ? (
        <div className="space-y-3">
          {parents.map((parent) => {
            const children = data.categories.filter((c) => c.parent_id === parent.id);
            return (
              <Section key={parent.id} className="overflow-hidden p-0">
                <div className="flex items-center gap-3 border-b border-border/60 px-3.5 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary">
                    <AppIcon name={parent.icon} className="size-4" />
                  </span>
                  <button className="min-w-0 flex-1 text-left" onClick={() => openEditCategory(parent)}>
                    <span className="block truncate text-sm font-semibold">{parent.name}</span>
                    <span className="text-[10px] font-medium capitalize text-muted-foreground">{parent.kind} · {children.length} subcategor{children.length === 1 ? "y" : "ies"}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button onClick={() => openEditCategory(parent)} className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground" aria-label={`Edit ${parent.name}`}>
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => void deleteCategory(parent)} className="grid size-8 place-items-center rounded-lg bg-secondary text-expense" aria-label={`Delete ${parent.name}`}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {children.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center gap-3 px-3.5 py-2.5">
                        <span className="ml-1 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary/70 text-muted-foreground">
                          <AppIcon name={child.icon} className="size-3.5" />
                        </span>
                        <button onClick={() => openEditCategory(child)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-xs font-medium">{child.name}</span>
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <button onClick={() => openEditCategory(child)} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary" aria-label={`Edit ${child.name}`}>
                            <Pencil className="size-3" />
                          </button>
                          <button onClick={() => void deleteCategory(child)} className="grid size-7 place-items-center rounded-md text-expense hover:bg-expense/10" aria-label={`Delete ${child.name}`}>
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-[11px] text-muted-foreground">No subcategories. Use Edit or Add to create one.</p>
                )}
              </Section>
            );
          })}
        </div>
      ) : (
        <EmptyState text="No categories yet. Add your first category to get started." />
      )}

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
              <button key={k} disabled={isEditing} onClick={() => { setKind(k); setParent(NONE); }} className={`h-10 rounded-xl text-sm font-semibold capitalize ${kind === k ? "bg-card shadow-sm" : "text-muted-foreground"} ${isEditing ? "cursor-default opacity-80" : ""}`}>
                {k}
              </button>
            ))}
          </div>
          {isEditing && <p className="text-[11px] text-muted-foreground">Category type stays unchanged so existing transactions remain consistent.</p>}

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
