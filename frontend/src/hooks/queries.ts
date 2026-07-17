/**
 * Per-chart query hooks — one per API route.
 *
 * Each hook takes the chart's filters (from its Zustand store), narrows them to the
 * subset its route accepts (`pickRouteFilters`, mirroring `backend/dtos.py`), and
 * returns a TanStack Query result. The narrowed filters ARE the query key, so changing
 * a filter refetches automatically and caches per filter-combination — never refetch by
 * hand.
 *
 * The chart's own axis is never in its store to begin with (a chart never filters
 * itself out), so it never reaches the key or the request.
 */
import { useQuery } from "@tanstack/react-query";

import * as api from "@/api/endpoints";
import type { Filters } from "@/types/filters";

// --- molde: every hook below is this shape -------------------------------- //
export function useDemographicsQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("demographics", filters);
  return useQuery({
    queryKey: api.queryKeys.demographics(f),
    queryFn: () => api.fetchDemographics(f),
  });
}

export function useNeonatalQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("neonatal", filters);
  return useQuery({
    queryKey: api.queryKeys.neonatal(f),
    queryFn: () => api.fetchNeonatal(f),
  });
}

export function useDiagnosisQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("diagnosis", filters);
  return useQuery({
    queryKey: api.queryKeys.diagnosis(f),
    queryFn: () => api.fetchDiagnosis(f),
  });
}

export function useHealthQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("health", filters);
  return useQuery({
    queryKey: api.queryKeys.health(f),
    queryFn: () => api.fetchHealth(f),
  });
}

/** /api/therapies (rate + top therapies) — distinct from `useTherapies` (filter list). */
export function useTherapiesAggregateQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("therapies", filters);
  return useQuery({
    queryKey: api.queryKeys.therapies(f),
    queryFn: () => api.fetchTherapies(f),
  });
}

export function useSocioeconomicQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("socioeconomic", filters);
  return useQuery({
    queryKey: api.queryKeys.socioeconomic(f),
    queryFn: () => api.fetchSocioeconomic(f),
  });
}

export function useIncomeTherapiesQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("incomeTherapies", filters);
  return useQuery({
    queryKey: api.queryKeys.incomeTherapies(f),
    queryFn: () => api.fetchIncomeTherapies(f),
  });
}

export function useDeliveryComplicationsQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("deliveryComplications", filters);
  return useQuery({
    queryKey: api.queryKeys.deliveryComplications(f),
    queryFn: () => api.fetchDeliveryComplications(f),
  });
}

export function useBpcIncomeQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("bpcIncome", filters);
  return useQuery({
    queryKey: api.queryKeys.bpcIncome(f),
    queryFn: () => api.fetchBpcIncome(f),
  });
}

export function useIndicatorsQuery(filters: Partial<Filters>) {
  const f = api.pickRouteFilters("indicators", filters);
  return useQuery({
    queryKey: api.queryKeys.indicators(f),
    queryFn: () => api.fetchIndicators(f),
  });
}
