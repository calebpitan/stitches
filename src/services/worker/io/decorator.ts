export function synchronized(): MethodDecorator {
  synchronized.metakey = Symbol.for('writer')
  return (target, key, _descriptor) => {
    const metadata: synchronized.Metadata = { synchronize: true }
    Reflect.defineMetadata(synchronized.metakey, metadata, target, key)
  }
}

export namespace synchronized {
  export let metakey: symbol
  export type Metadata = {
    synchronize: boolean
  }
}
