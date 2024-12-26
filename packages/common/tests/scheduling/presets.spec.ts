import { describe, expect, it } from 'vitest'

import {
  ImutDate,
  nextDailySchedule,
  nextHourlySchedule,
  nextMonthlySchedule,
  nextWeeklySchedule,
  nextYearlySchedule,
} from '../../src/scheduling/presets'

describe('scheduling/presets', () => {
  describe('#nextYearlySchedule', () => {
    const date = ImutDate.from('2023-10-23T10:32:40.005Z')

    it('should bring forward the anchortime to the next schedule date', () => {
      const forwarded = nextYearlySchedule.bringForward(ImutDate.from(Date.now()), date, 400)
      expect(forwarded).toStrictEqual(ImutDate.from('2423-12-31T10:32:40.005Z'))
    })

    it('should find the schedule for every `x` years in `m` months', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8])

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-31T10:32:40.005Z'),
        ImutDate.from('2030-03-31T10:32:40.005Z'),
        ImutDate.from('2030-05-31T10:32:40.005Z'),
        ImutDate.from('2030-07-31T10:32:40.005Z'),
        ImutDate.from('2030-09-30T10:32:40.005Z'),
      ])
    })

    ////////////////////////////////////////////
    // ConstantWeekday: 0,1,2,3,4,5,6
    ////////////////////////////////////////////

    it('should find the schedule for every `x` years in `m` months on first Sun.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'first',
        weekday: 0,
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-06T10:32:40.005Z'),
        ImutDate.from('2030-03-03T10:32:40.005Z'),
        ImutDate.from('2030-05-05T10:32:40.005Z'),
        ImutDate.from('2030-07-07T10:32:40.005Z'),
        ImutDate.from('2030-09-01T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on first Mon.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'first',
        weekday: 1,
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-07T10:32:40.005Z'),
        ImutDate.from('2030-03-04T10:32:40.005Z'),
        ImutDate.from('2030-05-06T10:32:40.005Z'),
        ImutDate.from('2030-07-01T10:32:40.005Z'),
        ImutDate.from('2030-09-02T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on first Wed.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'first',
        weekday: 3,
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-02T10:32:40.005Z'),
        ImutDate.from('2030-03-06T10:32:40.005Z'),
        ImutDate.from('2030-05-01T10:32:40.005Z'),
        ImutDate.from('2030-07-03T10:32:40.005Z'),
        ImutDate.from('2030-09-04T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on second Sun.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'second',
        weekday: 0,
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-13T10:32:40.005Z'),
        ImutDate.from('2030-03-10T10:32:40.005Z'),
        ImutDate.from('2030-05-12T10:32:40.005Z'),
        ImutDate.from('2030-07-14T10:32:40.005Z'),
        ImutDate.from('2030-09-08T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on second Tue.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'second',
        weekday: 2,
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-08T10:32:40.005Z'),
        ImutDate.from('2030-03-12T10:32:40.005Z'),
        ImutDate.from('2030-05-14T10:32:40.005Z'),
        ImutDate.from('2030-07-09T10:32:40.005Z'),
        ImutDate.from('2030-09-10T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on second Thu.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'second',
        weekday: 4,
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-10T10:32:40.005Z'),
        ImutDate.from('2030-03-14T10:32:40.005Z'),
        ImutDate.from('2030-05-09T10:32:40.005Z'),
        ImutDate.from('2030-07-11T10:32:40.005Z'),
        ImutDate.from('2030-09-12T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on fifth Sun.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'fifth',
        weekday: 0,
      })

      expect(schedules).toMatchObject([
        undefined,
        ImutDate.from('2030-03-31T10:32:40.005Z'),
        undefined,
        undefined,
        ImutDate.from('2030-09-29T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on fifth Fri.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'fifth',
        weekday: 5,
      })

      expect(schedules).toMatchObject([
        undefined,
        ImutDate.from('2030-03-29T10:32:40.005Z'),
        ImutDate.from('2030-05-31T10:32:40.005Z'),
        undefined,
        undefined,
      ])
    })

    it('should find the schedule for every `x` years in `m` months on fifth Sat.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'fifth',
        weekday: 6,
      })

      expect(schedules).toMatchObject([
        undefined,
        ImutDate.from('2030-03-30T10:32:40.005Z'),
        undefined,
        undefined,
        undefined,
      ])
    })

    it('should find the schedule for every `x` years in `m` months on last Tue.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'last',
        weekday: 2,
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-29T10:32:40.005Z'),
        ImutDate.from('2030-03-26T10:32:40.005Z'),
        ImutDate.from('2030-05-28T10:32:40.005Z'),
        ImutDate.from('2030-07-30T10:32:40.005Z'),
        ImutDate.from('2030-09-24T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on last Thu.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'last',
        weekday: 4,
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-31T10:32:40.005Z'),
        ImutDate.from('2030-03-28T10:32:40.005Z'),
        ImutDate.from('2030-05-30T10:32:40.005Z'),
        ImutDate.from('2030-07-25T10:32:40.005Z'),
        ImutDate.from('2030-09-26T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on last Sat.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'last',
        weekday: 6,
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-26T10:32:40.005Z'),
        ImutDate.from('2030-03-30T10:32:40.005Z'),
        ImutDate.from('2030-05-25T10:32:40.005Z'),
        ImutDate.from('2030-07-27T10:32:40.005Z'),
        ImutDate.from('2030-09-28T10:32:40.005Z'),
      ])
    })

    ////////////////////////////////////////////
    // VariableWeekday: Day
    ////////////////////////////////////////////

    it('should find the schedule for every `x` years in `m` months on first day.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'first',
        weekday: 'day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-01T10:32:40.005Z'),
        ImutDate.from('2030-03-01T10:32:40.005Z'),
        ImutDate.from('2030-05-01T10:32:40.005Z'),
        ImutDate.from('2030-07-01T10:32:40.005Z'),
        ImutDate.from('2030-09-01T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on second day.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'second',
        weekday: 'day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-02T10:32:40.005Z'),
        ImutDate.from('2030-03-02T10:32:40.005Z'),
        ImutDate.from('2030-05-02T10:32:40.005Z'),
        ImutDate.from('2030-07-02T10:32:40.005Z'),
        ImutDate.from('2030-09-02T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on third day.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'third',
        weekday: 'day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-03T10:32:40.005Z'),
        ImutDate.from('2030-03-03T10:32:40.005Z'),
        ImutDate.from('2030-05-03T10:32:40.005Z'),
        ImutDate.from('2030-07-03T10:32:40.005Z'),
        ImutDate.from('2030-09-03T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on fourth day.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'fourth',
        weekday: 'day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-04T10:32:40.005Z'),
        ImutDate.from('2030-03-04T10:32:40.005Z'),
        ImutDate.from('2030-05-04T10:32:40.005Z'),
        ImutDate.from('2030-07-04T10:32:40.005Z'),
        ImutDate.from('2030-09-04T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on fifth day.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'fifth',
        weekday: 'day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-05T10:32:40.005Z'),
        ImutDate.from('2030-03-05T10:32:40.005Z'),
        ImutDate.from('2030-05-05T10:32:40.005Z'),
        ImutDate.from('2030-07-05T10:32:40.005Z'),
        ImutDate.from('2030-09-05T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on last day.', () => {
      const schedules = nextYearlySchedule(date, 7, [1, 3, 5, 7, 9], {
        ordinal: 'last',
        weekday: 'day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-02-28T10:32:40.005Z'),
        ImutDate.from('2030-04-30T10:32:40.005Z'),
        ImutDate.from('2030-06-30T10:32:40.005Z'),
        ImutDate.from('2030-08-31T10:32:40.005Z'),
        ImutDate.from('2030-10-31T10:32:40.005Z'),
      ])
    })

    ////////////////////////////////////////////
    // VariableWeekday: Weekday
    ////////////////////////////////////////////
    it('should find the schedule for every `x` years in `m` months on first weekday.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'first',
        weekday: 'weekday',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-01T10:32:40.005Z'),
        ImutDate.from('2030-03-01T10:32:40.005Z'),
        ImutDate.from('2030-05-01T10:32:40.005Z'),
        ImutDate.from('2030-07-01T10:32:40.005Z'),
        ImutDate.from('2030-09-02T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on second weekday.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'second',
        weekday: 'weekday',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-02T10:32:40.005Z'),
        ImutDate.from('2030-03-04T10:32:40.005Z'),
        ImutDate.from('2030-05-02T10:32:40.005Z'),
        ImutDate.from('2030-07-02T10:32:40.005Z'),
        ImutDate.from('2030-09-03T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on third weekday.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'third',
        weekday: 'weekday',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-03T10:32:40.005Z'),
        ImutDate.from('2030-03-05T10:32:40.005Z'),
        ImutDate.from('2030-05-03T10:32:40.005Z'),
        ImutDate.from('2030-07-03T10:32:40.005Z'),
        ImutDate.from('2030-09-04T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on fourth weekday.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'fourth',
        weekday: 'weekday',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-04T10:32:40.005Z'),
        ImutDate.from('2030-03-06T10:32:40.005Z'),
        ImutDate.from('2030-05-06T10:32:40.005Z'),
        ImutDate.from('2030-07-04T10:32:40.005Z'),
        ImutDate.from('2030-09-05T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on fifth weekday.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'fifth',
        weekday: 'weekday',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-07T10:32:40.005Z'),
        ImutDate.from('2030-03-07T10:32:40.005Z'),
        ImutDate.from('2030-05-07T10:32:40.005Z'),
        ImutDate.from('2030-07-05T10:32:40.005Z'),
        ImutDate.from('2030-09-06T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on last weekday.', () => {
      const schedules = nextYearlySchedule(date, 7, [0, 2, 4, 6, 8], {
        ordinal: 'last',
        weekday: 'weekday',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-01-31T10:32:40.005Z'),
        ImutDate.from('2030-03-29T10:32:40.005Z'),
        ImutDate.from('2030-05-31T10:32:40.005Z'),
        ImutDate.from('2030-07-31T10:32:40.005Z'),
        ImutDate.from('2030-09-30T10:32:40.005Z'),
      ])
    })

    ////////////////////////////////////////////
    // VariableWeekday: Weekend Day
    ////////////////////////////////////////////

    it('should find the schedule for every `x` years in `m` months on first weekend-day.', () => {
      const schedules = nextYearlySchedule(date, 7, [1, 3, 5, 7, 9], {
        ordinal: 'first',
        weekday: 'weekend-day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-02-02T10:32:40.005Z'),
        ImutDate.from('2030-04-06T10:32:40.005Z'),
        ImutDate.from('2030-06-01T10:32:40.005Z'),
        ImutDate.from('2030-08-03T10:32:40.005Z'),
        ImutDate.from('2030-10-05T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on second weekend-day.', () => {
      const schedules = nextYearlySchedule(date, 7, [1, 3, 5, 7, 9], {
        ordinal: 'second',
        weekday: 'weekend-day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-02-03T10:32:40.005Z'),
        ImutDate.from('2030-04-07T10:32:40.005Z'),
        ImutDate.from('2030-06-02T10:32:40.005Z'),
        ImutDate.from('2030-08-04T10:32:40.005Z'),
        ImutDate.from('2030-10-06T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on third weekend-day.', () => {
      const schedules = nextYearlySchedule(date, 7, [1, 3, 5, 7, 9], {
        ordinal: 'third',
        weekday: 'weekend-day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-02-09T10:32:40.005Z'),
        ImutDate.from('2030-04-13T10:32:40.005Z'),
        ImutDate.from('2030-06-08T10:32:40.005Z'),
        ImutDate.from('2030-08-10T10:32:40.005Z'),
        ImutDate.from('2030-10-12T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on fourth weekend-day.', () => {
      const schedules = nextYearlySchedule(date, 7, [1, 3, 5, 7, 9], {
        ordinal: 'fourth',
        weekday: 'weekend-day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-02-10T10:32:40.005Z'),
        ImutDate.from('2030-04-14T10:32:40.005Z'),
        ImutDate.from('2030-06-09T10:32:40.005Z'),
        ImutDate.from('2030-08-11T10:32:40.005Z'),
        ImutDate.from('2030-10-13T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on fifth weekend-day.', () => {
      const schedules = nextYearlySchedule(date, 7, [1, 3, 5, 7, 9], {
        ordinal: 'fifth',
        weekday: 'weekend-day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-02-16T10:32:40.005Z'),
        ImutDate.from('2030-04-20T10:32:40.005Z'),
        ImutDate.from('2030-06-15T10:32:40.005Z'),
        ImutDate.from('2030-08-17T10:32:40.005Z'),
        ImutDate.from('2030-10-19T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` years in `m` months on last weekend-day.', () => {
      const schedules = nextYearlySchedule(date, 7, [1, 3, 5, 7, 9], {
        ordinal: 'last',
        weekday: 'weekend-day',
      })

      expect(schedules).toMatchObject([
        ImutDate.from('2030-02-24T10:32:40.005Z'),
        ImutDate.from('2030-04-28T10:32:40.005Z'),
        ImutDate.from('2030-06-30T10:32:40.005Z'),
        ImutDate.from('2030-08-31T10:32:40.005Z'),
        ImutDate.from('2030-10-27T10:32:40.005Z'),
      ])
    })
  })

  describe('#nextMonthlySchedule', () => {
    const date = ImutDate.from('2023-10-23T10:32:40.005Z')

    it.only('should generate', () => {
      const schedule1 = nextMonthlySchedule(date, 8, [1, 15, 31])
      const fn = (a: ImutDate[]) => {
        const b = Math.min(...a.filter((v) => v.getTime() > Date.now()).map((v) => v.getTime()))
        return ImutDate.from(b)
      }
      const schedule2 = nextMonthlySchedule(date, 8, [1, 15, 31], { curtime: fn(schedule1) })
      const schedule3 = nextMonthlySchedule(date, 8, [1, 15, 31], { curtime: fn(schedule2) })
      console.log(schedule2, schedule3)
    })

    it('should bring forward the anchortime to the next schedule date', () => {
      const forwarded = nextMonthlySchedule.bringForward(ImutDate.from(Date.now()), date, 60)
      expect(forwarded).toStrictEqual(ImutDate.from('2028-10-31T10:32:40.005Z'))
    })

    it('should find the schedule for every `x` months on `n` days', () => {
      const schedule1 = nextMonthlySchedule(date, 8, [1, 15, 31])
      const schedule2 = nextMonthlySchedule(date, 12, [13, 14, 31])
      const schedule3 = nextMonthlySchedule(date, 19, [10, 12, 31])
      const schedule4 = nextMonthlySchedule(date, 24, [21, 27, 31])
      const schedule5 = nextMonthlySchedule(date, 25, [3, 9, 31])
      const schedule6 = nextMonthlySchedule(date, 36, [23, 24, 31])

      expect(schedule1).toMatchObject([
        ImutDate.from('2025-02-01T10:32:40.005Z'),
        ImutDate.from('2025-02-15T10:32:40.005Z'),
      ])

      expect(schedule2).toMatchObject([
        ImutDate.from('2025-10-13T10:32:40.005Z'),
        ImutDate.from('2025-10-14T10:32:40.005Z'),
        ImutDate.from('2025-10-31T10:32:40.005Z'),
      ])

      expect(schedule3).toMatchObject([
        ImutDate.from('2025-05-10T10:32:40.005Z'),
        ImutDate.from('2025-05-12T10:32:40.005Z'),
        ImutDate.from('2025-05-31T10:32:40.005Z'),
      ])

      expect(schedule4).toMatchObject([
        ImutDate.from('2025-10-21T10:32:40.005Z'),
        ImutDate.from('2025-10-27T10:32:40.005Z'),
        ImutDate.from('2025-10-31T10:32:40.005Z'),
      ])

      expect(schedule5).toMatchObject([
        ImutDate.from('2025-11-03T10:32:40.005Z'),
        ImutDate.from('2025-11-09T10:32:40.005Z'),
      ])

      expect(schedule6).toMatchObject([
        ImutDate.from('2026-10-23T10:32:40.005Z'),
        ImutDate.from('2026-10-24T10:32:40.005Z'),
        ImutDate.from('2026-10-31T10:32:40.005Z'),
      ])
    })

    it('should find the schedule for every `x` months on the first Sun...Sat.', () => {
      // every 60 months on the 1st Sun. of the month
      const schedule1 = nextMonthlySchedule(date, 60, {
        ordinal: 'first',
        weekday: 0,
      })

      // every 60 months on the 1st Mon. of the month
      const schedule2 = nextMonthlySchedule(date, 60, {
        ordinal: 'first',
        weekday: 1,
      })

      // every 60 months on the 1st Tue. of the month
      const schedule3 = nextMonthlySchedule(date, 60, {
        ordinal: 'first',
        weekday: 2,
      })

      // every 60 months on the 1st Wed. of the month
      const schedule4 = nextMonthlySchedule(date, 60, {
        ordinal: 'first',
        weekday: 3,
      })

      // every 60 months on the 1st Thu. of the month
      const schedule5 = nextMonthlySchedule(date, 60, {
        ordinal: 'first',
        weekday: 4,
      })

      // every 60 months on the 1st Fri. of the month
      const schedule6 = nextMonthlySchedule(date, 60, {
        ordinal: 'first',
        weekday: 5,
      })

      // every 60 months on the 1st Sat. of the month
      const schedule7 = nextMonthlySchedule(date, 60, {
        ordinal: 'first',
        weekday: 6,
      })

      expect(schedule1).toStrictEqual(ImutDate.from('2028-10-01T10:32:40.005Z'))
      expect(schedule2).toStrictEqual(ImutDate.from('2028-10-02T10:32:40.005Z'))
      expect(schedule3).toStrictEqual(ImutDate.from('2028-10-03T10:32:40.005Z'))
      expect(schedule4).toStrictEqual(ImutDate.from('2028-10-04T10:32:40.005Z'))
      expect(schedule5).toStrictEqual(ImutDate.from('2028-10-05T10:32:40.005Z'))
      expect(schedule6).toStrictEqual(ImutDate.from('2028-10-06T10:32:40.005Z'))
      expect(schedule7).toStrictEqual(ImutDate.from('2028-10-07T10:32:40.005Z'))
    })

    it('should find the schedule for every `x` months on the second Sun...Sat.', () => {
      // every 60 months on the 2nd Sun. of the month
      const schedule1 = nextMonthlySchedule(date, 60, {
        ordinal: 'second',
        weekday: 0,
      })

      // every 60 months on the 2nd Mon. of the month
      const schedule2 = nextMonthlySchedule(date, 60, {
        ordinal: 'second',
        weekday: 1,
      })

      // every 60 months on the 2nd Tue. of the month
      const schedule3 = nextMonthlySchedule(date, 60, {
        ordinal: 'second',
        weekday: 2,
      })

      // every 60 months on the 2nd Wed. of the month
      const schedule4 = nextMonthlySchedule(date, 60, {
        ordinal: 'second',
        weekday: 3,
      })

      // every 60 months on the 2nd Thu. of the month
      const schedule5 = nextMonthlySchedule(date, 60, {
        ordinal: 'second',
        weekday: 4,
      })

      // every 60 months on the 2nd Fri. of the month
      const schedule6 = nextMonthlySchedule(date, 60, {
        ordinal: 'second',
        weekday: 5,
      })

      // every 60 months on the 2nd Sat. of the month
      const schedule7 = nextMonthlySchedule(date, 60, {
        ordinal: 'second',
        weekday: 6,
      })

      expect(schedule1).toStrictEqual(ImutDate.from('2028-10-08T10:32:40.005Z'))
      expect(schedule2).toStrictEqual(ImutDate.from('2028-10-09T10:32:40.005Z'))
      expect(schedule3).toStrictEqual(ImutDate.from('2028-10-10T10:32:40.005Z'))
      expect(schedule4).toStrictEqual(ImutDate.from('2028-10-11T10:32:40.005Z'))
      expect(schedule5).toStrictEqual(ImutDate.from('2028-10-12T10:32:40.005Z'))
      expect(schedule6).toStrictEqual(ImutDate.from('2028-10-13T10:32:40.005Z'))
      expect(schedule7).toStrictEqual(ImutDate.from('2028-10-14T10:32:40.005Z'))
    })

    it('should find the schedule for every `x` months on the third Sun...Sat.', () => {
      // every 60 months on the 3rd Sun. of the month
      const schedule1 = nextMonthlySchedule(date, 60, {
        ordinal: 'third',
        weekday: 0,
      })

      // every 60 months on the 3rd Mon. of the month
      const schedule2 = nextMonthlySchedule(date, 60, {
        ordinal: 'third',
        weekday: 1,
      })

      // every 60 months on the 3rd Tue. of the month
      const schedule3 = nextMonthlySchedule(date, 60, {
        ordinal: 'third',
        weekday: 2,
      })

      // every 60 months on the 3rd Wed. of the month
      const schedule4 = nextMonthlySchedule(date, 60, {
        ordinal: 'third',
        weekday: 3,
      })

      // every 60 months on the 3rd Thu. of the month
      const schedule5 = nextMonthlySchedule(date, 60, {
        ordinal: 'third',
        weekday: 4,
      })

      // every 60 months on the 3rd Fri. of the month
      const schedule6 = nextMonthlySchedule(date, 60, {
        ordinal: 'third',
        weekday: 5,
      })

      // every 60 months on the 3rd Sat. of the month
      const schedule7 = nextMonthlySchedule(date, 60, {
        ordinal: 'third',
        weekday: 6,
      })

      expect(schedule1).toStrictEqual(ImutDate.from('2028-10-15T10:32:40.005Z'))
      expect(schedule2).toStrictEqual(ImutDate.from('2028-10-16T10:32:40.005Z'))
      expect(schedule3).toStrictEqual(ImutDate.from('2028-10-17T10:32:40.005Z'))
      expect(schedule4).toStrictEqual(ImutDate.from('2028-10-18T10:32:40.005Z'))
      expect(schedule5).toStrictEqual(ImutDate.from('2028-10-19T10:32:40.005Z'))
      expect(schedule6).toStrictEqual(ImutDate.from('2028-10-20T10:32:40.005Z'))
      expect(schedule7).toStrictEqual(ImutDate.from('2028-10-21T10:32:40.005Z'))
    })

    it('should find the schedule for every `x` months on the fourth Sun...Sat.', () => {
      // every 60 months on the 4th Sun. of the month
      const schedule1 = nextMonthlySchedule(date, 60, {
        ordinal: 'fourth',
        weekday: 0,
      })

      // every 60 months on the 4th Mon. of the month
      const schedule2 = nextMonthlySchedule(date, 60, {
        ordinal: 'fourth',
        weekday: 1,
      })

      // every 60 months on the 4th Tue. of the month
      const schedule3 = nextMonthlySchedule(date, 60, {
        ordinal: 'fourth',
        weekday: 2,
      })

      // every 60 months on the 4th Wed. of the month
      const schedule4 = nextMonthlySchedule(date, 60, {
        ordinal: 'fourth',
        weekday: 3,
      })

      // every 60 months on the 4th Thu. of the month
      const schedule5 = nextMonthlySchedule(date, 60, {
        ordinal: 'fourth',
        weekday: 4,
      })

      // every 60 months on the 4th Fri. of the month
      const schedule6 = nextMonthlySchedule(date, 60, {
        ordinal: 'fourth',
        weekday: 5,
      })

      // every 60 months on the 4th Sat. of the month
      const schedule7 = nextMonthlySchedule(date, 60, {
        ordinal: 'fourth',
        weekday: 6,
      })

      expect(schedule1).toStrictEqual(ImutDate.from('2028-10-22T10:32:40.005Z'))
      expect(schedule2).toStrictEqual(ImutDate.from('2028-10-23T10:32:40.005Z'))
      expect(schedule3).toStrictEqual(ImutDate.from('2028-10-24T10:32:40.005Z'))
      expect(schedule4).toStrictEqual(ImutDate.from('2028-10-25T10:32:40.005Z'))
      expect(schedule5).toStrictEqual(ImutDate.from('2028-10-26T10:32:40.005Z'))
      expect(schedule6).toStrictEqual(ImutDate.from('2028-10-27T10:32:40.005Z'))
      expect(schedule7).toStrictEqual(ImutDate.from('2028-10-28T10:32:40.005Z'))
    })

    it('should find the schedule for every `x` months on the fifth Sun...Sat.', () => {
      // every 60 months on the 5th Sun. of the month
      const schedule1 = nextMonthlySchedule(date, 60, {
        ordinal: 'fifth',
        weekday: 0,
      })

      // every 60 months on the 5th Mon. of the month
      const schedule2 = nextMonthlySchedule(date, 60, {
        ordinal: 'fifth',
        weekday: 1,
      })

      // every 60 months on the 5th Tue. of the month
      const schedule3 = nextMonthlySchedule(date, 60, {
        ordinal: 'fifth',
        weekday: 2,
      })

      // every 60 months on the 5th Wed. of the month
      const schedule4 = nextMonthlySchedule(date, 60, {
        ordinal: 'fifth',
        weekday: 3,
      })

      // every 60 months on the 5th Thu. of the month
      const schedule5 = nextMonthlySchedule(date, 60, {
        ordinal: 'fifth',
        weekday: 4,
      })

      // every 60 months on the 5th Fri. of the month
      const schedule6 = nextMonthlySchedule(date, 60, {
        ordinal: 'fifth',
        weekday: 5,
      })

      // every 60 months on the 5th Sat. of the month
      const schedule7 = nextMonthlySchedule(date, 60, {
        ordinal: 'fifth',
        weekday: 6,
      })

      expect(schedule1).toStrictEqual(ImutDate.from('2028-10-29T10:32:40.005Z'))
      expect(schedule2).toStrictEqual(ImutDate.from('2028-10-30T10:32:40.005Z'))
      expect(schedule3).toStrictEqual(ImutDate.from('2028-10-31T10:32:40.005Z'))
      expect(schedule4).toStrictEqual(ImutDate.from('2053-10-29T10:32:40.005Z')) // the closest time every 60mo with 5 Wed's in Oct
      expect(schedule5).toStrictEqual(ImutDate.from('2043-10-29T10:32:40.005Z')) // the closest time every 60mo with 5 Thu's in Oct
      expect(schedule6).toStrictEqual(ImutDate.from('2038-10-29T10:32:40.005Z')) // the closest time every 60mo with 5 Fri's in Oct
      expect(schedule7).toStrictEqual(ImutDate.from('2033-10-29T10:32:40.005Z')) // the closest time every 60mo with 5 Sat's in Oct
    })

    it('should find the schedule for every `x` months on the last Sun...Sat.', () => {
      // every 60 months on the last Sun. of the month
      const schedule1 = nextMonthlySchedule(date, 60, {
        ordinal: 'last',
        weekday: 0,
      })

      // every 60 months on the last Mon. of the month
      const schedule2 = nextMonthlySchedule(date, 60, {
        ordinal: 'last',
        weekday: 1,
      })

      // every 60 months on the last Tue. of the month
      const schedule3 = nextMonthlySchedule(date, 60, {
        ordinal: 'last',
        weekday: 2,
      })

      // every 60 months on the last Wed. of the month
      const schedule4 = nextMonthlySchedule(date, 60, {
        ordinal: 'last',
        weekday: 3,
      })

      // every 60 months on the last Thu. of the month
      const schedule5 = nextMonthlySchedule(date, 60, {
        ordinal: 'last',
        weekday: 4,
      })

      // every 60 months on the last Fri. of the month
      const schedule6 = nextMonthlySchedule(date, 60, {
        ordinal: 'last',
        weekday: 5,
      })

      // every 60 months on the last Sat. of the month
      const schedule7 = nextMonthlySchedule(date, 60, {
        ordinal: 'last',
        weekday: 6,
      })

      expect(schedule1).toStrictEqual(ImutDate.from('2028-10-29T10:32:40.005Z'))
      expect(schedule2).toStrictEqual(ImutDate.from('2028-10-30T10:32:40.005Z'))
      expect(schedule3).toStrictEqual(ImutDate.from('2028-10-31T10:32:40.005Z'))
      expect(schedule4).toStrictEqual(ImutDate.from('2028-10-25T10:32:40.005Z'))
      expect(schedule5).toStrictEqual(ImutDate.from('2028-10-26T10:32:40.005Z'))
      expect(schedule6).toStrictEqual(ImutDate.from('2028-10-27T10:32:40.005Z'))
      expect(schedule7).toStrictEqual(ImutDate.from('2028-10-28T10:32:40.005Z'))
    })
  })

  describe('#nextWeeklySchedule', () => {
    const anchor = ImutDate.from('2024-12-06T15:09:00.005Z')

    it('should bring forward the anchor time to the next schedule date', () => {
      const result = nextWeeklySchedule.bringForward(ImutDate.from(Date.now()), anchor, 12)
      expect(result).toStrictEqual(ImutDate.from('2025-02-28T15:09:00.005Z'))
    })

    it('should find the schedule for every `x` weeks', () => {
      const result = nextWeeklySchedule(anchor, 13)

      expect(result).toBeDefined()
      expect(((result!.getTime() - anchor.getTime()) / (86_400_000 * 7)) % 13).toStrictEqual(0)
    })

    it('should find the schedule for every `x` weeks on specific days of the week', () => {
      const result = nextWeeklySchedule(anchor, 13, [0, 1, 2, 3, 4, 5, 6])

      expect(result).toMatchObject([
        ImutDate.from('2025-03-02T15:09:00.005Z'),
        ImutDate.from('2025-03-03T15:09:00.005Z'),
        ImutDate.from('2025-03-04T15:09:00.005Z'),
        ImutDate.from('2025-03-05T15:09:00.005Z'),
        ImutDate.from('2025-03-06T15:09:00.005Z'),
        ImutDate.from('2025-03-07T15:09:00.005Z'),
        ImutDate.from('2025-03-08T15:09:00.005Z'),
      ])
    })
  })

  describe('#nextDailySchedule', () => {
    const anchor = ImutDate.from('2024-12-06T15:09:00.005Z')

    it('should find the schedule for every `x` days', () => {
      const result = nextDailySchedule(anchor, 73)

      expect(((result.getTime() - anchor.getTime()) / 86_400_000) % 73).toStrictEqual(0)
    })
  })

  describe('#nextHourlySchedule', () => {
    const anchor = ImutDate.from('2024-12-06T15:09:00.005Z')

    it('should find the schedule for every `x` hours', () => {
      const result = nextHourlySchedule(anchor, 13)
      // assertion can be ambigous due to multiples, even other than 1 and 2.
      // 13, 26, 52, 65..., so in the fourth occurence 5 would be a factor and would be ambigous with 13
      expect(((result.getTime() - anchor.getTime()) / 3_600_000) % 13).toStrictEqual(0)
    })
  })
})
