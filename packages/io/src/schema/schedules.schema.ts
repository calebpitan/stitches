import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

import { withDefaults } from './common'
import { tasks } from './tasks.schema'

const Shared = {
  withOrdinal<S extends Record<string, any>>(schema: S) {
    return {
      ...schema,
      /**
       * The ordinal qualifier for the weekday which is a string enum of
       * `first|second|third|fourth|fifth|last`
       */
      ordinal: text({ enum: ['first', 'second', 'third', 'fourth', 'fifth', 'last'] }).notNull(),
    }
  },

  withWeekday<S extends Record<string, any>>(schema: S) {
    return {
      ...schema,

      /**
       * The weekday from Sun-Sat represented by a number which could also serve
       * as a bit mask for the week as described in {@link regularFrequencyWeeklyExprs.weekdays}
       *
       * ## Bit Mask Patterns
       *
       * ```
       * // 0x40 (Sat)
       * // 0x20 (Fri)
       * // 0x10 (Thu)
       * // 0x08 (Wed)
       * // 0x04 (Tue)
       * // 0x02 (Mon)
       * // 0x01 (Sun)
       * ```
       */
      weekday: integer().notNull(),
    }
  },

  withConstWeekday<S extends Record<string, any>>(schema: S) {
    return {
      ...schema,
      /**
       * The weekday from Sun-Sat represented by a number which could also serve
       * as a bit mask for the week as described in {@link regularFrequencyWeeklyExprs.weekdays}
       *
       * ## Bit Mask Patterns
       *
       * ```
       * // 0x40 (Sat)
       * // 0x20 (Fri)
       * // 0x10 (Thu)
       * // 0x08 (Wed)
       * // 0x04 (Tue)
       * // 0x02 (Mon)
       * // 0x01 (Sun)
       * ```
       */
      constantWeekday: integer(),
    }
  },
}

/**
 * Schedules table for Tasks
 */
export const schedules = sqliteTable(
  'schedules',
  withDefaults({
    /**
     * The ID of the task the schedule belongs to
     */
    taskId: text()
      .unique()
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),

    /**
     * This is the original timestamp the task was scheduled for before
     * any future repeating schedule
     */
    anchorTimestamp: integer({ mode: 'timestamp_ms' }).notNull(),

    /**
     * This is the most recently known elapsed or future timestamp which is different from
     * the original timestamp the schedule is anchored to.
     *
     * Initial value is same for `anchorTimestamp` until future repeating schedules are
     * computed
     */
    timestamp: integer({ mode: 'timestamp_ms' }).notNull(),

    /**
     * The frequency type of this schedule which is a string enum of
     * `custom|regular`
     */
    frequencyType: text({ enum: ['custom', 'regular'] }),

    /**
     * The period of time `T` when this frequency schedule becomes invalidated
     *
     * That is: the given schedule frequency should run until time `T`
     *
     * ## Note
     *
     * `until` cannot be non-nullable without `frequency_type` being non-nullable either
     * so we check that both are null or `frequency_type` is not null
     */
    until: integer({ mode: 'timestamp_ms' }),
  }),
  (t) => {
    return {
      check: check(
        'no_until_without_frequency_type',
        sql`
          ((${t.frequencyType} IS NULL) AND (${t.until} IS NULL)) OR (${t.frequencyType} IS NOT NULL)
        `,
      ),
    }
  },
)

/**
 * Custom frequencies table for Schedules
 */
export const customFrequencies = sqliteTable(
  'custom_frequencies',
  withDefaults({
    /**
     * The ID of the "schedule" this "custom frequency" belongs to
     *
     * Up to three custom frequencies can belong to a single schedule,
     * if more, they'll be ignored.
     */
    scheduleId: text()
      .notNull()
      .references(() => schedules.id, { onDelete: 'cascade' }),

    /**
     * The base unit of expression which is a string enum of
     * `hour|day|week|month|year`
     */
    type: text({ enum: ['hour', 'day', 'week', 'month', 'year'] }),

    /**
     * The cron expression for expressing the repeat schedule frequency
     */
    expression: text().notNull(),
  }),
  (table) => {
    return {
      unq: unique().on(table.scheduleId, table.expression),
    }
  },
)

/**
 * RegularFrequencies table for Schedules
 */
export const regularFrequencies = sqliteTable(
  'regular_frequencies',
  withDefaults({
    /**
     * The ID of the "schedule" this "regular frequency" belongs to
     */
    scheduleId: text()
      .unique()
      .notNull()
      .references(() => schedules.id, { onDelete: 'cascade' }),

    /**
     * The base unit of expression which is a string enum of
     * `hour|day|week|month|year`
     */
    type: text({ enum: ['hour', 'day', 'week', 'month', 'year'] }).notNull(),

    /**
     * The repetition frequency expression
     */
    every: integer().notNull(),
  }),
)

/**
 * RegularFrequencyWeeklyExpressions for RegularFrequencies
 */
export const regularFrequencyWeeklyExprs = sqliteTable(
  'regular_frequency_weekly_exprs',
  withDefaults({
    /**
     * The ID of the "regular frequency" this "regular frequency weekly exprs"
     * belongs to
     */
    regularFrequencyId: text()
      .unique()
      .notNull()
      .references(() => regularFrequencies.id, { onDelete: 'cascade' }),

    /**
     * A bit mask of selected weekdays.
     *
     * Since there are 7 days in a week the least this can be is a 7-bit integer,
     * where each bit represents each weekday and `1` at any individual bit marks
     * the rrepresented weekday as selected while `0` marks it as unselected.
     *
     * ## Bit Representation
     *
     * ```
     *       0x00      to      0x7F
     * [0_0_0_0_0_0_0] to [1_1_1_1_1_1_1]
     *        0        to       127
     * ```
     *
     * ## Bit Mask Patterns
     *
     * ```
     * // 0x40
     * // 0x20
     * // 0x10
     * // 0x08
     * // 0x04
     * // 0x02
     * // 0x01
     * ```
     */
    weekdays: integer().notNull(),
  }),
)

/**
 * RegularFrequencyMonthlyExpressions for RegularFrequencies
 */
export const regularFrequencyMonthlyExprs = sqliteTable(
  'regular_frequency_monthly_exprs',
  withDefaults({
    /**
     * The ID of the "regular frequency" this "regular frequency monthly exprs"
     * belongs to
     */
    regularFrequencyId: text()
      .unique()
      .notNull()
      .references(() => regularFrequencies.id, { onDelete: 'cascade' }),

    /**
     * The type of monthly sub-expression which is a string enum of `onthe|ondays`,
     * where `onthe` represents ordinal expressions of, for example, "On The 4th Sun...Sat",
     * weekdays, and `ondays` represents expressions of, for example, "On days 1...31".
     */
    type: text({ enum: ['onthe', 'ondays'] }).notNull(),
  }),
)

/**
 * RegularFrequencyMonthlyOrdinalSubExpression for RegularFrequencyMonthlySubExpressions
 */
export const regularFrequencyMonthlyOrdinalSubExprs = sqliteTable(
  'regular_frequency_monthly_ordinal_subexprs',
  withDefaults(
    Shared.withWeekday({
      /**
       * The ID of the "regular frequency monthly subexpr" this
       * "regular frequency monthly ordinal subexprs" belongs to
       */
      regularFrequencyMonthlyExprId: text()
        .unique()
        .notNull()
        .references(() => regularFrequencyMonthlyExprs.id, { onDelete: 'cascade' }),

      /**
       * The ordinal qualifier for the weekday which is a string enum of
       * `first|second|third|fourth|fifth|last`
       */
      ordinal: text({ enum: ['first', 'second', 'third', 'fourth', 'fifth', 'last'] }).notNull(),
    }),
  ),
)

/**
 * RegularFrequencyMonthlyDaysSubExpression for RegularFrequencyMonthlyExpressions
 */
export const regularFrequencyMonthlyDaysSubExprs = sqliteTable(
  'regular_frequency_monthly_days_subexprs',
  withDefaults({
    /**
     * The ID of the "regular frequency monthly subexpr" this
     * "regular frequency monthly days subexprs" belongs to
     */
    regularFrequencyMonthlyExprId: text()
      .unique()
      .notNull()
      .references(() => regularFrequencyMonthlyExprs.id, { onDelete: 'cascade' }),

    /**
     * A bit mask of selected days of the month.
     *
     * Since there are 31 days in a week the least this can be is a 31-bit integer,
     * where each bit represents each weekday and `1` at any individual bit marks
     * the rrepresented weekday as selected while `0` marks it as unselected.
     *
     * ## Bit Representation
     *
     * ```
     *                          0x00000000
     * [0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0]
     *                              0
     *                              to
     *                          0x7FFFFFFF
     * [1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1]
     *                          2_147_483_647
     * ```
     *
     * ## Bit Mask Patterns
     *
     * ```
     * // 0x40000000 (31st)
     * // 0x20000000 (30th)
     * // 0x10000000 (29th)
     * // 0x08000000 (28th)
     * // 0x04000000 (27th)
     * // 0x02000000 (26th)
     * // 0x01000000 (25th)
     * // 0x00800000 (24th)
     * // 0x00400000 (23rd)
     * // 0x00200000 (22nd)
     * // 0x00100000 (21st)
     * // 0x00080000 (20th)
     * // 0x00040000 (19th)
     * // 0x00020000 (18th)
     * // 0x00010000 (17th)
     * // 0x00008000 (16th)
     * // 0x00004000 (15th)
     * // 0x00002000 (14th)
     * // 0x00001000 (13th)
     * // 0x00000800 (12th)
     * // 0x00000400 (11th)
     * // 0x00000200 (10th)
     * // 0x00000100 (09th)
     * // 0x00000080 (08th)
     * // 0x00000040 (07th)
     * // 0x00000020 (06th)
     * // 0x00000010 (05th)
     * // 0x00000008 (04th)
     * // 0x00000004 (03rd)
     * // 0x00000002 (02nd)
     * // 0x00000001 (01st)
     * ```
     */
    days: integer().notNull(),
  }),
)

/**
 * RegularFrequencyYearlyExpression for RegularFrequency
 */
export const regularFrequencyYearlyExprs = sqliteTable(
  'regular_frequency_yearly_exprs',
  withDefaults(
    Shared.withConstWeekday({
      /**
       * The ID of the "regular frequency" this "regular frequency yearly exprs"
       * belongs to
       */
      regularFrequencyId: text()
        .unique()
        .notNull()
        .references(() => regularFrequencies.id, { onDelete: 'cascade' }),

      /**
       * A bit mask of selected months of the year.
       *
       * Since there are 12 months in a year the least this can be is a 12-bit integer,
       * where each bit represents each month and `1` at any individual bit marks
       * the rrepresented month as selected while `0` marks it as unselected.
       *
       * ## Bit Representation
       *
       * ```
       *          0x000               to              0xFFF
       * [0_0_0_0_0_0_0_0_0_0_0_0]    to    [1_1_1_1_1_1_1_1_1_1_1_1]
       *            0                 to               4095
       * ```
       *
       * ## Bit Mask Patterns
       *
       * ```
       * // 0x800 (Dec)
       * // 0x400 (Nov)
       * // 0x200 (Oct)
       * // 0x100 (Sep)
       * // 0x080 (Aug)
       * // 0x040 (Jul)
       * // 0x020 (Jun)
       * // 0x010 (May)
       * // 0x008 (Apr)
       * // 0x004 (Mar)
       * // 0x002 (Feb)
       * // 0x001 (Jan)
       * ```
       */
      months: integer().notNull(),

      /**
       * The ordinal qualifier for the weekday which is a string enum of
       * `first|second|third|fourth|fifth|last`
       */
      ordinal: text({ enum: ['first', 'second', 'third', 'fourth', 'fifth', 'last'] }),

      /**
       * A weekday, unlike `const_weekday`, that is dynamically computed and dependent on the
       * set ordinal value.
       *
       * Type is a string enum of `day|weekday|weekend-day` where:
       *
       * 1. `day` can be very flexible and computed as any regular day of the week, `Sun-Sat`,
       * 2. `weekday` is more constrained and computed to only weekday days of the week, `Mon-Fri`,
       * contrary to weekend days of the week,
       * 3. `weekend-day` is even more constrained and computed to only weekend days of the week, `Sat-Sun`.
       *
       *
       */
      variableWeekday: text({ enum: ['day', 'weekday', 'weekend-day'] }),
    }),
  ),
  (t) => {
    return {
      check: check(
        'mutually_exclusive_inclusive',
        sql`
          (
            (${t.ordinal} IS NULL)
              AND 
            (${t.constantWeekday} IS NULL)
              AND 
            (${t.variableWeekday} IS NULL)
          ) OR (
            ((${t.ordinal} IS NOT NULL) AND (${t.constantWeekday} IS NOT NULL))
              OR 
            ((${t.ordinal} IS NOT NULL) AND (${t.variableWeekday} IS NOT NULL))
          )
        `,
      ),
    }
  },
)
