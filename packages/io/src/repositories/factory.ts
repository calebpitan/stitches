import { pascalCase } from '@stitches/common'

import {
  InferInsertModel,
  InferSelectModel,
  and,
  eq,
  getTableName,
  isNotNull,
  isNull,
} from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { fragments } from '../utils'
import { Table, withRedacted, withUnredacted } from './utils'

export type RepositoryFactoryOptions<T extends Table> = {
  /**
   * The drizzle-orm table schema
   */
  table: T
  /**
   * An object that defines transforms for payload data
   */
  transforms?: {
    /**
     * Transform a create payload before inserting into the database.
     *
     * @param payload The data to be transformed
     * @returns The transformed payload
     */
    create?<P extends InferInsertModel<T>, R extends InferInsertModel<T>>(
      payload: Omit<P, 'updatedAt'>,
    ): R

    /**
     * Transform an update payload before setting into the database.
     *
     * @param payload The data to be transformed
     * @returns The transformed payload
     */
    update?<P extends InferInsertModel<T>, R extends InferInsertModel<T>>(
      payload: Partial<Omit<P, 'id' | 'createdAt'>>,
    ): R
  }
}

export function RepositoryFactory<S extends schema.Schema, T extends Table>(
  options: RepositoryFactoryOptions<T>,
) {
  type Model = InferSelectModel<T>
  type ModelPayload = InferInsertModel<T>

  class Repository {
    constructor(public readonly db: SQLJsDatabase<S>) {}

    /**
     * Create a new `Entity` record in the database
     *
     * @param payload The data to create on the database
     * @returns The newly created `Entity`
     */
    create<C extends ModelPayload>(payload: Omit<C, 'updatedAt'>[]): Promise<Model[]>
    create<C extends ModelPayload>(payload: Omit<C, 'updatedAt'>): Promise<Model>
    async create<C extends ModelPayload>(payload: C | C[]) {
      const transformer = options.transforms?.create
      const data =
        typeof transformer !== 'undefined'
          ? Array.isArray(payload)
            ? payload.map(transformer)
            : transformer(payload)
          : payload

      if (Array.isArray(data)) {
        const result = this.db.insert(options.table).values(data)
        return (await result.returning()) as Model[]
      }

      const result = this.db.insert(options.table).values(data)

      return (await result.returning()).at(0)! as Model
    }

    /**
     * Find an `Entity` by a given ID.
     *
     * If the entity is not found, return `undefined`
     *
     * @param id The ID of the `Entity` to find
     * @returns The `Entity` matching the provided ID, otherwise `undefined`
     */
    async findById(id: string) {
      const filters = withUnredacted(options.table, [eq(options.table.id, id)])
      const result = await this.db
        .select()
        .from(options.table)
        .where(and(...filters))
      const entity = result.at(0)

      return entity
    }

    /**
     * Find as many `Entities`
     *
     * @returns A list of `Entities`
     */
    async findMany() {
      const filters = withUnredacted(options.table, [])
      const entity = await this.db
        .select()
        .from(options.table)
        .where(and(...filters))

      return entity
    }

    /**
     * Find a previously redacted `Entity` by a given ID
     *
     * If the entity is not found, return `undefined`
     *
     * @returns The **redacted** `Entity` matching the provided ID, otherwise `undefined`
     */
    async findRedactedById(id: string) {
      const filters = withRedacted(options.table, [eq(options.table.id, id)])
      const result = await this.db
        .select()
        .from(options.table)
        .where(and(...filters))
      const entity = result.at(0)

      return entity
    }

    /**
     * Find as many previously redacted `Entities`
     *
     * @returns A list of previously **redacted** `Entities`
     */
    async findRedacted() {
      const filters = withRedacted(options.table, [])
      const entity = await this.db
        .select()
        .from(options.table)
        .where(and(...filters))

      return entity
    }

    /**
     * Update a `Entity` by a given ID, applying a patch to it
     *
     * @param id The ID of the `Entity` to update
     * @param patch The patch to apply to the `Entity`
     * @returns The updated `Entity`, with the patch applied
     */
    update<U extends ModelPayload>(id: string, patch: Partial<Omit<U, 'updatedAt'>>): Promise<Model>
    async update<U extends ModelPayload>(id: string, patch: Partial<U>) {
      const transformer = options.transforms?.update
      const data = typeof transformer !== 'undefined' ? transformer(patch) : patch

      const filters = withUnredacted(options.table, [eq(options.table.id, id)])

      const result = await this.db
        .update(options.table)
        .set(data as {})
        .where(and(...filters))
        .returning()

      const entity = result.at(0)

      return entity
    }

    /**
     * Redact an `Entity` by a given ID, setting the deleted marker for it
     * to a non-nullable value, if it has not been set.
     *
     * @param id The ID of the `Entity` to redact
     * @returns The redacted `Entity`
     */
    async redact(id: string) {
      const filters = [eq(options.table.id, id), isNull(options.table.deletedAt)]
      const result = await this.db
        .update(options.table)
        .set({ deletedAt: fragments.now } as any)
        .where(and(...filters))
        .returning()

      const redacted = result.at(0)

      return redacted
    }

    /**
     * Restore a previously redacted `Entity` by a given ID, unsetting the
     * deleted marker for it with a nullable value, if it has not been unset.
     *
     * @param id The ID of the `Entity` to restore
     * @returns The restored `Entity`
     */
    async restore(id: string) {
      const filters = [eq(options.table.id, id), isNotNull(options.table.deletedAt)]
      const result = await this.db
        .update(options.table)
        .set({ deletedAt: null } as any)
        .where(and(...filters))
        .returning()

      const restored = result.at(0)

      return restored
    }

    /**
     * Delete an `Entity` by a given ID from the database.
     *
     * NOTE: This is a destructive action and there's no recovery from it
     * to perform a less destructive delete, see #{@link redact}
     *
     * @param id The ID of the `Entity` to delete
     * @returns The deleted `Entity`
     */
    async delete(id: string) {
      const result = await this.db.delete(options.table).where(eq(options.table.id, id)).returning()
      const deleted = result.at(0)

      return deleted
    }
  }

  return Object.defineProperty(Repository, 'name', {
    value: pascalCase(getTableName(options.table)).concat('Repo'),
  })
}

// export class YamRepo extends RepositoryFactory({ table: schema.tasks }) {}

// const a = new YamRepo({} as SQLJsDatabase<schema.Schema>)
