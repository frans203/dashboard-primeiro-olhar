import { readableTextColor } from "@/lib/chart-colors";

/**
 * Recharts paints the legend label and the tooltip row in the SERIES color — the same
 * vivid hue as the slice or bar. On the white card the bright yellow (`#fff800`, ~1.1:1)
 * is effectively invisible and magenta/aqua are marginal, so the label of a yellow series
 * cannot be read.
 *
 * These helpers re-color only the LETTERING, swapping each palette hue for its darkened,
 * AA-contrast variant (`CHART_TEXT_COLORS`). The slice/bar and the legend swatch keep the
 * bright color, so a label still reads as "this one" — just legibly.
 *
 * Split the way Recharts wants it:
 *  - the legend label goes through a formatter (per item, so each keeps its own hue);
 *  - the tooltip's series NAME must stay a plain string — `DefaultTooltipContent` drops a
 *    name that isn't a string/number — so it is neutralized through `TOOLTIP_ITEM_STYLE`
 *    (which overrides the row's inherited series color) while the formatter colors the
 *    value, the only half that accepts a node.
 */

interface ColoredEntry {
  color?: string;
  fill?: string;
  payload?: { fill?: string };
}

/** The mark's color as Recharts reports it, wherever it put it on the entry. */
function markColor(entry?: ColoredEntry): string | undefined {
  return entry?.color ?? entry?.fill ?? entry?.payload?.fill;
}

export function legendTextFormatter(value: React.ReactNode, entry?: ColoredEntry) {
  return <span style={{ color: readableTextColor(markColor(entry)) }}>{value}</span>;
}

/** Neutral lettering for the tooltip row; the formatter below re-colors just the value. */
export const TOOLTIP_ITEM_STYLE = { color: "hsl(var(--foreground))" };

export function tooltipValueFormatter(
  value: React.ReactNode,
  _name: React.ReactNode,
  item?: ColoredEntry,
) {
  return <span style={{ color: readableTextColor(markColor(item)) }}>{value}</span>;
}
