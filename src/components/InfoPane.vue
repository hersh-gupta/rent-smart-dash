<template>
    <Transition
      enter-active-class="transition duration-300" 
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"  
      leave-active-class="transition duration-300" 
      leave-from-class="opacity-100"
      leave-to-class="opacity-0" >
    <div v-if="record" class="flex flex-col pl-10 lg:basis-2/5 basis-2/3 bg-white border-charles-blue border-t-4 lg:border-t-0 lg:border-r-4 relative overflow-y-auto max-h-[86vh] pb-10">
        <button class="absolute top-2 right-2" @click="closeRoute()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <button class="absolute top-2 right-12">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>

        </button>

        <h1 class="font-serif text-xl font-bold pt-5">{{ record.address }}</h1>
        <p class="font-serif text-sm font-bold">{{ record.neighborhood }}</p>
        <p class="font-serif text-sm font-bold">Owner: {{ record.owner }}</p>
        <ul class="">
            <li class="font-serif text-lg font-bold pt-5">Building Violations</li>
            <ul>
                <li class="font-sans text-sm font-bold" v-if="!record['Building Violations'].length">None Found</li>
                <li class="font-sans text-sm font-bold" v-else v-for="item in record['Building Violations']">{{ item }}</li>
            </ul>

            <li class="font-serif text-lg font-bold pt-5">Housing Compliants</li>
            <ul>
                <li class="font-sans text-sm font-bold" v-if="!record['Housing Complaints'].length">None Found</li>
                <li class="font-sans text-sm font-bold" v-else v-for="item in record['Housing Complaints']">{{ item }}</li>
            </ul>

            <li class="font-serif text-lg font-bold pt-5">City Maintenance Requests</li>
            <ul>
                <li class="font-sans text-sm font-bold" v-if="!record['Civic Maintenance Requests'].length">None Found</li>
                <li class="font-sans text-sm font-bold" v-else v-for="item in record['Civic Maintenance Requests']">{{ item }}</li>
            </ul>

            <li class="font-serif text-lg font-bold pt-5">Housing Violations</li>
            <ul>
                <li class="font-sans text-sm font-bold" v-if="!record['Housing Violations'].length">None Found</li>
                <li class="font-sans text-sm font-bold" v-else v-for="item in record['Housing Violations']">{{ item }}</li>
            </ul>

            <li class="font-serif text-lg font-bold pt-5">Enforcement Violations</li>
            <ul>
                <li class="font-sans text-sm font-bold" v-if="!record['Enforcement Violations'].length">None Found</li>
                <li class="font-sans text-sm font-bold" v-else v-for="item in record['Enforcement Violations']">{{ item }}</li>
            </ul>

            <li class="font-serif text-lg font-bold pt-5">Sanitation Requests</li>
            <ul>
                <li class="font-sans text-sm font-bold" v-if="!record['Sanitation Requests'].length">None Found</li>
                <li class="font-sans text-sm font-bold" v-else v-for="item in record['Sanitation Requests']">{{ item }}</li>
            </ul>
        </ul>

    </div>
</Transition>
</template>

<script>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useRecordStore } from '../store';

export default {

    setup() {

        const recordStore = useRecordStore()
    
        const record = computed(() => recordStore.selectedRecord)

        const router = useRouter()
    
        const closeRoute = () => {
            recordStore.$reset();
            router.push({ name: 'Home' });
        };

        return {
            recordStore, record, closeRoute
        };
    }
}
</script>