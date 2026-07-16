/**
 * Shared categorical palette for all charts — pastel blues & yellows plus a few
 * supporting hues, chosen for contrast/accessibility. Recharts reads plain color
 * strings, so we expose resolved HSL values here. Keep charts using THIS list so
 * the whole dashboard reads as one system.
 */
export const CHART_COLORS = [
  "hsl(211, 80%, 60%)", // brand blue
  "hsl(45, 95%, 62%)", // brand yellow
  "hsl(199, 70%, 55%)", // cyan-blue
  "hsl(38, 85%, 60%)", // amber
  "hsl(221, 60%, 68%)", // indigo-blue
  "hsl(52, 90%, 68%)", // light yellow
  "hsl(190, 55%, 55%)", // teal
  "hsl(28, 80%, 62%)", // orange
] as const;

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
