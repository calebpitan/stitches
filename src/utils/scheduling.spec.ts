import { describe, expect, it } from 'vitest'

import {
  nextHourlySchedule,
  nextWeeklySchedule,
  nextWeeklyScheduleCorrectionFactor
} from './scheduling'

const WEEK_MILLIS = 604_800_000
const DAY_MILLIS = 86_400_000
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

    expect(next.toISOString()).toEqual(expected.toISOString())
  })
})

describe('#nextWeeklySchedule', () => {
  it('should compute the next weekly datetime', () => {
    {
      const schedule = { weeks: 1, weekday: 4 }
      const next = nextWeeklySchedule(timestamp, schedule.weeks)
      expect(((next.getTime() - timestamp.getTime()) / schedule.weeks) % WEEK_MILLIS).toEqual(0)
    }

    {
      const schedule = { weeks: 2, weekday: 4 }
      const next = nextWeeklySchedule(timestamp, schedule.weeks)
      expect(((next.getTime() - timestamp.getTime()) / schedule.weeks) % WEEK_MILLIS).toEqual(0)
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

      const remainder = ((nextDate.getTime() - timestamp.getTime()) / schedule.weeks) % WEEK_MILLIS
      const expectedRemainder = Math.abs(nextDate.getDay() - timestamp.getDay()) * DAY_MILLIS

      expect(remainder).toEqual(expectedRemainder)
    }
  })
})
