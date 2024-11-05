import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { fragments } from '../utils'
import { withRedacted, withUnredacted } from './utils'

type TagPayload = typeof schema.tags.$inferInsert
type TagCreatePayload = Omit<TagPayload, 'updatedAt'>
type TagUpdatePayload = Omit<TagPayload, 'id' | 'createdAt'>

export class TagsRepository {
  constructor(private readonly db: SQLJsDatabase<typeof schema>) {}

  /**
   * Create a new `Tag` record in the database
   *
   * @param payload The data to create on the database
   * @returns The newly created `Tag`
   */
  create(payload: TagCreatePayload) {
    const result = this.db.insert(schema.tags).values({
      id: payload.id,
      label: payload.label,
      createdAt: payload.createdAt
    })

    const tag = result.returning().get()

    return tag
  }

  /**
   * Find a `Tag` by a given ID.
   *
   * If the tag is not found, return `undefined`
   *
   * @param id The ID of the `Tag` to find
   * @returns The `Tag` matching the provided ID, otherwise `undefined`
   */
  findById(id: string) {
    const result = this.db.select().from(schema.tags).where(eq(schema.tags.id, id))
    const tag = withUnredacted(result, schema.tags).get()

    return tag
  }

  /**
   * Find as many `Tag`s
   *
   * @returns A list of `Tag`s
   */
  findMany() {
    const result = this.db.select().from(schema.tags)
    const tags = withUnredacted(result, schema.tags).all()

    return tags
  }

  /**
   * Find a previously redacted `Tag` by a given ID
   *
   * If the tag is not found, return `undefined`
   *
   * @returns The **redacted** `Tag` matching the provided ID, otherwise `undefined`
   */
  findRedactedById(id: string) {
    const result = this.db.select().from(schema.tags).where(eq(schema.tags.id, id))
    const tags = withRedacted(result, schema.tags).all()

    return tags
  }

  /**
   * Find as many previously redacted `Tag`s
   *
   * @returns A list of previously **redacted** `Tag`s
   */
  findRedacted() {
    const result = this.db.select().from(schema.tags)
    const tags = withRedacted(result, schema.tags).all()

    return tags
  }

  /**
   * Update a `Tag` by a given ID, applying a patch to it
   *
   * @param id The ID of the `Tag` to update
   * @param patch The patch to apply to the `Tag`
   * @returns The updated `Tag`, with the patch applied
   */
  update(id: string, patch: Partial<TagUpdatePayload>) {
    const result = this.db
      .update(schema.tags)
      .set({ label: patch.label })
      .where(eq(schema.tags.id, id))

    return result.returning().get()
  }

  /**
   * Redact a `Tag` by a given ID, setting the deleted marker for it
   * to a non-nullable value, if it has not been set.
   *
   * @param id The ID of the `Tag` to redact
   * @returns The redacted `Tag`
   */
  redact(id: string) {
    const result = this.db
      .update(schema.tags)
      .set({ deletedAt: fragments.now })
      .where(and(eq(schema.tags.id, id), isNull(schema.tags.deletedAt)))

    const redacted = result.returning().get()

    return redacted
  }

  /**
   * Restore a previously redacted `Tag` by a given ID, unsetting the
   * deleted marker for it with a nullable value, if it has not been unset.
   *
   * @param id The ID of the `Tag` to restore
   * @returns The restored `Tag`
   */
  restore(id: string) {
    const result = this.db
      .update(schema.tags)
      .set({ deletedAt: null })
      .where(and(eq(schema.tags.id, id), isNotNull(schema.tags.deletedAt)))

    const restored = result.returning().get()

    return restored
  }

  /**
   * Delete a `Tag` by a given ID from the database.
   *
   * NOTE: This is a destructive action and there's no recovery from it
   * to perform a less destructive delete, see #{@link redact}
   *
   * @param id The ID of the `Tag` to delete
   * @returns The deleted `Tag`
   */
  delete(id: string) {
    const result = this.db.delete(schema.tags).where(eq(schema.tags.id, id))
    const deleted = result.returning().get()

    return deleted
  }
}
