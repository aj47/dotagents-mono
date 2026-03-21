import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('checked-in agent guidance points at dotagents-mono and rejects the stale repo path', () => {
  const agentsPrompt = read('.agents/agents.md')

  assert.match(agentsPrompt, /aj47\/dotagents-mono/)
  assert.match(agentsPrompt, /Use the active workspace\/repo path provided by the environment/)
  assert.doesNotMatch(agentsPrompt, /current main project is aj47\/dotagents\./i)
  assert.doesNotMatch(agentsPrompt, /\/Users\/ajjoobandi\/aj47\/dotagents/)
})