<!--
  sql.vue — SQL pretty-printer / minifier.

  Layout: same card-based two-column pattern as xml.vue (1fr |
  auto | 1fr with a brand-colored arrow badge between source
  and result). Each card owns its header — Clear lives with the
  source, Copy lives with the result — so the controls sit
  next to what they act on. Format / Minify stay in a top
  toolbar as the page's primary affordances.

  This used to be sql.vue's "full-viewport dual-textarea"
  layout (mirroring what most SQL formatters do online). It
  was deliberately rebuilt to match the rest of the dev
  category so /format /sql /xml all feel like one family.
-->
<template>
  <div class="sql-page">
    <h2 class="sql-title">{{ t('tools.sql.name') }}</h2>
    <div class="sql-subtitle">{{ t('tools.sql.desc') }}</div>

    <div class="sql-toolbar">
      <el-button type="primary" :icon="MagicStick" @click="format">
        {{ t('sqlPage.action.format') }}
      </el-button>
      <el-button :icon="Minus" @click="minify">
        {{ t('sqlPage.action.minify') }}
      </el-button>
    </div>

    <div class="sql-grid">
      <section class="sql-card">
        <header class="sql-card__header">
          <span class="sql-card__title">{{ t('sqlPage.section.source') }}</span>
          <div class="sql-card__actions">
            <el-button size="small" :icon="Delete" link @click="clear">
              {{ t('sqlPage.action.clear') }}
            </el-button>
          </div>
        </header>
        <el-input
          v-model="form.data"
          type="textarea"
          :rows="14"
          resize="none"
          spellcheck="false"
          :placeholder="t('sqlPage.input.placeholder')"
          class="sql-textarea"
        />
      </section>

      <div class="sql-arrow" aria-hidden="true">
        <el-icon :size="20"><ArrowRight /></el-icon>
      </div>

      <section class="sql-card">
        <header class="sql-card__header">
          <span class="sql-card__title">{{ t('sqlPage.section.result') }}</span>
          <div class="sql-card__actions">
            <el-button
              size="small"
              :icon="DocumentCopy"
              link
              :disabled="!form.result"
              @click="copyData"
            >
              {{ t('sqlPage.action.copy') }}
            </el-button>
          </div>
        </header>
        <el-input
          v-model="form.result"
          type="textarea"
          :rows="14"
          resize="none"
          spellcheck="false"
          disabled
          :placeholder="t('sqlPage.result.placeholder')"
          class="sql-textarea"
        />
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { ArrowRight, Delete, DocumentCopy, MagicStick, Minus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { format as sqlFormat } from 'sql-formatter'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const FORMAT_OPTS = {
  language: 'sql',
  keywordCase: 'upper',
  tabWidth: 2,
  useTabs: false,
  indentStyle: 'standard',
  expressionWidth: 120,
  linesBetweenQueries: 2,
  denseOperators: false,
  newlineBeforeSemicolon: true,
}

const form = reactive({ data: '', result: '' })

// Single source of truth for the sql-formatter options used by
// both the explicit actions and the debounced auto-format.
function formatCore(input: string) {
  return sqlFormat(input, FORMAT_OPTS)
}

function runOnInput(action: (input: string) => string, emptyMsg: string) {
  const input = form.data.trim()
  if (!input) {
    ElMessage.warning({ message: emptyMsg })
    form.result = ''
    return
  }
  try {
    form.result = action(input)
  } catch (e) {
    form.result = e instanceof Error ? e.message : String(e)
  }
}

function format() {
  runOnInput(formatCore, t('sqlPage.error.empty'))
}

// 先格式化再压空白，避免字符串字面量里的空白被误吃。
function minify() {
  runOnInput(
    input =>
      formatCore(input)
        .replace(/--[^\n]*/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*([(),;])\s*/g, '$1')
        .trim(),
    t('sqlPage.error.empty'),
  )
}

function copyData() {
  if (!form.result) {
    return ElMessage.warning({ message: t('sqlPage.error.copyEmpty') })
  }
  navigator.clipboard.writeText(form.result).then(
    () => ElMessage.success({ message: t('sqlPage.action.copied') }),
    () => ElMessage.error({ message: t('sqlPage.error.copyFailed') }),
  )
}

function clear() {
  form.data = ''
  form.result = ''
}

// 300ms 防抖自动格式化：左侧输入停顿后右侧自动出结果。
// 输入过程中 SQL 可能不完整，sql-formatter 偶尔会抛错，
// 这种情况下静默忽略、保留上次有效结果，避免右侧闪烁报错。
const autoFormat = useDebounceFn((value: string) => {
  const input = value.trim()
  if (!input) {
    form.result = ''
    return
  }
  try {
    form.result = formatCore(input)
  } catch {
    /* keep previous result */
  }
}, 300)

watch(() => form.data, autoFormat)
</script>

<style lang="scss" scoped>
/* Outer wrapper — same shape as xml.vue: wide (1600px) for a
   horizontal two-pane tool, viewport-fixed so the page never
   triggers a page-level scrollbar (height = 100vh - header -
   page margins, with overflow:hidden to clip inner overflow).
   flex-direction: column lets .sql-grid grow with flex:1. */
.sql-page {
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

.sql-title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 8px;
}
.sql-subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 20px;
  font-size: 1rem;
}

/* Top toolbar. Button horizontal padding tightened from the
   Element Plus default 15px to 10px — for 2-3 char labels the
   default padding leaves the buttons looking loose, even at
   default size. */
.sql-toolbar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 14px;
}
.sql-toolbar :deep(.ep-button) {
  padding-left: 10px;
  padding-right: 10px;
}

/* Two-card row + center arrow. flex:1 + min-height:0 so the
   cards eat the leftover vertical space; align-items stretch
   is the default — cards inherit the row's height, then their
   textarea fills the card via its own flex chain. */
.sql-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}
@media (max-width: 900px) {
  .sql-grid {
    grid-template-columns: 1fr;
  }
}

/* sql-card — same role as crontab.vue's .c-card. */
.sql-card {
  display: flex;
  flex-direction: column;
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  overflow: hidden;
}

.sql-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--it-border);
  background-color: var(--it-bg-elevated);
}
.sql-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--it-text-primary);
}
.sql-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Push the textarea to fill the rest of the card. el-input
   wraps the textarea in .el-textarea with inline height — we
   pierce through to make it actually grow. min-height:0 on
   the inner textarea so flex shrinking works (browsers
   default to min-height:auto, which prevents shrinking below
   content size and breaks the fill-the-card behavior). */
.sql-textarea,
.sql-textarea :deep(.el-textarea) {
  display: flex;
  flex: 1;
  min-height: 0;
}
.sql-textarea :deep(textarea) {
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
.sql-textarea :deep(textarea):focus {
  box-shadow: none;
}
.sql-textarea :deep(.el-textarea__inner) {
  box-shadow: none !important;
}

/* Arrow badge — brand-colored pill in the gutter. */
.sql-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  align-self: center;
  border-radius: 50%;
  background-color: var(--brand-primary-soft);
  color: var(--brand-primary);
}
@media (max-width: 900px) {
  .sql-arrow :deep(svg) {
    transform: rotate(90deg);
  }
}

@media (max-width: 600px) {
  .sql-page { padding: 8px 2px; }
  .sql-title { font-size: 1.5rem; }
  .sql-card__header { padding: 10px 12px; }
  .sql-toolbar { gap: 12px; }
}
</style>