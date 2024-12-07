import type { UseMutationReturn, UseQueryReturn } from '@pinia/colada'

import type { Ext, NamedMutationReturn, NamedQueryReturn, Var } from './types'

export function queried<N extends string, T extends UseQueryReturn, V>(
  name: N,
  result: T,
  vars: V,
): NamedQueryReturn<N, T, Var<V>> {
  const { state, ...rest } = result

  // @ts-expect-error
  const output: NamedQueryReturn<N, T, Var<V>> = {
    ...rest,
    [name]: state,
    variables: vars,
  }

  return output
}

export function mutated<
  N extends string,
  T extends UseMutationReturn<any, any, any>,
  X extends Record<string, any> | unknown = unknown,
>(name: N, result: T, ext?: X): NamedMutationReturn<N, T, Ext<X>> {
  const { state, ...rest } = result

  // @ts-expect-error
  const output: NamedMutationReturn<N, T, Ext<X>> = {
    [name as N]: state,
    ...rest,
    ...(ext ? { extensions: ext } : null),
  }

  return output
}
