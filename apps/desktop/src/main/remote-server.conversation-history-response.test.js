import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const remoteServerSource = fs.readFileSync(new URL('./remote-server.ts', import.meta.url), 'utf8')

function getSection(startMarker, endMarker) {
  const startIndex = remoteServerSource.indexOf(startMarker)
  const endIndex = remoteServerSource.indexOf(endMarker)

  assert.notEqual(startIndex, -1, `Missing start marker: ${startMarker}`)
  assert.notEqual(endIndex, -1, `Missing end marker: ${endMarker}`)
  assert.ok(endIndex > startIndex, `Expected ${endMarker} after ${startMarker}`)

  return remoteServerSource.slice(startIndex, endIndex)
}

test('conversation recovery route preserves summary metadata and stored raw history fields', () => {
  assert.match(remoteServerSource, /isSummary: msg\.isSummary/)
  assert.match(remoteServerSource, /summarizedMessageCount: msg\.summarizedMessageCount/)
  assert.match(remoteServerSource, /rawMessages: conversation\.rawMessages\?\.map/)
  assert.match(remoteServerSource, /compaction: conversation\.compaction/)
})

test('conversation create and update routes preserve raw history and compaction metadata on write and response payloads', () => {
  const createSection = getSection('fastify.post("/v1/conversations"', '// PUT /v1/conversations/:id - Update an existing conversation')
  const updateSection = getSection('// PUT /v1/conversations/:id - Update an existing conversation', '// Kill switch endpoint - emergency stop all agent sessions')

  assert.match(
    createSection,
    /const messages = body\.messages\.map\([\s\S]*?toolResults: msg\.toolResults,[\s\S]*?isSummary: msg\.isSummary,[\s\S]*?summarizedMessageCount: msg\.summarizedMessageCount,[\s\S]*?\}\)\)/,
  )
  assert.match(createSection, /rawMessages\?: Array<\{/)
  assert.match(createSection, /compaction\?: ConversationCompactionMetadata/)
  assert.match(
    createSection,
    /const rawMessages = body\.rawMessages\?\.map\([\s\S]*?toolResults: msg\.toolResults,[\s\S]*?isSummary: msg\.isSummary,[\s\S]*?summarizedMessageCount: msg\.summarizedMessageCount,[\s\S]*?\}\)\)/,
  )
  assert.match(createSection, /compaction: body\.compaction/)
  assert.match(
    createSection,
    /messages: conversation\.messages\.map\(msg => \([\s\S]*?toolResults: msg\.toolResults,[\s\S]*?isSummary: msg\.isSummary,[\s\S]*?summarizedMessageCount: msg\.summarizedMessageCount,[\s\S]*?\}\)\)[\s\S]*?rawMessages: conversation\.rawMessages\?\.map\([\s\S]*?compaction: conversation\.compaction/,
  )

  assert.match(
    updateSection,
    /const messages = body\.messages\.map\([\s\S]*?toolResults: msg\.toolResults,[\s\S]*?isSummary: msg\.isSummary,[\s\S]*?summarizedMessageCount: msg\.summarizedMessageCount,[\s\S]*?\}\)\)/,
  )
  assert.match(updateSection, /rawMessages\?: Array<\{/)
  assert.match(updateSection, /compaction\?: ConversationCompactionMetadata/)
  assert.match(
    updateSection,
    /const rawMessages = body\.rawMessages\?\.map\([\s\S]*?toolResults: msg\.toolResults,[\s\S]*?isSummary: msg\.isSummary,[\s\S]*?summarizedMessageCount: msg\.summarizedMessageCount,[\s\S]*?\}\)\)/,
  )
  assert.match(updateSection, /conversation\.rawMessages = body\.rawMessages\.map\(/)
  assert.match(updateSection, /conversation\.compaction = body\.compaction/)
  assert.match(
    updateSection,
    /conversation\.messages = body\.messages\.map\([\s\S]*?toolResults: msg\.toolResults,[\s\S]*?isSummary: msg\.isSummary,[\s\S]*?summarizedMessageCount: msg\.summarizedMessageCount,[\s\S]*?\}\)\)/,
  )
  assert.match(
    updateSection,
    /messages: conversation\.messages\.map\(msg => \([\s\S]*?toolResults: msg\.toolResults,[\s\S]*?isSummary: msg\.isSummary,[\s\S]*?summarizedMessageCount: msg\.summarizedMessageCount,[\s\S]*?\}\)\)[\s\S]*?rawMessages: conversation\.rawMessages\?\.map\([\s\S]*?compaction: conversation\.compaction/,
  )
})