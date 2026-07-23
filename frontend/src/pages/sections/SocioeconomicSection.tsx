import { FamilyStructureChart } from "@/components/charts/socioeconomic/FamilyStructureChart";
import { IncomeChart } from "@/components/charts/socioeconomic/IncomeChart";
import { ParentEducationChart } from "@/components/charts/socioeconomic/ParentEducationChart";
import { SocialBenefitsChart } from "@/components/charts/socioeconomic/SocialBenefitsChart";
import { IndicatorsRow, type IndicatorKey } from "@/components/IndicatorsRow";

/**
 * Socioeconômico — renda (Bar vertical) · escolaridade dos pais (Bar agrupado mãe/pai)
 * · estrutura familiar (Pie) · benefícios sociais (Bar agrupado).
 * Route: /api/socioeconomic.
 *
 * Shared by the sidebar page and the "Analisar CSV" tab (see `DemographicsSection`).
 */
const CARDS: readonly IndicatorKey[] = ["therapyRate"];

export function SocioeconomicSection() {
  return (
    <div className="space-y-6">
      <IndicatorsRow cards={CARDS} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <IncomeChart />
        <ParentEducationChart />
        <FamilyStructureChart />
        <SocialBenefitsChart />
      </div>
    </div>
  );
}
