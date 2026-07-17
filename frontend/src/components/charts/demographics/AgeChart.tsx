import { BarChart, ChartCard, type FilterFieldKey } from "@/components/charts";
import { useDemographicsQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** Age is the axis → no age filter here (a chart never filters itself out). */
const FIELDS: readonly FilterFieldKey[] = [
  "city",
  "income",
  "parentEducation",
  "benefit",
  "sex",
];

function AgeChartInner() {
  const filters = useChartFilters();
  const query = useDemographicsQuery(filters);
  const data = query.data?.ageDistribution ?? [];

  return (
    <ChartCard
      title="Faixa etária"
      description="Crianças por faixa de idade."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
    >
      <BarChart data={data} />
    </ChartCard>
  );
}

export function AgeChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <AgeChartInner />
    </ChartFilterProvider>
  );
}
