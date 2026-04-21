<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRecordStore } from '../stores/recordStore'
import { useDataStore } from '../stores/dataStore'
import { CATEGORIES } from '../lib/categories'
import { RECENT_DAYS, countRecent } from '../lib/recency'

const recordStore = useRecordStore()
const dataStore = useDataStore()
const router = useRouter()

const record = computed(() => recordStore.selectedRecord)
const loading = computed(() => recordStore.detailsLoading)
const error = computed(() => recordStore.detailsError)

const ownerProperties = computed(() => {
  const owner = record.value?.owner
  const currentAddress = record.value?.address
  if (!owner || !dataStore.geojson) return []
  const out = []
  for (const f of dataStore.geojson.features) {
    if (f.properties.o !== owner) continue
    if (f.properties.a === currentAddress) continue
    out.push({
      id: f.id,
      address: f.properties.a,
      neighborhood: f.properties.n,
      propertyType: f.properties.p,
      total: f.properties.t || 0,
      recent: f.properties.r || 0,
      longitude: f.geometry.coordinates[0],
      latitude: f.geometry.coordinates[1],
    })
  }
  out.sort(
    (a, b) =>
      b.recent - a.recent ||
      b.total - a.total ||
      a.address.localeCompare(b.address)
  )
  return out
})

function selectOtherProperty(item) {
  recordStore.setSelectedRecord({
    address: item.address,
    neighborhood: item.neighborhood,
    owner: record.value?.owner || '',
    property_type: item.propertyType,
    latitude: item.latitude,
    longitude: item.longitude,
  })
  recordStore.loadDetailsForAddress(item.address)
  const slug = item.address.trim().replace(/\W+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  router.push({ name: 'SearchAddress', params: { address: slug }, query: router.currentRoute.value.query })
}

const closeButton = ref(null)
let previouslyFocused = null

const sections = computed(() => {
  if (!record.value) return []
  return CATEGORIES.map((name) => {
    const items = record.value[name] || []
    return { name, items, recent: countRecent(items) }
  })
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatDate(iso) {
  if (!iso) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  if (Number.isNaN(date.getTime())) return iso
  return dateFormatter.format(date)
}

const totalViolations = computed(() =>
  sections.value.reduce((sum, s) => sum + s.items.length, 0)
)

const activeCategories = computed(() =>
  sections.value.reduce((n, s) => n + (s.items.length > 0 ? 1 : 0), 0)
)

const totalRecent = computed(() =>
  sections.value.reduce((sum, s) => sum + s.recent, 0)
)

function closeRoute() {
  const trigger = previouslyFocused
  recordStore.$reset()
  router.push({ name: 'Home' })
  nextTick(() => {
    if (trigger && typeof trigger.focus === 'function') trigger.focus()
  })
}

function onKeydown(event) {
  if (event.key === 'Escape' && record.value) {
    closeRoute()
  }
}

function retry() {
  if (record.value?.address) {
    recordStore.loadDetailsForAddress(record.value.address)
  }
}

watch(record, async (value) => {
  if (value) {
    previouslyFocused = document.activeElement
    await nextTick()
    closeButton.value?.focus()
  }
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="record"
      id="infopane"
      role="dialog"
      aria-modal="false"
      aria-labelledby="infopane-title"
      class="fixed z-40 bg-white shadow-2xl overflow-y-auto
             inset-x-0 bottom-0 max-h-[55vh] rounded-t-2xl border-t-4 border-charles-blue
             md:inset-x-auto md:bottom-auto md:top-24 md:right-4 md:w-[28rem] md:max-h-[calc(100vh-8rem)]
             md:rounded-lg md:border-4"
    >
      <!-- drag-handle visual on mobile -->
      <div class="md:hidden flex justify-center pt-2 pb-1">
        <span class="block h-1 w-10 rounded-full bg-gray-2"></span>
      </div>

      <!-- Sticky header -->
      <header class="sticky top-0 z-10 bg-white px-5 pt-3 pb-4 border-b border-gray-3">
        <button
          ref="closeButton"
          class="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-4"
          aria-label="Close address details"
          @click="closeRoute()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p class="font-sans text-xs font-bold uppercase tracking-wide text-optimistic-blue">
          {{ record.neighborhood || 'Boston' }}
        </p>
        <h1
          id="infopane-title"
          class="font-serif text-xl font-bold leading-tight text-charles-blue pr-8 mt-1"
        >
          {{ record.address }}
        </h1>

        <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm font-sans">
          <dt class="text-gray-1 font-bold">Owner</dt>
          <dd class="text-charles-blue">
            <router-link
              v-if="record.owner"
              :to="{ name: 'Owner', params: { name: record.owner } }"
              class="text-optimistic-blue font-bold underline hover:no-underline"
            >
              {{ record.owner }}
            </router-link>
            <span v-else>—</span>
          </dd>
          <template v-if="record.property_type">
            <dt class="text-gray-1 font-bold">Type</dt>
            <dd class="text-charles-blue">{{ record.property_type }}</dd>
          </template>
        </dl>

        <div v-if="!loading && !error" class="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span class="font-serif text-3xl font-bold text-freedom-red tabular-nums">
            {{ totalViolations }}
          </span>
          <span class="font-sans text-xs text-gray-1">
            violation{{ totalViolations === 1 ? '' : 's' }}
            across {{ activeCategories }} categor{{ activeCategories === 1 ? 'y' : 'ies' }}
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

      <div class="px-5 py-4 pb-8">
        <div
          v-if="error"
          class="border-2 border-freedom-red bg-white px-3 py-2"
          role="alert"
        >
          <p class="font-sans text-sm font-bold text-charles-blue">
            Couldn't load violation details: {{ error }}
          </p>
          <button
            class="mt-2 font-sans text-sm font-bold text-optimistic-blue underline"
            @click="retry"
          >
            Retry
          </button>
        </div>

        <ul v-else-if="loading" class="space-y-4" aria-busy="true" aria-live="polite">
          <li v-for="name in CATEGORIES" :key="name">
            <div class="flex items-center justify-between border-b border-gray-3 pb-2">
              <span class="font-serif text-sm font-bold text-charles-blue">{{ name }}</span>
              <span class="h-5 w-8 bg-gray-3 animate-pulse rounded-full"></span>
            </div>
            <div class="space-y-2 pt-3">
              <div class="h-3 w-3/4 bg-gray-3 animate-pulse rounded"></div>
              <div class="h-3 w-2/3 bg-gray-3 animate-pulse rounded"></div>
            </div>
          </li>
        </ul>

        <ul v-else class="space-y-4">
          <li v-for="section in sections" :key="section.name">
            <details v-if="section.items.length" open class="group">
              <summary
                class="flex items-center justify-between border-b border-charles-blue pb-2 cursor-pointer select-none"
              >
                <span class="flex items-center gap-2">
                  <svg
                    class="w-4 h-4 text-charles-blue transition-transform group-open:rotate-90"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  <h2 class="font-serif text-sm font-bold text-charles-blue">
                    {{ section.name }}
                  </h2>
                </span>
                <span class="flex items-center gap-2">
                  <span
                    v-if="section.recent > 0"
                    class="font-sans text-xs font-bold uppercase tracking-wide text-freedom-red tabular-nums"
                    :title="`${section.recent} in the last ${RECENT_DAYS} days`"
                  >
                    {{ section.recent }} recent
                  </span>
                  <span
                    class="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-2 rounded-full bg-freedom-red text-white text-xs font-sans font-bold tabular-nums"
                  >
                    {{ section.items.length }}
                  </span>
                </span>
              </summary>

              <ul class="mt-2 divide-y divide-gray-3">
                <li
                  v-for="(item, idx) in section.items"
                  :key="`${section.name}-${idx}`"
                  class="grid grid-cols-[6.5rem_1fr] gap-3 py-2"
                >
                  <time
                    class="font-sans text-xs font-bold text-gray-1 tabular-nums pt-0.5"
                    :datetime="item.date"
                  >
                    {{ formatDate(item.date) || '—' }}
                  </time>
                  <p class="font-serif text-sm text-charles-blue leading-snug">
                    {{ item.description || '(no description)' }}
                  </p>
                </li>
              </ul>
            </details>

            <div v-else>
              <div class="flex items-center justify-between border-b border-gray-3 pb-2">
                <h2 class="font-serif text-sm font-bold text-gray-1 pl-6">
                  {{ section.name }}
                </h2>
                <span
                  class="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-2 rounded-full bg-gray-3 text-gray-1 text-xs font-sans font-bold tabular-nums"
                >
                  0
                </span>
              </div>
              <p class="mt-2 font-sans text-xs italic text-gray-1 pl-6">
                No records on file.
              </p>
            </div>
          </li>
        </ul>

        <section v-if="record && record.owner && ownerProperties.length" class="mt-6">
          <details open class="group">
            <summary
              class="flex items-center justify-between border-b border-charles-blue pb-2 cursor-pointer select-none"
            >
              <span class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-charles-blue transition-transform group-open:rotate-90"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <h2 class="font-serif text-sm font-bold text-charles-blue">
                  Other properties by this owner
                </h2>
              </span>
              <span
                class="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-2 rounded-full bg-optimistic-blue text-white text-xs font-sans font-bold tabular-nums"
              >
                {{ ownerProperties.length }}
              </span>
            </summary>
            <ul class="mt-2 divide-y divide-gray-3">
              <li
                v-for="item in ownerProperties"
                :key="item.id"
              >
                <button
                  type="button"
                  class="w-full grid grid-cols-[1fr_auto] gap-3 py-2 text-left hover:bg-gray-4 focus:bg-gray-4 focus:outline-none"
                  @click="selectOtherProperty(item)"
                >
                  <span class="min-w-0">
                    <span class="block font-serif text-sm font-bold text-optimistic-blue leading-snug underline truncate">
                      {{ item.address }}
                    </span>
                    <span class="block font-sans text-xs text-gray-1 truncate">
                      {{ item.neighborhood || 'Boston' }}
                    </span>
                  </span>
                  <span class="flex items-center gap-2">
                    <span
                      v-if="item.recent > 0"
                      class="font-sans text-xs font-bold uppercase tracking-wide text-freedom-red tabular-nums"
                      :title="`${item.recent} in the last ${RECENT_DAYS} days`"
                    >
                      {{ item.recent }} recent
                    </span>
                    <span
                      class="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-2 rounded-full text-xs font-sans font-bold tabular-nums"
                      :class="item.total > 0 ? 'bg-freedom-red text-white' : 'bg-gray-3 text-gray-1'"
                      :title="`${item.total} violation${item.total === 1 ? '' : 's'}`"
                    >
                      {{ item.total }}
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </details>
        </section>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
summary {
  list-style: none;
}
summary::-webkit-details-marker {
  display: none;
}
</style>
