import * as schema from '../schema'
import { RepositoryFactory } from './factory'

/**
 * Schedules repository for working with, and managing, schedules
 */
export class SchedulesRepository extends RepositoryFactory('schedules', {
  table: schema.schedules,
}) {}

/**
 * CustomFrequencies repository for working with, and managing,
 * cron-scheduled frequencies
 */
export class CustomFrequenciesRepository extends RepositoryFactory('customFrequencies', {
  table: schema.customFrequencies,
}) {}

/**
 * RegularFrequencies repository for working with, and managing, conventional,
 * calendar scheduling
 */
export class RegularFrequenciesRepository extends RepositoryFactory('regularFrequencies', {
  table: schema.regularFrequencies,
}) {}

/**
 * RegularFrequencyExpressions repository for expressing repeat strategies
 * of all sorts for a schedule—hourly, daily, weekly, monthly, yearly.
 */
export class RegFreqExpressionsRepository extends RepositoryFactory('regularFrequencyExprs', {
  table: schema.regularFrequencyExprs,
}) {}

/**
 * RegularFrequencySubExpressions repository for specifying additonal
 * expressions that qualifies or modifies original expressions either
 * by adding conditionals or filtering to more accurate and precise
 * schedules.
 */
export class RegFreqSubExprsRepository extends RepositoryFactory('regularFrequencySubExprs', {
  table: schema.regularFrequencySubExprs,
}) {}

/**
 * RegularFrequencyWeeklySubExpressions repository for adding conditionals
 * and filtering original expressions down to specific days of the week
 * hence modifying and/or qualifying original repeat strategies.
 */
export class RegFreqWeeklySubExprsRepository extends RepositoryFactory(
  'regularFrequencyWeeklySubExprs',
  {
    table: schema.regularFrequencyWeeklySubExprs,
  },
) {}

/**
 * RegularFrequencyMonthlySubExpressions repository for adding conditionals
 * and filtering original expressions down to specific days of the month or
 * even dynamically evaluated days of the month using ordinals and weekdays.
 */
export class RegFreqMonthlySubExprsRepository extends RepositoryFactory(
  'regularFrequencyMonthlySubExprs',
  {
    table: schema.regularFrequencyMonthlySubExprs,
  },
) {}

/**
 * RegularFrequencyMonthlyOrdinalSubExpressions repository for adding conditionals
 * and filtering original expressions down to specific days of the month by
 * dynamically evaluating days of the month using the specified ordinals and
 * weekdays.
 */
export class RegFreqMonthlyOrdinalSubExprsRepository extends RepositoryFactory(
  'regularFrequencyMonthlyOrdinalSubExpr',
  {
    table: schema.regularFrequencyMonthlyOrdinalSubExpr,
  },
) {}

/**
 * RegularFrequencyMonthlyDaysSubExpressions repository for adding conditionals
 * and filtering original expressions down to specific days of the month by
 * specifying applicable days of the month only
 */
export class RegFreqMonthlyDaysSubExprsRepository extends RepositoryFactory(
  'regularFrequencyMonthlyDaysSubExpr',
  {
    table: schema.regularFrequencyMonthlyDaysSubExpr,
  },
) {}

/**
 * RegularFrequencyYearlyInSubExpressions repository for adding conditionals
 * and filtering original expressions down to specific months of the year by
 * specifying applicable months of the year only.
 */
export class RegFreqYearlyInSubExprsRepository extends RepositoryFactory(
  'regularFrequencyYearlyInSubExprs',
  {
    table: schema.regularFrequencyYearlyInSubExprs,
  },
) {}

/**
 * RegularFrequencyYearlyOnSubExpressions repository for modifying conditionals
 * and filtering original "yearly in" sub-expressions down to specific days of
 * the month by dynamically evaluating days of the month using the specified
 * ordinals and weekdays.
 */
export class RegFreqYearlyOnSubExprsRepository extends RepositoryFactory(
  'regularFrequencyYearlyOnSubExprs',
  {
    table: schema.regularFrequencyYearlyOnSubExprs,
  },
) {}
