import { Type } from 'class-transformer'

import type {
  CronSchedule,
  CustomFrequency,
  Frequency,
  RegularFrequency,
  TaskSchedule
} from '@/interfaces/schedule'
import type { FrequencyType } from '@/utils/scheduling'

export class CronScheduleSerializer implements CronSchedule {
  expression: string
  frequency: Exclude<FrequencyType, 'custom' | 'never'>
}

export class RegularFrequencySerializer implements RegularFrequency {
  type: Exclude<FrequencyType, 'custom'>
  @Type(() => Date) until: Date | null
}

export class CustomFrequencySerializer implements CustomFrequency {
  type: Extract<FrequencyType, 'custom'>
  @Type(() => Date) until: Date | null
  @Type(() => CronScheduleSerializer) crons: CronSchedule[]
}

export class ScheduleSerializer implements TaskSchedule {
  id: string
  taskId: string

  @Type((o) => {
    return o?.object.frequency.type === 'custom'
      ? CustomFrequencySerializer
      : RegularFrequencySerializer
  })
  frequency: Frequency

  @Type(() => Date) timestamp: Date | null
}
