<!--
  src/components/index.vue — home page.
  Two grids: banner row (1 cell) + "全部工具" heading + tool grid (8 cells).
  Tool data is hard-coded; paths match src/router/index.ts verbatim.
  Visual styling: .it-page-content / .it-tool-card / .it-follow-banner
  (global classes in src/styles/_cards.scss).
-->
<template>
  <div class="it-page-content home-page">
    <div class="home-page__grid home-page__grid--with-banner">
      <div class="home-page__cell home-page__cell--banner">
        <FollowBanner />
      </div>
    </div>

    <h3 class="home-page__section-title">全部工具</h3>

    <div class="home-page__grid home-page__grid--tools">
      <div v-for="tool in tools" :key="tool.path" class="home-page__cell">
        <ToolCard :tool="tool" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FollowBanner from './cards/FollowBanner.vue'
import ToolCard from './cards/ToolCard.vue'

const tools = [
  { path: '/encryption/SM4', name: 'SM4 加密/解密', desc: '国密 SM4 算法,支持 CBC/ECB 多种模式,密钥 128 位', icon: 'lock' },
  { path: '/encryption/AES', name: 'AES 加密/解密', desc: 'AES 对称加密,支持 128/192/256 位密钥', icon: 'lock' },
  { path: '/base64', name: 'Base64 转换', desc: '字符串/文件 Base64 编码解码,支持中文', icon: 'coin' },
  { path: '/timestamp', name: '时间戳转换', desc: 'Unix 时间戳与日期互转,支持秒/毫秒', icon: 'timer' },
  { path: '/color', name: '颜色转换', desc: 'HEX/RGB/HSL 互转,实时预览', icon: 'brush' },
  { path: '/format', name: 'JSON 格式化', desc: 'JSON 格式化、压缩、校验、字段提取', icon: 'document' },
  { path: '/contrast', name: '代码对比', desc: '文本/代码 diff,支持多种语言高亮', icon: 'code' },
  { path: '/calendar', name: '日历', desc: '日期查询、农历转换、年历', icon: 'calendar' },
]
</script>

<style lang="scss" scoped>
// We override .it-page-content's default horizontal padding (26px) with a
// tighter ~16px gutter; the cards themselves already have internal padding.
.home-page {
  padding: 12px 16px 32px;

  // 1fr → 2fr → 3fr → 4fr; banner grid mirrors the tool grid so the banner
  // sits in column 1 visually.
  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    column-gap: 12px;
    row-gap: 12px;
  }
  &__grid--with-banner,
  &__grid--tools {
    @media (min-width: 640px)  { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (min-width: 768px)  { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @media (min-width: 1280px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  &__cell {
    min-width: 0;
    display: flex;
    align-self: stretch;
  }

  // Pin the banner to column 1 on >= 1280px. `align-self: start` keeps the
  // cell from stretching to match the banner's natural height, which would
  // push the section title off screen.
  &__cell--banner {
    @media (min-width: 1280px) { grid-column: 1; }
    align-self: start;
  }

  &__section-title {
    margin: 25px 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: #cbd5e1;
    letter-spacing: 0.02em;
  }
}
</style>