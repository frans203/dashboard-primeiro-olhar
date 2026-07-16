/**
 * Thin HTTP client.
 *
 * - `buildQuery` turns a filters object into a query string, dropping undefined/empty
 *   values. Filters should be validated (Zod) BEFORE being passed here.
 * - `getJson` fetches and validates the response against a Zod schema at the boundary,
 *   so everything past this point is typed and trusted.
 *
 * The base URL is empty in dev (Vite proxies `/api` to the backend). Set
 * `VITE_API_BASE_URL` for production builds pointing at another origin.
 */
import type { ZodType } from "zod";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getJson<T>(path: string, schema: ZodType<T>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText} — ${path}`);
  }
  const json = await res.json();
  // Validate at the boundary; a schema mismatch surfaces as a query error.
  return schema.parse(json);
}
