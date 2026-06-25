/*
  useTools.ts — Locale-aware view of the tool catalog.

  The catalog lives in `~/tools/registry`; this composable resolves
  i18n keys into localized `name` / `desc` strings so consumer
  components (ToolCard, SearchPalette) don't have to think about
  translation.

  `useScope: 'global'` is needed because this composable is invoked
  from a non-component scope (a plain function); without the hint
  vue-i18n prints "Not found parent scope".
*/
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { tools, type ToolDefinition } from '~/tools/registry'

export interface Tool extends ToolDefinition {
  name: string
  desc: string
}

export function useLocalizedTools() {
  const { t } = useI18n({ useScope: 'global' })
  const localizedTools = computed<Tool[]>(() =>
    tools.map(entry => ({
      ...entry,
      name: t(entry.nameKey),
      desc: t(entry.descKey),
    })),
  )
  return { localizedTools }
}