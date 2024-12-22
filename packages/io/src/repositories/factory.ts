import { Constructor, entries, never, pascalCase } from '@stitches/common'

import {
  ExtractTablesWithRelations,
  InferInsertModel,
  and,
  eq,
  getTableName,
  isNotNull,
  isNull,
  sql,
} from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { fragments } from '../utils'
import { Criteria, getCriteriaBuilder } from './criteria.builder'
import { BaseColumns, Table, withRedacted, withUnredacted } from './utils'

export enum CollectionErrno {
  NOT_FOUND = 14233221,
  PRECONDITION,
}

export class CollectionError extends Error {
  public readonly code: CollectionErrno
  public readonly text: keyof typeof CollectionErrno

  constructor(code: CollectionErrno, message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = CollectionError.name
    this.code = code
    ;[this.text] = entries(CollectionErrno).find(([, c]) => c === code)!
  }
}

/**
 * Compute all the table keys from the given schema
 */
export type TKeys<S extends schema.Schema> = Exclude<
  keyof ExtractTablesWithRelations<S>,
  'tagsToTasks'
>

/**
 * Retrieve the columns of a table given by `S[K]` and ensure that the columns conform
 * to {@link BaseColumns} either as a superset or as an identity set
 */
export type TCols<S extends schema.Schema, K extends TKeys<S>> = Bound<
  ExtractTablesWithRelations<S>[K]['columns'],
  BaseColumns
>

/**
 * Bind a type `T` to an interface `I` contractually to ensure `T` conforms to `I`
 * either as a superset or as an identity set
 */
export type Bound<T, I> = T extends I ? T : never

export type RepositoryFactoryOptions<
  K extends TKeys<schema.Schema>,
  T extends Table<TCols<schema.Schema, K>>,
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

export interface AbstractRepository<
  K extends TKeys<schema.Schema>,
  T extends Table<TCols<schema.Schema, K>>,
  P extends InferInsertModel<T>,
> extends InstanceType<ReturnType<typeof RepositoryAbstractFactory<K, T, P>>> {}

/**
 * Generate an `AbstractRepository` sepcific to the given table schema `T`
 *
 * @param _ The schema key which is a phantom value (different from the table name)
 * @param options The abstract repository generation options
 * @returns An abstract repository class specific to the given table schema and generation options
 */
export function RepositoryAbstractFactory<
  K extends TKeys<schema.Schema>,
  T extends Table<TCols<schema.Schema, K>>,
  P extends InferInsertModel<T>,
>(_: K, options: RepositoryFactoryOptions<K, T>) {
  const identifier = pascalCase(getTableName(options.table)).concat('AbstractRepository')

  type Ref = {
    concreteCtor: Constructor<AbstractRepository<K, T, P> | Repository>
  }

  const ref: Ref = {
    concreteCtor: undefined!,
  }

  abstract class Repository {
    constructor(public readonly _db: SQLJsDatabase<schema.Schema>) {
      // save the subclass or subclass constructor or concrete implementation of the `AbstractRepository<K, T, P>`
      ref.concreteCtor = new.target
    }

    /**
     * Create a new repository with the given database session
     *
     * @param session The database session to use to create a new repository
     * @returns A new repository created with the given database session
     */
    withSession(session: SQLJsDatabase<schema.Schema>): AbstractRepository<K, T, P> {
      return Reflect.construct(ref.concreteCtor, [session])
    }

    /**
     * Get the criteria builder specific to the repository
     *
     * A shorthand and convenience method for {@link getCriteriaBuilder}
     *
     * @returns The criteria builder for the repository
     */
    gcb() {
      // should always generate on the fly to return a new instance, as `CriteriaBuilder`
      // is mutable and multiple queries on the same repo running in parallel may corrupt state.
      // @ts-expect-error
      return getCriteriaBuilder<schema.Schema, T>(options.table)
    }

    /**
     * Get the criteria builder specific to the repository
     * @returns The criteria builder for the repository
     */
    getCriteriaBuilder() {
      // should always generate on the fly to return a new instance, as `CriteriaBuilder`
      // is mutable and multiple queries on the same repo running in parallel may corrupt state.
      // @ts-expect-error
      return getCriteriaBuilder<schema.Schema, T>(options.table)
    }

    /**
     * Create a new `Entity` record in the database
     *
     * @param payload The data to create on the database
     * @returns The newly created `Entity`
     */
    create<C extends P[]>(payload: Omit<C, 'updatedAt'>): ReturnType<Repository['createMany']>
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

      const result = await this._db
        .insert(options.table)
        .values(data as any)
        .returning()

      const entity = result ? result[0] : never(never.never)
      return entity // as T['$inferSelect']
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

      const result = await this._db
        .insert(options.table)
        .values(data as any)
        .returning()

      return result ? result : never(never.never)
    }

    exists(criteria: Criteria) {
      const result = this._db.get<{ exists: 1 | 0 }>(
        sql`
          SELECT EXISTS (SELECT 1 FROM ${options.table} WHERE ${criteria.filters()}) AS "exists"
        `,
      )
      return result.exists === 0 ? false : result.exists === 1 ? true : never(result.exists)
    }

    /**
     * Find an `Entity` by a given ID.
     *
     * If the entity is not found, throw a {@link CollectionError} with
     * {@link CollectionErrno.NOT_FOUND}
     *
     * @param id The ID of the `Entity` to find
     * @throws {CollectionError} When the entity with the given ID is not found
     * @returns The `Entity` matching the provided ID, otherwise throws
     */
    async only(id: string) {
      const filters = withUnredacted(options.table, [eq(options.table.id, id)])
      const result = await this._db
        .select()
        .from(options.table)
        .where(and(...filters))
      const entity = result.at(0)

      if (!entity) throw new CollectionError(CollectionErrno.NOT_FOUND)

      return entity
    }

    /**
     * Find as many `Entities`
     *
     * @returns A list of `Entities`
     */
    async all(criteria?: Criteria) {
      const filters = withUnredacted(options.table, [])
      const props = criteria?.properties()
      const query = this._db
        .select()
        .from(options.table)
        .where(and(criteria?.filters(), ...filters))
        .orderBy(...(props?.orderings || []))

      if (props?.skip) query.offset(props?.skip ?? 0)
      if (props?.limit) query.limit(props?.limit ?? 0)

      const entity = await query.execute()

      return entity
    }

    /**
     * Find a previously redacted `Entity` by a given ID
     *
     * If the entity is not found, throw a {@link CollectionError} with
     * {@link CollectionErrno.NOT_FOUND}
     *
     * @param id The ID of the redacted `Entity` to find
     * @throws {CollectionError} When the entity with the given ID is not be found
     * @returns The **redacted** `Entity` matching the provided ID, otherwise throws
     */
    async findRedactedById(id: string) {
      const filters = withRedacted(options.table, [eq(options.table.id, id)])
      const result = await this._db
        .select()
        .from(options.table)
        .where(and(...filters))
      const entity = result.at(0)

      if (!entity) throw new CollectionError(CollectionErrno.NOT_FOUND)

      return entity
    }

    /**
     * Find as many previously redacted `Entities`
     *
     * @returns A list of previously **redacted** `Entities`
     */
    async findRedacted() {
      const filters = withRedacted(options.table, [])
      const result = await this._db
        .select()
        .from(options.table)
        .where(and(...filters))

      return result
    }

    /**
     * Update a `Entity` by a given ID, applying a patch to it
     *
     * If the precodition required to update returns no matching records,
     * throw a {@link CollectionError} with {@link CollectionErrno.PRECONDITION}
     *
     * @param id The ID of the `Entity` to update
     * @param patch The patch to apply to the `Entity`
     * @throws {CollectionError} When the entity with the given ID is not be found
     * @returns The updated `Entity`, with the patch applied
     */
    async update<U extends P>(id: string, patch: Partial<U>) {
      const transformer = options.transforms?.update
      const data = typeof transformer !== 'undefined' ? transformer(patch) : patch

      const filters = withUnredacted(options.table, [eq(options.table.id, id)])

      const result = await this._db
        .update(options.table)
        .set(data as {})
        .where(and(...filters))
        .returning()
      // .get()
      // return result

      const entity = result ? result[0] : never(never.never)

      if (!entity) throw new CollectionError(CollectionErrno.PRECONDITION)

      return entity //as T['$inferSelect']
    }

    /**
     * Redact an `Entity` by a given ID, setting the deleted marker for it
     * to a non-nullable value, if it has not been set.
     *
     * If the precodition required to redact returns no matching records,
     * throw a {@link CollectionError} with {@link CollectionErrno.PRECONDITION}
     *
     * @param id The ID of the `Entity` to redact
     * @throws {CollectionError} When the entity with the given ID is not be found
     * @returns The redacted `Entity`
     */
    async redact(id: string) {
      const filters = [eq(options.table.id, id), isNull(options.table.deletedAt)]
      const result = await this._db
        .update(options.table)
        .set({ deletedAt: fragments.now } as any)
        .where(and(...filters))
        .returning()
      // .get()
      // return result

      const entity = result ? result.at(0)! : never(never.never)

      if (!entity) throw new CollectionError(CollectionErrno.PRECONDITION)

      return entity // as T['$inferSelect']
    }

    /**
     * Restore a previously redacted `Entity` by a given ID, unsetting the
     * deleted marker for it with a nullable value, if it has not been unset.
     *
     * If the precodition required to restore returns no matching records,
     * throw a {@link CollectionError} with {@link CollectionErrno.PRECONDITION}
     *
     * @param id The ID of the `Entity` to restore
     * @throws {CollectionError} When the entity with the given ID is not be found
     * @returns The restored `Entity`
     */
    async restore(id: string) {
      const filters = [eq(options.table.id, id), isNotNull(options.table.deletedAt)]
      const result = await this._db
        .update(options.table)
        .set({ deletedAt: null } as any)
        .where(and(...filters))
        .returning()
      // .get()
      // return result

      const entity = result ? result.at(0)! : never(never.never)

      if (!entity) throw new CollectionError(CollectionErrno.PRECONDITION)

      return entity // as T['$inferSelect']
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
      const result = await this._db
        .delete(options.table)
        .where(and(...filters))
        .returning()
      // .get()
      // return result

      const entity = result ? result.at(0)! : never(never.never)
      return entity // as T['$inferSelect']
    }
  }

  return Object.defineProperty(Repository, 'name', { value: identifier })
}
