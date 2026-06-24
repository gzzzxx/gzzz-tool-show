<template>
  <div class="it-page-content about-page">
    <h1 class="about-page__title">关于 gzzz-tools</h1>

    <p class="about-page__lead">
      gzzz-tools 由
      <a
        class="about-page__link"
        href="https://github.com/gzzzxx"
        target="_blank"
        rel="noopener noreferrer"
      >gzzzxx</a>
      开发的在线工具集，汇集了开发人员和 IT 从业者日常会用到的加解密、编码、格式化、对比等小工具。如果对您有帮助，欢迎分享给朋友或加入收藏夹。gzzz-tools 永久免费且开源，但持续运行需要资金支撑托管与域名续费。如果愿意支持项目发展，鼓励添加更多工具，请考虑通过页面右上角的
      <a
        class="about-page__link"
        href="https://github.com/gzzzxx/gzzz-tool-show"
        target="_blank"
        rel="noopener noreferrer"
      >赞助</a>
      按钮支持。
    </p>

    <h2 class="about-page__subtitle">技术</h2>
    <p>
      gzzz-tools 采用 Vue 3 + Vite + TypeScript 开发，使用 Element Plus 作为 UI 组件库，并使用 Pinia、VueUse 等生态工具。
      其他依赖可在仓库的
      <a
        class="about-page__link"
        href="https://github.com/gzzzxx/gzzz-tool-show/blob/main/package.json"
        target="_blank"
        rel="noopener noreferrer"
      >package.json</a>
      文件中找到完整列表。
    </p>

    <h2 class="about-page__subtitle">发现了 Bug？缺少工具？</h2>
    <p>
      如果目前这里没有您需要的工具，并且您认为它可能有用，欢迎在 GitHub 仓库的
      <a
        class="about-page__link"
        href="https://github.com/gzzzxx/gzzz-tool-show/issues"
        target="_blank"
        rel="noopener noreferrer"
      >issues</a>
      中提交新功能请求。如果发现了 Bug，或某些功能未能按预期工作，也请在
      <a
        class="about-page__link"
        href="https://github.com/gzzzxx/gzzz-tool-show/issues"
        target="_blank"
        rel="noopener noreferrer"
      >issues</a>
      中提交错误报告，附上复现步骤会更有帮助。
    </p>

    <h2 class="about-page__subtitle">许可</h2>
    <p>
      项目源代码基于开源协议发布，您可以自由阅读、修改和部署。如需用于商业场景，请遵守对应的开源协议要求。
    </p>
  </div>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
.about-page {
  padding-top: 24px;
  padding-bottom: 48px;
  color: var(--it-text-primary, #1e293b);
  line-height: 1.7;
  max-width: 760px;

  &__title {
    margin: 0 0 20px;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  &__subtitle {
    margin: 32px 0 12px;
    font-size: 18px;
    font-weight: 600;
  }

  &__lead {
    margin-top: 0;
  }

  p { margin: 0 0 14px; }

  &__link {
    color: #0284c7;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.15s ease, color 0.15s ease;

    &:hover {
      border-bottom-color: #0284c7;
      color: #075985;
    }
  }
}

:global(html.dark) .about-page {
  color: var(--it-text-primary, #f1f5f9);

  .about-page__link { color: #7dd3fc; }
  .about-page__link:hover { color: #bae6fd; border-bottom-color: #bae6fd; }
}
</style>