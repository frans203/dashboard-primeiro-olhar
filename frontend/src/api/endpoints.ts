/**
 * Endpoint definitions: for each route, the query key + the fetcher (path builder +
 * Zod-validated GET). Filters are part of the key, so a filter change → new key →
 * automatic refetch/cache by TanStack Query.
 *
 * Two rules are enforced here, once, for every route:
 *
 * 1. **Only the pertinent params.** `ROUTE_FILTERS` mirrors the query DTOs in
 *    `backend/dtos.py` — the exact filter subset each route accepts. `pickRouteFilters`
 *    narrows a chart's filters to that subset, and the SAME narrowed object builds the
 *    key and the query string, so two charts sharing a route also share cache entries.
 *    A chart additionally never puts its own axis in its store (see the chart files).
 * 2. **Filters are validated before serialization** (`toQuery` → `filtersSchema`), so a
 *    bad value surfaces as a query error instead of a malformed request.
 */
import { buildQuery, getJson } from "@/api/client";
import * as S from "@/api/schemas";
import type { FilterKey, Filters } from "@/types/filters";

/** Central query-key registry (keeps keys consistent across hooks). */
export const queryKeys = {
  therapiesFilter: ["filters", "therapies"] as const,
  demographics: (f: Partial<Filters>) => ["demographics", f] as const,
  neonatal: (f: Partial<Filters>) => ["neonatal", f] as const,
  diagnosis: (f: Partial<Filters>) => ["diagnosis", f] as const,
  health: (f: Partial<Filters>) => ["health", f] as const,
  therapies: (f: Partial<Filters>) => ["therapies", f] as const,
  socioeconomic: (f: Partial<Filters>) => ["socioeconomic", f] as const,
  incomeTherapies: (f: Partial<Filters>) => ["crossings", "income-therapies", f] as const,
  deliveryComplications: (f: Partial<Filters>) =>
    ["crossings", "delivery-complications", f] as const,
  bpcIncome: (f: Partial<Filters>) => ["crossings", "bpc-income", f] as const,
  indicators: (f: Partial<Filters>) => ["indicators", f] as const,
};

/**
 * The filter subset each route accepts — mirrors the query DTOs in `backend/dtos.py`.
 * Sending anything else would be silently ignored by the API (a filter that looks
 * active but does nothing), so it is dropped here instead.
 */
export const ROUTE_FILTERS = {
  demographics: [
    "city",
    "ageMin",
    "ageMax",
    "incomeMin",
    "incomeMax",
    "parentEducation",
    "benefit",
    "sex",
  ],
  neonatal: [
    "city",
    "ageMin",
    "ageMax",
    "incomeMin",
    "incomeMax",
    "sex",
    "deliveryType",
    "nicu",
  ],
  diagnosis: ["city", "incomeMin", "incomeMax", "parentEducation", "benefit"],
  health: ["city", "ageMin", "ageMax", "incomeMin", "incomeMax", "sex"],
  therapies: [
    "city",
    "ageMin",
    "ageMax",
    "incomeMin",
    "incomeMax",
    "parentEducation",
    "benefit",
  ],
  socioeconomic: [
    "city",
    "ageMin",
    "ageMax",
    "incomeMin",
    "incomeMax",
    "parentEducation",
    "benefit",
  ],
  incomeTherapies: ["city", "ageMin", "ageMax", "parentEducation", "sex"],
  deliveryComplications: ["city", "ageMin", "ageMax", "incomeMin", "incomeMax", "sex"],
  bpcIncome: ["city", "ageMin", "ageMax", "parentEducation"],
  indicators: [
    "city",
    "ageMin",
    "ageMax",
    "incomeMin",
    "incomeMax",
    "parentEducation",
    "benefit",
    "sex",
  ],
} as const satisfies Record<string, readonly FilterKey[]>;

export type RouteName = keyof typeof ROUTE_FILTERS;

/**
 * Narrow a chart's filters to the ones its route accepts, dropping unset values.
 * Used for BOTH the query key and the request, so they can never disagree.
 */
export function pickRouteFilters(
  route: RouteName,
  filters: Partial<Filters>,
): Partial<Filters> {
  const entries = ROUTE_FILTERS[route]
    .filter((key) => filters[key] !== undefined && filters[key] !== "")
    .map((key) => [key, filters[key]] as const);
  // Iterating erases the key→value-type link that `Filters` encodes; `filtersSchema`
  // re-checks it on the way out (`toQuery`).
  return Object.fromEntries(entries) as Partial<Filters>;
}

/** Validate the filters, then serialize them into a query string. */
function toQuery(filters: Partial<Filters>): string {
  return buildQuery(S.filtersSchema.parse(filters));
}

// --- reference data -------------------------------------------------------- //

export function fetchTherapiesFilter(): Promise<S.TherapiesFilterResponse> {
  return getJson("/api/filters/therapies", S.therapiesFilterResponse);
}

// --- aggregates ------------------------------------------------------------ //

export function fetchDemographics(f: Partial<Filters>): Promise<S.DemographicsResponse> {
  return getJson(`/api/demographics${toQuery(f)}`, S.demographicsResponse);
}

export function fetchNeonatal(f: Partial<Filters>): Promise<S.NeonatalResponse> {
  return getJson(`/api/neonatal${toQuery(f)}`, S.neonatalResponse);
}

export function fetchDiagnosis(f: Partial<Filters>): Promise<S.DiagnosisResponse> {
  return getJson(`/api/diagnosis${toQuery(f)}`, S.diagnosisResponse);
}

export function fetchHealth(f: Partial<Filters>): Promise<S.HealthResponse> {
  return getJson(`/api/health${toQuery(f)}`, S.healthResponse);
}

export function fetchTherapies(f: Partial<Filters>): Promise<S.TherapiesResponse> {
  return getJson(`/api/therapies${toQuery(f)}`, S.therapiesResponse);
}

export function fetchSocioeconomic(f: Partial<Filters>): Promise<S.SocioeconomicResponse> {
  return getJson(`/api/socioeconomic${toQuery(f)}`, S.socioeconomicResponse);
}

export function fetchIndicators(f: Partial<Filters>): Promise<S.IndicatorsResponse> {
  return getJson(`/api/indicators${toQuery(f)}`, S.indicatorsResponse);
}

// --- crossings ------------------------------------------------------------- //

export function fetchIncomeTherapies(
  f: Partial<Filters>,
): Promise<S.IncomeTherapiesResponse> {
  return getJson(
    `/api/crossings/income-therapies${toQuery(f)}`,
    S.incomeTherapiesResponse,
  );
}

export function fetchDeliveryComplications(
  f: Partial<Filters>,
): Promise<S.DeliveryComplicationsResponse> {
  return getJson(
    `/api/crossings/delivery-complications${toQuery(f)}`,
    S.deliveryComplicationsResponse,
  );
}

export function fetchBpcIncome(f: Partial<Filters>): Promise<S.BpcIncomeResponse> {
  return getJson(`/api/crossings/bpc-income${toQuery(f)}`, S.bpcIncomeResponse);
}
