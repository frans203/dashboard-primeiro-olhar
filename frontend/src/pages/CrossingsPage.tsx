import { TodoPanel } from "@/components/charts/TodoPanel";
import { PageHeader } from "./PageHeader";

/**
 * Cruzamentos.
 * Charts: renda × terapias (Bar agrupado/empilhado) · parto × intercorrências
 *         (Bar agrupado) · BPC × renda (Bar empilhado / Scatter heatmap).
 * Backend routes: /api/crossings/income-therapies, /api/crossings/delivery-complications,
 *                 /api/crossings/bpc-income.
 *
 * All TODO — build with GroupedBarChart (stacked/grouped), copying ExampleSexChart's
 * store→query→chart wiring.
 */
export function CrossingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cruzamentos"
        description="Relações entre renda, terapias, tipo de parto, intercorrências e BPC."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodoPanel title="Renda × Terapias" chartType="Bar agrupado / empilhado" />
        <TodoPanel title="Parto × Intercorrências" chartType="Bar agrupado" />
        <TodoPanel title="BPC × Renda" chartType="Bar empilhado / Scatter heatmap" />
      </div>
    </div>
  );
}
