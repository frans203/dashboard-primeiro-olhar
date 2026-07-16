import { Activity, HeartPulse, Scissors, Users } from "lucide-react";

import { IndicatorCard } from "@/components/ui-kit";

/**
 * Top-of-page KPI row: Apgar 1º/5º min, % therapy, % surgery, total children.
 *
 * TODO: wire to `useIndicatorsQuery(filters)` once /api/indicators is implemented:
 *   const q = useIndicatorsQuery(filters);
 *   value={q.data ? `${q.data.apgar1minAvg ?? "—"}` : ...} loading={q.isLoading} ...
 * For now it renders placeholder values so pages lay out correctly.
 */
export function IndicatorsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <IndicatorCard label="Apgar 1º min (média)" value="—" icon={Activity} />
      <IndicatorCard label="Apgar 5º min (média)" value="—" icon={HeartPulse} />
      <IndicatorCard label="% em terapia" value="—" icon={Users} />
      <IndicatorCard label="% com cirurgia" value="—" icon={Scissors} />
    </div>
  );
}
