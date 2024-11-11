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

export function never(_: never): never {
  throw new Error(`Unimplemented for ${_}`)
}

export class TagsToTaskAssociation<R extends Relation = undefined> {
  constructor(private readonly db: SQLJsDatabase<schema.Schema>) {}

  async associations<T extends R | undefined = R>(
    id: string,
    ...args: T extends undefined ? [type?: undefined] : [type: T & R]
  ): Promise<Association<T>> {
    const [[type], tagIdEqId, taskIdEqId] = [
      args,
      eq(schema.tagsToTasks.tagId, id),
      eq(schema.tagsToTasks.taskId, id)
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
              tasks: result.map((v) => v.tasks)
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

  async associate(tag: string, task: string) {
    return await this.db.insert(schema.tagsToTasks).values({ tagId: tag, taskId: task }).execute()
  }

  async unassociate(tag: string, task: string) {
    return await this.db
      .delete(schema.tagsToTasks)
      .where(and(eq(schema.tagsToTasks.tagId, tag), eq(schema.tagsToTasks.taskId, task)))
      .execute()
  }
}
