<script setup>
import SearchBar from './SearchBar.vue'
</script>


<template>
<!-- Navbar -->  
<nav class="bg-charles-blue py-4 flex flex-row items-center justify-between">
  <!-- Logo and Title -->
  <div class="w-30 px-5 flex flex-row items-center">
    <img src="/logo.png" class="w-10 h-14 mx-5">
    <router-link to="/" class="w-40 font-sans text-3xl text-white font-bold leading-7">RentSmart Boston</router-link>
  </div>
  <!-- Search bar -->
<SearchBar />
  <!-- About Page -->
  <div class="px-5">
    <router-link to="/about" class="text-white font-sans text-lg font-bold hidden md:flex">About</router-link>
      <router-link to="/about" class="md:hidden">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="w-8 h-8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      </router-link>
  </div>
</nav>
</template>
