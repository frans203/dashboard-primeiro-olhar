import {
  ChartCard,
  GroupedBarChart,
  type FilterFieldKey,
  type GroupedSeries,
} from "@/components/charts";
import { useBpcIncomeQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/**
 * Axes: income (x) × BPC receipt (series) — neither an income range nor the benefit
 * filter is offered.
 *
 * Stacked: each bar is the whole income bracket split by BPC, so the share within a
 * bracket reads directly — that is the question this crossing answers.
 */
const FIELDS: readonly FilterFieldKey[] = ["city", "age", "parentEducation"];

const SERIES: GroupedSeries[] = [
  { dataKey: "receivesBpc", name: "Recebe BPC" },
  { dataKey: "doesNotReceiveBpc", name: "Não recebe BPC" },
];

function BpcIncomeChartInner() {
  const filters = useChartFilters();
  const query = useBpcIncomeQuery(filters);
  const data = query.data?.rows ?? [];

  return (
    <ChartCard
      title="BPC × renda"
      description="Recebimento de BPC dentro de cada faixa de renda."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
      height={340}
    >
      <GroupedBarChart data={data} categoryKey="income" series={SERIES} stacked />
    </ChartCard>
  );
}

export function BpcIncomeChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <BpcIncomeChartInner />
    </ChartFilterProvider>
  );
}
