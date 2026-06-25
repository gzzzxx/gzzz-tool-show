<!--
  src/components/layouts/BaseHeader.vue — horizontal top bar.
  Layout: [≡ toggle-sider] [🏠 home] [🔍 search] [...spacer...] [lang] [github] [x] [info] [theme] [sponsor]
  Emits:
    - toggle-sider: parent flips its isSiderCollapsed ref → sidebar 240↔64
    - toggle-theme: parent runs the dark/light view-transition animation
-->
<template>
  <header class="app-header">
    <div class="app-header__left">
      <el-tooltip :content="toggleSiderTooltip" placement="bottom">
        <button
          type="button"
          class="app-header__icon-btn"
          :aria-label="toggleSiderTooltip"
          @click="emit('toggle-sider')"
        >
          <el-icon :size="20">
            <component :is="isSiderCollapsed ? Expand : Fold" />
          </el-icon>
        </button>
      </el-tooltip>

      <el-tooltip :content="t('header.home.tooltip')" placement="bottom">
        <button
          type="button"
          class="app-header__icon-btn"
          :aria-label="t('header.home.tooltip')"
          @click="router.push('/')"
        >
          <el-icon :size="20"><HomeFilled /></el-icon>
        </button>
      </el-tooltip>
    </div>

    <div class="app-header__center">
      <div
        ref="searchWrapRef"
        class="app-header__search"
      >
        <div class="app-header__search-bar">
          <el-icon class="app-header__search-icon" :size="16"><Search /></el-icon>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="app-header__search-input"
            :placeholder="t('header.search.placeholder')"
            @focus="paletteOpen = true"
            @keydown="onSearchKeydown"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="app-header__search-clear"
            :aria-label="t('header.search.clearAria')"
            @mousedown.prevent="onClearSearch"
          >
            <el-icon :size="14"><CircleClose /></el-icon>
          </button>
          <span v-else class="app-header__kbd">{{ isMac ? '⌘ K' : 'Ctrl K' }}</span>
        </div>
        <SearchPalette
          ref="paletteRef"
          v-model:query="searchQuery"
          v-model:open="paletteOpen"
          @select="onToolSelected"
        />
      </div>
    </div>

    <div class="app-header__right">
      <el-tooltip :content="t('header.lang.tooltip')" placement="bottom">
        <el-dropdown
          trigger="click"
          @command="onLangPick"
        >
          <button
            type="button"
            class="app-header__icon-btn app-header__lang-btn"
            :aria-label="t('header.lang.tooltip')"
          >
            <span class="app-header__lang-text">{{ currentLangLabel }}</span>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="opt in langOptions"
                :key="opt.value"
                :command="opt.value"
                :disabled="opt.value === locale"
              >
                <span class="app-header__lang-item">
                  <span class="app-header__lang-item-label">{{ opt.label }}</span>
                  <el-icon
                    v-if="opt.value === locale"
                    :size="14"
                    class="app-header__lang-item-check"
                  >
                    <Check />
                  </el-icon>
                </span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-tooltip>

      <el-tooltip content="GitHub" placement="bottom">
        <a
          class="app-header__icon-btn app-header__icon-btn--hide-mobile"
          href="https://github.com/gzzzxx/gzzz-tool-show"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <el-icon :size="18">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.02c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.77 1.05.77 2.12v3.14c0 .31.21.67.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
            </svg>
          </el-icon>
        </a>
      </el-tooltip>

      <el-tooltip :content="t('header.about.tooltip')" placement="bottom">
        <button
          type="button"
          class="app-header__icon-btn app-header__icon-btn--hide-mobile"
          :aria-label="t('header.about.tooltip')"
          @click="router.push('/about')"
        >
          <el-icon :size="18"><InfoFilled /></el-icon>
        </button>
      </el-tooltip>

      <el-tooltip :content="themeTooltip" placement="bottom">
        <button
          type="button"
          class="app-header__icon-btn"
          :aria-label="themeTooltip"
          @click="onThemeClick"
        >
          <el-icon :size="18">
            <component :is="isDark ? Sunny : Moon" />
          </el-icon>
        </button>
      </el-tooltip>

      <button
        class="app-header__sponsor-btn"
        type="button"
        :aria-label="t('common.sponsor')"
        @click="goGithub"
      >
        <span class="app-header__sponsor-text">{{ t('common.sponsor') }}</span>
        <span class="app-header__sponsor-gift" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <component :is="sponsorGift" />
          </svg>
        </span>
      </button>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  Check,
  CircleClose,
  Expand,
  Fold,
  HomeFilled,
  InfoFilled,
  Moon,
  Search,
  Sunny,
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import SearchPalette from './SearchPalette.vue'
import { type Tool } from '~/composables/useTools'
import type { AppLocale } from '~/locales'
import { getUiIcon } from '~/components/cards/toolIconRegistry'

const props = defineProps<{ isSiderCollapsed?: boolean }>()

const emit = defineEmits<{
  (e: 'toggle-sider'): void
  (e: 'toggle-theme', payload: { clientX: number; clientY: number }): void
}>()

const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

// ----------------------------------------------------------------
// Locale (language switch). `useI18n({ useScope: 'global' })` gives
// us the top-level locale ref — the same one App.vue and the locale
// bootstrap watch for persistence. Setting it here flips the whole
// app's UI in one go.
// ----------------------------------------------------------------

// Menu labels are intentionally fixed at "中文 / English" so the
// dropdown is language-agnostic — the switcher itself doesn't
// translate.
const langOptions: { value: AppLocale; label: string }[] = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
]
// "current language's own name" — driven by i18n so the trigger
// reads "中文" in zh-CN mode, "English" in en-US mode.
const currentLangLabel = computed(() => t(`lang.${locale.value}`))
function onLangPick(value: AppLocale) {
  locale.value = value
}

// Per-tooltip computeds: same string is used as both `content` and
// `aria-label` (screen readers don't need the icon to announce what
// the button does, but the aria-label and visible tooltip should
// stay in sync). The about button only uses one t() key, so it
// doesn't need a computed wrapper.
const toggleSiderTooltip = computed(() =>
  props.isSiderCollapsed
    ? t('header.search.toggleSider.expand')
    : t('header.search.toggleSider.collapse'),
)

// ----------------------------------------------------------------
// Search box
// The input is bound to `searchQuery`; the dropdown is shown by
// `paletteOpen`. Keyboard navigation (↑↓ Enter Esc) is handled
// inside SearchPalette.handleKeydown — we just forward the event
// from the input here so the palette doesn't have to reach for it.
// ----------------------------------------------------------------
const searchWrapRef = ref<HTMLDivElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const paletteRef = ref<InstanceType<typeof SearchPalette> | null>(null)
const searchQuery = ref('')
const paletteOpen = ref(false)
const isMac = ref(false)

function isHotkey(e: KeyboardEvent) {
  return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
}

const onKeydown = (e: KeyboardEvent) => {
  if (isHotkey(e)) {
    e.preventDefault()
    paletteOpen.value = true
    searchInputRef.value?.focus()
  }
}

// Forward raw keydown to the palette so it can manage its own
// active-row + Enter / Esc behavior. The palette's v-model:open
// flip on Esc will close the dropdown automatically.
function onSearchKeydown(e: KeyboardEvent) {
  paletteRef.value?.handleKeydown(e)
}

function onClearSearch() {
  searchQuery.value = ''
  searchInputRef.value?.focus()
}

function onToolSelected(tool: Tool) {
  // Selection ends the search session: clear the query, close the
  // dropdown, release focus from the input, then navigate. The
  // mousedown.prevent on the list row would otherwise leave the
  // input focused on the new page with stale text inside.
  searchQuery.value = ''
  paletteOpen.value = false
  searchInputRef.value?.blur()
  router.push(tool.path)
}

// Click-outside: close the dropdown when the user clicks anywhere
// outside the search wrapper. mousedown (not click) so a selection
// that fires immediately doesn't race with the input blur.
const onDocumentMouseDown = (e: MouseEvent) => {
  const target = e.target as Node | null
  if (!target) return
  if (searchWrapRef.value && !searchWrapRef.value.contains(target)) {
    paletteOpen.value = false
  }
}

// Theme toggle — read state for the icon; the actual flip + animation
// lives in App.vue so the View Transitions API runs at the document root.
const isDark = ref(false)
const syncThemeFromDom = () => {
  isDark.value = document.documentElement.classList.contains('dark')
}
const themeTooltip = computed(() =>
  isDark.value ? t('common.theme.light') : t('common.theme.dark'),
)
const onThemeClick = (event: MouseEvent) => {
  syncThemeFromDom()
  emit('toggle-theme', { clientX: event.clientX, clientY: event.clientY })
}

// Sponsor button — opens the project GitHub repo in a new tab.
const GITHUB_REPO_URL = 'https://github.com/gzzzxx/gzzz-tool-show'
function goGithub() {
  window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer')
}

// "Sponsor / 打赏" icon — gift box (see toolIconRegistry.ts).
// Resolved once at setup, not per-render.
const sponsorGift = getUiIcon('gift')

let themeObserver: MutationObserver | null = null

onMounted(() => {
  isMac.value = /Mac|iPhone|iPad/i.test(navigator.platform)
  syncThemeFromDom()

  window.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onDocumentMouseDown)
  themeObserver = new MutationObserver(syncThemeFromDom)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onDocumentMouseDown)
  themeObserver?.disconnect()
})
</script>

<style lang="scss" scoped>
.app-header {
  --ah-h:        56px;
  --ah-pad-x:    20px;
  --ah-text:     var(--it-text-primary, #1e293b);
  --ah-mute:     var(--it-text-secondary, #64748b);
  --ah-hover:    rgba(0, 0, 0, 0.06);

  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--ah-h);
  padding: 0 var(--ah-pad-x);
  background: transparent;
  color: var(--ah-text);
  z-index: 100;
}

:global(html.dark) .app-header { color: var(--it-text-primary, #f1f5f9); }
:global(html.dark) .app-header__icon-btn:hover { background: rgba(255, 255, 255, 0.08); }
:global(html.dark) .app-header__search-bar { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.08); }
:global(html.dark) .app-header__search-bar:focus-within { background: rgba(255, 255, 255, 0.06); }
:global(html.dark) .app-header__kbd { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6); }
:global(html.dark) .app-header__lang-text { color: var(--it-text-secondary, #cbd5e1); }

.app-header__left,
.app-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.app-header__center {
  // Center the search box at the visual midline of the header.
  // Pulling the wrapper out of the flex flow lets the right group grow
  // leftward (sponsor button widening) without ever touching the
  // search box. pointer-events:none lets clicks fall through to the
  // icon buttons underneath; the search box itself re-enables them.
  position: absolute;
  left: 45%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.app-header__search {
  // Anchoring context for the floating SearchPalette dropdown.
  // pointer-events: auto re-enables clicks inside the
  // pointer-events: none .app-header__center wrapper above.
  position: relative;
  width: 100%;
  max-width: 480px;
  pointer-events: auto;
}

@media (max-width: 1023.98px) {
  // Below 1024px the right group + widening button would overlap the
  // centered search box. Drop back into the flex flow so the layout
  // can reflow safely on tighter viewports.
  .app-header__center {
    position: static;
    transform: none;
    width: auto;
    max-width: none;
    flex: 0 1 auto;
    pointer-events: auto;
  }
}

.app-header__right { margin-left: auto; }

.app-header__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--ah-hover);
    color: var(--el-color-primary, #409eff);
  }
  &:focus-visible {
    outline: 2px solid var(--el-color-primary, #409eff);
    outline-offset: 1px;
  }
}

.app-header__lang-text { font-size: 13px; font-weight: 500; color: var(--ah-mute); }

// Dropdown item — keep the check mark on the right of the label so the
// active option is obvious in either direction.
.app-header__lang-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
}
.app-header__lang-item-check { color: var(--el-color-primary, #409eff); }

// Strip the el-dropdown's caret icon — our button uses the language
// label as the only affordance, an extra caret looks noisy.
.app-header__lang-btn.el-tooltip__trigger > :deep(.el-dropdown__caret-button),
.app-header__lang-btn :deep(.el-dropdown__caret) { display: none; }

.app-header__search {
  // Anchoring context for the floating SearchPalette dropdown.
  // pointer-events: auto re-enables clicks inside the
  // pointer-events: none .app-header__center wrapper above.
  position: relative;
  width: 100%;
  max-width: 480px;
  pointer-events: auto;
}

.app-header__search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 10px 0 12px;
  background: transparent;
  border: 1px solid var(--it-border, #e2e8f0);
  border-radius: 8px;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:focus-within {
    border-color: var(--el-color-primary, #409eff);
    background: rgba(0, 0, 0, 0.02);
  }
}

.app-header__search-icon { color: var(--ah-mute); flex-shrink: 0; }

.app-header__search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  border-radius: 50%;
  color: var(--ah-mute);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.12);
    color: var(--it-text-primary, #1e293b);
  }
}

:global(html.dark) .app-header__search-clear {
  background: rgba(255, 255, 255, 0.1);
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
}

.app-header__search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  background: transparent;
  border: none;
  outline: none;
  color: inherit;
  font-size: 14px;
  font-family: inherit;

  &::placeholder { color: var(--ah-mute); }
}

.app-header__kbd {
  flex-shrink: 0;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.06);
  color: var(--ah-mute);
  border-radius: 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.02em;
}

.app-header__sponsor-btn {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  background: linear-gradient(135deg, #0284c7, #7dd3fc);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition: filter 0.15s ease;

  &:hover,
  &:focus-visible {
    filter: brightness(1.1);
    outline: none;

    .app-header__sponsor-gift {
      width: 16px;
      opacity: 1;
      margin-left: 6px;

      svg { transform: scale(1); }
    }
  }
}

.app-header__sponsor-text {
  display: inline-block;
  line-height: 1;
}

.app-header__sponsor-gift {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 0;
  min-width: 0;
  max-width: 16px;
  opacity: 0;
  margin-left: 0;
  overflow: hidden;
  color: #fff;
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s ease,
    margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  svg {
    display: block;
    transform: scale(0.5);
    transform-origin: center;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

@media (max-width: 767.98px) {
  .app-header { padding: 0 12px; gap: 4px; }
  .app-header__search,
  .app-header__icon-btn--hide-mobile {
    display: none;
  }
}
</style>