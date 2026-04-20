<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRecordStore } from '../stores/recordStore'
import { useMapStore } from '../stores/mapStore'
import { useFilterStore } from '../stores/filterStore'
import { useDataStore } from '../stores/dataStore'

const DEFAULT_CENTER = [-71.0850612, 42.3432998]
const DEFAULT_ZOOM = 12
const SOURCE_ID = 'rentsmart'
const CLUSTERS_LAYER = 'rentsmart-clusters'
const CLUSTER_COUNT_LAYER = 'rentsmart-cluster-count'
const POINTS_LAYER = 'rentsmart-points'

const container = ref(null)

const recordStore = useRecordStore()
const mapStore = useMapStore()
const filterStore = useFilterStore()
const dataStore = useDataStore()

let map = null
let marker = null
let sourceInstalled = false

const mapboxKey = import.meta.env.VITE_MAPBOX_API_KEY

function applyFilter() {
  if (!map || !map.getLayer(POINTS_LAYER)) return
  // Keep the non-cluster guard so cluster features don't also render as red dots.
  map.setFilter(POINTS_LAYER, [
    'all',
    ['!', ['has', 'point_count']],
    filterStore.toMapboxFilter(),
  ])
}

function installSource() {
  if (sourceInstalled || !map || !dataStore.geojson) return
  if (!map.isStyleLoaded()) {
    map.once('load', installSource)
    return
  }

  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: dataStore.geojson,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  })

  map.addLayer({
    id: CLUSTERS_LAYER,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51ACFF',
        50, '#288BE4',
        200, '#091F2F',
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        16,
        50, 22,
        200, 28,
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })

  map.addLayer({
    id: CLUSTER_COUNT_LAYER,
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
    paint: { 'text-color': '#ffffff' },
  })

  map.addLayer({
    id: POINTS_LAYER,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#FB4D42',
      'circle-radius': 6,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#ffffff',
    },
  })

  map.on('click', CLUSTERS_LAYER, (e) => {
    const feature = map.queryRenderedFeatures(e.point, { layers: [CLUSTERS_LAYER] })[0]
    if (!feature) return
    const clusterId = feature.properties.cluster_id
    map.getSource(SOURCE_ID).getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return
      map.easeTo({ center: feature.geometry.coordinates, zoom })
    })
  })

  map.on('click', POINTS_LAYER, (e) => {
    const feature = e.features && e.features[0]
    if (!feature) return
    selectFeature(feature)
  })

  for (const layer of [CLUSTERS_LAYER, POINTS_LAYER]) {
    map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'))
    map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''))
  }

  applyFilter()
  sourceInstalled = true
}

function selectFeature(feature) {
  const p = feature.properties
  const coords = feature.geometry.coordinates
  recordStore.setSelectedRecord({
    address: p.a,
    neighborhood: p.n,
    owner: p.o,
    property_type: p.p,
    latitude: coords[1],
    longitude: coords[0],
  })
  recordStore.loadDetailsForAddress(p.a)
}

function flyToSelected() {
  const record = recordStore.selectedRecord
  if (!map) return

  if (record && Number.isFinite(record.latitude) && Number.isFinite(record.longitude)) {
    const lngLat = [record.longitude, record.latitude]
    map.flyTo({ center: lngLat, zoom: 17, essential: true, speed: 1.6 })

    if (!marker) {
      const el = document.createElement('div')
      el.className = 'w-5 h-5 bg-optimistic-blue border-white border-2 rounded-full'
      marker = new mapboxgl.Marker({ element: el }).setLngLat(lngLat).addTo(map)
    } else {
      marker.setLngLat(lngLat)
    }
  } else if (marker) {
    // Record cleared: drop the selection marker but keep the user's current view.
    marker.remove()
    marker = null
  }
}

onMounted(() => {
  mapboxgl.accessToken = mapboxKey
  map = new mapboxgl.Map({
    container: container.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  })

  mapStore.setMap(map)

  map.on('load', () => {
    if (dataStore.geojson) installSource()
  })

  dataStore.load()
})

onBeforeUnmount(() => {
  if (marker) marker.remove()
  if (map) map.remove()
  mapStore.setMap(null)
})

watch(() => dataStore.geojson, (value) => {
  if (value && map) installSource()
})

watch(() => recordStore.selectedRecord, flyToSelected)

watch(
  () => [filterStore.categories, filterStore.neighborhood, filterStore.ownerQuery],
  () => applyFilter(),
  { deep: true }
)

function retry() {
  dataStore.load()
}
</script>

<template>
  <div class="relative flex-1 min-h-0 min-w-0">
    <div ref="container" class="w-full h-full"></div>

    <div
      v-if="dataStore.loading"
      class="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none"
      aria-live="polite"
    >
      <div class="font-sans text-sm font-bold text-charles-blue">Loading map data…</div>
    </div>

    <div
      v-if="dataStore.error && !dataStore.loading"
      class="absolute left-4 right-4 top-4 z-10 rounded border-2 border-freedom-red bg-white px-4 py-3 shadow"
      role="alert"
    >
      <p class="font-sans text-sm font-bold text-charles-blue">
        Couldn't load map data: {{ dataStore.error }}
      </p>
      <button
        class="mt-2 font-sans text-sm font-bold text-optimistic-blue underline"
        @click="retry"
      >
        Retry
      </button>
    </div>
  </div>
</template>
