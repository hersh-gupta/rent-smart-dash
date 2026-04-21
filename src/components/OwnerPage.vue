<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useDataStore } from '../stores/dataStore'
import { useRecordStore } from '../stores/recordStore'
import { CATEGORIES } from '../lib/categories'
import { RECENT_DAYS } from '../lib/recency'
import { aggregateOwner } from '../lib/ownerAggregate'

const RESOURCE_ID = 'dc615ff7-2ff3-416a-922b-f0f334f085d0'
const CKAN_SQL = 'https://data.boston.gov/api/3/action/datastore_search_sql'
const FEED_LIMIT = 50
const DEFAULT_CENTER = [-71.0850612, 42.3432998]

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const recordStore = useRecordStore()

const container = ref(null)
let map = null
let markers = []

const ownerName = computed(() =>
  typeof route.params.name === 'string' ? route.params.name : ''
)

const aggregate = computed(() =>
  aggregateOwner(dataStore.geojson, ownerName.value)
)
const properties = computed(() => aggregate.value.properties)
const totalProperties = computed(() => aggregate.value.totalProperties)
const totalViolations = computed(() => aggregate.value.totalViolations)
const totalRecent = computed(() => aggregate.value.totalRecent)
const perCategoryCounts = computed(() => aggregate.value.perCategoryCounts)
const neighborhoodDistribution = computed(
  () => aggregate.value.neighborhoodDistribution
)

const notFound = computed(
  () =>
    !dataStore.loading &&
    !dataStore.error &&
    dataStore.geojson &&
    properties.value.length === 0
)

const feed = ref([])
const feedLoading = ref(false)
const feedError = ref(null)

function cutoffISO() {
  const d = new Date()
  d.setDate(d.getDate() - RECENT_DAYS)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function escapeSql(v) {
  return v.replace(/'/g, "''")
}

async function loadFeed() {
  if (!ownerName.value) return
  feedLoading.value = true
  feedError.value = null
  try {
    const sql =
      `SELECT "date","violation_type","description","address" FROM "${RESOURCE_ID}" ` +
      `WHERE "owner" = '${escapeSql(ownerName.value)}' ` +
      `AND "date" >= '${cutoffISO()}' ` +
      `ORDER BY "date" DESC LIMIT ${FEED_LIMIT}`
    const res = await fetch(`${CKAN_SQL}?sql=${encodeURIComponent(sql)}`)
    if (!res.ok) throw new Error(`CKAN SQL ${res.status}`)
    const body = await res.json()
    if (!body.success) throw new Error('CKAN SQL error')
    feed.value = body.result.records.map((r) => ({
      date: r.date ? r.date.slice(0, 10) : '',
      category: r.violation_type || '',
      description: r.description || '',
      address: r.address || '',
    }))
  } catch (err) {
    feedError.value = err.message || String(err)
  } finally {
    feedLoading.value = false
  }
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatDate(iso) {
  if (!iso) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? iso : dateFormatter.format(d)
}

function addressSlug(address) {
  return address.trim().replace(/\W+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

function openAddress(item) {
  const feature =
    dataStore.featureByAddress(item.address) ||
    (item.id != null ? dataStore.featuresById.get(item.id) : null)
  if (feature) {
    const [lng, lat] = feature.geometry.coordinates
    const p = feature.properties
    recordStore.setSelectedRecord({
      address: p.a,
      neighborhood: p.n,
      owner: p.o,
      property_type: p.p,
      latitude: lat,
      longitude: lng,
    })
    recordStore.loadDetailsForAddress(p.a)
  } else {
    recordStore.setSelectedRecord({
      address: item.address,
      neighborhood: '',
      owner: ownerName.value,
      property_type: '',
    })
    recordStore.loadDetailsForAddress(item.address)
  }
  router.push({ name: 'SearchAddress', params: { address: addressSlug(item.address) } })
}

function renderMarkers() {
  if (!map) return
  for (const m of markers) m.remove()
  markers = []
  if (!properties.value.length) return
  map.resize()

  const bounds = new mapboxgl.LngLatBounds()
  for (const p of properties.value) {
    if (!Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)) continue
    const el = document.createElement('button')
    el.type = 'button'
    el.className =
      'block w-4 h-4 rounded-full border-2 border-white cursor-pointer ' +
      (p.total > 0 ? 'bg-freedom-red' : 'bg-gray-1')
    el.setAttribute('aria-label', `Open ${p.address}`)
    el.addEventListener('click', () => openAddress(p))
    const safeAddress = p.address.replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    )
    const mk = new mapboxgl.Marker({ element: el })
      .setLngLat([p.longitude, p.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div class="font-sans text-xs"><strong>${safeAddress}</strong><br/>${p.total} violation${p.total === 1 ? '' : 's'}</div>`
        )
      )
      .addTo(map)
    markers.push(mk)
    bounds.extend([p.longitude, p.latitude])
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 })
  }
}

function initMap() {
  if (map || !container.value) return
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY
  map = new mapboxgl.Map({
    container: container.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: DEFAULT_CENTER,
    zoom: 11,
  })
  map.on('load', renderMarkers)
}

onMounted(async () => {
  dataStore.load()
  await nextTick()
  initMap()
  loadFeed()
})

onBeforeUnmount(() => {
  for (const m of markers) m.remove()
  markers = []
  if (map) {
    map.remove()
    map = null
  }
})

watch(
  () => properties.value,
  async () => {
    if (!map || !map.isStyleLoaded()) return
    await nextTick()
    renderMarkers()
  }
)

watch(
  () => ownerName.value,
  () => {
    feed.value = []
    loadFeed()
  }
)
</script>

<template>
  <div class="px-5 md:px-10 lg:px-16 py-6 md:py-10 max-w-6xl mx-auto w-full">
    <router-link
      to="/"
      class="inline-flex items-center gap-1 font-sans text-sm font-bold text-optimistic-blue hover:underline mb-4"
    >
      <svg
        class="w-4 h-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
      Back to map
    </router-link>

    <header class="border-b-4 border-charles-blue pb-4 mb-6">
      <p class="font-sans text-xs font-bold uppercase tracking-wide text-optimistic-blue">Owner</p>
      <h1 class="font-serif text-3xl md:text-4xl font-bold text-charles-blue mt-1 break-words">
        {{ ownerName || '—' }}
      </h1>
      <div
        v-if="properties.length"
        class="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2"
      >
        <span class="font-sans text-sm text-charles-blue">
          <span class="font-serif text-2xl font-bold tabular-nums">{{ totalProperties }}</span>
          propert{{ totalProperties === 1 ? 'y' : 'ies' }}
        </span>
        <span class="font-sans text-sm text-charles-blue">
          <span class="font-serif text-2xl font-bold text-freedom-red tabular-nums">
            {{ totalViolations }}
          </span>
          total violation{{ totalViolations === 1 ? '' : 's' }}
        </span>
        <span
          v-if="totalRecent > 0"
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-freedom-red text-white font-sans text-xs font-bold uppercase tracking-wide"
          :title="`${totalRecent} in the last ${RECENT_DAYS} days`"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true"></span>
          {{ totalRecent }} in last {{ RECENT_DAYS }}d
        </span>
      </div>
    </header>

    <div v-if="dataStore.loading && !properties.length" class="font-sans text-sm text-gray-1">
      Loading…
    </div>
    <div
      v-else-if="dataStore.error"
      role="alert"
      class="border-2 border-freedom-red bg-white px-3 py-2"
    >
      <p class="font-sans text-sm font-bold text-charles-blue">
        Couldn't load data: {{ dataStore.error }}
      </p>
    </div>
    <p v-else-if="notFound" class="font-sans text-sm text-gray-1">
      No properties found for this owner.
    </p>

    <div v-show="!notFound" class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <section class="lg:col-span-3 space-y-6">
        <div>
          <h2 class="font-serif text-lg font-bold text-charles-blue border-b border-charles-blue pb-2">
            Properties
          </h2>
          <div
            ref="container"
            class="w-full h-72 md:h-96 mt-3 rounded border border-gray-3"
          ></div>
          <ul class="mt-3 divide-y divide-gray-3">
            <li v-for="p in properties" :key="p.id">
              <button
                type="button"
                class="w-full grid grid-cols-[1fr_auto] gap-3 py-2 text-left hover:bg-gray-4 focus:bg-gray-4 focus:outline-none"
                @click="openAddress(p)"
              >
                <span class="min-w-0">
                  <span
                    class="block font-serif text-sm font-bold text-optimistic-blue leading-snug underline truncate"
                  >
                    {{ p.address }}
                  </span>
                  <span class="block font-sans text-xs text-gray-1 truncate">
                    {{ p.neighborhood || 'Boston'
                    }}<span v-if="p.propertyType"> · {{ p.propertyType }}</span>
                  </span>
                </span>
                <span class="flex items-center gap-2">
                  <span
                    v-if="p.recent > 0"
                    class="font-sans text-xs font-bold uppercase tracking-wide text-freedom-red tabular-nums"
                    :title="`${p.recent} in the last ${RECENT_DAYS} days`"
                  >
                    {{ p.recent }} recent
                  </span>
                  <span
                    class="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-2 rounded-full text-xs font-sans font-bold tabular-nums"
                    :class="p.total > 0 ? 'bg-freedom-red text-white' : 'bg-gray-3 text-gray-1'"
                    :title="`${p.total} violation${p.total === 1 ? '' : 's'}`"
                  >
                    {{ p.total }}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="font-serif text-lg font-bold text-charles-blue border-b border-charles-blue pb-2">
            By category
          </h2>
          <dl class="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            <template v-for="(name, i) in CATEGORIES" :key="name">
              <dt class="font-sans text-sm text-charles-blue">{{ name }}</dt>
              <dd class="font-serif text-sm font-bold text-charles-blue tabular-nums text-right">
                {{ perCategoryCounts[i] }}
              </dd>
            </template>
          </dl>
        </div>

        <div v-if="neighborhoodDistribution.length > 1">
          <h2 class="font-serif text-lg font-bold text-charles-blue border-b border-charles-blue pb-2">
            Neighborhoods
          </h2>
          <dl class="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            <template v-for="[n, c] in neighborhoodDistribution" :key="n">
              <dt class="font-sans text-sm text-charles-blue">{{ n }}</dt>
              <dd class="font-serif text-sm font-bold text-charles-blue tabular-nums text-right">
                {{ c }}
              </dd>
            </template>
          </dl>
        </div>
      </section>

      <section class="lg:col-span-2">
        <h2 class="font-serif text-lg font-bold text-charles-blue border-b border-charles-blue pb-2">
          Recent violations
          <span class="font-sans text-xs font-normal text-gray-1">
            (last {{ RECENT_DAYS }} days)
          </span>
        </h2>
        <div v-if="feedLoading" class="mt-3 space-y-3" aria-busy="true">
          <div v-for="i in 4" :key="i" class="space-y-1">
            <div class="h-3 w-1/3 bg-gray-3 animate-pulse rounded"></div>
            <div class="h-3 w-3/4 bg-gray-3 animate-pulse rounded"></div>
          </div>
        </div>
        <div
          v-else-if="feedError"
          role="alert"
          class="mt-3 border-2 border-freedom-red bg-white px-3 py-2"
        >
          <p class="font-sans text-sm font-bold text-charles-blue">
            Couldn't load recent violations: {{ feedError }}
          </p>
          <button
            class="mt-2 font-sans text-sm font-bold text-optimistic-blue underline"
            @click="loadFeed"
          >
            Retry
          </button>
        </div>
        <p v-else-if="!feed.length" class="mt-3 font-sans text-sm italic text-gray-1">
          No violations in the last {{ RECENT_DAYS }} days.
        </p>
        <ul v-else class="mt-3 divide-y divide-gray-3">
          <li v-for="(item, i) in feed" :key="i" class="py-2">
            <div class="flex items-baseline justify-between gap-2">
              <time
                class="font-sans text-xs font-bold text-gray-1 tabular-nums"
                :datetime="item.date"
              >
                {{ formatDate(item.date) }}
              </time>
              <span class="font-sans text-xs font-bold uppercase tracking-wide text-charles-blue">
                {{ item.category }}
              </span>
            </div>
            <p class="font-serif text-sm text-charles-blue leading-snug mt-1">
              {{ item.description || '(no description)' }}
            </p>
            <button
              type="button"
              class="mt-1 font-sans text-xs font-bold text-optimistic-blue underline break-words text-left"
              @click="openAddress(item)"
            >
              {{ item.address }}
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
