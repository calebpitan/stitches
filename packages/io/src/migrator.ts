/*!
 * Allows running migrations in the browser after they have been exported to a
 * serializabele format (JSON) by `/scripts/deploy.mjs`, the result of which is
 * found at `./migrations/deployment.json`.
 *
 * This script was originally adapted from:
 * https://github.com/drizzle-team/drizzle-orm/issues/1009#issuecomment-2193012293
 */
import { sql } from 'drizzle-orm'
import { SQLJsDatabase } from 'drizzle-orm/sql-js'

import config from './migrations/deployment.json'

export const TABLE_NAME = sql.identifier('__drizzle_migrations')

export function migrate<TSchema extends Record<string, unknown>>(db: SQLJsDatabase<TSchema>) {
  db.run(
    sql`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        hash TEXT NOT NULL,
        tag TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `
  )

  const deployments = db.values<[number, string, string]>(
    sql`
      SELECT id,
        hash,
        created_at 
      FROM ${TABLE_NAME} 
      ORDER BY created_at DESC 
      LIMIT 1;
    `
  )

  const deployment = deployments.at(0)

  const migrations = config.filter((migration) => {
    const timestamp = deployment?.at(2)
    return !deployment || Number(timestamp) < migration.when
  })

  if (migrations.length === 0) {
    return console.log('There, currently, are no migrations to deploy')
  }

  db.transaction((tx) => {
    migrations.forEach((migration, i) => {
      console.info('%d. Deploying migration:', i + 1)
      console.info('     TAG => %s', migration.tag)
      console.info('     HASH => %s', migration.hash)
      migration.sql.forEach((stmt) => tx.run(stmt))

      tx.run(
        sql`
          INSERT INTO ${TABLE_NAME} ("hash", "created_at", "tag") VALUES (
            ${sql.raw(`'${migration.hash}'`)},
            ${sql.raw(`${migration.when}`)},
            ${sql.raw(`'${migration.tag}'`)}
          );
        `
      )
    })
  })

  console.info('Database up to date!')
}
