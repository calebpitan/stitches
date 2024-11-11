import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { StitchesIOPort, open } from '../../src/lib'
import { TagsCreatePayload, TagsRepository } from '../../src/repositories/tags'
import { TaskCreatePayload, TasksRepository } from '../../src/repositories/tasks'

describe('#TagsToTaskAssociation', () => {
  let port: StitchesIOPort
  let tagsRepository: TagsRepository
  let tasksRepository: TasksRepository

  const seedSize = 1000
  const database = new Uint8Array()

  beforeEach(async () => {
    port = await open(database, { wasm: false, log: false }).then((port) => (port.migrate(), port))
    tagsRepository = new TagsRepository(port.mapper)
    tasksRepository = new TasksRepository(port.mapper)

    const tagsPayload: TagsCreatePayload[] = Array.from({ length: seedSize }).map((_, i) => ({
      id: `${i + 1}`,
      label: `Tag ${i + 1}`,
    }))

    const tasksPayload: TaskCreatePayload[] = Array.from({ length: seedSize }).map((_, i) => ({
      id: `${i + 1}`,
      title: `Task ${i + 1}`,
      summary: `This makes ${i + 1} task(s)`,
    }))

    await Promise.all([tasksRepository.create(tasksPayload), tagsRepository.create(tagsPayload)])
  })

  afterEach(() => port.close())

  describe('#associate', () => {
    it('should associate tasks with tags', async () => {
      const taskId = '1'
      const promises: Promise<void>[] = new Array(seedSize)

      for (let i = 1; i < seedSize + 1; i++) {
        promises.push(tasksRepository.tags.associate(i.toString(), taskId))
      }

      await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

      const associations = await tasksRepository.tags.associations(taskId, 'tags')

      expect(associations.tags.length).toEqual(seedSize)
    })

    it('should associate tags with tasks', async () => {
      const tagId = '1'
      const promises: Promise<void>[] = new Array(seedSize)

      for (let i = 1; i < seedSize + 1; i++) {
        promises.push(tagsRepository.tasks.associate(tagId, i.toString()))
      }

      await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

      const associations = await tagsRepository.tasks.associations(tagId, 'tasks')

      expect(associations.tasks.length).toEqual(seedSize)
    })
  })

  describe('#unassociate', () => {
    it('should unassociate tasks with tags', async () => {
      const taskId = '1'
      {
        const promises: Promise<void>[] = new Array(seedSize)

        for (let i = 1; i < seedSize + 1; i++) {
          promises.push(tasksRepository.tags.associate(i.toString(), taskId))
        }

        await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

        const associations = await tasksRepository.tags.associations(taskId, 'tags')

        expect(associations.tags.length).toEqual(seedSize)
      }

      {
        const promises: Promise<void>[] = new Array(seedSize)

        for (let i = 0; i < seedSize + 1; i++) {
          promises.push(tasksRepository.tags.unassociate(i.toString(), taskId))
        }

        await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

        const associations = await tasksRepository.tags.associations(taskId, 'tags')

        expect(associations.tags.length).toEqual(0)
      }
    })

    it('should associate tags with tasks', async () => {
      const tagId = '1'

      {
        const promises: Promise<void>[] = new Array(seedSize)

        for (let i = 1; i < seedSize + 1; i++) {
          promises.push(tagsRepository.tasks.associate(tagId, i.toString()))
        }

        await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

        const associations = await tagsRepository.tasks.associations(tagId, 'tasks')

        expect(associations.tasks.length).toEqual(seedSize)
      }

      {
        const promises: Promise<void>[] = new Array(seedSize)

        for (let i = 1; i < seedSize + 1; i++) {
          promises.push(tagsRepository.tasks.unassociate(tagId, i.toString()))
        }

        await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

        const associations = await tagsRepository.tasks.associations(tagId, 'tasks')

        expect(associations.tasks.length).toEqual(0)
      }
    })
  })
})
