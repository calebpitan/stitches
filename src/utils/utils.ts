import { getPlatformTimezone } from '@stitches/common'

import { DateTime } from 'luxon'
import { monotonicFactory } from 'ulidx'

interface AsyncSleep extends Promise<number> {
  cancel(msg?: string): void
}

export const ulid = monotonicFactory()

export function withResolvers<T = unknown>() {
  let [resolve, reject] = [] as unknown as Parameters<ConstructorParameters<typeof Promise<T>>[0]>
  const promise = new Promise<T>((rs, rj) => {
    resolve = rs
    reject = rj
  })

  return { promise, resolve, reject }
}

export namespace datetime {
  export type DateTime = import('luxon').DateTime
}

type DateLike = Date | number
export function datetime(date: DateLike): DateTime<true> | DateTime<false>
export function datetime(date: DateLike, tzone: string): DateTime<true> | DateTime<false>
export function datetime(): DateTime<true>
export function datetime(ts?: DateLike, tzone?: string) {
  if (!ts) return DateTime.now()

  if (typeof ts === 'number') {
    return DateTime.fromMillis(ts, { zone: tzone })
  } else {
    return DateTime.fromJSDate(ts, { zone: tzone })
  }
}

export function jsDateToNaiveString(date: Date, tzone: string = getPlatformTimezone()) {
  const dt = datetime(date, tzone)
  return dt.toISO({ includeOffset: false }) || dt.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS")
}

export function sleep(ms: number): AsyncSleep {
  const controller = new AbortController()
  const future = new Promise<number>((resolve, reject) => {
    const id = setTimeout(() => resolve(ms), ms)
    controller.signal.addEventListener('abort', (e) => {
      const target = e.target as AbortSignal
      const reason: Error | string = target.reason
      clearTimeout(id)
      reject(reason instanceof Error ? reason : new Error(reason))
    })
  })

  return {
    [Symbol.toStringTag]: 'AsyncSleep',
    then(onfulfilled, onrejected) {
      return future.then(onfulfilled).catch(onrejected)
    },
    catch(onrejected) {
      return future.catch(onrejected)
    },
    finally(onfinally) {
      return future.finally(onfinally)
    },
    cancel(msg: string = 'Sleep aborted') {
      controller.abort(new Error(msg))
    },
  }
}

export function timeToParts(timestamp: Date) {
  const minute = timestamp.getMinutes()
  const hour = timestamp.getHours()
  const date = timestamp.getDate()
  const month = timestamp.getMonth()
  const weekday = timestamp.getDay()

  return { month, date, weekday, hour, minute }
}

export function createDeserializer<T, R = T>(callback: (data: T) => R) {
  const deserializer = (...args: Parameters<typeof JSON.parse>) => {
    const data = JSON.parse(...args)
    return callback(data)
  }

  return deserializer
}

export function createReadGuard<M extends string>(model: M) {
  // type MaybeDeterministic<T, D extends boolean> = D extends true ? T : T | undefined
  function guard<I extends number, D extends boolean>(index: I, throws: D): number
  function guard<I extends string, D extends Record<string, any>>(id: I, data: D | null): D | never
  function guard<I extends string | number, D extends Record<string, any> | boolean>(
    idOrIdx: I,
    dataOrThrows: D | null,
  ) {
    const { id, schedule, index, throws, discriminator } =
      typeof idOrIdx === 'string' && typeof dataOrThrows === 'object'
        ? ({
            id: idOrIdx,
            schedule: dataOrThrows,
            index: undefined,
            throws: undefined,
            discriminator: 'id',
          } as const)
        : ({
            id: undefined,
            schedule: undefined,
            index: idOrIdx as number,
            throws: dataOrThrows,
            discriminator: 'idx',
          } as const)

    switch (discriminator) {
      case 'id': {
        if (!schedule) {
          throw new Error(`${model} with ID "${id}" does not exist`)
        }
        return schedule
      }

      case 'idx': {
        if (index === -1 && throws === true) {
          throw new Error(`Index out of bounds`)
        } else if (index === -1 && throws === false) {
          return Number.NEGATIVE_INFINITY
        }
        return index
      }
      // no default
    }
  }
  return guard
}
