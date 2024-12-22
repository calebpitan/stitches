<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'

import sqlwasm from 'sql.js/dist/sql-wasm.wasm?url'

import { collections, idbReader, idbWriter, initIndexedDB } from '@/services/indexedb'
import { IOWorker } from '@/services/worker/io'
import { Sym } from '@/utils/symbols'
import { withResolvers } from '@/utils/utils'

const IDB_DB_NAME = 'local'
const CONNECTION_NAME = 'freckless'

const resolvers = computed(() => withResolvers<boolean>())
const ioWorkerRef = ref<ReturnType<typeof IOWorker> | null>(null)
const collection = collections.get(IDB_DB_NAME)
const connectionsStore = { store: collection.stores[0] }

async function setup() {
  if (!ioWorkerRef.value || (await ioWorkerRef.value.isConnected) === false) {
    const idb = await initIndexedDB(-1, IDB_DB_NAME, collection.stores)

    const database = await idbReader(idb, connectionsStore)
      .read<Uint8Array>(CONNECTION_NAME)
      .catch((e) => {
        console.error(e)
        return new Uint8Array()
      })

    const controller = ioWorkerRef.value || IOWorker()

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

    return (ioWorkerRef.value = controller)
  }

  return ioWorkerRef.value
}

function _downloadDatabaseFile(database: Uint8Array) {
  const blob = new Blob([database], { type: 'application/x-sqlite3' })
  const anchor = document.createElement('a')
  document.body.appendChild(anchor)
  anchor.href = URL.createObjectURL(blob)
  anchor.setAttribute('download', `${CONNECTION_NAME}.sqlite3`)
  anchor.click()

  URL.revokeObjectURL(anchor.href)
}

await setup()

provide(Sym.Inject.IO_WORKER, ioWorkerRef)

{
  onMounted(() => {
    window.onbeforeunload = async (_ev) => {
      // TODO: Uncomment the following lines in production
      // ev.preventDefault()
      // const canceled = ev.defaultPrevented !== false
      // if (canceled) return
      const ioWorker = ioWorkerRef.value!
      const database = await ioWorker.export()

      const idb = await initIndexedDB(-1, IDB_DB_NAME, collection.stores)
      await idbWriter(idb, connectionsStore).write(CONNECTION_NAME, database)

      // _downloadDatabaseFile(database)

      await ioWorker.disconnect(true).then(() => void (ioWorkerRef.value = null))
    }
  })

  onUnmounted(() => (window.onbeforeunload = null))
}

const _connected = await resolvers.value.promise
</script>

<template>
  <slot />
</template>
