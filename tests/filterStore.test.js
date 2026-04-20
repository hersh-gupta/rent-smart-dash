import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFilterStore } from '../src/stores/filterStore'

const sampleProps = {
  a: '99 Albano St, 02131',
  n: 'Roslindale',
  o: 'PISANO TANIA',
  p: 'Residential 2-family',
  t: 3,
  0: 0, // Enforcement Violations
  1: 1, // Housing Complaints
  2: 2, // Sanitation Requests
  3: 0,
  4: 0,
  5: 0,
}

describe('filterStore.matchesFeature', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('matches everything when no filters are set', () => {
    const store = useFilterStore()
    expect(store.matchesFeature(sampleProps)).toBe(true)
  })

  it('filters by category (keeps features with >0 count in any selected category)', () => {
    const store = useFilterStore()
    store.toggleCategory('Housing Complaints')
    expect(store.matchesFeature(sampleProps)).toBe(true)

    store.toggleCategory('Housing Complaints') // untoggle
    store.toggleCategory('Building Violations') // 5 → 0 in sample
    expect(store.matchesFeature(sampleProps)).toBe(false)
  })

  it('filters by neighborhood', () => {
    const store = useFilterStore()
    store.setNeighborhood('Roslindale')
    expect(store.matchesFeature(sampleProps)).toBe(true)
    store.setNeighborhood('Dorchester')
    expect(store.matchesFeature(sampleProps)).toBe(false)
  })

  it('filters by owner substring (case insensitive)', () => {
    const store = useFilterStore()
    store.setOwnerQuery('pisano')
    expect(store.matchesFeature(sampleProps)).toBe(true)
    store.setOwnerQuery('smith')
    expect(store.matchesFeature(sampleProps)).toBe(false)
  })

  it('toQuery and fromQuery round-trip', () => {
    const store = useFilterStore()
    store.toggleCategory('Housing Complaints')
    store.setNeighborhood('Roslindale')
    store.setOwnerQuery('LLC')
    const q = store.toQuery()

    const other = useFilterStore()
    other.reset()
    other.fromQuery(q)
    expect(other.categories.has('Housing Complaints')).toBe(true)
    expect(other.neighborhood).toBe('Roslindale')
    expect(other.ownerQuery).toBe('LLC')
  })
})
