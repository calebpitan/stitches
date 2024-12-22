import { reactive } from 'vue'

import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { clone } from '@stitches/common'
import type { tag } from '@stitches/io'

import { useIOWorker } from '@/composables/useIOWorker'
import type { BaseTaskListItem, TaskListItem } from '@/interfaces/task'

import type { Patch } from './types'
import { mutated, queried } from './utils'

export function useTasksQuery() {
  const worker = useIOWorker()

  const result = useQuery({
    key: ['tasks'],
    query: async () => {
      const res = await worker.services.task.getTasks()
      return res
    },
  })

  return queried('tasks', result, undefined)
}

export function useTaskQuery() {
  const worker = useIOWorker()
  const variables = reactive({ id: '' })

  const result = useQuery({
    key: ['tasks', variables],
    query: async () => {
      const res = await worker.services.task.getTask(variables.id)
      return res
    },
  })

  return queried('task', result, variables)
}

export function useTasksSchedulesQuery() {
  const worker = useIOWorker()
  const variables = reactive({ taskIDs: [] as Array<string> })

  const result = useQuery({
    key: ['tasks-schedules', variables],
    query: async () => {
      const res = await worker.services.task.getSchedulesForTasks(clone(variables.taskIDs))
      return res
    },
  })

  return queried('schedules', result, variables)
}

export function useTasksTagsQuery() {
  const worker = useIOWorker()
  const variables = reactive({ taskIDs: [] as Array<string> })

  const result = useQuery({
    key: ['tasks-tags', variables],
    query: async () => {
      const res = await worker.services.task.getTagsForTasks(clone(variables.taskIDs))
      return res
    },
  })

  return queried('tags', result, variables)
}

export function useAddTask() {
  const worker = useIOWorker()
  const queryCache = useQueryCache()

  const result = useMutation({
    mutation: async (data: BaseTaskListItem) => {
      const res = await worker.services.task.createTask(data)
      return res
    },
    onSettled: () => {
      queryCache.invalidateQueries({
        key: ['tasks'],
        active: true,
      })
    },
  })

  return mutated('task', result)
}

export function useReviewTask() {
  const worker = useIOWorker()
  const queryCache = useQueryCache()

  const result = useMutation({
    mutation: async (patch: Patch<Partial<TaskListItem>>) => {
      const res = await worker.services.task.updateTask(patch.id, patch.data)
      return res
    },
    onSettled: (_data, _error, vars) => {
      queryCache.invalidateQueries({
        key: ['tasks', { id: vars.id }],
        active: true,
      })
    },
  })

  return mutated('task', result)
}

export function useRedactTask() {
  const worker = useIOWorker()
  const queryCache = useQueryCache()

  const result = useMutation({
    mutation: async (id: string) => {
      const res = await worker.services.task.redactTask(id)
      return res
    },
    onSettled: () => {
      queryCache.invalidateQueries({
        key: ['tasks'],
        active: true,
      })
    },
  })

  return mutated('task', result)
}

export function useMarkTaskAsCompleted() {
  const worker = useIOWorker()
  // const queryCache = useQueryCache()

  const result = useMutation({
    mutation: async (id: string) => {
      const res = await worker.services.task.markAsCompleted(id)
      return res
    },
  })

  return result
}

export function useAddTagToTask() {
  const worker = useIOWorker()
  const queryCache = useQueryCache()

  const result = useMutation({
    mutation: async (patch: Patch<Pick<tag.Tag, 'label'> | Pick<tag.Tag, 'id'>>) => {
      const res = await worker.services.task.tagTask(patch.id, patch.data)
      return res
    },
    onSettled() {
      queryCache.invalidateQueries({ key: ['tasks-tags'], active: true })
      queryCache.invalidateQueries({ key: ['tags'] })
    },
  })

  return mutated('task', result)
}

export function useRemoveTagFromTask() {
  const worker = useIOWorker()
  const queryCache = useQueryCache()

  const result = useMutation({
    mutation: async (patch: Patch<Pick<tag.Tag, 'label'> | Pick<tag.Tag, 'id'>>) => {
      const res = await worker.services.task.untagTask(patch.id, patch.data)
      return res
    },
    onSettled() {
      queryCache.invalidateQueries({ key: ['tasks-tags'], active: true })
      queryCache.invalidateQueries({ key: ['tags'] })
    },
  })

  return mutated('task', result)
}
