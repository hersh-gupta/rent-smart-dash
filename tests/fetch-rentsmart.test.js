import { describe, expect, it } from 'vitest'
import { CATEGORIES, groupByAddress, buildArtifacts } from '../scripts/fetch-rentsmart.mjs'

const fixture = [
  {
    address: '1 Main St, 02118',
    neighborhood: 'South End',
    owner: 'ACME LLC',
    property_type: 'Residential',
    latitude: '42.34',
    longitude: '-71.07',
    violation_type: 'Enforcement Violations',
  },
  {
    address: '1 Main St, 02118',
    neighborhood: 'South End',
    owner: 'ACME LLC',
    property_type: 'Residential',
    latitude: '42.34',
    longitude: '-71.07',
    violation_type: 'Housing Complaints',
  },
  {
    address: '2 Oak St, 02130',
    neighborhood: 'JP',
    owner: 'DOE JANE',
    property_type: 'Residential 2-family',
    latitude: '42.31',
    longitude: '-71.11',
    violation_type: 'Building Violations',
  },
  {
    address: '3 Missing Coord St',
    latitude: '',
    longitude: '',
    violation_type: 'Enforcement Violations',
  },
]

describe('fetch-rentsmart', () => {
  it('groups rows by address and counts per category', () => {
    const byAddr = groupByAddress(fixture)
    expect(byAddr.size).toBe(2) // rows with missing coords are dropped

    const main = byAddr.get('1 Main St, 02118')
    expect(main.t).toBe(2)
    expect(main.counts[CATEGORIES.indexOf('Enforcement Violations')]).toBe(1)
    expect(main.counts[CATEGORIES.indexOf('Housing Complaints')]).toBe(1)

    const oak = byAddr.get('2 Oak St, 02130')
    expect(oak.t).toBe(1)
    expect(oak.counts[CATEGORIES.indexOf('Building Violations')]).toBe(1)
  })

  it('builds a feature collection and address index with matching feature ids', () => {
    const byAddr = groupByAddress(fixture)
    const { geojson, addresses } = buildArtifacts(byAddr)

    expect(geojson.type).toBe('FeatureCollection')
    expect(geojson.features).toHaveLength(2)
    expect(addresses).toHaveLength(2)

    for (const feature of geojson.features) {
      const match = addresses.find((a) => a.a === feature.properties.a)
      expect(match).toBeTruthy()
      expect(match.i).toBe(feature.id)
    }
  })
})
