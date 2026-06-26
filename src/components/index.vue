<!--
  src/components/index.vue — home page.
  Layout: Follow banner / 我的收藏 (vuedraggable reorder) / 全部工具.
  Drag styling: --ghost on the source slot (dashed teal placeholder),
  --drag on the floating mirror that follows the cursor (solid teal +
  shadow + tilt). handle=".it-tool-card" so heart-button clicks don't
  start a drag.
-->
<template>
  <div class="it-page-content home-page">
    <div class="home-page__grid home-page__grid--with-banner">
      <div class="home-page__cell home-page__cell--banner">
        <FollowBanner />
      </div>
    </div>

    <template v-if="favoriteTools.length > 0">
      <div class="home-page__section-title-row">
        <h3 class="home-page__section-title home-page__section-title--favorites">
          {{ t('home.section.favorites') }}
        </h3>
        <span class="home-page__drag-hint" aria-hidden="true">
          {{ dragHint }}
        </span>
      </div>

      <draggable
        v-model="localFavorites"
        :animation="180"
        item-key="path"
        handle=".it-tool-card"
        ghost-class="home-page__cell--ghost"
        drag-class="home-page__cell--drag"
        :force-fallback="true"
        :fallback-tolerance="3"
        class="home-page__grid home-page__grid--tools home-page__grid--draggable"
        @start="isDragging = true"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <div class="home-page__cell home-page__cell--draggable">
            <ToolCard :tool="element" />
          </div>
        </template>
      </draggable>
    </template>

    <h3 class="home-page__section-title">{{ t('home.section.tools') }}</h3>

    <div class="home-page__grid home-page__grid--tools">
      <div v-for="tool in localizedTools" :key="tool.path" class="home-page__cell">
        <ToolCard :tool="tool" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import FollowBanner from './cards/FollowBanner.vue'
import ToolCard from './cards/ToolCard.vue'
import { useLocalizedTools, type Tool } from '~/composables/useTools'
import { useFavorites } from '~/composables/useFavorites'

const { localizedTools } = useLocalizedTools()
const { favoriteTools, setFavoriteOrder } = useFavorites()
const { t } = useI18n({ useScope: 'global' })

// Local mirror — vuedraggable mutates this via v-model during drag,
// and we re-sync from favoriteTools whenever it changes externally
// (e.g. heart-button toggle adds a new favorite). Order is only
// persisted at drag end via setFavoriteOrder.
const localFavorites = ref<Tool[]>(favoriteTools.value)
watch(favoriteTools, (next) => {
  localFavorites.value = [...next]
})

const isDragging = ref(false)
const dragHint = computed(() =>
  isDragging.value ? t('home.drag.hintActive') : t('home.drag.hintIdle'),
)

function onDragEnd() {
  isDragging.value = false
  setFavoriteOrder(localFavorites.value.map((tool) => tool.path))
}
</script>

<style lang="scss" scoped>
.home-page {
  padding: 12px 16px 32px;

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    column-gap: 12px;
    row-gap: 12px;
  }
  &__grid--with-banner,
  &__grid--tools {
    @media (min-width: 640px)  { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (min-width: 768px)  { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @media (min-width: 1280px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  &__cell {
    min-width: 0;
    display: flex;
    align-self: stretch;
  }
  // Pin banner to column 1 on wide screens; `align-self: start` keeps
  // it from stretching to match the tool grid's row height.
  &__cell--banner {
    @media (min-width: 1280px) { grid-column: 1; }
    align-self: start;
  }

  // 2px transparent border on the base so ghost/drag border swap
  // doesn't shift layout. --ghost = source slot during drag (dashed
  // teal placeholder). --drag = floating mirror (solid teal + shadow).
  &__cell--draggable {
    position: relative;
    cursor: grab;
    border: 2px solid transparent;
    border-radius: 10px;
    transition: border-color 0.15s ease, background-color 0.15s ease, opacity 0.15s ease;

    &:active { cursor: grabbing; }

    &.home-page__cell--ghost {
      border-color: var(--ghost-border);
      border-style: dashed;
      background-color: var(--ghost-bg);
      opacity: 0.55;
    }

    &.home-page__cell--drag {
      border-color: var(--brand-primary);
      background-color: var(--el-color-primary-light-9, #ecfeff);
      box-shadow: 0 10px 24px var(--drag-shadow);
      cursor: grabbing;
      transform: rotate(-1.5deg);
    }
  }

  &__section-title {
    margin: 25px 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--it-text-secondary);
    letter-spacing: 0.02em;
  }
  &__section-title-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  &__drag-hint {
    font-size: 12px;
    color: var(--it-text-tertiary, #94a3b8);
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }
  // Favorites header sits closer to the banner than the "all tools"
  // section does (default 25px gap is too much visual weight here).
  &__section-title--favorites {
    margin-top: 18px;
    margin-bottom: 4px;
  }
}
</style>