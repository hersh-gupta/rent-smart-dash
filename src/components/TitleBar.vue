<script setup>
import SearchBar from './SearchBar.vue'
import { useRecordStore } from '../stores/recordStore'

const recordStore = useRecordStore()
</script>

<template>
  <nav
    class="bg-charles-blue flex flex-col md:flex-row md:items-center md:justify-between md:py-4"
  >
    <div class="flex flex-row items-center justify-between px-5 py-3 md:py-0 md:w-auto">
      <router-link
        to="/"
        @click="recordStore.$reset()"
        class="flex flex-row items-center font-sans text-white leading-tight"
      >
        <img
          src="/logo.png"
          class="w-8 h-11 mr-3 md:w-10 md:h-14 md:mx-5"
          alt="RentSmart Boston logo"
        />
        <span>
          <span class="block text-xl md:text-3xl font-bold">RentSmart Boston</span>
          <span class="hidden md:block text-xs text-blue-4">Boston Open Data · 2021–present</span>
        </span>
      </router-link>
      <router-link
        to="/about"
        class="md:hidden text-white ml-3"
        aria-label="About"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="white"
          class="w-7 h-7"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
      </router-link>
    </div>
    <SearchBar />
    <div class="hidden md:block px-5">
      <router-link to="/about" class="text-white font-sans text-lg font-bold">
        About
      </router-link>
    </div>
  </nav>
</template>
