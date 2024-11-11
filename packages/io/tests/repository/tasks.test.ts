import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { StitchesIOPort, open } from '../../src/lib'
import { TaskCreatePayload, TasksRepository } from '../../src/repositories/tasks'

describe('#TaskRepository', () => {
  let port: StitchesIOPort
  let taskRepository: TasksRepository

  const seedSize = 1000 // 10922: after which `Error: too many SQL variables`
  const database = new Uint8Array()

  beforeEach(async () => {
    port = await open(database, { wasm: false, log: false }).then((port) => (port.migrate(), port))

    taskRepository = new TasksRepository(port.mapper)

    const payloads: TaskCreatePayload[] = Array.from({ length: seedSize }).map((_, i) => ({
      id: `${i + 1}`,
      title: `Task ${i + 1}`,
      summary: `This makes ${i + 1} task(s)`,
    }))

    await taskRepository.create(payloads)
  })

  afterEach(() => port.close())

  it('should construct a new `TaskRepository` object', () => {
    expect(new TasksRepository(port.mapper)).toBeDefined()
  })

  describe('#findMany', () => {
    it('should find as many tasks', async () => {
      const result = await taskRepository.findMany()

      expect(result.length).toBe(seedSize)
    })

    it('should omit redacted tasks', async () => {
      const redacted = await taskRepository.redact('676')
      const result = await taskRepository.findMany()

      expect(result.find((t) => t.id === redacted!.id)).toBeUndefined()
      expect(result.length).toBe(seedSize - 1)
    })
  })

  describe('#findById', () => {
    it('should find a task by ID', async () => {
      const result = await taskRepository.findById('676')

      expect(result).toMatchObject({
        id: '676',
        title: 'Task 676',
        summary: 'This makes 676 task(s)',
      })
    })

    it('should omit redacted tasks', async () => {
      const redacted = await taskRepository.redact('676')
      const result = await taskRepository.findById(redacted.id)

      expect(result).toBeUndefined()
    })

    it('should return `undefined` when no task is found by the ID', async () => {
      const result = await taskRepository.findById('2000')
      expect(result).toBeUndefined()
    })
  })

  describe('#findRedacted', () => {
    it('should find as many redacted tasks', async () => {
      const readactedIds = ['512', '256', '128']

      await Promise.all([
        taskRepository.redact(readactedIds[0]),
        taskRepository.redact(readactedIds[1]),
        taskRepository.redact(readactedIds[2]),
      ])

      const result = await taskRepository.findRedacted()
      const resultSet = new Set(result.map((r) => r.id))

      expect(result.length).toBe(readactedIds.length)
      expect(readactedIds.map((id) => resultSet.has(id)).every((v) => v)).toBe(true)
    })
  })

  describe('#findRedactedById', () => {
    it('should find a redacted task by ID', async () => {
      const readactedIds = ['512', '256', '128']

      await Promise.all([
        taskRepository.redact(readactedIds[0]),
        taskRepository.redact(readactedIds[1]),
        taskRepository.redact(readactedIds[2]),
      ])

      const result = await taskRepository.findRedactedById('256')

      expect(result).toMatchObject({
        id: '256',
        title: 'Task 256',
        summary: 'This makes 256 task(s)',
      })
    })

    it('should omit unredacted tasks', async () => {
      const readactedIds = ['512', '256', '128']

      await Promise.all([
        taskRepository.redact(readactedIds[0]),
        taskRepository.redact(readactedIds[1]),
        taskRepository.redact(readactedIds[2]),
      ])

      const result = await taskRepository.findRedactedById('676')

      expect(result).toBeUndefined()
    })

    it('should return `undefined` when no task is found by the ID', async () => {
      const result = await taskRepository.findRedactedById('2000')
      expect(result).toBeUndefined()
    })
  })

  describe('#update', () => {
    it('should update a task by a given ID', async () => {
      const updated = await taskRepository.update('676', { title: 'Task six-seven-six' })
      const result = await taskRepository.findById('676')

      expect(updated).toStrictEqual(result)
    })

    it('should return `undefined` when no task is found by the ID', async () => {
      const updated = await taskRepository.update('2000', { title: 'Task six-seven-oops!' })
      expect(updated).toBeUndefined()
    })
  })

  describe('#redact', () => {
    it('should redact a task by the given ID', async () => {
      const redacted = await taskRepository.redact('676')
      const result = await taskRepository.findById('676')

      expect(redacted).toBeDefined()
      expect(result).toBeUndefined()
    })

    it('should return `undefined` when no task is found by the ID', async () => {
      const redacted = await taskRepository.redact('2000')
      expect(redacted).toBeUndefined()
    })
  })

  describe('#restore', () => {
    it('should restore a redacted task by the given ID', async () => {
      const redacted = await taskRepository.redact('676')
      const result = await taskRepository.findById('676')

      expect(redacted).toBeDefined()
      expect(redacted!.deletedAt).toBeDefined()
      expect(result).toBeUndefined()

      const restored = await taskRepository.restore('676')

      expect(restored).toBeDefined()
      expect(restored).toMatchObject({
        id: redacted!.id,
        title: redacted!.title,
        summary: redacted!.summary,
        deletedAt: null,
      })
    })

    it('should return `undefined` when no task is found by the ID', async () => {
      const redacted = await taskRepository.redact('2000')
      expect(redacted).toBeUndefined()
    })
  })

  describe('#delete', () => {
    it('should delete a task by the given ID', async () => {
      const deleted = await taskRepository.delete('676')
      const result = await taskRepository.findById('676')

      expect(deleted).toBeDefined()
      expect(deleted!.deletedAt).toBe(null)
      expect(result).toBeUndefined()

      expect(deleted).toMatchObject({
        id: deleted!.id,
        title: deleted!.title,
        summary: deleted!.summary,
        deletedAt: null,
      })
    })

    it('should be impossible to resore a deleted task', async () => {
      const deleted = await taskRepository.delete('676')
      const restored = await taskRepository.restore('676')

      expect(deleted).toBeDefined()
      expect(restored).toBeUndefined()
    })

    it('should return `undefined` when no task is found by the ID', async () => {
      const deleted = await taskRepository.delete('2000')
      expect(deleted).toBeUndefined()
    })
  })
})
