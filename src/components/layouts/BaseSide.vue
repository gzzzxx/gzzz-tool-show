<!--
  BaseSide.vue — persistent left sidebar (it-tools style).
  Mounted by App.vue in two contexts: persistent aside (PC) or el-drawer
  (mobile). This component is context-agnostic; it only renders itself
  and emits `update:isCollapsed` / `navigate` for the parent to react.
-->
<template>
  <aside :class="['base-side', { 'base-side--collapsed': isCollapsed }]">
    <div class="base-side__brand">
      <router-link
        to="/"
        class="base-side__brand-inner"
        :aria-label="t('header.home.tooltip')"
        @click="emit('navigate', '/')"
      >
        <img src="../../images/logo.svg" alt="IT Tools" class="base-side__logo" />
        <div class="base-side__titles">
          <div class="base-side__title">gzzz-tools</div>
        </div>
      </router-link>
      <div class="base-side__brand-curve" aria-hidden="true" />
    </div>

    <div v-show="!isCollapsed" class="base-side__body">
      <!--
        "我的收藏" group — pinned to the very top, only visible when
        the user actually has at least one favorited tool. Mirrors
        the regular category structure (header + collapsible list)
        so behavior matches, with a small heart icon prefix to mark
        it as a different kind of group.
      -->
      <div
        v-if="favoriteTools.length > 0"
        class="base-side__category base-side__category--favorites"
      >
        <button
          type="button"
          class="base-side__category-header"
          :aria-expanded="!isFavoritesCollapsed"
          @click="isFavoritesCollapsed = !isFavoritesCollapsed"
        >
          <el-icon
            :class="[
              'base-side__category-arrow',
              { 'is-collapsed': isFavoritesCollapsed },
            ]"
          >
            <ArrowDown />
          </el-icon>
          <svg
            class="base-side__favorites-icon"
            :width="14"
            :height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span class="base-side__category-name">{{ t('sidebar.favorites') }}</span>
        </button>

        <transition name="base-side-fade">
          <ul
            v-show="!isFavoritesCollapsed"
            class="base-side__tools"
          >
            <li
              v-for="tool in favoriteTools"
              :key="tool.path"
              class="base-side__tool-item"
            >
              <router-link
                :to="tool.path"
                class="base-side__link"
                active-class="is-active"
                @click="emit('navigate', tool.path)"
              >
                <span class="base-side__toggle-bar" aria-hidden="true" />
                <svg
                  class="base-side__tool-icon"
                  :width="16"
                  :height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <component :is="getToolIcon(tool.icon)" />
                </svg>
                <span class="base-side__tool-name">{{ tool.name }}</span>
              </router-link>
            </li>
          </ul>
        </transition>
      </div>

      <div
        v-for="category in categories"
        :key="category.key"
        class="base-side__category"
      >
        <button
          type="button"
          class="base-side__category-header"
          :aria-expanded="!isCategoryCollapsed(category.key)"
          @click="toggleCategory(category.key)"
        >
          <el-icon
            :class="[
              'base-side__category-arrow',
              { 'is-collapsed': isCategoryCollapsed(category.key) },
            ]"
          >
            <ArrowDown />
          </el-icon>
          <span class="base-side__category-name">{{ category.name }}</span>
        </button>

        <transition name="base-side-fade">
          <ul
            v-show="!isCategoryCollapsed(category.key)"
            class="base-side__tools"
          >
            <li
              v-for="tool in category.tools"
              :key="tool.path"
              class="base-side__tool-item"
            >
              <router-link
                :to="tool.path"
                class="base-side__link"
                active-class="is-active"
                @click="emit('navigate', tool.path)"
              >
                <span class="base-side__toggle-bar" aria-hidden="true" />
                <svg
                  class="base-side__tool-icon"
                  :width="16"
                  :height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <component :is="getToolIcon(tool.icon)" />
                </svg>
                <span class="base-side__tool-name">{{ tool.name }}</span>
              </router-link>
            </li>
          </ul>
        </transition>
      </div>
    </div>

    <div class="base-side__footer" />
  </aside>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useLocalizedTools } from '~/composables/useTools'
import { useFavorites } from '~/composables/useFavorites'
import { getToolIcon } from '~/components/cards/toolIconRegistry'

withDefaults(
  defineProps<{ isCollapsed?: boolean }>(),
  { isCollapsed: false },
)

const emit = defineEmits<{
  (e: 'update:isCollapsed', value: boolean): void
  (e: 'navigate', path: string): void
}>()

// Category labels and per-tool display name are both locale-driven.
// The category key (e.g. 'crypto') is stable for the collapse state
// to key off; switching language never breaks saved state.
//
// Use the active language's tool list so each <a> shows the right
// translated name without the parent having to do any lookups.
const { t } = useI18n({ useScope: 'global' })
const { localizedTools } = useLocalizedTools()

// Stable category key → display name (translated via t()).
// Per-category tool list is filtered from the registry by `category`,
// so adding a tool to a category means setting `category: 'dev'` in
// the registry — no edit here.
import { tools } from '~/tools/registry'
import type { ToolCategory } from '~/tools/registry'

const categoryDefs: { key: ToolCategory; i18nKey: string }[] = [
  { key: 'crypto',  i18nKey: 'sidebar.category.crypto' },
  { key: 'dev',     i18nKey: 'sidebar.category.dev' },
  { key: 'convert', i18nKey: 'sidebar.category.convert' },
  { key: 'time',    i18nKey: 'sidebar.category.time' },
]

const categoryByPath = new Map(tools.map(tool => [tool.path, tool.category]))

const categories = computed(() =>
  categoryDefs.map((cat) => ({
    key: cat.key,
    name: t(cat.i18nKey),
    tools: localizedTools.value
      .filter((tool) => categoryByPath.get(tool.path) === cat.key)
      .map((tool) => ({
        path: tool.path,
        name: tool.name,
        icon: tool.icon ?? 'document',
      })),
  })),
)

// Persisted per-category collapse state — survives reloads. Keyed
// by the stable category `key` (not the display name) so renaming
// a category or switching language never breaks saved state.
const collapsedCategories = useStorage<Record<string, boolean>>(
  'base-side:collapsed-categories',
  {},
)
const isCategoryCollapsed = (key: string) => collapsedCategories.value[key] ?? false
function toggleCategory(key: string) {
  collapsedCategories.value = {
    ...collapsedCategories.value,
    [key]: !isCategoryCollapsed(key),
  }
}

// Favorites — pinned to the top of the sidebar when the user has
// any. Resolved through the locale-aware tool list so each link
// shows the right translated name. Stale paths (tools removed
// from the catalog) are dropped at the composable layer.
const { favoriteTools } = useFavorites()

// Favorites group has its own persisted collapse state so the user
// can keep it pinned open / closed independently of the regular
// category groups.
const isFavoritesCollapsed = useStorage<boolean>(
  'base-side:collapsed-favorites',
  false,
)
</script>

<style lang="scss" scoped>
.base-side {
  --bs-sider-text:      var(--it-sider-text, #1e293b);
  --bs-sider-text-mute: var(--it-sider-text-mute, #64748b);
  --bs-sider-hover:     var(--it-sider-hover, rgba(0, 0, 0, 0.06));
  --bs-sider-border:    var(--it-sider-border, #e2e8f0);
  --bs-sider-grad-from: #1e3a8a;
  --bs-sider-grad-to:   #60a5fa;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 100%;
  background-color: var(--it-sider-bg, #ffffff);
  color: var(--bs-sider-text);
  font-size: 14px;
  overflow: hidden;
  transition: width 0.2s ease, background-color 0.25s ease, color 0.25s ease;
  flex-shrink: 0;
  border-right: 1px solid var(--bs-sider-border);

  &--collapsed { width: 64px; }
}

.base-side__brand {
  position: relative;
  padding: 20px 16px 18px;
  flex-shrink: 0;
}

.base-side__brand-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  line-height: 1;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  border-radius: 8px;
  transition: opacity 0.15s ease, transform 0.15s ease;

  &:hover { opacity: 0.85; }
  &:active { transform: scale(0.98); }
  &:focus-visible {
    outline: 2px solid var(--el-color-primary, #2563eb);
    outline-offset: 2px;
  }
}

.base-side__logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
  display: block;
}

.base-side__titles {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 32px;
  gap: 2px;
  min-width: 0;
  overflow: hidden;
}

.base-side__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.base-side__subtitle {
  font-size: 12px;
  color: var(--bs-sider-text-mute);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

// Teal→green ribbon under the logo (mirrors the reference site's swoosh).
.base-side__brand-curve {
  margin-top: 18px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--bs-sider-grad-from), var(--bs-sider-grad-to));
  position: relative;
  overflow: hidden;
}
.base-side__brand-curve::after {
  content: '';
  position: absolute;
  right: -10px;
  top: -2px;
  width: 30px;
  height: 10px;
  background: inherit;
  border-radius: 50%;
  opacity: 0.6;
  filter: blur(1px);
}

.base-side--collapsed .base-side__titles,
.base-side--collapsed .base-side__brand-curve,
.base-side--collapsed .base-side__subtitle {
  display: none;
}
.base-side--collapsed .base-side__brand { padding: 16px 16px 12px; }
.base-side--collapsed .base-side__brand-inner { justify-content: center; }

.base-side__body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0 12px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.16); }
}

.base-side__category { margin-top: 4px; }

// Heart icon prefix on the "我的收藏" group header. Uses the
// project accent (--it-favorite → teal primary in light mode,
// lighter teal in dark mode) so it matches the brand instead of
// Element Plus's default success green. The favorites group reads
// as "personal / pinned" via the heart glyph; the color just keeps
// it on-brand with the rest of the UI.
.base-side__favorites-icon {
  flex-shrink: 0;
  color: var(--it-favorite);
  margin-left: 2px;
}

.base-side__category-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px 18px 8px;
  background: transparent;
  border: 0;
  color: var(--bs-sider-text-mute);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s ease;
}
.base-side__category-header:hover { color: var(--bs-sider-text); }

.base-side__category-arrow {
  font-size: 14px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  &.is-collapsed { transform: rotate(-90deg); }
}

.base-side__category-name { letter-spacing: 0.02em; }

.base-side__tools {
  list-style: none;
  margin: 0;
  padding: 0;
}

.base-side__tool-item { position: relative; }

.base-side__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px 8px 20px;
  height: 36px;
  color: var(--bs-sider-text-mute);
  text-decoration: none;
  font-size: 13.5px;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background-color: var(--bs-sider-hover);
    color: var(--bs-sider-text);
  }

  // Left-edge indicator — gradient strip on the active item.
  &.is-active {
    color: var(--bs-sider-text);
    font-weight: 500;
    background-color: var(--bs-sider-hover);
  }
  &.is-active .base-side__toggle-bar {
    background: linear-gradient(180deg, var(--bs-sider-grad-from), var(--bs-sider-grad-to));
  }
}

.base-side__toggle-bar {
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  border-radius: 2px;
  background-color: var(--bs-sider-hover);
  transition: background 0.2s ease;
}

.base-side__tool-icon { font-size: 16px; flex-shrink: 0; }
.base-side__tool-name {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.base-side__footer { flex-shrink: 0; min-height: 16px; }

.base-side--collapsed .base-side__link { justify-content: center; padding: 8px 0; }
.base-side--collapsed .base-side__tool-name { display: none; }

.base-side-fade-enter-active,
.base-side-fade-leave-active { transition: opacity 0.18s ease; }
.base-side-fade-enter-from,
.base-side-fade-leave-to { opacity: 0; }
</style>