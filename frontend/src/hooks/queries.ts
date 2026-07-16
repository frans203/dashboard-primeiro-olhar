/**
 * Per-chart query hooks.
 *
 * Each hook takes the chart's filters (from its Zustand store) and returns a TanStack
 * Query result. The filters are part of the query key, so changing a filter refetches
 * automatically and caches per filter-combination.
 *
 * `useDemographicsQuery` is written out IN FULL as the copy-paste molde. The rest are
 * `// TODO` stubs — complete them the same way once their backend route is implemented
 * (their fetchers in `api/endpoints.ts` currently throw "TODO").
 */
import { useQuery } from "@tanstack/react-query";

import * as api from "@/api/endpoints";
import type { Filters } from "@/types/filters";

// --- EXAMPLE (molde) — follow this shape for every other chart hook -------- //
export function useDemographicsQuery(filters: Partial<Filters>) {
  return useQuery({
    queryKey: api.queryKeys.demographics(filters),
    queryFn: () => api.fetchDemographics(filters),
    // The backend /api/demographics route is still a TODO, so this query will error
    // until it's implemented. The wiring (key ⇐ filters, Zod-validated fetch) is final.
  });
}

// --- TODO: implement following the molde above ---------------------------- //
export function useNeonatalQuery(filters: Partial<Filters>) {
  // TODO: useQuery({ queryKey: api.queryKeys.neonatal(filters), queryFn: () => api.fetchNeonatal(filters) })
  void filters;
  throw new Error("TODO: not implemented");
}

export function useDiagnosisQuery(filters: Partial<Filters>) {
  // TODO
  void filters;
  throw new Error("TODO: not implemented");
}

export function useHealthQuery(filters: Partial<Filters>) {
  // TODO
  void filters;
  throw new Error("TODO: not implemented");
}

export function useTherapiesAggregateQuery(filters: Partial<Filters>) {
  // TODO: /api/therapies (rate + top therapies) — distinct from useTherapies (filter list)
  void filters;
  throw new Error("TODO: not implemented");
}

export function useSocioeconomicQuery(filters: Partial<Filters>) {
  // TODO
  void filters;
  throw new Error("TODO: not implemented");
}

export function useIncomeTherapiesQuery(filters: Partial<Filters>) {
  // TODO
  void filters;
  throw new Error("TODO: not implemented");
}

export function useDeliveryComplicationsQuery(filters: Partial<Filters>) {
  // TODO
  void filters;
  throw new Error("TODO: not implemented");
}

export function useBpcIncomeQuery(filters: Partial<Filters>) {
  // TODO
  void filters;
  throw new Error("TODO: not implemented");
}

export function useIndicatorsQuery(filters: Partial<Filters>) {
  // TODO
  void filters;
  throw new Error("TODO: not implemented");
}
