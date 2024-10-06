import { type ComputedRef, type Ref, computed, ref, watch } from 'vue'

import { useCssVar } from '@vueuse/core'

type BreakpointConfigValue<S extends boolean> = S extends true ? string : number

type BreakpointConfigValueGetter = <T extends boolean = false>(
  stringify?: T
) => BreakpointConfigValue<T>

type BreakpointConfig = {
  sm: BreakpointConfigValueGetter
  md: BreakpointConfigValueGetter
  lg: BreakpointConfigValueGetter
  xlg: BreakpointConfigValueGetter
  x2lg: BreakpointConfigValueGetter
  x3lg: BreakpointConfigValueGetter
}

type AdaptedBreakpointConfig = { [P in keyof BreakpointConfig]: number }

const createGetter = (value: number) => {
  return <T extends boolean = false>(stringify: T = false as T): BreakpointConfigValue<T> => {
    if (stringify === true) {
      return `${value}px` as BreakpointConfigValue<T>
    }
    return value as BreakpointConfigValue<T>
  }
}

export function useBreakpointConfig() {
  const el = ref(null)
  const small = useCssVar('--s-sm-viewport', el)
  const medium = useCssVar('--s-md-viewport', el)
  const large = useCssVar('--s-lg-viewport', el)
  const xlarge = useCssVar('--s-xl-viewport', el)
  const xxlarge = useCssVar('--s-2xl-viewport', el)
  const xxxlarge = useCssVar('--s-3xl-viewport', el)

  const config = computed<BreakpointConfig>(() => {
    return {
      sm: createGetter(parseInt(small.value ?? '640')),
      md: createGetter(parseInt(medium.value ?? '768')),
      lg: createGetter(parseInt(large.value ?? '1024')),
      xlg: createGetter(parseInt(xlarge.value ?? '1280')),
      x2lg: createGetter(parseInt(xxlarge.value ?? '1536')),
      x3lg: createGetter(parseInt(xxxlarge.value ?? '1920'))
    }
  })

  return config
}

export function useBreakpointAdapter(
  config: BreakpointConfig | ComputedRef<BreakpointConfig>
): Ref<AdaptedBreakpointConfig, AdaptedBreakpointConfig> {
  const configRef = ref(config)
  const adapted = ref<AdaptedBreakpointConfig>({} as AdaptedBreakpointConfig)

  watch(
    configRef,
    (cfg) => {
      adapted.value.lg = cfg.lg()
      adapted.value.md = cfg.md()
      adapted.value.sm = cfg.sm()
      adapted.value.x2lg = cfg.x2lg()
      adapted.value.x3lg = cfg.x3lg()
      adapted.value.xlg = cfg.xlg()
    },
    { immediate: true }
  )

  return adapted
}
