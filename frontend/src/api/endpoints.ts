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
import { buildQuery, del, getJson, postFile } from "@/api/client";
import * as S from "@/api/schemas";
import type { DataSource } from "@/stores/dataSourceContext";
import type { FilterKey, Filters } from "@/types/filters";

/**
 * Two datasets, one API surface: the institute's fixed TSV under `/api`, and the
 * uploaded CSV under `/api/uploads` — identical routes, DTOs and filters (see
 * `backend/routes/uploads_analytics.py`). Every fetcher takes the active `DataSource`
 * and only the prefix changes.
 */
const INSTITUTE_SOURCE: DataSource = { name: "institute" };

function base(source: DataSource = INSTITUTE_SOURCE): string {
  return source.name === "upload" ? "/api/uploads" : "/api";
}

/**
 * Source scope for a query key. The upload's `version` is in there, so replacing the
 * CSV re-keys every chart and TanStack Query refetches by itself.
 */
function scope(source: DataSource = INSTITUTE_SOURCE) {
  return source.name === "upload"
    ? (["upload", source.version ?? 0] as const)
    : (["institute"] as const);
}

/** Central query-key registry (keeps keys consistent across hooks). */
export const queryKeys = {
  therapiesFilter: ["filters", "therapies"] as const,
  uploadStatus: ["uploads", "current"] as const,
  demographics: (f: Partial<Filters>, s?: DataSource) =>
    [...scope(s), "demographics", f] as const,
  neonatal: (f: Partial<Filters>, s?: DataSource) => [...scope(s), "neonatal", f] as const,
  diagnosis: (f: Partial<Filters>, s?: DataSource) =>
    [...scope(s), "diagnosis", f] as const,
  health: (f: Partial<Filters>, s?: DataSource) => [...scope(s), "health", f] as const,
  therapies: (f: Partial<Filters>, s?: DataSource) =>
    [...scope(s), "therapies", f] as const,
  socioeconomic: (f: Partial<Filters>, s?: DataSource) =>
    [...scope(s), "socioeconomic", f] as const,
  incomeTherapies: (f: Partial<Filters>, s?: DataSource) =>
    [...scope(s), "crossings", "income-therapies", f] as const,
  deliveryComplications: (f: Partial<Filters>, s?: DataSource) =>
    [...scope(s), "crossings", "delivery-complications", f] as const,
  bpcIncome: (f: Partial<Filters>, s?: DataSource) =>
    [...scope(s), "crossings", "bpc-income", f] as const,
  indicators: (f: Partial<Filters>, s?: DataSource) =>
    [...scope(s), "indicators", f] as const,
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

/** Therapy options come from the canonical vector, identical for both datasets. */
export function fetchTherapiesFilter(): Promise<S.TherapiesFilterResponse> {
  return getJson("/api/filters/therapies", S.therapiesFilterResponse);
}

// --- aggregates ------------------------------------------------------------ //

export function fetchDemographics(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.DemographicsResponse> {
  return getJson(`${base(s)}/demographics${toQuery(f)}`, S.demographicsResponse);
}

export function fetchNeonatal(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.NeonatalResponse> {
  return getJson(`${base(s)}/neonatal${toQuery(f)}`, S.neonatalResponse);
}

export function fetchDiagnosis(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.DiagnosisResponse> {
  return getJson(`${base(s)}/diagnosis${toQuery(f)}`, S.diagnosisResponse);
}

export function fetchHealth(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.HealthResponse> {
  return getJson(`${base(s)}/health${toQuery(f)}`, S.healthResponse);
}

export function fetchTherapies(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.TherapiesResponse> {
  return getJson(`${base(s)}/therapies${toQuery(f)}`, S.therapiesResponse);
}

export function fetchSocioeconomic(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.SocioeconomicResponse> {
  return getJson(`${base(s)}/socioeconomic${toQuery(f)}`, S.socioeconomicResponse);
}

export function fetchIndicators(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.IndicatorsResponse> {
  return getJson(`${base(s)}/indicators${toQuery(f)}`, S.indicatorsResponse);
}

// --- crossings ------------------------------------------------------------- //

export function fetchIncomeTherapies(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.IncomeTherapiesResponse> {
  return getJson(
    `${base(s)}/crossings/income-therapies${toQuery(f)}`,
    S.incomeTherapiesResponse,
  );
}

export function fetchDeliveryComplications(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.DeliveryComplicationsResponse> {
  return getJson(
    `${base(s)}/crossings/delivery-complications${toQuery(f)}`,
    S.deliveryComplicationsResponse,
  );
}

export function fetchBpcIncome(
  f: Partial<Filters>,
  s?: DataSource,
): Promise<S.BpcIncomeResponse> {
  return getJson(`${base(s)}/crossings/bpc-income${toQuery(f)}`, S.bpcIncomeResponse);
}

// --- uploaded dataset lifecycle -------------------------------------------- //

/** Send a CSV/TSV; it REPLACES whatever was loaded before. */
export function uploadDataset(file: File): Promise<S.UploadStatusResponse> {
  return postFile("/api/uploads", file, S.uploadStatusResponse);
}

/** Metadata of the loaded CSV — 404 (an `ApiError`) when there is none. */
export function fetchUploadStatus(): Promise<S.UploadStatusResponse> {
  return getJson("/api/uploads/current", S.uploadStatusResponse);
}

export function deleteUploadedDataset(): Promise<void> {
  return del("/api/uploads/current");
}
