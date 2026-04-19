import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const providerSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/main/chatgpt-web-provider.ts'),
  'utf8',
)

test('ChatGPT Codex provider sends reasoning effort in Responses API payload', () => {
  assert.match(providerSource, /type CodexReasoningEffort = "minimal" \| "low" \| "medium" \| "high"/)
  assert.match(providerSource, /export function getCodexReasoningOptions\(model: string\)/)
  assert.match(providerSource, /if \(override === "none"\) return undefined/)
  assert.match(providerSource, /if \(effort === "xhigh"\) return "high"/)
  assert.match(providerSource, /const reasoning = getCodexReasoningOptions\(model\)/)
  assert.match(providerSource, /payload\.reasoning = reasoning/)
})

test('ChatGPT Codex provider maps response reasoning token usage', () => {
  assert.match(providerSource, /output_tokens_details\?: \{\s*reasoning_tokens\?: number\s*\}/)
  assert.match(providerSource, /outputTokenDetails: \{\s*reasoningTokens: usage\.output_tokens_details\?\.reasoning_tokens,\s*\}/)
})