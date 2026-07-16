import { TodoPanel } from "@/components/charts/TodoPanel";
import { IndicatorsRow } from "@/components/IndicatorsRow";
import { PageHeader } from "./PageHeader";

/**
 * Saúde.
 * Charts: tipo de parto (Pie) · descoberta diagnóstico (Pie) · intercorrências (Pie/Bar)
 *         · UTI (Pie/Bar) · doenças frequentes (Bar horizontal)
 *         · terapias mais acessadas (Bar horizontal) · Apgar (histograma Bar).
 * Backend routes: /api/neonatal, /api/diagnosis, /api/health, /api/therapies.
 *
 * All TODO — build each by copying ExampleSexChart (the molde).
 */
export function HealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Saúde"
        description="Dados neonatais, diagnóstico, doenças e terapias."
      />
      <IndicatorsRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodoPanel title="Tipo de parto" chartType="Pie" />
        <TodoPanel title="Descoberta do diagnóstico" chartType="Pie" />
        <TodoPanel title="Intercorrências neonatais" chartType="Pie / Bar" />
        <TodoPanel title="UTI ao nascer" chartType="Pie / Bar" />
        <TodoPanel title="Doenças frequentes" chartType="Bar horizontal" />
        <TodoPanel title="Terapias mais acessadas" chartType="Bar horizontal" />
        <TodoPanel title="Apgar (1º e 5º min)" chartType="Histograma (Bar)" />
      </div>
    </div>
  );
}
