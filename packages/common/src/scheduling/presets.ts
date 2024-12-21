import type { FirstUpper } from '../types'
import { evaluate, never, range, unique } from '../utils'

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
      { label: 'Yearly', value: 'year' },
    ],
  },
  {
    group: 'custom',
    items: [{ label: 'Custom', value: 'custom' }],
  },
])

export const WEEKDAY_OPTIONS: readonly WeekdayOption[] = Object.freeze([
  { alt: 'Mon', value: 1, label: 'Monday' },
  { alt: 'Tue', value: 2, label: 'Tuesday' },
  { alt: 'Wed', value: 3, label: 'Wednesday' },
  { alt: 'Thu', value: 4, label: 'Thursday' },
  { alt: 'Fri', value: 5, label: 'Friday' },
  { alt: 'Sat', value: 6, label: 'Saturday' },
  { alt: 'Sun', value: 0, label: 'Sunday' },
])

export const WEEKDAY_OPTIONS_GROUP: readonly WeekdayGroup[] = Object.freeze([
  { group: 'default', items: WEEKDAY_OPTIONS.slice() },
  {
    group: 'variable',
    items: [
      { alt: 'day', value: 'day', label: 'Day' },
      { alt: 'weekday', value: 'weekday', label: 'Weekday' },
      { alt: 'weekend day', value: 'weekend-day', label: 'Weekend day' },
    ],
  },
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
  { alt: 'Dec', value: 11, label: 'December' },
])

export const ORDINAL_OPTIONS_GROUP: readonly OrdinalsGroup[] = Object.freeze([
  {
    group: 'default',
    items: [
      { alt: '1st', label: 'First', value: 'first' },
      { alt: '2nd', label: 'Second', value: 'second' },
      { alt: '3rd', label: 'Third', value: 'third' },
      { alt: '4th', label: 'Fourth', value: 'fourth' },
      { alt: '5th', label: 'Fifth', value: 'fifth' },
    ],
  },
  {
    group: 'others',
    items: [{ label: 'Last', alt: 'Last', value: 'last' }],
  },
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

type OrdinalConstantWeekday = { ordinal: Ordinals; weekday: number }
type OrdinalWeekday = { ordinal: Ordinals; weekday: number | WeekdayVariable }
type DateLike = ImutDate | Date

type ImutDateParams<P, S> = P extends [infer V, ...infer Rest] ? [value: V | S, ...Rest] : never

const HOUR_MILLIS = 3_600_000
const DAY_MILLIS = 86_400_000
const WEEK_MILLIS = 604_800_000
const DOY = 365
const MOY = 12
const DOW = 7
const INDEXED_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const
const ORDINAL_OFFSET_MAP = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4 } as const

export class ImutDate extends Date {
  private error: Error | null = null

  static from(...args: ImutDateParams<ConstructorParameters<typeof Date>, DateLike>) {
    if (args[0] instanceof ImutDate) return new ImutDate(args[0].getTime())
    return new ImutDate(...(args as ConstructorParameters<typeof Date>))
  }

  static invalid(msg: string) {
    const d = ImutDate.from(NaN)
    d.error = new Error(msg)
    return d
  }

  static toDate(imut: ImutDate): Date {
    return ImutDate.prototype.toDate.call(imut)
  }

  toDate(): Date {
    return new Date(this.getTime())
  }

  unwrap(): ImutDate | Error {
    if (this.error) return this.error
    return this
  }

  // @ts-expect-error
  override setDate(date: number): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setDate(date))
  }

  // @ts-expect-error
  override setFullYear(...args: Parameters<Date['setFullYear']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setFullYear(...args))
  }

  // @ts-expect-error
  override setHours(...args: Parameters<Date['setHours']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setHours(...args))
  }

  // @ts-expect-error
  override setMilliseconds(ms: number): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setMilliseconds(ms))
  }

  // @ts-expect-error
  override setMinutes(...args: Parameters<Date['setMinutes']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setMinutes(...args))
  }

  // @ts-expect-error
  override setMonth(...args: Parameters<Date['setMonth']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setMonth(...args))
  }

  // @ts-expect-error
  override setSeconds(...args: Parameters<Date['setSeconds']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setSeconds(...args))
  }

  // @ts-expect-error
  override setTime(time: number): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setTime(time))
  }

  // @ts-expect-error
  override setUTCDate(date: number): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setUTCDate(date))
  }

  // @ts-expect-error
  override setUTCFullYear(...args: Parameters<Date['setUTCFullYear']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setUTCFullYear(...args))
  }

  // @ts-expect-error
  override setUTCHours(...args: Parameters<Date['setUTCHours']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setUTCHours(...args))
  }

  // @ts-expect-error
  override setUTCMilliseconds(ms: number): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setUTCMilliseconds(ms))
  }

  // @ts-expect-error
  override setUTCMinutes(...args: Parameters<Date['setUTCMinutes']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setUTCMinutes(...args))
  }

  // @ts-expect-error
  override setUTCMonth(...args: Parameters<Date['setUTCMonth']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setUTCMonth(...args))
  }

  // @ts-expect-error
  override setUTCSeconds(...args: Parameters<Date['setUTCSeconds']>): ImutDate {
    const d = new Date(this.getTime())
    return ImutDate.from(d.setUTCSeconds(...args))
  }
}

export function getCurrentMillis() {
  return ImutDate.now()
}

export function getCurrentDateTime() {
  return new ImutDate()
}

/**
 * Get the total number of days in a given month.
 *
 * The only reason the year is required is for the sake of february which could have 29
 *
 * @param year The year of the month to get days for
 * @param month The month to get the total days in
 * @returns The total number of days in the given month
 */
export function getDaysInYearMonth(year: number, month: number) {
  return isLeapMonth({ year, month }) ? INDEXED_MONTH_DAYS[month] + 1 : INDEXED_MONTH_DAYS[month]
}

/**
 * Get the next hourly date for a nearest future schedule from the original schedule date
 * and a repeating frequency specified in hours
 *
 * @param anchortime The timestamp at which the original schedule is anchored at
 * @param hours The repeating frequency of hours
 * @returns The next hourly date for a nearest future schedule
 */
export function nextHourlySchedule(anchortime: DateLike, hours: number) {
  anchortime = ImutDate.from(anchortime)

  const hoursMillis = HOUR_MILLIS * hours
  const currentMillis = getCurrentMillis()
  const anchorMillis = anchortime.getTime()

  if (anchorMillis >= currentMillis) return ImutDate.from(anchorMillis + hoursMillis)

  const elapsed = currentMillis - anchorMillis
  const elapsedHoursFactor = elapsed / hoursMillis
  const nextHourFactor = Math.ceil(elapsedHoursFactor)
  const nextHourMillis = hoursMillis * nextHourFactor
  const nextMillis = anchorMillis + nextHourMillis

  return ImutDate.from(nextMillis)
}

/**
 * Get the next daily date for a nearest future schedule from the original schedule date
 * and a repeating frequency specified in days
 *
 * @param anchortime The timestamp at which the original schedule is anchored at
 * @param hours The repeating frequency of hours
 * @returns The next hourly date for a nearest future schedule
 */
export function nextDailySchedule(anchortime: DateLike, days: number) {
  anchortime = ImutDate.from(anchortime)

  const daysMillis = DAY_MILLIS * days
  const currentMillis = getCurrentMillis()
  const anchorMillis = anchortime.getTime()

  if (anchorMillis >= currentMillis) return ImutDate.from(anchorMillis + daysMillis)

  const elapsed = currentMillis - anchorMillis
  const elapsedDaysFactor = elapsed / daysMillis
  const nextDayFactor = Math.ceil(elapsedDaysFactor)
  const nextDayMillis = daysMillis * nextDayFactor
  const nextMillis = anchorMillis + nextDayMillis

  return ImutDate.from(nextMillis)
}

/**
 * Get the next weekly date for a nearest future shcedule from the original schedule date,
 * a repeating frequency specified in weeks.
 *
 * @param anchortime The timestmap at which the original schedule is anchored at
 * @param weeks The repeating frequency of week
 * @returns The date matching the schedule, if any, for a nearest future schedule
 */
export function nextWeeklySchedule(anchortime: DateLike, weeks: number): ImutDate
/**
 * Get the next weekly date for a nearest future shcedule from the original schedule date,
 * a repeating frequency specified in weeks and a list of days of the weeks to filter repitition
 * to only certain days of the week.
 *
 * @param anchortime The timestmap at which the original schedule is anchored at
 * @param weeks The repeating frequency of week
 * @param weekdays The chosen days of the week when the schedule should repeat
 * @returns A list of dates matching the schedule at chosen days of the week
 */
export function nextWeeklySchedule(
  anchortime: DateLike,
  weeks: number,
  weekdays: number[],
): ImutDate[]
export function nextWeeklySchedule(anchortime: DateLike, weeks: number, weekdays?: number[]) {
  anchortime = ImutDate.from(anchortime)

  if (!weekdays) {
    const result = nextWeeklySchedule.bringForward(anchortime, weeks)
    return result
  }

  return unique(weekdays)
    .map((w) => w % DOW)
    .map((weekday) => {
      const reftime = nextWeeklySchedule.setDayOfWeek(anchortime, weekday)
      return nextWeeklySchedule.bringForward(reftime, weeks)
    })
}

/**
 * Set the weekday or day of the week or day of a given date to the desired `weekday`
 * in the same week as the original date.
 *
 * ## Example
 *
 * ```
 * const weekday = 1 // Monday
 * const date = ImutDate.from('2024-12-06T15:09:00.005Z') // Friday
 * const actual = nextWeeklySchedule.setDayOfWeek(date, weekday)
 * {
 *    const expected = ImutDate.from('2024-12-02T15:09:00.005Z')
 *    console.assert(actual.getTime() === expected.getTime(), "Exepcted `actual` to be equal to `expected`")
 * }
 * ```
 *
 * @param d The datetime to set weekday or day of the week or day for
 * @param weekday The day of the week to set anchortime to
 * @returns A new time with the day of the week set to `weekday` in the same week
 */
// -ac + bc = -c(a - b);
// where
//   a = date.getDay()
//   b = weekday
//   c = DAY_MILLIS
nextWeeklySchedule.setDayOfWeek = (d: ImutDate, weekday: number): ImutDate =>
  ImutDate.from(d.getTime() - DAY_MILLIS * (d.getDay() - (weekday % DOW)))

/**
 * Fast-forward the given anchor time to the nearest future time when a repeating
 * weekly frequency specified as `every` will be.
 *
 * ## Note
 * Simply adds `every` number of weeks to anchor time if the current time is behind
 * the anchor time and returns it.
 *
 * @param anchortime The original anchor time of the schedule
 * @param every The weekly repeating frequency expression
 * @returns The fast-forwarded date from the anchor time
 */
nextWeeklySchedule.bringForward = (anchortime: ImutDate, every: number): ImutDate => {
  const weeksMillis = WEEK_MILLIS * every
  const currentMillis = getCurrentMillis()
  const anchorMillis = anchortime.getTime()

  if (anchorMillis >= currentMillis) return ImutDate.from(anchorMillis + weeksMillis)

  const elapsed = currentMillis - anchorMillis
  const elapsedWeeksFactor = elapsed / weeksMillis

  const nextWeekFactor = Math.ceil(elapsedWeeksFactor)
  const nextWeekMillis = weeksMillis * nextWeekFactor
  const nextMillis = anchorMillis + nextWeekMillis

  return ImutDate.from(nextMillis)
}

/**
 * Get the next monthly date for a nearest future shcedule from the original schedule date,
 * a repeating frequency specified in months, and days of the month to filter schedule to only
 * certain days of the month.
 *
 * @param anchortime The original anchor time of the schedule
 * @param every The monthly repeating frequency expression
 * @param days The days of the month for which the schedule should repeat
 * @returns A list of dates matching the schedule for the individual days of the month `days`
 */
export function nextMonthlySchedule(anchortime: DateLike, every: number, days: number[]): ImutDate[]
/**
 * Get the next monthly date for a nearest future shcedule from the original schedule date,
 * a repeating frequency specified in months, and ordinal weekdays to **dynamically** filter
 * schedule to only certain days of the month, based on what day of the month the specified
 * ordinal weekday falls on.
 *
 * @param anchortime The original anchor time of the schedule
 * @param every The monthly repeating frequency expression
 * @param ord The ordinal weekdays to use to determine days of the month for which the schedule should repeat
 * @returns The date matching the schedule for the computed day of the month (from ordinal weekdays)
 */
export function nextMonthlySchedule(
  anchortime: DateLike,
  every: number,
  ord: OrdinalConstantWeekday,
): ImutDate
export function nextMonthlySchedule(
  anchortime: DateLike,
  every: number,
  daysOrOrd: Array<number> | OrdinalConstantWeekday,
): ImutDate[] | ImutDate {
  anchortime = ImutDate.from(anchortime)

  const forwarded = nextMonthlySchedule.bringForward(anchortime, every)

  const [month, year] = [forwarded.getMonth(), forwarded.getFullYear()]
  const maxDayOfMonth = getDaysInYearMonth(year, month)

  if (Array.isArray(daysOrOrd)) {
    const daysOfMonth = daysOrOrd
    return unique(daysOfMonth)
      .filter((d) => d > 0 && d <= maxDayOfMonth)
      .map((dayOfMonth) => {
        const domOffset = forwarded.getDate() - dayOfMonth
        return ImutDate.from(forwarded.getTime() - domOffset * DAY_MILLIS)
      })
  }

  const ord = daysOrOrd

  switch (ord.ordinal) {
    case 'first':
    case 'second':
    case 'third':
    case 'fourth':
    case 'fifth': {
      const daysToWeeksOffset = DOW * ORDINAL_OFFSET_MAP[ord.ordinal]
      const { forwarded2, dowOffset } = evaluate(() => {
        let retries = 0
        let _maxDayOfMonth = maxDayOfMonth
        let _forwarded = forwarded.setDate(1)
        let _dowOffset: number = getDayOfWeekOffset(_forwarded, ord.weekday)
        let _dayOfMonth: number = _forwarded.getDate() + daysToWeeksOffset + _dowOffset

        while (_dayOfMonth > _maxDayOfMonth && retries++ < 100) {
          _forwarded = nextMonthlySchedule.bringForward(_forwarded, every).setDate(1)
          _maxDayOfMonth = getDaysInYearMonth(_forwarded.getFullYear(), _forwarded.getMonth())
          _dowOffset = getDayOfWeekOffset(_forwarded, ord.weekday)
          _dayOfMonth = _forwarded.getDate() + daysToWeeksOffset + _dowOffset
        }

        return {
          forwarded2: _forwarded,
          dowOffset: _dayOfMonth <= _maxDayOfMonth ? _dowOffset : undefined,
        }
      })

      if (dowOffset === undefined)
        return ImutDate.invalid('Cannot deterministically compute schedule')

      return ImutDate.from(forwarded2.getTime() + DAY_MILLIS * (daysToWeeksOffset + dowOffset))
    }
    case 'last': {
      const forwarded2 = forwarded.setDate(maxDayOfMonth)
      /// You may optimize away overhead of calling fn by checking if `forwarded2.getDay()` is already same as `ord.weekday`

      const dowOffset = getDayOfWeekOffset(forwarded2, ord.weekday)
      // The modulo at the end guarantees `DOW - 0` will always return `0` rather than `DOW`
      const dowOffsetReversed = (DOW - dowOffset) % DOW
      return ImutDate.from(forwarded2.getTime() - DAY_MILLIS * dowOffsetReversed)
    }
    default:
      return never(ord.ordinal)
  }
}

/**
 * Fast-forward the given anchor time to the nearest future time when a repeating
 * monthly frequency specified as `every` could be, no further than the month and year.
 *
 * ## Note
 * Simply adds `every` number of months to anchor time if the current time is behind
 * the anchor time and returns it.
 *
 * @param anchortime The original anchor time of the schedule
 * @param every The monthly repeating frequency expression
 * @returns The fast-forwarded date from the anchor time or undefined
 */
nextMonthlySchedule.bringForward = (anchortime: ImutDate, every: number): ImutDate => {
  const curtime = getCurrentDateTime()
  const [currentMonth, currentYear] = [curtime.getMonth(), curtime.getFullYear()]
  const [anchorMonth, anchorYear] = [anchortime.getMonth(), anchortime.getFullYear()]
  const monthsRemaining = getMonthsRemaining(every, {
    month: anchorMonth,
    year: anchorYear,
  })

  if (anchortime > curtime) {
    const t = anchorMonth + every
    const y = anchorYear + Math.floor(t / MOY)
    const m = t % MOY
    return anchortime.setFullYear(y, m, getDaysInYearMonth(y, m))
  }

  // This should never happen because `monthsRemaining` would only be undefined when
  // start month-year is greater than current month-year, and the above conditional
  // already implicitly accounts for that and returns early when that happens.
  // So whenever `monthsRemaining` is `undefined`, this function would already have returned
  if (monthsRemaining === undefined) never(never.never)

  // get days left in current month of the current year
  const remainingDaysInCurrentMonth =
    getDaysInYearMonth(currentYear, currentMonth) - curtime.getDate()

  const daysToMonthsRemaining = evaluate(() => {
    const yearsToMonthsRemaining = Math.floor(monthsRemaining / MOY)
    const remainderMonths = monthsRemaining % MOY

    // The moment the month is going to be beyond January for the end year, then it matters if it's a leap year
    const a = anchortime.getMonth() >= 1 ? 1 : 0

    const leapYearsBetween = getLeapYearsBetween(
      currentYear + 1,
      currentYear + a + yearsToMonthsRemaining,
      true,
    )

    // compute days in the "years to months remaining", and in the "remainder months" that aren't
    // enough to make up to at least a year. that is, if `monthsRemaining` is `16` then years to
    // months remaining is `int(16 / 12) = 1` and remainder months is `16 % 12 = 4` meaning 1yr 4mo.
    // so calculate days in 1 year from current year and check for leap years adding one to the days
    // for every leap year, then calculate days in 4 months from current month.

    const numberOfLeapYears = leapYearsBetween.length
    // get days in number of years till remaining months and adjust for leap years
    const daysInYearsToMonthsRemaining = DOY * yearsToMonthsRemaining + numberOfLeapYears
    let daysInRemainderMonths = 0

    {
      const startMonth = (currentMonth + 1) % MOY
      const endMonth = startMonth + remainderMonths
      // If the start month has overflown, therefore is now reset to zero, then initialize `n` to 1 to add to current year
      let n = startMonth === 0 ? 1 : 0 // currentMonth + 1 >= MOY ? 1 : 0
      for (const m of range(startMonth, endMonth)) {
        // For every time `m` overflows increment `n` to be added to the current year
        if (m >= MOY && m % MOY === 0) n++
        daysInRemainderMonths += getDaysInYearMonth(currentYear + n, m % MOY)
      }
    }

    return daysInYearsToMonthsRemaining + daysInRemainderMonths
  })

  const daysToNextSchedule = daysToMonthsRemaining + remainingDaysInCurrentMonth
  const daysToNextScheduleMillis = DAY_MILLIS * daysToNextSchedule

  return ImutDate.from(align(curtime.getTime(), anchortime.getTime()) + daysToNextScheduleMillis)
}

/**
 * Get the next yearly dates for a nearest future shcedule from the original schedule date,
 * a repeating frequency specified in year, months of the year for which the schedule should repeat,
 * and ordinal weekdays to either **statically** or **dynamically** filter schedule to only certain
 * days of the month, based on what day of the month the specified ordinal weekday falls on.
 *
 * @param anchortime The original anchor time of the schedule
 * @param every The yearly repeating frequency expression
 * @param months The months of the year for which the schedule should repeat
 * @param ord The ordinal static/constant or dynamic/variable days of the week for which the schedule should repeat
 * @returns A list of dates that match the specified schedule frequency expressions and/or undefined in some cases
 */
export function nextYearlySchedule(
  anchortime: DateLike,
  every: number,
  months: Array<number>,
  ord?: OrdinalWeekday,
) {
  anchortime = ImutDate.from(anchortime)

  const forwarded = nextYearlySchedule.bringForward(anchortime, every)
  const schedules = unique(months)
    .map((m) => m % MOY)
    .map((m) => forwarded.setMonth(m, getDaysInYearMonth(forwarded.getFullYear(), m)))

  if (!ord) return schedules

  return schedules.map((s) => {
    const [month, year] = [s.getMonth(), s.getFullYear()]
    const maxDayOfMonth = getDaysInYearMonth(year, month)

    switch (ord.ordinal) {
      case 'first':
      case 'second':
      case 'third':
      case 'fourth':
      case 'fifth': {
        const schedule = s.setDate(1)

        switch (ord.weekday) {
          case 'day': {
            const daysOffset = ORDINAL_OFFSET_MAP[ord.ordinal]
            return ImutDate.from(schedule.getTime() + daysOffset * DAY_MILLIS)
          }

          case 'weekday': {
            const weekdays = [1, 2, 3, 4, 5] // M T W T F
            const daysOffset = ORDINAL_OFFSET_MAP[ord.ordinal]
            const weekday = evaluate(() => {
              const indexOfFirstWeekday = weekdays.indexOf(schedule.getDay())
              if (indexOfFirstWeekday !== -1) {
                const indexOfWeekday = (indexOfFirstWeekday + daysOffset) % weekdays.length
                return weekdays[indexOfWeekday]
              }
              // if `weekdays` does not include the day of the week of the first day of the month,
              // then it is a weekend day and the first weekday would be `weekdays` at `[0]`;
              // second, `weekdays` at `[1]`...so `daysOffset` can be used to accurately index weekdays
              // to get the correct weekday.
              return weekdays[daysOffset]
            })

            const dowOffset = getDayOfWeekOffset(schedule, weekday)
            return ImutDate.from(schedule.getTime() + dowOffset * DAY_MILLIS)
          }

          case 'weekend-day': {
            const offset = ORDINAL_OFFSET_MAP[ord.ordinal]
            const [sun, sat] = [
              [0, getDayOfWeekOffset(schedule, 0)],
              [6, getDayOfWeekOffset(schedule, 6)],
            ] as const
            const closest = sat[1] < sun[1] ? sat : sun
            const daysOffset = evaluate(() => {
              const a = {
                get 0() {
                  const a = Math.ceil(offset / 2)
                  const b = offset % 2
                  const c = DOW * a - b
                  return c
                },
                get 6() {
                  const a = Math.floor(offset / 2)
                  const b = offset % 2
                  const c = DOW * a + b
                  return c
                },
              }
              return a[closest[0]] + closest[1]
            })
            const dayOfMonth = schedule.getDate() + daysOffset
            if (dayOfMonth > maxDayOfMonth) return undefined // consider recursion with a max-depth for backoff
            return ImutDate.from(schedule.getTime() + daysOffset * DAY_MILLIS)
          }

          default: {
            const dowOffset = getDayOfWeekOffset(schedule, ord.weekday)
            const daysToWeeksOffset = DOW * ORDINAL_OFFSET_MAP[ord.ordinal]
            const dayOfMonth = schedule.getDate() + daysToWeeksOffset + dowOffset
            if (dayOfMonth > maxDayOfMonth) return undefined // consider recursion with a max-depth for backoff
            return ImutDate.from(schedule.getTime() + (daysToWeeksOffset + dowOffset) * DAY_MILLIS)
          }
        }
      }
      case 'last': {
        const schedule = s.setDate(maxDayOfMonth)

        switch (ord.weekday) {
          case 'day': {
            return schedule
          }
          case 'weekday': {
            const weekday = schedule.getDay()
            if (weekday > 0 && weekday < 6) return schedule
            // 2 - ((7 - 6) % 7) = 1
            // 2 - ((7 - 0) % 7) = 2
            const daysOffset = 2 - ((DOW - weekday) % DOW)
            return ImutDate.from(schedule.getTime() - daysOffset * DAY_MILLIS)
          }
          case 'weekend-day': {
            /// You may optimize away overhead of calling fn by checking if `schedule.getDay()` is already one of 0 or 6

            // The modulo at the end guarantees `DOW - 0` will always return `0` rather than `DOW`
            const sunOffsetReversed = (DOW - getDayOfWeekOffset(schedule, 0)) % DOW
            const satOffsetReversed = (DOW - getDayOfWeekOffset(schedule, 6)) % DOW
            const dowOffsetReversed = Math.min(sunOffsetReversed, satOffsetReversed)
            return ImutDate.from(schedule.getTime() - dowOffsetReversed * DAY_MILLIS)
          }

          default: {
            // The modulo at the end guarantees `DOW - 0` will always return `0` rather than `DOW`
            const dowOffsetReversed = (DOW - getDayOfWeekOffset(schedule, ord.weekday)) % DOW
            return ImutDate.from(schedule.getTime() - dowOffsetReversed * DAY_MILLIS)
          }
        }
      }
      default:
        never(ord.ordinal)
    }
  })
}

/**
 * Fast-forward the given anchor time to the nearest future time when a repeating
 * yearly frequency specified as `every` could be, no further than the and year.
 *
 * ## Note
 * Simply adds `every` number of years to anchor time if the current time is behind
 * the anchor time and returns it.
 *
 * @param anchortime The original anchor time of the schedule
 * @param every The yearly repeating frequency expression
 * @returns The fast-forwarded date from the anchor time or undefined
 */
nextYearlySchedule.bringForward = (anchortime: ImutDate, every: number): ImutDate => {
  const curtime = getCurrentDateTime()
  const [currentMonth, currentYear] = [curtime.getMonth(), curtime.getFullYear()]
  const yearsRemaining = getYearsRemaining(every, { year: anchortime.getFullYear() })

  if (anchortime > curtime) {
    const y = anchortime.getFullYear() + every
    const m = anchortime.getMonth()
    return anchortime.setFullYear(y, m, getDaysInYearMonth(y, m))
  }

  if (yearsRemaining === undefined || anchortime > curtime) never(never.never)

  const daysToYearsRemaining = evaluate(() => {
    if (yearsRemaining === 0) return 0

    const leapYearsBetween = getLeapYearsBetween(
      currentYear + 1,
      currentYear + yearsRemaining,
      true,
    )

    const numberOfLeapYears = leapYearsBetween.length
    const daysInYearsRemaining = DOY * yearsRemaining + numberOfLeapYears

    return daysInYearsRemaining
  })

  const remainingDaysInCurrentYear = evaluate((): number => {
    // get days left in current month of the current year
    const remainingDaysInCurrentMonth =
      getDaysInYearMonth(currentYear, currentMonth) - curtime.getDate()
    let daysInRemainderMonths = 0

    {
      let n = 1
      const end = MOY - (currentMonth + n)
      while (n < end) {
        daysInRemainderMonths += getDaysInYearMonth(currentYear, currentMonth + n)
        n++
      }
    }

    return daysInRemainderMonths + remainingDaysInCurrentMonth
  })

  const daysToNextSchedule = daysToYearsRemaining + remainingDaysInCurrentYear
  const daysToNextScheduleMillis = DAY_MILLIS * daysToNextSchedule
  const forwarded = ImutDate.from(
    align(curtime.getTime(), anchortime.getTime()) + daysToNextScheduleMillis,
  )

  return forwarded
}

/**
 * Calculate the number of years left till a repeating yearly frequency specified as `every` will elapse
 * @param every The yearly repeating frequency
 * @param start An object specifying the start year of the repeating occasion
 * @returns The number of years left till another repeating frequency is due or undefined if the start is in the future
 */
export function getYearsRemaining(every: number, start: { year: number }) {
  const curtime = getCurrentDateTime()
  const end = { year: curtime.getFullYear() }
  if (end.year < start.year) return undefined

  const yearsElapsed = end.year - start.year
  // The modulo at the end guarantees `every - 0` will always return `0` rather than `every`
  return (every - (yearsElapsed % every)) % every
}

/**
 * Calculate the number of months left till a repeating monthly frequency specified as `every` will elapse
 * @param every The monthly repeating frequency
 * @param start An object specifying the start month and year of the repeating occasion
 * @returns The number of months left till another repeating frequency is due or undefined if the start is in the future
 */
export function getMonthsRemaining(every: number, start: { month: number; year: number }) {
  const MAX_MONTH = 12
  const curtime = getCurrentDateTime()
  const end = { month: curtime.getMonth(), year: curtime.getFullYear() }

  if (end.year < start.year) {
    // The inital schedule is still ahead of now
    return undefined
  }

  const monthDifference = end.month - start.month
  const yearDifference = end.year - start.year
  const monthsElapsed = monthDifference + MAX_MONTH * yearDifference

  // The modulo at the end guarantees `every - 0` will always return `0` rather than `every`
  return (every - (monthsElapsed % every)) % every
}

/**
 * Calculates an offset such that when applied to `date` places it on the specified `weekday` in the same
 * **month week** as the original date.
 *
 * ## NOTE
 * The idea of "month week" or even "year week" is not the same as just "week". Ideally, there are
 * ~52 weeks in a year and ~4 weeks in a month.
 * Every "week" starts on Sunday (or Monday, as the case may be). Conversely, a "year week" starts
 * on the first day of the year. Similarly, a "month week" starts on the first day of the month.
 *
 * @param date The datetime starting on the first or last day of the month
 * @param weekday The target weekday for which to calculate for what `nth` day of the month it is
 * @returns An offset such that when applied to `date` places it on the specified `weekday` in the same **month week**
 */
// Given:
//   a variable, `(a)`, day of the week, as the `1st` day of the month,
//   a variable, `(b)`, day of the week, as the target, `nth` day of the month
//   a constant, `(c)`, number of days of the week as `7`
//
// We need to find how many days from `(a)` is `(b)`.
//
// Take for instance:
//   a = 4 (Thu.)
//   b = 2 (Tue.)
// 0 1 2 3 4 5 6
// S M T W T F S
//         --->∙
// --->∙
//
// With a derivation:
//   x = (c - a + (b mod c)) mod c
//   x = (7 - a + (b mod 7)) mod 7
//   x = (7 - 4 + (2 mod 7)) mod 7
//   x = 5
//
// Which means from Thu. the 1st, we have 5 days to get to Tue., which will then be the 6th.
// To acheive the reverse, for example Thu. the 31st, we may do `7 - 5` to get to the last Tue.,
// which will then be the 29th.
const getDayOfWeekOffset = (date: ImutDate, weekday: number) =>
  (DOW - date.getDay() + (weekday % DOW)) % DOW

/**
 * Calculates and applies a correction factor, `b`, such that when added to `x2` makes the
 * difference between `x2` and `x1` modulo `86_400_000` equal zero.
 *
 * ## Correction Factor Derivations:
 * ```txt
 * b = round(a / c) * c - a
 * Where c = 86_400_000
 *       a = Δx mod c
 *       b = correction factor
 * ```
 *
 * @param x2 The leading timestamp in milliseconds that a correction factor should be applied to
 * @param x1 The trailing timestamp in milliseconds that when subtracted from `x2` mod `86_400_000` should equal zero
 * @returns A timestamp, `x3`, in milliseconds, with the correction factor applied
 */
function align(x2: number, x1: number) {
  // cf = round((dx % c) / c) * c - (dx % c)
  const c = 86_400_000
  const a = (x2 - x1) % c
  const b = Math.round(a / c) * c - a
  const x3 = x2 + b
  return x3
}

/**
 * Check if a given year is a leap year according to the Gregorian calendar
 * @param year The year to check for
 * @returns A boolean indicating whether the specified year is a leap year
 */
export function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

/**
 * Check if a given month is February using zero-based index for representing months of the year
 * @param month The month to check for
 * @returns A boolean indicating whether the specified month is February
 */
export function isFebruary(month: number): month is 1 {
  return month == 1
}

/**
 * Check if a given month is a leap month by checking whether the year is a leap year and the month
 * is February.
 *
 * @param opts An object options specifying the month and year to check for
 * @returns A boolean indicating whether the specified month is a leap month
 */
export function isLeapMonth(opts: { month: number; year: number }) {
  return isFebruary(opts.month) && isLeapYear(opts.year)
}

/**
 * Calculate the next leap year occuring after the specified year.
 *
 * @param year The start year from which to calculate the next leap year
 * @returns The next leap year from the specified year
 */
export function nextLeapYear(year: number) {
  let nextYearDivisibleBy4 = year + 1
  if (nextYearDivisibleBy4 % 4 !== 0) nextYearDivisibleBy4 += 4 - (nextYearDivisibleBy4 % 4)
  if (nextYearDivisibleBy4 % 100 === 0 && nextYearDivisibleBy4 % 400 !== 0)
    nextYearDivisibleBy4 += 4
  return nextYearDivisibleBy4
}

/**
 * Generate a list of leap years ranging from the specified start year to the end year.
 *
 * Whether to include both the start year and end year as part of the results if they happen
 * to be leap years themselves is customized using the `inclusive` option which is `false` by
 * default.
 *
 * @param startYear The start year
 * @param endYear The end year
 * @param inclusive Whether to include both the start and end year in the result if they happen to be leap years
 * @returns A list of leap years ranging from start year to end year, either inclusive or exclusive.
 */
export function getLeapYearsBetween(
  startYear: number,
  endYear: number,
  inclusive: boolean = false,
) {
  const leapYears: Array<number> = []

  // already implicitly guaranteed in loop condition, but better to return earlier
  if (startYear === endYear) return leapYears

  const start = inclusive ? startYear - 1 : startYear
  const end = inclusive ? endYear : endYear - 1

  {
    let year = start
    while ((year = nextLeapYear(year)) && year <= end) {
      leapYears.push(year)
    }
  }
  return leapYears
}
