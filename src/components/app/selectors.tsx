import { ChevronDown, CalendarRange } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppState } from "@/lib/app-state";
import { useAppData } from "@/lib/data";
import { PERIOD_LABELS, type PeriodKey } from "@/lib/finance";

export function AccountSelector() {
  const { accountId, setAccountId } = useAppState();
  const { data } = useAppData();
  const active = data.accounts.find((a) => a.id === accountId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex min-w-0 items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground active:scale-[0.97]">
          <span className="truncate">{active ? active.name : "All Accounts"}</span>
          <ChevronDown className="size-4 shrink-0 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onSelect={() => setAccountId("all")}>All Accounts</DropdownMenuItem>
        {data.accounts.map((a) => (
          <DropdownMenuItem key={a.id} onSelect={() => setAccountId(a.id)}>
            <span className="size-2 rounded-full" style={{ backgroundColor: a.color }} />
            {a.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const PERIODS: PeriodKey[] = ["this_week", "last_7", "last_30", "this_month", "last_month", "this_year"];

export function PeriodSelector() {
  const { period, setPeriod, range, setCustom, customFrom, customTo } = useAppState();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(customFrom);
  const [to, setTo] = useState(customTo);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground active:scale-[0.97]"
      >
        <CalendarRange className="size-3.5" />
        {period === "custom" ? range.label : PERIOD_LABELS[period]}
        <ChevronDown className="size-3.5 opacity-70" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Select period</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4">
            {PERIODS.map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "secondary"}
                className="h-11 justify-start rounded-xl"
                onClick={() => {
                  setPeriod(p);
                  setOpen(false);
                }}
              >
                {PERIOD_LABELS[p]}
              </Button>
            ))}
          </div>
          <div className="space-y-3 px-4 pb-6 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom range</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11" />
              </div>
            </div>
            <Button
              className="h-11 w-full rounded-xl"
              disabled={!from || !to}
              onClick={() => {
                setCustom(from, to);
                setOpen(false);
              }}
            >
              Apply custom range
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}