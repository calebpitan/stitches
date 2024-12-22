import * as schema from '../schema'
import { RepositoryAbstractFactory } from './factory'

export class CompletionsRepository extends RepositoryAbstractFactory('completions', {
  table: schema.completions,
}) {}
