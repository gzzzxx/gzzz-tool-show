<!--
  crontab.vue — 1:1 visual clone of it-tools.tech/crontab-generator.

  Structure: two-column layout (5fr/7fr at ≥900px, single column below):
    Left  card: large monospace input → description line → divider
               → 3 toggles (label-left, n-form shape)
    Right card: ASCII field diagram (pre) → divider → symbol table
               (responsive: 4-col table on ≥768px, vertical cards
               per row on <768px — mirrors it-tools' isSmallScreen)

  Description + validation are delegated to cronstrue + cron-validator
  (the same libraries it-tools uses), with i18n via cronstrue/i18n so
  the description text follows the UI locale.
-->
<template>
  <div class="crontab-tool">
    <h2 class="title">{{ t('tools.crontab.name') }}</h2>
    <div class="subtitle">{{ t('tools.crontab.desc') }}</div>

    <div class="crontab-row">
      <!-- ============== Left: input + description + toggles ============== -->
      <div class="c-card">
        <div class="c-card__input-wrap">
          <input
            v-model="cron"
            class="c-input"
            :class="{ 'c-input--error': !validation.isValid }"
            :placeholder="t('crontabPage.placeholder')"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
          >
        </div>

        <div class="c-card__cron-string">{{ cronString }}</div>

        <div v-if="!validation.isValid" class="c-card__feedback">
          {{ validation.message }}
        </div>

        <div class="c-card__divider" />

        <div class="c-card__form">
          <div class="c-form-row">
            <label class="c-form-row__label">{{ t('crontabPage.options.verbose') }}</label>
            <el-switch v-model="cronstrueConfig.verbose" />
          </div>
          <div class="c-form-row">
            <label class="c-form-row__label">{{ t('crontabPage.options.hour24') }}</label>
            <el-switch v-model="cronstrueConfig.use24HourTimeFormat" />
          </div>
          <div class="c-form-row">
            <label class="c-form-row__label">{{ t('crontabPage.options.daysStartAt0') }}</label>
            <el-switch v-model="cronstrueConfig.dayOfWeekStartIndexZero" />
          </div>
        </div>
      </div>

      <!-- ============== Right: diagram + symbol table ============== -->
      <div class="c-card">
        <pre class="c-card__diagram">{{ diagramText }}</pre>

        <div class="c-card__divider" />

        <!-- Desktop / tablet: 4-col table -->
        <div v-if="!isSmallScreen" class="c-table-wrap">
          <table class="c-table" :aria-label="t('crontabPage.symbolTableLabel')">
            <thead>
              <tr>
                <th>{{ t('crontabPage.symbol.symbol') }}</th>
                <th>{{ t('crontabPage.symbol.meaning') }}</th>
                <th>{{ t('crontabPage.symbol.example') }}</th>
                <th>{{ t('crontabPage.symbol.equivalent') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in helpers" :key="row.symbol">
                <td><strong>{{ row.symbol }}</strong></td>
                <td>{{ row.meaning }}</td>
                <td><code class="c-table__code">{{ row.example }}</code></td>
                <td>{{ row.equivalent }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile: each row becomes a stacked card -->
        <div v-else class="c-card-list">
          <div v-for="row in helpers" :key="row.symbol" class="c-card-list__item">
            <div>{{ t('crontabPage.symbol.symbol') }}: <strong>{{ row.symbol }}</strong></div>
            <div>{{ t('crontabPage.symbol.meaning') }}: <strong>{{ row.meaning }}</strong></div>
            <div>
              {{ t('crontabPage.symbol.example') }}:
              <strong><code class="c-table__code">{{ row.example }}</code></strong>
            </div>
            <div>{{ t('crontabPage.symbol.equivalent') }}: <strong>{{ row.equivalent }}</strong></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import cronstrue from 'cronstrue'
import { toString as cronstrueI18n } from 'cronstrue/i18n'
import { isValidCron } from 'cron-validator'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })

// --- state ------------------------------------------------------------

const cron = ref('40 * * * *')
const cronstrueConfig = reactive({
  verbose: true,
  use24HourTimeFormat: true,
  dayOfWeekStartIndexZero: true,
})

// --- responsive: mirror it-tools' isSmallScreen (max-width: 768px) ---

// matchMedia fires synchronously at construction time on modern
// browsers, so the initial value is correct on the first render. We
// keep the mql handle around for the change listener.
const mql = typeof window !== 'undefined'
  ? window.matchMedia('(max-width: 768px)')
  : null
const isSmallScreen = ref(mql?.matches ?? false)
function onMqChange(e: MediaQueryListEvent) { isSmallScreen.value = e.matches }
onMounted(() => mql?.addEventListener('change', onMqChange))
onBeforeUnmount(() => mql?.removeEventListener('change', onMqChange))

// --- validation -------------------------------------------------------

// Same flags as it-tools' crontab-generator. NB: cron-validator 1.4
// doesn't accept @-aliases as valid (it-tools' 1.3 either), so
// the @-alias rows in the symbol table are static, not user input.
const isCronValid = (v: string) => isValidCron(v, {
  allowBlankDay: true,
  alias: true,
  seconds: true,
})

// { isValid, message } — mirrors it-tools' useValidation shape
// without pulling in the full form-integration composable.
const validation = computed<{ isValid: boolean; message: string }>(() => {
  const value = cron.value.trim()
  if (!value) return { isValid: false, message: t('crontabPage.error.empty') }
  if (!isCronValid(value)) return { isValid: false, message: t('crontabPage.error.invalid') }
  return { isValid: true, message: '' }
})

// --- description ------------------------------------------------------

// cronstrue + cronstrue/i18n both share the same options shape; we
// pick the i18n variant when the UI is in zh-CN, plain `cronstrue`
// otherwise. Both throw on invalid input, so we route through
// `validation` first to keep the description line a single space
// (matching it-tools' output: " " for invalid).
const cronString = computed(() => {
  void locale.value  // re-run on language switch
  if (!validation.value.isValid) return ' '
  try {
    const opts = { ...cronstrueConfig, throwExceptionOnParseError: true }
    return locale.value === 'zh-CN'
      ? cronstrueI18n(cron.value, { ...opts, locale: 'zh_CN' })
      : cronstrue.toString(cron.value, opts)
  } catch {
    return ' '
  }
})

// --- static content (helpers + diagram) -------------------------------

// Full 12-row symbol table from it-tools: 4 base forms (*, -, ,, /)
// + 8 @-aliases (@yearly/@annually/@monthly/@weekly/@daily/
// @midnight/@hourly/@reboot). Reboot is the only one with an
// empty example / equivalent — the cron schedule for "at startup"
// can't be expressed as a 5-field cron, so both fields are blank.
const helpers = computed(() => [
  { symbol: '*',     meaning: t('crontabPage.symbol.anyValue'),
    example: '* * * *',     equivalent: t('crontabPage.symbol.everyMinute') },
  { symbol: '-',     meaning: t('crontabPage.symbol.range'),
    example: '1-10 * * *',  equivalent: t('crontabPage.symbol.minutes1Through10') },
  { symbol: ',',     meaning: t('crontabPage.symbol.list'),
    example: '1,10 * * *',  equivalent: t('crontabPage.symbol.atMinutes1And10') },
  { symbol: '/',     meaning: t('crontabPage.symbol.step'),
    example: '*/10 * * *',  equivalent: t('crontabPage.symbol.every10Minutes') },
  { symbol: '@yearly',    meaning: t('crontabPage.symbol.yearly'),
    example: '@yearly',     equivalent: '0 0 1 1 *' },
  { symbol: '@annually',  meaning: t('crontabPage.symbol.annually'),
    example: '@annually',   equivalent: '0 0 1 1 *' },
  { symbol: '@monthly',   meaning: t('crontabPage.symbol.monthly'),
    example: '@monthly',    equivalent: '0 0 1 * *' },
  { symbol: '@weekly',    meaning: t('crontabPage.symbol.weekly'),
    example: '@weekly',     equivalent: '0 0 * * 0' },
  { symbol: '@daily',     meaning: t('crontabPage.symbol.daily'),
    example: '@daily',      equivalent: '0 0 * * *' },
  { symbol: '@midnight',  meaning: t('crontabPage.symbol.midnight'),
    example: '@midnight',   equivalent: '0 0 * * *' },
  { symbol: '@hourly',    meaning: t('crontabPage.symbol.hourly'),
    example: '@hourly',     equivalent: '0 * * * *' },
  { symbol: '@reboot',    meaning: t('crontabPage.symbol.reboot'),
    example: '',            equivalent: '' },
])

// Pre-formatted ASCII diagram. it-tools hardcodes this in the
// template; we keep the exact 6-line cascade and let i18n
// translate the labels (the pipe + hyphen tree is pure ASCII so
// it survives any locale).
const diagramText = computed(() => {
  void locale.value
  return [
    '\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 [' + t('crontabPage.diagram.optional') + '] ' + t('crontabPage.diagram.seconds') + ' (0 - 59)',
    '\u2502 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 ' + t('crontabPage.diagram.minute') + ' (0 - 59)',
    '\u2502 \u2502 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500 ' + t('crontabPage.diagram.hour') + ' (0 - 23)',
    '\u2502 \u2502 \u2502 \u250c\u2500\u2500\u2500\u2500\u2500\u2500 ' + t('crontabPage.diagram.dayOfMonth') + ' (1 - 31)',
    '\u2502 \u2502 \u2502 \u2502 \u250c\u2500\u2500\u2500\u2500 ' + t('crontabPage.diagram.month') + ' (1 - 12) ' + t('crontabPage.diagram.monthAlias'),
    '\u2502 \u2502 \u2502 \u2502 \u2502 \u250c\u2500\u2500 ' + t('crontabPage.diagram.dayOfWeek') + ' (0 - 6, ' + t('crontabPage.diagram.sunday') + ') ' + t('crontabPage.diagram.weekdayAlias'),
    '\u2502 \u2502 \u2502 \u2502 \u2502 \u2502',
    '* * * * * ' + t('crontabPage.diagram.command'),
  ].join('\n')
})
</script>

<style scoped>
/* Page-level wrapper — same look as the other tools in this
   project (max-width 1200px, soft shadow card on the page bg). */
.crontab-tool {
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
  margin-bottom: 8px;
}
.subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 20px;
  font-size: 1rem;
}

/* c-card — direct port of it-tools' CCard.vue: white bg + 1px
   border + 4px radius + 20/24 padding. Plain div (not el-card) so
   we keep our own border + radius; --it-bg-elevated / --it-border
   carry the light/dark split. */
.c-card {
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  padding: 20px 24px;
  box-sizing: border-box;
}

/* ====================================================================
   Two-card row — left input card + right diagram/table card. The
   5/7 ratio matches the it-tools reference; <900px we collapse to
   a single column so neither card gets awkwardly narrow.
   ==================================================================== */
.crontab-row {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 900px) {
  .crontab-row {
    grid-template-columns: 1fr;
  }
}

.c-card__input-wrap {
  max-width: 384px;
  margin: 0 auto;
}

/* c-input — the large monospace centered input, copied verbatim
   from it-tools' scoped <style> (30px / monospace / 5px padding /
   center-aligned), with a primary-tinted focus ring added so the
   focus indicator matches the rest of the app. */
.c-input {
  width: 100%;
  font-size: 30px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: 5px;
  text-align: center;
  color: var(--it-text-primary);
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}
.c-input::placeholder {
  color: var(--it-text-tertiary);
}
.c-input:hover,
.c-input:focus {
  border-color: var(--brand-primary);
}
.c-input:focus {
  background-color: var(--brand-primary-soft);
}
.c-input--error,
.c-input--error:hover,
.c-input--error:focus {
  border-color: var(--el-color-danger, #f56c6c);
}
.c-input--error:focus {
  background-color: rgba(245, 108, 108, 0.13);
}

/* c-card__cron-string — it-tools' .cron-string verbatim, minus
   opacity (so it reads cleanly against the project text color
   tokens). min-height reserves the same vertical space when
   invalid so toggles below don't jump. */
.c-card__cron-string {
  text-align: center;
  font-size: 22px;
  color: var(--it-text-primary);
  margin: 5px 0 15px;
  min-height: 33px;
  word-break: break-word;
}

.c-card__feedback {
  text-align: center;
  color: var(--el-color-danger, #f56c6c);
  font-size: 14px;
  margin-top: -8px;
  margin-bottom: 12px;
}

/* 1px neutral divider (same role as n-divider in it-tools). */
.c-card__divider {
  height: 1px;
  background-color: var(--it-border);
  margin: 16px 0;
}

/* c-form-row — port of n-form labelPlacement="left" with
   label-width="170": right-aligned label, 12px gap to the
   control, vertically centered. */
.c-card__form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.c-form-row {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 400px;
}
.c-form-row__label {
  flex: 0 0 170px;
  text-align: right;
  padding-right: 12px;
  color: var(--it-text-primary);
  font-size: 14px;
}

/* c-card__diagram — it-tools' <pre> verbatim, plus a monospace
   font so the pipe tree aligns. */
.c-card__diagram {
  overflow: auto;
  padding: 10px 0;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--it-text-primary);
  white-space: pre;
}

/* c-table — direct port of it-tools' CTable.vue. Replaces the
   Tailwind class soup (bg-#ffffff / dark:bg-#333333 / etc.) with
   project CSS variables so light/dark switches automatically. */
.c-table-wrap {
  overflow-x: auto;
  border-radius: 4px;
}
.c-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
  color: var(--it-text-primary);
}
.c-table thead {
  background-color: var(--it-bg-elevated);
  color: var(--it-text-secondary);
  text-transform: uppercase;
}
.c-table thead th {
  padding: 12px 24px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--it-border);
}
.c-table tbody td {
  padding: 16px 24px;
  border-bottom: 1px solid var(--it-border);
  vertical-align: top;
}
.c-table tbody tr:last-child td {
  border-bottom: none;
}
.c-table__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  background-color: var(--brand-primary-soft);
  color: var(--brand-primary);
  padding: 1px 6px;
  border-radius: 3px;
}

/* Mobile fallback: each row becomes a stacked mini-card */
.c-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.c-card-list__item {
  border: 1px solid var(--it-border);
  border-radius: 4px;
  padding: 12px 16px;
  background-color: var(--it-bg-elevated);
  font-size: 13px;
  line-height: 1.8;
  color: var(--it-text-primary);
}

/* Responsive — at 768px the form row goes full-width and the label
   shrinks so 3 toggles don't push the label off-screen; at 600px
   the page padding tightens and the 30px input drops to 22px (it
   overflows on phones otherwise). */
@media (max-width: 768px) {
  .c-form-row { max-width: 100%; }
  .c-form-row__label { flex-basis: 130px; padding-right: 8px; font-size: 13px; }
}
@media (max-width: 600px) {
  .crontab-tool { padding: 8px 2px; }
  .title { font-size: 1.5rem; }
  .c-card { padding: 16px 14px; }
  .c-input { font-size: 22px; }
  .c-card__cron-string { font-size: 18px; }
  .c-table thead th,
  .c-table tbody td { padding: 10px 14px; }
}
</style>
