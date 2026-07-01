<!--
  xml.vue — XML pretty-printer / minifier.

  Style: card-based two-column layout (1fr | auto | 1fr) with
  a brand-colored arrow badge between source and result. Each
  card owns its header (title + contextual actions) so the
  controls sit next to what they act on (indent/clear → input,
  copy → output). Primary actions (Format / Minify) live in a
  centered top toolbar so the user sees what they can do
  before diving into either box.

  Deliberately *not* mirroring sql.vue's full-viewport dual-
  textarea layout. SQL is read top-to-bottom (long single-line
  queries); XML is read as a tree (multi-line nested structure).
  The two-column + arrow shape fits XML's "transform this input
  into this output" mental model better than SQL's "edit here,
  see there" split.
-->
<template>
  <div class="xml-page">
    <h2 class="xml-title">{{ t('tools.xml.name') }}</h2>
    <div class="xml-subtitle">{{ t('tools.xml.desc') }}</div>

    <!-- Top action toolbar — sits above the input/output grid so
         the user sees what they can do before diving into either
         box. Format / Minify are the page's primary affordances;
         the smaller contextual controls (indent dropdown, clear,
         copy) live inside each card's header. Default-size buttons
         keep the toolbar compact so it doesn't crowd the cards
         below. -->
    <div class="xml-toolbar">
      <el-button type="primary" :icon="MagicStick" @click="format">
        {{ t('xmlPage.action.format') }}
      </el-button>
      <el-button :icon="Minus" @click="minify">
        {{ t('xmlPage.action.minify') }}
      </el-button>
    </div>

    <div class="xml-grid">
      <!-- ============== Source card ============== -->
      <section class="xml-card">
        <header class="xml-card__header">
          <span class="xml-card__title">{{ t('xmlPage.section.source') }}</span>
          <div class="xml-card__actions">
            <el-select v-model="indent" size="small" class="xml-card__indent">
              <el-option
                v-for="o in indentOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
            <el-button size="small" :icon="Delete" link @click="clear">
              {{ t('xmlPage.action.clear') }}
            </el-button>
          </div>
        </header>
        <el-input
          v-model="form.data"
          type="textarea"
          :rows="14"
          resize="none"
          spellcheck="false"
          :placeholder="t('xmlPage.input.placeholder')"
          class="xml-textarea"
        />
      </section>

      <!-- Arrow badge -->
      <!-- ============== Result card ============== -->
      <section class="xml-card">
        <header class="xml-card__header">
          <span class="xml-card__title">{{ t('xmlPage.section.result') }}</span>
          <div class="xml-card__actions">
            <el-button
              size="small"
              :icon="DocumentCopy"
              link
              :disabled="!form.result"
              @click="copyData"
            >
              {{ t('xmlPage.action.copy') }}
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
          :placeholder="t('xmlPage.result.placeholder')"
          class="xml-textarea"
        />
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Delete, DocumentCopy, MagicStick, Minus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import xmlFormat from 'xml-formatter'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

// Indentation choice — passed verbatim to xml-formatter's
// `indentation` option (it accepts any literal indent string).
type Indent = '  ' | '    ' | '\t'
const indent = ref<Indent>('  ')
const indentOptions = [
  { label: '2 spaces', value: '  ' },
  { label: '4 spaces', value: '    ' },
  { label: 'Tab',       value: '\t' },
] as const

const form = reactive({ data: '', result: '' })

// Single source of truth for the xml-formatter options used by
// both the explicit actions (Format / Minify) and the debounced
// auto-format. Keeping them in one place ensures a stale option
// can't drift between the three call sites.
function formatCore(input: string) {
  return xmlFormat(input, {
    indentation: indent.value,
    collapseContent: true,
    throwOnFailure: true,
  })
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
  runOnInput(formatCore, t('xmlPage.error.empty'))
}

// 先格式化再压空白，避免字符串字面量里的空白被误吃。
// xml-formatter 没有原生 minify，借用 sql.vue 的策略。
function minify() {
  runOnInput(
    input =>
      formatCore(input)
        .replace(/>\s+</g, '><')
        .replace(/\s+/g, ' ')
        .replace(/>\s+(\S)/g, '>$1')
        .replace(/(\S)\s+</g, '$1<')
        .trim(),
    t('xmlPage.error.empty'),
  )
}

function copyData() {
  if (!form.result) {
    return ElMessage.warning({ message: t('xmlPage.error.copyEmpty') })
  }
  navigator.clipboard.writeText(form.result).then(
    () => ElMessage.success({ message: t('xmlPage.action.copied') }),
    () => ElMessage.error({ message: t('xmlPage.error.copyFailed') }),
  )
}

function clear() {
  form.data = ''
  form.result = ''
}

// 300ms 防抖自动格式化：左侧输入停顿后右侧自动出结果。
// 输入过程中 XML 可能不完整，xml-formatter 会抛错，
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

// Re-fire on either input change or indent switch (2 ↔ 4 ↔ tab)
// so the result pane always reflects the current state.
watch([() => form.data, indent], () => autoFormat(form.data), { flush: 'post' })
</script>

<style lang="scss" scoped>
/* Outer wrapper — wider than the standard 1200px (this is a
   horizontal two-pane tool, not a single-column form). Fixed
   height (not min-height) so the page never grows beyond the
   viewport and triggers a page-level scrollbar:
     height = 100vh - BaseHeader (56px) - top/bottom margin (16+16)
   overflow: hidden + box-sizing: border-box keep any inner
   overflow confined — textareas scroll internally. */
.xml-page {
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

.xml-title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
}
.xml-subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 20px;
  font-size: 1rem;
}

/* Two-card row. 1fr 1fr (no center column) matches the JSON
   formatter's "equal width, no arrow" style — the input/output
   relationship is implied by left/right positioning alone, and
   dropping the arrow gives both cards ~40px more horizontal
   space. flex:1 + min-height:0 so the cards eat the leftover
   vertical space; align-items stretch is the default. */
.xml-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}
@media (max-width: 900px) {
  .xml-grid {
    grid-template-columns: 1fr;
  }
}

/* xml-card — same role as crontab.vue's .c-card: elevated bg +
   1px border + 4px radius. Plain section (not el-card) so we
   keep full control over the border + radius. */
.xml-card {
  display: flex;
  flex-direction: column;
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  overflow: hidden;
}

.xml-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--it-border);
  background-color: var(--it-bg-elevated);
}
.xml-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--it-text-primary);
}
.xml-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.xml-card__indent {
  width: 130px;
}

/* Push the textarea to fill the rest of the card. el-input
   wraps the textarea in .el-textarea with inline height — we
   pierce through to make it actually grow. The inner textarea
   also gets a min-height:0 so flex shrinking works (browsers
   default to min-height:auto on flex items, which prevents
   them from shrinking below their content size and breaks
   the fill-the-card behavior we want here). */
.xml-textarea,
.xml-textarea :deep(.el-textarea) {
  display: flex;
  flex: 1;
  min-height: 0;
}
.xml-textarea :deep(textarea) {
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
.xml-textarea :deep(textarea):focus {
  box-shadow: none;
}
.xml-textarea :deep(.el-textarea__inner) {
  box-shadow: none !important;
}

/* Top toolbar. Button horizontal padding tightened from the
   Element Plus default 15px to 10px — for 2-3 char labels the
   default padding leaves the buttons looking loose, even at
   default size. */
.xml-toolbar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 14px;
}
.xml-toolbar :deep(.ep-button) {
  padding-left: 10px;
  padding-right: 10px;
}
:deep(.ep-select--small .ep-select__wrapper) {
  min-height: 18px;
}

@media (max-width: 600px) {
  .xml-page { padding: 8px 2px; }
  .xml-title { font-size: 1.5rem; }
  .xml-card__header { padding: 10px 12px; }
  .xml-card__indent { width: 110px; }
  .xml-toolbar { gap: 12px; }
}
</style>