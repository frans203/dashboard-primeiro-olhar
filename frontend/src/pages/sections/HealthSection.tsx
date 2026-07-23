import { ApgarChart } from "@/components/charts/health/ApgarChart";
import { ComplicationsChart } from "@/components/charts/health/ComplicationsChart";
import { DeliveryTypeChart } from "@/components/charts/health/DeliveryTypeChart";
import { DiagnosisMomentChart } from "@/components/charts/health/DiagnosisMomentChart";
import { FrequentDiseasesChart } from "@/components/charts/health/FrequentDiseasesChart";
import { NicuChart } from "@/components/charts/health/NicuChart";
import { TopTherapiesChart } from "@/components/charts/health/TopTherapiesChart";
import { IndicatorsRow, type IndicatorKey } from "@/components/IndicatorsRow";

/**
 * Saúde e Desenvolvimento — tipo de parto · descoberta do diagnóstico · intercorrências
 * · UTI ao nascer · doenças frequentes · terapias mais acessadas · Apgar.
 * Routes: /api/neonatal, /api/diagnosis, /api/health, /api/therapies.
 *
 * Shared by the sidebar page and the "Analisar CSV" tab (see `DemographicsSection`).
 */
const CARDS: readonly IndicatorKey[] = ["apgar1min", "apgar5min", "surgeryRate"];

export function HealthSection() {
  return (
    <div className="space-y-6">
      <IndicatorsRow cards={CARDS} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DeliveryTypeChart />
        <DiagnosisMomentChart />
        <ComplicationsChart />
        <NicuChart />
        <FrequentDiseasesChart />
        <TopTherapiesChart />
        <ApgarChart />
      </div>
    </div>
  );
}
