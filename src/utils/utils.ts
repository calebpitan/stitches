import { monotonicFactory } from 'ulidx'

interface AsyncSleep extends Promise<number> {
  cancel(msg?: string): void
}

export const ulid = monotonicFactory()

export function evaluate<R>(fn: () => R): R {
  return fn()
}

export function never(_: never): never {
  throw new Error(`Unimplemented for ${_}`)
}

export function plural<S extends string, P extends string>(count: number, s: S, p: P) {
  return count > 1 ? p : s
}

export function range(stop: number): Generator<number>
export function range(start: number, stop: number, step?: number): Generator<number>
export function* range(stopOrStart: number, stop?: number, step?: number) {
  // TODO: make range work with integers only due to issue with float arithmetic
  let start = 0
  ;({ start, stop, step } =
    stop === undefined
      ? { start, stop: stopOrStart, step: 1 }
      : { start: stopOrStart, stop: stop, step: Math.sign(stop - stopOrStart) })

  const order = ((a: number, b: number) => (i: number) => (a < b ? i < b : i > b))(start, stop)
  for (let i = start; order(i); i += step) {
    yield i
  }
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
    }
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
    dataOrThrows: D | null
  ) {
    const { id, schedule, index, throws, discriminator } =
      typeof idOrIdx === 'string' && typeof dataOrThrows === 'object'
        ? ({
            id: idOrIdx,
            schedule: dataOrThrows,
            index: undefined,
            throws: undefined,
            discriminator: 'id'
          } as const)
        : ({
            id: undefined,
            schedule: undefined,
            index: idOrIdx as number,
            throws: dataOrThrows,
            discriminator: 'idx'
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
