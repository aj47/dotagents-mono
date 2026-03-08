import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const serviceSource = fs.readFileSync(path.join(__dirname, 'conversation-service.ts'), 'utf8')
const tipcSource = fs.readFileSync(path.join(__dirname, 'tipc.ts'), 'utf8')
const remoteServerSource = fs.readFileSync(path.join(__dirname, 'remote-server.ts'), 'utf8')
const acpMainAgentSource = fs.readFileSync(path.join(__dirname, 'acp-main-agent.ts'), 'utf8')
const typesSource = fs.readFileSync(path.join(__dirname, '..', 'shared', 'types.ts'), 'utf8')

test('conversation types expose preserved raw-history and partial-compaction metadata', () => {
  assert.match(typesSource, /export interface ConversationCompactionMetadata/)
  assert.match(typesSource, /rawMessages\?: ConversationMessage\[]/)
  assert.match(typesSource, /compaction\?: ConversationCompactionMetadata/)
  assert.match(typesSource, /partialReason\?: "legacy_summary_without_raw_messages"/)
})

test('conversation service preserves raw messages during compaction and marks legacy lossy sessions', () => {
  assert.match(serviceSource, /private syncConversationStorageMetadata\(conversation: Conversation\): boolean/)
  assert.match(serviceSource, /partialReason: isLegacyPartial \? "legacy_summary_without_raw_messages" : undefined/)
  assert.match(serviceSource, /rawMessages: \[\.\.\.fullMessageHistory\]/)
  assert.match(serviceSource, /storedRawMessageCount: fullMessageHistory\.length/)
  assert.match(serviceSource, /representedMessageCount: fullMessageHistory\.length/)
})

test('conversation indexing and append flow follow represented full-history counts', () => {
  assert.match(serviceSource, /const storedMessages = this\.getStoredRawMessages\(conversation\)/)
  assert.match(serviceSource, /messageCount: this\.getRepresentedMessageCount\(conversation\)/)
  assert.match(serviceSource, /compaction: conversation\.compaction/)
  assert.match(serviceSource, /if \(Array\.isArray\(conversation\.rawMessages\) && conversation\.rawMessages\.length > 0\) \{/)
  assert.match(serviceSource, /conversation\.rawMessages\.push\(message\)/)
  assert.match(serviceSource, /await this\.persistStorageMetadataIfNeeded\(conversationId, conversationPath, normalizedConversation\)/)
})

test('conversation history index can backfill compaction metadata for past-session provenance', () => {
  assert.match(typesSource, /export interface ConversationHistoryItem \{[\s\S]*compaction\?: ConversationCompactionMetadata/)
  assert.match(serviceSource, /private async backfillHistoryIndexCompactionMetadata\(/)
  assert.match(serviceSource, /item\.compaction === undefined && item\.messageCount > COMPACTION_MESSAGE_THRESHOLD/)
  assert.match(serviceSource, /const hydratedIndex = await this\.backfillHistoryIndexCompactionMetadata\(index\)/)
})

test('agent resume path loads the compacted context window instead of raw full history', () => {
  assert.match(tipcSource, /loadConversationWithCompaction\(conversationId, sessionId\)/)
  assert.match(tipcSource, /representedMessageCount = conversation\.compaction\?\.representedMessageCount \?\? conversation\.messages\.length/)
  assert.match(tipcSource, /Loaded agent context window with \$\{conversation\.messages\.length\} active messages representing \$\{representedMessageCount\} stored messages/)
})

test('remote server resumes agent runs with the compacted context window instead of the raw transcript', () => {
  assert.match(remoteServerSource, /let shouldLoadCompactedConversationContext = false/)
  assert.match(remoteServerSource, /shouldLoadCompactedConversationContext = true/)
  assert.match(remoteServerSource, /loadConversationWithCompaction\(conversationId, sessionId\)/)
  assert.match(remoteServerSource, /representedMessageCount = compactedConversation\.compaction\?\.representedMessageCount \?\? compactedConversation\.messages\.length/)
  assert.match(remoteServerSource, /Continuing conversation \$\{conversationId\} with \$\{messagesToConvert\.length\} previous active messages representing \$\{representedMessageCount\} stored messages/)
})

test('ACP recreated sessions bootstrap only the compacted active conversation window', () => {
  assert.match(acpMainAgentSource, /loadConversationWithCompaction\(conversationId, sessionId\)/)
  assert.match(acpMainAgentSource, /buildAcpBootstrapConversationContext\(loadedConversation, transcript\)/)
  assert.match(acpMainAgentSource, /active window only, not the full raw transcript/)
  assert.match(acpMainAgentSource, /conversation\.messages\.slice\(0, -1\)/)
  assert.match(acpMainAgentSource, /isSummary: m\.isSummary/)
  assert.match(acpMainAgentSource, /summarizedMessageCount: m\.summarizedMessageCount/)
})
