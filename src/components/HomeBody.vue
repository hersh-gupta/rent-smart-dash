<script setup>
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HomeMap from './HomeMap.vue'
import InfoPane from './InfoPane.vue'
import { useFilterStore } from '../stores/filterStore'

const route = useRoute()
const router = useRouter()
const filterStore = useFilterStore()

let suppressQueryWatcher = false

onMounted(() => {
  filterStore.fromQuery(route.query)
})

watch(
  () => route.query,
  (query) => {
    if (suppressQueryWatcher) return
    filterStore.fromQuery(query)
  }
)

watch(
  () => [filterStore.categories, filterStore.neighborhood, filterStore.ownerQuery],
  () => {
    const next = filterStore.toQuery()
    const current = route.query
    const same =
      (current.cat || '') === (next.cat || '') &&
      (current.nbhd || '') === (next.nbhd || '') &&
      (current.owner || '') === (next.owner || '')
    if (same) return
    suppressQueryWatcher = true
    router.replace({ name: route.name, params: route.params, query: next }).finally(() => {
      suppressQueryWatcher = false
    })
  },
  { deep: true }
)
</script>

<template>
  <div class="flex flex-col lg:flex-row w-full flex-1 min-h-0">
    <HomeMap />
    <InfoPane />
  </div>
</template>
