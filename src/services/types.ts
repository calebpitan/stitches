import type { UseMutationReturn, UseQueryReturn } from '@pinia/colada'

export type Patch<T> = { id: string; data: T }
export type Var<V> = { variables: V }
export type Ext<X> = { extensions: X }

export type NamedQueryReturn<
  N extends string,
  T,
  U extends Record<string, any>,
> = T extends UseQueryReturn
  ? {
      [P in keyof (T & U) as P extends 'state' ? N : P]: P extends keyof U
        ? U[P]
        : P extends keyof T
          ? T[P]
          : never
    }
  : never

export type NamedMutationReturn<N extends string, T, U extends Ext<Record<string, any> | unknown>> =
  T extends UseMutationReturn<infer _R, infer _V, infer _E>
    ? {
        [P in keyof (T & U) as P extends 'state' ? N : P]: P extends keyof U
          ? U[P] extends unknown
            ? never
            : U[P]
          : P extends keyof T
            ? T[P]
            : never
      }
    : never
