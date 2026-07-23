/**
 * Which dataset the charts under this subtree read from.
 *
 * The app serves two: the institute's fixed TSV (`/api/*`) and the CSV the user
 * uploads on the "Analisar CSV" page (`/api/uploads/*`). They expose the SAME routes,
 * shapes and filters, so a chart does not need to know which one it is rendering — it
 * asks its query hook, the hook reads this context and picks the path prefix.
 *
 * That is the whole reason the upload page reuses all 18 chart components untouched.
 *
 * `version` is the upload counter returned by the API. It rides in the query key, so a
 * new upload produces new keys → TanStack Query refetches on its own. Never invalidate
 * by hand (see `frontend/CLAUDE.md`).
 */
import * as React from "react";

export type DataSourceName = "institute" | "upload";

export interface DataSource {
  name: DataSourceName;
  /** Upload counter; `undefined` for the institute dataset (it never changes). */
  version?: number;
}

const INSTITUTE: DataSource = { name: "institute" };

const DataSourceContext = React.createContext<DataSource>(INSTITUTE);

export function DataSourceProvider({
  source,
  children,
}: {
  source: DataSource;
  children: React.ReactNode;
}) {
  // Memoized on its fields: a new object identity each render would re-key every query.
  const value = React.useMemo<DataSource>(
    () => ({ name: source.name, version: source.version }),
    [source.name, source.version],
  );
  return (
    <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>
  );
}

/** The active dataset. Defaults to the institute's, so existing pages are unaffected. */
export function useDataSource(): DataSource {
  return React.useContext(DataSourceContext);
}
