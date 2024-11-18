import { SQLWrapper, type UpdateTableConfig, isNotNull, isNull } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteTableWithColumns, TableConfig } from 'drizzle-orm/sqlite-core'

export type BaseColumns = {
  id: SQLiteColumn
  createdAt: SQLiteColumn
  deletedAt: SQLiteColumn
  updatedAt: SQLiteColumn
}

export type Table<C extends BaseColumns = BaseColumns> = SQLiteTableWithColumns<
  UpdateTableConfig<TableConfig, { columns: C }>
>

export function withUnredacted<C extends BaseColumns, T extends Table<C>>(
  t: T,
  filters: SQLWrapper[],
) {
  return [...filters, isNull(t.deletedAt)]
}

export function withRedacted<C extends BaseColumns, T extends Table<C>>(
  t: T,
  filters: SQLWrapper[],
) {
  return [...filters, isNotNull(t.deletedAt)]
}
