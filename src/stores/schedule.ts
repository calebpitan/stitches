import { ref } from 'vue'

import type { BaseTaskSchedule, TaskSchedule } from '@stitches/common'

import { plainToInstance } from 'class-transformer'
import { defineStore } from 'pinia'

import { ScheduleSerializer } from '@/serializers/schedule'
import { createDeserializer, createReadGuard, ulid } from '@/utils'

export const useTaskScheduleStore = defineStore(
  's-task-schedule',
  () => {
    const schedules = ref<TaskSchedule[]>([])
    const guard = createReadGuard('Schedule')

    function findScheduleIndex(idOrTaskId: string) {
      const index = schedules.value.findIndex((s) => s.id === idOrTaskId || s.taskId === idOrTaskId)
      return guard(index, false)
    }

    function findSchedule(idOrTaskId: string): TaskSchedule | null {
      const index = findScheduleIndex(idOrTaskId)
      const schedule: TaskSchedule | undefined = schedules.value.at(index)
      return schedule ?? null
    }

    function createSchedule(data: BaseTaskSchedule): TaskSchedule {
      const existing = findSchedule(data.taskId)
      if (existing) throw new Error(`Schedule already exist for task with ID "${data.taskId}"`)

      const schedule = {
        id: ulid(),
        taskId: data.taskId,
        frequency: data.frequency,
        timing: data.timing,
      }

      schedules.value.push(schedule)

      return schedule
    }

    function updateSchedule(id: string, patch: BaseTaskSchedule): TaskSchedule {
      const schedule = guard(id, findSchedule(id))
      return Object.assign(schedule, patch)
    }

    function upsertSchedule(taskId: string, patch: BaseTaskSchedule): TaskSchedule {
      const schedule = findSchedule(taskId)

      if (schedule === null) return createSchedule(patch)

      return updateSchedule(schedule.id, patch)
    }

    function deleteSchedule(id: string): TaskSchedule | null {
      const index = findScheduleIndex(id)
      guard(id, findSchedule(id))
      return schedules.value.splice(index, 1).at(0)!
    }

    return {
      schedules,
      createSchedule,
      findSchedule,
      updateSchedule,
      upsertSchedule,
      deleteSchedule,
    }
  },
  {
    persist: {
      serializer: {
        serialize: JSON.stringify,
        deserialize: createDeserializer<Record<'schedules', TaskSchedule[]>>((data) => {
          const serialized = plainToInstance(ScheduleSerializer, data.schedules, {
            enableImplicitConversion: true,
            strategy: 'excludeAll',
          })

          return { schedules: serialized }
        }),
      },
    },
  },
)
