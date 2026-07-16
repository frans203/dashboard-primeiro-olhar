import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * App-wide providers. TanStack Query is the single home for SERVER state — responses
 * live in this cache and are never copied elsewhere. Per-chart FILTER state lives in
 * local Zustand stores (see `stores/chartFilterContext`), not here.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min — dataset is static
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
