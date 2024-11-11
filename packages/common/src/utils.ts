import camelCase from 'lodash.camelcase'
import startCase from 'lodash.startcase'

/**
 * A function that never returns and terminates execution by
 * throwing an error when something unexpected, especially
 * an unexpected value is received
 *
 * @param _ The unexpected value
 */
export function never(_: never): never {
  never.never = null as never
  throw new Error(`Unimplemented for ${_}`)
}

export namespace never {
  export declare let never: never
}

/**
 * Turn on a specific bit at `index` amongst other bits.
 *
 * @param bits The bits to perform bit masking operations on
 * @param index The zero-based index of the bit to turn on
 * @returns The masked bits as an integer
 */
export const turnon = (bits: number, index: number) => {
  if (index < 0) return bits
  return bits | (1 << index)
}

/**
 * Turn off a specific bit at `index` amongst other bits.
 *
 * @param bits The bits to perform bit masking operations on
 * @param index The zero-based index of the bit to turn off
 * @returns The masked bits as an integer
 */
export const turnoff = (bits: number, index: number) => {
  if (index < 0) return bits
  return bits & ~(1 << index)
}

/**
 * Transforms a string to PascalCase
 *
 * @param s The string to convert to PascalCase
 * @returns The converted string
 */
export const pascalCase = (s: string) => startCase(camelCase(s)).replace(/ /g, '')

/**
 * Generate a range of integers from `0` to `stop`
 * @param stop The number, exclusive, at which the range generator stops
 */
export function range(stop: number): Generator<number>
/**
 * Generate a range of integers from `start` to `stop` taking `step`
 * progressively
 *
 * @param start The number from which the range generator begins
 * @param stop The number, exclusive, at which the range generator stops
 * @param step The arithmetic progression for the range generator
 */
export function range(start: number, stop: number, step?: number): Generator<number>
export function* range(stopOrStart: number, stop?: number, step?: number) {
  // TODO: make range work with integers only due to inconsistencies with float arithmetic
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
