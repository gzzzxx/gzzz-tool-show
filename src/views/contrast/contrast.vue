<!--
  contrast.vue — code/text diff viewer.

  Same card-based layout family as sql.vue / xml.vue / json.vue:
    .contrast-page  → max-width centered shell, soft shadow
    .contrast-toolbar → page-level settings (language / mode / folding)
    .contrast-grid  → 1fr 1fr (collapses to 1fr ≤900px) for the two
                       input cards — "Original" + "Modified"
    .contrast-result → full-width card holding the vue-diff output

  Two-card pattern is the same as the formatters: each card owns its
  header (title + Clear button), the textarea fills the card via
  flex:1 (el-input's auto-height is overridden through :deep()), and
  the result card sits below as a separate block so the diff itself
  can render at its natural height without squeezing the inputs.

  Theme sync stays identical to the original — vue-diff applies
  `vue-diff-theme-{dark|light}` + `vue-diff-mode-{mode}` on its
  outer wrapper, but the theme prop alone doesn't always repaint
  after the user toggles dark mode later in the session, so we
  re-write the wrapper className on every (isDark, mode) change.
-->
<template>
  <div class="contrast-page">
    <h2 class="contrast-title">{{ t('tools.contrast.name') }}</h2>
    <div class="contrast-subtitle">{{ t('tools.contrast.desc') }}</div>

    <div class="contrast-toolbar">
      <div class="contrast-toolbar__group">
        <label class="contrast-toolbar__label">
          {{ t('contrastPage.options.type') }}
        </label>
        <el-select v-model="form.type" size="small" class="contrast-toolbar__select">
          <el-option
            v-for="o in languageOptions"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
      </div>

      <div class="contrast-toolbar__group">
        <label class="contrast-toolbar__label">
          {{ t('contrastPage.options.mode') }}
        </label>
        <el-radio-group v-model="form.mode" size="small">
          <el-radio-button value="split">
            {{ t('contrastPage.options.modeSplit') }}
          </el-radio-button>
          <el-radio-button value="unified">
            {{ t('contrastPage.options.modeUnified') }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <el-tooltip
        :content="t('contrastPage.options.foldingHint')"
        placement="top"
      >
        <div class="contrast-toolbar__group contrast-toolbar__group--switch">
          <el-switch v-model="form.folding" />
          <span class="contrast-toolbar__hint">
            {{ t('contrastPage.options.folding') }}
          </span>
        </div>
      </el-tooltip>
    </div>

    <div class="contrast-grid">
      <section class="contrast-card">
        <header class="contrast-card__header">
          <span class="contrast-card__title">
            {{ t('contrastPage.section.prev') }}
          </span>
          <div class="contrast-card__actions">
            <el-button size="small" :icon="Delete" link @click="form.prev = ''">
              {{ t('contrastPage.action.clear') }}
            </el-button>
          </div>
        </header>
        <el-input
          v-model="form.prev"
          type="textarea"
          :rows="10"
          resize="none"
          spellcheck="false"
          :placeholder="t('contrastPage.input.placeholder.prev')"
          class="contrast-textarea"
        />
      </section>

      <section class="contrast-card">
        <header class="contrast-card__header">
          <span class="contrast-card__title">
            {{ t('contrastPage.section.current') }}
          </span>
          <div class="contrast-card__actions">
            <el-button size="small" :icon="Delete" link @click="form.current = ''">
              {{ t('contrastPage.action.clear') }}
            </el-button>
          </div>
        </header>
        <el-input
          v-model="form.current"
          type="textarea"
          :rows="10"
          resize="none"
          spellcheck="false"
          :placeholder="t('contrastPage.input.placeholder.current')"
          class="contrast-textarea"
        />
      </section>
    </div>

    <section class="contrast-result">
      <header class="contrast-result__header">
        <span class="contrast-result__title">
          {{ t('contrastPage.section.result') }}
        </span>
      </header>
      <Diff
        id="diff"
        :mode="form.mode"
        :theme="theme"
        :language="form.type"
        :prev="form.prev"
        :current="form.current"
        :folding="form.folding"
      />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, reactive, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useIsDark } from '~/composables/useIsDark'

const { t } = useI18n({ useScope: 'global' })
const isDark = useIsDark()

// Theme follows the site-wide toggle. vue-diff applies its colors via the
// vue-diff-theme-{dark|light} class on the wrapper, so we keep that in sync
// here too — the prop alone doesn't repaint when the user toggles later.
const theme = computed(() => (isDark.value ? 'dark' : 'light'))

// Language options — labels stay as the canonical identifier (technical
// names, no translation) since they're identifiers passed verbatim to
// highlight.js. The dropdown keeps the technical spelling in both locales
// so the same value round-trips to `form.type`.
const languageOptions = [
  { label: 'CSS',        value: 'css' },
  { label: 'XML',        value: 'xml' },
  { label: 'Markdown',   value: 'markdown' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON',       value: 'json' },
  { label: 'Plaintext',  value: 'plaintext' },
  { label: 'TypeScript', value: 'typescript' },
] as const

const form = reactive({
  type: 'plaintext',
  mode: 'split' as 'split' | 'unified',
  prev: '',
  current: '',
  folding: false,
})

// Re-write the vue-diff wrapper's className on (theme, mode) changes —
// vue-diff binds these via h() inside its render function so they
// *should* be reactive, but in practice the wrapper class doesn't
// always repaint after a late dark-mode toggle, so we set it directly.
watch(
  [isDark, () => form.mode],
  ([dark, mode]) => {
    nextTick(() => {
      const d = document.getElementById('diff')
      if (d) {
        d.className = `vue-diff-wrapper vue-diff-mode-${mode} vue-diff-theme-${dark ? 'dark' : 'light'}`
      }
    })
  },
  { immediate: true, flush: 'post' },
)
</script>

<style lang="scss" scoped>
/* Outer wrapper — same shape as sql.vue / xml.vue / json.vue: wide
   (1600px) centered shell with a soft drop shadow. No fixed height
   here (unlike sql.vue) because the diff result can be tall and
   shouldn't squeeze the two input cards above; the page grows with
   content and the browser scrolls naturally. */
.contrast-page {
  max-width: 1600px;
  margin: 16px auto;
  padding: 20px 16px;
  background: var(--ep-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.contrast-title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
}
.contrast-subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 20px;
  font-size: 1rem;
}

/* Toolbar — page-level settings (language / mode / folding). Sits
   in its own elevated strip so the controls feel like "settings",
   not like primary actions on the data. Uses an inline label +
   control pair (label-on-left) so the group is self-explanatory
   without needing a separate card chrome around it. */
.contrast-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 18px;
  padding: 10px 16px;
  margin-bottom: 14px;
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
}
.contrast-toolbar__group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.contrast-toolbar__group--switch {
  gap: 6px;
}
.contrast-toolbar__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--it-text-primary);
  white-space: nowrap;
}
.contrast-toolbar__hint {
  font-size: 13px;
  color: var(--it-text-secondary);
  white-space: nowrap;
}
.contrast-toolbar__select {
  width: 140px;
}

/* Two-card input row. 1fr 1fr matches the formatter pattern; below
   900px collapses to a single column so each card gets the full
   width on mobile. align-items: stretch is the default so both
   cards share the row's height — and the textareas inside fill
   their cards via the flex chain below. */
.contrast-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}
@media (max-width: 900px) {
  .contrast-grid {
    grid-template-columns: 1fr;
  }
}

/* Card + header — identical pattern to .sql-card / .xml-card. Plain
   section (not el-card) so we keep full control over border + radius,
   and so the textarea's flex-grow isn't fighting an extra wrapper. */
.contrast-card {
  display: flex;
  flex-direction: column;
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  overflow: hidden;
}
.contrast-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--it-border);
  background-color: var(--it-bg-elevated);
}
.contrast-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--it-text-primary);
}
.contrast-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Pierce el-input's wrapper to make the textarea fill the card.
   Same recipe as sql.vue / xml.vue / json.vue — el-input sets an
   inline height on .el-textarea; we override that with flex:1 +
   min-height:0 down the chain. The min-height:0 on the inner
   textarea is load-bearing: browsers default to min-height:auto
   on flex items, which would prevent the textarea from shrinking
   below its content size and break the fill-the-card behavior. */
.contrast-textarea,
.contrast-textarea :deep(.el-textarea) {
  display: flex;
  flex: 1;
  min-height: 0;
}
.contrast-textarea :deep(textarea) {
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
.contrast-textarea :deep(textarea):focus {
  box-shadow: none;
}
.contrast-textarea :deep(.el-textarea__inner) {
  box-shadow: none !important;
}

/* Result card — full-width strip below the input grid. The vue-diff
   component renders inside with its own theme-aware background, so
   we don't set a body background here (it would just be painted
   over by .vue-diff-theme-*). The header mirrors the input cards'
   so the page reads as one consistent family. */
.contrast-result {
  margin-top: 16px;
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  overflow: hidden;
}
.contrast-result__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--it-border);
  background-color: var(--it-bg-elevated);
}
.contrast-result__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--it-text-primary);
}
/* vue-diff renders its viewer as the inner element; remove the
   wrapper's default top border-radius so the theme background flows
   edge-to-edge inside the card. */
.contrast-result :deep(.vue-diff-wrapper) {
  border-radius: 0;
}

@media (max-width: 600px) {
  .contrast-page { padding: 8px 2px; }
  .contrast-title { font-size: 1.5rem; }
  .contrast-toolbar { gap: 12px; padding: 10px 12px; }
  .contrast-toolbar__select { width: 120px; }
  .contrast-card__header,
  .contrast-result__header { padding: 10px 12px; }
}
</style>