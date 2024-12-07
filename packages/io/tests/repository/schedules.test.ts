import { TaskSchedule } from '@stitches/common'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { StitchesIOPort, open } from '../../src/lib'
import { Op, getCriteriaBuilder } from '../../src/repositories'
import { SchedulesRepository, SchedulesRepositoryFacade } from '../../src/repositories/schedules'
import { TaskCreatePayload, TasksRepository } from '../../src/repositories/tasks'

describe('#SchedulesRepository', () => {
  let port: StitchesIOPort
  let tasksRepository: TasksRepository
  let schedulesRepository: SchedulesRepository

  const seedSize = 1000 // 10922: after which `Error: too many SQL variables`
  const database = new Uint8Array()

  type ModelCreate = typeof port.schema.schedules.$inferInsert

  beforeEach(async () => {
    port = await open(database, { wasm: false, log: false }).then((port) => (port.migrate(), port))

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

  afterEach(() => port.close())

  it('should construct a new `SchedulesRepository` object', () => {
    expect(schedulesRepository).toBeDefined()
    expect(schedulesRepository).toBeInstanceOf(SchedulesRepository)
  })

  it('should create schedules and attach them to existing tasks', async () => {
    const schedule1 = await schedulesRepository.only('12')
    const schedule2 = await schedulesRepository.only(`${seedSize / 2 + 1}`)

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
        expect(newSchedulesRepository._db).toStrictEqual(tx)
        expect(schedulesRepository._db).not.toStrictEqual(tx)
      })
    })
  })
})

describe('#SchedulesRepositoryFacade', () => {
  let port: StitchesIOPort
  let tasksRepository: TasksRepository
  let schedulesRepository: SchedulesRepository
  let schedulesRepositoryFacade: SchedulesRepositoryFacade

  const database = new Uint8Array()
  const seedSize = 500

  const date = new Date('2025-11-27T21:19:00.319Z')
  const until = new Date('2025-11-18')

  const taskSchedules: Array<TaskSchedule> = [
    {
      id: '1',
      taskId: '1',
      timing: { anchor: date, upcoming: date, due: null },
      frequency: {
        type: 'custom',
        crons: [{ expression: '*/2 * * * *', frequency: 'hour' }],
        until: until,
      },
    },
    {
      id: '2',
      taskId: '2',
      timing: { anchor: date, upcoming: date, due: null },
      frequency: {
        type: 'year',
        until: until,
        exprs: {
          every: 5,
          subexpr: {
            in: {
              months: [0, 5, 11], // Jan, Jun, Dec
            },
            on: {
              ordinal: 'fourth',
              weekday: 6, // Sat
            },
          },
        },
      },
    },
    {
      id: '3',
      taskId: '3',
      timing: { anchor: date, upcoming: date, due: null },
      frequency: {
        type: 'year',
        until: until,
        exprs: {
          every: 2,
          subexpr: {
            in: {
              months: [2, 5, 8, 11], // Mar, Jun, Sep, Dec
            },
            on: { ordinal: 'last', variable: 'weekend-day' },
          },
        },
      },
    },
    {
      id: '4',
      taskId: '4',
      timing: { anchor: date, upcoming: date, due: null },
      frequency: {
        type: 'month',
        until: undefined,
        exprs: {
          every: 2,
          subexpr: {
            type: 'ondays',
            days: [1, 10, 20, 30],
          },
        },
      },
    },
    {
      id: '5',
      taskId: '5',
      timing: { anchor: date, upcoming: date, due: null },
      frequency: {
        type: 'month',
        until: undefined,
        exprs: {
          every: 1,
          subexpr: {
            type: 'onthe',
            ordinal: 'fifth',
            weekday: 4, // Thu
          },
        },
      },
    },
  ]

  beforeEach(async () => {
    port = await open(database, { wasm: false, log: false }).then((port) => (port.migrate(), port))
    tasksRepository = new TasksRepository(port.mapper)
    schedulesRepository = new SchedulesRepository(port.mapper)
    schedulesRepositoryFacade = new SchedulesRepositoryFacade(port.mapper)

    const payloads: TaskCreatePayload[] = Array.from({ length: seedSize }).map((_, i) => ({
      id: `${i + 1}`,
      title: `Task ${i + 1}`,
      summary: `This makes ${i + 1} task(s)`,
    }))

    await tasksRepository.create(payloads)
  })

  afterEach(() => port.close())

  it('should add scheudles to the repository', async () => {
    const schedules = await Promise.all(taskSchedules.map((s) => schedulesRepositoryFacade.add(s)))
    const criteria = getCriteriaBuilder(port.schema.schedules)
      .or((or) =>
        or
          .on('frequencyType', Op.EQ, 'custom')
          .on('id', Op.IN, ['1', '2', '3'])
          .on('deletedAt', Op.N_NULL, undefined),
      )

      .build()

    // const query = port.mapper
    //   .select({ id: port.schema.schedules.id })
    //   .from(port.schema.schedules)
    //   .where(criteria.unwrap())
    // const sql = query.toSQL()

    const schedulex = await schedulesRepository.all(criteria)

    expect(schedules.at(0)).toMatchObject({
      id: '1',
      taskId: '1',
      anchorTimestamp: date,
      timestamp: date,
      frequencyType: 'custom',
      until: until,
      deletedAt: null,
      frequency: [
        {
          scheduleId: '1',
          type: null,
          expression: '*/2 * * * *',
          deletedAt: null,
        },
      ],
    })

    expect(schedules.at(1)).toMatchObject({
      id: '2',
      taskId: '2',
      anchorTimestamp: date,
      timestamp: date,
      frequencyType: 'year',
      until: until,
      deletedAt: null,
      frequency: {
        scheduleId: '2',
        type: 'year',
        every: 5,
        deletedAt: null,
        exprs: {
          months: 2081,
          deletedAt: null,
          on: {
            ordinal: 'fourth',
            constantWeekday: 6,
            variableWeekday: null,
          },
        },
      },
    })

    expect(schedules.at(2)).toMatchObject({
      id: '3',
      taskId: '3',
      anchorTimestamp: date,
      timestamp: date,
      frequencyType: 'year',
      until: until,
      deletedAt: null,
      frequency: {
        scheduleId: '3',
        type: 'year',
        every: 2,
        deletedAt: null,
        exprs: {
          months: 2340,
          deletedAt: null,
          on: {
            ordinal: 'last',
            constantWeekday: null,
            variableWeekday: 'weekend-day',
          },
        },
      },
    })
    expect(schedules.at(3)).toMatchObject({
      id: '4',
      taskId: '4',
      anchorTimestamp: date,
      timestamp: date,
      frequencyType: 'month',
      until: null,
      deletedAt: null,
      frequency: {
        scheduleId: '4',
        type: 'month',
        every: 2,
        deletedAt: null,
        exprs: {
          type: 'ondays',
          deletedAt: null,
          subexpr: {
            days: 1074791426,
            deletedAt: null,
          },
        },
      },
    })

    expect(schedules.at(4)).toMatchObject({
      id: '5',
      taskId: '5',
      anchorTimestamp: date,
      timestamp: date,
      frequencyType: 'month',
      until: null,
      deletedAt: null,
      frequency: {
        scheduleId: '5',
        type: 'month',
        every: 1,
        deletedAt: null,
        exprs: {
          type: 'onthe',
          deletedAt: null,
          subexpr: {
            ordinal: 'fifth',
            weekday: 4,
            deletedAt: null,
          },
        },
      },
    })

    console.log('%o', schedulex)
  })

  it.todo('should load schedules from the repository with all relevant relations', async () => {})
})
