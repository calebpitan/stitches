import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { StitchesIOPort, open } from '../../src/lib'
import { CollectionError } from '../../src/repositories/factory'
import { TagsCreatePayload, TagsRepository } from '../../src/repositories/tags'

describe('#TagsRepository', () => {
  let port: StitchesIOPort
  let tagsRepository: TagsRepository

  const seedSize = 1000 // 10922: after which `Error: too many SQL variables`
  const database = new Uint8Array()

  beforeEach(async () => {
    port = await open(database, { wasm: false, log: false }).then((port) => (port.migrate(), port))

    tagsRepository = new TagsRepository(port.mapper)

    const payloads: TagsCreatePayload[] = Array.from({ length: seedSize }).map((_, i) => ({
      id: `${i + 1}`,
      label: `Tag ${i + 1}`,
    }))

    await tagsRepository.create(payloads)
  })

  afterEach(() => port.close())

  it('should construct a new `TagsRepository` object', () => {
    expect(new TagsRepository(port.mapper)).toBeDefined()
  })

  describe('#withSession', () => {
    it('should create a new repository with the given session', () => {
      port.mapper.transaction((tx) => {
        const newTagsRepository = tagsRepository.withSession(tx)

        expect(newTagsRepository).toBeInstanceOf(TagsRepository)
        expect(newTagsRepository._db).toStrictEqual(tx)
        expect(tagsRepository._db).not.toStrictEqual(tx)
      })
    })
  })

  describe('#findMany', () => {
    it('should find as many tags', async () => {
      const result = await tagsRepository.all()

      expect(result.length).toBe(seedSize)
    })

    it('should omit redacted tags', async () => {
      const redacted = await tagsRepository.redact('676')
      const result = await tagsRepository.all()

      expect(result.find((t) => t.id === redacted!.id)).toBeUndefined()
      expect(result.length).toBe(seedSize - 1)
    })
  })

  describe('#findById', () => {
    it('should find a tag by ID', async () => {
      const result = await tagsRepository.only('676')

      expect(result).toMatchObject({
        id: '676',
        label: 'Tag 676',
      })
    })

    it('should omit redacted tags', async () => {
      const redacted = await tagsRepository.redact('676')
      const resultPromise = tagsRepository.only(redacted!.id)

      await expect(resultPromise).rejects.toThrowError(CollectionError)
    })

    it('should throw an error when no tags is found by the ID', async () => {
      const resultPromise = tagsRepository.only('2000')
      await expect(resultPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#findRedacted', () => {
    it('should find as many redacted tags', async () => {
      const readactedIds = ['512', '256', '128']

      await Promise.all([
        tagsRepository.redact(readactedIds[0]),
        tagsRepository.redact(readactedIds[1]),
        tagsRepository.redact(readactedIds[2]),
      ])

      const result = await tagsRepository.findRedacted()
      const resultSet = new Set(result.map((r) => r.id))

      expect(result.length).toBe(readactedIds.length)
      expect(readactedIds.map((id) => resultSet.has(id)).every((v) => v)).toBe(true)
    })
  })

  describe('#findRedactedById', () => {
    it('should find a redacted tag by ID', async () => {
      const readactedIds = ['512', '256', '128']

      await Promise.all([
        tagsRepository.redact(readactedIds[0]),
        tagsRepository.redact(readactedIds[1]),
        tagsRepository.redact(readactedIds[2]),
      ])

      const result = await tagsRepository.findRedactedById('256')

      expect(result).toMatchObject({
        id: '256',
        label: 'Tag 256',
      })
    })

    it('should omit unredacted tags', async () => {
      const readactedIds = ['512', '256', '128']

      await Promise.all([
        tagsRepository.redact(readactedIds[0]),
        tagsRepository.redact(readactedIds[1]),
        tagsRepository.redact(readactedIds[2]),
      ])

      const result = tagsRepository.findRedactedById('676')

      await expect(result).rejects.toThrowError(CollectionError)
    })

    it('should throw an error when no tag is found by the ID', async () => {
      const resultPromise = tagsRepository.findRedactedById('2000')
      await expect(resultPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#update', () => {
    it('should update a tag by a given ID', async () => {
      const updated = await tagsRepository.update('676', { label: 'Tag six-seven-six' })
      const result = await tagsRepository.only('676')

      expect(updated).toStrictEqual(result)
    })

    it('should throw an error when no tag is found by the ID', async () => {
      const updatedPromise = tagsRepository.update('2000', { label: 'Tag six-seven-oops!' })
      await expect(updatedPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#redact', () => {
    it('should redact a tag by the given ID', async () => {
      const redacted = await tagsRepository.redact('676')
      const resultPromise = tagsRepository.only('676')

      expect(redacted).toBeDefined()
      await expect(resultPromise).rejects.toThrowError(CollectionError)
    })

    it('should throw an error when no tag is found by the ID', async () => {
      const redactedPromise = tagsRepository.redact('2000')
      await expect(redactedPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#restore', () => {
    it('should restore a redacted tag by the given ID', async () => {
      const redacted = await tagsRepository.redact('676')
      const resultPromise = tagsRepository.only('676')

      expect(redacted).toBeDefined()
      expect(redacted!.deletedAt).toBeDefined()
      await expect(resultPromise).rejects.toThrowError(CollectionError)

      const restored = await tagsRepository.restore('676')

      expect(restored).toBeDefined()
      expect(restored).toMatchObject({
        id: redacted!.id,
        label: redacted!.label,
        deletedAt: null,
      })
    })

    it('should throw an error when no tag is found by the ID', async () => {
      const redactedPromise = tagsRepository.redact('2000')
      await expect(redactedPromise).rejects.toThrowError(CollectionError)
    })
  })

  describe('#delete', () => {
    it('should delete a tag by the given ID', async () => {
      const deleted = await tagsRepository.delete('676')
      const resultPromise = tagsRepository.only('676')

      expect(deleted).toBeDefined()
      expect(deleted.deletedAt).toBe(null)
      await expect(resultPromise).rejects.toThrowError(CollectionError)

      expect(deleted).toMatchObject({
        id: deleted.id,
        label: deleted.label,
        deletedAt: null,
      })
    })

    it('should be impossible to resore a deleted tag', async () => {
      const deleted = await tagsRepository.delete('676')
      const restoredPromise = tagsRepository.restore('676')

      expect(deleted).toBeDefined()
      await expect(restoredPromise).rejects.toThrowError(CollectionError)
    })

    it('should return `undefined` when no tag is found by the ID', async () => {
      const deleted = await tagsRepository.delete('2000')
      expect(deleted).toBeUndefined()
    })
  })
})
