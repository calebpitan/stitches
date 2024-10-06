import { monotonicFactory } from 'ulidx'

export const ulid = monotonicFactory()

export function evaluate<R>(fn: () => R): R {
  return fn()
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

// function choice<A, B>(a: A, b: B): B | A {
//   if (!a) return b
//   if (a === b) return b
//   if (typeof a === 'object') {
//     if (Array.isArray(a) && a.length === 0) return b
//     if (Object.keys(a).length === 0) return b
//   }
//   return a
// }
