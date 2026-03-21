import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('checked-in agent guidance points at dotagents-mono and rejects the stale repo path', () => {
  const prompt = read('apps/desktop/src/main/system-prompts-default.ts')

  assert.match(prompt, /Use the active workspace\/repo path provided by the environment/)
  assert.doesNotMatch(prompt, /current main project is aj47\/dotagents\./i)
  assert.doesNotMatch(prompt, /\/Users\/ajjoobandi\/aj47\/dotagents/)
})