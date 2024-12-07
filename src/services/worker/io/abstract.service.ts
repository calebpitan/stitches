import { type ProxyMarked, proxyMarker } from 'comlink'

import type { Sentinel } from './worker'

export abstract class AbstractService implements ProxyMarked {
  [proxyMarker]: true

  constructor(private readonly sentinel: Sentinel) {}

  get io() {
    return this.sentinel()
  }
}
