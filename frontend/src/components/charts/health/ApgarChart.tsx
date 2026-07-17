import { BarChart, ChartCard, type FilterFieldKey } from "@/components/charts";
import type { LabelCount } from "@/api/schemas";
import { useNeonatalQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/**
 * The Apgar score is the axis; delivery type and NICU cut the population.
 *
 * SPEC GAP: the brief asks for a HISTOGRAM (x = score bracket, y = children). The API
 * exposes only the two averages — `NeonatalResponse` has `apgar1minAvg`/`apgar5minAvg`
 * and no score distribution — so this charts the averages instead. A real histogram
 * needs a new backend field (e.g. `apgarDistribution: {label,count}[]`); with it, this
 * component becomes a plain `BarChart` over that array and nothing else changes.
 *
 * Missing scores are ignored rather than counted as zero (the backend averages via
 * `mean_ignoring_missing`, and a null average drops its bar here).
 */
const FIELDS: readonly FilterFieldKey[] = ["city", "income", "deliveryType", "nicu"];

function ApgarChartInner() {
  const filters = useChartFilters();
  const query = useNeonatalQuery(filters);

  const data: LabelCount[] = [
    { label: "Apgar 1º min", value: query.data?.apgar1minAvg },
    { label: "Apgar 5º min", value: query.data?.apgar5minAvg },
  ]
    .filter((row): row is { label: string; value: number } => row.value != null)
    .map(({ label, value }) => ({ label, count: value }));

  return (
    <ChartCard
      title="Apgar (média)"
      description="Média do escore no 1º e no 5º minuto, de 0 a 10."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
    >
      <BarChart data={data} allowDecimals yDomain={[0, 10]} valueName="Média" />
    </ChartCard>
  );
}

export function ApgarChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <ApgarChartInner />
    </ChartFilterProvider>
  );
}
