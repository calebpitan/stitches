import { relations } from 'drizzle-orm'
import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { tags } from './tags.schema'
import { tasks } from './tasks.schema'

export const tagsToTasks = sqliteTable(
  'tags_to_tasks',
  {
    tagId: text()
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    taskId: text()
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.tagId, table.taskId] }),
    }
  },
)

export const tagsToTasksRelations = relations(tagsToTasks, ({ one }) => {
  return {
    tag: one(tags, { fields: [tagsToTasks.tagId], references: [tags.id] }),
    task: one(tasks, { fields: [tagsToTasks.taskId], references: [tasks.id] }),
  }
})
