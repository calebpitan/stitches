import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { fragments } from '../utils'
import { TagsToTaskAssociation } from './associations'
import { withRedacted, withUnredacted } from './utils'

type TagsPayload = typeof schema.tags.$inferInsert
type TagsCreatePayload = Omit<TagsPayload, 'updatedAt'>
type TagsUpdatePayload = Omit<TagsPayload, 'id' | 'createdAt'>
type TagsSelectResult = typeof schema.tags.$inferSelect

export class TagsRepository {
  /**
   * An association object for managing tags-to-tasks associations and can be
   * used for retrieving tasks associations on this repository by default
   */
  public readonly tasks: TagsToTaskAssociation<'tasks'>

  constructor(private readonly db: SQLJsDatabase<schema.Schema>) {
    this.tasks = new TagsToTaskAssociation(db)
  }

  /**
   * Create a new `Tag` record in the database
   *
   * @param payload The data to create on the database
   * @returns The newly created `Tag`
   */
  create(payload: TagsCreatePayload[]): Promise<TagsSelectResult[]>
  create(payload: TagsCreatePayload): Promise<TagsSelectResult>
  async create(payload: TagsCreatePayload | TagsCreatePayload[]) {
    const toData = (payload: TagsCreatePayload) => ({
      id: payload.id,
      label: payload.label,
      createdAt: payload.createdAt,
    })

    const data = Array.isArray(payload) ? payload.map(toData) : toData(payload)

    if (Array.isArray(data)) {
      const result = this.db.insert(schema.tags).values(data)
      return await result.returning()
    }

    const result = this.db.insert(schema.tags).values(data)

    return (await result.returning()).at(0)!
  }

  /**
   * Find a `Tag` by a given ID.
   *
   * If the tag is not found, return `undefined`
   *
   * @param id The ID of the `Tag` to find
   * @returns The `Tag` matching the provided ID, otherwise `undefined`
   */
  async findById(id: string) {
    const filters = withUnredacted(schema.tags, [eq(schema.tags.id, id)])
    const result = await this.db
      .select()
      .from(schema.tags)
      .where(and(...filters))
    const tags = result.at(0)

    return tags
  }

  /**
   * Find as many `Tag`s
   *
   * @returns A list of `Tag`s
   */
  async findMany() {
    const filters = withUnredacted(schema.tags, [])
    const tags = await this.db
      .select()
      .from(schema.tags)
      .where(and(...filters))

    return tags
  }

  /**
   * Find a previously redacted `Tag` by a given ID
   *
   * If the tag is not found, return `undefined`
   *
   * @returns The **redacted** `Tag` matching the provided ID, otherwise `undefined`
   */
  async findRedactedById(id: string) {
    const filters = withRedacted(schema.tags, [eq(schema.tags.id, id)])
    const result = await this.db
      .select()
      .from(schema.tags)
      .where(and(...filters))
    const tags = result.at(0)

    return tags
  }

  /**
   * Find as many previously redacted `Tag`s
   *
   * @returns A list of previously **redacted** `Tag`s
   */
  async findRedacted() {
    const filters = withRedacted(schema.tags, [])
    const tags = await this.db
      .select()
      .from(schema.tags)
      .where(and(...filters))

    return tags
  }

  /**
   * Update a `Tag` by a given ID, applying a patch to it
   *
   * @param id The ID of the `Tag` to update
   * @param patch The patch to apply to the `Tag`
   * @returns The updated `Tag`, with the patch applied
   */
  async update(id: string, patch: Partial<TagsUpdatePayload>) {
    const filters = withUnredacted(schema.tags, [eq(schema.tags.id, id)])
    const result = await this.db
      .update(schema.tags)
      .set({ label: patch.label })
      .where(and(...filters))
      .returning()

    const tags = result.at(0)

    return tags
  }

  /**
   * Redact a `Tag` by a given ID, setting the deleted marker for it
   * to a non-nullable value, if it has not been set.
   *
   * @param id The ID of the `Tag` to redact
   * @returns The redacted `Tag`
   */
  async redact(id: string) {
    const filters = [eq(schema.tags.id, id), isNull(schema.tags.deletedAt)]
    const result = await this.db
      .update(schema.tags)
      .set({ deletedAt: fragments.now })
      .where(and(...filters))
      .returning()

    const redacted = result.at(0)

    return redacted
  }

  /**
   * Restore a previously redacted `Tag` by a given ID, unsetting the
   * deleted marker for it with a nullable value, if it has not been unset.
   *
   * @param id The ID of the `Tag` to restore
   * @returns The restored `Tag`
   */
  async restore(id: string) {
    const filters = [eq(schema.tags.id, id), isNotNull(schema.tags.deletedAt)]
    const result = await this.db
      .update(schema.tags)
      .set({ deletedAt: null })
      .where(and(...filters))
      .returning()

    const restored = result.at(0)

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
  async delete(id: string) {
    const result = await this.db.delete(schema.tags).where(eq(schema.tags.id, id)).returning()
    const deleted = result.at(0)

    return deleted
  }
}
