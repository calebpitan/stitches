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

    function findSchedule(idOrTaskId: string) {
      const schedule = schedules.value.find((s) => s.id === idOrTaskId || s.taskId === idOrTaskId)
      return schedule ?? null
    }

    function createSchedule(schedule: BaseTaskSchedule) {
      const existing = findSchedule(schedule.taskId)
      if (existing) throw new Error(`Schedule already exist for task with ID ${schedule.taskId}`)
      schedules.value.push({
        id: ulid(),
        taskId: schedule.taskId,
        frequency: schedule.frequency,
        timestamp: schedule.timestamp
      })
    }

    return { schedules, createSchedule, findSchedule }
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
