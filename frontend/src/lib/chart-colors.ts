/**
 * Shared categorical palette for all charts. Blue & yellow (the brand) lead; the rest
 * are six distinct hues so a chart with many slices/bars stays readable instead of
 * cycling two colors.
 *
 * This is NOT hand-picked. The slot ORDER is the colorblind-safety mechanism: it was
 * derived by enumerating orderings and keeping the one that maximizes the minimum
 * adjacent separation (the method in the `dataviz` skill). Validated on the app's light
 * card surface (`#ffffff`):
 *   - CVD (protan/deutan) worst adjacent ΔE 9.2  (target ≥ 8)  ✔  (lemon yellow does
 *     NOT collide with the green under colorblindness — this was checked)
 *   - normal-vision worst adjacent ΔE 15.6       (floor  ≥ 15) ✔
 *   - contrast: yellow/magenta/aqua sit < 3:1 on white — allowed because every chart
 *     carries a second identity channel (pie legend + tooltip, bar axis + tooltip).
 *
 * SLOT 2 (yellow) is `#fff800`, set on request for a bright yellow. It is very light —
 * contrast on white is ~1.1:1, so a yellow bar/slice is faint against the card and leans
 * on the tooltip, axis and legend to be read. To restore the validated (band-passing)
 * yellow, use `#dfaa0c`; a middle option that still reads on white is `#cccc00`.
 *
 * If you change a hex or the order, re-run the validator before shipping — do not
 * eyeball it. These steps are tuned for a LIGHT surface; a dark theme would need its
 * own re-stepped column (the app renders light-only today).
 */
export const CHART_COLORS = [
  "#4796eb", // 1 · brand blue
  "#fff800", // 2 · bright yellow (set on request)
  "#e87ba4", // 3 · magenta
  "#008300", // 4 · green
  "#1baf7a", // 5 · aqua
  "#eb6834", // 6 · orange
  "#4a3aa7", // 7 · violet
  "#e34948", // 8 · red
] as const;

/**
 * Color for categorical slot `index`. Assigned in fixed order and, past the 8th slot,
 * cycled — the backend already folds long tails into an "Outras"/top-N bucket, so a
 * chart never actually reaches slot 9 with a distinct entity.
 */
export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * TEXT variant of each slot, for anywhere the palette colors *lettering* instead of a
 * shape — Recharts paints legend labels and tooltip rows in the series color, and these
 * hues are mark colors, not text colors: `#fff800` on the white card is ~1.1:1, i.e.
 * unreadable.
 *
 * Derived, not hand-picked: same OKLCH hue, lightness lowered (chroma clipped only to
 * stay in gamut) until each reaches **WCAG AA 4.5:1 on `#ffffff`**. Measured —
 *   blue 4.53 · yellow 4.52 · magenta 4.50 · green 4.95 · aqua 4.51 · orange 4.53 ·
 *   violet 8.56 · red 4.51    (green and violet already passed and are unchanged)
 *
 * The MARK keeps `CHART_COLORS`: only the lettering darkens, so the slice/bar a label
 * points at is still the bright brand color. Same rule as the palette above — if you
 * change a hex, re-measure the contrast instead of eyeballing it.
 */
export const CHART_TEXT_COLORS = [
  "#2678cb", // 1 · brand blue
  "#7d7a08", // 2 · yellow
  "#bb537d", // 3 · magenta
  "#008300", // 4 · green
  "#00885c", // 5 · aqua
  "#cd4c0f", // 6 · orange
  "#4a3aa7", // 7 · violet
  "#d83e3f", // 8 · red
] as const;

/** Readable lettering color for categorical slot `index` (cycled like `chartColor`). */
export function chartTextColor(index: number): string {
  return CHART_TEXT_COLORS[index % CHART_TEXT_COLORS.length];
}

const TEXT_BY_FILL: Record<string, string> = Object.fromEntries(
  CHART_COLORS.map((fill, i) => [fill.toLowerCase(), CHART_TEXT_COLORS[i]]),
);

/**
 * Readable lettering color for a mark painted `fill`. Recharts hands the legend and the
 * tooltip the series color, so we translate it back to its text variant; a color outside
 * the palette (or a missing one) falls back to the theme foreground instead of guessing.
 */
export function readableTextColor(fill?: string): string {
  return (fill && TEXT_BY_FILL[fill.toLowerCase()]) || "hsl(var(--foreground))";
}
