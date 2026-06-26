<!--
  ToolCard.vue — single tool tile on the home page.

  Renders as a <div> wrapper (the global .it-tool-card) containing a
  <router-link>. We deliberately avoid el-card and el-icon here: both
  inject extra wrappers / sizing rules that fight a CSS Grid layout
  with `gap` and `height: 100%`. The icon is a plain inline SVG sized
  via width/height — no font magic, no flex surprises.

  All visual styling lives in the global .it-tool-card class in
  src/styles/_cards.scss; this file only adds the link reset, the
  tiny local "NEW" pill, and the favorites heart button.

  The heart lives INSIDE the head row (so it inherits the flex
  layout, never overlaps the icon, and survives without positioning
  tricks). The click handler uses `.stop.prevent` so toggling a
  favorite doesn't navigate through the wrapping router-link.
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
        <div class="tool-card__head-right">
          <span
            v-if="tool.isNew"
            class="tool-card__new"
          >NEW</span>
          <el-tooltip
            :content="favTooltip"
            placement="top"
            :show-after="120"
          >
            <button
              type="button"
              class="tool-card__fav"
              :class="{ 'is-fav': isFav }"
              :aria-label="favTooltip"
              :aria-pressed="isFav"
              @click.stop.prevent="onToggleFav"
            >
              <svg
                :width="favIconSize"
                :height="favIconSize"
                viewBox="0 0 24 24"
                :fill="isFav ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 21s-7-4.5-9.5-9.5C.8 7.5 3.5 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 6.2 3.5 4.5 7.5C19 16.5 12 21 12 21z" />
              </svg>
            </button>
          </el-tooltip>
        </div>
      </div>
      <div class="it-tool-card__name tool-card__name">{{ tool.name }}</div>
      <div class="it-tool-card__desc tool-card__desc">{{ tool.desc }}</div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type Tool } from '~/composables/useTools'
import { useFavorites } from '~/composables/useFavorites'
import { getToolIcon } from '~/components/cards/toolIconRegistry'

const props = defineProps<{ tool: Tool }>()

const iconSize = 28
const favIconSize = 18

// Icons come from the shared registry (see toolIconRegistry.ts); the
// home grid and the search palette both render the same way so they
// never drift apart.
const iconPath = computed(() => getToolIcon(props.tool.icon))

// Favorites — global composable, persisted to localStorage.
const { isFavorite, toggle } = useFavorites()
const isFav = computed(() => isFavorite(props.tool.path))

// Tooltip flips between "add" and "remove" copy based on current
// state. Both branches use the same ToolCard-keyed i18n namespace.
const { t } = useI18n({ useScope: 'global' })
const favTooltip = computed(() =>
  isFav.value ? t('toolcard.favorite.remove') : t('toolcard.favorite.add'),
)

function onToggleFav() {
  toggle(props.tool.path)
}
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

.tool-card__head-right {
  // Holds the optional NEW pill + the always-present heart. Using
  // a flex wrapper with a small gap so the heart never crashes
  // into the pill when both are visible.
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
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

// Heart button — sits inside the head row, never overlaps the icon.
// No `position: absolute` needed because the head's space-between
// already pins it to the right edge. Colors come from --it-favorite
// (defined in _variables.scss) so the filled heart always matches
// the project accent (teal primary), not Element Plus's default
// success green — same teal the sidebar's "我的收藏" group header
// uses, so the two favorite affordances look like one family.
.tool-card__fav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--it-text-tertiary, #94a3b8);
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;

  &:hover {
    color: var(--it-favorite);
    background-color: var(--it-favorite-soft);
  }
  &:active { transform: scale(0.92); }
  &:focus-visible {
    outline: 2px solid var(--brand-primary);
    outline-offset: 1px;
  }

  // Filled state — teal heart.
  &.is-fav {
    color: var(--it-favorite);
    &:hover {
      color: var(--it-favorite);
      background-color: var(--it-favorite-softer);
    }
  }

  svg { display: block; }
}
</style>
