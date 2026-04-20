# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **yarn** (see `yarn.lock`).

- `yarn install` — install dependencies
- `yarn dev` — run Vite dev server (expects `public/points.geojson` + `public/addresses.json` to exist — run `yarn fetch-data` once first)
- `yarn fetch-data` — run the CKAN fetch pipeline locally (Node 18+)
- `yarn build` — production build to `dist/`. `prebuild` runs `scripts/fetch-rentsmart.mjs` automatically
- `yarn preview` — preview the production build locally
- `yarn test` — run Vitest once; `yarn test:watch` to watch
- `yarn lint` — ESLint; `yarn format` — Prettier write

## Environment

`.env` is committed and must define:
- `VITE_MAPBOX_API_KEY` — Mapbox GL access token, read in `src/components/HomeMap.vue` via `import.meta.env`
- `VITE_APP_TITLE`

## Architecture

Single-page Vue 3 app (Composition API, Vite, Tailwind, Pinia, vue-router) for browsing Boston housing-violation records on a clustered Mapbox map. Data covers **2021–present** and refreshes daily via a Netlify build hook triggered by GitHub Actions.

**Entry / routing** (`src/main.js`): `/` and `/address/:address` render `HomeBody`; `/about` renders `AboutPage`; catch-all `PageNotFound`. `App.vue` renders `TitleBar` + `<router-view>`. Filter state is synced to query params (`?cat=`, `?nbhd=`, `?owner=`) via `router.replace`.

**Layout**: `HomeBody` stacks `FilterPanel` (left drawer on desktop, collapsible bar on mobile) beside a flex pair of `InfoPane` (conditional) and `HomeMap` (always mounted). `TitleBar` hosts `SearchBar`.

### Three-artifact data model

Build-time artifacts live in `public/` and are regenerated on every Netlify build (and daily via a cron-triggered build hook):

| Artifact | Purpose |
|---|---|
| `public/points.geojson` | One Point feature per unique address with `{a, n, o, p, t, 0..5}` properties. Loaded once via `dataStore.load()`, fed into a clustered Mapbox GL source. |
| `public/addresses.json` | `[{a, i}, ...]` search index. Same `i` as the feature's `id`. |
| `public/data-version.json` | `{built_at, source_row_count, address_count, resource_id}` for debugging / cache busting. |

On address selection the frontend hits CKAN's `datastore_search_sql` endpoint live for per-address violation details (~400 ms). The full 396k-row dump is never loaded at runtime.

Category order is **fixed** in `src/lib/categories.js` and shared with `scripts/fetch-rentsmart.mjs`. Keep them in sync: index `i` in `CATEGORIES[]` == `properties[i]` on a feature.

### State (Pinia stores in `src/stores/`)

- `dataStore` — fetches `points.geojson` + `addresses.json` once. Exposes `geojson`, `addresses`, `featuresById`, `neighborhoods`, `featureByAddress(address)`, `loading`, `error`.
- `recordStore` — `selectedRecord`, `detailsLoading`, `detailsError`. `setSelectedRecord(data)` populates the six empty category arrays; `loadDetailsForAddress(address)` fires the CKAN SQL query and fills them in.
- `mapStore` — wraps the Mapbox `Map` instance. `HomeMap` registers it on mount; `InfoPane` calls `resizeMap()` when opening/closing so the map re-fits after the pane animates.
- `filterStore` — `{categories: Set<string>, neighborhood, ownerQuery}`. Exposes `matchesFeature(props)` (used by SearchBar autocomplete) and `toMapboxFilter()` (applied to the unclustered points layer via `map.setFilter`). `toQuery()` / `fromQuery()` handle URL sync.

### Component map

- `HomeMap.vue` — `<script setup>`. Clustered GeoJSON source + three layers (clusters, cluster counts, unclustered points). Click a cluster to zoom; click a point to select the address (calls `recordStore.setSelectedRecord` + `loadDetailsForAddress`).
- `SearchBar.vue` — autocomplete against `dataStore.addresses`, filtered through `filterStore.matchesFeature`. `role="combobox"` + arrow-key nav + Esc.
- `InfoPane.vue` — renders the six category sections. Skeleton while `detailsLoading`, error banner with Retry on `detailsError`. Focus moves to the close button on open; Esc closes; focus returns to the triggering element.
- `FilterPanel.vue` — category checkboxes with totals, neighborhood dropdown, owner substring filter. Collapsible on mobile.
- `TitleBar.vue`, `AboutPage.vue`, `PageNotFound.vue` — copy mentions 2021–present and daily Boston Open Data refresh.

### Styling

Tailwind with a custom City-of-Boston palette defined in `tailwind.config.js` (`charles-blue`, `optimistic-blue`, `freedom-red`, numbered `blue-*` and `gray-*`). The default Tailwind color palette is overridden — only these named colors are available. Fonts: `font-sans` = Montserrat, `font-serif` = Lora.

### Deploy

Netlify. `netlify.toml` pins cache headers for the two big static artifacts (1h browser, 24h CDN, 7d stale-while-revalidate). SPA fallback is handled by `public/_redirects` (`/* /index.html 200`). `.github/workflows/refresh-data.yml` POSTs the Netlify build hook (stored as the `NETLIFY_BUILD_HOOK` repo secret) daily at 08:00 UTC.

### Tests

Vitest + `@vue/test-utils`, jsdom environment. Seed suites in `tests/`:
- `filterStore.test.js` — `matchesFeature` across category / neighborhood / owner dimensions + URL round-trip.
- `fetch-rentsmart.test.js` — grouping and feature-id invariants against a small fixture.
- `searchFilter.test.js` — autocomplete filter behaviour (regression for the historical `return address` bug).

## Historical context

- The old `data/` directory (`rs-2016.csv / .json / .geojson`, `transform.py`, etc.) and the former runtime dataset at `public/rs-2016.json` are obsolete. Kept in `data/` for reference only; nothing imports them.
- `src/store.js` (orphan duplicate) and empty `src/views/` + `src/assets/` have been removed.
