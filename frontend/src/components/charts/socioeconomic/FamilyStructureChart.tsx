import { ChartCard, PieChart, type FilterFieldKey } from "@/components/charts";
import { useSocioeconomicQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** Family structure is the axis; the API has no filter for it, so all fields are cuts. */
const FIELDS: readonly FilterFieldKey[] = [
  "city",
  "income",
  "parentEducation",
  "benefit",
];

function FamilyStructureChartInner() {
  const filters = useChartFilters();
  const query = useSocioeconomicQuery(filters);
  const data = query.data?.familyStructure ?? [];

  return (
    <ChartCard
      title="Estrutura familiar"
      description="Estado civil da mãe."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
    >
      <PieChart data={data} />
    </ChartCard>
  );
}

export function FamilyStructureChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <FamilyStructureChartInner />
    </ChartFilterProvider>
  );
}
