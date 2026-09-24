import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface InvoiceTrendChartProps {
  data: { label: string; amount: number }[];
}

export function InvoiceTrendChart({ data }: InvoiceTrendChartProps) {
  if (data.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 text-sm text-[var(--color-ink-muted)]">
        Not enough billing history yet
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--color-border-soft)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "rgba(215,242,76,0.15)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--color-border-soft)",
              boxShadow: "var(--shadow-card)",
              fontSize: 12,
            }}
            formatter={(v: number) => [`₹${v.toFixed(2)}`, "Amount"]}
          />
          <Bar
            dataKey="amount"
            radius={[6, 6, 0, 0]}
            fill="var(--color-accent)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}