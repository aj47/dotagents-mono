import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('delegation async results include explicit anti-polling guidance', () => {
  const source = read('apps/desktop/src/main/acp/acp-router-tools.ts')

  assert.match(source, /RECOMMENDED_DELEGATION_STATUS_POLL_INTERVAL_MS = 15000/)
  assert.match(source, /MAX_DELEGATION_STATUS_CHECKS = 8/)
  assert.match(source, /getDelegationStatusPollIntervalMs/)
  assert.match(source, /DotAgents will resume the parent session automatically when this async run finishes/)
  assert.match(source, /recommendedPollIntervalMs/)
  assert.match(source, /shouldContinueOtherWork/)
  assert.match(source, /Polling limit reached for this delegated run/)
  assert.match(source, /Avoid tight polling; wait about/)
})

test('delegation tool definitions steer models away from tight polling loops', () => {
  const source = read('apps/desktop/src/main/acp/acp-router-tool-definitions.ts')

  assert.match(source, /Use waitForResult: true when you need the delegated result before your next step or reply/)
  assert.match(source, /Do not call this repeatedly in a tight loop/)
  assert.match(source, /do not pair it with tight check_agent_status loops/)
})

test('main prompts tell agents to prefer wait\/sync options over repeated status checks', () => {
  const smartRouter = read('apps/desktop/src/main/acp/acp-smart-router.ts')
  const defaultPrompt = read('apps/desktop/src/main/system-prompts-default.ts')
  const bundledPrompt = read('.agents/system-prompt.md')

  assert.match(smartRouter, /Use waitForResult: true when the delegated result is needed before your next step or user reply/)
  assert.match(smartRouter, /never poll in a tight loop/)
  assert.match(defaultPrompt, /Avoid tight polling loops for long-running or background tools/)
  assert.match(bundledPrompt, /Avoid tight polling loops for long-running or background tools/)
})