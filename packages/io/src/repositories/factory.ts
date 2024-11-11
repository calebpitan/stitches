import { never, pascalCase } from '@stitches/common'

import { InferInsertModel, and, eq, getTableName, isNotNull, isNull } from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'
import { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'

import * as schema from '../schema'
import { fragments } from '../utils'
import { Table, withRedacted, withUnredacted } from './utils'

/**
 * Omits the relations schema keys
 */
type A<K extends keyof schema.Schema> = K extends `${string}Relations` ? never : K
/**
 * Infers the inner type of an `SQLiteTableWithColumns` so the columns type can be
 * reached
 */
type B<S extends schema.Schema, K extends A<keyof schema.Schema>> =
  S[K] extends SQLiteTableWithColumns<infer T> ? T : never
/**
 * Cleans up the return type for operations other than `SELECT` that are expected
 * to return a single entity
 */
type C<T extends Record<string, any>> = {
  [P in keyof T]: P extends keyof SQLiteColumn ? never : T[P]
}

export type RepositoryFactoryOptions<
  K extends A<keyof schema.Schema>,
  T extends Table<B<schema.Schema, K>['columns']>,
> = {
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

export function RepositoryFactory<
  K extends A<keyof schema.Schema>,
  T extends Table<B<schema.Schema, K>['columns']>,
  P extends InferInsertModel<T>,
>(_: K, options: RepositoryFactoryOptions<K, T>) {
  const identifier = pascalCase(getTableName(options.table)).concat('AbstractRepository')

  abstract class Repository {
    constructor(public readonly db: SQLJsDatabase<schema.Schema>) {}

    /**
     * Create a new `Entity` record in the database
     *
     * @param payload The data to create on the database
     * @returns The newly created `Entity`
     */
    create<C extends P>(payload: Omit<C, 'updatedAt'>[]): ReturnType<Repository['createMany']>
    create<C extends P>(payload: Omit<C, 'updatedAt'>): ReturnType<Repository['createOne']>
    async create(payload: P | P[]) {
      if (Array.isArray(payload)) {
        return await this.createMany(payload)
      }

      return await this.createOne(payload)
    }

    /**
     * Create a single new `Entity` record in the database
     *
     * @param payload The data to create on the database
     * @returns The newly created `Entity`
     */
    async createOne(payload: P) {
      const transformer = options.transforms?.create
      const data = typeof transformer !== 'undefined' ? transformer(payload) : payload

      const result = await this.db
        .insert(options.table)
        .values(data as any)
        .returning()

      const entity = result ? result.at(0)! : never(never.never)
      return entity as C<typeof entity>
    }

    /**
     * Create multiple of a new `Entity` record in the database
     *
     * @param payload The data to create on the database
     * @returns The newly created `Entity`
     */
    async createMany(payload: P[]) {
      const transformer = options.transforms?.create
      const data = typeof transformer !== 'undefined' ? payload.map(transformer) : payload

      const result = await this.db
        .insert(options.table)
        .values(data as any)
        .returning()

      return result ? result : never(never.never)
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
      const result = await this.db
        .select()
        .from(options.table)
        .where(and(...filters))

      return result
    }

    /**
     * Update a `Entity` by a given ID, applying a patch to it
     *
     * @param id The ID of the `Entity` to update
     * @param patch The patch to apply to the `Entity`
     * @returns The updated `Entity`, with the patch applied
     */
    async update<U extends P>(id: string, patch: Partial<U>) {
      const transformer = options.transforms?.update
      const data = typeof transformer !== 'undefined' ? transformer(patch) : patch

      const filters = withUnredacted(options.table, [eq(options.table.id, id)])

      const result = await this.db
        .update(options.table)
        .set(data as {})
        .where(and(...filters))
        .returning()
      // .get()
      // return result

      const entity = result ? result.at(0)! : never(never.never)
      return entity as C<typeof entity>
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
        .set({ deletedAt: fragments.now } as {})
        .where(and(...filters))
        .returning()
      // .get()
      // return result

      const entity = result ? result.at(0)! : never(never.never)
      return entity as C<typeof entity>
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
      // .get()
      // return result

      const entity = result ? result.at(0)! : never(never.never)
      return entity as C<typeof entity>
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
      const filters = [eq(options.table.id, id)]
      const result = await this.db
        .delete(options.table)
        .where(and(...filters))
        .returning()
      // .get()
      // return result

      const entity = result ? result.at(0)! : never(never.never)
      return entity as C<typeof entity>
    }
  }

  return Object.defineProperty(Repository, 'name', { value: identifier })
}
