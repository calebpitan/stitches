type IndexeDBStore = { name: string; keyPath?: string }

export function initIndexedDB(name: string, stores: IndexeDBStore[]) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 3)

    request.addEventListener('error', (event) => {
      reject((event.target as typeof request).error)
    })

    request.addEventListener('success', (event) => {
      resolve((event.target as typeof request).result)
    })

    request.addEventListener('upgradeneeded', (event) => {
      stores.forEach((store) => {
        const idb = (event.target as typeof request).result

        try {
          idb.deleteObjectStore(store.name)
          idb.createObjectStore(store.name, {
            keyPath: store.keyPath,
          })
          console.log('Created IDB store')
        } catch (e) {
          console.error(e)
        }
      })
    })
  })
}
