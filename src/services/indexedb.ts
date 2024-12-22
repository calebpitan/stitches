import { withResolvers } from '@/utils'

type IndexeDBStore = { name: string; keyPath?: string }
type AnyArray<T> = Array<T> | ReadonlyArray<T>

export const collections = {
  local: { stores: [{ name: 'connections' }] },
  get<K extends Exclude<keyof typeof this, 'get'>>(key: K) {
    return this[key]
  },
} as const

export function initIndexedDB(version: number, name: string, stores: AnyArray<IndexeDBStore>) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, version === -1 ? undefined : version)

    request.addEventListener('error', (event) => {
      reject((event.target as typeof request).error)
    })

    request.addEventListener('success', (event) => {
      const result = (event.target as typeof request).result
      result.onversionchange = (ev) =>
        ev.newVersion === null && (ev.target as typeof result).close()

      resolve(result)
    })

    request.addEventListener('upgradeneeded', (event) => {
      stores.forEach((store) => {
        const idb = (event.target as typeof request).result

        try {
          idb.deleteObjectStore(store.name)
        } catch (e) {
          console.error(e)
        }

        idb.createObjectStore(store.name, {
          keyPath: store.keyPath,
        })
        console.log('Created IDB store "%s"', store.name)
      })
    })
  })
}

interface IDBReaderOptions {
  store: { name: string }
}

interface IDBWriterOptions extends IDBReaderOptions {}

export function idbReader(idb: IDBDatabase, options: IDBReaderOptions) {
  const store = idb.transaction(options.store.name, 'readonly').objectStore(options.store.name)

  return {
    read<T>(field: string): Promise<T> {
      const reader = withResolvers<T>()
      const cursorReq = store.openCursor(field)
      cursorReq.onsuccess = (event) => {
        const cursor = (event.target as typeof cursorReq).result
        if (!cursor || !cursor.value)
          return reader.reject(new Error('IDB query failed to resolve for ' + field))
        reader.resolve(cursor.value)
        cursor.continue()
      }

      cursorReq.onerror = (err) => reader.reject(err)

      return reader.promise
    },
  }
}

export function idbWriter(idb: IDBDatabase, options: IDBWriterOptions) {
  const store = idb.transaction(options.store.name, 'readwrite').objectStore(options.store.name)
  return {
    write<V>(field: string, value: V) {
      const writer = withResolvers<Record<string, V>>()

      const request = store.put(value, field)

      request.onsuccess = (event) => {
        const result = (event.target as typeof request).result
        writer.resolve({ [result.toString()]: value })
      }

      request.onerror = (err) => writer.reject(err)

      return writer.promise
    },
  }
}
