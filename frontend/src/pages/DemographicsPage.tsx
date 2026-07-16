import { ExampleSexChart } from "@/components/charts/ExampleSexChart";
import { TodoPanel } from "@/components/charts/TodoPanel";
import { IndicatorsRow } from "@/components/IndicatorsRow";
import { PageHeader } from "./PageHeader";

/**
 * Demografia.
 * Charts: faixa etária (Bar vertical) · sexo (Pie) · ranking cidades (Bar horizontal)
 *         · ranking maternidades (Bar horizontal).
 *
 * The sex Pie is the LIVE example (ExampleSexChart, the molde). The others are TODO —
 * copy ExampleSexChart, swap the query hook + generic chart, and pick the pertinent
 * filters (a chart never filters by its own axis).
 */
export function DemographicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Demografia"
        description="Perfil das crianças: idade, sexo, cidades e maternidades."
      />
      <IndicatorsRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Example, end-to-end (molde) */}
        <ExampleSexChart />

        {/* TODO: copy ExampleSexChart for each of these */}
        <TodoPanel title="Faixa etária" chartType="Bar vertical" />
        <TodoPanel title="Ranking de cidades" chartType="Bar horizontal" />
        <TodoPanel title="Ranking de maternidades" chartType="Bar horizontal" />
      </div>
    </div>
  );
}
