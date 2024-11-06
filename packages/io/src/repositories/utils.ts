import { SQLWrapper, type UpdateTableConfig, isNotNull, isNull } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteTableWithColumns, TableConfig } from 'drizzle-orm/sqlite-core'

type Table = SQLiteTableWithColumns<
  UpdateTableConfig<TableConfig, { columns: { deletedAt: SQLiteColumn } }>
>

export function withUnredacted<T extends Table>(t: T, filters: SQLWrapper[]) {
  return [...filters, isNull(t.deletedAt)]
}

export function withRedacted<T extends Table>(t: T, filters: SQLWrapper[]) {
  return [...filters, isNotNull(t.deletedAt)]
}
