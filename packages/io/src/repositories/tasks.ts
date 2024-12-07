import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { TagsToTaskAssociation } from './associations'
import { RepositoryAbstractFactory } from './factory'

export namespace task {
  export type Task = typeof schema.tasks.$inferSelect
}

export type TaskPayload = typeof schema.tasks.$inferInsert
export type TaskCreatePayload = Omit<TaskPayload, 'updatedAt'>
export type TaskUpdatePayload = Omit<TaskPayload, 'id' | 'createdAt'>

export class TasksRepository extends RepositoryAbstractFactory('tasks', { table: schema.tasks }) {
  /**
   * An association object for managing tags-to-tasks associations and can be
   * used for retrieving tags associations on this repository by default
   */
  public readonly tags: TagsToTaskAssociation<'tags'>

  constructor(public readonly _db: SQLJsDatabase<schema.Schema>) {
    super(_db)
    this.tags = new TagsToTaskAssociation(_db)
  }

  withSession(session: SQLJsDatabase<schema.Schema>): TasksRepository {
    return new TasksRepository(session)
  }
}
