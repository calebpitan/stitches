type IndexeDBStore = { name: string; keyPath?: string }

export function initIndexedDB(version: number, name: string, stores: IndexeDBStore[]) {
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
