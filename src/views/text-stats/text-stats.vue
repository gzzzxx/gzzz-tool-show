<!--
  text-stats.vue — chars / words / lines / paragraphs / CJK
  breakdown / reading time, all derived from the input string
  synchronously so a single computed over the input ref fans out
  to every card with no debounce.

  Counting policy (in analyze() below):
  - Chars: UTF-16 code units (text.length), matches the editor view.
  - Bytes: UTF-8 encoded length (TextEncoder, available everywhere).
  - Words: whitespace-split, but each CJK ideograph is its own word
    so 我喜欢你 → 4, not 1. A buffer-flush guard skips pure
    punctuation runs (e.g. a fullwidth "。" glued to the previous
    CJK run) so it doesn't inflate the count.
  - Sentences: split on [.!?。！？…]+.
  - Reading time: 400 CJK chars/min + 250 EN words/min, weighted.
-->
<template>
  <div class="text-stats-tool">
    <h2 class="title">{{ t('tools.textStats.name') }}</h2>
    <div class="subtitle">{{ t('tools.textStats.desc') }}</div>

    <el-card class="input-card">
      <el-input
        v-model="input"
        type="textarea"
        :rows="8"
        :placeholder="t('textStatsPage.input.placeholder')"
        resize="none"
        clearable
      />
      <div class="input-meta">
        <span>{{ t('textStatsPage.input.meta', { chars: stats.chars, bytes: stats.bytes }) }}</span>
        <el-button :icon="Delete" size="small" @click="input = ''">
          {{ t('textStatsPage.input.clear') }}
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="16" class="stat-row">
      <el-col
        v-for="group in groups"
        :key="group.key"
        :xs="24" :sm="12" :md="6"
        :style="{ marginBottom: '12px' }"
      >
        <el-card class="stat-card" :body-style="{ padding: '14px 16px' }">
          <div class="stat-card__title">{{ t(`textStatsPage.group.${group.key}`) }}</div>
          <ul class="stat-card__list">
            <li v-for="key in group.items" :key="key" class="stat-card__item">
              <span class="stat-card__label">{{ t(`textStatsPage.label.${key}`) }}</span>
              <span class="stat-card__value">{{ stats[key] }}</span>
            </li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="reading-card" :body-style="{ padding: '14px 16px' }">
      <div class="reading-row">
        <div class="reading-block">
          <div class="reading-block__label">{{ t('textStatsPage.reading.label') }}</div>
          <div class="reading-block__value">{{ formattedReadingTime }}</div>
        </div>
        <div class="reading-block">
          <div class="reading-block__label">{{ t('textStatsPage.reading.cpm') }}</div>
          <div class="reading-block__value reading-block__value--small">
            CJK ≈ 400 / min · EN ≈ 250 wpm
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
const input = ref('')

// All keys the template is allowed to read off `stats`. The
// presentation groups below are typed against this so a typo in
// `items: ['charss', ...]` is a compile error.
type StatKey =
  | 'chars' | 'charsNoSpace' | 'bytes'
  | 'lines' | 'nonEmptyLines' | 'paragraphs'
  | 'words' | 'sentences'
  | 'cjk' | 'ascii'
  | 'digits' | 'punctuation' | 'spaces' | 'others'
  | 'readingMs'

interface Stat { [K in StatKey]: number }

const groups: Array<{ key: string; items: StatKey[] }> = [
  { key: 'basic',       items: ['chars', 'charsNoSpace', 'bytes', 'lines', 'nonEmptyLines', 'paragraphs'] },
  { key: 'lexical',     items: ['words', 'sentences', 'cjk', 'ascii'] },
  { key: 'composition', items: ['digits', 'punctuation', 'spaces', 'others'] },
  { key: 'reading',     items: ['cjk', 'ascii', 'words', 'sentences'] },
]

const stats = computed<Stat>(() => analyze(input.value))

const formattedReadingTime = computed(() => {
  const ms = stats.value.readingMs
  if (ms <= 0) return t('textStatsPage.reading.empty')
  const total = Math.round(ms / 1000)
  if (total < 60) return t('textStatsPage.reading.seconds', { n: total })
  const m = Math.floor(total / 60)
  const s = total % 60
  return s === 0
    ? t('textStatsPage.reading.minutesOnly', { n: m })
    : t('textStatsPage.reading.minutes', { n: m, s })
})

// --- pure analysis -----------------------------------------------------

const CJK_RE = /[\u3400-\u9fff\uF900-\uFAFF]/
const WHITESPACE_RE = /\s/
const SENTENCE_END_RE = /[.!?。！？…]+/
const PUNCTUATION_RE = /[.,;:!?。，；：！？、…—"'()\[\]{}<>«»`~@#\$%\^&*_+\-=/\\|]/

// Cheap letter/digit test for word-count flush boundaries. O(buffer),
// runs only on whitespace / CJK / EOS. ASCII range is compared as
// strings — `c` is a single code unit so the coercion is well-defined
// and faster than charCodeAt.
const isWordContent = (s: string): boolean => {
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (CJK_RE.test(c)) return true
    if (c >= '0' && c <= '9') return true
    if (c >= 'A' && c <= 'Z') return true
    if (c >= 'a' && c <= 'z') return true
  }
  return false
}

function countWords(text: string): number {
  if (!text) return 0
  let words = 0, buf = ''
  const flush = () => {
    if (buf && isWordContent(buf)) {
      words += buf.trim().split(/\s+/).filter(Boolean).length
    }
    buf = ''
  }
  for (const ch of text) {
    if (CJK_RE.test(ch)) { flush(); words++; continue }
    if (WHITESPACE_RE.test(ch)) { flush(); continue }
    buf += ch
  }
  flush()
  return words
}

function countSentences(text: string): number {
  if (!text.trim()) return 0
  return text.trim().split(SENTENCE_END_RE).filter(p => p.trim()).length
}

const ZERO_STATS: Stat = {
  chars: 0, charsNoSpace: 0, bytes: 0,
  lines: 0, nonEmptyLines: 0, paragraphs: 0,
  words: 0, sentences: 0,
  cjk: 0, ascii: 0,
  digits: 0, punctuation: 0, spaces: 0, others: 0,
  readingMs: 0,
}

function analyze(text: string): Stat {
  if (!text) return { ...ZERO_STATS }

  let charsNoSpace = 0, cjk = 0, ascii = 0, digits = 0
  let punctuation = 0, spaces = 0, others = 0

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (WHITESPACE_RE.test(ch)) { spaces++; continue }
    charsNoSpace++
    if (CJK_RE.test(ch)) cjk++
    else if (ch >= '0' && ch <= '9') { digits++; ascii++ }
    else if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) ascii++
    else if (PUNCTUATION_RE.test(ch)) punctuation++
    else others++
  }

  // A paragraph is ≥1 non-blank line separated from the next by a
  // blank line — single-newline wraps stay inside the same paragraph
  // (matches word-processor view).
  const rawLines = text.split(/\r\n|\r|\n/)
  let paragraphs = 0, inPara = false
  for (const line of rawLines) {
    const isBlank = !line.trim()
    if (!isBlank && !inPara) { paragraphs++; inPara = true }
    else if (isBlank) inPara = false
  }

  const words = countWords(text)
  // CJK chars are already in `words` (each ideograph = 1 word), so
  // subtract them out before applying the English rate — otherwise
  // Chinese gets double-billed (once at 400 chars/min, once at 250
  // wpm) and reading time comes out roughly 2× too long.
  const nonCjkWords = words - cjk
  // English / digit time uses `max(wpm, cpm)`:
  // - wpm (250 wpm) models prose like "Hello world" — a few words
  //   separated by spaces carry per-word fixation overhead.
  // - cpm (1000 chars/min) models dense alphanumeric like a 50-char
  //   serial number — there's only one "word" but 50 chars, so wpm
  //   returns near-zero and we'd display "0 秒".
  // Taking the max means each rate wins on its home turf.
  const wpmMs = (nonCjkWords / 250) * 60_000
  const cpmMs = (ascii / 1000) * 60_000
  return {
    chars: text.length,
    charsNoSpace,
    bytes: new TextEncoder().encode(text).length,
    lines: rawLines.length,
    nonEmptyLines: rawLines.filter(l => l.trim()).length,
    paragraphs,
    words,
    sentences: countSentences(text),
    cjk, ascii, digits, punctuation, spaces, others,
    readingMs: (cjk / 400) * 60_000 + Math.max(wpmMs, cpmMs),
  }
}
</script>

<style scoped>
.text-stats-tool {
  max-width: 1080px;
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

.stat-row { margin-top: 4px; }

.stat-card,
.reading-card {
  border-radius: 8px;
  background: var(--ep-fill-color-light);
}

.stat-card { height: 100%; }

.stat-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ep-text-color-primary);
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}

.stat-card__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.stat-card__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.stat-card__label { color: var(--ep-text-color-secondary); }

.stat-card__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--ep-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.reading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.reading-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reading-block__label {
  font-size: 12px;
  color: var(--ep-text-color-secondary);
}

.reading-block__value {
  font-size: 18px;
  font-weight: 600;
  color: var(--ep-text-color-primary);
}

.reading-block__value--small {
  font-size: 12px;
  font-weight: 400;
  color: var(--ep-text-color-secondary);
}

@media (max-width: 600px) {
  .text-stats-tool { padding: 8px 2px; }
  .title { font-size: 1.5rem; }
}
</style>
