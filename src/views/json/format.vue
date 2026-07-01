<!--
  format.vue — JSON pretty-printer / live display.

  Layout: same card-based two-column pattern as xml.vue / sql.vue,
  with one tweak — no center arrow badge, no top toolbar, no card
  header actions. Both editors fill the full horizontal width as
  1fr 1fr (the arrow would steal ~40px from each side, and the
  user wants maximum editor area).

  Hybrid editor pair — left is a plain el-input textarea
  (matches the SQL formatter's input style for muscle memory
  + smaller bundle, since vanilla-jsoneditor is 1MB+), right
  is a full vanilla-jsoneditor in readonly mode with the menu,
  navigation, and status bars visible. Both bind the same `text`
  ref via v-model, so editing the left instantly reflects on the
  right — no Format button needed.

  vanilla-jsoneditor ships its own dark theme via the
  .jse-theme-dark root class; the light theme is the default (no
  extra class needed). We toggle the dark class via useIsDark so
  the editor follows the app's theme toggle.
-->
<template>
  <div class="json-page">
    <h2 class="json-title">{{ t('tools.format.name') }}</h2>
    <div class="json-subtitle">{{ t('tools.format.desc') }}</div>

    <div class="json-grid">
      <section class="json-card">
        <header class="json-card__header">
          <span class="json-card__title">{{ t('formatPage.section.source') }}</span>
        </header>
        <el-input
          v-model="text"
          type="textarea"
          :rows="14"
          resize="none"
          spellcheck="false"
          :placeholder="t('formatPage.input.placeholder')"
          class="json-textarea"
        />
      </section>

      <section class="json-card">
        <header class="json-card__header">
          <span class="json-card__title">{{ t('formatPage.section.result') }}</span>
        </header>
        <div class="json-card__body">
          <JsonEditorVue
            id="json-editor-result"
            :class="editorClass"
            mode="text"
            v-model="text"
            :mainMenuBar="true"
            :navigationBar="true"
            :statusBar="true"
            :readOnly="true"
            :askToFormat="false"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import JsonEditorVue from 'json-editor-vue'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import { useI18n } from 'vue-i18n'
import { useIsDark } from '~/composables/useIsDark'

const text = ref('')
const { t } = useI18n({ useScope: 'global' })
const isDark = useIsDark()

const editorClass = computed(() =>
  isDark.value ? 'my-json-editor jse-theme-dark' : 'my-json-editor',
)
</script>

<style lang="scss" scoped>
/* Outer wrapper — same shape as xml.vue / sql.vue: wide (1600px)
   for a horizontal two-pane tool, viewport-fixed so the page
   never triggers a page-level scrollbar (height = 100vh -
   header (56) - page margins (16+16), with overflow:hidden to
   clip inner overflow). */
.json-page {
  max-width: 1600px;
  height: calc(100vh - 88px);
  margin: 16px auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--ep-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.json-title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
}
.json-subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 20px;
  font-size: 1rem;
}

/* Two equal-width cards, no arrow. flex:1 + min-height:0 so the
   cards eat the leftover vertical space; align-items stretch
   is the default — cards inherit the row's height. */
.json-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}
@media (max-width: 900px) {
  .json-grid {
    grid-template-columns: 1fr;
  }
}

.json-card {
  display: flex;
  flex-direction: column;
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  overflow: hidden;
}

.json-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--it-border);
  background-color: var(--it-bg-elevated);
}
.json-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--it-text-primary);
}

/* Left card: fill the card body with the el-input textarea. Same
   pierce-through pattern as sql.vue / xml.vue — el-input wraps
   the textarea in .el-textarea with inline height; we force
   flex:1 + min-height:0 down the chain so it actually grows.
   min-height:0 on the inner textarea so flex shrinking works
   (browsers default to min-height:auto, which prevents
   shrinking below content size). */
.json-textarea,
.json-textarea :deep(.el-textarea) {
  display: flex;
  flex: 1;
  min-height: 0;
}
.json-textarea :deep(textarea) {
  flex: 1;
  min-height: 0;
  border: none !important;
  border-radius: 0;
  padding: 14px 16px;
  font-family: 'Fira Code', 'Cascadia Code', Consolas, Menlo, monospace;
  font-size: 13px;
  line-height: 1.55;
  resize: none;
  background: transparent;
  color: var(--it-text-primary);
}
.json-textarea :deep(textarea):focus {
  box-shadow: none;
}
.json-textarea :deep(.el-textarea__inner) {
  box-shadow: none !important;
}

/* Right card: force the json-editor-vue wrapper to fill the
   card body. vanilla-jsoneditor renders into a div with class
   .jse-main; the outer wrapper needs an explicit height or
   the editor renders at 0px tall. */
.json-card__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.json-card__body :deep(.my-json-editor) {
  height: 100%;
}

/* Dark-theme color tweak — preserved from the original
   home-page.scss. Sets the vanilla-jsoneditor theme background
   to #222 in dark mode (default is slightly lighter). */
:deep(.jse-theme-dark) {
  --jse-theme-color: #222;
}

@media (max-width: 600px) {
  .json-page { padding: 8px 2px; }
  .json-title { font-size: 1.5rem; }
  .json-card__header { padding: 6px 12px; }
}
</style>