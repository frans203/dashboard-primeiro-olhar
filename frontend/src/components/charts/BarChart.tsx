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
 * Generic VERTICAL bar chart over the uniform `{ label, count }` shape.
 * Reused for age distribution, income distribution, Apgar histogram, etc.
 * Always wrapped in ResponsiveContainer (mobile-first).
 */
export interface BarChartProps {
  data: LabelCount[];
  /**
   * Use a single brand color for all bars instead of the categorical palette. Default
   * is categorical: past two bars the palette keeps each bar visually distinct (blue &
   * yellow first, then the rest), which is what the dashboard wants for its distribution
   * charts.
   */
  monochrome?: boolean;
  /** Allow fractional Y ticks — for series of averages or rates, not head counts. */
  allowDecimals?: boolean;
  /** Fixes the Y scale (e.g. `[0, 10]` for Apgar) instead of auto-scaling. */
  yDomain?: [number, number];
  /** Series label shown in the tooltip. Defaults to "Contagem"; e.g. "Média" for Apgar. */
  valueName?: string;
}

export function BarChart({
  data,
  monochrome = false,
  allowDecimals = false,
  yDomain,
  valueName = "Contagem",
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RBarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={56}
        />
        <YAxis
          allowDecimals={allowDecimals}
          domain={yDomain ?? ["auto", "auto"]}
          tick={{ fontSize: 12 }}
          width={32}
        />
        <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
        {/* `name` labels the series in the tooltip (else Recharts shows "count"). */}
        <Bar dataKey="count" name={valueName} radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={monochrome ? chartColor(0) : chartColor(i)} />
          ))}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}
