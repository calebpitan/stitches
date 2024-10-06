import { useBreakpoints } from '@vueuse/core'

import { useBreakpointAdapter, useBreakpointConfig } from './useBreakpointConfig'

export function useCustomBreakpoints() {
  const cfg = useBreakpointConfig()
  const bp = useBreakpointAdapter(cfg.value)
  const custom = useBreakpoints(bp.value)

  return custom
}
