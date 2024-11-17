import type { FirstUpper } from '../types'
import { never } from '../utils'

export type FrequencyType = 'hour' | 'day' | 'week' | 'month' | 'year' | 'custom' | 'never'
export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'
export type WeekdayShort = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
export type WeekdayVariable = 'day' | 'weekday' | 'weekend-day'
export type Month =
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December'
export type MonthShort =
  | 'Jan'
  | 'Feb'
  | 'Mar'
  | 'Apr'
  | 'May'
  | 'Jun'
  | 'Jul'
  | 'Aug'
  | 'Sep'
  | 'Oct'
  | 'Nov'
  | 'Dec'
export type Ordinals = 'first' | 'second' | 'third' | 'fourth' | 'fifth' | 'last'
export type OrdinalsAlt = '1st' | '2nd' | '3rd' | '4th' | '5th' | 'last'

export type FrquencyMapping = { label: string; value: FrequencyType }
export type FrequencyGroup = { group: 'default' | 'custom'; items: Array<FrquencyMapping> }

export type WeekdayOption = { alt: WeekdayShort; value: number; label: Weekday }
export type MonthOption = { alt: MonthShort; value: number; label: Month }

export type OrdinalsMapping = {
  label: FirstUpper<Ordinals>
  alt: FirstUpper<OrdinalsAlt>
  value: Ordinals
}
export type OrdinalsGroup = { group: 'default' | 'others'; items: Array<OrdinalsMapping> }

export type WeekdayCustomMapping = {
  alt: string
  label: string
  value: WeekdayVariable
}

export type WeekdayGroup =
  | { group: 'default'; items: Array<WeekdayOption> }
  | { group: 'variable'; items: Array<WeekdayCustomMapping> }

export const FREQUENCY_OPTIONS_GROUP: readonly FrequencyGroup[] = Object.freeze([
  {
    group: 'default',
    items: [
      { label: 'Never', value: 'never' },
      { label: 'Hourly', value: 'hour' },
      { label: 'Daily', value: 'day' },
      { label: 'Weekly', value: 'week' },
      { label: 'Monthly', value: 'month' },
      { label: 'Yearly', value: 'year' }
    ]
  },
  {
    group: 'custom',
    items: [{ label: 'Custom', value: 'custom' }]
  }
])

export const WEEKDAY_OPTIONS: readonly WeekdayOption[] = Object.freeze([
  { alt: 'Mon', value: 1, label: 'Monday' },
  { alt: 'Tue', value: 2, label: 'Tuesday' },
  { alt: 'Wed', value: 3, label: 'Wednesday' },
  { alt: 'Thu', value: 4, label: 'Thursday' },
  { alt: 'Fri', value: 5, label: 'Friday' },
  { alt: 'Sat', value: 6, label: 'Saturday' },
  { alt: 'Sun', value: 0, label: 'Sunday' }
])

export const WEEKDAY_OPTIONS_GROUP: readonly WeekdayGroup[] = Object.freeze([
  { group: 'default', items: WEEKDAY_OPTIONS.slice() },
  {
    group: 'variable',
    items: [
      { alt: 'day', value: 'day', label: 'Day' },
      { alt: 'weekday', value: 'weekday', label: 'Weekday' },
      { alt: 'weekend day', value: 'weekend-day', label: 'Weekend day' }
    ]
  }
])

export const MONTH_OPTIONS: readonly MonthOption[] = Object.freeze([
  { alt: 'Jan', value: 0, label: 'January' },
  { alt: 'Feb', value: 1, label: 'February' },
  { alt: 'Mar', value: 2, label: 'March' },
  { alt: 'Apr', value: 3, label: 'April' },
  { alt: 'May', value: 4, label: 'May' },
  { alt: 'Jun', value: 5, label: 'June' },
  { alt: 'Jul', value: 6, label: 'July' },
  { alt: 'Aug', value: 7, label: 'August' },
  { alt: 'Sep', value: 8, label: 'September' },
  { alt: 'Oct', value: 9, label: 'October' },
  { alt: 'Nov', value: 10, label: 'November' },
  { alt: 'Dec', value: 11, label: 'December' }
])

export const ORDINAL_OPTIONS_GROUP: readonly OrdinalsGroup[] = Object.freeze([
  {
    group: 'default',
    items: [
      { alt: '1st', label: 'First', value: 'first' },
      { alt: '2nd', label: 'Second', value: 'second' },
      { alt: '3rd', label: 'Third', value: 'third' },
      { alt: '4th', label: 'Fourth', value: 'fourth' },
      { alt: '5th', label: 'Fifth', value: 'fifth' }
    ]
  },
  {
    group: 'others',
    items: [{ label: 'Last', alt: 'Last', value: 'last' }]
  }
])

export function ordinalToUint8(ordinal: Ordinals) {
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
