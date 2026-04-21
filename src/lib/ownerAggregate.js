import { CATEGORIES } from './categories'

export function aggregateOwner(geojson, ownerName) {
  const properties = []
  const perCategoryCounts = CATEGORIES.map(() => 0)
  const neighborhoodCounts = new Map()
  let totalViolations = 0
  let totalRecent = 0

  if (geojson && ownerName) {
    for (const f of geojson.features) {
      if (f.properties.o !== ownerName) continue

      const perCategory = CATEGORIES.map(
        (_, i) => Number(f.properties[i] ?? f.properties[String(i)] ?? 0)
      )
      const total = f.properties.t || 0
      const recent = f.properties.r || 0

      properties.push({
        id: f.id,
        address: f.properties.a,
        neighborhood: f.properties.n,
        propertyType: f.properties.p,
        total,
        recent,
        perCategory,
        longitude: f.geometry.coordinates[0],
        latitude: f.geometry.coordinates[1],
      })

      for (let i = 0; i < CATEGORIES.length; i++) perCategoryCounts[i] += perCategory[i]
      totalViolations += total
      totalRecent += recent
      const n = f.properties.n || 'Boston'
      neighborhoodCounts.set(n, (neighborhoodCounts.get(n) || 0) + 1)
    }
  }

  properties.sort(
    (a, b) =>
      b.recent - a.recent ||
      b.total - a.total ||
      a.address.localeCompare(b.address)
  )

  const neighborhoodDistribution = [...neighborhoodCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )

  return {
    properties,
    totalProperties: properties.length,
    totalViolations,
    totalRecent,
    perCategoryCounts,
    neighborhoodDistribution,
  }
}
