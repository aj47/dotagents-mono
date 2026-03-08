import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const chatScreenSource = fs.readFileSync(new URL('./ChatScreen.tsx', import.meta.url), 'utf8')

test('chat screen offers a stored full-history toggle when preserved history exists', () => {
  assert.match(chatScreenSource, /const storedFullHistory = currentSession\.fullHistoryMessages/)
  assert.match(chatScreenSource, /setFullHistoryMessages\(storedFullHistory\)/)
  assert.match(chatScreenSource, /setHistoryCompaction\(currentSession\.compaction \?\? null\)/)
  assert.match(chatScreenSource, /if \(!storedFullHistory && chatMessages\.some\(message => message\.isSummary\) && currentSession\.serverConversationId && hasServerAuth\) \{/)
  assert.match(chatScreenSource, /const visibleMessages = showFullHistory && hasStoredFullHistory && fullHistoryMessages/)
  assert.match(chatScreenSource, /Show Full History/)
  assert.match(chatScreenSource, /Show Active Window/)
})