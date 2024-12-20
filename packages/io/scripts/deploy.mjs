#!/usr/bin/env node

/*!
 * A simple migration deployment script that must always be run before
 * build.
 *
 * I know "migration deployment script" is an interesting choice of word,
 * especially since there's no deployment to any conventional database
 * instance like, AWS, etc., happening. But what would I rather call it?
 *
 * Deploys the migration to an intermediate state stored a JSON
 * configurations that can be serialized, loaded, and run in browsers
 * using a migrator.
 *
 * This script was originally adapted from:
 * https://github.com/drizzle-team/drizzle-orm/issues/1009#issuecomment-2193012293
 */
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

console.log()

for (let index = 0; index < journal.entries.length; index++) {
  const { when, idx, tag } = journal.entries[index]

  console.log('(%d) Parsing migration tagged "%s"', index + 1, tag)

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

console.log()
console.log('Migration deployment config file written out to "%s"\n', outfile)
