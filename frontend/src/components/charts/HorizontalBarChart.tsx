import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { chartColor } from "@/lib/chart-colors";
import type { LabelCount } from "@/api/schemas";

/**
 * Generic HORIZONTAL bar chart (rankings) over `{ label, count }`.
 * Reused for top cities, top maternities, frequent diseases, top therapies.
 */
export interface HorizontalBarChartProps {
  data: LabelCount[];
  /** Single brand color instead of the categorical palette. Default is categorical. */
  monochrome?: boolean;
}

export function HorizontalBarChart({
  data,
  monochrome = false,
}: HorizontalBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RBarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 12 }}
          interval={0}
        />
        <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
        {/* `name` labels the series in the tooltip (else Recharts shows "count"). */}
        <Bar dataKey="count" name="Contagem" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={monochrome ? chartColor(0) : chartColor(i)} />
          ))}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}
