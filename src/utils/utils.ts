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

// function choice<A, B>(a: A, b: B): B | A {
//   if (!a) return b
//   if (a === b) return b
//   if (typeof a === 'object') {
//     if (Array.isArray(a) && a.length === 0) return b
//     if (Object.keys(a).length === 0) return b
//   }
//   return a
// }
