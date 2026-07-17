import { ChartCard, PieChart, type FilterFieldKey } from "@/components/charts";
import type { LabelCount } from "@/api/schemas";
import { useNeonatalQuery } from "@/hooks/queries";
import { rateToPercent } from "@/lib/format";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** NICU admission is the axis → no `nicu` filter here. */
const FIELDS: readonly FilterFieldKey[] = ["city", "age", "income", "sex"];

function NicuChartInner() {
  const filters = useChartFilters();
  const query = useNeonatalQuery(filters);

  // The API returns a SHARE (`nicuRate`, 0–1) rather than a distribution, so the two
  // slices are derived from it and plotted as percentages.
  const rate = query.data?.nicuRate;
  const data: LabelCount[] =
    rate === undefined
      ? []
      : [
          { label: "Internou na UTI", count: rateToPercent(rate) },
          { label: "Não internou", count: rateToPercent(1 - rate) },
        ];

  return (
    <ChartCard
      title="Internação em UTI ao nascer"
      description="Percentual das crianças com informação de UTI registrada."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
    >
      <PieChart data={data} />
    </ChartCard>
  );
}

export function NicuChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <NicuChartInner />
    </ChartFilterProvider>
  );
}
