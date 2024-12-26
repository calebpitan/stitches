import type { TaskSchedule } from '@stitches/common'

import { describe, expect, it } from 'vitest'

import { getUpcomingSchedules } from './scheduling'
import { type datetime } from './utils'

describe('scheduling', () => {
  describe('#getUpcomingSchedules', () => {
    const schedule: TaskSchedule<'regular'> = {
      id: '',
      taskId: '',
      frequency: {
        type: 'month',
        exprs: { every: 2, subexpr: { type: 'ondays', days: [10, 12, 13] } },
        until: new Date('2026-10-30T16:45:00.520Z'),
      },
      timing: {
        anchor: new Date('2024-10-20T16:45:00.520Z'),
        naive: '',
        tzone: '',
      },
    }

    it('should generate the next schedule for a regular frequency', () => {
      const upcoming = getUpcomingSchedules(schedule, {
        curtime: new Date('2024-12-26T20:19:00.000Z'),
      })

      expect(upcoming?.setZone('utc')?.toISO()).toMatchInlineSnapshot(`"2025-02-10T16:45:00.520Z"`)
    })
  })

  describe('#getUpcomingSchedules.iterator', () => {
    it('should generate a series of schedules as an iterator', () => {
      const it = getUpcomingSchedules.iterator({
        id: '',
        taskId: '',
        frequency: {
          type: 'month',
          exprs: { every: 2, subexpr: { type: 'ondays', days: [10, 12, 13] } },
          until: new Date('2026-10-30T16:45:00.520Z'),
        },
        timing: {
          anchor: new Date('2024-10-20T16:45:00.520Z'),
          naive: '',
          tzone: '',
        },
      })
      let itr: IteratorResult<datetime.DateTime>
      let i = 0
      while ((itr = it!.next()) && !itr.done && i < 100) {
        i++
        console.log('Value %d %s', i, itr.value)
      }
    })
  })
})
