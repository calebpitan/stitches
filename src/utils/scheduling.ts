import type { ScheduleOptions, TaskSchedule } from '@stitches/common'
import {
  evaluate,
  never,
  nextDailySchedule,
  nextHourlySchedule,
  nextMonthlySchedule,
  nextWeeklySchedule,
  nextYearlySchedule,
} from '@stitches/common'

import { parseExpression } from 'cron-parser'

import { datetime } from './utils'

export function getUpcomingSchedules(schedule: TaskSchedule, options?: ScheduleOptions) {
  if (schedule.frequency.type === 'never') {
    return undefined
  } else if (schedule.frequency.type === 'custom') {
    return getUpcomingCustomSchedules(schedule as TaskSchedule<'custom'>, options)
  }
  return getUpcomingRegualarSchedules.resolve(schedule as TaskSchedule<'regular'>, options)
}

getUpcomingSchedules.iterator = (schedule: TaskSchedule) => {
  if (schedule.frequency.type === 'never') {
    return undefined
  } else if (schedule.frequency.type === 'custom') {
    return getUpcomingCustomSchedules.iterator(schedule as TaskSchedule<'custom'>)
  }
  return getUpcomingRegualarSchedules.iterator(schedule as TaskSchedule<'regular'>)
}

export function getUpcomingCustomSchedules(
  schedule: TaskSchedule<'custom'>,
  options?: Pick<ScheduleOptions, 'curtime'>,
): datetime.DateTime | undefined {
  const upcomings = schedule.frequency.crons
    .map((cron) =>
      parseExpression(cron.expression, {
        currentDate: options?.curtime?.getTime(),
        startDate: schedule.timing.anchor,
        endDate: schedule.frequency.until ?? undefined,
        tz: schedule.timing.tzone,
      }),
    )
    .map((v) => v.next().getTime())
  const upcoming = Math.min(...upcomings)

  if (Object.is(Infinity, upcoming)) return undefined

  return datetime(upcoming)
}

getUpcomingCustomSchedules.iterator = function* (schedule: TaskSchedule<'custom'>) {
  let cursor = getUpcomingCustomSchedules(schedule)

  while (cursor) {
    yield cursor
    cursor = getUpcomingCustomSchedules(schedule, { curtime: cursor.toJSDate() })
  }
}

export function getUpcomingRegualarSchedules(
  schedule: TaskSchedule<'regular'>,
  options?: ScheduleOptions,
) {
  switch (schedule.frequency.type) {
    case 'hour': {
      return nextHourlySchedule(schedule.timing.anchor, schedule.frequency.exprs.every, options)
    }
    case 'day': {
      return nextDailySchedule(schedule.timing.anchor, schedule.frequency.exprs.every, options)
    }
    case 'week': {
      return nextWeeklySchedule(
        schedule.timing.anchor,
        schedule.frequency.exprs.every,
        schedule.frequency.exprs.subexpr.weekdays,
        options,
      )
    }
    case 'month': {
      if (schedule.frequency.exprs.subexpr.type === 'ondays')
        return nextMonthlySchedule(
          schedule.timing.anchor,
          schedule.frequency.exprs.every,
          schedule.frequency.exprs.subexpr.days,
          options,
        )
      return nextMonthlySchedule(
        schedule.timing.anchor,
        schedule.frequency.exprs.every,
        schedule.frequency.exprs.subexpr,
        options,
      )
    }
    case 'year': {
      const on = schedule.frequency.exprs.subexpr.on
      const ordinals = on && { ordinal: on.ordinal, weekday: (on.weekday || on.variable)! }
      return nextYearlySchedule(
        schedule.timing.anchor,
        schedule.frequency.exprs.every,
        schedule.frequency.exprs.subexpr.in.months,
        ordinals,
        options,
      )
    }
    default:
      never(schedule.frequency)
  }
}

getUpcomingRegualarSchedules.resolve = (
  schedule: TaskSchedule<'regular'>,
  opts?: ScheduleOptions,
): datetime.DateTime | undefined => {
  const freq = schedule.frequency
  const until_ts = 'until' in freq ? freq.until?.getTime() : undefined

  const curtime = opts?.curtime ? datetime(opts.curtime.getTime()) : datetime()
  const curtime_ts = curtime.toMillis()
  const upcomings = getUpcomingRegualarSchedules(schedule, opts)
  const upcoming_ts = evaluate(() => {
    if (Array.isArray(upcomings)) {
      const mapped = upcomings.filter((v) => v !== undefined).map((v) => v!.getTime())
      const filtered = mapped.filter((v) => v > curtime_ts)
      const min = Math.min(...filtered)

      if (Object.is(Infinity, min)) {
        return undefined
      }
      return min
    }
    return upcomings.getTime()
  })

  if (until_ts && upcoming_ts && upcoming_ts > until_ts) return undefined
  if (upcoming_ts === undefined || upcoming_ts <= curtime_ts) {
    return getUpcomingRegualarSchedules.resolve(schedule, {
      ...opts,
      curtime: curtime.plus({ [freq.type]: 1 }).toJSDate(),
    })
  }

  return datetime(upcoming_ts)
}

getUpcomingRegualarSchedules.iterator = function* (schedule: TaskSchedule<'regular'>) {
  let cursor = getUpcomingRegualarSchedules.resolve(schedule)
  while (cursor) {
    yield cursor
    cursor = getUpcomingRegualarSchedules.resolve(schedule, { curtime: cursor.toJSDate() })
  }
}
