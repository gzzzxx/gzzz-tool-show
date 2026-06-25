<template>
  <div class="sql-page">
    <div class="sql-page__toolbar">
      <el-button
        v-for="b in toolbar"
        :key="b.label"
        :icon="b.icon"
        :type="b.type"
        :style="{ padding: '8px 18px' }"
        @click="b.action"
      >
        {{ b.label }}
      </el-button>
    </div>
    <div class="sql-page__inputs">
      <el-input
        v-model="form.data"
        type="textarea"
        resize="none"
        spellcheck="false"
        placeholder="请输入或粘贴 SQL 语句 ..."
        class="sql-page__textarea"
      />
      <el-input
        v-model="form.result"
        type="textarea"
        resize="none"
        spellcheck="false"
        disabled
        placeholder="格式化后的 SQL"
        class="sql-page__textarea"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { MagicStick, Minus, DocumentCopy, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { format as sqlFormat } from 'sql-formatter'

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

const toolbar = [
  { icon: MagicStick,   type: 'success' as const, label: '格式化', action: format },
  { icon: Minus,        type: 'info' as const,    label: '压缩',   action: minify },
  { icon: DocumentCopy,                          label: '复制',   action: copyData },
  { icon: Delete,                                label: '清空',   action: clear },
]

function runOnInput(action: (input: string) => string, emptyMsg: string) {
  const input = form.data.trim()
  if (!input) {
    ElMessage.warning({ message: emptyMsg })
    form.result = ''
    return
  }
  form.result = action(input)
}

function format() {
  runOnInput(input => sqlFormat(input, FORMAT_OPTS), '请输入要格式化的 SQL')
}

// 先格式化再压空白，避免字符串字面量里的空白被误吃。
function minify() {
  runOnInput(
    input =>
      sqlFormat(input, FORMAT_OPTS)
        .replace(/--[^\n]*/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*([(),;])\s*/g, '$1')
        .trim(),
    '请输入要压缩的 SQL',
  )
}

function copyData() {
  if (!form.result) return ElMessage.warning({ message: '暂无可复制的内容，请先格式化' })
  navigator.clipboard.writeText(form.result).then(
    () => ElMessage.success({ message: '复制成功' }),
    () => ElMessage.error({ message: '复制失败，请手动复制' }),
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
    form.result = sqlFormat(input, FORMAT_OPTS)
  } catch {
    /* keep previous result */
  }
}, 300)

watch(() => form.data, autoFormat)
</script>

<style lang="scss" scoped>
.sql-page {
  --sql-gap: 16px;
  // .app-root 是 min-height:100vh 而非 height:100vh，
  // 这里写死 calc(100vh - 56px) 减 BaseHeader 并加 overflow:hidden 兜底，
  // 避免 textarea 内容超出时把整页顶出滚动条。
  height: calc(100vh - 56px);
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--sql-gap);
  padding: var(--sql-gap);
  box-sizing: border-box;
  overflow: hidden;
}

.sql-page__toolbar { display: flex; gap: 8px; }

.sql-page__inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sql-gap);
  min-height: 0;
  > * { min-width: 0; min-height: 0; }
}

// el-input(type=textarea) 内部是 <div class="el-textarea"><textarea/>，
// 不显式给高度时 textarea 被 el-textarea 的 inline 高度锁死，
// 这里穿透强制撑满，让两个 SQL 框跟按钮行一起填满整页。
.sql-page__textarea,
.sql-page__textarea .el-textarea {
  display: flex;
  flex: 1;
  height: 100%;
}
.sql-page__textarea textarea {
  flex: 1;
  height: 100%;
  min-height: 0;
  font-family: 'Fira Code', 'Cascadia Code', Consolas, Menlo, monospace;
  font-size: 13px;
}
</style>