import { TaskSchedule, never, turnon } from '@stitches/common'

import { and, eq } from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import * as schema from '../schema'
import { RepositoryAbstractFactory } from './factory'

export namespace record {
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
    return new SchedulesRepository(session)
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
  async load(schedule: Awaited<ReturnType<typeof this.findById>>) {
    const filters = [eq(schema.customFrequencies.scheduleId, schedule.id)]

    if (schedule.frequencyType === 'custom') {
      const result = await this.db
        .select()
        .from(schema.customFrequencies)
        .where(and(...filters))
        .limit(3)

      return result
    }

    const [result] = await this.db
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
          eq(schema.regularFrequencyMonthlyExprs.regularFrequencyId, schema.regularFrequencies.id),
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

    switch (result.regular_frequencies.type) {
      case 'day':
      case 'hour': {
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
        const db = this.db
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
                    .get()
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
                    .get()
                },
              },
            }
          }
          default:
            return never(type)
        }
      }

      case 'year': {
        const { ordinal, variableWeekday, constantWeekday, ...rest } =
          result.regular_frequency_yearly_exprs!
        return {
          ...result.regular_frequencies,
          type: result.regular_frequencies.type,
          exprs: {
            ...rest,
            get on() {
              return ordinal === null
                ? undefined
                : {
                    ordinal,
                    constantWeekday: constantWeekday!,
                    variableWeekday: variableWeekday!,
                  }
            },
          },
        }
      }

      default:
        never(result.regular_frequencies.type)
    }
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
  async findById(id: string) {
    return await this.schedules.findById(id)
  }

  /**
   * Adds a task's schedule to the collection
   *
   * @param payload The task schedule to add to the collection
   * @returns The resulting schedule that was added to the collection
   */
  async add(payload: TaskSchedule) {
    const result = await this.withTransaction(async ($this) => {
      if (payload.frequency.type === 'never') {
        const schedule = await $this.schedules.createOne({
          taskId: payload.taskId,
          timestamp: payload.timestamp!,
          anchorTimestamp: payload.timestamp!,
        })

        return { ...schedule, frequencyType: null }
      }

      const schedule = await $this.schedules.createOne({
        taskId: payload.taskId,
        timestamp: payload.timestamp!,
        anchorTimestamp: payload.timestamp!,
        frequencyType: payload.frequency.type === 'custom' ? 'custom' : 'regular',
        until: payload.frequency.until,
      })

      if (payload.frequency.type === 'custom') {
        const customFrequency = await $this.customFrequencies.createMany(
          payload.frequency.crons.map((cron) => {
            return {
              scheduleId: schedule.id,
              expression: cron.expression,
              type: undefined,
            }
          }),
        )

        return {
          ...schedule,
          frequencyType: payload.frequency.type,
          frequency: customFrequency,
        }
      }

      const regularFrequency = await $this.regularFrequencies.createOne({
        scheduleId: schedule.id,
        type: payload.frequency.type,
        every: payload.frequency.exprs.every,
      })

      switch (payload.frequency.type) {
        case 'hour':
        case 'day': {
          return {
            ...schedule,
            frequencyType: payload.frequency.type,
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
            weekdays: weekdays.reduce((bits, bitIndex) => turnon(bits, bitIndex), 0),
          })

          return {
            ...schedule,
            frequencyType: payload.frequency.type,
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
              days: subexpr.days.reduce((bits, bitIndex) => turnon(bits, bitIndex), 0),
            })

            return {
              ...schedule,
              frequencyType: payload.frequency.type,
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
            frequencyType: payload.frequency.type,
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
            months: subexpr.in.months.reduce((bits, bitIndex) => turnon(bits, bitIndex), 0),
            ordinal: subexpr.on?.ordinal,
            constantWeekday: subexpr.on?.weekday,
            variableWeekday: subexpr.on?.variable,
          })

          return {
            ...schedule,
            frequencyType: payload.frequency.type,
            frequency: {
              ...regularFrequency,
              type: payload.frequency.type,
              exprs: regFreqYearlyExprs,
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
   * @param schedule The schedule to load all "essential" frequency relations for
   * @returns The schedule with the fully loaded "custom frequencies" or fully or partially loaded "regular frequencies" relation
   */
  async load(schedule: Awaited<ReturnType<typeof this.findById>>) {
    const frequency = await this.schedules.load(schedule)

    if (schedule.frequencyType === null) {
      return {
        ...schedule,
        frequencyType: schedule.frequencyType,
        frequency: null,
      }
    }

    if (schedule.frequencyType === 'custom') {
      return {
        ...schedule,
        frequencyType: schedule.frequencyType,
        frequency: Array.isArray(frequency) ? frequency : never(never.never),
      }
    }

    return {
      ...schedule,
      frequencyType: schedule.frequencyType,
      frequency: Array.isArray(frequency) ? never(never.never) : frequency,
    }
  }
}
