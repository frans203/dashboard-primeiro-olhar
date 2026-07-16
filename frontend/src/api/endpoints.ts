/**
 * Endpoint definitions: for each route, the query key + the fetcher (path builder +
 * Zod-validated GET). Filters are part of the key, so a filter change → new key →
 * automatic refetch/cache by TanStack Query.
 *
 * Only `/api/filters/therapies` is IMPLEMENTED (it's the only route ready on the
 * backend). The rest are stubs marked `// TODO` — fill them in when their backend
 * route lands, following the therapies example exactly.
 */
import { buildQuery, getJson } from "@/api/client";
import * as S from "@/api/schemas";
import type { Filters } from "@/types/filters";

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

// --- IMPLEMENTED ---------------------------------------------------------- //

export function fetchTherapiesFilter(): Promise<S.TherapiesFilterResponse> {
  return getJson("/api/filters/therapies", S.therapiesFilterResponse);
}

// --- TODO (backend routes not implemented yet) ---------------------------- //
// Each stub shows the exact shape to follow. Uncomment/complete when ready.

export function fetchDemographics(f: Partial<Filters>): Promise<S.DemographicsResponse> {
  // TODO: return getJson(`/api/demographics${buildQuery(f)}`, S.demographicsResponse);
  void buildQuery;
  throw new Error("TODO: not implemented");
}

export function fetchNeonatal(f: Partial<Filters>): Promise<S.NeonatalResponse> {
  // TODO: return getJson(`/api/neonatal${buildQuery(f)}`, S.neonatalResponse);
  throw new Error("TODO: not implemented");
}

export function fetchDiagnosis(f: Partial<Filters>): Promise<S.DiagnosisResponse> {
  // TODO: return getJson(`/api/diagnosis${buildQuery(f)}`, S.diagnosisResponse);
  throw new Error("TODO: not implemented");
}

export function fetchHealth(f: Partial<Filters>): Promise<S.HealthResponse> {
  // TODO: return getJson(`/api/health${buildQuery(f)}`, S.healthResponse);
  throw new Error("TODO: not implemented");
}

export function fetchTherapies(f: Partial<Filters>): Promise<S.TherapiesResponse> {
  // TODO: return getJson(`/api/therapies${buildQuery(f)}`, S.therapiesResponse);
  throw new Error("TODO: not implemented");
}

export function fetchSocioeconomic(f: Partial<Filters>): Promise<S.SocioeconomicResponse> {
  // TODO: return getJson(`/api/socioeconomic${buildQuery(f)}`, S.socioeconomicResponse);
  throw new Error("TODO: not implemented");
}

export function fetchIncomeTherapies(
  f: Partial<Filters>,
): Promise<S.IncomeTherapiesResponse> {
  // TODO: return getJson(`/api/crossings/income-therapies${buildQuery(f)}`, S.incomeTherapiesResponse);
  throw new Error("TODO: not implemented");
}

export function fetchDeliveryComplications(
  f: Partial<Filters>,
): Promise<S.DeliveryComplicationsResponse> {
  // TODO: return getJson(`/api/crossings/delivery-complications${buildQuery(f)}`, S.deliveryComplicationsResponse);
  throw new Error("TODO: not implemented");
}

export function fetchBpcIncome(f: Partial<Filters>): Promise<S.BpcIncomeResponse> {
  // TODO: return getJson(`/api/crossings/bpc-income${buildQuery(f)}`, S.bpcIncomeResponse);
  throw new Error("TODO: not implemented");
}

export function fetchIndicators(f: Partial<Filters>): Promise<S.IndicatorsResponse> {
  // TODO: return getJson(`/api/indicators${buildQuery(f)}`, S.indicatorsResponse);
  throw new Error("TODO: not implemented");
}
