import { SQLJsDatabase, drizzle } from 'drizzle-orm/sql-js'
import initSqlJs from 'sql.js'

import * as schema from './schema'
import { migrate } from './migrator'
import { TagsRepository } from './repositories/tags'
import { TasksRepository } from './repositories/tasks'

export type StitchesIOConfig = {
  /**
   * The URL to the wasm file for the SQLite 3 WebAssembly binary.
   */
  wasm?: URL | false
  log?: boolean
}

export interface StitchesIORepos {
  tasks: TasksRepository
  tags: TagsRepository
}

export interface StitchesIOPort {
  /**
   * The database schema objects
   */
  schema: schema.Schema
  /**
   * A repository of services for working with the database objects
   */
  repo: StitchesIORepos
  /**
   * A direct access to the Object Relational Mapper (ORM) for more
   * advanced control when the repository doesn't suffice
   */
  mapper: SQLJsDatabase<schema.Schema>
  /**
   * A method to use to export the database file from memory as a
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
   * Clones a new `StitchesIOPort` with the given database
   * using the same config as previously.
   *
   * @param database The database to clone the port with
   * @returns The newly cloned `StitchesIOPort` with `database`
   */
  clone(database: Uint8Array): Promise<StitchesIOPort>
  /**
   * Close the database connection and free any memory being used.
   */
  close(): void
}

function getFileLocator(url?: URL) {
  return (filename: string) => {
    return (url ?? new URL(filename, 'https://sql.js.org/dist/')).toString()
  }
}

/**
 * Opens a SQLite database file and connect to it, returning a port for working
 * with the database and a repository for accessing the entities on the database.
 *
 * NOTE: That there's the assumption that the database file conforms or would
 * conform to the schema definitions in this library and there are not much exposure
 * of lower level APIs. Most of it is abstracted away with ready-made schemas to fit
 * the Stitches app data requirements.
 *
 * @param database The typed array view on the database file to open
 * @param config The setup configurations
 * @returns A promises that resolves to an IO port
 */
export async function open(
  database: Uint8Array,
  config: StitchesIOConfig = {}
): Promise<StitchesIOPort> {
  const cfg: initSqlJs.SqlJsConfig = {
    locateFile: config.wasm !== false ? getFileLocator(config.wasm) : undefined
  }

  const SQLite = await initSqlJs(cfg)
  const sqlite = new SQLite.Database(database)
  const mapper = drizzle<schema.Schema>(sqlite, {
    casing: 'snake_case',
    schema: schema,
    logger: config.log
  })

  const repo: StitchesIORepos = {
    tasks: new TasksRepository(mapper),
    tags: new TagsRepository(mapper)
  }

  const port: StitchesIOPort = {
    schema,
    mapper,
    repo,
    migrate: () => migrate(mapper),
    export: () => sqlite.export(),
    clone: async (database: Uint8Array) => await open(database, config),
    close: () => sqlite.close()
  }

  return port
}
