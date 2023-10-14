<script setup>
import HomeMap from './HomeMap.vue'
import InfoPane from './InfoPane.vue'
</script>

<template>
    <div class="flex flex-col-reverse lg:flex-row flex-grow">
        <InfoPane />
        <HomeMap />
    </div>
</template>