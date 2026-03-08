import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('./agent-progress.tsx', import.meta.url), 'utf8')

test('issue 55 keeps snoozed tiles from showing a second maximize-style action', () => {
  assert.match(source, /const showTileExpandAction = !!onExpand && !isExpanded && !isSnoozed/)
  assert.match(source, /\{showTileExpandAction && \(/)
  assert.match(source, /title="Show only this session"/)
  assert.match(source, /title="Restore session"/)
})

test('issue 55 keeps ACP agent identity in one place in the tile header', () => {
  assert.match(source, /const showTileProfileName = !!profileName && !acpSessionInfo\?\.agentTitle/)
  assert.match(source, /\{showTileProfileName && \(/)
  assert.match(source, /<ACPSessionBadge info=\{acpSessionInfo\}/)
})