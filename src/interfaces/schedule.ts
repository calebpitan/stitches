import type { FrequencyType } from '@/utils/scheduling'

export type Frequency = RegularFrequency | CustomFrequency

export interface BaseFrequency {
  type: FrequencyType
  until: Date | null
}

export interface RegularFrequency extends BaseFrequency {
  type: Exclude<FrequencyType, 'custom'>
}

export interface CustomFrequency extends BaseFrequency {
  type: Extract<FrequencyType, 'custom'>
  crons: CronSchedule[]
}

export interface CronSchedule {
  expression: string
  frequency: Exclude<FrequencyType, 'custom' | 'never'>
}

export interface BaseTaskSchedule {
  taskId: string
  timestamp: Date | null
  frequency: Frequency
}

export interface TaskSchedule extends BaseTaskSchedule {
  id: string
}
