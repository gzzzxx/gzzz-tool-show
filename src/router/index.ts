import { createRouter, createWebHashHistory } from "vue-router"
 
const routes = [
    {
        path: '/',
        name: 'index',
        component: () => import('../components/index.vue')
    },
    {
        path: '/encryption/:id',
        name: 'encryption',
        component: () => import('../views/encryption/encryption.vue')
    },
    {
        path: '/format',
        name: 'format',
        component: () => import('../views/json/format.vue')
    },
    {
        path: '/base64',
        name: 'base64',
        component: () => import('../views/base64/base64.vue')
    },
    {
        path: '/contrast',
        name: 'contrast',
        component: () => import('../views/contrast/contrast.vue')
    },
    {
        path: '/calendar',
        name: 'calendar',
        component: () => import('../views/calendar/calendar.vue')
    },
    {
        path: '/timestamp',
        name: 'timestamp',
        component: () => import('../views/timestamp/timestamp.vue')
    },
    {
        path: '/color',
        name: 'color',
        component: () => import('../views/color/color.vue')
    }
]
export const router = createRouter({
    history: createWebHashHistory(),
    routes: routes
})
 
export default router