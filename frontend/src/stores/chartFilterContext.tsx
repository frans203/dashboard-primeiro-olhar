import * as React from "react";
import { useStore } from "zustand";

import type { Filters } from "@/types/filters";
import {
  createChartFilterStore,
  type ChartFilterState,
  type ChartFilterStore,
} from "./createChartFilterStore";

/**
 * Local Context that exposes a chart-instance's filter store to its subtree.
 * Subcomponents read/write filters via the hooks below — no prop drilling.
 *
 * NOTE: this is for per-chart FILTER state only. Shared reference data (the therapy
 * list from /api/filters/therapies) is SERVER state and lives in the TanStack Query
 * cache — never put it here.
 */
const ChartFilterContext = React.createContext<ChartFilterStore | null>(null);

export function ChartFilterProvider({
  initial,
  children,
}: {
  initial?: Partial<Filters>;
  children: React.ReactNode;
}) {
  // One store per provider instance, created once.
  const storeRef = React.useRef<ChartFilterStore>();
  if (!storeRef.current) {
    storeRef.current = createChartFilterStore(initial);
  }
  return (
    <ChartFilterContext.Provider value={storeRef.current}>
      {children}
    </ChartFilterContext.Provider>
  );
}

/** Select any slice of the chart's filter state. */
export function useChartFilterStore<T>(selector: (state: ChartFilterState) => T): T {
  const store = React.useContext(ChartFilterContext);
  if (!store) {
    throw new Error("useChartFilterStore must be used within a <ChartFilterProvider>");
  }
  return useStore(store, selector);
}

/** Convenience: the current filters object (used to build the query key). */
export function useChartFilters(): Partial<Filters> {
  return useChartFilterStore((s) => s.filters);
}

/** Convenience: the mutation actions. */
export function useChartFilterActions() {
  const setFilter = useChartFilterStore((s) => s.setFilter);
  const setFilters = useChartFilterStore((s) => s.setFilters);
  const reset = useChartFilterStore((s) => s.reset);
  return { setFilter, setFilters, reset };
}
