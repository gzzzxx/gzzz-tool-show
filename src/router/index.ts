/*
  router/index.ts — vue-router setup.

  Routes are derived from `~/tools/registry`: every tool becomes one
  route (SM4 and AES each get their own entry — same component, but
  different `props` so the view knows which algorithm it is).

  The home route (`/`) is fixed and lives outside the registry; it's
  an app-shell entry, not a tool.
*/
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { tools } from '~/tools/registry'

const toolRoutes: RouteRecordRaw[] = tools.map(tool => ({
  path: tool.path,
  component: tool.component,
  ...(tool.props ? { props: tool.props } : {}),
}))

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'index', component: () => import('~/components/index.vue') },
    { path: '/about', name: 'about', component: () => import('~/views/about/about.vue') },
    // Catch-all — any URL that didn't match a tool or /about lands on
    // the 404 view. Required for history-mode SPA so direct visits and
    // shared links to unknown paths render a styled page instead of a
    // blank one (and so static-host 404.html fallbacks route cleanly).
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('~/views/not-found/not-found.vue') },
    ...toolRoutes,
  ],
})

export default router