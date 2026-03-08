import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const serviceSource = fs.readFileSync(path.join(__dirname, 'conversation-service.ts'), 'utf8')
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
  assert.match(serviceSource, /if \(Array\.isArray\(conversation\.rawMessages\) && conversation\.rawMessages\.length > 0\) \{/)
  assert.match(serviceSource, /conversation\.rawMessages\.push\(message\)/)
  assert.match(serviceSource, /await this\.persistStorageMetadataIfNeeded\(conversationId, conversationPath, normalizedConversation\)/)
})