import type { Ordinals } from '@stitches/common'

import { never } from './utils'

/**
 * Represent and ordianl value as an unsigned 8-bit integer.
 *
 * @param ordinal The oridnal value to represent as an unsigned 8-bit integer
 * @returns An unsigned 8-bit integer that represents the given ordinal value
 */
export function ordToU8(ordinal: Ordinals) {
  switch (ordinal) {
    case 'first':
      return 0x00
    case 'second':
      return 0x01
    case 'third':
      return 0x02
    case 'fourth':
      return 0x03
    case 'fifth':
      return 0x04
    case 'last':
      return 0xff
    default:
      never(ordinal)
  }
}

export function nextHourlySchedule(timestamp: Date, hours: number) {
  const hourMillis = 3_600_000 * hours
  const currentMillis = Date.now()
  const timestampMillis = timestamp.getTime()

  if (timestampMillis >= currentMillis) return timestamp

  const elapsed = currentMillis - timestampMillis
  const elapsedHoursFactor = elapsed / hourMillis
  const nextHourFactor = Math.ceil(elapsedHoursFactor)
  const nextHourMillis = hourMillis * nextHourFactor
  const nextMillis = timestampMillis + nextHourMillis

  return new Date(nextMillis)
}

export function nextDailySchedule(timestamp: Date, days: number) {
  const dayMillis = 86_400_000 * days
  const currentMillis = Date.now()
  const timestampMillis = timestamp.getTime()

  if (timestampMillis >= currentMillis) return timestamp

  const elapsed = currentMillis - timestampMillis
  const elapsedDaysFactor = elapsed / dayMillis
  const nextDayFactor = Math.ceil(elapsedDaysFactor)
  const nextDayMillis = dayMillis * nextDayFactor
  const nextMillis = timestampMillis + nextDayMillis

  return new Date(nextMillis)
}

// function nextDailySchedule(timestamp: Date, days: number) {
//   const DAY_MS = 86_400_000 * days
//   const currentMillis = Date.now()
//   const timestampMillis = timestamp.getTime()

//   if (timestampMillis >= currentMillis) return timestamp

//   const elapsed = currentMillis - timestampMillis
//   const elapsedDays = elapsed / DAY_MS
//   const nextDay = Math.sign(days) === -1 ? Math.floor(elapsedDays) : Math.ceil(elapsedDays)
//   const nextDayMillis = Math.abs(nextDay) * DAY_MS
//   const nextMillis = timestampMillis + nextDayMillis

//   return new Date(nextMillis)
// }

export function nextWeeklySchedule(timestamp: Date, weeks: number) {
  const weekMillis = 604_800_000 * weeks
  const currentMillis = Date.now()
  const timestampMillis = timestamp.getTime()

  if (timestampMillis >= currentMillis) return timestamp

  const elapsed = currentMillis - timestampMillis
  const elapsedWeeksFactor = elapsed / weekMillis
  const nextWeekFactor = Math.ceil(elapsedWeeksFactor)
  const nextWeekMillis = weekMillis * nextWeekFactor
  const nextMillis = timestampMillis + nextWeekMillis

  return new Date(nextMillis)
}

export function nextWeeklyScheduleCorrectionFactor(nextWeeklyTimestamp: Date, weekday: number) {
  // `nextWeeklySchedule` add `x` weeks to the originating timestamp.
  //
  // `let x = 1` [1wk; 604800000ms] such that:
  //
  // on Thu 24, Oct 2024, `nextWeeklySchedule("2024-10-24")` returns `"2024-10-31"`
  // which is a Thu 31, Oct 2024.
  //
  // But the user wants the event repeating every 1 week on a Tuesday (weekday = 2);
  // So we subtract Tuesday (weekday = 2) from Thursday (weekday = 4) to compute our
  // `weekdayOffset`.
  //
  // We go ahead and clone `nextWeeklyTimestamp`, setting date to be 31 + 2 * -1
  // which gives `29` and that's a Tuesday one week away from the past week of 24th
  const weekdayOffset = nextWeeklyTimestamp.getUTCDay() - weekday
  const newWeeklyTimestamp = new Date(nextWeeklyTimestamp.getTime())

  newWeeklyTimestamp.setDate(newWeeklyTimestamp.getDate() + weekdayOffset * -1)

  return newWeeklyTimestamp.getTime() / nextWeeklyTimestamp.getTime()
}

export function month(every: number, start: { month: number; year: number }) {
  const MAX_MONTH = 12
  const date = new Date()
  const end = { month: date.getMonth(), year: date.getFullYear() }

  if (end.year < start.year) {
    // The inital schedule is still ahead of now
    return
  }

  const monthDifference = end.month - start.month
  const yearDifference = end.year - start.year
  const monthsElapsed = monthDifference + MAX_MONTH * yearDifference

  return (every - (monthsElapsed % every)) % every
}
