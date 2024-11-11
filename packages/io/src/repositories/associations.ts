import { never } from '@stitches/common'

import { and, eq, or } from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'

type Relation = keyof Associations | undefined
type Associations = {
  tasks: Array<typeof schema.tasks.$inferSelect>
  tags: Array<typeof schema.tags.$inferSelect>
}
type Association<T extends Relation> = T extends undefined
  ? Associations
  : Record<Exclude<T, undefined>, Associations[Exclude<T, undefined>]>

export class TagsToTaskAssociation<R extends Relation = undefined> {
  constructor(private readonly db: SQLJsDatabase<schema.Schema>) {}

  /**
   * Retrieves all associations of an entity identified by the specified ID.
   *
   * For example in an occasion where task associations (tags) wants to be
   * retrieved, the task ID is passed as `id` and type is specified as `tags`
   *
   * Omitting the association type would retieve all the associations.
   *
   * @param id The ID of the entity whose associations should be fetched
   * @param args The type of association
   * @returns The list of associations based on the specified type
   */
  async associations<T extends R | undefined = R>(
    id: string,
    ...args: T extends undefined ? [type?: undefined] : [type: T & R]
  ): Promise<Association<T>> {
    const [[type], tagIdEqId, taskIdEqId] = [
      args,
      eq(schema.tagsToTasks.tagId, id),
      eq(schema.tagsToTasks.taskId, id),
    ] as const

    const filters =
      type === 'tasks' ? tagIdEqId : type === 'tags' ? taskIdEqId : or(tagIdEqId, taskIdEqId)!
    const query = this.db.select().from(schema.tagsToTasks).where(filters)

    switch (type) {
      case undefined: {
        const result = await query
          .innerJoin(schema.tasks, eq(schema.tagsToTasks.taskId, schema.tasks.id))
          .innerJoin(schema.tags, eq(schema.tagsToTasks.tagId, schema.tags.id))
          .then((result) => {
            const data: Association<undefined> = {
              tags: result.map((v) => v.tags),
              tasks: result.map((v) => v.tasks),
            }
            return data as Association<T>
          })

        return result
      }

      case 'tags': {
        const result = await query
          .innerJoin(schema.tags, eq(schema.tagsToTasks.tagId, schema.tags.id))
          .then((result) => {
            const data: Association<'tags'> = { tags: result.map((v) => v.tags) }
            return data as Association<T>
          })

        return result
      }

      case 'tasks': {
        const result = await query
          .innerJoin(schema.tasks, eq(schema.tagsToTasks.taskId, schema.tasks.id))
          .then((result) => {
            const data: Association<'tasks'> = { tasks: result.map((v) => v.tasks) }
            return data as Association<T>
          })

        return result
      }

      default:
        never(type)
    }
  }

  /**
   * Associate a task with a tag and a tag with a task (as a many-to-many relationship)
   *
   * @param tag The ID of the tag to associate with a task specified as ID as `task`
   * @param task The ID of the task to associate with a tag specifed as ID as `tag`
   * @returns A promise that resolves when successful, otherwise rejects
   */
  async associate(tag: string, task: string) {
    return await this.db.insert(schema.tagsToTasks).values({ tagId: tag, taskId: task }).execute()
  }

  /**
   * Unassociate a task with a tag and a tag with a task (dropping the many-to-many relationship)
   *
   * @param tag The ID of the tag to unassociate with a task specified as ID as `task`
   * @param task The ID of the task to associate with a tag specifed as ID as `tag`
   * @returns A promise that resolves when successful, otherwise rejects
   */
  async unassociate(tag: string, task: string) {
    return await this.db
      .delete(schema.tagsToTasks)
      .where(and(eq(schema.tagsToTasks.tagId, tag), eq(schema.tagsToTasks.taskId, task)))
      .execute()
  }
}
