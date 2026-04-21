import { describe, expect, it } from 'vitest'
import { aggregateOwner } from '../src/lib/ownerAggregate'

function feature(id, props, coords = [-71, 42]) {
  return {
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: coords },
    properties: props,
  }
}

const geojson = {
  type: 'FeatureCollection',
  features: [
    feature(0, {
      a: '1 Main St, 02118',
      n: 'South End',
      o: 'ACME LLC',
      p: 'Residential 3-family',
      t: 4,
      r: 1,
      0: 2, 1: 0, 2: 1, 3: 0, 4: 0, 5: 1,
    }, [-71.07, 42.34]),
    feature(1, {
      a: '2 Oak St, 02130',
      n: 'JP',
      o: 'ACME LLC',
      p: 'Residential 2-family',
      t: 2,
      r: 2,
      0: 0, 1: 1, 2: 0, 3: 1, 4: 0, 5: 0,
    }, [-71.11, 42.31]),
    feature(2, {
      a: '3 Elm St, 02118',
      n: 'South End',
      o: 'ACME LLC',
      p: 'Residential 1-family',
      t: 0,
      r: 0,
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    }, [-71.08, 42.35]),
    feature(3, {
      a: '99 Albano St, 02131',
      n: 'Roslindale',
      o: 'PISANO TANIA',
      p: 'Residential 2-family',
      t: 3,
      r: 0,
      0: 0, 1: 1, 2: 2, 3: 0, 4: 0, 5: 0,
    }, [-71.13, 42.28]),
  ],
}

describe('aggregateOwner', () => {
  it('returns empty aggregate when geojson or owner is missing', () => {
    expect(aggregateOwner(null, 'ACME LLC').totalProperties).toBe(0)
    expect(aggregateOwner(geojson, '').totalProperties).toBe(0)
    expect(aggregateOwner(geojson, 'NOBODY').totalProperties).toBe(0)
  })

  it('filters features to the given owner', () => {
    const agg = aggregateOwner(geojson, 'ACME LLC')
    expect(agg.totalProperties).toBe(3)
    expect(agg.properties.every((p) => p.address.includes('St'))).toBe(true)
    expect(agg.properties.some((p) => p.address.includes('Albano'))).toBe(false)
  })

  it('sums total and recent violations across matched properties', () => {
    const agg = aggregateOwner(geojson, 'ACME LLC')
    expect(agg.totalViolations).toBe(6)
    expect(agg.totalRecent).toBe(3)
  })

  it('rolls up per-category counts in fixed category order', () => {
    const agg = aggregateOwner(geojson, 'ACME LLC')
    // Enforcement=2, Housing Complaints=1, Sanitation=1, Housing Violations=1, Civic=0, Building=1
    expect(agg.perCategoryCounts).toEqual([2, 1, 1, 1, 0, 1])
  })

  it('builds neighborhood distribution sorted by count desc', () => {
    const agg = aggregateOwner(geojson, 'ACME LLC')
    expect(agg.neighborhoodDistribution).toEqual([
      ['South End', 2],
      ['JP', 1],
    ])
  })

  it('sorts properties by recent desc, then total desc, then address', () => {
    const agg = aggregateOwner(geojson, 'ACME LLC')
    expect(agg.properties.map((p) => p.address)).toEqual([
      '2 Oak St, 02130', // recent=2
      '1 Main St, 02118', // recent=1, total=4
      '3 Elm St, 02118', // recent=0, total=0
    ])
  })
})
