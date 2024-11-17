import type { FrequencyType, Ordinals, WeekdayVariable } from '../scheduling'

export type Frequency = RegularFrequency | CustomFrequency | { type: 'never' }

export interface BaseRegularExpr {
  every: number
}

export interface HourlyExpr extends BaseRegularExpr {}
export interface DailyExpr extends BaseRegularExpr {}

export interface WeeklyExpr extends DailyExpr {
  subexpr: { weekdays: Array<number> }
}

export interface MonthlyOnDays {
  type: 'ondays'
  days: Array<number>
}

export interface MonthlyOnThe {
  type: 'onthe'
  ordinal: Ordinals
  weekday: number
}

export interface MonthlyExpr extends BaseRegularExpr {
  subexpr: MonthlyOnDays | MonthlyOnThe
}

export interface YearlyIn {
  months: Array<number>
}

export interface YearlyOnThe {
  ordinal: Ordinals
  weekday?: number
  /**
   * A variable weekday that is dynamically computed based on the
   * value specified here, and could be any weekday.
   *
   * - If the value is `'day'`, it could be the 1st to 5th or last day of the month
   * - If the value is `'weekday'`, it could be the 1st to 5th or last of one of Mon-Fri of the month
   * - If the value is `'weekend-day'`, it could be the 1st to 5th or last of any of Sat-Sun of the month
   */
  variable?: WeekdayVariable
}

export interface YearlyExpr extends BaseRegularExpr {
  subexpr: {
    in: YearlyIn
    on?: YearlyOnThe
  }
}

export type RegularExpression<
  T extends Exclude<FrequencyType, 'custom' | 'never'>,
  E extends BaseRegularExpr,
> = { type: T; exprs: E } & BaseFrequency

export interface CronSchedule {
  expression: string
  frequency: Exclude<FrequencyType, 'custom'>
}

export interface BaseFrequency {
  type: FrequencyType
  until?: Date | null
}

export type RegularFrequency =
  | RegularExpression<'hour', HourlyExpr>
  | RegularExpression<'day', DailyExpr>
  | RegularExpression<'week', WeeklyExpr>
  | RegularExpression<'month', MonthlyExpr>
  | RegularExpression<'year', YearlyExpr>

export interface CustomFrequency extends BaseFrequency {
  type: Extract<FrequencyType, 'custom'>
  crons: CronSchedule[]
}

export interface BaseTaskSchedule {
  taskId: string
  timestamp: Date | null
  frequency: Frequency
}

export interface TaskSchedule extends BaseTaskSchedule {
  id: string
}
