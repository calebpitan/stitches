import * as sch from '@stitches/scheduler'

import type { TaskSchedule } from '@/interfaces/schedule'
import { type WeekdayVariable, never, ordinalToUint8 } from '@/utils'

import type { MasterMessageEventData, WorkerMessageEventData } from './types'

const st_var_weekday_map = {
  day: sch.StVarWeekday.Day,
  weekday: sch.StVarWeekday.Weekday,
  'weekend-day': sch.StVarWeekday.Weekend,
  get(key: WeekdayVariable) {
    return this[key]
  }
} as const satisfies Record<WeekdayVariable, sch.StVarWeekday> & {
  get(key: WeekdayVariable): sch.StVarWeekday
}

/**
 * Create an {@link sch.StSchedule} from the given data
 *
 * @param data The data to use to create a scheduler
 * @throws {Error}
 * @returns The created schedule
 */
function create_st_schedule(data: TaskSchedule) {
  if (!data.timestamp) throw new Error('`timestamp` is required to create schedule')

  const timestamp = BigInt(data.timestamp.getTime())
  const until =
    data.frequency.type !== 'never' && data.frequency.until
      ? BigInt(data.frequency.until.getTime())
      : undefined

  switch (data.frequency.type) {
    case 'never': {
      return new sch.StSchedule(data.id, timestamp)
    }

    case 'custom': {
      const tzOffset = -1 * 60 * 1_000 * data.timestamp.getTimezoneOffset()
      const exprs = data.frequency.crons.map((c) => c.expression)
      const freq = new sch.StCustomFrequency(tzOffset, exprs, until)

      return sch.StSchedule.with_custom(data.id, timestamp, freq)
    }

    case 'hour': {
      const expr = new sch.StHourlyExpression(data.frequency.exprs.every)
      const freq = new sch.StRegularFrequency(sch.StFrequencyType.Hour, expr, until)

      return sch.StSchedule.with_regular(data.id, timestamp, freq)
    }

    case 'day': {
      const expr = new sch.StDailyExpression(data.frequency.exprs.every)
      const freq = sch.StRegularFrequency.with_daily_expr(sch.StFrequencyType.Day, expr, until)

      return sch.StSchedule.with_regular(data.id, timestamp, freq)
    }

    case 'week': {
      const weekdays = new Uint8Array(data.frequency.exprs.subexpr.weekdays)
      const expr = sch.StWeeklyExpression.with_weekdays(data.frequency.exprs.every, weekdays)
      const freq = sch.StRegularFrequency.with_weekly_expr(sch.StFrequencyType.Week, expr, until)

      return sch.StSchedule.with_regular(data.id, timestamp, freq)
    }

    case 'month': {
      let expr: sch.StMonthlyExpression

      if (data.frequency.exprs.subexpr.type === 'ondays') {
        const days = new Uint8Array(data.frequency.exprs.subexpr.days)
        expr = sch.StMonthlyExpression.with_days(data.frequency.exprs.every, days)
      } else {
        expr = sch.StMonthlyExpression.with_ordinal_weekday(
          data.frequency.exprs.every,
          sch.st_ordinals_from_value(ordinalToUint8(data.frequency.exprs.subexpr.ordinal)),
          sch.st_const_weekday_from_value(data.frequency.exprs.subexpr.weekday)
        )
      }

      const freq = sch.StRegularFrequency.with_monthly_expr(sch.StFrequencyType.Month, expr, until)
      return sch.StSchedule.with_regular(data.id, timestamp, freq)
    }

    case 'year': {
      let expr: sch.StYearlyExpression
      const months = new Uint8Array(data.frequency.exprs.subexpr.in.months)

      if (data.frequency.exprs.subexpr.on && data.frequency.exprs.subexpr.on.weekday) {
        expr = sch.StYearlyExpression.with_months_ordinal_const_weekday(
          data.frequency.exprs.every,
          months,
          sch.st_ordinals_from_value(ordinalToUint8(data.frequency.exprs.subexpr.on.ordinal)),
          sch.st_const_weekday_from_value(data.frequency.exprs.subexpr.on.weekday)
        )
      } else if (data.frequency.exprs.subexpr.on && data.frequency.exprs.subexpr.on.variable) {
        expr = sch.StYearlyExpression.with_months_ordinal_var_weekday(
          data.frequency.exprs.every,
          months,
          sch.st_ordinals_from_value(ordinalToUint8(data.frequency.exprs.subexpr.on.ordinal)),
          st_var_weekday_map.get(data.frequency.exprs.subexpr.on.variable)
        )
      } else {
        expr = sch.StYearlyExpression.with_months(data.frequency.exprs.every, months)
      }

      const freq = sch.StRegularFrequency.with_yearly_expr(sch.StFrequencyType.Year, expr, until)

      return sch.StSchedule.with_regular(data.id, timestamp, freq)
    }

    default:
      never(data.frequency)
  }
}

function subDataFactory(id: string): MasterMessageEventData {
  return { trigger: 'due', data: { id } }
}

async function main() {
  const runner = sch.get_scheduler_runner()
  const scheduler = sch.get_scheduler()

  self.addEventListener('message', async (msg: MessageEvent<WorkerMessageEventData>) => {
    switch (msg.data.command) {
      case 'add': {
        const data = Array.isArray(msg.data.data) ? msg.data.data : [msg.data.data]
        data
          .filter((v) => !!v.timestamp)
          .map((v) => create_st_schedule(v))
          .forEach((v) => scheduler.add_schedule(v))
        break
      }

      case 'subscribe':
        scheduler.subscribe((id: string) => self.postMessage(subDataFactory(id)))
        break

      case 'run':
        await runner.run(scheduler)
        break

      case 'update':
        if (msg.data.data.timestamp === null) break
        await runner.update_scheduler_with(create_st_schedule(msg.data.data))
        break

      case 'drop': {
        const data = Array.isArray(msg.data.data) ? msg.data.data : [msg.data.data]
        await Promise.all(data.map(async (v) => runner.remove_from_scheduler(v)))
        break
      }

      case 'drop_all':
        break

      case 'abort':
        await runner.quit()
        break

      default:
      // no default
    }
  })
}

await main()
