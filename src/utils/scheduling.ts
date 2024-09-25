export type FrequencyType = 'hour' | 'day' | 'week' | 'month' | 'year' | 'custom' | 'never'

export type FrquencyMapping = { label: string; value: FrequencyType }
export type FrequencyGroup = { group: 'default' | 'custom'; items: Array<FrquencyMapping> }

export const frequencies: FrequencyGroup[] = [
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
]
