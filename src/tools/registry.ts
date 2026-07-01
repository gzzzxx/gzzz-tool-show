/*
  registry.ts — single source of truth for every tool in the app.

  One entry per user-facing tool. The router, the home grid, and the
  sidebar all read from this list — add a tool here and it shows up
  everywhere; remove it and it disappears everywhere.

  `props` is forwarded to vue-router when the component needs to know
  which tool it is (e.g. encryption.vue gets `algorithm: 'SM4'` /
  `'AES'` from its dedicated route rather than reading from
  `route.params`).
*/
import type { Component } from 'vue'

export type ToolCategory = 'crypto' | 'dev' | 'convert' | 'time'

export interface ToolDefinition {
  /** Canonical URL the user lands on; used by sidebar, tool card, search palette. */
  path: string
  /** Lazy-loaded component. */
  component: () => Promise<{ default: Component }>
  /** Key into `toolIconRegistry`. */
  icon: string
  /** i18n dot-path for the display name. */
  nameKey: string
  /** i18n dot-path for the description. */
  descKey: string
  /** Sidebar category. */
  category: ToolCategory
  /** Optional vue-router `props` — passed to the component as props. */
  props?: Record<string, unknown>
}

export const tools: readonly ToolDefinition[] = [
  // crypto
  { path: '/encryption/SM4', component: () => import('~/views/encryption/encryption.vue'), icon: 'shield',  nameKey: 'tools.sm4.name',      descKey: 'tools.sm4.desc',      category: 'crypto', props: { algorithm: 'SM4' } },
  { path: '/encryption/AES', component: () => import('~/views/encryption/encryption.vue'), icon: 'key',     nameKey: 'tools.aes.name',      descKey: 'tools.aes.desc',      category: 'crypto', props: { algorithm: 'AES' } },
  { path: '/hash',            component: () => import('~/views/hash/hash.vue'),            icon: 'hash',    nameKey: 'tools.hash.name',     descKey: 'tools.hash.desc',     category: 'crypto' },
  // dev
  { path: '/format',          component: () => import('~/views/json/format.vue'),          icon: 'braces',   nameKey: 'tools.format.name',   descKey: 'tools.format.desc',   category: 'dev' },
  { path: '/sql',             component: () => import('~/views/sql/sql.vue'),              icon: 'database', nameKey: 'tools.sql.name',      descKey: 'tools.sql.desc',      category: 'dev' },
  { path: '/contrast',        component: () => import('~/views/contrast/contrast.vue'),    icon: 'diff',     nameKey: 'tools.contrast.name', descKey: 'tools.contrast.desc', category: 'dev' },
  { path: '/text-stats',      component: () => import('~/views/text-stats/text-stats.vue'),  icon: 'bar',      nameKey: 'tools.textStats.name', descKey: 'tools.textStats.desc', category: 'dev' },
  { path: '/crontab',         component: () => import('~/views/crontab/crontab.vue'),        icon: 'cron',     nameKey: 'tools.crontab.name',   descKey: 'tools.crontab.desc',   category: 'dev' },
  // convert
  { path: '/base64',          component: () => import('~/views/base64/base64.vue'),         icon: 'binary',   nameKey: 'tools.base64.name',    descKey: 'tools.base64.desc',    category: 'convert' },
  { path: '/timestamp',       component: () => import('~/views/timestamp/timestamp.vue'),   icon: 'clock',    nameKey: 'tools.timestamp.name', descKey: 'tools.timestamp.desc', category: 'convert' },
  { path: '/color',           component: () => import('~/views/color/color.vue'),           icon: 'palette',  nameKey: 'tools.color.name',     descKey: 'tools.color.desc',     category: 'convert' },
  { path: '/qrcode',          component: () => import('~/views/qrcode/qrcode.vue'),         icon: 'qrcode',   nameKey: 'tools.qrcode.name',    descKey: 'tools.qrcode.desc',    category: 'convert' },
  // time
  { path: '/calendar',        component: () => import('~/views/calendar/calendar.vue'),    icon: 'calendar', nameKey: 'tools.calendar.name', descKey: 'tools.calendar.desc', category: 'time' },
  { path: '/timer',           component: () => import('~/views/timer/timer.vue'),          icon: 'timer',    nameKey: 'tools.timer.name',    descKey: 'tools.timer.desc',    category: 'time' },
] as const