import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const syncServiceSource = fs.readFileSync(new URL('./syncService.ts', import.meta.url), 'utf8')

test('fetchFullConversation preserves stored full-history and compaction metadata from the server response', () => {
  assert.match(syncServiceSource, /fullHistoryMessages: fullConv\.rawMessages\?\.map\(fromServerMessage\)/)
  assert.match(syncServiceSource, /compaction: fullConv\.compaction/)
})