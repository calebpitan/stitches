<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref } from 'vue'

import sqlwasm from 'sql.js/dist/sql-wasm.wasm?url'

import { initIndexedDB } from '@/services/indexedb'
import { IOWorker } from '@/services/worker/io'
import { Sym } from '@/utils/symbols'
import { withResolvers } from '@/utils/utils'

const CONNECTION_NAME = 'freckless'
const IDB_STORE_NAME = 'connections'
const IDB_DB_NAME = 'local'

const resolvers = computed(() => withResolvers<boolean>())
const ioWorkerRef = ref<ReturnType<typeof IOWorker> | null>(null)

if (!ioWorkerRef.value || (await ioWorkerRef.value.isConnected) === false) {
  const sqliteDbResolvers = withResolvers<Uint8Array>()

  const idb = await initIndexedDB(-1, IDB_DB_NAME, [{ name: IDB_STORE_NAME }])
  const store = idb.transaction(IDB_STORE_NAME, 'readonly').objectStore(IDB_STORE_NAME)
  const cursorReq = store.openCursor(CONNECTION_NAME)

  cursorReq.addEventListener('success', (event) => {
    const cursor = (event.target as typeof cursorReq).result
    if (!cursor) return
    if (!cursor.value) {
      const msg = `No existing local SQLite 3 database for "${CONNECTION_NAME}"`
      sqliteDbResolvers.reject(new Error(msg))
    } else if (!(cursor.value instanceof Uint8Array)) {
      const msg = `Unknown value type: Expected "Uint8Array" but got ${typeof cursor.value}`
      sqliteDbResolvers.reject(new Error(msg))
    } else {
      sqliteDbResolvers.resolve(cursor.value)
    }
    cursor.continue()
  })

  const controller = ioWorkerRef.value || IOWorker()
  const database = await sqliteDbResolvers.promise
    .then((db) => db)
    .catch((e) => {
      console.log(e)
      return new Uint8Array()
    })
  const blob = new Blob([database], { type: 'application/x-sqlite3' })
  const dbUrl = URL.createObjectURL(blob)
  const wasmUrl = new URL(sqlwasm, window.location.origin)

  await controller
    .connect(CONNECTION_NAME, dbUrl, {
      wasm: wasmUrl.toString(),
      log: true,
    })
    .then((connected) => resolvers.value.resolve(connected))
    .catch((e) => resolvers.value.reject(e))

  URL.revokeObjectURL(dbUrl)
  provide(Sym.Inject.IO_WORKER, controller)

  ioWorkerRef.value = controller
}

function _downloadDatabaseFile(database: Uint8Array) {
  const blob = new Blob([database], { type: 'application/x-sqlite3' })
  const anchor = document.createElement('a')
  document.body.appendChild(anchor)
  anchor.href = URL.createObjectURL(blob)
  anchor.setAttribute('download', 'true')
  anchor.click()
  URL.revokeObjectURL(anchor.href)
}

onBeforeUnmount(async () => {
  const ioWorker = ioWorkerRef.value!
  const database = await ioWorker.export()

  const idb = await initIndexedDB(-1, IDB_DB_NAME, [{ name: IDB_STORE_NAME }])
  const store = idb.transaction(IDB_STORE_NAME, 'readwrite').objectStore(IDB_STORE_NAME)

  store.put(database, CONNECTION_NAME)

  // _downloadDatabaseFile(database)

  await ioWorker.disconnect(true).then(() => void (ioWorkerRef.value = null))
})

const _connected = await resolvers.value.promise
</script>

<template>
  <slot />
</template>
