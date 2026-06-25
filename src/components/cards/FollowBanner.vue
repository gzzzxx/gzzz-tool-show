<!--
  FollowBanner.vue — the "关注我们" / "Follow us on GitHub" call-out
  card on the home page. Mirrors it-tools' ColoredCard.vue: a 5-point
  filled star icon (reads as the GitHub "star / watch" affordance,
  pairs naturally with the inline GitHub / Gitee links below), a
  16/500 title, and a 2-line description with inline GitHub / Gitee
  links. Background is the teal→green gradient, theme-agnostic.

  Both the title and description are locale-driven (vue-i18n), so
  flipping the language switcher in the header updates this banner
  in lockstep with the rest of the page. The `title` prop is still
  accepted as an explicit override for one-off usages.

  Uses vue-i18n's <i18n-t> component so the full description sentence
  (including the separators `、` vs `/` and the trailing "感谢您的支持！"
  vs "— thanks for the support!") lives in JSON, not in the template.
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
        <component :is="starIcon" />
      </svg>
    </div>
    <h3 class="it-follow-banner__title follow-banner__title">
      {{ titleText }}
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getUiIcon } from './toolIconRegistry'

// Title is locale-driven. The `title` prop is still accepted so a
// caller can override the default copy (e.g. for a one-off banner),
// but when omitted it falls through to the active language's
// `home.banner.title` — which flips automatically with the language
// switcher in the header.
const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: '',
  },
)

const { t } = useI18n({ useScope: 'global' })
const titleText = computed(() => props.title || t('home.banner.title'))

const iconSize = 28

// Icon comes from the shared UI registry (see toolIconRegistry.ts)
// so the choice lives in one place — change the icon here, every
// FollowBanner instance updates.
const starIcon = getUiIcon('star')
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
