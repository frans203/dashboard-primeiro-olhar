import { TodoPanel } from "@/components/charts/TodoPanel";
import { IndicatorsRow } from "@/components/IndicatorsRow";
import { PageHeader } from "./PageHeader";

/**
 * Socioeconômico.
 * Charts: renda (Bar vertical) · escolaridade dos pais (Bar agrupado mãe/pai)
 *         · estado civil (Bar/Pie) · benefícios (Bar agrupado).
 * Backend route: /api/socioeconomic.
 *
 * All TODO — build each by copying ExampleSexChart (the molde). Use GroupedBarChart
 * for the mother/father education and the benefits charts.
 */
export function SocioeconomicPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Socioeconômico"
        description="Renda, escolaridade dos pais, estrutura familiar e benefícios."
      />
      <IndicatorsRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodoPanel title="Renda familiar" chartType="Bar vertical" />
        <TodoPanel title="Escolaridade dos pais" chartType="Bar agrupado (mãe/pai)" />
        <TodoPanel title="Estado civil" chartType="Bar / Pie" />
        <TodoPanel title="Benefícios sociais" chartType="Bar agrupado" />
      </div>
    </div>
  );
}
