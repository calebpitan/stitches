import { computed } from 'vue'

import { useDark } from '@vueuse/core'

export function useLightDark<L, D = L>(light: L, dark: D) {
  const isDark = useDark()
  const value = computed(() => (isDark.value ? dark : light))

  return value
}
