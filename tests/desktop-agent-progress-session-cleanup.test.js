const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const agentProgressPath = path.join(
  __dirname,
  '..',
  'apps/desktop/src/renderer/src/components/agent-progress.tsx',
)

test('AgentProgress resets session-scoped transient UI state when sessionId changes', () => {
  const source = fs.readFileSync(agentProgressPath, 'utf8')

  const sessionResetBlock = source.match(
    /if \(progress\?\.sessionId !== lastSessionIdRef\.current\) \{[\s\S]*?setRespondingApprovalId\(null\)[\s\S]*?\n    \}/,
  )

  assert.ok(sessionResetBlock, 'expected a dedicated session-change reset block')

  const resetCode = sessionResetBlock[0]
  for (const expectedSnippet of [
    'setIsUserScrolling(false)',
    'setShouldAutoScroll(true)',
    'setShowKillConfirmation(false)',
    'setIsKilling(false)',
    'respondingApprovalIdRef.current = null',
    'setRespondingApprovalId(null)',
  ]) {
    assert.match(resetCode, new RegExp(expectedSnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('AgentProgress keeps transcript expansion and tab state scoped to the current session run', () => {
  const source = fs.readFileSync(agentProgressPath, 'utf8')

  assert.match(
    source,
    /const currentViewStateScopeKey = progress\?\.sessionId[\s\S]*progress\.runId[\s\S]*"no-run"/,
  )
  assert.match(
    source,
    /const viewStateByScopeRef = useRef\(new Map<string, \{[\s\S]*activeTab: "chat" \| "summary"[\s\S]*\}>\(\)\)/,
  )
  assert.match(source, /viewStateByScopeRef\.current\.set\(previousScopeKey, latestViewStateRef\.current\)/)
  assert.match(source, /const nextViewState = currentViewStateScopeKey[\s\S]*viewStateByScopeRef\.current\.get\(currentViewStateScopeKey\)/)
  assert.match(source, /setExpandedItems\(nextViewState\?\.expandedItems \?\? \{\}\)/)
  assert.match(source, /setActiveTab\(nextViewState\?\.activeTab \?\? "chat"\)/)
})