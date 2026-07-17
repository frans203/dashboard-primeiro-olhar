import { ChartCard, PieChart, type FilterFieldKey } from "@/components/charts";
import { useDiagnosisQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** The diagnosis moment is the axis; the cuts are the family's profile. */
const FIELDS: readonly FilterFieldKey[] = [
  "city",
  "income",
  "parentEducation",
  "benefit",
];

function DiagnosisMomentChartInner() {
  const filters = useChartFilters();
  const query = useDiagnosisQuery(filters);
  const data = query.data?.diagnosisMoment ?? [];

  return (
    <ChartCard
      title="Descoberta do diagnóstico"
      description="Quando o diagnóstico de síndrome de Down foi descoberto."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
    >
      <PieChart data={data} />
    </ChartCard>
  );
}

export function DiagnosisMomentChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <DiagnosisMomentChartInner />
    </ChartFilterProvider>
  );
}
