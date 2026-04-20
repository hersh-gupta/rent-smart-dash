import { ref } from 'vue'
import { defineStore } from 'pinia'
import { CATEGORIES } from '../lib/categories'

const RESOURCE_ID = 'dc615ff7-2ff3-416a-922b-f0f334f085d0'
const CKAN_SQL = 'https://data.boston.gov/api/3/action/datastore_search_sql'

function emptyDetails() {
  const out = {}
  for (const name of CATEGORIES) out[name] = []
  return out
}

function escapeSql(value) {
  return value.replace(/'/g, "''")
}

export const useRecordStore = defineStore('record', () => {
  const selectedRecord = ref(null)
  const detailsLoading = ref(false)
  const detailsError = ref(null)

  function $reset() {
    selectedRecord.value = null
    detailsLoading.value = false
    detailsError.value = null
  }

  function setSelectedRecord(data) {
    selectedRecord.value = {
      ...data,
      ...emptyDetails(),
    }
    detailsError.value = null
  }

  async function loadDetailsForAddress(address) {
    if (!address) return
    detailsLoading.value = true
    detailsError.value = null
    try {
      const sql =
        `SELECT "date","violation_type","description" FROM "${RESOURCE_ID}" ` +
        `WHERE "address" = '${escapeSql(address)}' ORDER BY "date" DESC`
      const url = `${CKAN_SQL}?sql=${encodeURIComponent(sql)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`CKAN SQL ${res.status}`)
      const body = await res.json()
      if (!body.success) throw new Error('CKAN SQL error')

      const grouped = emptyDetails()
      for (const row of body.result.records) {
        const cat = row.violation_type
        if (!(cat in grouped)) continue
        grouped[cat].push({
          date: row.date ? row.date.slice(0, 10) : '',
          description: row.description || '',
        })
      }

      if (selectedRecord.value && selectedRecord.value.address === address) {
        selectedRecord.value = { ...selectedRecord.value, ...grouped }
      }
    } catch (err) {
      detailsError.value = err.message || String(err)
    } finally {
      detailsLoading.value = false
    }
  }

  return {
    selectedRecord,
    detailsLoading,
    detailsError,
    setSelectedRecord,
    loadDetailsForAddress,
    $reset,
  }
})
