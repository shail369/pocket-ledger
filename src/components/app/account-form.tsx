import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsert } from "@/lib/data";
import { ICON_OPTIONS, AppIcon } from "./icon";
import type { Account } from "@/lib/types";

const TYPES = ["bank", "cash", "wallet", "card", "savings"];
const COLORS = ["#2563eb", "#16a34a", "#a855f7", "#f97316", "#e11d48", "#0d9488"];

export function AccountForm({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: Account | null;
}) {
  const upsert = useUpsert("accounts");
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [opening, setOpening] = useState("0");
  const [currency, setCurrency] = useState("INR");
  const [icon, setIcon] = useState("wallet");
  const [color, setColor] = useState(COLORS[0]!);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? "");
    setType(existing?.type ?? "bank");
    setOpening(String(existing?.opening_balance ?? 0));
    setCurrency(existing?.currency ?? "INR");
    setIcon(existing?.icon ?? "wallet");
    setColor(existing?.color ?? COLORS[0]!);
    setActive(existing?.is_active ?? true);
  }, [open, existing]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Account name is required");
      return;
    }
    try {
      await upsert.mutateAsync({
        ...(existing ? { id: existing.id } : {}),
        name: name.trim(),
        type,
        opening_balance: Number(opening || 0).toFixed(2),
        currency,
        icon,
        color,
        is_active: active,
      });
      toast.success(existing ? "Account updated" : "Account added");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{existing ? "Edit account" : "New account"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-8">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-12 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["INR", "USD", "EUR", "GBP", "AED"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Opening balance</Label>
            <Input
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Icon</Label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {ICON_OPTIONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    icon === i ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  <AppIcon name={i} className="size-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Colour</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`size-9 rounded-full ${color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Active</p>
              <p className="text-[11px] text-muted-foreground">Inactive accounts are archived</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <Button className="h-12 w-full rounded-xl" onClick={submit} disabled={upsert.isPending}>
            {existing ? "Save changes" : "Add account"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}