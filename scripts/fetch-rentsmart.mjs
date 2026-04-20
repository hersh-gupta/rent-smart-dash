#!/usr/bin/env node
// Fetches the Boston Open Data RentSmart dataset, groups by address, and
// emits public/points.geojson + public/addresses.json + public/data-version.json.
//
// Runs in CI as a `prebuild` step. Node 18+ (native fetch). No deps.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RESOURCE_ID = 'dc615ff7-2ff3-416a-922b-f0f334f085d0'
const CKAN_BASE = 'https://data.boston.gov/api/3/action'
const PAGE_LIMIT = 32000

// Category name → index. Fixed order shared with the frontend.
// Keep in sync with src/lib/categories.js.
const CATEGORIES = [
  'Enforcement Violations',
  'Housing Complaints',
  'Sanitation Requests',
  'Housing Violations',
  'Civic Maintenance Requests',
  'Building Violations',
]
const CATEGORY_INDEX = new Map(CATEGORIES.map((name, i) => [name, i]))

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '..', 'public')

async function fetchAllRecords() {
  const all = []
  let offset = 0
  while (true) {
    const url = `${CKAN_BASE}/datastore_search?resource_id=${RESOURCE_ID}&limit=${PAGE_LIMIT}&offset=${offset}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`CKAN returned ${res.status} at offset ${offset}`)
    }
    const body = await res.json()
    if (!body.success) {
      throw new Error(`CKAN error at offset ${offset}: ${JSON.stringify(body.error)}`)
    }
    const records = body.result.records
    all.push(...records)
    process.stderr.write(`  fetched ${all.length} rows\n`)
    if (records.length < PAGE_LIMIT) break
    offset += records.length
  }
  return all
}

function groupByAddress(rows) {
  const byAddr = new Map()
  for (const row of rows) {
    const address = row.address
    if (!address) continue
    const lat = parseFloat(row.latitude)
    const lng = parseFloat(row.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    let entry = byAddr.get(address)
    if (!entry) {
      entry = {
        a: address,
        n: row.neighborhood || '',
        o: row.owner || '',
        p: row.property_type || '',
        lat,
        lng,
        counts: new Array(CATEGORIES.length).fill(0),
        t: 0,
      }
      byAddr.set(address, entry)
    }

    const ci = CATEGORY_INDEX.get(row.violation_type)
    if (ci !== undefined) {
      entry.counts[ci]++
      entry.t++
    }
  }
  return byAddr
}

function buildArtifacts(byAddr) {
  const features = []
  const addresses = []
  let featureId = 0
  for (const entry of byAddr.values()) {
    const properties = {
      a: entry.a,
      n: entry.n,
      o: entry.o,
      p: entry.p,
      t: entry.t,
    }
    for (let i = 0; i < CATEGORIES.length; i++) {
      properties[String(i)] = entry.counts[i]
    }
    features.push({
      type: 'Feature',
      id: featureId,
      geometry: { type: 'Point', coordinates: [entry.lng, entry.lat] },
      properties,
    })
    addresses.push({ a: entry.a, i: featureId })
    featureId++
  }
  return {
    geojson: { type: 'FeatureCollection', features },
    addresses,
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value))
}

async function main() {
  process.stderr.write('Fetching RentSmart records from data.boston.gov...\n')
  const rows = await fetchAllRecords()
  process.stderr.write(`Total rows: ${rows.length}\n`)

  const byAddr = groupByAddress(rows)
  process.stderr.write(`Unique addresses: ${byAddr.size}\n`)

  const { geojson, addresses } = buildArtifacts(byAddr)

  await writeJson(resolve(PUBLIC_DIR, 'points.geojson'), geojson)
  await writeJson(resolve(PUBLIC_DIR, 'addresses.json'), addresses)
  await writeJson(resolve(PUBLIC_DIR, 'data-version.json'), {
    built_at: new Date().toISOString(),
    source_row_count: rows.length,
    address_count: addresses.length,
    resource_id: RESOURCE_ID,
  })

  process.stderr.write('Wrote points.geojson, addresses.json, data-version.json\n')
}

// Export internals for tests. Only runs main when executed directly.
export { CATEGORIES, groupByAddress, buildArtifacts }

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : ''
if (import.meta.url === entry) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
