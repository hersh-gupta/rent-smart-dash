import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMapStore = defineStore('map', () => {
  const instance = ref(null)

  function setMap(map) {
    instance.value = map
  }

  function resizeMap() {
    if (instance.value) instance.value.resize()
  }

  function flyTo(options) {
    if (instance.value) instance.value.flyTo(options)
  }

  return { instance, setMap, resizeMap, flyTo }
})
