import { eq } from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { fragments } from '../utils'
import { withUnredacted } from './utils'

type TaskPayload = typeof schema.tasks.$inferInsert
type TaskCreatePayload = Omit<TaskPayload, 'updatedAt'>
type TaskUpdatePayload = Omit<TaskPayload, 'id' | 'createdAt'>

export class TasksRepository {
  constructor(private readonly db: SQLJsDatabase<typeof schema>) {}

  /**
   * Create a new `Task` record in the database
   *
   * @param payload The data to create on the database
   * @returns The newly created record
   */
  create(payload: TaskCreatePayload) {
    const result = this.db.insert(schema.tasks).values({
      id: payload.id,
      title: payload.title,
      summary: payload.summary,
      createdAt: payload.createdAt
    })

    const task = result.returning().get()

    return task
  }

  /**
   * Find a `Task` by a given ID.
   *
   * If the task is not found, return `undefined`
   *
   * @param id The ID of the `Task` to find
   * @returns The `Task` matching the provided ID, otherwise `undefined`
   */
  findById(id: string) {
    const result = this.db.select().from(schema.tasks).where(eq(schema.tasks.id, id))
    const task = withUnredacted(result, schema.tasks).get()

    return task
  }

  /**
   * Update a `Task` by a given ID, applying a patch to it
   *
   * @param id The ID of the `Task` to update
   * @param patch The patch to apply to the `Task`
   * @returns The updated `Task`, with the patch applied
   */
  update(id: string, patch: Partial<TaskUpdatePayload>) {
    const result = this.db
      .update(schema.tasks)
      .set({ title: patch.title, summary: patch.summary })
      .where(eq(schema.tasks.id, id))

    return result.returning().get()
  }

  /**
   * Redact a `Task` by a given ID, setting the deleted marker for it
   * to a non-nullable value of `Date`.
   *
   * @param id The ID of the `Task` to redact
   * @returns The redacted `Task`
   */
  redact(id: string) {
    const result = this.db
      .update(schema.tasks)
      .set({ deletedAt: fragments.now })
      .where(eq(schema.tasks.id, id))

    const redacted = result.returning().get()

    return redacted
  }

  /**
   * Delete a `Task` by a given ID from the database.
   *
   * NOTE: This is a destructive action and there's no recovery from it
   * to perform a less destructive delete, see #{@link redact}
   *
   * @param id The ID of the `Task` to delete
   * @returns The deleted `Task`
   */
  delete(id: string) {
    const result = this.db.delete(schema.tasks).where(eq(schema.tasks.id, id))
    const deleted = result.returning().get()

    return deleted
  }
}
