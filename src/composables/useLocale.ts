import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useLocale() {
  const locale = ref('en-GB')

  const handler = (_ev: Event) => (locale.value = navigator.language)
  onMounted(() => {
    locale.value = navigator.language
    window.addEventListener('languagechange', handler)
  })

  onBeforeUnmount(() => window.removeEventListener('languagechange', handler))

  return locale
}
