import { SlidersHorizontal } from "lucide-react";
import * as React from "react";

import { Card, SecondaryButton } from "@/components/ui-kit";
import { useChartFilters } from "@/stores/chartFilterContext";
import { ChartFilterBar, type FilterFieldKey } from "./ChartFilterBar";
import { ChartState } from "./ChartState";

/**
 * The shell every chart instance wears: title + a collapsible filter bar bound to the
 * instance's store + the loading/error/empty states. Charts stay tiny — they fetch and
 * render their series, nothing else.
 *
 * Must be rendered inside a `<ChartFilterProvider>` (the chart's public component owns
 * it), which is what makes the filters per-instance.
 *
 * The bar starts collapsed to keep the grid scannable on mobile; the button badges the
 * number of active filters so a filtered chart is never mistaken for an unfiltered one.
 */
export interface ChartCardProps {
  title: string;
  /** Reads under the title — units or how to read the chart. */
  description?: string;
  fields: readonly FilterFieldKey[];
  /**
   * Pass the query's `isPending`, NOT `isLoading`: between retry attempts `isLoading`
   * drops to false while the query is still pending, which flashes the empty state
   * before the error appears.
   */
  isLoading?: boolean;
  isError?: boolean;
  /** True when the query succeeded but the current filters select nothing. */
  isEmpty?: boolean;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  fields,
  isLoading,
  isError,
  isEmpty,
  height = 300,
  className,
  children,
}: ChartCardProps) {
  // Whether the bar is expanded is view state, not filter state — it stays local.
  const [open, setOpen] = React.useState(false);
  const filters = useChartFilters();
  const activeCount = Object.keys(filters).length;

  return (
    <Card
      title={title}
      className={className}
      headerAction={
        fields.length > 0 ? (
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
        ) : null
      }
    >
      {description ? (
        <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      ) : null}

      {open && fields.length > 0 ? <ChartFilterBar fields={fields} /> : null}

      <ChartState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError && isEmpty}
        height={height}
      >
        {children}
      </ChartState>
    </Card>
  );
}
