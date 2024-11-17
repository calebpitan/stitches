import { sql } from 'drizzle-orm'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { StitchesIOPort, open } from '../../src/lib'
import { CollectionError } from '../../src/repositories/factory'
import { TaskCreatePayload, TasksRepository } from '../../src/repositories/tasks'

describe('#TaskRepository', () => {
  let port: StitchesIOPort
  let tasksRepository: TasksRepository

  const seedSize = 1000 // 10922: after which `Error: too many SQL variables`
  const database = new Uint8Array()

  beforeAll(async () => {
    port = await open(database, { wasm: false, log: false }).then((port) => (port.migrate(), port))
  })

  afterAll(() => port.close())

  beforeEach(async () => {
    tasksRepository = new TasksRepository(port.mapper)

    const payloads: TaskCreatePayload[] = Array.from({ length: seedSize }).map((_, i) => ({
      id: `${i + 1}`,
      title: `Task ${i + 1}`,
      summary: `This makes ${i + 1} task(s)`,
    }))

    await tasksRepository.create(payloads)
  })

  afterEach(async () => {
    port.mapper.run(sql`
      DELETE FROM ${port.schema.tasks};
    `)
  })

  it('should construct a new `TaskRepository` object', () => {
    expect(new TasksRepository(port.mapper)).toBeDefined()
  })

  // describe('#withSession', () => {
  //   it('should create a new repository with the given session', () => {
  //     port.mapper.transaction((tx) => {
  //       const newTasksRepository = tasksRepository.withSession(tx)

  //       expect(newTasksRepository).toBeInstanceOf(TasksRepository)
  //       expect(newTasksRepository.db).toStrictEqual(tx)
  //       expect(tasksRepository.db).not.toStrictEqual(tx)
  //     })
  //   })
  // })

  describe('#findMany', () => {
    it('should find as many tasks', async () => {
      const result = await tasksRepository.findMany()

      expect(result.length).toBe(seedSize)
    })

    it('should omit redacted tasks', async () => {
      const redacted = await tasksRepository.redact('676')
      const result = await tasksRepository.findMany()

      expect(result.find((t) => t.id === redacted!.id)).toBeUndefined()
      expect(result.length).toBe(seedSize - 1)
    })
  })

  describe('#findById', () => {
    it('should find a task by ID', async () => {
      const result = await tasksRepository.findById('676')

      expect(result).toMatchObject({
        id: '676',
        title: 'Task 676',
        summary: 'This makes 676 task(s)',
      })
    })

    it('should omit redacted tasks', async () => {
      const redacted = await tasksRepository.redact('676')
      const resultPromise = tasksRepository.findById(redacted.id)

      await expect(resultPromise).rejects.toThrowError(CollectionError)
    })

    it('should throw an error when no task is found by the ID', async () => {
      const resultPromise = tasksRepository.findById('2000')
      await expect(resultPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#findRedacted', () => {
    it('should find as many redacted tasks', async () => {
      const readactedIds = ['512', '256', '128']

      await Promise.all([
        tasksRepository.redact(readactedIds[0]),
        tasksRepository.redact(readactedIds[1]),
        tasksRepository.redact(readactedIds[2]),
      ])

      const result = await tasksRepository.findRedacted()
      const resultSet = new Set(result.map((r) => r.id))

      expect(result.length).toBe(readactedIds.length)
      expect(readactedIds.map((id) => resultSet.has(id)).every((v) => v)).toBe(true)
    })
  })

  describe('#findRedactedById', () => {
    it('should find a redacted task by ID', async () => {
      const readactedIds = ['512', '256', '128']

      await Promise.all([
        tasksRepository.redact(readactedIds[0]),
        tasksRepository.redact(readactedIds[1]),
        tasksRepository.redact(readactedIds[2]),
      ])

      const result = await tasksRepository.findRedactedById('256')

      expect(result).toMatchObject({
        id: '256',
        title: 'Task 256',
        summary: 'This makes 256 task(s)',
      })
    })

    it('should omit unredacted tasks', async () => {
      const readactedIds = ['512', '256', '128']

      await Promise.all([
        tasksRepository.redact(readactedIds[0]),
        tasksRepository.redact(readactedIds[1]),
        tasksRepository.redact(readactedIds[2]),
      ])

      const result = tasksRepository.findRedactedById('676')

      await expect(result).rejects.toThrowError(CollectionError)
    })

    it('should throw an error when no task is found by the ID', async () => {
      const resultPromise = tasksRepository.findRedactedById('2000')
      await expect(resultPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#update', () => {
    it('should update a task by a given ID', async () => {
      const updated = await tasksRepository.update('676', { title: 'Task six-seven-six' })
      const result = await tasksRepository.findById('676')

      expect(updated).toStrictEqual(result)
    })

    it('should throw an error when no task is found by the ID', async () => {
      const updatedPromise = tasksRepository.update('2000', { title: 'Task six-seven-oops!' })
      await expect(updatedPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#redact', () => {
    it('should redact a task by the given ID', async () => {
      const redacted = await tasksRepository.redact('676')
      const resultPromise = tasksRepository.findById('676')

      expect(redacted).toBeDefined()
      await expect(resultPromise).rejects.toThrowError(CollectionError)
    })

    it('should throw an error when no task is found by the ID', async () => {
      const redactedPromise = tasksRepository.redact('2000')
      await expect(redactedPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#restore', () => {
    it('should restore a redacted task by the given ID', async () => {
      const redacted = await tasksRepository.redact('676')
      const resultPromise = tasksRepository.findById('676')

      expect(redacted).toBeDefined()
      expect(redacted!.deletedAt).toBeDefined()
      await expect(resultPromise).rejects.toThrowError(CollectionError)

      const restored = await tasksRepository.restore('676')

      expect(restored).toBeDefined()
      expect(restored).toMatchObject({
        id: redacted!.id,
        title: redacted!.title,
        summary: redacted!.summary,
        deletedAt: null,
      })
    })

    it('should throw an error when no task is found by the ID', async () => {
      const redactedPromise = tasksRepository.redact('2000')
      await expect(redactedPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#delete', () => {
    it('should delete a task by the given ID', async () => {
      const deleted = await tasksRepository.delete('676')
      const resultPromise = tasksRepository.findById('676')

      expect(deleted).toBeDefined()
      expect(deleted.deletedAt).toBe(null)
      await expect(resultPromise).rejects.toThrowError(CollectionError)

      expect(deleted).toMatchObject({
        id: deleted.id,
        title: deleted.title,
        summary: deleted.summary,
        deletedAt: null,
      })
    })

    it('should be impossible to resore a deleted task', async () => {
      const deleted = await tasksRepository.delete('676')
      const restoredPromise = tasksRepository.restore('676')

      expect(deleted).toBeDefined()
      await expect(restoredPromise).rejects.toThrowError(CollectionError)
    })

    it('should return `undefined` when no task is found by the ID', async () => {
      const deleted = await tasksRepository.delete('2000')
      expect(deleted).toBeUndefined()
    })
  })
})
