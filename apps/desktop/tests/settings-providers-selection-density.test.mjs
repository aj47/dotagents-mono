import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsProvidersSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-providers.tsx'),
  'utf8',
)

const providerSetupBlock = settingsProvidersSource.match(
  /<h2 className="text-sm font-semibold">Provider Setup<\/h2>[\s\S]*?{isMainAgentAcpMode && \(/,
)?.[0] ?? ''

test('desktop provider selection removes redundant intro helper copy while keeping the actionable rows', () => {
  assert.ok(providerSetupBlock, 'expected to find the desktop provider setup section')
  assert.doesNotMatch(providerSetupBlock, /Select which AI provider to use for each feature\. Configure API keys and models in the provider sections below\./)
  assert.match(providerSetupBlock, /Use this page for API keys, base URLs, local engine downloads, and quick provider diagnostics\./)
  assert.match(settingsProvidersSource, /label: "STT"/)
  assert.match(settingsProvidersSource, /label: "Cleanup"/)
  assert.match(settingsProvidersSource, /label: "Agent"/)
  assert.match(settingsProvidersSource, /label: "TTS"/)
  assert.doesNotMatch(settingsProvidersSource, /Agent\/MCP Tools/)
})

test('desktop provider selection still keeps ACP-specific orientation copy in source', () => {
  assert.ok(providerSetupBlock, 'expected to find the desktop provider setup section')
  assert.match(settingsProvidersSource, /ACP Main Agent:/)
  assert.match(settingsProvidersSource, /ACP mode handles chat submissions through the selected agent\. Provider setup below still applies to API-backed\s*tools, voice, and local engines\./)
})