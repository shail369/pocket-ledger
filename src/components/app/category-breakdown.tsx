import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AppIcon } from "./icon";
import { Section, EmptyState } from "./pieces";
import { formatMoney, percent } from "@/lib/format";
import { useAppState } from "@/lib/app-state";
import type { BudgetProgress, CategoryNode } from "@/lib/finance";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

export function CategoryBreakdown({
  nodes,
  budgets = [],
  title = "Spending by category",
  showEntries = true,
}: {
  nodes: CategoryNode[];
  budgets?: BudgetProgress[];
  title?: string;
  showEntries?: boolean;
}) {
  const { currency } = useAppState();
  const [selected, setSelected] = useState<string | null>(null);
  const total = nodes.reduce((a, b) => a + b.amount, 0);
  const active = nodes.find((n) => n.id === selected) ?? null;

  if (!nodes.length)
    return (
      <Section title={title}>
        <EmptyState text="No spending in this period yet." />
      </Section>
    );

  const pieData = active
    ? active.children.map((c) => ({ name: c.name, value: c.amount }))
    : nodes.map((c) => ({ name: c.name, value: c.amount }));

  const handleSliceClick = (_: unknown, index: number) => {
    if (active) return;
    const clicked = pieData[index];
    if (!clicked) return;
    const category = nodes.find((node) => node.name === clicked.name);
    if (category) setSelected(category.id);
  };

  const entries = active ? active.children : nodes;
  const showDetailedEntries = showEntries || !!active;

  return (
    <Section
      title={active ? active.name : title}
      action={
        active ? (
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-0.5 text-xs font-semibold text-primary"
          >
            <ChevronLeft className="size-3.5" /> All categories
          </button>
        ) : (
          <span className="tabular text-xs font-semibold text-muted-foreground">
            {formatMoney(total, currency)}
          </span>
        )
      }
    >
      <div className="flex items-center justify-center">
        <div className="relative size-44 shrink-0 sm:size-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 96, bottom: 8, left: 8 }}>
              <Tooltip
                cursor={false}
                wrapperStyle={{ zIndex: 20, outline: "none" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                  boxShadow: "0 4px 12px rgb(0 0 0 / 0.18)",
                  padding: "8px 10px",
                }}
                itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600 }}
                formatter={(value, name) => [formatMoney(Number(value), currency), String(name)]}
                position={{ x: 150, y: 40 }}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                stroke="none"
                onClick={handleSliceClick}
                className={!active ? "cursor-pointer" : undefined}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">{active ? active.name : "Total"}</p>
              <p className="tabular text-sm font-bold">
                {formatMoney(active ? active.amount : total, currency, true)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showDetailedEntries && (
        <>
          <div className="mt-4 space-y-1.5">
            {entries.slice(0, 4).map((c, i) => (
              <div key={c.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate text-xs">{c.name}</span>
                <span className="tabular shrink-0 text-xs font-semibold">{percent(c.percent)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 divide-y divide-border/60">
            {entries.map((c) => {
              const budget = active ? undefined : budgets.find((b) => b.budget.category_id === c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => !active && setSelected(c.id)}
                  disabled={!!active}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5 text-left disabled:cursor-default"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                    <AppIcon name={"icon" in c ? (c as CategoryNode).icon : "tag"} className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{c.name}</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {percent(c.percent)}
                      {budget && (
                        <span
                          className={
                            budget.projectedState === "over"
                              ? "text-expense"
                              : budget.projectedState === "warning"
                                ? "text-warning"
                                : "text-income"
                          }
                        >
                          ·{" "}
                          {budget.projectedState === "over"
                            ? "Projected over budget"
                            : budget.projectedState === "warning"
                              ? "Close to budget"
                              : "On track"}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="tabular text-sm font-bold">{formatMoney(c.amount, currency)}</span>
                    {!active && <ChevronRight className="size-4 text-muted-foreground" />}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Section>
  );
}
