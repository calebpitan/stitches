import { sql } from 'drizzle-orm'
import { monotonicFactory } from 'ulidx'

export const ulid = monotonicFactory()

export const fragments = {
  now: sql`(strftime('%s', 'now') || substr(strftime('%f', 'now'), -3))`
}
