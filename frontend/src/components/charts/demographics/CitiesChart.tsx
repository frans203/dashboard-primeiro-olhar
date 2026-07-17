import { ChartCard, HorizontalBarChart, type FilterFieldKey } from "@/components/charts";
import { useDemographicsQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** City is the axis → no city filter here. */
const FIELDS: readonly FilterFieldKey[] = [
  "age",
  "income",
  "parentEducation",
  "benefit",
  "sex",
];

function CitiesChartInner() {
  const filters = useChartFilters();
  const query = useDemographicsQuery(filters);
  const data = query.data?.topCities ?? [];

  return (
    <ChartCard
      title="Ranking de cidades"
      description="10 cidades com mais crianças; as demais somadas em “Outras”."
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

export function CitiesChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <CitiesChartInner />
    </ChartFilterProvider>
  );
}
