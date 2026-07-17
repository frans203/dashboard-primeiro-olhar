/**
 * ============================================================================
 *  THE MOLDE — every chart instance in this app is this file with the nouns
 *  swapped. Copy it to add a chart.
 * ============================================================================
 *
 * The four moving parts:
 *   1. `<ChartFilterProvider>` (in the public component) creates this chart's OWN
 *      Zustand filter store, so two mounts never share filters.
 *   2. `useChartFilters()` reads them from context — no prop drilling. `ChartCard`
 *      renders the controls and writes back through the same store.
 *   3. The query hook keys TanStack Query on those filters: filter changes → new key →
 *      automatic refetch + per-combination cache. Never refetch by hand.
 *   4. A generic chart renders the server data; `ChartCard` handles loading/error/empty.
 *
 * `FIELDS` lists the pertinent filters MINUS this chart's own axis — sex is the axis
 * here, so there is no sex filter. (`ROUTE_FILTERS` in api/endpoints is the second net:
 * it drops anything /api/demographics would not honour.)
 */
import { ChartCard, PieChart, type FilterFieldKey } from "@/components/charts";
import { useDemographicsQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

const FIELDS: readonly FilterFieldKey[] = [
  "city",
  "age",
  "income",
  "parentEducation",
  "benefit",
];

function SexChartInner() {
  const filters = useChartFilters();
  const query = useDemographicsQuery(filters);
  const data = query.data?.sexDistribution ?? [];

  return (
    <ChartCard
      title="Distribuição por sexo"
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
    >
      <PieChart data={data} />
    </ChartCard>
  );
}

/** Public component: owns the provider so each mount is an independent instance. */
export function SexChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <SexChartInner />
    </ChartFilterProvider>
  );
}
