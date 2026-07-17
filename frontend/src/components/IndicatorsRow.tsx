import {
  Activity,
  HeartPulse,
  Scissors,
  SlidersHorizontal,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import type { IndicatorsResponse } from "@/api/schemas";
import { ChartFilterBar, type FilterFieldKey } from "@/components/charts";
import { IndicatorCard, SecondaryButton } from "@/components/ui-kit";
import { useIndicatorsQuery } from "@/hooks/queries";
import { EMPTY, formatAverage, formatCount, formatRate } from "@/lib/format";
import { ChartFilterProvider, useChartFilters } from "@/stores/chartFilterContext";

/**
 * Top-of-page KPI row, fed by `/api/indicators`.
 *
 * It follows the same per-instance pattern as a chart — its own filter store, its own
 * filter bar — so the numbers recompute with the cuts the reader applies, independently
 * of the charts below. Each page asks for the cards its brief calls for (`cards`).
 *
 * Rates arrive as shares (0–1) and render as percentages; a missing average renders as
 * "—" and never as zero.
 */
export type IndicatorKey =
  | "apgar1min"
  | "apgar5min"
  | "therapyRate"
  | "surgeryRate"
  | "totalChildren";

interface IndicatorSpec {
  label: string;
  icon: LucideIcon;
  value: (data: IndicatorsResponse) => string;
  hint?: (data: IndicatorsResponse) => string;
}

const totalHint = (data: IndicatorsResponse) =>
  `de ${formatCount(data.totalChildren)} crianças`;

const INDICATORS: Record<IndicatorKey, IndicatorSpec> = {
  apgar1min: {
    label: "Apgar 1º min (média)",
    icon: Activity,
    value: (d) => formatAverage(d.apgar1minAvg),
  },
  apgar5min: {
    label: "Apgar 5º min (média)",
    icon: HeartPulse,
    value: (d) => formatAverage(d.apgar5minAvg),
  },
  therapyRate: {
    label: "% em terapia",
    icon: Stethoscope,
    value: (d) => formatRate(d.therapyRate),
    hint: totalHint,
  },
  surgeryRate: {
    label: "% com cirurgia cardíaca",
    icon: Scissors,
    value: (d) => formatRate(d.surgeryRate),
    hint: totalHint,
  },
  totalChildren: {
    label: "Total de crianças",
    icon: Users,
    value: (d) => formatCount(d.totalChildren),
    hint: () => "no recorte selecionado",
  },
};

/** Every filter `/api/indicators` accepts (`IndicatorsQuery` in `backend/dtos.py`). */
const FIELDS: readonly FilterFieldKey[] = [
  "city",
  "age",
  "income",
  "parentEducation",
  "benefit",
  "sex",
];

function IndicatorsRowInner({ cards }: { cards: readonly IndicatorKey[] }) {
  const [open, setOpen] = React.useState(false);
  const filters = useChartFilters();
  const query = useIndicatorsQuery(filters);
  const activeCount = Object.keys(filters).length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Indicadores</h2>
        <SecondaryButton
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </SecondaryButton>
      </div>

      {open ? <ChartFilterBar fields={FIELDS} className="mb-0" /> : null}

      {query.isError ? (
        <p className="text-xs text-destructive">
          Não foi possível carregar os indicadores.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((key) => {
          const spec = INDICATORS[key];
          return (
            <IndicatorCard
              key={key}
              label={spec.label}
              icon={spec.icon}
              loading={query.isPending}
              value={query.data ? spec.value(query.data) : EMPTY}
              hint={query.data ? spec.hint?.(query.data) : undefined}
            />
          );
        })}
      </div>
    </section>
  );
}

/** Public component: owns the provider, so the row's filters are its own. */
export function IndicatorsRow({ cards }: { cards: readonly IndicatorKey[] }) {
  return (
    <ChartFilterProvider initial={{}}>
      <IndicatorsRowInner cards={cards} />
    </ChartFilterProvider>
  );
}
