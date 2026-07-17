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
