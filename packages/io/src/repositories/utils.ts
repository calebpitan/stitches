import { type UpdateTableConfig, isNotNull, isNull } from 'drizzle-orm'
import type {
  AnySQLiteSelect,
  SQLiteColumn,
  SQLiteTableWithColumns,
  TableConfig
} from 'drizzle-orm/sqlite-core'

type Table = SQLiteTableWithColumns<
  UpdateTableConfig<TableConfig, { columns: { deletedAt: SQLiteColumn } }>
>
type Query = AnySQLiteSelect | Omit<AnySQLiteSelect, 'where'>
type DynamicQuery<Q extends Query> = ReturnType<Q['$dynamic']>

export function withUnredacted<Q extends Query, T extends Table>(q: Q, t: T): DynamicQuery<Q> {
  return q.$dynamic().where(isNull(t.deletedAt)) as ReturnType<Q['$dynamic']>
}

export function withRedacted<Q extends Query, T extends Table>(q: Q, t: T): DynamicQuery<Q> {
  return q.$dynamic().where(isNotNull(t.deletedAt)) as DynamicQuery<Q>
}
