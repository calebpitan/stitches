import { computed } from 'vue'

import { $dt } from '@primevue/themes'
import { usePreferredColorScheme } from '@vueuse/core'

export function usePrimaryColor() {
  const scheme = usePreferredColorScheme()
  return computed<string>(() => {
    const obj = $dt('primary.color').value
    if (scheme.value === 'no-preference') return obj['light'].value
    return obj[scheme.value].value
  })
}
