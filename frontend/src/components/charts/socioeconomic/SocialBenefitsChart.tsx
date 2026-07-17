import {
  ChartCard,
  GroupedBarChart,
  type FilterFieldKey,
  type GroupedSeries,
} from "@/components/charts";
import { useSocioeconomicQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** The benefit is the axis → no benefit filter here. */
const FIELDS: readonly FilterFieldKey[] = ["city", "age", "income", "parentEducation"];

const SERIES: GroupedSeries[] = [
  { dataKey: "receives", name: "Recebe" },
  { dataKey: "doesNotReceive", name: "Não recebe" },
];

function SocialBenefitsChartInner() {
  const filters = useChartFilters();
  const query = useSocioeconomicQuery(filters);
  const data = query.data?.socialBenefits ?? [];

  return (
    <ChartCard
      title="Benefícios sociais"
      description="BPC e auxílio governamental, por recebimento."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
    >
      <GroupedBarChart data={data} categoryKey="label" series={SERIES} />
    </ChartCard>
  );
}

export function SocialBenefitsChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <SocialBenefitsChartInner />
    </ChartFilterProvider>
  );
}
