import { ref } from 'vue'

import { plainToInstance } from 'class-transformer'
import { defineStore } from 'pinia'

import type { BaseTaskSchedule, TaskSchedule } from '@/interfaces/schedule'
import { ScheduleSerializer } from '@/serializers/schedule'
import { createDeserializer, ulid } from '@/utils'

export const useTaskScheduleStore = defineStore(
  's-task-schedule',
  () => {
    const schedules = ref<TaskSchedule[]>([])

    function findScheduleIndex(idOrTaskId: string) {
      const index = schedules.value.findIndex((s) => s.id === idOrTaskId || s.taskId === idOrTaskId)
      return index
    }

    function findSchedule(idOrTaskId: string): TaskSchedule | null {
      const index = findScheduleIndex(idOrTaskId)
      const schedule: TaskSchedule | undefined = schedules.value[index]
      return schedule ?? null
    }

    function createSchedule(data: BaseTaskSchedule): TaskSchedule {
      const existing = findSchedule(data.taskId)
      if (existing) throw new Error(`Schedule already exist for task with ID "${data.taskId}"`)

      const schedule = {
        id: ulid(),
        taskId: data.taskId,
        frequency: data.frequency,
        timestamp: data.timestamp
      }

      schedules.value.push(schedule)

      return schedule
    }

    function updateSchedule(id: string, patch: BaseTaskSchedule): TaskSchedule {
      const index = findScheduleIndex(id)
      const schedule = schedules.value.at(index)

      if (!schedule) throw new Error(`Schedule with ID "${id}" does not exist`)

      const update = { id, ...patch } // merge<TaskSchedule>(schedule, patch, {})

      schedules.value.splice(index, 1, update)

      return update
    }

    function upsertSchedule(taskId: string, patch: BaseTaskSchedule): TaskSchedule {
      const schedule = findSchedule(taskId)

      if (schedule === null) return createSchedule(patch)

      return updateSchedule(schedule.id, patch)
    }

    return { schedules, createSchedule, findSchedule, updateSchedule, upsertSchedule }
  },
  {
    persist: {
      serializer: {
        serialize: JSON.stringify,
        deserialize: createDeserializer<Record<'schedules', TaskSchedule[]>>((data) => {
          const serialized = plainToInstance(ScheduleSerializer, data.schedules, {
            enableImplicitConversion: true
          })

          return { schedules: serialized }
        })
      }
    }
  }
)
