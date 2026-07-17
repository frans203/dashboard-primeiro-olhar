import { AgeChart } from "@/components/charts/demographics/AgeChart";
import { CitiesChart } from "@/components/charts/demographics/CitiesChart";
import { MaternitiesChart } from "@/components/charts/demographics/MaternitiesChart";
import { SexChart } from "@/components/charts/demographics/SexChart";
import { IndicatorsRow, type IndicatorKey } from "@/components/IndicatorsRow";
import { PageHeader } from "./PageHeader";

/**
 * Demografia — faixa etária (Bar vertical) · sexo (Pie) · ranking de cidades
 * (Bar horizontal) · ranking de maternidades (Bar horizontal). Route: /api/demographics.
 *
 * Every chart owns its filters, so the grid is just composition: one column on mobile,
 * two from `lg`.
 */
const CARDS: readonly IndicatorKey[] = ["totalChildren"];

export function DemographicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Demografia"
        description="Perfil das crianças: idade, sexo, cidades e maternidades."
      />
      <IndicatorsRow cards={CARDS} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AgeChart />
        <SexChart />
        <CitiesChart />
        <MaternitiesChart />
      </div>
    </div>
  );
}
