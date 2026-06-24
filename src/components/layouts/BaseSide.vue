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
        aria-label="返回首页"
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
      <div
        v-for="category in categories"
        :key="category.name"
        class="base-side__category"
      >
        <button
          type="button"
          class="base-side__category-header"
          :aria-expanded="!isCategoryCollapsed(category.name)"
          @click="toggleCategory(category.name)"
        >
          <el-icon
            :class="[
              'base-side__category-arrow',
              { 'is-collapsed': isCategoryCollapsed(category.name) },
            ]"
          >
            <ArrowDown />
          </el-icon>
          <span class="base-side__category-name">{{ category.name }}</span>
        </button>

        <transition name="base-side-fade">
          <ul
            v-show="!isCategoryCollapsed(category.name)"
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
                <el-icon class="base-side__tool-icon">
                  <component :is="icons[tool.icon] ?? Document" />
                </el-icon>
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
import { useStorage } from '@vueuse/core'
import {
  ArrowDown,
  Brush,
  Calendar,
  Coin,
  Document,
  Lock,
  Timer,
  View,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

withDefaults(
  defineProps<{ isCollapsed?: boolean }>(),
  { isCollapsed: false },
)

const emit = defineEmits<{
  (e: 'update:isCollapsed', value: boolean): void
  (e: 'navigate', path: string): void
}>()

// Hard-coded menu — paths match src/router/index.ts.
const categories = [
  {
    name: '加密',
    tools: [
      { path: '/encryption/SM4', name: 'SM4 加密/解密', icon: 'Lock' },
      { path: '/encryption/AES', name: 'AES 加密/解密', icon: 'Lock' },
    ],
  },
  {
    name: '转换',
    tools: [
      { path: '/base64', name: 'Base64 转换', icon: 'Coin' },
      { path: '/timestamp', name: '时间戳转换', icon: 'Timer' },
      { path: '/color', name: '颜色转换', icon: 'Brush' },
    ],
  },
  {
    name: '开发',
    tools: [
      { path: '/format', name: 'JSON 格式化', icon: 'Document' },
      { path: '/contrast', name: '代码对比', icon: 'View' },
    ],
  },
  {
    name: '时间',
    tools: [{ path: '/calendar', name: '日历', icon: 'Calendar' }],
  },
]

const icons: Record<string, Component> = {
  Lock, Coin, Timer, Brush, Document, View, Calendar,
}

// Persisted per-category collapse state — survives reloads.
const collapsedCategories = useStorage<Record<string, boolean>>(
  'base-side:collapsed-categories',
  {},
)
const isCategoryCollapsed = (name: string) => collapsedCategories.value[name] ?? false
function toggleCategory(name: string) {
  collapsedCategories.value = {
    ...collapsedCategories.value,
    [name]: !isCategoryCollapsed(name),
  }
}
</script>

<style lang="scss" scoped>
.base-side {
  --bs-sider-text:      var(--it-sider-text, #1e293b);
  --bs-sider-text-mute: var(--it-sider-text-mute, #64748b);
  --bs-sider-hover:     var(--it-sider-hover, rgba(0, 0, 0, 0.06));
  --bs-sider-border:    var(--it-sider-border, #e2e8f0);
  --bs-sider-grad-from: #0369a1;
  --bs-sider-grad-to:   #38bdf8;

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
    outline: 2px solid var(--el-color-primary, #0284c7);
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