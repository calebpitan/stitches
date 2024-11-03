import { sql } from 'drizzle-orm'
import { monotonicFactory } from 'ulidx'

export const ulid = monotonicFactory()

export const fragments = {
  now: sql`((strftime('%s', 'now') * 1000) + (strftime('%f', 'now') % 1 * 1000))`
}
