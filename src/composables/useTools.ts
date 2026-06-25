/*
  useTools.ts — single source of truth for the home grid + search palette.

  Each tool entry only carries an `i18nKey`; name/desc are resolved
  through vue-i18n. The data layer stays free of UI strings — they're
  all in src/locales/<locale>/index.json under `tools.*`.
*/
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface Tool {
  path: string
  /** dot-path into vue-i18n messages, e.g. 'tools.base64' */
  i18nKey: string
  /** key into toolIconRegistry; falls back to 'document' when missing */
  icon?: string
  isNew?: boolean
}

// Every tool gets a UNIQUE icon so the home grid + sidebar can
// be scanned at a glance. SM4 vs AES were both `lock` previously;
// now SM4 is `shield` (national-cipher security barrier) and AES
// is `key` (symmetric-key cryptography).
const rawTools: Tool[] = [
  { path: '/encryption/SM4',  i18nKey: 'tools.sm4',       icon: 'shield' },
  { path: '/encryption/AES',  i18nKey: 'tools.aes',       icon: 'key' },
  { path: '/base64',          i18nKey: 'tools.base64',    icon: 'binary' },
  { path: '/timestamp',       i18nKey: 'tools.timestamp', icon: 'clock' },
  { path: '/color',           i18nKey: 'tools.color',     icon: 'palette' },
  { path: '/format',          i18nKey: 'tools.format',    icon: 'braces' },
  { path: '/contrast',        i18nKey: 'tools.contrast',  icon: 'diff' },
  { path: '/calendar',        i18nKey: 'tools.calendar',  icon: 'calendar' },
]

// Locale-aware view: resolve name/desc through t() so the rendered
// list flips when the user toggles the language. The composed shape
// still has `name`/`desc` so existing consumers (ToolCard,
// SearchPalette) don't have to change.
//
// `useScope: 'global'` is needed because this composable is invoked
// from a non-component scope (a plain function); without the hint
// vue-i18n prints "Not found parent scope".
export function useLocalizedTools() {
  const { t } = useI18n({ useScope: 'global' })
  const localizedTools = computed<Tool[]>(() =>
    rawTools.map((entry) => ({
      ...entry,
      name: t(`${entry.i18nKey}.name`),
      desc: t(`${entry.i18nKey}.desc`),
    })),
  )
  return { localizedTools }
}
