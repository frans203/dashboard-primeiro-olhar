import {
  ChartCard,
  GroupedBarChart,
  type FilterFieldKey,
  type GroupedSeries,
} from "@/components/charts";
import { useSocioeconomicQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** Parent education is the axis → no education filter here. */
const FIELDS: readonly FilterFieldKey[] = ["city", "income", "benefit"];

const SERIES: GroupedSeries[] = [
  { dataKey: "mother", name: "Mãe" },
  { dataKey: "father", name: "Pai" },
];

function ParentEducationChartInner() {
  const filters = useChartFilters();
  const query = useSocioeconomicQuery(filters);
  const data = query.data?.parentEducation ?? [];

  return (
    <ChartCard
      title="Escolaridade dos pais"
      description="Mãe e pai lado a lado, por nível de escolaridade."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
      height={340}
    >
      <GroupedBarChart data={data} categoryKey="label" series={SERIES} />
    </ChartCard>
  );
}

export function ParentEducationChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <ParentEducationChartInner />
    </ChartFilterProvider>
  );
}
