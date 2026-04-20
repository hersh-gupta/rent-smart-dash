import { describe, expect, it } from 'vitest'
import { CATEGORIES, RECENT_DAYS, groupByAddress, buildArtifacts } from '../scripts/fetch-rentsmart.mjs'

const NOW = new Date('2026-04-20T12:00:00Z')

const fixture = [
  {
    address: '1 Main St, 02118',
    neighborhood: 'South End',
    owner: 'ACME LLC',
    property_type: 'Residential',
    latitude: '42.34',
    longitude: '-71.07',
    violation_type: 'Enforcement Violations',
    date: '2026-04-10T00:00:00',
  },
  {
    address: '1 Main St, 02118',
    neighborhood: 'South End',
    owner: 'ACME LLC',
    property_type: 'Residential',
    latitude: '42.34',
    longitude: '-71.07',
    violation_type: 'Housing Complaints',
    date: '2022-06-01T00:00:00',
  },
  {
    address: '2 Oak St, 02130',
    neighborhood: 'JP',
    owner: 'DOE JANE',
    property_type: 'Residential 2-family',
    latitude: '42.31',
    longitude: '-71.11',
    violation_type: 'Building Violations',
    date: '2025-12-15T00:00:00',
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

  it(`counts violations inside the last ${RECENT_DAYS} days into r`, () => {
    const byAddr = groupByAddress(fixture, NOW)

    // 2026-04-10 is within 90 days of 2026-04-20; 2022-06-01 is not.
    expect(byAddr.get('1 Main St, 02118').r).toBe(1)
    // 2025-12-15 is ~126 days before 2026-04-20, so not recent.
    expect(byAddr.get('2 Oak St, 02130').r).toBe(0)

    const { geojson } = buildArtifacts(byAddr)
    const main = geojson.features.find((f) => f.properties.a === '1 Main St, 02118')
    expect(main.properties.r).toBe(1)
    expect(main.properties.t).toBe(2)
  })
})
