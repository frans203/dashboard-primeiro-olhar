import { BpcIncomeChart } from "@/components/charts/crossings/BpcIncomeChart";
import { DeliveryComplicationsChart } from "@/components/charts/crossings/DeliveryComplicationsChart";
import { IncomeTherapiesChart } from "@/components/charts/crossings/IncomeTherapiesChart";

/**
 * Cruzamentos — renda × terapias · tipo de parto × intercorrências · BPC × renda.
 * Routes: /api/crossings/*.
 *
 * On every chart here the filters cut the population and never touch either axis of the
 * crossing (see each chart's `FIELDS`). No indicator row: the brief puts the cards on
 * the other three pages. Shared by the sidebar page and the "Analisar CSV" tab.
 */
export function CrossingsSection() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <IncomeTherapiesChart />
      <DeliveryComplicationsChart />
      <BpcIncomeChart />
    </div>
  );
}
