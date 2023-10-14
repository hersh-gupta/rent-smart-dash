<template>
  <form class="md:basis-3/4 h-10 px-10 md:flex md:flex-col items-center md:relative absolute inset-x-0 top-28 z-40 md:top-0">
    <div class="flex flex-row w-full">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg class="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 20 20">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
          </svg>
        </div>
      </div>
      <input id="address" v-model="searchTerm"
        class="w-full pl-10 font-serif appearance-none border-2 border-charles-blue py-2 px-4 text-gray-1 leading-tight"
        type="text" placeholder="Search for an address">
    </div>
    <div class="z-10 w-full">
      <ul class="bg-white px-4 py-2 space-y-1 border-4 border-charles-blue" v-if="searchAddresses.length">
        <li class="px-1 pt-1 pb-2 font-bold border-b border-gray-200">
          Showing {{ searchAddresses.length }} of {{ records.length }} results
        </li>
        <li class="hover:bg-gray-4 hover:font-bold hover:cursor-pointer p-1" v-for="record in searchAddresses"
          :key="record.address" @click="selectAddress(record.address)">
          {{ record.address }}</li>
      </ul>
    </div>
  </form>
</template>

<script>
import { useRouter } from 'vue-router'
import { watch, ref, computed, onMounted } from 'vue'
import { useRecordStore } from '../store';

export default {

  name: 'SearchAddress',

  setup() {

    const records = ref([]);

    const recordStore = useRecordStore();

    onMounted(async () => {
      try {
        const response = await fetch('rs-2016.json');
        records.value = await response.json(); // Assuming the JSON contains an array of records
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    });
    
    /* Prep autocomplete */
    let searchTerm = ref('')

    let filteredRecord = ref('')

    const searchAddresses = computed(() => {
      if (searchTerm.value === '') {
        return []
      }

      let matches = 0

      return records.value.filter(record => {
        if (record.address.toLowerCase().includes(searchTerm.value.toLowerCase()) && matches < 10) {
          matches++
          return address
        }
      })
    });

    const selectAddress = (address) => {
      selectedAddress.value = address
      searchTerm.value = ''

      filteredRecord.value = records.value.find(record =>
          record.address.toLowerCase().includes(address.toLowerCase()));

      
      recordStore.setSelectedRecord(filteredRecord.value);

    }

    let selectedAddress = ref('')

    /* Prep routes */
    const router = useRouter()
    
    const updateRoute = () => {
      let newAddress = selectedAddress.value.trim().replace(/\W/g, ' ').replace(/\s+/g, '-').toLowerCase()
      router.push({ name: 'SearchAddress', params: { address: newAddress } });
    };
    
    watch(selectedAddress, updateRoute);

    return {
      records,
      searchTerm,
      searchAddresses,
      selectAddress,
      selectedAddress
    }
  }
}
</script>