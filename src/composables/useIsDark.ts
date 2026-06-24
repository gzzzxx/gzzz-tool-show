import { ref } from 'vue'

// Shared, lazy-mounted singleton. Every caller of useIsDark() gets the same
// ref and the same MutationObserver — adding listeners is cheap, no per-
// component setup needed.
const isDark = ref(false)
let observer: MutationObserver | null = null

function ensureObserver () {
  if (observer || typeof document === 'undefined') return
  const sync = () => {
    isDark.value = document.documentElement.classList.contains('dark')
  }
  sync()
  observer = new MutationObserver(sync)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
}

export function useIsDark () {
  ensureObserver()
  return isDark
}