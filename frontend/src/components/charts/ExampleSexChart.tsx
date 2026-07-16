/**
 * ============================================================================
 *  EXAMPLE CHART — the end-to-end MOLDE. Copy this to add any new chart.
 * ============================================================================
 *
 * It wires the full per-instance pattern:
 *   1. `<ChartFilterProvider>` creates this chart's OWN Zustand filter store.
 *   2. Subcomponents read/write filters via `useChartFilters` / `useChartFilterActions`
 *      (no prop drilling).
 *   3. `useDemographicsQuery(filters)` keys the TanStack Query on those filters, so a
 *      filter change → new key → automatic refetch/cache.
 *   4. A generic chart (`PieChart`) renders the server data, wrapped in `ChartState`
 *      for loading / error / empty.
 *
 * This chart shows the SEX distribution, so `sex` is its axis and is deliberately NOT
 * offered as a filter here (a chart never filters itself out). The example filter is
 * "idade mínima" to demonstrate the store → query-key → refetch loop.
 *
 * NOTE: the backend /api/demographics route is still a TODO, so this renders the error
 * state until that route lands — the wiring itself is final and correct.
 */
import { Card } from "@/components/ui-kit";
import { ChartState, PieChart } from "@/components/charts";
import { NumberFilterField } from "@/components/ui-kit";
import { useDemographicsQuery } from "@/hooks/queries";
import {
  ChartFilterProvider,
  useChartFilterActions,
  useChartFilters,
} from "@/stores/chartFilterContext";

function SexChartInner() {
  const filters = useChartFilters();
  const { setFilter } = useChartFilterActions();
  const query = useDemographicsQuery(filters);

  const data = query.data?.sexDistribution ?? [];

  return (
    <Card
      title="Distribuição por sexo"
      headerAction={
        <NumberFilterField
          label="Idade mín."
          id="example-age-min"
          className="w-28"
          min={0}
          value={filters.ageMin ?? ""}
          onChange={(e) =>
            setFilter(
              "ageMin",
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
        />
      }
    >
      <ChartState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={!query.isLoading && !query.isError && data.length === 0}
        height={300}
      >
        <PieChart data={data} />
      </ChartState>
    </Card>
  );
}

/** Public component: owns the provider so each mount is an independent instance. */
export function ExampleSexChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <SexChartInner />
    </ChartFilterProvider>
  );
}
