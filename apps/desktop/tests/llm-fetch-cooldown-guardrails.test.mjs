import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('llm fetch recognizes credential cooldown exhaustion as non-retryable', () => {
  const source = read('apps/desktop/src/main/llm-fetch.ts')

  assert.match(source, /function isCredentialCooldownError\(error: unknown\)/)
  assert.match(source, /message\.includes\("cooling down"\)/)
  assert.match(source, /message\.includes\("all credentials for model"\)/)
  assert.match(source, /if \(isCredentialCooldownError\(error\)\) \{\s*return false/s)
})

test('llm fetch skips retries and emits cooldown-specific diagnostics', () => {
  const source = read('apps/desktop/src/main/llm-fetch.ts')

  assert.match(source, /Skipping retry because all credentials for the requested model are cooling down/)
  assert.match(source, /Retry skipped because the requested model currently has no warm credentials/)
  assert.match(source, /if \(isCredentialCooldownError\(error\)\) \{[\s\S]*?clearRetryStatus\(\)[\s\S]*?throw normalizeError\(/)
})