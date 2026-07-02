<!--
  calendar.vue — solar + lunar calendar with festival / solar-term
  detection.

  Same card-based shell as crontab.vue / sql.vue / xml.vue:
    .calendar-page    → max-width centered shell + soft shadow
    .calendar-card    → elevated bg + 1px border, el-calendar fills it

  The el-calendar component owns the prev/next/today header and the
  date grid; our contribution is the per-day cell template (solar
  day number + lunar info) and the festival/lunar-day styling.

  All Element Plus internal class names are written with the `ep-`
  prefix — the app wraps the whole tree in
  <el-config-provider namespace="ep"> (App.vue), so el-* gets rewritten
  to ep-* at runtime. Same convention used in xml.vue / sql.vue /
  password-strength.vue.

  Logic preserved verbatim from the original (lunar date / festival /
  solar-term derivation via js-calendar-converter, weekday starts
  Monday via dayjs zh-cn locale).
-->
<template>
  <div class="calendar-page">
    <h2 class="calendar-title">{{ t('tools.calendar.name') }}</h2>
    <div class="calendar-subtitle">{{ t('tools.calendar.desc') }}</div>

    <section class="calendar-card">
      <el-calendar>
        <template #date-cell="{ data }">
          <div>
            <div class="solar">{{ data.day.split('-')[2] }}</div>
            <div
              class="lunar"
              :class="{ festival: isFestival(data) }"
            >
              {{ solarToLunar(data) }}
            </div>
          </div>
        </template>
      </el-calendar>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import calendar from '~/utils/js-calendar-converter.js'
// dayjs with zh-cn locale drives both el-calendar's internal date
// formatting (header year / month labels) and the Monday-first
// weekday layout the original page exposed.
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')

const { t } = useI18n({ useScope: 'global' })

// 是否节假日 — public holidays + traditional festivals + (term
// intentionally excluded so 节气 don't show as red).
function isFestival(slotData: { day: string }) {
  const [y, m, d] = slotData.day.split('-')
  const lunarDay = calendar.solar2lunar(y, m, d)

  const festAndTerm =
    (lunarDay.festival == null ? '' : ' ' + lunarDay.festival) +
    (lunarDay.lunarFestival == null ? '' : '' + lunarDay.lunarFestival)

  return festAndTerm != ''
}

// 公历转农历 — day name fallback (初一 → month name like "正月",
// otherwise the day character like "廿一"). If any festival or
// solar term falls on the date, prefer that string instead so the
// cell reads as "国庆节" / "立春" rather than a generic day number.
function solarToLunar(slotData: { day: string }) {
  const [y, m, d] = slotData.day.split('-')
  const lunarDay = calendar.solar2lunar(y, m, d)

  const lunarMD = lunarDay.IDayCn == '初一' ? lunarDay.IMonthCn : lunarDay.IDayCn

  const festAndTerm =
    (lunarDay.festival == null ? '' : ' ' + lunarDay.festival) +
    (lunarDay.lunarFestival == null ? '' : ' ' + lunarDay.lunarFestival) +
    (lunarDay.Term == null ? '' : ' ' + lunarDay.Term)

  return festAndTerm == '' ? lunarMD : festAndTerm
}
</script>

<style lang="scss" scoped>
/* Outer wrapper — same shell as crontab.vue (1200px, soft shadow).
   Calendar is a single-panel tool, no need for the 1600px width
   that the side-by-side formatters use. */
.calendar-page {
  max-width: 1200px;
  margin: 20px auto;
  padding: 24px 16px;
  background: var(--ep-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.calendar-title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
}
.calendar-subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 20px;
  font-size: 1rem;
}

/* Calendar card — el-calendar fills the card. Border + radius +
   elevated bg matches the c-card / sql-card / xml-card family. The
   calendar's own header sits on the elevated bg so we don't need
   to wrap it in a separate header strip. */
.calendar-card {
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  overflow: hidden;
}

/* ====================================================================
   Per-cell layout — solar day number on top, lunar info below.
   `.solar` + `.lunar` (and the festival variant) are NOT deep
   selectors: they're plain class names we emit from the
   date-cell template above, so they live inside Vue's scope hash.
   The `.festival` modifier is what the original used to flag
   holiday rows for the red color below.
   ==================================================================== */
.solar {
  font-size: 14px;
  line-height: 1.2;
  color: var(--it-text-primary);
}
.lunar {
  font-size: 12px;
  line-height: 1.2;
  color: var(--it-text-secondary);
}
.lunar.festival {
  color: var(--el-color-danger, #f56c6c);
}

/* ====================================================================
   Element Plus internal overrides — all selectors use the `ep-`
   prefix that <el-config-provider namespace="ep"> rewrites to.
   These were preserved verbatim from the original layout.
   ==================================================================== */
:deep(.ep-calendar-day) {
  display: flex;
  justify-content: space-around;
  align-content: center;
  flex-wrap: wrap;
}

/* 本月农历节日设置颜色 */
:deep(.ep-calendar-table .current .lunar.festival) {
  color: var(--el-color-danger, #f56c6c);
}
:deep(.ep-calendar__body) {
  padding: 0;
}
/* 周末添加背景色 */
:deep(.ep-calendar-table .current:nth-last-child(-n+2)) {
  background: var(--ep-fill-color-light);
}
:deep(.ep-button-group) {
  display: flex;
}

@media (max-width: 600px) {
  .calendar-page { padding: 8px 2px; }
  .calendar-title { font-size: 1.5rem; }
}
</style>