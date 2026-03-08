import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const remoteServerSource = fs.readFileSync(new URL('./remote-server.ts', import.meta.url), 'utf8')

test('conversation recovery route preserves summary metadata and stored raw history fields', () => {
  assert.match(remoteServerSource, /isSummary: msg\.isSummary/)
  assert.match(remoteServerSource, /summarizedMessageCount: msg\.summarizedMessageCount/)
  assert.match(remoteServerSource, /rawMessages: conversation\.rawMessages\?\.map/)
  assert.match(remoteServerSource, /compaction: conversation\.compaction/)
})