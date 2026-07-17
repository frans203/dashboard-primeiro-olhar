/**
 * pt-BR display formatting. The API speaks numbers; every screen speaks Portuguese —
 * format here so the rules live in one place.
 */

const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});
const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

/** Placeholder for a value the dataset does not have (never render a missing as 0). */
export const EMPTY = "—";

export function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY : integer.format(value);
}

/** Averages (Apgar) — one or two decimals. */
export function formatAverage(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY : decimal.format(value);
}

/**
 * Rates arrive from the API as a SHARE (0–1) — see `analytics.py` ("share of …").
 * Renders as "42,3%".
 */
export function formatRate(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY : percent.format(value);
}

/** A 0–1 share as a 0–100 number, for charts that plot rates as bars/slices. */
export function rateToPercent(value: number): number {
  return Math.round(value * 1000) / 10;
}
