const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const apiTypesSource = fs.readFileSync(path.join(__dirname, 'api-types.ts'), 'utf8')

test('conversation create and update request types accept preserved raw-history metadata', () => {
  assert.match(
    apiTypesSource,
    /export interface CreateConversationRequest \{[\s\S]*?messages: ServerConversationMessage\[];[\s\S]*?rawMessages\?: ServerConversationMessage\[];[\s\S]*?compaction\?: ConversationCompactionMetadata;[\s\S]*?\}/,
  )

  assert.match(
    apiTypesSource,
    /export interface UpdateConversationRequest \{[\s\S]*?messages\?: ServerConversationMessage\[];[\s\S]*?rawMessages\?: ServerConversationMessage\[];[\s\S]*?compaction\?: ConversationCompactionMetadata;[\s\S]*?\}/,
  )
})

test('conversation list item types expose compaction and active-window counts for stub history previews', () => {
  assert.match(
    apiTypesSource,
    /export interface ServerConversation \{[\s\S]*?messageCount: number;[\s\S]*?activeMessageCount\?: number;[\s\S]*?preview\?: string;[\s\S]*?compaction\?: ConversationCompactionMetadata;[\s\S]*?\}/,
  )
})