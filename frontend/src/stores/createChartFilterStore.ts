import { createStore } from "zustand/vanilla";

import type { FilterKey, Filters } from "@/types/filters";

/**
 * Per-chart-instance filter store (Zustand vanilla store, created by a factory).
 *
 * Each chart gets its OWN store instance so two instances of the same chart don't
 * share filters. The store holds only the filters pertinent to that chart. The
 * `filters` object flows into the TanStack Query key, so mutating it triggers an
 * automatic refetch/cache lookup.
 */
export interface ChartFilterState {
  filters: Partial<Filters>;
  /** Set (or clear, when value is undefined/"") a single filter. */
  setFilter: <K extends FilterKey>(key: K, value: Filters[K] | undefined) => void;
  /** Merge a patch of filters. */
  setFilters: (patch: Partial<Filters>) => void;
  /** Reset back to the initial filters. */
  reset: () => void;
}

export type ChartFilterStore = ReturnType<typeof createChartFilterStore>;

export function createChartFilterStore(initial: Partial<Filters> = {}) {
  return createStore<ChartFilterState>((set) => ({
    filters: initial,
    setFilter: (key, value) =>
      set((state) => {
        const next = { ...state.filters };
        if (value === undefined || value === ("" as unknown)) {
          delete next[key];
        } else {
          next[key] = value;
        }
        return { filters: next };
      }),
    setFilters: (patch) =>
      set((state) => ({ filters: { ...state.filters, ...patch } })),
    reset: () => set({ filters: initial }),
  }));
}
