import { Exclude, Expose, Type } from 'class-transformer'

import type {
  BaseRegularExpr,
  CronSchedule,
  CustomFrequency,
  DailyExpr,
  Frequency,
  HourlyExpr,
  MonthlyExpr,
  MonthlyOnDays,
  MonthlyOnThe,
  TaskSchedule,
  WeeklyExpr,
  YearlyExpr,
  YearlyIn,
  YearlyOnThe
} from '@/interfaces/schedule'
import { never } from '@/utils'
import type { FrequencyType, Ordinals, WeekdayVariable } from '@/utils/scheduling'

// ***************************************************************
// Base Expression Serializer for
// ***************************************************************
@Expose()
abstract class AbstractExprSerializer implements BaseRegularExpr {
  every: number
}

// ***************************************************************
// Hourly and Daily Scheduling Serializers
// ***************************************************************
@Expose()
class HourlyExprSerializer extends AbstractExprSerializer implements HourlyExpr {}
@Expose()
class DailyExprSerializer extends AbstractExprSerializer implements DailyExpr {}

// ***************************************************************
// Weekly Scheduling Serializers
// ***************************************************************
@Expose()
class WeeklySubExprSerializer {
  @Type(() => Number)
  weekdays: Array<number>
}

@Expose()
class WeeklyExprSerializer extends AbstractExprSerializer implements WeeklyExpr {
  subexpr: WeeklySubExprSerializer
}

// ***************************************************************
// Monthly Scheduling Serializers
// ***************************************************************
@Expose()
class MonthlyOnDaysSerializer implements MonthlyOnDays {
  @Type(() => String) type: 'ondays'
  @Type(() => Number) days: number[]
}

@Expose()
class MonthlyOnTheSerializer implements MonthlyOnThe {
  @Type(() => String) type: 'onthe'
  @Type(() => String) ordinal: Ordinals
  weekday: number
}

@Expose()
class MonthlyExprSerializer extends AbstractExprSerializer implements MonthlyExpr {
  @Type((o) => {
    return { onthe: MonthlyOnTheSerializer, ondays: MonthlyOnDaysSerializer }[
      o!.object.subexpr.type as 'onthe' | 'ondays'
    ]
  })
  subexpr: MonthlyOnDays | MonthlyOnThe
}

// ***************************************************************
// Yearly Scheduling Serializers
// ***************************************************************
@Expose()
class YearlyInSerializer implements YearlyIn {
  @Type(() => Number) months: number[]
}

@Expose()
class YearlyOnTheSerializer implements YearlyOnThe {
  @Type(() => String) custom?: WeekdayVariable | undefined
  @Type(() => String) ordinal: Ordinals
  @Type(() => Number) weekday?: number | undefined
}

@Expose()
class YearlySubExprSerializer {
  in: YearlyInSerializer
  on?: YearlyOnTheSerializer
}

@Expose()
class YearlyExprSerializer extends AbstractExprSerializer implements YearlyExpr {
  subexpr: YearlySubExprSerializer
}

// ***************************************************************
// Cron Scheduling Serializer
// ***************************************************************
@Expose()
export class CronScheduleSerializer implements CronSchedule {
  expression: string
  @Type(() => String) frequency: Exclude<FrequencyType, 'custom' | 'never'>
}

// ***************************************************************
// Regular Repeat Frequency Serializer
// ***************************************************************
@Expose()
export class RegularFrequencySerializer {
  @Exclude() crons: any = undefined
  @Type(() => String) type: Exclude<FrequencyType, 'custom'>
  @Type(() => Date) until: Date | null

  @Type((o) => {
    const type = o!.object.type as Exclude<FrequencyType, 'custom'>
    switch (type) {
      case 'hour':
        return HourlyExprSerializer
      case 'day':
        return DailyExprSerializer
      case 'week':
        return WeeklyExprSerializer
      case 'month':
        return MonthlyExprSerializer
      case 'year':
        return YearlyExprSerializer
      case 'never':
        return Object
      default:
        never(type)
    }
  })
  exprs:
    | HourlyExprSerializer
    | DailyExprSerializer
    | WeeklyExprSerializer
    | MonthlyExprSerializer
    | YearlyExprSerializer
}

// ***************************************************************
// Custom Repeat Frequency Serializer
// ***************************************************************
@Expose()
export class CustomFrequencySerializer implements CustomFrequency {
  @Type(() => String) type: Extract<FrequencyType, 'custom'>
  @Type(() => Date) until: Date | null
  @Type(() => CronScheduleSerializer) crons: CronSchedule[]
}

// ***************************************************************
// Task Scheduling Serializer
// ***************************************************************
@Expose()
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
