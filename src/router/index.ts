/*
  router/index.ts — vue-router setup.

  Routes are derived from `~/tools/registry`: every tool becomes one
  route (SM4 and AES each get their own entry — same component, but
  different `props` so the view knows which algorithm it is).

  The home route (`/`) is fixed and lives outside the registry; it's
  an app-shell entry, not a tool.
*/
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { tools } from '~/tools/registry'

const toolRoutes: RouteRecordRaw[] = tools.map(tool => ({
  path: tool.path,
  component: tool.component,
  ...(tool.props ? { props: tool.props } : {}),
}))

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'index', component: () => import('~/components/index.vue') },
    { path: '/about', name: 'about', component: () => import('~/views/about/about.vue') },
    ...toolRoutes,
  ],
})

export default router