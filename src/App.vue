<!--
  src/App.vue — root layout shell.
  Owns responsive breakpoint, PC sidebar collapse, mobile drawer, and the
  view-transition theme toggle. BaseHeader / BaseSide are dumb render-only.
-->
<template>
  <el-config-provider namespace="ep" :locale="elLocale">
    <div :class="['app-root', { 'is-mobile': isMobile }]">
      <aside
        v-if="!isMobile"
        :class="['app-root__sider', { 'is-collapsed': isSiderCollapsed }]"
      >
        <BaseSide
          :is-collapsed="isSiderCollapsed"
          @update:is-collapsed="isSiderCollapsed = $event"
          @navigate="onNavigate"
        />
      </aside>

      <div class="app-root__main">
        <BaseHeader
          :is-sider-collapsed="isSiderCollapsed"
          @toggle-sider="isSiderCollapsed = !isSiderCollapsed"
          @toggle-theme="onToggleTheme"
        />

        <main class="app-root__content">
          <router-view :key="$router.currentRoute.value.fullPath" />
        </main>
      </div>

      <el-drawer
        v-if="isMobile"
        v-model="drawerVisible"
        direction="ltr"
        :with-header="false"
        size="240px"
      >
        <BaseSide :is-collapsed="false" @navigate="onNavigate" />
      </el-drawer>
    </div>
  </el-config-provider>
</template>

<script lang="ts">
import { computed, ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

export default {
  setup () {
    // Element Plus' built-in locale dictionary — picked per active
    // language so el-pagination / el-table / etc. flip with our toggle.
    const { locale } = useI18n({ useScope: 'global' })
    const elLocale = computed(() => (locale.value === 'en-US' ? en : zhCn))
    const router = useRouter()

    // lg-1 boundary per it-tools design spec.
    const isMobile = useMediaQuery('(max-width: 1023.98px)')

    const isSiderCollapsed = ref(false)
    const drawerVisible = ref(false)

    function onNavigate(path: string) {
      // Close the drawer before the route push so the page transition isn't
      // blocked by the still-rendering drawer overlay.
      drawerVisible.value = false
      if (path && path !== router.currentRoute.value.path) {
        router.push(path)
      }
    }

    // ----------------------------------------------------------------
    // Theme toggle — reads/writes localStorage 'theme' and animates via
    // the View Transitions API. The non-dark class is only ever added
    // when explicitly switched to light, otherwise we stay on dark
    // (which is the original behavior preserved from the legacy header).
    // ----------------------------------------------------------------
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      const next = localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(next)
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    }

    function onToggleTheme(payload: { clientX: number; clientY: number }) {
      const { clientX: x, clientY: y } = payload
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )

      const isDark = document.documentElement.classList.contains('dark')
      localStorage.setItem('theme', isDark ? 'light' : 'dark')

      const transition = (document as any).startViewTransition?.(() => {
        const root = document.documentElement
        root.classList.remove(isDark ? 'dark' : 'light')
        root.classList.add(isDark ? 'light' : 'dark')
      })

      if (!transition) return // browser doesn't support view transitions

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ]
        document.documentElement.animate(
          { clipPath: isDark ? [...clipPath].reverse() : clipPath },
          {
            duration: 500,
            easing: 'ease-in',
            pseudoElement: isDark
              ? '::view-transition-old(root)'
              : '::view-transition-new(root)',
          },
        )
      })
    }

    return {
      elLocale,
      isMobile,
      isSiderCollapsed,
      drawerVisible,
      onNavigate,
      onToggleTheme,
    }
  },
}
</script>

<style lang="scss">
.app-root {
  display: flex;
  min-height: 100vh;
  background: var(--it-bg, #f1f5f9);
  color: var(--it-text-primary, #1e293b);
}

.app-root__sider {
  width: 240px;
  flex-shrink: 0;
  transition: width 0.2s ease;
  overflow: hidden;
  position: sticky;
  top: 0;
  height: 100vh;

  &.is-collapsed { width: 64px; }
}

.app-root__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-root__content {
  flex: 1;
  min-height: 0;
}

.app-root.is-mobile {
  flex-direction: column;

  .app-root__main { width: 100%; }
}

// View-transition animation hooks.
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

.dark::view-transition-old(root) { z-index: 1; }
.dark::view-transition-new(root) { z-index: 999; }

::view-transition-old(root) { z-index: 999; }
::view-transition-new(root) { z-index: 1; }
</style>