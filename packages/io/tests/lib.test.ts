import { getTableName, sql } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { StitchesIOPort, open } from '../src/lib'
import { TABLE_NAME } from '../src/migrator'

describe('#open', () => {
  let port: StitchesIOPort

  const database = new Uint8Array()

  beforeEach(async () => {
    port = await open(database, { wasm: false, log: true })
  })

  afterEach(() => port.close())

  it('should open a new database connection given a database file', () => {
    expect(port).toBeDefined()
  })

  it('should expose certain APIs on the port', () => {
    expect(port.schema).toBeDefined()
    expect(port.mapper).toBeDefined()
    expect(port.repo.tags).toBeDefined()
    expect(port.repo.tasks).toBeDefined()
    expect(port.clone).toBeInstanceOf(Function)
    expect(port.close).toBeInstanceOf(Function)
    expect(port.export).toBeInstanceOf(Function)
    expect(port.migrate).toBeInstanceOf(Function)
  })

  describe('#clone', () => {
    it('should clone the IO port with a separate database', async () => {
      const cloned = await port.clone(database)

      expect(cloned).toBeDefined()
      expect(cloned.schema).toBeDefined()
      expect(cloned.mapper).toBeDefined()
      expect(cloned.repo.tags).toBeDefined()
      expect(cloned.repo.tasks).toBeDefined()
      expect(cloned.clone).toBeInstanceOf(Function)
      expect(cloned.close).toBeInstanceOf(Function)
      expect(cloned.export).toBeInstanceOf(Function)
      expect(cloned.migrate).toBeInstanceOf(Function)

      cloned.close()
    })
  })

  describe('#close', () => {
    it('should close the IO port and free memory', async () => {
      const cloned = await port.clone(database)
      const query = () => cloned.mapper.values<[string]>(sql`SELECT 'Hello, world!';`)

      expect(query().at(0)!).toEqual(['Hello, world!'])

      cloned.close()

      expect(query).toThrowErrorMatchingInlineSnapshot(`[Error: out of memory]`)
    })
  })

  describe('#export', () => {
    it('should export the database state from memory as a `Uint8Array`', () => {
      const exported = port.export()

      expect(exported).toBeInstanceOf(Uint8Array)
    })
  })

  describe('#migrate', () => {
    it('should export an empty database prior to migrations being run', () => {
      const exported = port.export()

      expect(exported.byteLength).toBe(0)
      expect(exported.length).toBe(0)
    })

    it('should run all migrations to keep the database up to date', () => {
      expect(port.export().byteLength).toBe(0)

      port.migrate()

      const exported = port.export()

      expect(exported.byteLength).not.toBe(0)
      expect(exported.length).not.toBe(0)
    })

    it('should ensure migration history is saved and up to date with deployment', async () => {
      expect(port.export().byteLength).toBe(0)

      port.migrate()

      const deployments = await import('../src/migrations/deployment.json', {
        with: { type: 'json' }
      }).then(({ default: deployments }) => {
        return deployments.map((d) => ({
          id: d.idx + 1,
          hash: d.hash,
          tag: d.tag,
          created_at: d.when
        }))
      })

      const result = port.mapper.all<
        { id: number; hash: string; tag: string; created_at: number }[]
      >(sql`SELECT * FROM ${TABLE_NAME};`)

      expect(result).toEqual(deployments)
    })

    it('should ensure the database schemas are created', async () => {
      expect(port.export().byteLength).toBe(0)

      port.migrate()

      const tables = (
        ['tasks', 'tags', 'tagsToTasks'] as const satisfies ReadonlyArray<keyof typeof port.schema>
      ).map((k) => {
        return getTableName(port.schema[k])
      })

      const result = port.mapper.all<{ name: string }>(
        sql`SELECT name FROM sqlite_master WHERE type='table';`
      )

      const dbtables = new Set(result.map((r) => r.name))

      expect(tables.map((t) => dbtables.has(t)).every((v) => v)).toBe(true)
    })
  })
})
