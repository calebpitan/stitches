import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { TagsToTaskAssociation } from './associations'
import { RepositoryFactory } from './factory'

export type TaskPayload = typeof schema.tasks.$inferInsert
export type TaskCreatePayload = Omit<TaskPayload, 'updatedAt'>
export type TaskUpdatePayload = Omit<TaskPayload, 'id' | 'createdAt'>

export class TasksRepository extends RepositoryFactory('tasks', { table: schema.tasks }) {
  /**
   * An association object for managing tags-to-tasks associations and can be
   * used for retrieving tags associations on this repository by default
   */
  public readonly tags: TagsToTaskAssociation<'tags'>

  constructor(public readonly db: SQLJsDatabase<schema.Schema>) {
    super(db)
    this.tags = new TagsToTaskAssociation(db)
  }
}
