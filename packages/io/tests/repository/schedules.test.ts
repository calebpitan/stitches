import { sql } from 'drizzle-orm'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { StitchesIOPort, open } from '../../src/lib'
import { SchedulesRepository } from '../../src/repositories/schedules'
import { TaskCreatePayload, TasksRepository } from '../../src/repositories/tasks'

describe('#SchedulesRepository', () => {
  let port: StitchesIOPort
  let schedulesRepository: SchedulesRepository
  let tasksRepository: TasksRepository

  const seedSize = 1000 // 10922: after which `Error: too many SQL variables`
  const database = new Uint8Array()

  type ModelCreate = typeof port.schema.schedules.$inferInsert

  beforeAll(async () => {
    port = await open(database, { wasm: false, log: false }).then((port) => (port.migrate(), port))
  })

  afterAll(() => port.close())

  beforeEach(async () => {
    schedulesRepository = new SchedulesRepository(port.mapper)
    tasksRepository = new TasksRepository(port.mapper)

    const date = new Date('2024-11-17T10:45:00.000Z')
    const until = new Date('2025-11-17T10:45:00.000Z')
    const halfSeedSize = seedSize / 2
    const arrayLike = { length: halfSeedSize }

    const tasksPayload: TaskCreatePayload[] = Array.from({ length: seedSize }).map((_, i) => ({
      id: `${i + 1}`,
      title: `Task ${i + 1}`,
      summary: `This makes ${i + 1} task(s)`,
    }))

    const regularsPayload: ModelCreate[] = Array.from(arrayLike).map((_, i) => ({
      id: `${i + 1}`,
      taskId: `${i + 1}`,
      anchorTimestamp: date,
      timestamp: date,
      frequencyType: 'regular' as const,
    }))

    const customsPayload: ModelCreate[] = Array.from(arrayLike).map((_, i) => ({
      id: `${i + halfSeedSize + 1}`,
      taskId: `${i + halfSeedSize + 1}`,
      anchorTimestamp: date,
      timestamp: date,
      frequencyType: 'custom' as const,
      until: until,
    }))

    await tasksRepository.create(tasksPayload)
    await schedulesRepository.create([...regularsPayload, ...customsPayload])
  })

  afterEach(() => {
    port.mapper.run(sql`
      DELETE FROM ${port.schema.tasks}; -- THIS SHOULD CASCADE
      DELETE FROM ${port.schema.schedules}; -- BUT LET'S GO AHEAD AND STILL DELETE
    `)
  })

  it('should construct a new `SchedulesRepository` object', () => {
    expect(schedulesRepository).toBeDefined()
    expect(schedulesRepository).toBeInstanceOf(SchedulesRepository)
  })

  it('should create schedules and attach them to existing tasks', async () => {
    const schedule1 = await schedulesRepository.findById('12')
    const schedule2 = await schedulesRepository.findById(`${seedSize / 2 + 1}`)

    // console.log('%o\n%o\n%o\n%o', schedule1, task1, schedule2, task2)
    const date = new Date('2024-11-17T10:45:00.000Z')
    const until = new Date('2025-11-17T10:45:00.000Z')

    expect(schedule1).toMatchObject({
      id: '12',
      taskId: '12',
      anchorTimestamp: date,
      timestamp: date,
      frequencyType: 'regular',
      until: null,
      deletedAt: null,
    })

    expect(schedule2).toMatchObject({
      id: '501',
      taskId: '501',
      anchorTimestamp: date,
      timestamp: date,
      frequencyType: 'custom',
      until: until,
      deletedAt: null,
    })
  })

  describe('#withSession', () => {
    it('should create a new repository with the given session', () => {
      port.mapper.transaction((tx) => {
        const newSchedulesRepository = schedulesRepository.withSession(tx)

        expect(newSchedulesRepository).toBeInstanceOf(SchedulesRepository)
        expect(newSchedulesRepository.db).toStrictEqual(tx)
        expect(schedulesRepository.db).not.toStrictEqual(tx)
      })
    })
  })
})
