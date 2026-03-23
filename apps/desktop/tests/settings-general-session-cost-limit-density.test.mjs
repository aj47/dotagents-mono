import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsGeneralSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-general.tsx'),
  'utf8',
)

const remoteServerSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/main/remote-server.ts'),
  'utf8',
)

const agentSettingsBlock = settingsGeneralSource.match(
  /<ControlGroup[\s\S]*?title="Agent Settings"[\s\S]*?<\/ControlGroup>/,
)?.[0] ?? ''

test('desktop agent settings surface a dedicated session cost limit control', () => {
  assert.ok(agentSettingsBlock, 'expected to find the Agent Settings group')
  assert.match(agentSettingsBlock, /label="Session Cost Limit \(USD\)"/)
  assert.match(agentSettingsBlock, /Estimated LLM spend ceiling for a single agent session\. Lower values stop runaway sessions sooner\./)
  assert.match(agentSettingsBlock, /value=\{mcpSessionCostLimitDraft\}/)
  assert.match(agentSettingsBlock, /onChange=\{\(e\) => updateMcpSessionCostLimitDraft\(e\.currentTarget\.value\)\}/)
  assert.match(agentSettingsBlock, /onBlur=\{\(e\) => flushMcpSessionCostLimitSave\(e\.currentTarget\.value\)\}/)
  assert.match(agentSettingsBlock, /placeholder=\{formatMcpSessionCostLimitDraft\(MCP_SESSION_COST_LIMIT_DEFAULT\)\}/)
  assert.match(agentSettingsBlock, /Estimated from model pricing and token usage\. Default: \$1\.00 per session\./)
  assert.ok(
    agentSettingsBlock.indexOf('label="Session Cost Limit (USD)"')
      < agentSettingsBlock.indexOf('label="Emergency Kill Switch"'),
    'expected the cost limit control to appear before the kill switch',
  )
})

test('desktop remote settings API exposes and accepts the session cost limit field', () => {
  assert.match(remoteServerSource, /mcpSessionCostLimitUsd: cfg\.mcpSessionCostLimitUsd \?\? 1,/)
  assert.match(remoteServerSource, /typeof body\.mcpSessionCostLimitUsd === "number" && body\.mcpSessionCostLimitUsd > 0 && body\.mcpSessionCostLimitUsd <= 100/)
  assert.match(remoteServerSource, /updates\.mcpSessionCostLimitUsd = Math\.round\(body\.mcpSessionCostLimitUsd \* 100\) \/ 100/)
})
