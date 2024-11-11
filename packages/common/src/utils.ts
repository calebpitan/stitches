import camelCase from 'lodash.camelcase'
import startCase from 'lodash.startcase'

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
