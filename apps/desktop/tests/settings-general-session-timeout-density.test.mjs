import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsGeneralSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-general.tsx'),
  'utf8',
)

const agentSettingsGroup = settingsGeneralSource.match(
  /<ControlGroup collapsible defaultCollapsed title="Agent Settings">[\s\S]*?<ControlGroup collapsible defaultCollapsed title="General">/,
)?.[0] ?? ''

test('desktop agent settings keep a hard session time limit visible next to iteration controls', () => {
  assert.ok(agentSettingsGroup, 'expected to find the desktop agent settings group')
  assert.match(settingsGeneralSource, /const MCP_SESSION_TIMEOUT_MINUTES_DEFAULT = 30/)
  assert.match(settingsGeneralSource, /const MCP_SESSION_TIMEOUT_MINUTES_MAX = 720/)
  assert.match(agentSettingsGroup, /label="Unlimited Iterations"/)
  assert.match(agentSettingsGroup, /label="Session Time Limit"/)
  assert.match(
    agentSettingsGroup,
    /Stops long-running agent sessions even when unlimited iterations are allowed\./,
  )
})
