/**
 * Generic, reusable chart primitives (few, composed everywhere). No hexagonal or line
 * charts (project decision). Every chart uses Recharts' ResponsiveContainer.
 *
 * `ChartCard` + `ChartFilterBar` are the shell around them: title, the instance's
 * filter controls, and the loading/error/empty states. The concrete chart instances
 * live in the per-page folders (`charts/demographics`, `charts/health`, …).
 */
export { ChartState, type ChartStateProps } from "./ChartState";
export { ChartCard, type ChartCardProps } from "./ChartCard";
export {
  ChartFilterBar,
  type ChartFilterBarProps,
  type FilterFieldKey,
} from "./ChartFilterBar";
export { BarChart, type BarChartProps } from "./BarChart";
export {
  HorizontalBarChart,
  type HorizontalBarChartProps,
} from "./HorizontalBarChart";
export { PieChart, type PieChartProps } from "./PieChart";
export {
  GroupedBarChart,
  type GroupedBarChartProps,
  type GroupedSeries,
} from "./GroupedBarChart";
