import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { withDefaults } from './common'
import { tasks } from './tasks.schema'

type Cron = { expression: string; frequency: 'hour' | 'day' | 'week' | 'month' | 'year' }

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
       * as a bit mask for the week as described in {@link regularFrequencyWeeklySubExprs.weekdays}
       *
       * ## Bit Mask Patterns
       *
       * ```
       * // 0x40 (Sun)
       * // 0x20 (Sat)
       * // 0x10 (Fri)
       * // 0x08 (Thu)
       * // 0x04 (Wed)
       * // 0x02 (Tue)
       * // 0x01 (Mon)
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
       * as a bit mask for the week as described in {@link regularFrequencyWeeklySubExprs.weekdays}
       *
       * ## Bit Mask Patterns
       *
       * ```
       * // 0x40 (Sun)
       * // 0x20 (Sat)
       * // 0x10 (Fri)
       * // 0x08 (Thu)
       * // 0x04 (Wed)
       * // 0x02 (Tue)
       * // 0x01 (Mon)
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
  }),
)

/**
 * Custom frequencies table for Schedules
 */
export const customFrequencies = sqliteTable(
  'custom_frequencies',
  withDefaults({
    /**
     * The ID of the "schedule" this "custom frequency" belongs to
     */
    scheduleId: text()
      .unique()
      .notNull()
      .references(() => schedules.id, { onDelete: 'cascade' }),

    /**
     * The type of "custom frequency" which is a string enum of
     * `custom`
     */
    type: text({ enum: ['custom'] })
      .notNull()
      .generatedAlwaysAs('custom'),

    /**
     * The cron expressions, about 3 or less, for this schedule
     */
    crons: text({ mode: 'json' }).notNull().$type<Array<Cron>>(),
  }),
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
     * The type of "regular frequency" which is a string enum of
     * `hour|day|week|month|year`
     */
    type: text({ enum: ['hour', 'day', 'week', 'month', 'year'] }).notNull(),
  }),
)

/**
 * RegularFrequqencyExpressions for RegularFrequency
 */
export const regularFrequencyExprs = sqliteTable(
  'regular_frequency_exprs',
  withDefaults({
    /**
     * The ID of the "regular frequency" this "regular frequency expression"
     * belongs to.
     */
    regularFrequencyId: text()
      .unique()
      .notNull()
      .references(() => regularFrequencies.id, { onDelete: 'cascade' }),

    /**
     * The repetition frequency expression
     */
    every: integer().notNull(),
  }),
)

/**
 * RegularFrequencySubExpressions for RegularFrequencyExpressions
 */
export const regularFrequencySubExprs = sqliteTable(
  'regular_frequency_subexprs',
  withDefaults({
    /**
     * The ID of the "regular frequency" this "regular frequency expression"
     * belongs to.
     */
    regularFrequencyExprId: text()
      .unique()
      .notNull()
      .references(() => regularFrequencies.id, { onDelete: 'cascade' }),
  }),
)

/**
 * RegularFrequencyWeeklySubExpressions for RegularFrequencySubExpressions
 */
export const regularFrequencyWeeklySubExprs = sqliteTable(
  'regular_frequency_weekly_subexprs',
  withDefaults({
    /**
     * The ID of the "regular frequency subexpr" this "regular frequency weekly subexprs"
     * belongs to
     */
    regularFrequencySubexprId: text()
      .unique()
      .notNull()
      .references(() => regularFrequencySubExprs.id, { onDelete: 'cascade' }),
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
 * RegularFrequencyMonthlySubExpressions for RegularFrequencySubExpressions
 */
export const regularFrequencyMonthlySubExprs = sqliteTable(
  'regular_frequency_monthly_subexprs',
  withDefaults({
    /**
     * The ID of the "regular frequency subexpr" this "regular frequency monthly subexprs"
     * belongs to
     */
    regularFrequencySubexprId: text()
      .unique()
      .notNull()
      .references(() => regularFrequencySubExprs.id, { onDelete: 'cascade' }),

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
export const regularFrequencyMonthlyOrdinalSubExpr = sqliteTable(
  'regular_frequency_monthly_ordinal_subexprs',
  withDefaults(
    Shared.withOrdinal(
      Shared.withWeekday({
        /**
         * The ID of the "regular frequency monthly subexpr" this
         * "regular frequency monthly ordinal subexprs" belongs to
         */
        regularFrequencyMonthlySubexprId: text()
          .unique()
          .notNull()
          .references(() => regularFrequencyMonthlySubExprs.id, { onDelete: 'cascade' }),
      }),
    ),
  ),
)

/**
 * RegularFrequencyMonthlyDaysSubExpression for RegularFrequencyMonthlySubExpressions
 */
export const regularFrequencyMonthlyDaysSubExpr = sqliteTable(
  'regular_frequency_monthly_days_subexprs',
  withDefaults({
    /**
     * The ID of the "regular frequency monthly subexpr" this
     * "regular frequency monthly days subexprs" belongs to
     */
    regularFrequencyMonthlySubexprId: text()
      .unique()
      .notNull()
      .references(() => regularFrequencyMonthlySubExprs.id, { onDelete: 'cascade' }),

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
 * RegularFrequencyYearlyInSubExpression for RegularFrequencySubExpressions
 */
export const regularFrequencyYearlyInSubExprs = sqliteTable(
  'regular_frequency_yearly_in_subexprs',
  withDefaults({
    /**
     * The ID of the "regular frequency subexpr" this "regular frequency yearly-in subexprs"
     * belongs to
     */
    regularFrequencySubexprId: text()
      .unique()
      .notNull()
      .references(() => regularFrequencySubExprs.id, { onDelete: 'cascade' }),

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
  }),
)

/**
 * RegularFrequencyYearlyOnSubExpression for RegularFrequencySubExpressions
 */
export const regularFrequencyYearlyOnSubExprs = sqliteTable(
  'regular_frequency_yearly_on_subexprs',
  withDefaults(
    Shared.withOrdinal(
      Shared.withConstWeekday({
        /**
         * The ID of the "regular frequency subexpr" this "regular frequency yearly-in subexprs"
         * belongs to
         */
        regularFrequencySubexprId: text()
          .unique()
          .notNull()
          .references(() => regularFrequencySubExprs.id, { onDelete: 'cascade' }),

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
  ),
)
