import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { withDefaults } from './common'

export const tags = sqliteTable(
  'tags',
  withDefaults({
    label: text().notNull().unique()
  })
)
