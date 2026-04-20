import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFilterStore } from '../src/stores/filterStore'

// Regression test for the SearchBar autocomplete filter.
// Historical bug: the filter callback returned an undefined `address`
// identifier, which coerced to falsy and dropped every match.

function autocomplete(addresses, featuresById, searchTerm, filterStore, max = 10) {
  const q = searchTerm.trim().toLowerCase()
  if (!q) return []
  const out = []
  for (const { a, i } of addresses) {
    if (!a.toLowerCase().includes(q)) continue
    const feature = featuresById.get(i)
    if (feature && !filterStore.matchesFeature(feature.properties)) continue
    out.push({ address: a, id: i })
    if (out.length >= max) break
  }
  return out
}

describe('search autocomplete', () => {
  beforeEach(() => setActivePinia(createPinia()))

  const addresses = [
    { a: '1 Main St, 02118', i: 0 },
    { a: '2 Main St, 02118', i: 1 },
    { a: '3 Oak St, 02130', i: 2 },
  ]
  const featuresById = new Map([
    [0, { properties: { a: '1 Main St, 02118', n: 'South End', o: 'ACME LLC', 0: 1, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }],
    [1, { properties: { a: '2 Main St, 02118', n: 'South End', o: 'DOE JANE', 0: 0, 1: 3, 2: 0, 3: 0, 4: 0, 5: 0 } }],
    [2, { properties: { a: '3 Oak St, 02130', n: 'JP', o: 'ACME LLC', 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } }],
  ])

  it('returns matching addresses', () => {
    const store = useFilterStore()
    const out = autocomplete(addresses, featuresById, 'main', store)
    expect(out.map((r) => r.address)).toEqual(['1 Main St, 02118', '2 Main St, 02118'])
  })

  it('honours the active filter', () => {
    const store = useFilterStore()
    store.setOwnerQuery('acme')
    const out = autocomplete(addresses, featuresById, 'st', store)
    expect(out.map((r) => r.address)).toEqual(['1 Main St, 02118', '3 Oak St, 02130'])
  })

  it('caps at max results', () => {
    const store = useFilterStore()
    const out = autocomplete(addresses, featuresById, 'st', store, 2)
    expect(out).toHaveLength(2)
  })
})
