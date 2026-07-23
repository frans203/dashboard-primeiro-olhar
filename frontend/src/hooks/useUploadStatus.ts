import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/api/client";
import { fetchUploadStatus, queryKeys } from "@/api/endpoints";
import type { UploadStatusResponse } from "@/api/schemas";

/**
 * The CSV currently loaded in the API's upload slot, or `null` when there is none.
 *
 * It is SERVER state like any other response — the single reader of that slot — which
 * is also how the "Analisar CSV" page recovers its state after a reload. `CsvUploadCard`
 * writes the mutation result straight into this cache entry.
 *
 * The 404 ("nothing uploaded") is an expected answer, not a failure, so it is mapped to
 * `null` instead of surfacing as a query error.
 */
export function useUploadStatus() {
  return useQuery({
    queryKey: queryKeys.uploadStatus,
    queryFn: async (): Promise<UploadStatusResponse | null> => {
      try {
        return await fetchUploadStatus();
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
}
