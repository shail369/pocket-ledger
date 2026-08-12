import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";
import { useAppState } from "@/lib/app-state";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
};

function TooltipBox({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-2.5 py-1.5 text-[11px] shadow-lg">
      <p className="font-semibold">{label}</p>
      {payload
        .filter((p: any) => p.value != null)
        .map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="tabular">
            {p.name}: {formatMoney(Number(p.value), currency)}
          </p>
        ))}
    </div>
  );
}

export function SpendingAreaChart({ data }: { data: { label: string; expense: number }[] }) {
  const { currency } = useAppState();
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 5, right: 4, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" {...axis} minTickGap={24} />
        <YAxis {...axis} width={44} tickFormatter={(v) => formatMoney(Number(v), currency, true)} />
        <Tooltip content={<TooltipBox currency={currency} />} />
        <Area
          type="monotone"
          dataKey="expense"
          name="Spent"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#spendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseLineChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  const { currency } = useAppState();
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" {...axis} minTickGap={20} />
        <YAxis {...axis} width={44} tickFormatter={(v) => formatMoney(Number(v), currency, true)} />
        <Tooltip content={<TooltipBox currency={currency} />} />
        <Line type="monotone" dataKey="income" name="Income" stroke="var(--income)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="expense" name="Expenses" stroke="var(--expense)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ProjectionChart({
  data,
}: {
  data: { label: string; actual: number | null; projected: number | null }[];
}) {
  const { currency } = useAppState();
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 5, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" {...axis} minTickGap={18} />
        <YAxis {...axis} width={44} tickFormatter={(v) => formatMoney(Number(v), currency, true)} />
        <Tooltip content={<TooltipBox currency={currency} />} />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="projected"
          name="Projected"
          stroke="var(--warning)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MonthlyComparisonChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  return (
    <div className="no-scrollbar overflow-x-auto">
      <div style={{ minWidth: Math.max(280, data.length * 56) }}>
        <IncomeExpenseLineChart data={data} />
      </div>
    </div>
  );
}