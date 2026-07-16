import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { chartColor } from "@/lib/chart-colors";

/**
 * Generic GROUPED / STACKED bar chart. Each `series` is one bar per category.
 * Reused for parent education (mother/father), benefits (receives/doesNotReceive),
 * and the crossings (income × therapies, delivery × complications, BPC × income).
 *
 * `data` rows are arbitrary objects; `categoryKey` names the x-axis field and each
 * `series` maps a data field to a legend label.
 */
export interface GroupedSeries {
  dataKey: string;
  name: string;
}

export interface GroupedBarChartProps<T extends Record<string, unknown>> {
  data: T[];
  categoryKey: keyof T & string;
  series: GroupedSeries[];
  /** Stack the series instead of grouping side by side. */
  stacked?: boolean;
}

export function GroupedBarChart<T extends Record<string, unknown>>({
  data,
  categoryKey,
  series,
  stacked = false,
}: GroupedBarChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RBarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        {/* Recharts 3 has very strict dataKey generics; the runtime accepts a
            string key, so we cast to keep the generic wrapper ergonomic. */}
        <XAxis
          dataKey={categoryKey as unknown as never}
          tick={{ fontSize: 12 }}
          interval={0}
          height={48}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
        <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey as unknown as never}
            name={s.name}
            stackId={stacked ? "stack" : undefined}
            fill={chartColor(i)}
            radius={stacked ? 0 : [6, 6, 0, 0]}
          />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
