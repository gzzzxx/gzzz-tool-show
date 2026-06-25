/*
  toolIconRegistry.ts — shared SVG render functions for tool icons.

  Single source of truth for both the home grid (ToolCard.vue) and
  the sidebar (BaseSide.vue). Every icon is keyed by a lowercase
  string id; adding a new tool / icon is a one-line change here
  + the matching `tool.icon = '<key>'` in src/composables/useTools.ts.

  Visual style:
  - 24x24 viewBox, 1.5 stroke width, stroke-linecap/linejoin: round
  - fill: none (outline-only) for tool icons — matches the lucide /
    feather convention so all icons feel like one family.
  - fill: currentColor for the few "solid" UI icons (star, coffee)
    so they render with the surrounding button's text color.

  Icon path data is adapted from the lucide icon set; the registry
  is purely Vue render functions returning VNodes, no DOM strings
  or class juggling at the consumer side.
*/
import { h, type VNode } from 'vue'

export type IconRender = () => VNode

/**
 * Tool icons — each one is unique so a user can scan the grid and
 * tell tools apart at a glance. Keys are referenced from
 * useTools.ts and the sidebar's per-category tool list.
 */
export const toolIconRegistry: Record<string, IconRender> = {
  // SM4 — shield (national-cipher security barrier)
  shield: () => h('path', {
    d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  }),

  // AES — key (symmetric-key cryptography)
  key: () => h('g', null, [
    h('circle', { cx: 8, cy: 15, r: 4 }),
    h('path', { d: 'M10.85 12.15 19 4M18 5l3 3M15 8l3 3' }),
  ]),

  // Base64 — binary (two vertical bars, the "1010" feel)
  binary: () => h('g', null, [
    h('rect', { x: 6, y: 4, width: 3, height: 16, rx: 0.5 }),
    h('rect', { x: 15, y: 4, width: 3, height: 16, rx: 0.5 }),
  ]),

  // Timestamp — clock (round face + 12→center→4 hands)
  clock: () => h('g', null, [
    h('circle', { cx: 12, cy: 12, r: 10 }),
    h('path', { d: 'M12 6v6l4 2' }),
  ]),

  // Color — classic artist's palette (调色盘): the unmistakable
  // kidney-shaped outline with the bottom-right "thumb rest"
  // (the curved cut-out an artist grips with their thumb) and
  // four paint dabs scattered on the upper face. Uses Lucide's
  // path verbatim — it's the de-facto "color / 调色盘" glyph on
  // icon search and reads unambiguously at thumbnail size.
  palette: () => h('g', null, [
    h('path', {
      d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.992 6.012 17.461 2 12 2z',
    }),
    h('circle', { cx: 6.5,  cy: 12.5, r: 1.3, fill: 'currentColor', stroke: 'none' }),
    h('circle', { cx: 8.5,  cy: 7.5,  r: 1.3, fill: 'currentColor', stroke: 'none' }),
    h('circle', { cx: 13.5, cy: 6.5,  r: 1.3, fill: 'currentColor', stroke: 'none' }),
    h('circle', { cx: 17.5, cy: 10.5, r: 1.3, fill: 'currentColor', stroke: 'none' }),
  ]),

  // JSON formatter — braces ({ } pair)
  braces: () => h('g', null, [
    h('path', {
      d: 'M8 3H6a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2',
    }),
    h('path', {
      d: 'M16 3h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2',
    }),
  ]),

  // Code diff — two opposing arrows, left/right comparison
  diff: () => h('g', null, [
    h('path', { d: 'M3 7h6l-3-3M3 17h6l-3 3' }),
    h('path', { d: 'M21 7h-6l3-3M21 17h-6l3 3' }),
  ]),

  // Calendar — kept as a 1:1 replacement of the old icon
  calendar: () => h('g', null, [
    h('rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }),
    h('path', { d: 'M3 10h18M8 3v4M16 3v4' }),
  ]),
}

/**
 * UI / decorative icons — used by FollowBanner, header sponsor
 * button, etc. Same renderer contract (returns VNode), kept in
 * the same file so all icon decisions live in one place.
 */
export const uiIconRegistry: Record<string, IconRender> = {
  // "Follow us on GitHub" — filled 5-point star. Reads as the
  // GitHub "Star this repo" / "watch" affordance and pairs with
  // the inline GitHub / Gitee links below the title. We considered
  // the GitHub octocat mark here too, but the star carries a
  // warmer "shining / endorsing" feel that suits a call-out
  // banner better than a brand logo would.
  star: () => h('path', {
    d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    fill: 'currentColor',
    stroke: 'currentColor',
    'stroke-width': '0.5',
  }),

  // "Sponsor / 打赏" — gift box (box + lid + ribbon + bow).
  // Reads unambiguously as "support / 赞助" — fits the zh-CN
  // 打赏 mental model and the GitHub-Sponsor button convention.
  // Picked over heart because the sponsor button is a call to
  // action, not a reaction; gift better signals "give something".
  gift: () => h('g', null, [
    h('rect', { x: 3,  y: 8,  width: 18, height: 4,  rx: 1 }),
    h('path', { d: 'M5 12v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9' }),
    h('path', { d: 'M12 8v13' }),
    h('path', { d: 'M12 8c-1.5 0-3-1-3-2.5S10 3 12 3s2 1.5 2 2.5S13.5 8 12 8z' }),
    h('path', { d: 'M12 8c1.5 0 3-1 3-2.5S13.5 3 12 3' }),
  ]),
}

const DEFAULT_ICON = 'document'
const FALLBACK_TOOL: IconRender = () => h('path', {
  d: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6',
})

/**
 * Resolve a tool icon by key. Falls back to a generic document
 * glyph when the key is missing or unknown, so a stale registry
 * reference never crashes the render.
 */
export function getToolIcon(key?: string): IconRender {
  return toolIconRegistry[key ?? DEFAULT_ICON] ?? FALLBACK_TOOL
}

/** Resolve a UI / decorative icon by key. No fallback — UI icons
 *  are referenced by hand from a handful of places, so an unknown
 *  key should surface loudly rather than silently rendering nothing. */
export function getUiIcon(key: string): IconRender {
  const render = uiIconRegistry[key]
  if (!render) {
    throw new Error(`[toolIconRegistry] unknown UI icon key: ${key}`)
  }
  return render
}