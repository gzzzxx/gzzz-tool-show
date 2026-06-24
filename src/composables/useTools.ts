/*
  useTools.ts — 单一来源的工具数据 + 搜索逻辑。

  The home grid and the header search palette both read from this
  module so the two surfaces never drift apart. Adding a new tool
  here lights it up everywhere.

  Search rule: case-insensitive `includes` against name / desc / path.
  Empty / whitespace query returns the full list in source order.
*/
import { ref } from 'vue'

export interface Tool {
  path: string
  name: string
  desc: string
  /** key into toolIconRegistry; falls back to 'document' when missing */
  icon?: string
  isNew?: boolean
}

export const tools = ref<Tool[]>([
  { path: '/encryption/SM4', name: 'SM4 加密/解密', desc: '国密 SM4 算法,支持 CBC/ECB 多种模式,密钥 128 位', icon: 'lock' },
  { path: '/encryption/AES', name: 'AES 加密/解密', desc: 'AES 对称加密,支持 128/192/256 位密钥', icon: 'lock' },
  { path: '/base64', name: 'Base64 转换', desc: '字符串/文件 Base64 编码解码,支持中文', icon: 'coin' },
  { path: '/timestamp', name: '时间戳转换', desc: 'Unix 时间戳与日期互转,支持秒/毫秒', icon: 'timer' },
  { path: '/color', name: '颜色转换', desc: 'HEX/RGB/HSL 互转,实时预览', icon: 'brush' },
  { path: '/format', name: 'JSON 格式化', desc: 'JSON 格式化、压缩、校验、字段提取', icon: 'document' },
  { path: '/contrast', name: '代码对比', desc: '文本/代码 diff,支持多种语言高亮', icon: 'code' },
  { path: '/calendar', name: '日历', desc: '日期查询、农历转换、年历', icon: 'calendar' },
])

export function searchTools(query: string): Tool[] {
  const q = query.trim().toLowerCase()
  if (!q) return tools.value
  return tools.value.filter((t) =>
    t.name.toLowerCase().includes(q) ||
    t.desc.toLowerCase().includes(q) ||
    t.path.toLowerCase().includes(q),
  )
}
