import { and, asc, desc, eq, isNull, lt } from 'drizzle-orm'

import * as schema from '../schema'
import { Criteria } from './criteria.builder'
import { CollectionErrno, CollectionError, RepositoryAbstractFactory } from './factory'

export namespace timeseries {
  export type TimeSeries = typeof schema.timeSeries.$inferSelect
}

export class TimeSeriesRepository extends RepositoryAbstractFactory('timeSeries', {
  table: schema.timeSeries,
}) {
  async allPastDueWithoutCompletion(criteria?: Criteria) {
    const result = await this._db
      .select()
      .from(schema.timeSeries)
      .leftJoin(schema.completions, eq(schema.timeSeries.id, schema.completions.timeSeriesId))
      .where(
        and(
          criteria?.filters(),
          lt(schema.timeSeries.dueAt, new Date()),
          isNull(schema.completions.id),
        ),
      )
      .execute()

    console.assert(
      result.every((t) => t.completions === null),
      'All completions must be null',
    )

    if (!result.every((t) => t.completions === null))
      throw new Error('All completions must be null')

    return result.map((t) => t.time_series)
  }

  async allUncompleted(criteria?: Criteria) {
    const props = criteria?.properties()
    const query = this._db
      .select()
      .from(schema.timeSeries)
      .leftJoin(schema.completions, eq(schema.timeSeries.id, schema.completions.timeSeriesId))
      .where(and(criteria?.filters(), isNull(schema.completions.id)))
      .orderBy(...(props?.orderings || []))

    if (props?.skip) query.offset(props.skip)
    if (props?.limit) query.limit(props.limit)
    const result = await query.execute()
    return result.map((t) => t.time_series)
  }

  async onlyFormerlyPastDueWithoutCompletion(criteria?: Criteria) {
    const result = await this._db
      .select()
      .from(schema.timeSeries)
      .leftJoin(schema.completions, eq(schema.timeSeries.id, schema.completions.timeSeriesId))
      .where(
        and(
          criteria?.filters(),
          lt(schema.timeSeries.dueAt, new Date()),
          isNull(schema.completions.id),
        ),
      )
      .orderBy(asc(schema.timeSeries.dueAt))
      .limit(1)
      .execute()

    const timeseries = result.map((t) => t.time_series).at(0)

    if (!timeseries) throw new CollectionError(CollectionErrno.NOT_FOUND)

    return timeseries
  }

  async onlyRecentlyPastDueWithoutCompletion(criteria?: Criteria) {
    const result = await this._db
      .select()
      .from(schema.timeSeries)
      .leftJoin(schema.completions, eq(schema.timeSeries.id, schema.completions.timeSeriesId))
      .where(
        and(
          criteria?.filters(),
          lt(schema.timeSeries.dueAt, new Date()),
          isNull(schema.completions.id),
        ),
      )
      .orderBy(desc(schema.timeSeries.dueAt))
      .limit(1)
      .execute()

    const timeseries = result.map((t) => t.time_series).at(0)

    if (!timeseries) throw new CollectionError(CollectionErrno.NOT_FOUND)

    return timeseries
  }
}
