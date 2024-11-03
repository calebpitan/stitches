import { SQLJsDatabase, drizzle } from 'drizzle-orm/sql-js'
import initSqlJs from 'sql.js'

import * as schema from './schema'
import { migrate } from './migrator'
import { TasksRepository } from './repositories/tasks'

export type StitchesIOConfig = {
  /**
   * The URL to the wasm file for the SQLite 3 WebAssembly binary.
   */
  wasm?: URL
}

export interface StitchesIORepos {
  tasks: TasksRepository
}

export interface StitchesIODriver {
  /**
   * The database schema objects
   */
  schema: typeof schema
  /**
   * A repository of services for working with the database objects
   */
  repo: StitchesIORepos
  /**
   * A direct access to the Object Relational Mapper (ORM) for more
   * advanced control when the repository doesn't suffice
   */
  mapper: SQLJsDatabase<typeof schema>
  /**
   * A method to use to export the database file from memeory as a
   * `Uint8Array` representation in memory.
   */
  export(): Uint8Array
  /**
   * Keep the database up to date by running migration check.
   *
   * If there are any undeployed migrations, deploy them to keep up.
   */
  migrate(): void
  /**
   * Clones a new `StitchesIODriver` with the given database
   * using the same config as previously.
   *
   * @param database The database to clone the driver with
   * @returns The newly cloned `StitchesIODriver` with `database`
   */
  clone(database: Uint8Array): Promise<StitchesIODriver>
  /**
   * Close the database connection and free any memory being used.
   */
  close(): void
}

/**
 * Opens a SQLite database file and connect to it, returning a driver for working
 * with the database and a repository for accessing the entities on the database.
 *
 * NOTE: That there's the assumption that the database file conforms or would
 * conform to the schema definitions in this library and there are not much exposure
 * of lower level APIs. Most of it is abstracted away with ready-made schemas to fit
 * the Stitches app data requirements.
 *
 * @param database The typed array view on the database file to open
 * @param config The setup configurations
 * @returns A promises that resolves to an IO driver
 */
export async function open(
  database: Uint8Array,
  config?: StitchesIOConfig
): Promise<StitchesIODriver> {
  const sqljs = await initSqlJs({
    locateFile: (filename: string) => {
      return (config?.wasm ?? new URL(filename, 'https://sql.js.org/dist')).toString()
    }
  })

  const sqlite = new sqljs.Database(database)
  const mapper = drizzle(sqlite, { casing: 'snake_case', schema })
  const repo: StitchesIORepos = { tasks: new TasksRepository(mapper) }

  const driver: StitchesIODriver = {
    schema,
    mapper,
    repo,
    migrate: () => migrate(mapper),
    export: () => sqlite.export(),
    clone: async (database: Uint8Array) => await open(database, config),
    close: () => sqlite.close()
  }

  return driver
}
