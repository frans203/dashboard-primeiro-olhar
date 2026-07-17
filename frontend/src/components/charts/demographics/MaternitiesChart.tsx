import { ChartCard, HorizontalBarChart, type FilterFieldKey } from "@/components/charts";
import { useDemographicsQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** Maternity is the axis; the API has no maternity filter, so every field is a cut. */
const FIELDS: readonly FilterFieldKey[] = ["city", "age", "income", "benefit", "sex"];

function MaternitiesChartInner() {
  const filters = useChartFilters();
  const query = useDemographicsQuery(filters);
  const data = query.data?.topMaternities ?? [];

  return (
    <ChartCard
      title="Ranking de maternidades"
      description="10 maternidades com mais nascimentos registrados."
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

export function MaternitiesChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <MaternitiesChartInner />
    </ChartFilterProvider>
  );
}
