import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const llmSource = fs.readFileSync(new URL('./llm.ts', import.meta.url), 'utf8')
const tipcSource = fs.readFileSync(new URL('./tipc.ts', import.meta.url), 'utf8')
const remoteServerSource = fs.readFileSync(new URL('./remote-server.ts', import.meta.url), 'utf8')
const acpSource = fs.readFileSync(new URL('./acp-main-agent.ts', import.meta.url), 'utf8')

test('non-ACP agent resumes preserve compacted summary metadata for progress history', () => {
  assert.match(tipcSource, /id: msg\.id/)
  assert.match(tipcSource, /isSummary: msg\.isSummary/)
  assert.match(tipcSource, /summarizedMessageCount: msg\.summarizedMessageCount/)
  assert.match(remoteServerSource, /id: msg\.id/)
  assert.match(remoteServerSource, /isSummary: msg\.isSummary/)
  assert.match(remoteServerSource, /summarizedMessageCount: msg\.summarizedMessageCount/)
})

test('agent progress and remote API formatting keep summary metadata once loaded', () => {
  assert.match(llmSource, /id: entry\.id/)
  assert.match(llmSource, /isSummary: entry\.isSummary/)
  assert.match(llmSource, /summarizedMessageCount: entry\.summarizedMessageCount/)
  assert.match(remoteServerSource, /id: entry\.id/)
  assert.match(remoteServerSource, /isSummary: entry\.isSummary/)
  assert.match(remoteServerSource, /summarizedMessageCount: entry\.summarizedMessageCount/)
})

test('resumed progress producers forward preserved full history and compaction metadata', () => {
  assert.match(tipcSource, /fullConversationHistory = conversation\.rawMessages\?\.map\(mapStoredConversationMessageForProgress\)/)
  assert.match(tipcSource, /conversationCompaction: conversation\.compaction/)
  assert.match(remoteServerSource, /fullConversationHistory = compactedConversation\.rawMessages\?\.map/)
  assert.match(remoteServerSource, /conversationCompaction: compactedConversation\.compaction/)
  assert.match(llmSource, /preservedProgressHistory\?: Pick<AgentProgressUpdate, "fullConversationHistory" \| "conversationCompaction">/)
  assert.match(llmSource, /conversationHistory\.slice\(currentPromptIndex \+ 1\)/)
  assert.match(llmSource, /\.\.\.buildPreservedHistoryProgressFields\(\),/)
  assert.match(acpSource, /preservedConversationCompaction = loadedConversation\?\.compaction/)
  assert.match(acpSource, /\.slice\(initialConversationHistoryLength\)/)
  assert.match(acpSource, /\.\.\.buildPreservedHistoryProgressFields\(\),/)
})