import {
  Cell,
  Legend,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { chartColor } from "@/lib/chart-colors";
import {
  TOOLTIP_ITEM_STYLE,
  legendTextFormatter,
  tooltipValueFormatter,
} from "./readable-text";
import type { LabelCount } from "@/api/schemas";

/**
 * Generic pie/donut chart over `{ label, count }`.
 * Reused for sex, delivery type, diagnosis moment, NICU, complications.
 */
export interface PieChartProps {
  data: LabelCount[];
  /** Inner radius > 0 renders a donut. */
  donut?: boolean;
}

export function PieChart({ data, donut = true }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RPieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={donut ? "55%" : 0}
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={chartColor(i)} />
          ))}
        </Pie>
        {/* Legend/tooltip lettering uses the darkened text palette — the bright yellow
            slice color is unreadable as text on the white card. See `readable-text`. */}
        <Tooltip itemStyle={TOOLTIP_ITEM_STYLE} formatter={tooltipValueFormatter} />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: 12 }}
          formatter={legendTextFormatter}
        />
      </RPieChart>
    </ResponsiveContainer>
  );
}
