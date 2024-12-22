import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

import { withDefaults } from './common'
import { completions } from './completions.schema'
import { tasks } from './tasks.schema'

export const timeSeries = sqliteTable(
  'time_series',
  withDefaults({
    /**
     * The ID of the task that has this time series
     */
    taskId: text()
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),

    /**
     * The time when the task was due
     */
    dueAt: integer({ mode: 'timestamp_ms' }).notNull(),
  }),
  (t) => {
    return {
      uniqueTimeSeriesPerTask: unique().on(t.taskId, t.dueAt),
    }
  },
)

export const timeSeriesRelations = relations(timeSeries, ({ one }) => {
  return {
    task: one(tasks, { fields: [timeSeries.taskId], references: [tasks.id] }), // many time series, one task
    completion: one(completions), // one time series, one completion, nullable
  }
})
