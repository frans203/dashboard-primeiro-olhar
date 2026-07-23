import { AgeChart } from "@/components/charts/demographics/AgeChart";
import { CitiesChart } from "@/components/charts/demographics/CitiesChart";
import { MaternitiesChart } from "@/components/charts/demographics/MaternitiesChart";
import { SexChart } from "@/components/charts/demographics/SexChart";
import { IndicatorsRow, type IndicatorKey } from "@/components/IndicatorsRow";

/**
 * Demografia — faixa etária (Bar vertical) · sexo (Pie) · ranking de cidades
 * (Bar horizontal) · ranking de maternidades (Bar horizontal). Route: /api/demographics.
 *
 * The grid lives here, without a page header, so BOTH the sidebar page and the
 * "Analisar CSV" tab render the exact same charts. Which dataset they read comes from
 * the surrounding `DataSourceProvider`, not from anything in this file.
 */
const CARDS: readonly IndicatorKey[] = ["totalChildren"];

export function DemographicsSection() {
  return (
    <div className="space-y-6">
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
