import { useQuery } from "@tanstack/react-query";

import { fetchTherapiesFilter, queryKeys } from "@/api/endpoints";
import type { KeyLabel } from "@/api/schemas";

/**
 * IMPLEMENTED reference-data hook.
 *
 * The therapy list (/api/filters/therapies) is SHARED SERVER STATE — the exception to
 * the per-chart store rule. It lives in the TanStack Query cache and is read by any
 * component (filter dropdowns, the therapies chart legend, …). It never changes during
 * a session, so it is effectively cached forever.
 */
export function useTherapies() {
  return useQuery({
    queryKey: queryKeys.therapiesFilter,
    queryFn: fetchTherapiesFilter,
    staleTime: Infinity,
    gcTime: Infinity,
    select: (data): KeyLabel[] => data.therapies,
  });
}
