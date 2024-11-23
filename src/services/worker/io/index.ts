import { wrap } from 'comlink'

import type { IOController } from './worker'

export type { IOController } from './worker'

export function IOWorker() {
  const worker = new SharedWorker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const controller = wrap<IOController>(worker.port)

  return controller
}
