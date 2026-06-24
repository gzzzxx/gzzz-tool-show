/*
  useFavorites.ts — persisted "favorite tools" state.

  Stored as an array of tool paths (strings) in localStorage. We
  persist in array form because Set serializes to `{}` in JSON;
  restoring a Set from localStorage would silently lose every entry.

  The composable exposes both a raw path list and a resolved
  `favoriteTools` array (filtered through useLocalizedTools so the
  UI gets name/desc without any extra lookups). Stale paths —
  tools that have been removed from the catalog — are dropped at
  the resolution step, so the UI never renders an empty card.
*/
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useLocalizedTools } from '~/composables/useTools'

const STORAGE_KEY = 'gzzz-tool-show:favorites'

export function useFavorites() {
  const paths = useStorage<string[]>(STORAGE_KEY, [])

  // Hand out a fresh Set on every read so consumers (template :class
  // bindings, etc.) can rely on Vue tracking the change correctly.
  // Mutating a Set in place would NOT trigger reactivity in some
  // edge cases.
  const favoriteSet = computed(() => new Set(paths.value))

  function isFavorite(path: string) {
    return favoriteSet.value.has(path)
  }

  function toggle(path: string) {
    const set = new Set(paths.value)
    if (set.has(path)) {
      set.delete(path)
    } else {
      set.add(path)
    }
    paths.value = Array.from(set)
  }

  function remove(path: string) {
    if (!paths.value.includes(path)) return
    paths.value = paths.value.filter((p) => p !== path)
  }

  function clear() {
    paths.value = []
  }

  // Resolved favorites — drops any stale path that's no longer
  // registered, otherwise an unrenamed/removed tool would render
  // as an empty card.
  const { localizedTools } = useLocalizedTools()
  const favoriteTools = computed(() => {
    if (paths.value.length === 0) return []
    return localizedTools.value.filter((tool) => paths.value.includes(tool.path))
  })

  return {
    /** Raw list of favorited tool paths, persisted to localStorage. */
    favoritePaths: paths,
    /** Same data as a Set — handy for O(1) `has()` checks. */
    favoriteSet,
    /** Resolved favorited Tool objects (locale-aware name/desc). */
    favoriteTools,
    isFavorite,
    toggle,
    remove,
    clear,
  }
}
