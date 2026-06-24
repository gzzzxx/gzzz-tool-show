<!--
  ToolCard.vue — single tool tile on the home page.

  Renders as a <div> wrapper (the global .it-tool-card) containing a
  <router-link>. We deliberately avoid el-card and el-icon here: both
  inject extra wrappers / sizing rules that fight a CSS Grid layout
  with `gap` and `height: 100%`. The icon is a plain inline SVG sized
  via width/height — no font magic, no flex surprises.

  All visual styling lives in the global .it-tool-card class in
  src/styles/_cards.scss; this file only adds the link reset and the
  tiny local "NEW" pill.
-->
<template>
  <div class="it-tool-card tool-card">
    <router-link
      :to="tool.path"
      class="tool-card__link"
    >
      <div class="it-tool-card__head tool-card__head">
        <svg
          class="it-tool-card__icon tool-card__icon"
          :width="iconSize"
          :height="iconSize"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <component :is="iconPath" />
        </svg>
        <span
          v-if="tool.isNew"
          class="tool-card__new"
        >NEW</span>
      </div>
      <div class="it-tool-card__name tool-card__name">{{ tool.name }}</div>
      <div class="it-tool-card__desc tool-card__desc">{{ tool.desc }}</div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'

interface Tool {
  path: string
  name: string
  desc: string
  /** key into the iconRegistry below */
  icon?: string
  isNew?: boolean
}

const props = withDefaults(defineProps<{ tool: Tool }>(), {
  icon: 'document',
})

const iconSize = 28

// We render the icon as a render function so we can use Vue's <component>
// without needing @element-plus/icons-vue. Each entry is a tiny inline
// SVG path — keeps the bundle small and the markup simple.
const iconRegistry: Record<string, ReturnType<typeof h>> = {
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

const iconPath = computed(() =>
  iconRegistry[props.tool.icon ?? 'document'] ?? iconRegistry.document,
)
</script>

<style lang="scss" scoped>
// Outer wrapper is the global .it-tool-card. We don't restyle it here —
// keeping this <style> minimal means the only thing scoped CSS touches
// is the link reset. The link itself is plain <a> with no flex/height
// logic, so it doesn't fight the global class.
//
// (Vue 3 scoped CSS adds a data-v hash to selectors; we deliberately
// avoid touching .it-tool-card from here to keep the cascade simple.)
.tool-card__link {
  display: block;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.tool-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tool-card__icon {
  // `flex-shrink: 0` so the SVG never collapses inside the flex column
  // when the card is height-stretched to match its row siblings.
  flex-shrink: 0;
  display: block;
}

.tool-card__new {
  padding: 2px 8px;
  background: var(--el-color-success, #67c23a);
  color: #fff;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
}
</style>