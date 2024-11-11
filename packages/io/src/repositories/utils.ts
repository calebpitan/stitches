import { SQLWrapper, type UpdateTableConfig, isNotNull, isNull } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteTableWithColumns, TableConfig } from 'drizzle-orm/sqlite-core'

type BaseColumns = {
  id: SQLiteColumn
  createdAt: SQLiteColumn
  deletedAt: SQLiteColumn
  updatedAt: SQLiteColumn
}

export type Table<C extends Record<string, SQLiteColumn> = BaseColumns> = SQLiteTableWithColumns<
  UpdateTableConfig<TableConfig, { columns: C }>
>

export function withUnredacted<C extends Record<string, SQLiteColumn>, T extends Table<C>>(
  t: T,
  filters: SQLWrapper[],
) {
  return [...filters, isNull(t.deletedAt)]
}

export function withRedacted<C extends Record<string, SQLiteColumn>, T extends Table<C>>(
  t: T,
  filters: SQLWrapper[],
) {
  return [...filters, isNotNull(t.deletedAt)]
}
