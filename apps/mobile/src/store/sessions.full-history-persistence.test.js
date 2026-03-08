import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const sessionsSource = fs.readFileSync(new URL('./sessions.ts', import.meta.url), 'utf8')
const sharedSessionSource = fs.readFileSync(new URL('../../../../packages/shared/src/session.ts', import.meta.url), 'utf8')

test('shared session model persists conversation compaction metadata for mobile history viewers', () => {
  assert.match(sharedSessionSource, /fullHistoryMessages\?: SessionChatMessage\[\]/)
  assert.match(sharedSessionSource, /compaction\?: ConversationCompactionMetadata/)
  assert.match(sharedSessionSource, /export interface SessionListItem \{[\s\S]*compaction\?: ConversationCompactionMetadata;/)
  assert.match(sharedSessionSource, /compaction: session\.compaction/)
})

test('mobile session store keeps full-history and compaction metadata when loading server conversations', () => {
  assert.match(sessionsSource, /if \(session\.messages\.length > 0\) \{[\s\S]*fullHistoryMessages: session\.fullHistoryMessages,[\s\S]*compaction: session\.compaction,[\s\S]*freshlyFetched: false,/)
  assert.match(sessionsSource, /if \(latestSession && latestSession\.messages\.length > 0\) \{[\s\S]*fullHistoryMessages: latestSession\.fullHistoryMessages,[\s\S]*compaction: latestSession\.compaction,[\s\S]*freshlyFetched: false,/)
  assert.match(sessionsSource, /messages: result\.messages,[\s\S]*fullHistoryMessages: result\.fullHistoryMessages,[\s\S]*compaction: result\.compaction,[\s\S]*serverMetadata: undefined,/)
})