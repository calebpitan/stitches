import * as sch from '@stitches/scheduler'

import type { TaskSchedule } from '@/interfaces/schedule'
import { type FrequencyType, never } from '@/utils'

import type { MasterMessageEventData, WorkerMessageEventData } from './types'

const freq_map = {
  custom: sch.StFrequencyType.Custom,
  day: sch.StFrequencyType.Day,
  hour: sch.StFrequencyType.Hour,
  month: sch.StFrequencyType.Month,
  week: sch.StFrequencyType.Week,
  year: sch.StFrequencyType.Year,
  get(key: Exclude<FrequencyType, 'never'>) {
    return this[key]
  }
} as const satisfies Record<Exclude<FrequencyType, 'never'>, sch.StFrequencyType> & {
  get(key: Exclude<FrequencyType, 'never'>): sch.StFrequencyType
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
  const until = data.frequency.until ? BigInt(data.frequency.until.getTime()) : undefined

  switch (data.frequency.type) {
    case 'never': {
      return new sch.StSchedule(data.id, timestamp)
    }
    case 'custom': {
      const exprs = data.frequency.crons.map((c) => c.expression)
      const freq = new sch.StCustomFrequency(until, exprs)

      return sch.StSchedule.with_custom(data.id, timestamp, freq)
    }
    case 'hour':
    case 'day':
    case 'week':
    case 'month':
    case 'year': {
      const freq = new sch.StRegularFrequency(freq_map.get(data.frequency.type), until)
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
  const scheduler = sch.get_scheduler()

  self.addEventListener('message', async (msg: MessageEvent<WorkerMessageEventData>) => {
    switch (msg.data.command) {
      case 'add':
        if (Array.isArray(msg.data.data)) {
          msg.data.data.forEach((item) => {
            !item.timestamp ? void 0 : scheduler.add_schedule(create_st_schedule(item))
          })

          break
        }

        if (!msg.data.data.timestamp) break
        scheduler.add_schedule(create_st_schedule(msg.data.data))
        break

      case 'update':
      case 'drop':
      case 'drop_all':
        break

      case 'abort':
        scheduler.abort()
        break
      case 'run':
        await scheduler.run()
        break
      case 'subscribe':
        scheduler.subscribe((st_schedule_id: string) =>
          self.postMessage(subDataFactory(st_schedule_id))
        )
        break
      default:
      // no default
    }
  })
}

await main()
