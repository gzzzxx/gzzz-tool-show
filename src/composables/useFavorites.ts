/*
  useFavorites.ts — persisted "favorite tools" state.
  Two localStorage slots:
    * `gzzz-tool-show:favorites` — favorited paths (membership).
    * `gzzz-tool-show:favorites-order` — user-chosen display order
      for the home page grid (separate from membership so that an
      unfavorited path can be cleanly pruned without touching Set
      serialization — `Set` JSON-roundtrips as `{}`).
  Stale paths (removed from the catalog) are pruned at resolution
  time so the UI never renders an empty card.
*/
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useLocalizedTools } from '~/composables/useTools'

const STORAGE_KEY = 'gzzz-tool-show:favorites'
const ORDER_KEY = 'gzzz-tool-show:favorites-order'

export function useFavorites() {
  const paths = useStorage<string[]>(STORAGE_KEY, [])
  // Empty order means "use default catalog order"; first drop seeds it.
  const favoriteOrder = useStorage<string[]>(ORDER_KEY, [])

  // Fresh Set every read so consumers' :class bindings track changes
  // (in-place mutation on a cached Set wouldn't be reactive).
  const favoriteSet = computed(() => new Set(paths.value))

  function isFavorite(path: string) {
    return favoriteSet.value.has(path)
  }

function toggle(path: string) {
  const set = new Set(paths.value)
  if (set.has(path)) {
    set.delete(path)
    favoriteOrder.value = favoriteOrder.value.filter((p) => p !== path)
  } else {
    set.add(path)
    // Append to the order so newly-favorited tools land at the tail
    // of "我的收藏" (latest pinned = last). Also seeds the order on
    // first toggle.
    if (!favoriteOrder.value.includes(path)) {
      favoriteOrder.value = [...favoriteOrder.value, path]
    }
  }
  paths.value = Array.from(set)
}

  function remove(path: string) {
    if (!paths.value.includes(path)) return
    paths.value = paths.value.filter((p) => p !== path)
    favoriteOrder.value = favoriteOrder.value.filter((p) => p !== path)
  }

  function clear() {
    paths.value = []
    favoriteOrder.value = []
  }

  // Bulk-write from vuedraggable's v-model on drag end. Filter to
  // currently-favorited paths so a stale path can never linger.
  function setFavoriteOrder(order: string[]) {
    const known = new Set(paths.value)
    favoriteOrder.value = order.filter((p) => known.has(p))
  }

  const { localizedTools } = useLocalizedTools()
  const favoriteTools = computed(() => {
    if (paths.value.length === 0) return []

    const byPath = new Map(localizedTools.value.map((t) => [t.path, t]))

    if (favoriteOrder.value.length > 0) {
      const ordered = favoriteOrder.value
        .filter((p) => paths.value.includes(p))
        .map((p) => byPath.get(p))
        .filter((t): t is NonNullable<typeof t> => t !== undefined)

      // Append any favorited tool not in the saved order yet (toggled
      // on after the order was last touched).
      const seen = new Set(ordered.map((t) => t.path))
      const leftovers = paths.value
        .filter((p) => !seen.has(p))
        .map((p) => byPath.get(p))
        .filter((t): t is NonNullable<typeof t> => t !== undefined)

      return [...ordered, ...leftovers]
    }

    // No manual order yet — fall back to catalog order.
    return localizedTools.value.filter((tool) => paths.value.includes(tool.path))
  })

  return {
    favoritePaths: paths,
    favoriteSet,
    favoriteOrder,
    favoriteTools,
    isFavorite,
    toggle,
    remove,
    clear,
    setFavoriteOrder,
  }
}