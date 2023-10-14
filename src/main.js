import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import AboutPage from './components/AboutPage.vue'
import HomeBody from './components/HomeBody.vue'
import TitleBar from './components/TitleBar.vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PageNotFound from './components/PageNotFound.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeBody,
    },
    { 
        path: '/address/:address',
        name: 'SearchAddress',
        component: HomeBody
    },
    { 
        path: '/about',
        name: 'About',
        component: AboutPage
    },
    {  
        path: '/:catchAll(.*)',
        name: 'PageNotFound',
        component: PageNotFound
  }

]

const router = createRouter({
    history: createWebHistory(),
    routes
  })

const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')