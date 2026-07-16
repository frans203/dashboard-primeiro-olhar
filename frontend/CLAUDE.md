# Frontend — Instituto Primeiro Olhar Dashboard

React + Vite + TypeScript dashboard that consumes the FastAPI backend and renders
**charts, tables and indicator cards with per-chart filters**. Mobile-first, responsive.

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api → http://localhost:8000)
npm run build      # tsc -b + vite build
npm run lint       # tsc --noEmit
```

The backend must be running for live data. In dev, Vite proxies `/api` to `:8000`
(see `vite.config.ts`); for other origins set `VITE_API_BASE_URL`.

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
  before becoming a query string.

**Filters compose the query key.** A chart's filters object is passed straight into the
TanStack Query key (`api/endpoints.ts` → `queryKeys`). Change a filter → new key →
automatic refetch + per-combination caching. Do not manually refetch.

### Per-instance chart state (factory + Context + hook — no prop drilling)

- `stores/createChartFilterStore.ts` — a **factory** that builds a vanilla Zustand
  store holding only that chart's filters.
- `stores/chartFilterContext.tsx` — `ChartFilterProvider` creates ONE store per mount
  and exposes it via Context; `useChartFilters()` / `useChartFilterActions()` read and
  write it. Two instances of the same chart therefore have independent filters.
- **Exception — shared reference data:** the therapy list (`/api/filters/therapies`) is
  **server state**, so it lives in the Query cache and is read via `hooks/useTherapies.ts`
  by anyone. It is NOT a per-chart store.

## `ui-kit` layer (always compose from it)

`components/ui-kit/` holds the brand presentation components: `PrimaryButton`,
`SecondaryButton`, `Dropdown`, `SelectFilterField` / `NumberFilterField`, `Card`,
`IndicatorCard`. **Always build UI from these — never style raw elements ad hoc.**

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

## Visual identity & layout

- **Name:** Instituto Primeiro Olhar Dashboard. **Logo:** eye icon (`Eye`).
- **Palette:** pastel blue & yellow (institute for children with Down syndrome) —
  warm, modern, friendly. Tokens are CSS variables in `src/index.css`, wired into
  Tailwind (`tailwind.config.js`) as shadcn semantic tokens + `brand.*`. Chart palette
  in `lib/chart-colors.ts` (use it so all charts read as one system).
- **Mobile-first & responsive:** single-column grids on mobile → multi-column on
  desktop; cards stack; charts always in `ResponsiveContainer`; ~44px touch targets;
  no horizontal page scroll (wide tables scroll inside their own container).
- **Navigation:** desktop = collapsed icon rail that expands on hover to show the logo
  and tab labels (`layout/Sidebar.tsx` → `DesktopSidebar`); mobile = collapsed bar with
  a `Menu` button opening a shadcn Sheet drawer that closes on selection (`MobileNav`).
  Tabs & icons: Demografia `Users`, Saúde `HeartPulse`, Socioeconômico `Wallet`,
  Cruzamentos `GitCompare`. Active tab is highlighted. Routing is lightweight page
  state in `layout/AppShell.tsx` (no router dependency).

## Adding a new chart (use the molde)

The one fully wired chart is `components/charts/ExampleSexChart.tsx` — the **template**.
To add a chart:

1. **Copy `ExampleSexChart`.** It already wires: `ChartFilterProvider` → store →
   `useChartFilters`/`useChartFilterActions` → a query hook → a generic chart in
   `ChartState`.
2. **Swap the query hook.** Implement the matching hook in `hooks/queries.ts` (they are
   `// TODO` stubs following `useDemographicsQuery`), and complete its fetcher in
   `api/endpoints.ts` (uncomment the `getJson(...)` line + Zod schema).
3. **Swap the generic chart** for the right one (`BarChart`, `HorizontalBarChart`,
   `PieChart`, `GroupedBarChart`).
4. **Pick pertinent filters only**, and **never filter by the chart's own axis**
   (e.g. the sex chart does not offer a `sex` filter).
5. Drop it into the page, replacing the corresponding `TodoPanel`.

Filter controls are ui-kit `SelectFilterField` / `NumberFilterField`, bound to the
store via `useChartFilterActions().setFilter`.
