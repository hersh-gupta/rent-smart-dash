<template>
    <!-- Map -->
    <div ref="map" class="basis-3/5 flex-grow"></div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useRecordStore } from '../store';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default {

    setup() {
        const map = ref();
        let marker = null;

        const recordStore = useRecordStore();
        const record = computed(() => recordStore.selectedRecord);

        const mapboxKey = import.meta.env.VITE_MAPBOX_API_KEY;

        onMounted(() => {
            mapboxgl.accessToken = mapboxKey;
            map.value = new mapboxgl.Map({
                container: map.value,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [-71.0850612, 42.3432998],
                zoom: 12
            });
        });

        const flyToLocation = () => {
            const latitude = recordStore.selectedRecord.latitude
            const longitude = recordStore.selectedRecord.longitude
            if (latitude !== null && longitude !== null) {
                const lngLat = [longitude, latitude];
                map.value.flyTo({
                    center: lngLat,
                    zoom: 17, // You can adjust the zoom level
                    essential: true,
                });

                if (!marker) {
                    marker = new mapboxgl.Marker({
                        element: createCustomMarkerElement(),
                    })
                        .setLngLat(lngLat)
                        .addTo(map.value);
                } else {
                    marker.setLngLat(lngLat);
                }
            }

        };

        const createCustomMarkerElement = () => {
            const customMarker = document.createElement('div');
            customMarker.className = 'w-4 h-4 bg-optimistic-blue border-white border-2 rounded-full'; // Apply the custom CSS class
            return customMarker;
        };

        // Watch for changes in the Pinia store's coordinates and update the map
        watch(
            recordStore,
            () => {
                flyToLocation();
            }
        );

        return {
            map, recordStore, record
        };
    }
}
</script>

<style>
.blue-circle-marker {
    width: 20px;
    height: 20px;
    background-color: blue;
    border-radius: 50%;
    border: 2px solid white;
  }
  </style>