import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { TagsToTaskAssociation } from './associations'
import { RepositoryFactory } from './factory'

export type TagsPayload = typeof schema.tags.$inferInsert
export type TagsCreatePayload = Omit<TagsPayload, 'updatedAt'>
export type TagsUpdatePayload = Omit<TagsPayload, 'id' | 'createdAt'>
export type TagsSelectResult = typeof schema.tags.$inferSelect

export class TagsRepository extends RepositoryFactory('tags', { table: schema.tags }) {
  /**
   * An association object for managing tags-to-tasks associations and can be
   * used for retrieving tasks associations on this repository by default
   */
  public readonly tasks: TagsToTaskAssociation<'tasks'>

  constructor(public readonly db: SQLJsDatabase<schema.Schema>) {
    super(db)
    this.tasks = new TagsToTaskAssociation(db)
  }
}
