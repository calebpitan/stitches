import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import * as schema from '../../src/schema'
import { StitchesIOPort, open } from '../../src/lib'
import { CriteriaBuilder, Logical, Op, getCriteriaBuilder } from '../../src/repositories'

describe('#CriteriaBuilder', () => {
  let port: StitchesIOPort
  let cb: CriteriaBuilder<schema.Schema, schema.Schema['tasks']>

  const database = new Uint8Array()

  beforeAll(async () => {
    port = await open(database, { wasm: false, log: false }).then((port) => (port.migrate(), port))
  })

  beforeEach(() => {
    cb = getCriteriaBuilder(schema.tasks)
  })

  it('should build a criteria using explicit stack management api', () => {
    // prettier-ignore
    const criteria = cb
      .push(Logical.AND)
        .on('title', Op.EQ, 'Say My Name')
        .on('summary', Op.NE, "I'm game")
        .push(Logical.OR)
          .push(Logical.NOT)
            .on('createdAt', Op.BETWEEN, [new Date('2023-10-25'), new Date('2024-10-25')])
          .pop()
          .on('id', Op.IN, ['1', '2', '3'])
        .pop()
      .pop()
      .build()

    const query = port.mapper
      .select({ id: schema.tasks.id })
      .from(schema.tasks)
      .where(criteria.unwrap())
    const sql = query.toSQL()

    expect(JSON.stringify(sql.params)).toMatchInlineSnapshot(
      `"["Say My Name","I'm game",1698192000000,1729814400000,"1","2","3"]"`,
    )
    expect(sql.sql).toMatchInlineSnapshot(
      `"select "id" from "tasks" where ("tasks"."title" = ? and "tasks"."summary" <> ? and (not "tasks"."created_at" between ? and ? or "tasks"."id" in (?, ?, ?)))"`,
    )
  })

  it('should build a criteria using a more idiomatic api', () => {
    const criteria = cb
      .and((and) => {
        return and
          .on('title', Op.EQ, 'Say My Name')
          .on('summary', Op.NE, "I'm game")
          .or((or) => {
            return or
              .not((not) => {
                return not.on('createdAt', Op.BETWEEN, [
                  new Date('2023-10-25'),
                  new Date('2024-10-25'),
                ])
              })
              .on('id', Op.IN, ['1', '2', '3'])
          })
      })
      .build()

    const query = port.mapper
      .select({ id: schema.tasks.id })
      .from(schema.tasks)
      .where(criteria.unwrap()?.inlineParams())
    const sql = query.toSQL()

    expect(JSON.stringify(sql.params)).toMatchInlineSnapshot(`"[]"`)
    expect(sql.sql).toMatchInlineSnapshot(
      `"select "id" from "tasks" where ("tasks"."title" = 'Say My Name' and "tasks"."summary" <> 'I''m game' and (not "tasks"."created_at" between 1698192000000 and 1729814400000 or "tasks"."id" in ('1', '2', '3')))"`,
    )
  })
})
