import { describe, expect, it } from 'vitest'

import {
  nextHourlySchedule,
  nextWeeklySchedule,
  nextWeeklyScheduleCorrectionFactor
} from './scheduling'

const timestamp = new Date('2024-10-21T14:19:00.000Z')

describe('#nextHourlySchedule', () => {
  it('should compute the next hourly datetime', () => {
    const next = nextHourlySchedule(timestamp, 1)
    const expected = new Date()

    expected.setUTCHours(
      expected.getUTCHours() + (expected.getUTCMinutes() > timestamp.getUTCMinutes() ? 1 : 0),
      timestamp.getUTCMinutes(),
      timestamp.getUTCSeconds(),
      timestamp.getUTCMilliseconds()
    )

    console.log(expected.getUTCHours(), next)

    expect(next.toISOString()).toEqual(expected.toISOString())
  })
})

describe('#nextWeeklySchedule', () => {
  it('should compute the next weekly datetime', () => {
    {
      const schedule = { weeks: 1, weekday: 4 }
      const next = nextWeeklySchedule(timestamp, schedule.weeks)
      expect(next.toISOString()).toEqual('2024-10-28T14:19:00.000Z')
    }

    {
      const schedule = { weeks: 2, weekday: 4 }
      const next = nextWeeklySchedule(timestamp, schedule.weeks)
      expect(next.toISOString()).toEqual('2024-11-04T14:19:00.000Z')
    }
  })
})

describe('#nextWeeklyScheduleCorrectionFactor', () => {
  it('should compute the correction factor for adjusting days of weekly schedule', () => {
    {
      const schedule = { weeks: 1, weekday: 4 }
      const next = nextWeeklySchedule(timestamp, schedule.weeks)
      const correctionFactor = nextWeeklyScheduleCorrectionFactor(next, schedule.weekday)
      const nextDate = new Date(Math.round(next.getTime() * correctionFactor))

      expect(nextDate.toISOString()).toEqual('2024-10-31T14:19:00.000Z')
    }
  })
})

// const weekdayOffset = next.getUTCDay() - schedule.weekday
//       next.setDate(next.getDate() + weekdayOffset * -1)
