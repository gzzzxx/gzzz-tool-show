<!--
  timer.vue — Stopwatch + Countdown in a single tabbed card.

  Why tabs over two separate routes: the tool's mental model is "a
  timer" (one knob, two modes); merging them keeps the entry list
  short and lets the user flip between modes without losing the
  page. Same pattern used by it-tools.tech/timer.

  Timing: requestAnimationFrame instead of setInterval. setInterval
  drifts ~10–30ms per second on throttled tabs; rAF fires when the
  tab is actually rendering so the displayed time matches wall-clock
  even after backgrounding. The timer auto-pauses via rAF cancellation
  on unmount — see onBeforeUnmount at the bottom.

  Audio cue: WebAudio oscillator instead of an <audio> tag so we
  don't ship an mp3 with the bundle. Three short 880 Hz beeps, ~150ms
  each, 250ms apart — distinct from generic notification "ding"s
  and audible on laptop speakers without being obnoxious.
-->
<template>
  <div class="timer-tool">
    <h2 class="title">{{ t('tools.timer.name') }}</h2>
    <div class="subtitle">{{ t('tools.timer.desc') }}</div>

    <div class="t-tabs" role="tablist">
      <button
        class="t-tab"
        :class="{ 't-tab--active': mode === 'stopwatch' }"
        role="tab"
        :aria-selected="mode === 'stopwatch'"
        @click="setMode('stopwatch')"
      >
        {{ t('timerPage.tab.stopwatch') }}
      </button>
      <button
        class="t-tab"
        :class="{ 't-tab--active': mode === 'countdown' }"
        role="tab"
        :aria-selected="mode === 'countdown'"
        @click="setMode('countdown')"
      >
        {{ t('timerPage.tab.countdown') }}
      </button>
    </div>

    <!-- =================== Stopwatch =================== -->
    <div v-if="mode === 'stopwatch'" class="t-card">
      <div class="t-display">
        <span class="t-display__time">{{ formatElapsed(sw.elapsedMs) }}</span>
        <span class="t-display__unit">{{ t('timerPage.unit.cs') }}</span>
      </div>

      <div class="t-controls">
        <el-button v-if="!sw.running" type="primary" size="large" @click="swStart">
          {{ t('timerPage.action.start') }}
        </el-button>
        <el-button v-else type="warning" size="large" @click="swPause">
          {{ t('timerPage.action.pause') }}
        </el-button>
        <el-button size="large" @click="swReset" :disabled="!sw.running && sw.elapsedMs === 0 && sw.laps.length === 0">
          {{ t('timerPage.action.reset') }}
        </el-button>
        <el-button v-if="sw.running" size="large" @click="swLap">
          {{ t('timerPage.action.lap') }}
        </el-button>
      </div>

      <div v-if="sw.laps.length" class="t-laps">
        <div class="t-lap-row t-lap-row--head">
          <span>#</span>
          <span>{{ t('timerPage.lap.lapTime') }}</span>
          <span>{{ t('timerPage.lap.totalTime') }}</span>
        </div>
        <div v-for="lap in sw.laps" :key="lap.index" class="t-lap-row">
          <span>{{ lap.index }}</span>
          <span class="t-mono">{{ formatElapsed(lap.lapMs) }}</span>
          <span class="t-mono">{{ formatElapsed(lap.totalMs) }}</span>
        </div>
      </div>
    </div>

    <!-- =================== Countdown =================== -->
    <div v-else class="t-card">
      <template v-if="cd.phase === 'idle' || cd.phase === 'paused'">
        <div class="t-presets">
          <button
            v-for="p in presets"
            :key="p.h + ':' + p.m + ':' + p.s"
            class="t-preset"
            :class="{ 't-preset--active': cd.hours === p.h && cd.minutes === p.m && cd.seconds === p.s }"
            @click="applyPreset(p)"
          >
            {{ p.label }}
          </button>
        </div>

        <div class="t-custom">
          <div class="t-num-field">
            <el-input-number v-model="cd.hours" :min="0" :max="23" controls-position="right" />
            <span class="t-num-label">{{ t('timerPage.unit.hour') }}</span>
          </div>
          <div class="t-num-field">
            <el-input-number v-model="cd.minutes" :min="0" :max="59" controls-position="right" />
            <span class="t-num-label">{{ t('timerPage.unit.minute') }}</span>
          </div>
          <div class="t-num-field">
            <el-input-number v-model="cd.seconds" :min="0" :max="59" controls-position="right" />
            <span class="t-num-label">{{ t('timerPage.unit.second') }}</span>
          </div>
        </div>
      </template>

      <div class="t-display">
        <span
          class="t-display__time"
          :class="{
            't-display__time--warn': cd.phase === 'running' && cd.remainingMs <= 10_000 && cd.remainingMs > 0,
            't-display__time--alert': cd.phase === 'finished',
          }"
        >{{ formatRemaining(cd.remainingMs) }}</span>
      </div>

      <div class="t-controls">
        <el-button v-if="cd.phase === 'idle'" type="primary" size="large" @click="cdStart" :disabled="totalSeconds() === 0">
          {{ t('timerPage.action.start') }}
        </el-button>
        <el-button v-if="cd.phase === 'running'" type="warning" size="large" @click="cdPause">
          {{ t('timerPage.action.pause') }}
        </el-button>
        <el-button v-if="cd.phase === 'paused'" type="primary" size="large" @click="cdStart">
          {{ t('timerPage.action.resume') }}
        </el-button>
        <el-button v-if="cd.phase !== 'idle'" size="large" @click="cdReset">
          {{ t('timerPage.action.reset') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

type Mode = 'stopwatch' | 'countdown'
type CountdownPhase = 'idle' | 'running' | 'paused' | 'finished'

const { t, locale } = useI18n({ useScope: 'global' })

const mode = ref<Mode>('stopwatch')

// =================== Stopwatch state ===================

interface Lap {
  index: number
  lapMs: number
  totalMs: number
}

const sw = reactive({
  elapsedMs: 0,
  running: false,
  /** performance.now() of the most recent resume. */
  startedAt: 0,
  /** Elapsed ms accumulated before the current run (paused-at value). */
  baseElapsedMs: 0,
  laps: [] as Lap[],
  rafId: 0,
})

function swTick() {
  sw.elapsedMs = sw.baseElapsedMs + (performance.now() - sw.startedAt)
  sw.rafId = requestAnimationFrame(swTick)
}

function swStart() {
  if (sw.running) return
  sw.startedAt = performance.now()
  sw.running = true
  sw.rafId = requestAnimationFrame(swTick)
}

function swPause() {
  if (!sw.running) return
  cancelAnimationFrame(sw.rafId)
  sw.baseElapsedMs = sw.elapsedMs
  sw.running = false
}

function swReset() {
  cancelAnimationFrame(sw.rafId)
  sw.running = false
  sw.elapsedMs = 0
  sw.baseElapsedMs = 0
  sw.laps = []
}

function swLap() {
  const lastTotal = sw.laps.length ? sw.laps[sw.laps.length - 1].totalMs : 0
  const total = sw.elapsedMs
  sw.laps.push({
    index: sw.laps.length + 1,
    lapMs: total - lastTotal,
    totalMs: total,
  })
}

// =================== Countdown state ===================

const cd = reactive({
  hours: 0,
  minutes: 5,
  seconds: 0,
  remainingMs: 5 * 60 * 1000,
  phase: 'idle' as CountdownPhase,
  startedAt: 0,
  /** Remaining ms at the moment the most recent run started/paused. */
  baseRemainingMs: 5 * 60 * 1000,
  rafId: 0,
})

// Locale-reactive preset list. Reading `locale.value` inside the
// computed re-runs the expression on language switch, so labels
// translate without us subscribing to them explicitly.
const presets = computed(() => {
  void locale.value
  return [
    { label: t('timerPage.preset.1min'),  h: 0, m: 1,  s: 0 },
    { label: t('timerPage.preset.3min'),  h: 0, m: 3,  s: 0 },
    { label: t('timerPage.preset.5min'),  h: 0, m: 5,  s: 0 },
    { label: t('timerPage.preset.10min'), h: 0, m: 10, s: 0 },
    { label: t('timerPage.preset.15min'), h: 0, m: 15, s: 0 },
    { label: t('timerPage.preset.30min'), h: 0, m: 30, s: 0 },
    { label: t('timerPage.preset.60min'), h: 1, m: 0,  s: 0 },
  ]
})

function totalSeconds() {
  return cd.hours * 3600 + cd.minutes * 60 + cd.seconds
}

function applyPreset(p: { h: number; m: number; s: number }) {
  cd.hours = p.h
  cd.minutes = p.m
  cd.seconds = p.s
  cd.remainingMs = totalSeconds() * 1000
}

function cdTick() {
  const remaining = cd.baseRemainingMs - (performance.now() - cd.startedAt)
  cd.remainingMs = Math.max(0, remaining)
  if (remaining <= 0) {
    cancelAnimationFrame(cd.rafId)
    cd.phase = 'finished'
    onCountdownDone()
    return
  }
  cd.rafId = requestAnimationFrame(cdTick)
}

function cdStart() {
  if (cd.phase === 'running') return
  if (cd.phase === 'idle') {
    const total = totalSeconds() * 1000
    if (total <= 0) return
    cd.baseRemainingMs = total
    cd.remainingMs = total
  }
  cd.startedAt = performance.now()
  cd.phase = 'running'
  cd.rafId = requestAnimationFrame(cdTick)
}

function cdPause() {
  if (cd.phase !== 'running') return
  cancelAnimationFrame(cd.rafId)
  cd.baseRemainingMs = cd.remainingMs
  cd.phase = 'paused'
}

function cdReset() {
  cancelAnimationFrame(cd.rafId)
  cd.phase = 'idle'
  cd.remainingMs = totalSeconds() * 1000
  cd.baseRemainingMs = cd.remainingMs
}

function onCountdownDone() {
  beep()
  // Browsers require permission before showing notifications.
  // We don't request it here (would interrupt the user mid-count);
  // we only fire one when permission was already granted (e.g.
  // user clicked "allow" elsewhere).
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(t('tools.timer.name'), {
        body: t('timerPage.notify.done'),
        silent: false,
      })
    } catch { /* some browsers throw even on permission check; ignore */ }
  }
  ElMessage.success(t('timerPage.notify.done'))
}

// =================== Audio ===================

// WebAudio is the lightest cross-browser beep source — no asset
// bundle, no autoplay restriction on user-gesture triggers. The
// context is created lazily so SSR / no-script pages don't error.
let audioCtx: AudioContext | null = null
function beep() {
  try {
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    if (!Ctor) return
    audioCtx ??= new Ctor()
    const ctx = audioCtx
    const t0 = ctx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      const start = t0 + i * 0.28
      const stop = start + 0.16
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.28, start + 0.02)
      gain.gain.linearRampToValueAtTime(0, stop)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(stop + 0.01)
    }
  } catch { /* audio not available; visual cue (pulse) still fires */ }
}

// =================== Formatting ===================

function pad(n: number, len = 2) {
  return String(Math.floor(n)).padStart(len, '0')
}

// Decompose ms into h/m/s/cs. `ceil` rounds up the centisecond
// count (used by countdown so 0.5s reads "00:01", not "00:00"
// — last second visibly holds instead of flickering).
function parts(ms: number, ceil = false) {
  const totalCs = ceil ? Math.ceil(ms / 10) : Math.floor(ms / 10)
  const cs = totalCs % 100
  const totalSec = Math.floor(totalCs / 100)
  const s = totalSec % 60
  const totalMin = Math.floor(totalSec / 60)
  return {
    h: Math.floor(totalMin / 60),
    m: totalMin % 60,
    s,
    cs,
  }
}

/** `HH:MM:SS.cs` — stopwatch elapsed + lap times. */
function formatElapsed(ms: number) {
  const { h, m, s, cs } = parts(ms)
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`
}

/** `MM:SS` under 1h, `HH:MM:SS` otherwise — countdown. */
function formatRemaining(ms: number) {
  const { h, m, s } = parts(ms, true)
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

// =================== Mode switching ===================

function setMode(m: Mode) {
  if (mode.value === m) return
  mode.value = m
  // Pause whichever side was running so the rAF loop doesn't
  // keep firing while the user is reading the other tab.
  if (sw.running) swPause()
  if (cd.phase === 'running') cdPause()
}

onBeforeUnmount(() => {
  cancelAnimationFrame(sw.rafId)
  cancelAnimationFrame(cd.rafId)
})
</script>

<style scoped>
/* Page-level wrapper — same look as the other tools in this
   project (max-width 1200px, soft shadow card on the page bg). */
.timer-tool {
  max-width: 1200px;
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
  margin-bottom: 20px;
  font-size: 1rem;
}

/* Mode tabs */
.t-tabs {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--it-border);
}

.t-tab {
  background: none;
  border: none;
  padding: 10px 24px;
  font-size: 15px;
  color: var(--it-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}
.t-tab:hover {
  color: var(--it-text-primary);
}
.t-tab--active {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
  font-weight: 600;
}

/* t-card — same role as crontab.vue's .c-card: white/elevated bg,
   1px border, 4px radius, generous padding. */
.t-card {
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  padding: 32px 24px;
  box-sizing: border-box;
  max-width: 600px;
  margin: 0 auto;
}

/* Preset chips */
.t-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
}
.t-preset {
  background: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  color: var(--it-text-primary);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background-color 0.15s;
}
.t-preset:hover {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}
.t-preset--active {
  background: var(--brand-primary-soft);
  border-color: var(--brand-primary);
  color: var(--brand-primary);
  font-weight: 600;
}

/* Custom-time row */
.t-custom {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.t-num-field {
  display: flex;
  align-items: center;
  gap: 4px;
}
.t-num-field :deep(.el-input-number) {
  width: 100px;
}
.t-num-label {
  color: var(--it-text-secondary);
  font-size: 13px;
}

/* Big monospace display. font-variant-numeric: tabular-nums so the
   digit widths don't jiggle as the time changes — critical for a
   readable timer. */
.t-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin: 24px 0 28px;
}
.t-display__time {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 64px;
  font-weight: 300;
  color: var(--it-text-primary);
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
  transition: color 0.2s;
}
.t-display__time--warn {
  color: var(--el-color-warning, #e6a23c);
}
.t-display__time--alert {
  color: var(--el-color-danger, #f56c6c);
  animation: t-pulse 1s ease-in-out infinite;
}
.t-display__unit {
  font-size: 14px;
  color: var(--it-text-tertiary);
  align-self: flex-end;
  padding-bottom: 8px;
}
@keyframes t-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}

/* Action buttons */
.t-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Lap table */
.t-laps {
  margin-top: 28px;
  border-top: 1px solid var(--it-border);
  padding-top: 12px;
  max-height: 280px;
  overflow-y: auto;
}
.t-lap-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  gap: 12px;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--it-text-primary);
  border-radius: 4px;
}
/* Zebra stripe */
.t-lap-row:nth-child(even):not(.t-lap-row--head) {
  background-color: var(--brand-primary-soft);
}
.t-lap-row--head {
  font-weight: 600;
  color: var(--it-text-secondary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-bottom: 8px;
}
.t-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums;
}

/* Mobile */
@media (max-width: 600px) {
  .timer-tool { padding: 8px 2px; }
  .title { font-size: 1.5rem; }
  .t-card { padding: 20px 16px; }
  .t-display__time { font-size: 44px; letter-spacing: 1px; }
  .t-tab { padding: 8px 16px; font-size: 14px; }
  .t-lap-row { grid-template-columns: 28px 1fr 1fr; gap: 8px; font-size: 12px; }
  .t-num-field :deep(.el-input-number) { width: 80px; }
}
</style>