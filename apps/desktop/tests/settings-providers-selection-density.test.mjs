import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsProvidersSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-providers.tsx'),
  'utf8',
)

const providerSelectionBlock = settingsProvidersSource.match(
  /<ControlGroup title="Provider Selection">[\s\S]*?<\/ControlGroup>/,
)?.[0] ?? ''

test('desktop provider selection removes redundant intro helper copy while keeping the actionable rows', () => {
  assert.ok(providerSelectionBlock, 'expected to find the desktop provider selection group')
  assert.doesNotMatch(providerSelectionBlock, /Select which AI provider to use for each feature\. Configure API keys and models in the provider sections below\./)
  assert.match(providerSelectionBlock, /<ProviderSelector[\s\S]*?label="Voice Transcription \(STT\)"/)
  assert.match(providerSelectionBlock, /<ProviderSelector[\s\S]*?label="Transcript Post-Processing"/)
  assert.match(providerSelectionBlock, /<ProviderSelector[\s\S]*?label=\{isMainAgentAcpMode \? "Agent\/MCP Tools \(API mode\)" : "Agent\/MCP Tools"\}/)
  assert.match(providerSelectionBlock, /<ProviderSelector[\s\S]*?label="Text-to-Speech \(TTS\)"/)
})

test('desktop provider selection still keeps ACP-specific orientation copy in source', () => {
  assert.ok(providerSelectionBlock, 'expected to find the desktop provider selection group')
  assert.match(providerSelectionBlock, /ACP Main Agent:/)
  assert.match(providerSelectionBlock, /In ACP mode, this agent handles chat submissions\. API provider selection below for Agent\/MCP tools applies in API mode\./)
})