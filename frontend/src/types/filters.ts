/**
 * Filter types — mirror the backend query-param DTOs. Every filter is optional.
 * Enum string unions match the English enum keys in `backend/enums.py`.
 *
 * A per-chart Zustand store holds a subset of these (only the filters that chart's
 * route accepts). The active filters are serialized into the query string (validated
 * by Zod first) and become part of the TanStack Query key.
 */

export type Sex = "male" | "female";
export type DeliveryType = "cesarean" | "vaginal";
export type Benefit = "bpc" | "aid";
export type ParentEducation =
  | "notLiterate"
  | "elementary"
  | "highSchool"
  | "higherIncomplete"
  | "higherComplete"
  | "postgraduate";

/** Therapy keys are dynamic (from /api/filters/therapies); kept as string. */
export type TherapyKey = string;

/** Superset of every possible filter. Each chart uses a pertinent subset. */
export interface Filters {
  city?: string;
  ageMin?: number;
  ageMax?: number;
  incomeMin?: number;
  incomeMax?: number;
  therapy?: TherapyKey;
  parentEducation?: ParentEducation;
  benefit?: Benefit;
  sex?: Sex;
  deliveryType?: DeliveryType;
  nicu?: boolean;
}

export type FilterKey = keyof Filters;
