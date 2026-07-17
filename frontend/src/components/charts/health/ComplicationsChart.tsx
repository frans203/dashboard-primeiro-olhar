import { ChartCard, HorizontalBarChart, type FilterFieldKey } from "@/components/charts";
import { useNeonatalQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/**
 * The complication is the axis. Delivery type IS offered here: it cuts the population,
 * it is not the axis of this chart.
 *
 * Horizontal bars rather than a pie — complication names are long, and a ranking reads
 * better than slices when categories are many.
 */
const FIELDS: readonly FilterFieldKey[] = [
  "city",
  "age",
  "income",
  "sex",
  "deliveryType",
];

function ComplicationsChartInner() {
  const filters = useChartFilters();
  const query = useNeonatalQuery(filters);
  const data = query.data?.complications ?? [];

  return (
    <ChartCard
      title="Intercorrências neonatais"
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
      height={340}
    >
      <HorizontalBarChart data={data} />
    </ChartCard>
  );
}

export function ComplicationsChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <ComplicationsChartInner />
    </ChartFilterProvider>
  );
}
