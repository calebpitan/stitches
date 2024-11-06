import * as schema from './index'

type TSchema = typeof schema

// type StitchesSchema = { [P in keyof Schema]: Schema[P] }

export interface Schema extends TSchema {}
