import { reactive } from 'vue'

import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import type { BaseTaskSchedule, TaskSchedule } from '@stitches/common'

import { useIOWorker } from '@/composables/useIOWorker'

import { mutated, queried } from './utils'

export function useScheduleQuery() {
  const worker = useIOWorker()
  const variables = reactive({ id: '' })

  const result = useQuery({
    key: ['schedules', variables],
    query: async () => {
      const res = await worker.services.schedule.getSchedule(variables.id)
      return res
    },
  })

  return queried('schedule', result, variables)
}

export function useReplaceSchedule() {
  const worker = useIOWorker()
  const queryCache = useQueryCache()

  const result = useMutation({
    mutation: async (sub: BaseTaskSchedule | TaskSchedule) => {
      const res = await worker.services.schedule.replaceSchedule(sub)
      return res
    },
    async onSettled() {
      await queryCache.invalidateQueries({
        key: ['schedules'],
      })
      await queryCache.invalidateQueries({
        key: ['task-schedules'],
      })
    },
  })

  return mutated('schedule', result)
}

export function useClearSchedule() {
  const worker = useIOWorker()
  const queryCache = useQueryCache()

  const result = useMutation({
    mutation: async (id: string) => {
      const res = await worker.services.schedule.clearSchedule(id)
      return res
    },

    onSettled: async () => {
      await queryCache.invalidateQueries({
        key: ['schedules'],
      })
      await queryCache.invalidateQueries({
        key: ['task-schedules'],
      })
    },
  })

  return mutated('schedule', result)
}
