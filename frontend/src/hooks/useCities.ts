import { useQuery } from "@tanstack/react-query";

import { fetchDemographics, queryKeys } from "@/api/endpoints";
import type { DropdownOption } from "@/components/ui-kit";

/**
 * City options for the `city` filter — SHARED SERVER STATE, like the therapy list, so
 * it lives in the Query cache (never in a chart store) and every filter bar reads it
 * from here.
 *
 * There is no `/api/filters/cities` route, so the options are derived from the
 * UNFILTERED `/api/demographics` city ranking: same cache entry the cities chart uses
 * with no filters, so this costs no extra request. Two consequences, by design:
 *  - the ranking is "top 10 + Outras", so only those cities are selectable — if the
 *    full list is ever needed, the backend should expose a cities filter route;
 *  - the "Outras" bucket is dropped: it is an aggregate, not a city, and the API
 *    validates `city` strictly against known cities (unknown → 422).
 *
 * While `/api/demographics` is unimplemented this query errors; the filter bar then
 * renders the city dropdown disabled instead of breaking (see `ChartFilterBar`).
 */
const AGGREGATE_BUCKET = /^outr[ao]s$/i;

export function useCities() {
  return useQuery({
    queryKey: queryKeys.demographics({}),
    queryFn: () => fetchDemographics({}),
    staleTime: Infinity,
    gcTime: Infinity,
    select: (data): DropdownOption[] =>
      data.topCities
        .filter((c) => !AGGREGATE_BUCKET.test(c.label))
        .map((c) => ({ value: c.label, label: c.label })),
  });
}
