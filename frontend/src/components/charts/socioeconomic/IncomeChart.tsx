import { BarChart, ChartCard, type FilterFieldKey } from "@/components/charts";
import { useSocioeconomicQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** Income is the axis → no income filter here. */
const FIELDS: readonly FilterFieldKey[] = ["city", "age", "parentEducation", "benefit"];

function IncomeChartInner() {
  const filters = useChartFilters();
  const query = useSocioeconomicQuery(filters);
  const data = query.data?.incomeDistribution ?? [];

  return (
    <ChartCard
      title="Renda familiar"
      description="Famílias por faixa de renda."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
    >
      <BarChart data={data} />
    </ChartCard>
  );
}

export function IncomeChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <IncomeChartInner />
    </ChartFilterProvider>
  );
}
