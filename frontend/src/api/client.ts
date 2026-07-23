/**
 * Thin HTTP client.
 *
 * - `buildQuery` turns a filters object into a query string, dropping undefined/empty
 *   values. Filters should be validated (Zod) BEFORE being passed here.
 * - `getJson` fetches and validates the response against a Zod schema at the boundary,
 *   so everything past this point is typed and trusted.
 *
 * The base URL comes from `VITE_API_URL` (`VITE_API_BASE_URL` is an alias) — see
 * `.env.example`. Leave it empty to go through the Vite proxy (`/api` → :8000 in dev).
 */
import type { ZodType } from "zod";

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

/**
 * An HTTP error carrying the API's message. FastAPI puts it in `detail`, and for the
 * upload route that message is written to be shown to the reader as-is (pt-BR: which
 * columns are missing, why the file was refused).
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readError(res: Response, fallback: string): Promise<ApiError> {
  try {
    const body = await res.json();
    const detail = (body as { detail?: unknown })?.detail;
    if (typeof detail === "string" && detail) return new ApiError(res.status, detail);
  } catch {
    // non-JSON body → fall through to the generic message
  }
  return new ApiError(res.status, fallback);
}

export async function getJson<T>(path: string, schema: ZodType<T>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw await readError(res, `Request failed: ${res.status} ${res.statusText} — ${path}`);
  }
  const json = await res.json();
  // Validate at the boundary; a schema mismatch surfaces as a query error.
  return schema.parse(json);
}

/** POST a file as multipart/form-data, validating the response at the same boundary. */
export async function postFile<T>(
  path: string,
  file: File,
  schema: ZodType<T>,
  field = "file",
): Promise<T> {
  const body = new FormData();
  body.append(field, file);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body, // no Content-Type: the browser sets it with the multipart boundary
  });
  if (!res.ok) {
    throw await readError(res, "Não foi possível enviar o arquivo.");
  }
  return schema.parse(await res.json());
}

export async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) {
    throw await readError(res, `Request failed: ${res.status} ${res.statusText} — ${path}`);
  }
}
