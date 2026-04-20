<script setup>
import { computed, ref } from 'vue'
import { useDataStore } from '../stores/dataStore'
import { useFilterStore } from '../stores/filterStore'
import { CATEGORIES } from '../lib/categories'

const dataStore = useDataStore()
const filterStore = useFilterStore()

const open = ref(false)

const categoryCounts = computed(() => {
  const totals = new Array(CATEGORIES.length).fill(0)
  if (!dataStore.geojson) return totals
  for (const feature of dataStore.geojson.features) {
    const p = feature.properties
    for (let i = 0; i < CATEGORIES.length; i++) {
      totals[i] += Number(p[i] ?? p[String(i)] ?? 0)
    }
  }
  return totals
})

const activeCount = computed(() => {
  let n = 0
  if (filterStore.hasCategoryFilter) n++
  if (filterStore.neighborhood) n++
  if (filterStore.ownerQuery) n++
  return n
})

function isChecked(name) {
  return filterStore.categories.has(name)
}
</script>

<template>
  <div
    class="bg-white border-charles-blue border-b-2 lg:border-b-0 lg:border-r-2 lg:w-72 w-full"
    :class="open ? '' : 'lg:h-auto'"
  >
    <button
      class="w-full flex items-center justify-between px-4 py-3 lg:cursor-default"
      :aria-expanded="open"
      aria-controls="filter-body"
      @click="open = !open"
    >
      <span class="font-sans font-bold text-charles-blue">
        Filters<span v-if="activeCount > 0" class="ml-2 text-freedom-red">({{ activeCount }})</span>
      </span>
      <svg
        class="w-5 h-5 lg:hidden"
        :class="open ? 'rotate-180' : ''"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    <div id="filter-body" class="px-4 pb-4" :class="open ? 'block' : 'hidden lg:block'">
      <fieldset class="mt-2">
        <legend class="font-sans text-sm font-bold text-charles-blue mb-1">Violation type</legend>
        <div class="space-y-1">
          <label
            v-for="(name, i) in CATEGORIES"
            :key="name"
            class="flex items-center justify-between font-serif text-sm cursor-pointer"
          >
            <span class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="isChecked(name)"
                :aria-label="name"
                @change="filterStore.toggleCategory(name)"
              />
              {{ name }}
            </span>
            <span class="text-gray-1 text-xs tabular-nums">{{ categoryCounts[i].toLocaleString() }}</span>
          </label>
        </div>
      </fieldset>

      <div class="mt-4">
        <label for="filter-neighborhood" class="font-sans text-sm font-bold text-charles-blue block mb-1">
          Neighborhood
        </label>
        <select
          id="filter-neighborhood"
          class="w-full border-2 border-charles-blue px-2 py-1 font-serif text-sm"
          :value="filterStore.neighborhood || ''"
          @change="filterStore.setNeighborhood($event.target.value)"
        >
          <option value="">All neighborhoods</option>
          <option v-for="n in dataStore.neighborhoods" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <div class="mt-4">
        <label for="filter-owner" class="font-sans text-sm font-bold text-charles-blue block mb-1">
          Owner contains
        </label>
        <input
          id="filter-owner"
          type="text"
          placeholder="e.g. LLC"
          class="w-full border-2 border-charles-blue px-2 py-1 font-serif text-sm"
          :value="filterStore.ownerQuery"
          @input="filterStore.setOwnerQuery($event.target.value)"
        />
      </div>

      <button
        v-if="activeCount > 0"
        class="mt-4 font-sans text-sm font-bold text-optimistic-blue underline"
        @click="filterStore.reset()"
      >
        Clear all filters
      </button>
    </div>
  </div>
</template>
