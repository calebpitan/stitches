import { inject } from 'vue'

import type { Remote } from 'comlink'

import type { IOController } from '@/services/worker/io'
import { Sym } from '@/utils'

export function useIOWorker() {
  const ioWorker = inject<Remote<IOController> | null>(Sym.Inject.IO_WORKER)

  if (!ioWorker)
    throw new Error(`Cannot inject an unprovided value: ${Sym.Inject.IO_WORKER.toString()}`)

  return ioWorker
}
