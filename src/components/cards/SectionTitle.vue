<!--
  SectionTitle.vue — the small "Crypto" / "Converter" / etc. heading
  that sits above a row of tool cards. Visual style is owned by the
  global .it-section-title class in src/styles/_cards.scss; this file
  is mostly a thin wrapper so the home page can render headings with
  consistent semantics and an optional right-aligned slot for icons.
-->
<template>
  <div class="section-title-row">
    <h3 class="it-section-title section-title">{{ title }}</h3>
    <div v-if="$slots.default" class="section-title__extra">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<style lang="scss" scoped>
@use "~/styles/variables" as *;

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-title {
  // The shared class already sets margin-top: $it-section-gap; keep
  // flex-shrink: 0 so long titles don't squeeze the optional slot.
  flex: 1 1 auto;
}

.section-title__extra {
  flex: 0 0 auto;
  color: var(--it-text-tertiary);
  font-size: 13px;
}
</style>
