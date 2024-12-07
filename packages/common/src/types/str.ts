export type AlphaL =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'

export type AlphaU = Uppercase<AlphaL>
export type Alpha = AlphaU | AlphaL

export type Subtract<T extends string, U extends string> = T extends `${infer A}${U}${infer B}`
  ? `${A}${B}`
  : T

export type FirstUpper<K extends string> = K extends `${AlphaL}${infer Rest}`
  ? `${Uppercase<Subtract<K, Rest>>}${Rest}`
  : K

export type AnyString = string & {}
export type StringEnum<T extends string> = T | AnyString
