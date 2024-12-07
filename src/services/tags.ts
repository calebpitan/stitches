import { useQuery } from '@pinia/colada'

import { useIOWorker } from '@/composables/useIOWorker'

import { queried } from './utils'

export function useTagsQuery() {
  const worker = useIOWorker()
  const result = useQuery({
    key: ['tags'],
    async query() {
      const res = await worker.services.tag.getTags()
      return res
    },
  })

  return queried('tags', result, undefined)
}
