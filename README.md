<div align="center">

<img src="./src/images/logo.svg" alt="gzzz-tools logo" width="60" />

# gzzz-tools

### 面向开发者的在线工具集合 —— 加密 / 格式化 / 转换 / 时间，一站搞定

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.3-42b883?logo=vue.js)](https://vuejs.org)
[![Vite](https://img.shields.io/badge/Vite-4.5-646CFF?logo=vite)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.3-409EFF)](https://element-plus.org)

[**🌐 在线体验**](https://gzzz.pro/) · [**💡 功能建议**](../../issues)

</div>

## 📖 简介

**gzzz-tools** 是一套面向开发者的在线工具集合，整合了日常开发中最常用的 11 个工具，涵盖**加密、格式化、转换、时间**四大类。所有工具均在浏览器本地运行，**数据不离开你的电脑**，无需注册、无广告、无水印，打开即用。

## ✨ 特性

- 🔒 **隐私优先**：纯本地运算，数据零上传
- 🌍 **国际化**：内置中英文双语
- 🎨 **主题切换**：明亮 / 暗黑自由切换
- ⭐ **可收藏**：收藏常用工具到首页，访问更便捷
- 🖱️ **拖拽排序**：收藏的卡片支持拖拽自由调整顺序
- 🔍 **全局搜索**：`Ctrl/Command + K` 快速定位工具
- 📱 **响应式**：手机 / 平板 / PC 全端适配
- ⚡ **极速加载**：基于 Vite + SSG 静态预渲染

## 🧰 工具清单

| 分类 | 工具 |
| :--- | :--- |
| 🔐 **加密 / 哈希** | SM4 加密/解密 · AES 加密/解密 · Hash 计算（MD5 / SHA 系列） |
| 💻 **开发辅助** | JSON 格式化 · SQL 格式化 · 代码对比 |
| 🔄 **转换工具** | Base64 转换 · 时间戳转换 · 颜色转换（HEX / RGB / HSL） |
| 📅 **时间工具** | 日历（含农历、年历） |

## 🛠️ 开发者指南

### 环境要求

| 工具 | 版本 |
| --- | --- |
| Node.js | `>= 18.0` |
| npm | `>= 9.0`（yarn / pnpm 亦可） |
| 浏览器 | Chrome 90+ / Edge 90+ / Firefox 90+ / Safari 14+ |

### 本地启动

```bash
# github
git clone https://github.com/gzzzxx/gzzz-tools
# gitee
git clone https://gitee.com/gzzzxx/gzzz-tools
cd gzzz-tools
npm install
npm run dev          # 访问 http://localhost:1000
```

### 添加新工具

本项目使用**单一注册表**模式，添加新工具只需两步：

1. 在 `src/views/<tool-name>/` 下创建组件
2. 在 `src/tools/registry.ts` 中追加配置：

```ts
{
  path: '/your-tool',
  component: () => import('~/views/your-tool/your-tool.vue'),
  icon: 'your-icon',
  nameKey: 'tools.yourTool.name',
  descKey: 'tools.yourTool.desc',
  category: 'dev', // crypto | dev | convert | time
}
```

完成后，**侧边栏、首页卡片、搜索面板会自动同步**。

## 🤝 贡献

1. Fork 仓库，创建分支：`git checkout -b feature/your-feature`
2. 提交变更（遵循 [Conventional Commits](https://www.conventionalcommits.org/)）：`git commit -m "feat: xxx"`
3. 推送分支并发起 Pull Request

Issue 反馈请使用对应模板（Bug 报告 / 功能建议）。

## 📄 开源协议

本项目基于 [Apache License 2.0](LICENSE) 开源。

## 📮 联系方式

- 项目主页：[https://gzzz.pro/](https://gzzz.pro/)
- Issue：[Issues](../../issues)

---

<div align="center">

如果这个项目对你有帮助，欢迎 ⭐ **Star** 支持一下！

**Made with ❤️ by gzzz-tools Contributors**

</div>