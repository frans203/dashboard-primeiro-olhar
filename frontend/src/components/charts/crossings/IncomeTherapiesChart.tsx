import {
  ChartCard,
  GroupedBarChart,
  type FilterFieldKey,
  type GroupedSeries,
} from "@/components/charts";
import { useIncomeTherapiesQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/**
 * Crossing rule: the filters cut the POPULATION, never either axis. Income is the x
 * axis and therapy access is the series, so neither an income range nor a therapy
 * filter is offered — filtering by them would flatten the very relation being read.
 */
const FIELDS: readonly FilterFieldKey[] = ["city", "age", "parentEducation", "sex"];

const SERIES: GroupedSeries[] = [
  { dataKey: "withTherapy", name: "Com terapia" },
  { dataKey: "withoutTherapy", name: "Sem terapia" },
];

function IncomeTherapiesChartInner() {
  const filters = useChartFilters();
  const query = useIncomeTherapiesQuery(filters);
  const data = query.data?.rows ?? [];

  return (
    <ChartCard
      title="Renda × acesso a terapias"
      description="Crianças com e sem terapia, por faixa de renda familiar."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
      height={340}
    >
      <GroupedBarChart data={data} categoryKey="income" series={SERIES} />
    </ChartCard>
  );
}

export function IncomeTherapiesChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <IncomeTherapiesChartInner />
    </ChartFilterProvider>
  );
}
