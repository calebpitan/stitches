import { relations } from 'drizzle-orm'
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { withDefaults } from './common'
import { completions } from './completions.schema'
import { timeSeries } from './timeseries.schema'
import { tagsToTasks } from './tags-to-tasks.schema'

export const tasks = sqliteTable(
  'tasks',
  withDefaults({
    title: text().notNull(),
    summary: text().default('').notNull(),
  }),
  (table) => {
    return {
      titleIdx: index('tasks_title_idx').on(table.title),
      summaryIdx: index('tasks_summary_idx').on(table.summary),
    }
  },
)

export const tasksRelations = relations(tasks, ({ many }) => {
  return {
    completions: many(completions), // one task, many completions
    timeSeries: many(timeSeries), // one task, many time_series
    tagsToTasks: many(tagsToTasks) // one task, many tags_to_tasks
  }
})
