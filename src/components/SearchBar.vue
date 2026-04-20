<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRecordStore } from '../stores/recordStore'
import { useDataStore } from '../stores/dataStore'
import { useFilterStore } from '../stores/filterStore'

const MAX_RESULTS = 10

const recordStore = useRecordStore()
const dataStore = useDataStore()
const filterStore = useFilterStore()
const router = useRouter()

const searchTerm = ref('')
const activeIndex = ref(-1)
const expanded = ref(false)
const inputEl = ref(null)

onMounted(() => {
  dataStore.load()
})

const searchResults = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return []
  const out = []
  for (const { a, i } of dataStore.addresses) {
    if (!a.toLowerCase().includes(q)) continue
    const feature = dataStore.featuresById.get(i)
    if (feature && !filterStore.matchesFeature(feature.properties)) continue
    out.push({ address: a, id: i })
    if (out.length >= MAX_RESULTS) break
  }
  return out
})

function onInput() {
  activeIndex.value = -1
  expanded.value = searchTerm.value.trim().length > 0
}

function onKeydown(event) {
  const results = searchResults.value
  if (!results.length) {
    if (event.key === 'Escape') close()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % results.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = activeIndex.value <= 0 ? results.length - 1 : activeIndex.value - 1
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const pick = results[activeIndex.value >= 0 ? activeIndex.value : 0]
    if (pick) selectAddress(pick)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

function close() {
  expanded.value = false
  activeIndex.value = -1
}

function selectAddress({ address, id }) {
  const feature = dataStore.featuresById.get(id) || dataStore.featureByAddress(address)
  if (!feature) return
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

  searchTerm.value = ''
  close()
  inputEl.value?.blur()

  const slug = address.trim().replace(/\W+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  router.push({ name: 'SearchAddress', params: { address: slug } })
}
</script>

<template>
  <form
    class="relative w-full px-5 pb-3 md:basis-3/4 md:px-10 md:pb-0"
    role="search"
    @submit.prevent
  >
    <div class="relative w-full">
      <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg
          class="w-4 h-4 text-gray-1"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
      </div>
      <label for="address" class="sr-only">Search for an address</label>
      <input
        id="address"
        ref="inputEl"
        v-model="searchTerm"
        type="text"
        placeholder="Search for an address"
        class="w-full pl-10 font-serif appearance-none border-2 border-charles-blue py-2 px-4 text-gray-1 leading-tight"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="address-listbox"
        :aria-expanded="expanded && searchResults.length > 0"
        :aria-activedescendant="activeIndex >= 0 ? `address-option-${activeIndex}` : null"
        autocomplete="off"
        @input="onInput"
        @keydown="onKeydown"
        @focus="expanded = searchTerm.trim().length > 0"
      />
    </div>
    <ul
      v-if="expanded && searchResults.length"
      id="address-listbox"
      role="listbox"
      class="absolute left-5 right-5 top-full z-30 mt-1 bg-white px-4 py-2 space-y-1 border-4 border-charles-blue md:left-10 md:right-10"
    >
      <li class="px-1 pt-1 pb-2 font-bold border-b border-gray-200" role="presentation">
        Showing {{ searchResults.length }} of {{ dataStore.addresses.length }} addresses
      </li>
      <li
        v-for="(result, index) in searchResults"
        :id="`address-option-${index}`"
        :key="result.id"
        role="option"
        :aria-selected="index === activeIndex"
        class="p-1 cursor-pointer"
        :class="index === activeIndex ? 'bg-gray-4 font-bold' : 'hover:bg-gray-4 hover:font-bold'"
        @mousedown.prevent="selectAddress(result)"
        @mouseenter="activeIndex = index"
      >
        {{ result.address }}
      </li>
    </ul>
  </form>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
