import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { CATEGORIES } from '../lib/categories'

// filterStore holds the currently active filter state and exposes a
// matchesFeature(properties) predicate used by both the search autocomplete
// and the map layer's Mapbox filter expression.

export const useFilterStore = defineStore('filter', () => {
  // Which categories are enabled. Empty set = treat as "all categories".
  const categories = ref(new Set())
  const neighborhood = ref(null)
  const ownerQuery = ref('')

  const hasCategoryFilter = computed(() => categories.value.size > 0)

  function toggleCategory(name) {
    const next = new Set(categories.value)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    categories.value = next
  }

  function setNeighborhood(value) {
    neighborhood.value = value || null
  }

  function setOwnerQuery(value) {
    ownerQuery.value = value || ''
  }

  function reset() {
    categories.value = new Set()
    neighborhood.value = null
    ownerQuery.value = ''
  }

  // Predicate against a GeoJSON feature's properties object.
  function matchesFeature(props) {
    if (!props) return false

    if (hasCategoryFilter.value) {
      let anyPositive = false
      for (const name of categories.value) {
        const idx = CATEGORIES.indexOf(name)
        if (idx >= 0 && (props[idx] || props[String(idx)]) > 0) {
          anyPositive = true
          break
        }
      }
      if (!anyPositive) return false
    }

    if (neighborhood.value && props.n !== neighborhood.value) return false

    const q = ownerQuery.value.trim().toLowerCase()
    if (q && !String(props.o || '').toLowerCase().includes(q)) return false

    return true
  }

  // Mapbox filter expression equivalent to matchesFeature. Rebuilt on every
  // filter change and assigned to the unclustered layer with setFilter().
  function toMapboxFilter() {
    const clauses = ['all']

    if (hasCategoryFilter.value) {
      const anyOf = ['any']
      for (const name of categories.value) {
        const idx = CATEGORIES.indexOf(name)
        if (idx >= 0) anyOf.push(['>', ['to-number', ['get', String(idx)]], 0])
      }
      clauses.push(anyOf)
    }

    if (neighborhood.value) {
      clauses.push(['==', ['get', 'n'], neighborhood.value])
    }

    const q = ownerQuery.value.trim().toLowerCase()
    if (q) {
      // Mapbox expressions don't support substring match directly, so we
      // lower-case the stored value and check via downcase + string concat trick.
      clauses.push([
        'in',
        q,
        ['downcase', ['coalesce', ['get', 'o'], '']],
      ])
    }

    return clauses
  }

  // Serialize to URL query params for shareable links.
  function toQuery() {
    const q = {}
    if (hasCategoryFilter.value) {
      q.cat = [...categories.value].join(',')
    }
    if (neighborhood.value) q.nbhd = neighborhood.value
    if (ownerQuery.value) q.owner = ownerQuery.value
    return q
  }

  function fromQuery(query) {
    const cat = query.cat
    if (typeof cat === 'string' && cat.length) {
      categories.value = new Set(cat.split(',').filter(Boolean))
    } else {
      categories.value = new Set()
    }
    neighborhood.value = typeof query.nbhd === 'string' && query.nbhd ? query.nbhd : null
    ownerQuery.value = typeof query.owner === 'string' ? query.owner : ''
  }

  return {
    categories,
    neighborhood,
    ownerQuery,
    hasCategoryFilter,
    toggleCategory,
    setNeighborhood,
    setOwnerQuery,
    reset,
    matchesFeature,
    toMapboxFilter,
    toQuery,
    fromQuery,
  }
})
