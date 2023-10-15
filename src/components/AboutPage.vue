<template>
    <div class="px-10 md:px-80 py-20 md:py-10">
        <router-link to="/" class="font-bold text-sm pb-5 inline-flex items-baseline">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                class="w-3 h-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <p>Back</p>
        </router-link>
        <h1 class="font-bold text-2xl pb-5">About RentSmart Boston</h1>
        <p class="font-serif text-lg pb-5">
            This application is a remake to City of Boston's <a class="underline text-optimistic-blue font-bold"
                href="https://www.boston.gov/departments/analytics-team/rentsmart-boston">RentSmart Boston dashboard.</a>
            <span class="font-bold text-freedom-red"> It is not an official City of Boston data product.</span>
            The purpose of RentSmart Boston is to allow users to search an address in the City of Boston's <a
                class="underline text-optimistic-blue font-bold" href="https://data.boston.gov/dataset/rentsmart">RentSmart
                dataset</a>:
        </p>
        <p class="font-serif italic mb-5 ml-1 pl-2 border-l-4 border-l-charles-blue">RentSmart Boston compiles data from
            BOS:311 and the City's Inspectional Services Division to give prospective tenants a more complete picture of the
            homes and apartments they are considering renting, assisting them in understanding any previous issues with the
            property, including: housing violations, building violations, enforcement violations, housing complaints,
            sanitation requests, and/or civic maintenance requests.</p>
        <h2 class="font-bold text-xl pb-5">Why remake RentSmart Boston?</h2>
    <p class="font-serif text-lg pb-5">
        While the original RentSmart Boston dashboard providers users with a searchable experience, it is created as a
        Tableau dashboard embed. Embedded dashboards for public services leave much to be desired. This application is
        an effort to rebuid the dashboard using a web-first framework. The code for this project is available via an
        open source license on <a href="https://github.com/hersh-gupta/rent-smart-dash"
            class="underline text-optimistic-blue font-bold">GitHub</a>.
    </p>
    <h2 class="font-bold text-xl pb-5">About the Author</h2>
    <p class="font-serif text-lg pb-5">Hi 👋🏾 My name is Hersh and I'm a data scientist with a social science
        background who dabbles in web development. Find me on <a class="underline text-optimistic-blue font-bold"
            href="https://www.linkedin.com/in/hershvgupta/">LinkedIn</a> and <a
            class="underline text-optimistic-blue font-bold" href="https://mstdn.social/@hersh">Mastodon</a> and on <a
            class="underline text-optimistic-blue font-bold" href="https://hershgupta.com">https://hershgupta.com</a>
    </p>
</div></template>