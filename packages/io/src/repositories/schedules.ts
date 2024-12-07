import {
  BaseTaskSchedule,
  BitMask,
  Ordinals,
  TaskSchedule,
  WeekdayVariable,
  FrequencyType as _FrequencyType,
  never,
} from '@stitches/common'

import { and, eq, inArray } from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { Op } from './criteria.builder'
import { RepositoryAbstractFactory } from './factory'

export namespace schedule {
  export namespace models {
    export type Schedules = typeof schema.schedules.$inferSelect
    export type CustomFrequencies = typeof schema.customFrequencies.$inferSelect
    export type RegularFrequencies = typeof schema.regularFrequencies.$inferSelect
    export type RegFreqWeeklyExprs = typeof schema.regularFrequencyWeeklyExprs.$inferSelect
    export type RegFreqMonthlyExprs = typeof schema.regularFrequencyMonthlyExprs.$inferSelect
    export type RegFreqMonthlyDaysSubExprs =
      typeof schema.regularFrequencyMonthlyDaysSubExprs.$inferSelect
    export type RegFreqMonthlyOrdinalSubExprs =
      typeof schema.regularFrequencyMonthlyOrdinalSubExprs.$inferSelect
    export type RegFreqYearlyExprs = typeof schema.regularFrequencyYearlyExprs.$inferSelect
  }

  export type RegFreqLeftJoinedRelations = {
    regular_frequencies: schedule.models.RegularFrequencies
    regular_frequency_weekly_exprs: schedule.models.RegFreqWeeklyExprs | null
    regular_frequency_monthly_exprs: schedule.models.RegFreqMonthlyExprs | null
    regular_frequency_yearly_exprs: schedule.models.RegFreqYearlyExprs | null
  }

  export type LoadedScheduleFrequencies = {
    custom: Array<schedule.Frequency<'custom'>>
    regular: Array<schedule.Frequency<'regular'>>
  }
}

function getRegFreqYearlyExprs(
  exprs: schedule.models.RegFreqYearlyExprs,
): schedule.YearlyExpression {
  const { ordinal, variableWeekday, constantWeekday, createdAt, updatedAt, deletedAt, ...rest } =
    exprs
  return {
    ...rest,
    get on() {
      if (ordinal === null) return
      return {
        ordinal,
        weekday: constantWeekday
          ? { constant: constantWeekday }
          : variableWeekday
            ? { variable: variableWeekday }
            : never(never.never),
      }
    },
    createdAt,
    updatedAt,
    deletedAt,
  }
}

/**
 * Schedules repository for working with, and managing, schedules
 */
export class SchedulesRepository extends RepositoryAbstractFactory('schedules', {
  table: schema.schedules,
}) {
  /**
   * Create a new repository with the given database session
   *
   * @param session The database session to use to create a new repository
   * @returns A new repository created with the given database session
   */
  override withSession(session: SQLJsDatabase<schema.Schema>): SchedulesRepository {
    return super.withSession(session) as SchedulesRepository
  }

  override async only(id: string): Promise<schedule.models.Schedules> {
    return await super.only(id)
  }

  private resolve(result: schedule.RegFreqLeftJoinedRelations): schedule.Frequency<'regular'> {
    switch (result.regular_frequencies.type) {
      case 'hour':
      case 'day': {
        return {
          ...result.regular_frequencies,
          type: result.regular_frequencies.type,
        }
      }

      case 'week': {
        return {
          ...result.regular_frequencies,
          type: result.regular_frequencies.type,
          exprs: result.regular_frequency_weekly_exprs!,
        }
      }

      case 'month': {
        const db = this._db
        const { id, type, ...rest } = result.regular_frequency_monthly_exprs!

        switch (type) {
          case 'onthe': {
            return {
              ...result.regular_frequencies,
              type: result.regular_frequencies.type,
              exprs: {
                id,
                type,
                ...rest,
                get subexpr() {
                  const model = schema.regularFrequencyMonthlyOrdinalSubExprs
                  return db
                    .select()
                    .from(model)
                    .where(eq(model.regularFrequencyMonthlyExprId, id))
                    .get()!
                },
              },
            }
          }

          case 'ondays': {
            return {
              ...result.regular_frequencies,
              type: result.regular_frequencies.type,
              exprs: {
                id,
                type,
                ...rest,
                get subexpr() {
                  const model = schema.regularFrequencyMonthlyDaysSubExprs
                  return db
                    .select()
                    .from(model)
                    .where(eq(model.regularFrequencyMonthlyExprId, id))
                    .get()!
                },
              },
            }
          }
          default:
            return never(type)
        }
      }

      case 'year': {
        return {
          ...result.regular_frequencies,
          type: result.regular_frequencies.type,
          exprs: getRegFreqYearlyExprs(result.regular_frequency_yearly_exprs!),
        }
      }

      default:
        never(result.regular_frequencies.type)
    }
  }

  /**
   * Load the frequencies relations for a schedule either fully or partially.
   *
   * In the case of custom frequencies, the relations are loaded fully and limited to just three
   * records, sicne custom frequencies only permits a maximum of three expressions.
   *
   * In the case of regular frequencies, the relations are fully loaded for all expressions except
   * for monthly expressions, which have subexpressions (ordinal or onthe, and days or ondays) that
   * are lazy loaded synchronously at the point of property access.
   *
   * @param schedule The schedule to load all "essential" frequency relations for
   * @returns The fully loaded "custom frequencies" or fully or partially loaded "regular frequencies" relation
   */
  async load(schedules: schedule.models.Schedules[]): Promise<schedule.LoadedScheduleFrequencies> {
    const output: schedule.LoadedScheduleFrequencies = { custom: [], regular: [] }

    const customSchedules = schedules.filter(
      (s) => s.frequencyType === 'custom',
    ) as schedule.Schedule<'custom'>[]
    const regularSchedule = schedules.filter(
      (s) => s.frequencyType === 'regular',
    ) as schedule.Schedule<'regular'>[]

    {
      const filters = [
        inArray(
          schema.customFrequencies.scheduleId,
          customSchedules.map((s) => s.id),
        ),
      ]

      const results = await this._db
        .select()
        .from(schema.customFrequencies)
        .where(and(...filters))
      output.custom.push(...results)
    }

    {
      const filters = [
        inArray(
          schema.regularFrequencies.scheduleId,
          regularSchedule.map((s) => s.id),
        ),
      ]

      const results = await this._db
        .select()
        .from(schema.regularFrequencies)
        .where(and(...filters))
        .leftJoin(
          schema.regularFrequencyWeeklyExprs,
          and(
            eq(schema.regularFrequencyWeeklyExprs.regularFrequencyId, schema.regularFrequencies.id),
            eq(schema.regularFrequencies.type, 'week'),
          ),
        )
        .leftJoin(
          schema.regularFrequencyMonthlyExprs,
          and(
            eq(
              schema.regularFrequencyMonthlyExprs.regularFrequencyId,
              schema.regularFrequencies.id,
            ),
            eq(schema.regularFrequencies.type, 'month'),
          ),
        )
        .leftJoin(
          schema.regularFrequencyYearlyExprs,
          and(
            eq(schema.regularFrequencyYearlyExprs.regularFrequencyId, schema.regularFrequencies.id),
            eq(schema.regularFrequencies.type, 'year'),
          ),
        )

      output.regular.push(...results.map((result) => this.resolve(result)))
    }

    return output
  }
}

/**
 * CustomFrequencies repository for working with, and managing,
 * cron-scheduled frequencies
 */
export class CustomFrequenciesRepository extends RepositoryAbstractFactory('customFrequencies', {
  table: schema.customFrequencies,
}) {
  /**
   * Create a new repository with the given database session
   *
   * @param session The database session to use to create a new repository
   * @returns A new repository created with the given database session
   */
  override withSession(session: SQLJsDatabase<schema.Schema>): CustomFrequenciesRepository {
    return new CustomFrequenciesRepository(session)
  }
}

/**
 * RegularFrequencies repository for working with, and managing, conventional,
 * calendar scheduling
 */
export class RegularFrequenciesRepository extends RepositoryAbstractFactory('regularFrequencies', {
  table: schema.regularFrequencies,
}) {
  /**
   * Create a new repository with the given database session
   *
   * @param session The database session to use to create a new repository
   * @returns A new repository created with the given database session
   */
  override withSession(session: SQLJsDatabase<schema.Schema>): RegularFrequenciesRepository {
    return new RegularFrequenciesRepository(session)
  }
}

/**
 * RegularFrequencyWeeklySubExpressions repository for adding conditionals
 * and filtering original expressions down to specific days of the week
 * hence modifying and/or qualifying original repeat strategies.
 */
export class RegFreqWeeklyExprsRepository extends RepositoryAbstractFactory(
  'regularFrequencyWeeklyExprs',
  {
    table: schema.regularFrequencyWeeklyExprs,
  },
) {
  /**
   * Create a new repository with the given database session
   *
   * @param session The database session to use to create a new repository
   * @returns A new repository created with the given database session
   */
  override withSession(session: SQLJsDatabase<schema.Schema>): RegFreqWeeklyExprsRepository {
    return new RegFreqWeeklyExprsRepository(session)
  }
}

/**
 * RegularFrequencyMonthlySubExpressions repository for adding conditionals
 * and filtering original expressions down to specific days of the month or
 * even dynamically evaluated days of the month using ordinals and weekdays.
 */
export class RegFreqMonthlyExprsRepository extends RepositoryAbstractFactory(
  'regularFrequencyMonthlyExprs',
  {
    table: schema.regularFrequencyMonthlyExprs,
  },
) {
  /**
   * Create a new repository with the given database session
   *
   * @param session The database session to use to create a new repository
   * @returns A new repository created with the given database session
   */
  override withSession(session: SQLJsDatabase<schema.Schema>): RegFreqMonthlyExprsRepository {
    return new RegFreqMonthlyExprsRepository(session)
  }
}

/**
 * RegularFrequencyMonthlyOrdinalSubExpressions repository for adding conditionals
 * and filtering original expressions down to specific days of the month by
 * dynamically evaluating days of the month using the specified ordinals and
 * weekdays.
 */
export class RegFreqMonthlyOrdinalSubExprsRepository extends RepositoryAbstractFactory(
  'regularFrequencyMonthlyOrdinalSubExprs',
  {
    table: schema.regularFrequencyMonthlyOrdinalSubExprs,
  },
) {
  /**
   * Create a new repository with the given database session
   *
   * @param session The database session to use to create a new repository
   * @returns A new repository created with the given database session
   */
  override withSession(
    session: SQLJsDatabase<schema.Schema>,
  ): RegFreqMonthlyOrdinalSubExprsRepository {
    return new RegFreqMonthlyOrdinalSubExprsRepository(session)
  }
}

/**
 * RegularFrequencyMonthlyDaysSubExpressions repository for adding conditionals
 * and filtering original expressions down to specific days of the month by
 * specifying applicable days of the month only
 */
export class RegFreqMonthlyDaysSubExprsRepository extends RepositoryAbstractFactory(
  'regularFrequencyMonthlyDaysSubExprs',
  {
    table: schema.regularFrequencyMonthlyDaysSubExprs,
  },
) {
  /**
   * Create a new repository with the given database session
   *
   * @param session The database session to use to create a new repository
   * @returns A new repository created with the given database session
   */
  override withSession(
    session: SQLJsDatabase<schema.Schema>,
  ): RegFreqMonthlyDaysSubExprsRepository {
    return new RegFreqMonthlyDaysSubExprsRepository(session)
  }
}

/**
 * RegularFrequencyYearlyInSubExpressions repository for adding conditionals
 * and filtering original expressions down to specific months of the year by
 * specifying applicable months of the year only.
 *
 * AND
 *
 * RegularFrequencyYearlyOnSubExpressions repository for modifying conditionals
 * and filtering original "yearly in" sub-expressions down to specific days of
 * the month by dynamically evaluating days of the month using the specified
 * ordinals and weekdays.
 */
export class RegFreqYearlyExprsRepository extends RepositoryAbstractFactory(
  'regularFrequencyYearlyExprs',
  {
    table: schema.regularFrequencyYearlyExprs,
  },
) {
  /**
   * Create a new repository with the given database session
   *
   * @param session The database session to use to create a new repository
   * @returns A new repository created with the given database session
   */
  override withSession(session: SQLJsDatabase<schema.Schema>): RegFreqYearlyExprsRepository {
    return new RegFreqYearlyExprsRepository(session)
  }
}

export class SchedulesRepositoryFacade {
  private readonly schedules: SchedulesRepository
  private readonly customFrequencies: CustomFrequenciesRepository
  private readonly regularFrequencies: RegularFrequenciesRepository
  private readonly regFreqWeeklyExprs: RegFreqWeeklyExprsRepository
  private readonly regFreqMonthlyExprs: RegFreqMonthlyExprsRepository
  private readonly regFreqMonthlyOrdinalSubExprs: RegFreqMonthlyOrdinalSubExprsRepository
  private readonly regFreqMonthlyDaysSubExprs: RegFreqMonthlyDaysSubExprsRepository
  private readonly regFreqYearlyExprs: RegFreqYearlyExprsRepository

  constructor(private readonly db: SQLJsDatabase<schema.Schema>) {
    this.schedules = new SchedulesRepository(db)
    this.customFrequencies = new CustomFrequenciesRepository(db)
    this.regularFrequencies = new RegularFrequenciesRepository(db)
    this.regFreqWeeklyExprs = new RegFreqWeeklyExprsRepository(db)
    this.regFreqMonthlyExprs = new RegFreqMonthlyExprsRepository(db)
    this.regFreqMonthlyOrdinalSubExprs = new RegFreqMonthlyOrdinalSubExprsRepository(db)
    this.regFreqMonthlyDaysSubExprs = new RegFreqMonthlyDaysSubExprsRepository(db)
    this.regFreqYearlyExprs = new RegFreqYearlyExprsRepository(db)
  }

  private async withTransaction<R>(executor: (session: SchedulesRepositoryFacade) => R) {
    return await this.db.transaction(async (tx) => {
      const session = new SchedulesRepositoryFacade(tx)
      return await executor(session)
    })
  }

  /**
   * Find a `Schedule` by a given ID.
   *
   * If the entity is not found, throw a `CollectionError` with `CollectionErrno.NOT_FOUND`
   *
   * @param id The ID of the `Schedule` to find
   * @throws CollectionError: When the schedule with the given ID is not found
   * @returns The Schedule matching the provided ID, otherwise throws
   */
  async only(id: string) {
    const schedule = await this.schedules.only(id)
    const [loaded] = (await this.load([schedule])) as [schedule.ScheduleUnion | undefined]
    // This should never happen, instead `await this.schedules.only(id)` should throw a
    // `CollectionError`
    if (!loaded) return never(loaded as never)
    return loaded
  }

  /**
   * Adds a task's schedule to the collection
   *
   * @param payload The task schedule to add to the collection
   * @returns The resulting schedule that was added to the collection
   */
  async add(payload: BaseTaskSchedule | TaskSchedule): Promise<schedule.ScheduleUnion> {
    const result = await this.withTransaction(async ($this): Promise<schedule.ScheduleUnion> => {
      if (payload.frequency.type === 'never') {
        const schedule = await $this.schedules.createOne({
          id: 'id' in payload ? payload.id : undefined,
          taskId: payload.taskId,
          timestamp: payload.timing.upcoming,
          anchorTimestamp: payload.timing.anchor,
        })

        const output: schedule.DefaultSchedule = schedule

        return output
      }

      const schedule = await $this.schedules.createOne({
        id: 'id' in payload ? payload.id : undefined,
        taskId: payload.taskId,
        timestamp: payload.timing.upcoming,
        anchorTimestamp: payload.timing.anchor,
        frequencyType: payload.frequency.type === 'custom' ? 'custom' : 'regular',
        until: payload.frequency.until,
      })

      if (payload.frequency.type === 'custom') {
        const customFrequencies = await $this.customFrequencies.createMany(
          payload.frequency.crons.map((cron) => {
            return {
              scheduleId: schedule.id,
              expression: cron.expression,
              type: undefined,
            }
          }),
        )

        const output: schedule.Schedule<'custom'> = {
          ...schedule,
          frequencyType: payload.frequency.type,
          frequency: customFrequencies,
        }

        return output
      }

      const regularFrequency = await $this.regularFrequencies.createOne({
        scheduleId: schedule.id,
        type: payload.frequency.type,
        every: payload.frequency.exprs.every,
      })

      const frequencyType = 'regular' as const

      switch (payload.frequency.type) {
        case 'hour':
        case 'day': {
          return {
            ...schedule,
            frequencyType,
            frequency: {
              ...regularFrequency,
              type: payload.frequency.type,
            },
          }
        }

        case 'week': {
          const { weekdays } = payload.frequency.exprs.subexpr
          const regularFrequencyWeeklyExprs = await $this.regFreqWeeklyExprs.createOne({
            regularFrequencyId: regularFrequency.id,
            weekdays: BitMask.fromPositions(weekdays).valueOf(),
          })

          return {
            ...schedule,
            frequencyType,
            frequency: {
              ...regularFrequency,
              type: payload.frequency.type,
              exprs: regularFrequencyWeeklyExprs,
            },
          }
        }

        case 'month': {
          const { subexpr } = payload.frequency.exprs
          const regFreqMonthlyExprs = await $this.regFreqMonthlyExprs.createOne({
            regularFrequencyId: regularFrequency.id,
            type: subexpr.type,
          })

          if (subexpr.type === 'ondays') {
            const regFreqMonthlyDaysSubExprs = await $this.regFreqMonthlyDaysSubExprs.createOne({
              regularFrequencyMonthlyExprId: regFreqMonthlyExprs.id,
              days: BitMask.fromPositions(subexpr.days).valueOf(),
            })

            return {
              ...schedule,
              frequencyType,
              frequency: {
                ...regularFrequency,
                type: payload.frequency.type,
                exprs: {
                  ...regFreqMonthlyExprs,
                  type: subexpr.type,
                  subexpr: regFreqMonthlyDaysSubExprs,
                },
              },
            }
          }

          const regFreqMonthlyOrdinalSubExprs = await $this.regFreqMonthlyOrdinalSubExprs.createOne(
            {
              regularFrequencyMonthlyExprId: regFreqMonthlyExprs.id,
              ordinal: subexpr.ordinal,
              weekday: subexpr.weekday,
            },
          )

          return {
            ...schedule,
            frequencyType,
            frequency: {
              ...regularFrequency,
              type: payload.frequency.type,
              exprs: {
                ...regFreqMonthlyExprs,
                type: subexpr.type,
                subexpr: regFreqMonthlyOrdinalSubExprs,
              },
            },
          }
        }

        case 'year': {
          const { subexpr } = payload.frequency.exprs
          const regFreqYearlyExprs = await $this.regFreqYearlyExprs.createOne({
            regularFrequencyId: regularFrequency.id,
            months: BitMask.fromPositions(subexpr.in.months).valueOf(),
            ordinal: subexpr.on?.ordinal,
            constantWeekday: subexpr.on?.weekday,
            variableWeekday: subexpr.on?.variable,
          })

          return {
            ...schedule,
            frequencyType,
            frequency: {
              ...regularFrequency,
              type: payload.frequency.type,
              exprs: getRegFreqYearlyExprs(regFreqYearlyExprs),
            },
          }
        }

        default:
          never(payload.frequency)
      }
    })

    return result
  }

  /**
   * Load the frequencies relations for a schedule either fully or partially.
   *
   * In the case of custom frequencies, the relations are loaded fully and limited to just three
   * records, sicne custom frequencies only permits a maximum of three expressions.
   *
   * In the case of regular frequencies, the relations are fully loaded for all expressions except
   * for monthly expressions, which have subexpressions (ordinal or onthe, and days or ondays) that
   * are lazy loaded synchronously at the point of property access.
   *
   * @param schedules The schedule to load all "essential" frequency relations for
   * @returns The schedule with the fully loaded "custom frequencies" or fully or partially loaded "regular frequencies" relation
   */
  async load(schedules: schedule.models.Schedules[]): Promise<schedule.ScheduleUnion[]> {
    const output: Array<schedule.ScheduleUnion> = []
    const frequency = await this.schedules.load(schedules)
    const customFreqGroupedByScheduleID: Map<string, schedule.Frequency<'custom'>[]> = new Map()
    const schedulesIndexedByID: Map<string, schedule.models.Schedules> = new Map(
      schedules
        .filter((s) => {
          return s.frequencyType !== null
        })
        .map((s) => [s.id, s]),
    )

    // Since custom frequencies has a many-to-one relationship with schedule, we
    // group similar custom frequencies togther using `scheduleId` as aggregation key
    {
      frequency.custom.forEach((f) => {
        const value = customFreqGroupedByScheduleID.get(f.scheduleId)
        if (value && Array.isArray(value)) {
          return void value.push(f) // by mut ref
        }
        return void customFreqGroupedByScheduleID.set(f.scheduleId, [f])
      })
    }

    // proecess each frequency type in serial and concat them with the output array
    {
      output.push(
        ...(schedules.filter((s) => {
          return s.frequencyType === null
        }) as schedule.DefaultSchedule[]),
      )

      output.push(
        ...frequency.custom.map((f): schedule.Schedule<'custom'> => {
          const schedule = schedulesIndexedByID.get(f.scheduleId)!
          return {
            ...schedule,
            frequencyType: 'custom',
            frequency: customFreqGroupedByScheduleID.get(f.scheduleId)!,
          }
        }),
      )

      output.push(
        ...frequency.regular.map((f): schedule.Schedule<'regular'> => {
          const schedule = schedulesIndexedByID.get(f.scheduleId)!
          return {
            ...schedule,
            frequencyType: 'regular',
            frequency: f,
          }
        }),
      )
    }

    return output
  }

  /**
   * Replace a schedule with a new task schedule by removing the previous one,
   * if any, and putting a new one in it's place.
   *
   * @param substitute The new task schedule to use to substitute the old one
   * @returns The substituted schedule
   */
  async replace(substitute: BaseTaskSchedule | TaskSchedule) {
    return await this.withTransaction(async (session) => {
      if ('id' in substitute)
        await session.schedules
          .delete(substitute.id)
          .catch((e) => console.error(`No existing schedule. Creating a schedule: %o`, e))
      return await session.add(substitute)
    })
  }

  /**
   * Remove a schedule and all its associated objects
   * @param id The ID of the schedule to remove
   */
  async remove(id: string) {
    await this.schedules.delete(id)
  }

  async getScheduleFrequency(
    scheduleId: string,
  ): Promise<Record<
    'frequency',
    schedule.models.CustomFrequencies[] | schedule.models.RegularFrequencies
  > | null> {
    const customFreqCriteria = this.customFrequencies
      .getCriteriaBuilder()
      .on('scheduleId', Op.EQ, scheduleId)
      .build()
    const regularFreqCriteria = this.customFrequencies
      .getCriteriaBuilder()
      .on('scheduleId', Op.EQ, scheduleId)
      .build()

    const [customFreqs, regularFreqs] = await Promise.all([
      this.customFrequencies.all(customFreqCriteria),
      this.regularFrequencies.all(regularFreqCriteria),
    ])

    if (customFreqs.length > 0) return { frequency: customFreqs }
    else if (regularFreqs.length === 1) return { frequency: regularFreqs[0] }
    return null
  }
}

export namespace schedule {
  export interface Base {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }

  export interface BaseExpression extends Base {
    regularFrequencyId: string
  }

  export interface BaseFrequency extends Base {
    scheduleId: string
  }

  export interface BaseSchedule extends Base {
    taskId: string
    timestamp: Date
    anchorTimestamp: Date
    until: Date | null
  }
}

export namespace schedule {
  export type Expression<U extends FrequencyUnit, T = null> = T extends null
    ? { type: U; every: number }
    : { type: U; every: number; exprs: T }

  export type SubExpression<T extends 'onthe' | 'ondays', S> = { type: T; subexpr: S }
}

export namespace schedule {
  export interface MonthlyOrdSubExpression extends Base {
    regularFrequencyMonthlyExprId: string
    ordinal: Ordinals
    weekday: number
  }

  export interface MonthlyDaysSubExpression extends Base {
    regularFrequencyMonthlyExprId: string
    days: number
  }

  export type YearlyOnExpression = {
    ordinal: Ordinals
    weekday: Record<'constant', number> | Record<'variable', WeekdayVariable>
  }
}

export namespace schedule {
  type FrequencyMap = { custom: CustomFrequency; regular: RegularFrequency }
  export type FrequencyType = 'custom' | 'regular'
  export type FrequencyUnit = Exclude<_FrequencyType, 'custom' | 'never'>

  export interface WeeklyExpression extends BaseExpression {
    weekdays: number
  }

  export type MonthlyExpression = BaseExpression &
    (
      | SubExpression<'ondays', MonthlyDaysSubExpression>
      | SubExpression<'onthe', MonthlyOrdSubExpression>
    )

  export interface YearlyExpression extends BaseExpression {
    months: number
    on?: YearlyOnExpression
  }

  export type Frequency<F extends FrequencyType> = FrequencyMap[F]

  export interface CustomFrequency extends BaseFrequency {
    expression: string
    // TODO: rename "type" to "unit"
    type: FrequencyUnit | null
  }

  export type RegularFrequency = BaseFrequency &
    (
      | Expression<'hour' | 'day'>
      | Expression<'week', WeeklyExpression>
      | Expression<'month', MonthlyExpression>
      | Expression<'year', YearlyExpression>
    )

  export type DefaultSchedule = BaseSchedule
  export interface Schedule<F extends FrequencyType> extends BaseSchedule {
    frequencyType: F
    frequency: F extends 'custom'
      ? Frequency<Extract<F, 'custom'>>[]
      : Frequency<Extract<F, 'regular'>>
  }

  export type ScheduleUnion = DefaultSchedule | Schedule<'custom'> | Schedule<'regular'>
}
