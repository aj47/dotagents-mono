import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())
const retryPolicyPath = 'apps/desktop/src/main/llm-retry-policy.ts'
const llmFetchPath = 'apps/desktop/src/main/llm-fetch.ts'

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('retry policy recognizes credential cooldown exhaustion as a dedicated fail-fast state', () => {
  const source = read(retryPolicyPath)

  assert.match(source, /export function isCredentialCooldownError\(error: unknown\)/)
  assert.match(source, /message\.includes\("cooling down"\)/)
  assert.match(source, /message\.includes\("all credentials for model"\)/)
  assert.match(source, /if \(isCredentialCooldownError\(error\)\) \{\s*return \{ kind: "credential-cooldown" \}/s)
})

test('llm fetch skips retries and emits cooldown-specific diagnostics after classification', () => {
  const source = read(llmFetchPath)

  assert.match(source, /import \{ classifyRetryDisposition \} from "\.\/llm-retry-policy"/)
  assert.match(source, /const retryDisposition = classifyRetryDisposition\(error\)/)
  assert.match(source, /if \(retryDisposition\.kind === "credential-cooldown"\) \{[\s\S]*?clearRetryStatus\(\)[\s\S]*?throw normalizeError\(/)
  assert.match(source, /Skipping retry because all credentials for the requested model are cooling down/)
  assert.match(source, /Retry skipped because the requested model currently has no warm credentials/)
})