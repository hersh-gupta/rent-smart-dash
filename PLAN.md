# RentSmart Boston v2 — Plan

Drafted 2026-04-19. Pick up from here in a later session.

## Goal

Rebuild the RentSmart Boston Dashboard on top of the **live Boston Open Data** RentSmart feed (resource `dc615ff7-2ff3-416a-922b-f0f334f085d0`), with all records visible on a clustered map, filters, shareable URLs, and cleaned-up plumbing. Keep the two-pane layout and Boston color palette.

## Data findings (measured 2026-04-19)

- Endpoint base: `https://data.boston.gov/api/3/action/`
  - `datastore_search_sql?sql=...` for SQL queries (wrap resource UUID in double quotes because it starts with a digit).
  - `datastore_search?resource_id=...&limit=...&offset=...` for paged paging.
  - Full dump (don't use at runtime): `https://data.boston.gov/datastore/dump/dc615ff7-2ff3-416a-922b-f0f334f085d0?format=json` (~100 MB raw).
- **396,978 rows**, **89,105 unique addresses** (~4.5 violations/address avg).
- Date range: **2021-05-15 → current day**. The resource title "RENTSMART 2016 - PRESENT" is wrong — there is no pre-2021 data. **UI copy must say 2021–present.**
- Violation-type distribution: Enforcement Violations 276,175 (70%), Housing Complaints 50,933, Sanitation Requests 43,675, Housing Violations 16,040, Civic Maintenance Requests 7,001, Building Violations 3,154. Keep these six category names exactly — they match what InfoPane already renders.
- Schema (all `text`): `date, violation_type, description, address, neighborhood, zip_code, parcel, owner, year_built, year_remodeled, property_type, latitude, longitude`. `zip_code` is already embedded in `address`; `year_built` and `year_remodeled` are unused.
- Per-address SQL detail query: ~400 ms round-trip. Fast enough for lazy detail loading.

## Architecture: three artifacts

| Artifact | Size (gz, measured) | Purpose | When loaded |
|---|---|---|---|
| `public/points.geojson` | ~6 MB | One Point feature per address with violation-count properties; Mapbox GeoJSON source with clustering | Once at app open |
| `public/addresses.json` | ~3–5 MB | Trimmed search index: `[{a: address, i: featureId}, ...]` | Once at app open (or lazy when search is focused) |
| CKAN live query | ~400 ms per address | Full violation details (`date, violation_type, description`) for one address | On address selection |

Total initial payload: ~10 MB gzipped, CDN-cached. After the first visit, free.

### Alternative if 10 MB feels heavy

Drop `addresses.json` entirely. Use CKAN's `datastore_search?q=<term>` live for autocomplete. Debounce keystrokes (~250 ms). Map geojson still loads at open.

### PMTiles — out of scope

89k points clusters fine in a native Mapbox GL GeoJSON source. Revisit only if we outgrow it.

## Build pipeline

- New `scripts/fetch-rentsmart.mjs` (Node, ESM, no deps beyond stdlib `fetch`).
  - Paginate CKAN via `datastore_search` with `limit=32000` (CKAN max) in a loop until fewer than `limit` records returned.
  - Group by `address`; drop `zip_code`, `year_built`, `year_remodeled`.
  - Emit `public/points.geojson` (see "GeoJSON shape" below) and `public/addresses.json`.
  - Emit `public/data-version.json` with `{built_at, source_row_count, address_count, resource_id}` for debugging and cache busting.
- `package.json`: add `"prebuild": "node scripts/fetch-rentsmart.mjs"` so Netlify regenerates on every deploy.
- **Scheduled refresh:** Netlify build hook triggered by a GitHub Actions cron (daily, e.g., 08:00 UTC). Add `.github/workflows/refresh-data.yml` that `curl -X POST`s the build hook URL stored as a repo secret `NETLIFY_BUILD_HOOK`.
- **Cache headers:** add `netlify.toml` with:
  ```
  [[headers]]
    for = "/points.geojson"
    [headers.values]
      Cache-Control = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
  [[headers]]
    for = "/addresses.json"
    [headers.values]
      Cache-Control = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
  ```
- Remove `public/rs-2016.json` after the new pipeline is in.

### GeoJSON shape

```
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 0,
      "geometry": { "type": "Point", "coordinates": [lng, lat] },
      "properties": {
        "a": "99 Albano St, 02131",
        "n": "Roslindale",
        "o": "PISANO TANIA",
        "p": "Residential 2-family",
        "t": 3,          // total violations
        "0": 0, "1": 1, "2": 2, "3": 0, "4": 0, "5": 0  // per-category counts, categories indexed in the order listed above
      }
    }
  ]
}
```

The Feature `id` is the same `i` used in `addresses.json`. SearchBar picks an entry → looks up the feature on the map → fires an address-detail CKAN query.

## Frontend changes

### Routing (`src/main.js`)
- Keep `/`, `/address/:address`, `/about`, catch-all.
- Additionally read/write query params for filter state (see below). Use `router.replace` to avoid polluting history on every filter tweak.

### State (`src/stores/`)
- **Delete `src/store.js`** (orphan duplicate).
- `recordStore` — keep. Add `loadDetailsForAddress(addr)` that hits `datastore_search_sql` and populates the six category arrays on the selected record.
- `mapStore` — wire it up for real. `HomeMap` registers the map instance; `InfoPane` calls `resizeMap()` on open/close so the map re-fits after the pane animates in.
- New `filterStore` — `{categories: Set<string>, neighborhood: string|null, ownerQuery: string}`. Exposes a `matchesFeature(props)` predicate. Subscribed by `HomeMap` (updates a Mapbox `filter` expression on the layer) and by `SearchBar` (filters autocomplete). Syncs to URL query params.

### Components (all to `<script setup>`)
- `HomeMap.vue` — convert from Options API to `<script setup>`. Add clustered GeoJSON source + three layers (clusters, cluster counts, unclustered points). Click a cluster to zoom; click a point to `recordStore.setSelectedRecord({address: props.a})` and trigger `loadDetailsForAddress`.
- `SearchBar.vue` — fix the `return address` bug (should be `return true` — the filter callback's return value, not the address itself, is what decides inclusion). Consume `filterStore` to scope results. Keyboard nav on the autocomplete list (Up/Down/Enter/Esc).
- `InfoPane.vue` — render skeleton while details are loading. Handle detail-fetch error with a retry button. Close button should also clear filters? No — filters persist; only the selection clears.
- New `FilterPanel.vue` — category checkboxes (with counts from the loaded geojson), neighborhood dropdown (derive options from geojson properties), owner text filter. Collapsible on mobile.
- `TitleBar.vue` — change "RentSmart Boston" subtitle/strapline to mention **2021–present**. Update `<title>` in `index.html` likewise.
- `AboutPage.vue` — update the data-source description to say 2021-present and to mention that data refreshes daily from Boston Open Data.

### Cleanup / bug fixes
- Delete `src/store.js`.
- Delete empty `src/views/` and `src/assets/`.
- Remove commented-out `mapStore` code paths in `HomeMap.vue` / `InfoPane.vue` once the store is wired for real.
- `SearchBar.vue:69` — fix `return address` → `return true`.
- `InfoPane.vue:32` — typo "Compliants" → "Complaints".

## Loading / empty / error UX

- App shell renders immediately (TitleBar + empty map + collapsed filter panel).
- Map overlay spinner while `points.geojson` loads.
- If fetch fails: banner with retry; keep the UI interactive (search still works via live CKAN `q=`).
- InfoPane: skeleton list rows while per-address query is in flight; error state with retry.

## Accessibility pass

- `SearchBar`: `<label>` for the input (visually hidden), `role="combobox"` + `aria-expanded` + `aria-activedescendant`, arrow-key nav, Esc to close.
- `InfoPane`: focus moves to the close button when it opens; Esc closes; focus returns to the triggering element.
- All buttons get `aria-label`s where they're icon-only.

## Tooling

- Vitest + `@vue/test-utils`. Seed tests:
  - `filterStore.matchesFeature` across each filter dimension.
  - SearchBar filter logic (post-bug-fix).
  - `fetch-rentsmart.mjs` grouping on a small fixture.
- ESLint (`@vue/eslint-config-prettier`) + Prettier. Scripts: `yarn lint`, `yarn test`.
- Update CLAUDE.md to reflect new architecture once implemented.

## Work order

1. **Build pipeline** — write `scripts/fetch-rentsmart.mjs`, run it once locally, verify `points.geojson` + `addresses.json` sizes land near 6 MB / 4 MB gzipped. Wire `prebuild`.
2. **Cleanup sweep** — delete `src/store.js`, empty dirs, fix SearchBar bug, fix "Compliants" typo, migrate all components to `<script setup>`. Ship as its own commit so the v2 work sits on a clean base.
3. **Map clustering** — replace HomeMap single-marker logic with GeoJSON source + cluster layers. Click-to-select flows through `recordStore.setSelectedRecord({address})` + `loadDetailsForAddress`.
4. **Filter store + FilterPanel** — URL-synced. Applied to both map layer filter expression and SearchBar autocomplete.
5. **Loading / empty / error states + a11y pass.**
6. **Tests + lint.**
7. **Copy/title updates** — 2021-present everywhere (TitleBar, index.html `<title>`, AboutPage, README).
8. **Netlify cron + cache headers** — add `netlify.toml`, GitHub Actions workflow, store build hook secret.
9. **Update CLAUDE.md.**

## Open questions

- Confirm Netlify build minutes budget allows a daily rebuild with a ~100 MB fetch (probably fine — the fetch is <1 min and builds average ~2 min).
- Decide whether `FilterPanel` is a left drawer (desktop) + bottom sheet (mobile), or overlays on the map. Current layout is tight; overlay is probably cleanest.
- Decide whether to keep `/address/:address` as a route or use a `?address=` query param alongside the other filters.
