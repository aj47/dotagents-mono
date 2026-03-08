import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('./agent-progress.tsx', import.meta.url), 'utf8')
const badgeSource = fs.readFileSync(new URL('./acp-session-badge.tsx', import.meta.url), 'utf8')

test('issue 55 keeps snoozed tiles from showing a second maximize-style action', () => {
  assert.match(source, /const showTileExpandAction = !!onExpand && !isExpanded && !isSnoozed/)
  assert.match(source, /\{showTileExpandAction && \(/)
  assert.match(source, /title="Show only this session"/)
  assert.match(source, /title="Restore session"/)
})

test('issue 55 ACP badge falls back to agentName when agentTitle is absent', () => {
  assert.match(badgeSource, /agentName\?: string/)
  assert.match(badgeSource, /const agentIdentityLabel = agentTitle \|\| agentName \|\| null/)
  assert.match(badgeSource, /if \(agentIdentityLabel\) tooltipLines\.push\(`Agent: \$\{agentIdentityLabel\}`\)/)
})

test('issue 55 keeps ACP agent identity in one place in the tile header', () => {
  assert.match(source, /const acpBadgeShowsAgentIdentity = !!\(acpSessionInfo\?\.agentTitle \|\| acpSessionInfo\?\.agentName\)/)
  assert.match(source, /const showTileProfileName = !!profileName && !acpBadgeShowsAgentIdentity/)
  assert.match(source, /\{showTileProfileName && \(/)
  assert.match(source, /<ACPSessionBadge info=\{acpSessionInfo\}/)
})