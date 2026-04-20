// Fixed category order. Index N in this array == the `N` key on a geojson
// feature's properties (e.g. properties['0'] is the Enforcement Violations count).
// Must match scripts/fetch-rentsmart.mjs.
export const CATEGORIES = [
  'Enforcement Violations',
  'Housing Complaints',
  'Sanitation Requests',
  'Housing Violations',
  'Civic Maintenance Requests',
  'Building Violations',
]

export const CATEGORY_INDEX = new Map(CATEGORIES.map((name, i) => [name, i]))
