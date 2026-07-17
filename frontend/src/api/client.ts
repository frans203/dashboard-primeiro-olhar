/**
 * Thin HTTP client.
 *
 * - `buildQuery` turns a filters object into a query string, dropping undefined/empty
 *   values. Filters should be validated (Zod) BEFORE being passed here.
 * - `getJson` fetches and validates the response against a Zod schema at the boundary,
 *   so everything past this point is typed and trusted.
 *
 * The base URL is empty in dev (Vite proxies `/api` to the backend). Set
 * `VITE_API_URL` (or `VITE_API_BASE_URL`) for builds pointing at another origin.
 */
import type { ZodType } from "zod";

// ─── MOCK DE DEMONSTRAÇÃO (temporário) — apagar junto com `src/api/mock/` ───
import { mockGet, USE_MOCK_API } from "@/api/mock";
// ───────────────────────────────────────────────────────────────────────────

const BASE_URL =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "";

export function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  // URLSearchParams encodes a space as "+". That is legal in a query string, but
  // percent-encoding is unambiguous everywhere — city values ("Belo Horizonte") carry
  // spaces, so normalize to %20.
  const qs = search.toString().replace(/\+/g, "%20");
  return qs ? `?${qs}` : "";
}

export async function getJson<T>(path: string, schema: ZodType<T>): Promise<T> {
  // ─── MOCK DE DEMONSTRAÇÃO (temporário) — apagar este bloco inteiro ───
  // Valida com o mesmo schema dos dados reais; rota não mockada cai na API.
  if (USE_MOCK_API) {
    const mocked = await mockGet(path);
    if (mocked !== null) return schema.parse(mocked);
  }
  // ─────────────────────────────────────────────────────────────────────

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
