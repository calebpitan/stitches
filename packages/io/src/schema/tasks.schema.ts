import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { withDefaults } from './common'

export const tasks = sqliteTable(
  'tasks',
  withDefaults({
    title: text().notNull(),
    summary: text().default('').notNull()
  }),
  (table) => {
    return {
      titleIdx: index('tasks_title_idx').on(table.title),
      summaryIdx: index('tasks_summary_idx').on(table.summary)
    }
  }
)
