import { SQLWrapper, type UpdateTableConfig, isNotNull, isNull } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteTableWithColumns, TableConfig } from 'drizzle-orm/sqlite-core'

export type Table = SQLiteTableWithColumns<
  UpdateTableConfig<
    TableConfig,
    {
      columns: {
        id: SQLiteColumn
        createdAt: SQLiteColumn
        deletedAt: SQLiteColumn
        updatedAt: SQLiteColumn
      }
    }
  >
>

export function withUnredacted<T extends Table>(t: T, filters: SQLWrapper[]) {
  return [...filters, isNull(t.deletedAt)]
}

export function withRedacted<T extends Table>(t: T, filters: SQLWrapper[]) {
  return [...filters, isNotNull(t.deletedAt)]
}
