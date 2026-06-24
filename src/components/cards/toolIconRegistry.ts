/*
  toolIconRegistry.ts — shared SVG render functions for tool icons.

  Both ToolCard (home grid) and SearchPalette (header dropdown) render
  tool icons the same way: tiny inline SVG paths wrapped in Vue render
  functions, keyed by string id. Keeping them in one file prevents the
  two surfaces from drifting apart when a new icon is added.

  To register a new icon: add a key → () => h('path' | 'g', ...) entry
  here, then set `tool.icon = '<key>'` in src/composables/useTools.ts.
*/
import { h, type VNode } from 'vue'

export type IconRender = () => VNode

export const toolIconRegistry: Record<string, IconRender> = {
  lock: () => h('path', { d: 'M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM7 11V7a5 5 0 0 1 10 0v4' }),
  coin: () => h('path', { d: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }),
  timer: () => h('g', null, [
    h('path', { d: 'M12 6v6l4 2' }),
    h('circle', { cx: 12, cy: 14, r: 8 }),
    h('path', { d: 'M9 2h6' }),
  ]),
  brush: () => h('g', null, [
    h('path', { d: 'M3 21c0-3 2-5 5-5h8c3 0 5 2 5 5' }),
    h('path', { d: 'M14 3l7 7-9 9H5v-7z' }),
  ]),
  document: () => h('g', null, [
    h('path', { d: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z' }),
    h('path', { d: 'M14 3v6h6' }),
  ]),
  view: () => h('g', null, [
    h('path', { d: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z' }),
    h('circle', { cx: 12, cy: 12, r: 3 }),
  ]),
  calendar: () => h('g', null, [
    h('rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }),
    h('path', { d: 'M3 10h18M8 3v4M16 3v4' }),
  ]),
  code: () => h('g', null, [
    h('path', { d: 'M8 6L2 12l6 6M16 6l6 6-6 6' }),
  ]),
}

const DEFAULT_ICON = 'document'

export function getToolIcon(key?: string): IconRender {
  return toolIconRegistry[key ?? DEFAULT_ICON] ?? toolIconRegistry[DEFAULT_ICON]
}
