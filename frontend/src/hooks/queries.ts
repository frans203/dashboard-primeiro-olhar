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
 *
 * Each hook also reads the active DATASET from `useDataSource()` — the institute's TSV
 * or the uploaded CSV — and passes it to the fetcher (path prefix) and to the key
 * (scope + upload version). That is why the chart components know nothing about it:
 * mounting them under `DataSourceProvider` is enough to repoint them.
 */
import { useQuery } from "@tanstack/react-query";

import * as api from "@/api/endpoints";
import { useDataSource } from "@/stores/dataSourceContext";
import type { Filters } from "@/types/filters";

// --- molde: every hook below is this shape -------------------------------- //
export function useDemographicsQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("demographics", filters);
  return useQuery({
    queryKey: api.queryKeys.demographics(f, source),
    queryFn: () => api.fetchDemographics(f, source),
  });
}

export function useNeonatalQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("neonatal", filters);
  return useQuery({
    queryKey: api.queryKeys.neonatal(f, source),
    queryFn: () => api.fetchNeonatal(f, source),
  });
}

export function useDiagnosisQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("diagnosis", filters);
  return useQuery({
    queryKey: api.queryKeys.diagnosis(f, source),
    queryFn: () => api.fetchDiagnosis(f, source),
  });
}

export function useHealthQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("health", filters);
  return useQuery({
    queryKey: api.queryKeys.health(f, source),
    queryFn: () => api.fetchHealth(f, source),
  });
}

/** /api/therapies (rate + top therapies) — distinct from `useTherapies` (filter list). */
export function useTherapiesAggregateQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("therapies", filters);
  return useQuery({
    queryKey: api.queryKeys.therapies(f, source),
    queryFn: () => api.fetchTherapies(f, source),
  });
}

export function useSocioeconomicQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("socioeconomic", filters);
  return useQuery({
    queryKey: api.queryKeys.socioeconomic(f, source),
    queryFn: () => api.fetchSocioeconomic(f, source),
  });
}

export function useIncomeTherapiesQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("incomeTherapies", filters);
  return useQuery({
    queryKey: api.queryKeys.incomeTherapies(f, source),
    queryFn: () => api.fetchIncomeTherapies(f, source),
  });
}

export function useDeliveryComplicationsQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("deliveryComplications", filters);
  return useQuery({
    queryKey: api.queryKeys.deliveryComplications(f, source),
    queryFn: () => api.fetchDeliveryComplications(f, source),
  });
}

export function useBpcIncomeQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("bpcIncome", filters);
  return useQuery({
    queryKey: api.queryKeys.bpcIncome(f, source),
    queryFn: () => api.fetchBpcIncome(f, source),
  });
}

export function useIndicatorsQuery(filters: Partial<Filters>) {
  const source = useDataSource();
  const f = api.pickRouteFilters("indicators", filters);
  return useQuery({
    queryKey: api.queryKeys.indicators(f, source),
    queryFn: () => api.fetchIndicators(f, source),
  });
}
