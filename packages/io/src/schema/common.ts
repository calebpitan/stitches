import { integer, text } from 'drizzle-orm/sqlite-core'

import { fragments, ulid } from '../utils'

export const identifier = {
  id: text()
    .primaryKey()
    .$defaultFn(() => ulid())
}

export const timestamps = {
  createdAt: integer({ mode: 'timestamp_ms' }).default(fragments.now).notNull(),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .default(fragments.now)
    .$onUpdateFn(() => fragments.now)
    .notNull(),
  deletedAt: integer({ mode: 'timestamp_ms' })
}

export function withDefaults<S extends Record<string, any>>(schema: S) {
  return {
    ...identifier,
    ...schema,
    ...timestamps
  }
}
