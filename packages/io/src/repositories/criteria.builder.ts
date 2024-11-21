import { never, plural } from '@stitches/common'

import {
  ExtractTablesWithRelations,
  InferColumnsDataTypes,
  SQL,
  SQLWrapper,
  and,
  between,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  notBetween,
  notInArray,
  notLike,
  or,
} from 'drizzle-orm'

import * as schema from '../schema'
import { TCols, TKeys } from './factory'
import { Table } from './utils'

export enum Logical {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

export enum Op {
  EQ = 'EQ',
  NE = 'NE',
  GT = 'GT',
  LT = 'LT',
  IN = 'IN',
  NIN = 'NIN',
  GTE = 'GTE',
  LTE = 'LTE',
  NULL = 'NULL',
  N_NULL = 'N_NULL',
  LIKE = 'LIKE',
  N_LIKE = 'N_LIKE',
  BETWEEN = 'BETWEEN',
  N_BETWEEN = 'N_BETWEEN',
}

type Fields<
  S extends schema.Schema,
  K extends TKeys<S>,
> = keyof ExtractTablesWithRelations<S>[K]['columns']

type KeyForT<T extends Table<TCols<S, TKeys<S>>>, S extends schema.Schema> = {
  [P in TKeys<S>]: S[P] extends T ? P : never
}[TKeys<S>]

type FieldType<
  F extends Fields<S, KeyForT<T, S>>,
  T extends Table<TCols<S, TKeys<S>>>,
  S extends schema.Schema,
> = InferColumnsDataTypes<ExtractTablesWithRelations<S>[KeyForT<T, S>]['columns']>[F]

type UnaryOp = Op.NULL | Op.N_NULL
type BinaryOp = Op.EQ | Op.GT | Op.GTE | Op.LIKE | Op.N_LIKE | Op.LT | Op.LTE | Op.NE
type TernaryOp = Op.BETWEEN | Op.N_BETWEEN
type N_AryOp = Op.IN | Op.NIN

type RHS<T, O extends Op> = ({ [P in UnaryOp]: undefined } & { [P in BinaryOp]: T } & {
  [P in TernaryOp]: [T, T]
} & { [P in N_AryOp]: T[] })[O]

export interface Criteria {
  unwrap(): SQL | undefined
}

export interface CriteriaBuilder<S extends schema.Schema, T extends Table<TCols<S, TKeys<S>>>>
  extends _CriteriaBuilder<S, T> {}

export function getCriteriaBuilder<S extends schema.Schema, T extends Table<TCols<S, TKeys<S>>>>(
  table: T,
): CriteriaBuilder<S, T> {
  return new _CriteriaBuilder<S, T>(table)
}

class _Criteria implements Criteria {
  constructor(private readonly criteria: SQL | undefined) {}
  unwrap(): SQL | undefined {
    return this.criteria
  }
}

class _CriteriaBuilder<S extends schema.Schema, T extends Table<TCols<S, TKeys<S>>>> {
  private readonly criteria: SQL[]
  private readonly AND: SQLWrapper[]
  private readonly OR: SQLWrapper[]
  private readonly NOT: SQLWrapper[]

  private readonly logicals: Logical[]
  /** Stack pointer for both `AND`, `OR`, and `NOT` logicals */
  private readonly sp: { [K in keyof typeof Logical]: number[] }

  constructor(private readonly table: T) {
    this.criteria = []

    this.AND = []
    this.OR = []
    this.NOT = []

    this.logicals = []

    this.sp = { AND: [], OR: [], NOT: [] }
  }

  private cleanup() {
    this.criteria.length = this.logicals.length = 0
    this.AND.length = this.OR.length = this.NOT.length = 0
    this.sp.AND.length = this.sp.OR.length = this.sp.NOT.length = 0
  }

  private evaluate<
    F extends Fields<S, KeyForT<T, S>>,
    O extends Op,
    V extends RHS<FieldType<F, T, S>, O>,
  >(lhs: F, op: O, rhs: V) {
    const t = <O extends Op>(_: O, v: typeof rhs): RHS<FieldType<F, T, S>, O> => v as any
    const _op = op as Op

    switch (_op) {
      case Op.BETWEEN:
        return between(this.table[lhs], ...t(_op, rhs))
      case Op.IN:
        return inArray(this.table[lhs], t(_op, rhs))
      case Op.EQ:
        return eq(this.table[lhs], t(_op, rhs))
      case Op.GT:
        return gt(this.table[lhs], t(_op, rhs))
      case Op.GTE:
        return gte(this.table[lhs], t(_op, rhs))
      case Op.LIKE:
        return like(this.table[lhs], t(_op, rhs)!)
      case Op.LT:
        return lt(this.table[lhs], t(_op, rhs))
      case Op.LTE:
        return lte(this.table[lhs], t(_op, rhs))
      case Op.NE:
        return ne(this.table[lhs], t(_op, rhs))
      case Op.NULL:
        return isNull(this.table[lhs])
      case Op.NIN:
        return notInArray(this.table[lhs], t(_op, rhs))
      case Op.N_BETWEEN:
        return notBetween(this.table[lhs], ...t(_op, rhs))
      case Op.N_LIKE:
        return notLike(this.table[lhs], t(_op, rhs)!)
      case Op.N_NULL:
        return isNotNull(this.table[lhs])
      default:
        never(_op)
    }
  }

  private peek<T>(stack: Array<T>) {
    return stack.at(-1)
  }

  push(l: Logical) {
    this.logicals.push(l)
    this.sp[l].push(this[l].length)
    return this
  }

  pop() {
    const logical = this.logicals.pop()

    if (logical === undefined) return this

    const handler = (cond: SQL) => {
      const parent = this.peek(this.logicals)
      if (parent) {
        this[parent].push(cond)
      } else {
        this.criteria.push(cond)
      }
    }

    switch (logical) {
      case Logical.AND:
        handler(and(...this.AND.splice(this.sp.AND.pop()!, this.AND.length))!)
        break
      case Logical.OR:
        handler(or(...this.OR.splice(this.sp.OR.pop()!, this.OR.length))!)
        break
      case Logical.NOT:
        handler(not(this.NOT.splice(this.sp.NOT.pop()!, this.NOT.length).at(0)!))
        break
      default:
        never(logical)
    }

    return this
  }

  and(pipe: (cb: CriteriaBuilder<S, T>) => CriteriaBuilder<S, T>) {
    return pipe(this.push(Logical.AND)).pop()
  }

  or(pipe: (cb: CriteriaBuilder<S, T>) => CriteriaBuilder<S, T>) {
    return pipe(this.push(Logical.OR)).pop()
  }

  not(pipe: (cb: CriteriaBuilder<S, T>) => CriteriaBuilder<S, T>) {
    return pipe(this.push(Logical.NOT)).pop()
  }

  on<F extends Fields<S, KeyForT<T, S>>, O extends Op>(f: F, op: O, v: RHS<FieldType<F, T, S>, O>) {
    const logical = this.peek(this.logicals)

    if (logical === undefined) {
      this.criteria.push(this.evaluate(f, op, v))
      return this
    }

    this[logical].push(this.evaluate(f, op, v))
    return this
  }

  build(): Criteria {
    const logicCount = this.logicals.length
    if (logicCount > 0) {
      throw new Error(
        `Cannot build with ${logicCount} active ${plural(logicCount, 'logical', 'logicals')} on the stack`,
      )
    }

    if (this.criteria.length > 1) {
      const criteria = new _Criteria(and(...this.criteria))
      this.cleanup()
      return criteria
    }

    const criteria = new _Criteria(this.criteria.at(0))
    this.cleanup()
    return criteria
  }
}
