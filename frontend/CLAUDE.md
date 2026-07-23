# Frontend — Instituto Primeiro Olhar Dashboard

React + Vite + TypeScript dashboard that consumes the FastAPI backend and renders
**charts, tables and indicator cards with per-chart filters**. Mobile-first, responsive.

Todas as telas leem a **API real** — o mock de demonstração que existia em
`src/api/mock/` foi removido.

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api → http://localhost:8000)
npm run build      # tsc -b + vite build
npm run lint       # tsc --noEmit
```

The backend must be running for live data. In dev, Vite proxies `/api` to `:8000`
(see `vite.config.ts`); for other origins set `VITE_API_URL` (`VITE_API_BASE_URL` is
still honoured as an alias).

## Stack

React 18 · Vite · TypeScript · **Recharts 3** (charts) · **TanStack Query** (server
state) · **Zustand** (filters) · **Zod** (boundary validation) · TanStack Table ·
Tailwind + **shadcn/ui** · **lucide-react** (the ONLY icon library).

## State architecture (follow this)

Three responsibilities, three homes:

- **TanStack Query = server state.** API responses live in the Query cache. **Never
  copy them into another store.** Providers set up the `QueryClient` (`layout/Providers.tsx`).
- **Zustand = per-chart filters.** Each chart instance owns a filter store.
- **Zod = the boundary.** Responses are validated on the way INTO the cache
  (`api/client.ts` → `getJson` + schemas in `api/schemas.ts`); filters are validated
  before becoming a query string (`filtersSchema`, same file).

**Filters compose the query key.** A chart's filters object is passed straight into the
TanStack Query key (`api/endpoints.ts` → `queryKeys`). Change a filter → new key →
automatic refetch + per-combination caching. Do not manually refetch.

### Two datasets, zero chart changes (`stores/dataSourceContext.tsx`)

The API serves the institute's TSV under `/api` and the uploaded CSV under
`/api/uploads` — identical routes and shapes. `DataSourceProvider` says which one a
subtree reads; **every query hook reads that context itself** and passes it to the
fetcher (path prefix) and to the key (scope + upload `version`). So a chart component
never mentions the dataset, and the "Analisar CSV" page reuses all 18 charts verbatim
just by wrapping them.

The upload `version` inside the key is what makes a replacement file refresh the
screen: new version → new keys → refetch. Never `invalidateQueries` for this.

The loaded CSV's metadata is server state like any other (`hooks/useUploadStatus.ts`),
which is also how the page recovers after a reload. `api/client.ts` grew `postFile`/`del` plus `ApiError`, which carries the API's
pt-BR `detail` — the upload card shows that message as-is (e.g. which columns are
missing).

**One route, one pertinent subset.** `ROUTE_FILTERS` (`api/endpoints.ts`) mirrors the
query DTOs in `backend/dtos.py` — exactly what each route accepts. `pickRouteFilters`
narrows a chart's filters to that subset and the SAME narrowed object builds the key and
the request, so charts sharing a route also share cache entries. Anything else would be
silently ignored by the API (a control that looks active but does nothing), so it is
dropped instead of sent. When a brief asks for a filter its route has no param for, the
DTO wins — see `DeliveryTypeChart` (no `parentEducation`).

**Enums live once.** The `const` arrays in `types/filters.ts` produce the TS unions, the
Zod enums, and the pt-BR dropdown options (`lib/filter-options.ts`). Add a value there
and a missing label becomes a type error rather than an absent option.

### Per-instance chart state (factory + Context + hook — no prop drilling)

- `stores/createChartFilterStore.ts` — a **factory** that builds a vanilla Zustand
  store holding only that chart's filters.
- `stores/chartFilterContext.tsx` — `ChartFilterProvider` creates ONE store per mount
  and exposes it via Context; `useChartFilters()` / `useChartFilterActions()` read and
  write it. Two instances of the same chart therefore have independent filters.
- **Exception — shared reference data:** the therapy list (`/api/filters/therapies`) is
  **server state**, so it lives in the Query cache and is read via `hooks/useTherapies.ts`
  by anyone. It is NOT a per-chart store. The city options (`hooks/useCities.ts`) work the
  same way, but there is no cities route: they are derived from the UNFILTERED
  `/api/demographics` ranking (same cache entry the cities chart already uses, so no extra
  request), minus the "Outras" bucket — an aggregate, and `city` is validated strictly by
  the API. Only the top 10 are therefore selectable; a real `/api/filters/cities` route
  would lift that.
- **The KPI row is an instance too.** `components/IndicatorsRow.tsx` owns a store and a
  filter bar like any chart, and each page passes the `cards` its brief calls for.

## `ui-kit` layer (always compose from it)

`components/ui-kit/` holds the brand presentation components: `PrimaryButton`,
`SecondaryButton`, `Dropdown`, `SelectFilterField` / `NumberFilterField`, `Card`,
`IndicatorCard`, `TabsBar`. **Always build UI from these — never style raw elements ad hoc.**

Every ui-kit component follows one contract:
- encapsulates the base identity style;
- accepts a `className` that **overrides** the base via `cn` (`lib/utils.ts`, which is
  `tailwind-merge` + `clsx`) — so `<PrimaryButton className="p-6" />` bumps the padding
  without breaking the base style;
- spreads `...props` to the underlying element and forwards `ref`;
- is typed by extending the underlying HTML element's props.

`components/ui/` is the shadcn base (button, card, select, sheet, input, label) —
generated primitives the ui-kit composes on top of. `components/charts/` holds the few
generic, reused chart primitives (`BarChart`, `HorizontalBarChart`, `PieChart`,
`GroupedBarChart`) plus `ChartState` (loading/error/empty). **No hexagonal or line
charts** (project decision).

Two more shared pieces sit on top of them, and a chart should never re-do their work:
- **`ChartFilterBar`** — declarative filter controls (`fields`) bound to the instance's
  store, plus "limpar filtros". `age`/`income` render the min/max pairs the API expects.
- **`ChartCard`** — title + collapsible filter bar (badged with the active-filter count)
  + `ChartState`. Charts stay tiny: fetch a series, render it.

`lib/format.ts` owns pt-BR display rules. **Rates from the API are shares (0–1)** — see
`analytics.py` — so `formatRate` percent-formats them; a missing average renders `EMPTY`
("—") and never `0`.

`TabsBar` is the horizontal tablist of the "Analisar CSV" page — hand-built (no Radix
dep for one tablist), with roving tabindex, ←/→/Home/End, ~44px targets and horizontal
scroll on mobile. It reports the selection; the caller renders the `role="tabpanel"`.

The concrete chart instances live in per-page folders: `charts/demographics`,
`charts/health`, `charts/socioeconomic`, `charts/crossings`.

**Chart grids live in `pages/sections/`**, not in the pages. Each page is
`PageHeader + <Section />`, and the "Analisar CSV" tabs render those same sections over
the uploaded dataset — one definition of each grid, two places it appears. Add a chart
to a section, not to a page.

## Visual identity & layout

- **Name:** Instituto Primeiro Olhar Dashboard. **Logo:** eye icon (`Eye`).
- **Palette:** pastel blue & yellow (institute for children with Down syndrome) —
  warm, modern, friendly. Tokens are CSS variables in `src/index.css`, wired into
  Tailwind (`tailwind.config.js`) as shadcn semantic tokens + `brand.*`.
- **Chart palette:** `lib/chart-colors.ts` — 8 hues, brand blue & yellow first, so a
  many-slice/many-bar chart stays distinct instead of cycling two colors. The slot ORDER
  is colorblind-safety, not taste: derived by the `dataviz` skill and validated on the
  white card surface (CVD adjacent ΔE 9.2, normal-vision 15.6). Bar charts default to
  categorical (`monochrome={false}`); pass `monochrome` for a single-hue chart. **Change
  a hex or the order → re-run the skill's validator, don't eyeball.** Steps are tuned for
  the light surface (the app renders light-only).
- **Decorative background:** `.app-bg` in `index.css` — two very faint drifting blue &
  yellow blobs behind everything (`AppShell` renders the element; the body keeps
  `bg-background`, cards are opaque, so the wash only shows in the gaps). Cosmetic only:
  `aria-hidden`, `pointer-events: none`, and motion off under `prefers-reduced-motion`.
- **Mobile-first & responsive:** single-column grids on mobile → multi-column on
  desktop; cards stack; charts always in `ResponsiveContainer`; ~44px touch targets;
  no horizontal page scroll (wide tables scroll inside their own container).
- **Navigation:** desktop = collapsed icon rail that expands on hover to show the logo
  and tab labels (`layout/Sidebar.tsx` → `DesktopSidebar`); mobile = collapsed bar with
  a `Menu` button opening a shadcn Sheet drawer that closes on selection (`MobileNav`).
  Tabs & icons: Demografia `Users`, Saúde `HeartPulse`, Socioeconômico `Wallet`,
  Cruzamentos `GitCompare`, Analisar CSV `FileUp`. Active tab is highlighted. Routing is
  lightweight page state in `layout/AppShell.tsx` (no router dependency).

## Adding a new chart (use the molde)

`components/charts/demographics/SexChart.tsx` is the **template** — the smallest complete
example, documented inline. To add a chart:

1. **Copy `SexChart`.** It wires `ChartFilterProvider` → store → `useChartFilters` → a
   query hook → a generic chart inside `ChartCard`.
2. **Swap the query hook** (`hooks/queries.ts`; each is ~5 lines around
   `pickRouteFilters` + `useQuery`) and, for a new route, add its fetcher + Zod schema.
3. **Swap the generic chart** (`BarChart`, `HorizontalBarChart`, `PieChart`,
   `GroupedBarChart`).
4. **List the pertinent `FIELDS`, minus the chart's own axis** — the sex chart offers no
   `sex` filter; on the crossings pages, neither axis is offered (the filters cut the
   population, never the relation being read).
5. Drop it into its page.

Pass the query's **`isPending`** (not `isLoading`) to `ChartCard`: between retry attempts
`isLoading` drops to false while the query is still pending, which flashes the empty state
before the error.

### Known gaps against the brief

- **Apgar histogram** (`charts/health/ApgarChart.tsx`): the brief asks for a histogram by
  score bracket; `NeonatalResponse` exposes only the two averages, so the chart plots
  those. A real histogram needs a backend field (e.g. `apgarDistribution: {label,count}[]`).
- **NICU** (`charts/health/NicuChart.tsx`): `/api/neonatal` returns `nicuRate` (a share),
  not a distribution, so the two slices are derived from it and read as percentages.
