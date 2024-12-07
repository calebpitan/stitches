import camelCase from 'lodash.camelcase'
import cloneDeep from 'lodash.clonedeep'
import startCase from 'lodash.startcase'

/**
 * Check if a value is a function.
 *
 * NOTE: This will return `true` for constructor functions (and/or classes) too
 * @param v The value to check that is a function
 * @returns a boolean indicating whether the value is a function
 */
export function isFn(v: any): v is (...args: any[]) => any {
  return typeof v === 'function'
}

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
 * Clone any value. Specify intrinsic true to use JSON method
 * otherwise performs a deep clone implemented by lodash.
 * @param value The value to clone
 * @param [intrinsic=false] Whether to use intrinsic JSON method
 * @returns The cloned value
 */
export function clone<T>(value: T, intrinsic = false): T {
  if (intrinsic) return JSON.parse(JSON.stringify(value)) as T
  return cloneDeep(value)
}

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

/**
 * Removes duplicates from a list of items using a function to
 * compute which of the items keys should be used to index the item
 *
 * @param items The items from which to filter out duplicates
 * @param indexer A function used for indexing the items
 * @returns The items with all duplicates removed
 */
export function unique<T extends Record<string, any>, K>(items: T[], indexer: (item: T) => K) {
  const map = new Map<K, T>()

  items.forEach((item) => {
    const key = indexer(item)
    return void (map.has(key) ? void 0 : map.set(key, item))
  })

  return Array.from(map.values())
}

/**
 * Potentially pluralize an item by deciding to go with either the
 * singular or plural value based on a provided count
 * @param count The count of the item to possibly pluralize
 * @param s The singluar value to use
 * @param p The plural value to use
 * @returns A string that is either `s` or `p`
 */
export function plural<S extends string, P extends string>(count: number, s: S, p: P) {
  return count > 1 ? p : s
}

/**
 * Typed {@link Object.entries}:
 *
 * Returns an array of key/values of the enumerable own properties of an object
 *
 * @param o — Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
 * @returns
 */
export function entries<O extends Record<string, any>>(o: O): [keyof O, O[keyof O]][] {
  return Object.entries(o)
}

export class BitMask {
  private constructor(
    private readonly bits: number,
    private readonly len: number,
  ) {}

  static fromBits(bits: number, len: number) {
    return new BitMask(bits, len)
  }

  static fromPositions(positions: Array<number>) {
    const bits = positions.reduce((bits, pos) => turnon(bits, pos), 0)
    return new BitMask(bits, positions.length)
  }

  toPositions(): Array<number> {
    const result = Array.from({ length: this.len })
      .map((_, i) => (this.bits >>> i) & 1)
      .map((on, i) => (on === 1 ? i : -1))
      .filter((n) => n !== -1)
    return result
  }

  toJSON() {
    return this.toPositions()
  }

  valueOf(): number {
    return this.bits
  }
}
