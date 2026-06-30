<!--
  src/views/not-found/not-found.vue — 404 page.

  Triggered by the catch-all route in src/router/index.ts
  (/:pathMatch(.*)*), so every unknown URL lands here cleanly. Also the
  fallback when static hosts (Gitee Pages, etc.) serve 404.html that
  mirrors index.html — SPA boots, router doesn't find the path, ends up
  here.

  Style intentionally mirrors the rest of the app: a centered card on
  --it-bg-elevated with the same 8px radius and 1px border treatment as
  the tool cards. The "404" itself uses the brand gradient (same
  --gradient-follow triple-stop we use on the Follow banner) so the page
  feels like it belongs, not bolted on.
-->
<template>
  <div class="it-page-content not-found-page">
    <div class="not-found-card">
      <div class="not-found-card__code">404</div>
      <h1 class="not-found-card__title">{{ t('notFound.title') }}</h1>
      <p class="not-found-card__desc">{{ t('notFound.desc') }}</p>

      <el-button
        type="primary"
        size="large"
        class="not-found-card__home"
        @click="goHome"
      >
        {{ t('notFound.home') }}
      </el-button>

      <div class="not-found-card__quick">
        <span class="not-found-card__quick-label">
          {{ t('notFound.quickLabel') }}
        </span>
        <div class="not-found-card__quick-list">
          <router-link
            v-for="tool in quickTools"
            :key="tool.path"
            :to="tool.path"
            class="not-found-card__quick-link"
          >
            {{ tool.name }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useLocalizedTools, type Tool } from '~/composables/useTools'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

// Show three most-used tools as a "you might want…" escape hatch.
// Hash / JSON / Base64 are the ones users come here for most often.
const { localizedTools } = useLocalizedTools()
const quickTools: Tool[] = [
  localizedTools.value.find((x) => x.path === '/hash')!,
  localizedTools.value.find((x) => x.path === '/format')!,
  localizedTools.value.find((x) => x.path === '/base64')!,
]

function goHome () {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.not-found-page {
  // Push the card down a bit so it doesn't sit glued to the header.
  padding-top: 48px;
  padding-bottom: 64px;
  display: flex;
  justify-content: center;
}

.not-found-card {
  // Same shape as .it-tool-card: 8px radius, white surface, subtle border.
  // We don't reuse .it-tool-card directly because the inner layout is
  // different (no horizontal head row, no heart button), and forcing it
  // would mean fighting the 150px fixed height.
  width: 100%;
  max-width: 560px;
  padding: 48px 40px 40px;
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgb(15 23 42 / 0.05);
  text-align: center;

  &__code {
    // Reuse the brand gradient triple-stop so "404" reads as the same
    // family as the Follow banner — a single accent moment, not a
    // competing visual.
    font-size: 96px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    background: var(--gradient-follow);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    // Tight negative margin so the giant "404" doesn't blow out the
    // vertical rhythm between itself and the title underneath.
    margin: 0 0 16px;
  }

  &__title {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 600;
    color: var(--it-text-primary);
    letter-spacing: 0.01em;
  }

  &__desc {
    margin: 0 0 28px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--it-text-secondary);
  }

  &__home {
    // Slightly wider than the el-button default so the CTA reads as
    // the obvious next step, not just one button among many.
    min-width: 160px;
  }

  &__quick {
    // Hairline separator above the "or try one of these" row — uses the
    // same border color as the card so the divider never goes "grey
    // on grey" in dark mode.
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid var(--it-border);
  }

  &__quick-label {
    display: block;
    font-size: 12px;
    color: var(--it-text-tertiary);
    margin-bottom: 12px;
    letter-spacing: 0.04em;
  }

  &__quick-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 12px;
  }

  &__quick-link {
    // Inline chip — keeps the secondary CTA group from competing with
    // the primary button. Inherits brand color from the global <a>
    // style, plus a subtle hover bg so they read as clickable.
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--brand-primary);
    text-decoration: none;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background-color: var(--brand-primary-soft);
      color: var(--brand-primary-strong);
    }
  }
}

// Dark mode — already mostly handled by the CSS variables above, but
// the card-shadow default in _variables.scss is light-themed, so we
// push it darker on .dark so the card still reads "lifted".
:global(html.dark) .not-found-card {
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.6);
}

// Mobile — collapse padding so the card doesn't dominate a narrow
// viewport; the 96px "404" stays the same because it's still the hero.
@media (max-width: 640px) {
  .not-found-page {
    padding-top: 24px;
    padding-bottom: 40px;
  }
  .not-found-card {
    padding: 32px 24px 28px;

    &__code { font-size: 80px; }
    &__title { font-size: 20px; }
  }
}
</style>