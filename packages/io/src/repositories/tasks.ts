import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { fragments } from '../utils'
import { withRedacted, withUnredacted } from './utils'

export type TaskPayload = typeof schema.tasks.$inferInsert
export type TaskCreatePayload = Omit<TaskPayload, 'updatedAt'>
export type TaskUpdatePayload = Omit<TaskPayload, 'id' | 'createdAt'>

export class TasksRepository {
  constructor(private readonly db: SQLJsDatabase<schema.Schema>) {}

  /**
   * Create a new `Task` record in the database
   *
   * @param payload The data to create on the database
   * @returns The newly created record
   */
  create(payload: TaskCreatePayload[]): Promise<(typeof schema.tasks.$inferSelect)[]>
  create(payload: TaskCreatePayload): Promise<typeof schema.tasks.$inferSelect>
  async create(payload: TaskCreatePayload | TaskCreatePayload[]) {
    const toData = (payload: TaskCreatePayload) => ({
      id: payload.id,
      title: payload.title,
      summary: payload.summary,
      createdAt: payload.createdAt
    })

    const data = Array.isArray(payload) ? payload.map(toData) : toData(payload)

    if (Array.isArray(data)) {
      const result = this.db.insert(schema.tasks).values(data)
      return await result.returning()
    }

    const result = this.db.insert(schema.tasks).values(data)

    return (await result.returning()).at(0)!
  }

  /**
   * Find a `Task` by a given ID.
   *
   * If the task is not found, return `undefined`
   *
   * @param id The ID of the `Task` to find
   * @returns The `Task` matching the provided ID, otherwise `undefined`
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.tasks)
      .where(and(...withUnredacted(schema.tasks, [eq(schema.tasks.id, id)])))
    const task = result.at(0)

    return task
  }

  /**
   * Find as many `Task`s
   *
   * @returns A list of `Task`s
   */
  async findMany() {
    const tasks = await this.db
      .select()
      .from(schema.tasks)
      .where(and(...withUnredacted(schema.tasks, [])))

    return tasks
  }

  /**
   * Find a previously redacted `Task` by a given ID
   *
   * If the task is not found, return `undefined`
   *
   * @returns The **redacted** `Task` matching the provided ID, otherwise `undefined`
   */
  async findRedactedById(id: string) {
    const result = await this.db
      .select()
      .from(schema.tasks)
      .where(and(...withRedacted(schema.tasks, [eq(schema.tasks.id, id)])))
    const tasks = result.at(0)

    return tasks
  }

  /**
   * Find as many previously redacted `Task`s
   *
   * @returns A list of previously **redacted** `Task`s
   */
  async findRedacted() {
    const tasks = await this.db
      .select()
      .from(schema.tasks)
      .where(and(...withRedacted(schema.tasks, [])))

    return tasks
  }

  /**
   * Update a `Task` by a given ID, applying a patch to it
   *
   * @param id The ID of the `Task` to update
   * @param patch The patch to apply to the `Task`
   * @returns The updated `Task`, with the patch applied
   */
  async update(id: string, patch: Partial<TaskUpdatePayload>) {
    const result = await this.db
      .update(schema.tasks)
      .set({ title: patch.title, summary: patch.summary })
      .where(and(...withUnredacted(schema.tasks, [eq(schema.tasks.id, id)])))
      .returning()

    const task = result.at(0)

    return task
  }

  /**
   * Redact a `Task` by a given ID, setting the deleted marker for it
   * to a non-nullable value, if it has not been set.
   *
   * @param id The ID of the `Task` to redact
   * @returns The redacted `Task`
   */
  async redact(id: string) {
    const result = await this.db
      .update(schema.tasks)
      .set({ deletedAt: fragments.now })
      .where(and(eq(schema.tasks.id, id), isNull(schema.tasks.deletedAt)))
      .returning()

    const redacted = result.at(0)

    return redacted
  }

  /**
   * Restore a previously redacted `Task` by a given ID, unsetting the
   * deleted marker for it with a nullable value, if it has not been unset.
   *
   * @param id The ID of the `Task` to restore
   * @returns The restored `Task`
   */
  async restore(id: string) {
    const result = await this.db
      .update(schema.tasks)
      .set({ deletedAt: null })
      .where(and(eq(schema.tasks.id, id), isNotNull(schema.tasks.deletedAt)))
      .returning()

    const restored = result.at(0)

    return restored
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
  async delete(id: string) {
    const result = await this.db.delete(schema.tasks).where(eq(schema.tasks.id, id)).returning()
    const deleted = result.at(0)

    return deleted
  }
}
