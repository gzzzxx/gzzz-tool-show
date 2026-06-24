<!--
  FollowBanner.vue — the "Follow us on GitHub" call-out card on the
  home page. Mirrors it-tools' ColoredCard.vue: a heart icon, 16/500
  title, and a 2-line description with inline GitHub / Gitee links.
  Background is the teal→green gradient, theme-agnostic.

  Uses vue-i18n's <i18n-t> component so the full sentence (including
  the separators `、` vs `/` and the trailing "感谢您的支持！" vs
  "— thanks for the support!") lives in JSON, not in the template.
  locales/index.ts filters the [intlify] "Not found parent scope"
  dev warning this component fires.
-->
<template>
  <a
    href="https://github.com/gzzzxx/gzzz-tool-show"
    target="_blank"
    rel="noopener"
    class="it-follow-banner follow-banner"
  >
    <div class="it-follow-banner__head follow-banner__head">
      <svg
        class="it-follow-banner__icon follow-banner__icon"
        :width="iconSize"
        :height="iconSize"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 21s-7-4.5-9.5-9.5C.8 7.5 3.5 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 6.2 3.5 4.5 7.5C19 16.5 12 21 12 21z" />
      </svg>
    </div>
    <h3 class="it-follow-banner__title follow-banner__title">
      {{ title }}
    </h3>
    <div class="it-follow-banner__desc follow-banner__desc">
      <i18n-t keypath="home.banner.desc" tag="span">
        <template #github>
          <a
            href="https://github.com/gzzzxx/gzzz-tool-show"
            target="_blank"
            rel="noopener"
          >GitHub</a>
        </template>
        <template #gitee>
          <a
            href="https://gitee.com/gzzzxx/gzzz-tool-show"
            target="_blank"
            rel="noopener"
          >Gitee</a>
        </template>
      </i18n-t>
    </div>
  </a>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'

withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: 'Follow us on GitHub',
  },
)

const iconSize = 28
</script>

<style lang="scss" scoped>
// No local styling beyond the structural reset. All visual styling
// lives in the global .it-follow-banner class.
.follow-banner {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
}

.follow-banner__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.follow-banner__icon {
  // `flex-shrink: 0` so the SVG never collapses inside the flex column
  // when the card is height-stretched to match its row siblings.
  flex-shrink: 0;
  display: block;
}
</style>
