import { ChartCard, HorizontalBarChart, type FilterFieldKey } from "@/components/charts";
import { useHealthQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** The disease is the axis (the backend already explodes the multi-valued column). */
const FIELDS: readonly FilterFieldKey[] = ["city", "age", "income", "sex"];

function FrequentDiseasesChartInner() {
  const filters = useChartFilters();
  const query = useHealthQuery(filters);
  const data = query.data?.frequentDiseases ?? [];

  return (
    <ChartCard
      title="Doenças mais frequentes"
      description="Uma criança pode ter mais de uma condição registrada."
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

export function FrequentDiseasesChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <FrequentDiseasesChartInner />
    </ChartFilterProvider>
  );
}
