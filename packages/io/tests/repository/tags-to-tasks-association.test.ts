import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { StitchesIOPort, open } from '../../src/lib'
import { TagsToTaskAssociation } from '../../src/repositories/associations'
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

  describe('#associations', () => {
    it('should find all associations between tags and tasks', async () => {
      await Promise.all([
        tasksRepository.tags.associate('1', '20'),
        tasksRepository.tags.associate('1', '300'),
        tasksRepository.tags.associate('9', '1000'),
        tasksRepository.tags.associate('1', '1'),
        tasksRepository.tags.associate('20', '1'),
        tasksRepository.tags.associate('300', '1'),
        tasksRepository.tags.associate('1000', '2'),
      ])

      const tagsToTasks = new TagsToTaskAssociation(port.mapper)

      const tagsAssociations = await tasksRepository.tags.associations('1', 'tags')
      const tasksAssociations = await tagsRepository.tasks.associations('1', 'tasks')
      const allAssociations = await tagsToTasks.associations('1')

      // console.log('Tags', tagsAssociations)
      // console.log('Tasks', tasksAssociations)
      // console.log('All', allAssociations)

      expect(tagsAssociations.tags).toMatchObject(allAssociations.tags)
      expect(tasksAssociations.tasks).toMatchObject(allAssociations.tasks)
    })
  })

  describe('#associate', () => {
    it('should associate tasks with tags', async () => {
      const taskId = '1'
      const promises: Promise<void>[] = Array.from({ length: seedSize })

      for (let i = 1; i < seedSize + 1; i++) {
        promises.push(tasksRepository.tags.associate(taskId, i.toString()))
      }

      await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

      const associations = await tasksRepository.tags.associations(taskId, 'tags')

      expect(associations.tags.length).toEqual(seedSize)
    })

    it('should associate tags with tasks', async () => {
      const tagId = '1'
      const promises: Promise<void>[] = Array.from({ length: seedSize })

      for (let i = 1; i < seedSize + 1; i++) {
        promises.push(tagsRepository.tasks.associate(i.toString(), tagId))
      }

      await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

      const associations = await tagsRepository.tasks.associations(tagId, 'tasks')

      expect(associations.tasks.length).toEqual(seedSize)
    })

    it('should fail when the tag or the task being associated with does not exist', async () => {
      const [nonExistingTagId, nonExistingTaskId] = [
        (seedSize + 1).toString(),
        (seedSize + 1).toString(),
      ]
      const tagAssociationPromise = tasksRepository.tags.associate('1', nonExistingTagId)
      const taskAssociationPromise = tagsRepository.tasks.associate(nonExistingTaskId, '1')

      await expect(tagAssociationPromise).rejects.toThrowError('FOREIGN KEY constraint failed')
      await expect(taskAssociationPromise).rejects.toThrowError('FOREIGN KEY constraint failed')
    })
  })

  describe('#unassociate', () => {
    it('should unassociate tasks with tags', async () => {
      const taskId = '1'

      //Association
      {
        const promises: Promise<void>[] = Array.from({ length: seedSize })

        for (let i = 1; i < seedSize + 1; i++) {
          promises.push(tasksRepository.tags.associate(taskId, i.toString()))
        }

        await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

        const associations = await tasksRepository.tags.associations(taskId, 'tags')

        expect(associations.tags.length).toEqual(seedSize)
      }

      // Unassociation
      {
        const promises: Promise<void>[] = Array.from({ length: seedSize })

        for (let i = 1; i <= seedSize; i++) {
          promises.push(tasksRepository.tags.unassociate(taskId, i.toString()))
        }

        await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

        const associations = await tasksRepository.tags.associations(taskId, 'tags')

        expect(associations.tags.length).toEqual(0)
      }
    })

    it('should unassociate tags with tasks', async () => {
      const tagId = '1'

      // Association
      {
        const promises: Promise<void>[] = Array.from({ length: seedSize })

        for (let i = 1; i < seedSize + 1; i++) {
          promises.push(tagsRepository.tasks.associate(i.toString(), tagId))
        }

        await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

        const associations = await tagsRepository.tasks.associations(tagId, 'tasks')

        expect(associations.tasks.length).toEqual(seedSize)
      }

      // Unassociation
      {
        const promises: Promise<void>[] = Array.from({ length: seedSize })

        for (let i = 1; i < seedSize + 1; i++) {
          promises.push(tagsRepository.tasks.unassociate(i.toString(), tagId))
        }

        await expect(Promise.all(promises)).resolves.toBeInstanceOf(Array)

        const associations = await tagsRepository.tasks.associations(tagId, 'tasks')

        expect(associations.tasks.length).toEqual(0)
      }
    })

    it('should fail when the tag or the task being uassociated with does not exist', async () => {
      const [nonExistingTagId, nonExistingTaskId] = [
        (seedSize + 1).toString(),
        (seedSize + 1).toString(),
      ]
      const tagAssociationPromise = tasksRepository.tags.unassociate('1', nonExistingTagId)
      const taskAssociationPromise = tagsRepository.tasks.unassociate(nonExistingTaskId, '1')

      await expect(tagAssociationPromise).rejects.toThrowError()
      await expect(taskAssociationPromise).rejects.toThrowError()
    })
  })
})
