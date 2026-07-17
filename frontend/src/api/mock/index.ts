/**
 * ============================================================================
 *  MOCK DE DEMONSTRAÇÃO — TEMPORÁRIO. Dados fictícios, não são do Instituto.
 * ============================================================================
 *
 * Serve respostas falsas no lugar da API, para gravar o vídeo sem depender do backend
 * (as rotas ainda retornam 501). As respostas passam pelo MESMO Zod dos dados reais,
 * então o que aparece na tela é exatamente o que a API de verdade vai produzir.
 *
 * ─── PARA DESLIGAR ──────────────────────────────────────────────────────────
 *   Troque `USE_MOCK_API` para `false` (uma linha, logo abaixo).
 *
 * ─── PARA REMOVER DE VEZ ────────────────────────────────────────────────────
 *   1. apague a pasta `src/api/mock/`;
 *   2. em `src/api/client.ts`, apague o bloco marcado "MOCK DE DEMONSTRAÇÃO"
 *      (o import no topo e o `if` dentro de `getJson`).
 *   Nada mais no app conhece este arquivo.
 * ────────────────────────────────────────────────────────────────────────────
 */
import * as D from "./data";

/** ⇦ TROQUE AQUI: `false` volta a falar com a API real. */
export const USE_MOCK_API: boolean = true;

/** Atraso artificial: dá tempo do skeleton de carregamento aparecer na gravação. */
const LATENCY_MS = 250;

const ROUTES: Record<string, unknown> = {
  "/api/filters/therapies": D.therapiesFilter,
  "/api/demographics": D.demographics,
  "/api/neonatal": D.neonatal,
  "/api/diagnosis": D.diagnosis,
  "/api/health": D.health,
  "/api/therapies": D.therapies,
  "/api/socioeconomic": D.socioeconomic,
  "/api/crossings/income-therapies": D.incomeTherapies,
  "/api/crossings/delivery-complications": D.deliveryComplications,
  "/api/crossings/bpc-income": D.bpcIncome,
  "/api/indicators": D.indicators,
};

/** Médias (escala 0–10) e taxas (0–1): deslocadas, nunca multiplicadas. */
const AVG_KEYS = new Set(["apgar1minAvg", "apgar5minAvg"]);
const RATE_KEYS = new Set(["nicuRate", "therapyRate", "surgeryRate"]);

interface Cut {
  /** Multiplica as contagens: um recorte sempre seleciona menos crianças. */
  factor: number;
  /** Desloca médias e taxas. */
  nudge: number;
}

/** Mesma query string → mesmo resultado, sempre (senão os gráficos "tremem"). */
function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Deriva um recorte dos filtros aplicados. Sem filtros → identidade (os números
 * "cheios" batem com os do dataset). Com filtros → menos crianças e médias levemente
 * diferentes, para o filtro ter efeito visível na demonstração.
 */
function cutFor(queryString: string): Cut {
  if (!queryString) return { factor: 1, nudge: 0 };
  const h = hash(queryString);
  return {
    factor: 0.3 + (h % 51) / 100, // 0.30 – 0.80
    nudge: ((h >> 8) % 9) / 10 - 0.4, // -0.4 – +0.4
  };
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, places: number) => Number(n.toFixed(places));

function reshape(value: unknown, key: string | null, cut: Cut): unknown {
  if (Array.isArray(value)) return value.map((item) => reshape(item, key, cut));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, reshape(v, k, cut)]),
    );
  }
  if (typeof value === "number" && key !== null) {
    if (AVG_KEYS.has(key)) return round(clamp(value + cut.nudge, 0, 10), 1);
    if (RATE_KEYS.has(key)) return round(clamp(value + cut.nudge / 5, 0, 1), 2);
    if (Number.isInteger(value)) return Math.round(value * cut.factor);
  }
  return value;
}

/**
 * Resposta fictícia para `path` (com query string), ou `null` se a rota não for mockada
 * — nesse caso o client segue e chama a API de verdade.
 */
export async function mockGet(path: string): Promise<unknown | null> {
  const [route, queryString = ""] = path.split("?");
  const payload = ROUTES[route];
  if (payload === undefined) return null;

  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  return reshape(payload, null, cutFor(queryString));
}
