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
import { computed } from 'vue'
import { type Tool } from '~/composables/useTools'
import { getToolIcon } from '~/components/cards/toolIconRegistry'

const props = defineProps<{ tool: Tool }>()

const iconSize = 28

// Icons come from the shared registry (see toolIconRegistry.ts); the
// home grid and the search palette both render the same way so they
// never drift apart.
const iconPath = computed(() => getToolIcon(props.tool.icon))
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