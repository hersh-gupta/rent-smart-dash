import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

// Loads the two static artifacts produced by scripts/fetch-rentsmart.mjs
// and exposes them to the rest of the app.
export const useDataStore = defineStore('data', () => {
  const geojson = ref(null)
  const addresses = ref([])
  const loading = ref(false)
  const error = ref(null)

  const featuresById = computed(() => {
    const map = new Map()
    if (geojson.value) {
      for (const f of geojson.value.features) map.set(f.id, f)
    }
    return map
  })

  const neighborhoods = computed(() => {
    const set = new Set()
    if (geojson.value) {
      for (const f of geojson.value.features) {
        if (f.properties.n) set.add(f.properties.n)
      }
    }
    return [...set].sort()
  })

  async function load() {
    if (geojson.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      const [pointsRes, addrRes] = await Promise.all([
        fetch('/points.geojson'),
        fetch('/addresses.json'),
      ])
      if (!pointsRes.ok) throw new Error(`points.geojson ${pointsRes.status}`)
      if (!addrRes.ok) throw new Error(`addresses.json ${addrRes.status}`)
      geojson.value = await pointsRes.json()
      addresses.value = await addrRes.json()
    } catch (err) {
      error.value = err.message || String(err)
    } finally {
      loading.value = false
    }
  }

  function featureByAddress(address) {
    if (!geojson.value) return null
    return geojson.value.features.find((f) => f.properties.a === address) || null
  }

  return {
    geojson,
    addresses,
    loading,
    error,
    featuresById,
    neighborhoods,
    load,
    featureByAddress,
  }
})
