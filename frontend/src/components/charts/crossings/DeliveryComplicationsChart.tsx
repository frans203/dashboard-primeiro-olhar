import {
  ChartCard,
  GroupedBarChart,
  type FilterFieldKey,
  type GroupedSeries,
} from "@/components/charts";
import { useDeliveryComplicationsQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/** Axes: delivery type (x) × complications (series) — neither is offered as a filter. */
const FIELDS: readonly FilterFieldKey[] = ["city", "age", "income", "sex"];

const SERIES: GroupedSeries[] = [
  { dataKey: "withComplications", name: "Com intercorrência" },
  { dataKey: "withoutComplications", name: "Sem intercorrência" },
];

function DeliveryComplicationsChartInner() {
  const filters = useChartFilters();
  const query = useDeliveryComplicationsQuery(filters);
  const data = query.data?.rows ?? [];

  return (
    <ChartCard
      title="Tipo de parto × intercorrências"
      description="Intercorrências neonatais por tipo de parto."
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
      height={340}
    >
      <GroupedBarChart data={data} categoryKey="deliveryType" series={SERIES} />
    </ChartCard>
  );
}

export function DeliveryComplicationsChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <DeliveryComplicationsChartInner />
    </ChartFilterProvider>
  );
}
