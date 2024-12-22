import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { withDefaults } from './common'
import { tasks } from './tasks.schema'
import { timeSeries } from './timeseries.schema'

/**
 * A schema for marking and recording task completions for tasks
 * and thier respective time series in the current frame of completion
 *
 * The time series serves a historical purpose of tracing back what due
 * times were recorded for a task, and a completion complements that record
 * by providing a historical record for what tasks were completed in their
 * due time.
 */
export const completions = sqliteTable(
  'completions',
  withDefaults({
    /**
     * A denormalized column that references the task that was completed
     */
    taskId: text()
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),

    /**
     * A reference to the time series of the task that was completed
     */
    timeSeriesId: text()
      .notNull()
      .unique()
      .references(() => timeSeries.id, { onDelete: 'cascade' }),
    completedAt: integer({ mode: 'timestamp_ms' }).notNull(),
  }),
)

export const completionsRelations = relations(completions, ({ one }) => {
  return {
    task: one(tasks, { fields: [completions.taskId], references: [tasks.id] }),
    timeSeries: one(timeSeries, {
      fields: [completions.timeSeriesId],
      references: [timeSeries.id],
    }),
  }
})
