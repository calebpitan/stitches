import { relations } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { withDefaults } from './common'
import { tagsToTasks } from './tags-to-tasks.schema'

export const tags = sqliteTable(
  'tags',
  withDefaults({
    label: text().notNull().unique(),
  }),
)

export const tagsRelations = relations(tags, ({ many }) => {
  return {
    tagsToTasks: many(tagsToTasks), // one tag, many tags_to_task
  }
})
