<!--
  hash.vue — compute multiple hash digests of a text input at once.

  Single page (not tabs): all hash algorithms do the same thing
  (text → digest), so showing them side-by-side is clearer than
  routing per algorithm (cf. SM4/AES which have different params).

  MD5 is pure-JS (Web Crypto doesn't support it; see ~/utils/md5.ts).
  SHA-1/256/384/512 use Web Crypto (crypto.subtle.digest), async.
  Auto-recompute on input change — cheap for small text, no debounce.
-->
<template>
  <div class="hash-tool">
    <h2 class="title">Hash 计算</h2>
    <div class="subtitle">
      输入文本,实时计算 MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512
    </div>

    <el-card class="input-card">
      <el-input
        v-model="input"
        type="textarea"
        :rows="6"
        placeholder="输入要计算 hash 的文本"
        resize="none"
        clearable
      />
      <div class="input-meta">
        <span>字符数: {{ input.length }}</span>
        <el-button :icon="Delete" size="small" @click="input = ''">清空</el-button>
      </div>
    </el-card>

    <!-- Inline margin on el-col: CSS margin-bottom gets eaten by el-row's
         flex-wrap, but inline style has specificity 1000 and can't be
         overridden. (This is the cleanest of three tried approaches.) -->
    <el-row :gutter="16" class="result-list">
      <el-col
        v-for="(algo, i) in algorithms"
        :key="algo.key"
        :span="24"
        :style="{ marginBottom: i < algorithms.length - 1 ? '8px' : '0' }"
      >
        <el-card class="result-card" :class="{ 'is-empty': !input }" :body-style="{ padding: '8px 14px' }">
          <div class="result-row-flex">
            <div class="result-info">
              <div class="result-label">
                {{ algo.label }}
                <span class="result-bits">{{ algo.bits }} 位</span>
              </div>
              <div
                class="result-value"
                :class="{ 'result-value--wraps': algo.key === 'sha384' || algo.key === 'sha512' }"
              >
                {{ input ? results[algo.key] : '—' }}
              </div>
            </div>
            <el-button
              :icon="DocumentCopy"
              size="small"
              circle
              :disabled="!input || !results[algo.key]"
              @click="copy(algo.key)"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Delete, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { md5 } from '~/utils/md5'

interface HashResults {
  md5: string
  sha1: string
  sha256: string
  sha384: string
  sha512: string
}

const algorithms: { key: keyof HashResults; label: string; bits: number }[] = [
  { key: 'md5',    label: 'MD5',     bits: 128 },
  { key: 'sha1',   label: 'SHA-1',   bits: 160 },
  { key: 'sha256', label: 'SHA-256', bits: 256 },
  { key: 'sha384', label: 'SHA-384', bits: 384 },
  { key: 'sha512', label: 'SHA-512', bits: 512 },
]

const input = ref('')
const results = reactive<HashResults>({
  md5: '',
  sha1: '',
  sha256: '',
  sha384: '',
  sha512: '',
})

async function sha(algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, bytes)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

watch(input, async (text) => {
  if (!text) {
    results.md5 = results.sha1 = results.sha256 = results.sha384 = results.sha512 = ''
    return
  }
  // MD5 is sync — show it first so the user sees something immediately.
  results.md5 = md5(text)
  const [sha1, sha256, sha384, sha512] = await Promise.all([
    sha('SHA-1',   text),
    sha('SHA-256', text),
    sha('SHA-384', text),
    sha('SHA-512', text),
  ])
  // Stale-watch guard: the digests may resolve after the user cleared or
  // edited the input; in that case, leave the cleared state alone.
  if (input.value !== text) return
  results.sha1 = sha1
  results.sha256 = sha256
  results.sha384 = sha384
  results.sha512 = sha512
})

function copy(key: keyof HashResults) {
  const value = results[key]
  if (!value) return
  navigator.clipboard.writeText(value)
    .then(() => ElMessage.success('已复制到剪贴板'))
    .catch(() => ElMessage.error('复制失败'))
}
</script>

<style scoped>
.hash-tool {
  max-width: 800px;
  margin: 20px auto;
  padding: 24px 12px;
  background: var(--ep-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 24px;
  font-size: 1rem;
}

.input-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.input-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  color: var(--ep-text-color-secondary);
  font-size: 13px;
}

.result-list {
  margin-top: 4px;
}

.result-card {
  border-radius: 8px;
  background: var(--ep-fill-color-light);
}
.result-card.is-empty { opacity: 0.6; }

.result-row-flex {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--ep-text-color-primary);
}

.result-bits {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: var(--ep-text-color-secondary);
}

.result-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.4;
  color: var(--ep-text-color-primary);
  word-break: break-all;
  user-select: all;
}

/* SHA-384/SHA-512 wrap to 2 lines at this container width; min-height
   keeps the empty-state card the same height as the filled state so
   nothing below shifts when the user starts typing. */
.result-value--wraps {
  min-height: 2.8em;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .hash-tool { padding: 8px 2px; }
  .title { font-size: 1.5rem; }
}
</style>
