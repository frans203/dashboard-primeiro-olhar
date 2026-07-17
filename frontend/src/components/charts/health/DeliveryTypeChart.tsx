import { ChartCard, PieChart, type FilterFieldKey } from "@/components/charts";
import { useNeonatalQuery } from "@/hooks/queries";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/**
 * Delivery type is the axis → no delivery-type filter here.
 *
 * NOTE: `/api/neonatal` accepts no `parentEducation` param (see `NeonatalQuery` in
 * `backend/dtos.py`), so the education filter is not offered — the API would ignore it
 * and the control would look active while doing nothing.
 */
const FIELDS: readonly FilterFieldKey[] = ["city", "age", "income", "sex"];

function DeliveryTypeChartInner() {
  const filters = useChartFilters();
  const query = useNeonatalQuery(filters);
  const data = query.data?.deliveryType ?? [];

  return (
    <ChartCard
      title="Tipo de parto"
      fields={FIELDS}
      isLoading={query.isPending}
      isError={query.isError}
      isEmpty={data.length === 0}
    >
      <PieChart data={data} />
    </ChartCard>
  );
}

export function DeliveryTypeChart() {
  return (
    <ChartFilterProvider initial={{}}>
      <DeliveryTypeChartInner />
    </ChartFilterProvider>
  );
}
