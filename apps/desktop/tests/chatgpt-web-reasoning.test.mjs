import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const providerSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/main/chatgpt-web-provider.ts'),
  'utf8',
)

test('ChatGPT Codex provider sends low reasoning effort without automatic summaries', () => {
  assert.match(providerSource, /type CodexReasoningEffort = "minimal" \| "low" \| "medium" \| "high"/)
  assert.match(providerSource, /export function getCodexReasoningOptions\(model: string\)/)
  assert.match(providerSource, /if \(override === "none"\) return undefined/)
  assert.match(providerSource, /if \(effort === "xhigh"\) return "high"/)
  assert.match(providerSource, /const effort = normalizeCodexReasoningEffort\(override\) \|\| "low"/)
  assert.match(providerSource, /return \{ effort \}/)
  assert.match(providerSource, /const reasoning = getCodexReasoningOptions\(model\)/)
  assert.match(providerSource, /payload\.reasoning = reasoning/)
  assert.doesNotMatch(providerSource, /summary: "auto"/)
  assert.doesNotMatch(providerSource, /effort,\s*summary/)
})

test('ChatGPT Codex provider handles reasoning summary streaming events', () => {
  assert.match(providerSource, /response\.reasoning_summary_text\.delta/)
  assert.match(providerSource, /accumulatedReasoningSummary/)
  assert.match(providerSource, /reasoningSummary\?: string/)
  assert.match(providerSource, /extractCompletedReasoningSummary/)
  assert.match(providerSource, /item\.type === "reasoning"/)
  assert.match(providerSource, /item\.summary/)
})

test('ChatGPT Codex provider maps response reasoning token usage', () => {
  assert.match(providerSource, /output_tokens_details\?: \{\s*reasoning_tokens\?: number\s*\}/)
  assert.match(providerSource, /outputTokenDetails = usage\.output_tokens_details\?\.reasoning_tokens !== undefined/)
  assert.match(providerSource, /\{ reasoningTokens: usage\.output_tokens_details\.reasoning_tokens \}/)
  assert.match(providerSource, /: undefined/)
})