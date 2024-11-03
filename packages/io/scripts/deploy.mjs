#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const { default: journal } = await import('../drizzle/meta/_journal.json', {
  with: { type: 'json' }
})

const migrate = []

const root = path.resolve(url.fileURLToPath(path.dirname(import.meta.url)), '..')
const outdir = path.resolve(root, './src/migrations/')
const outfile = path.resolve(outdir, 'deployment.json')

for (let index = 0; index < journal.entries.length; index++) {
  const { when, idx, tag } = journal.entries[index]

  console.log(`parsing ${tag}`)

  const filepath = path.resolve(root, 'drizzle', `${tag}.sql`)
  const migration_file = fs.readFileSync(filepath).toString()

  migrate.push({
    idx,
    when,
    tag,
    hash: crypto.createHash('sha256').update(migration_file).digest('hex'),
    sql: migration_file
      .replace(/\n\t?/g, '')
      .split('--> statement-breakpoint')
      .map((x) => x.trim())
  })
}

if (fs.existsSync(outdir) === false) fs.mkdirSync(outdir)

fs.writeFileSync(outfile, JSON.stringify(migrate, null, 2))
