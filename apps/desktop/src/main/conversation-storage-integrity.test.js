import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const serviceSource = fs.readFileSync(path.join(__dirname, 'conversation-service.ts'), 'utf8')
const typesSource = fs.readFileSync(path.join(__dirname, '..', 'shared', 'types.ts'), 'utf8')
const sharedConversationDomainSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', '..', 'packages', 'shared', 'src', 'conversation-domain.ts'),
  'utf8',
)
const sharedConversationSyncSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', '..', 'packages', 'shared', 'src', 'conversation-sync.ts'),
  'utf8',
)

test('conversation types expose preserved raw-history and partial-compaction metadata', () => {
  assert.match(typesSource, /from ['"]@dotagents\/shared\/conversation-domain['"]/)
  assert.match(sharedConversationDomainSource, /export interface ConversationCompactionMetadata/)
  assert.match(sharedConversationDomainSource, /rawMessages\?: ConversationMessage\[]/)
  assert.match(sharedConversationDomainSource, /compaction\?: ConversationCompactionMetadata/)
  assert.match(sharedConversationDomainSource, /partialReason\?: 'legacy_summary_without_raw_messages'/)
})

test('conversation service preserves raw messages during compaction and marks legacy lossy sessions', () => {
  assert.match(serviceSource, /private syncConversationStorageMetadata\(conversation: Conversation\): boolean/)
  assert.match(serviceSource, /syncServerConversationStorageMetadata\(conversation\)/)
  assert.match(sharedConversationSyncSource, /partialReason: isLegacyPartial \? 'legacy_summary_without_raw_messages' : undefined/)
  assert.match(serviceSource, /buildServerConversationCompactedRecord\(conversation/)
  assert.match(serviceSource, /buildServerConversationCompactionCheckpointBackfill\(conversation/)
  assert.match(sharedConversationSyncSource, /rawMessages: \[\.\.\.fullMessageHistory\]/)
  assert.match(sharedConversationSyncSource, /storedRawMessageCount: fullMessageHistory\.length/)
  assert.match(sharedConversationSyncSource, /representedMessageCount: fullMessageHistory\.length/)
  assert.match(sharedConversationSyncSource, /export function buildServerConversationCompactedRecord/)
  assert.match(sharedConversationSyncSource, /export function buildServerConversationCompactionCheckpointBackfill/)
  assert.match(sharedConversationSyncSource, /export function buildServerConversationCompactionCheckpointMetadata/)
})

test('conversation indexing and append flow follow represented full-history counts', () => {
  assert.match(sharedConversationSyncSource, /export function getStoredServerConversationMessages/)
  assert.match(serviceSource, /buildServerConversationHistoryItem\(conversation/)
  assert.match(sharedConversationSyncSource, /messageCount: getRepresentedServerConversationMessageCount\(conversation\)/)
  assert.match(sharedConversationSyncSource, /const storedMessages = getStoredServerConversationMessages\(conversation\)/)
  assert.match(sharedConversationSyncSource, /if \(Array\.isArray\(conversation\.rawMessages\) && conversation\.rawMessages\.length > 0\) \{/)
  assert.match(sharedConversationSyncSource, /conversation\.rawMessages\.push\(message\)/)
  assert.match(serviceSource, /await this\.persistStorageMetadataIfNeeded\(conversationId, conversationPath, normalizedConversation\)/)
})

test('conversation service rebuilds the history index when conversation files outnumber indexed entries', () => {
  assert.match(serviceSource, /if \(conversationFileCount > loadedIndex\.length\) \{/)
  assert.match(serviceSource, /return this\.rebuildConversationIndexFromDisk\("conversation files outnumber indexed entries"\)/)
  assert.match(serviceSource, /private async rebuildConversationIndexFromDisk\(reason: string\): Promise<ConversationHistoryItem\[]>/)
  assert.match(serviceSource, /rebuiltIndex\.push\(this\.buildConversationHistoryItem\(conversation\)\)/)
})
