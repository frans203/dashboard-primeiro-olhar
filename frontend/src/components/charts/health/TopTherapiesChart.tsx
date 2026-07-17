import { ChartCard, HorizontalBarChart, type FilterFieldKey } from "@/components/charts";
import { useTherapiesAggregateQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** The therapy is the axis → no therapy filter here. */
const FIELDS: readonly FilterFieldKey[] = [
  "city",
  "age",
  "income",
  "parentEducation",
  "benefit",
];

function TopTherapiesChartInner() {
  const filters = useChartFilters();
  const query = useTherapiesAggregateQuery(filters);
  const data = query.data?.topTherapies ?? [];

  return (
    <ChartCard
      title="Terapias mais acessadas"
      description="Uma criança pode acessar mais de uma terapia."
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

export function TopTherapiesChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <TopTherapiesChartInner />
    </ChartFilterProvider>
  );
}
