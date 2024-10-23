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
export type Ordinals = 'First' | 'Second' | 'Third' | 'Fourth' | 'Fifth' | 'Last'
export type OrdinalsAlt = '1st' | '2nd' | '3rd' | '4th' | '5th' | 'Last'

export type FrquencyMapping = { label: string; value: FrequencyType }
export type FrequencyGroup = { group: 'default' | 'custom'; items: Array<FrquencyMapping> }

export type WeekdayOption = { alt: WeekdayShort; value: number; label: Weekday }
export type MonthOption = { alt: MonthShort; value: number; label: Month }

export type OrdinalsMapping = {
  label: Ordinals
  alt: OrdinalsAlt
  value: Lowercase<Ordinals>
}
export type OrdinalsGroup = { group: 'default' | 'others'; items: Array<OrdinalsMapping> }

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
  { alt: 'Sun', value: 7, label: 'Sunday' }
])

export const MONTH_OPTIONS: readonly MonthOption[] = Object.freeze([
  { alt: 'Jan', value: 1, label: 'January' },
  { alt: 'Feb', value: 2, label: 'February' },
  { alt: 'Mar', value: 3, label: 'March' },
  { alt: 'Apr', value: 4, label: 'April' },
  { alt: 'May', value: 5, label: 'May' },
  { alt: 'Jun', value: 6, label: 'June' },
  { alt: 'Jul', value: 7, label: 'July' },
  { alt: 'Aug', value: 8, label: 'August' },
  { alt: 'Sep', value: 9, label: 'September' },
  { alt: 'Oct', value: 10, label: 'October' },
  { alt: 'Nov', value: 11, label: 'November' },
  { alt: 'Dec', value: 12, label: 'December' }
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
