/**
 * Filter types — mirror the backend query-param DTOs. Every filter is optional.
 * Enum string unions match the English enum keys in `backend/enums.py`.
 *
 * The allowed values live in `const` arrays so a single declaration feeds three
 * consumers with no drift: the TS union (below), the Zod enums that validate filters
 * before they become a query string (`api/schemas.ts`), and the pt-BR dropdown options
 * (`lib/filter-options.ts`).
 *
 * A per-chart Zustand store holds a subset of these (only the filters that chart's
 * route accepts, minus the chart's own axis). The active filters are serialized into
 * the query string (validated by Zod first) and become part of the TanStack Query key.
 */

export const SEX_VALUES = ["male", "female"] as const;
export type Sex = (typeof SEX_VALUES)[number];

export const DELIVERY_TYPE_VALUES = ["cesarean", "vaginal"] as const;
export type DeliveryType = (typeof DELIVERY_TYPE_VALUES)[number];

export const BENEFIT_VALUES = ["bpc", "aid"] as const;
export type Benefit = (typeof BENEFIT_VALUES)[number];

export const PARENT_EDUCATION_VALUES = [
  "notLiterate",
  "elementary",
  "highSchool",
  "higherIncomplete",
  "higherComplete",
  "postgraduate",
] as const;
export type ParentEducation = (typeof PARENT_EDUCATION_VALUES)[number];

/** Therapy keys are dynamic (from /api/filters/therapies); kept as string. */
export type TherapyKey = string;

/** Superset of every possible filter. Each chart uses a pertinent subset. */
export interface Filters {
  city?: string;
  ageMin?: number;
  ageMax?: number;
  /** Bracket floor in reais (from the dataset faixas — see `INCOME_MIN_OPTIONS`). */
  incomeMin?: number;
  /** Bracket ceiling in reais (from the dataset faixas — see `INCOME_MAX_OPTIONS`). */
  incomeMax?: number;
  therapy?: TherapyKey;
  parentEducation?: ParentEducation;
  benefit?: Benefit;
  sex?: Sex;
  deliveryType?: DeliveryType;
  nicu?: boolean;
}

export type FilterKey = keyof Filters;
