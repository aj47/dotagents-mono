import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsGeneralSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-general.tsx'),
  'utf8',
)

const langfuseBlock = settingsGeneralSource.match(
  /<ControlGroup[\s\S]*?title="Langfuse Observability"[\s\S]*?<\/ControlGroup>/,
)?.[0] ?? ''

test('desktop langfuse settings keep intro copy compact and surface the tracing toggle first', () => {
  assert.ok(langfuseBlock, 'expected to find the Langfuse settings group')
  assert.match(langfuseBlock, /Optional tracing for LLM calls, agent sessions, and tools\./)
  assert.match(langfuseBlock, /Docs[\s\S]*?<ExternalLink className="h-3 w-3"/) 
  assert.match(langfuseBlock, /<Control label="Enable tracing" className="px-3">/)
  assert.doesNotMatch(langfuseBlock, /Enable Langfuse Tracing/)
  assert.doesNotMatch(langfuseBlock, /is an open-source LLM observability platform/)
  assert.ok(
    langfuseBlock.indexOf('<Control label="Enable tracing" className="px-3">')
      < langfuseBlock.indexOf('Install the optional <span className="font-mono">langfuse</span> package'),
    'expected the tracing toggle to appear before the install note',
  )
})

test('desktop langfuse settings use a compact install note instead of a multi-paragraph warning card', () => {
  assert.ok(langfuseBlock, 'expected to find the Langfuse settings group')
  assert.match(langfuseBlock, /Install the optional <span className="font-mono">langfuse<\/span> package with <span className="font-mono">pnpm add langfuse<\/span>, then restart DotAgents to enable tracing\./)
  assert.doesNotMatch(langfuseBlock, /Langfuse package not installed/)
  assert.doesNotMatch(langfuseBlock, /To enable observability features, install it by running:/)
  assert.doesNotMatch(langfuseBlock, /After installing, restart the app to enable Langfuse integration\./)
})

test('desktop langfuse settings avoid a redundant configured helper sentence', () => {
  assert.ok(langfuseBlock, 'expected to find the Langfuse settings group')
  assert.match(langfuseBlock, /<Control label="Status" className="px-3">/)
  assert.match(langfuseBlock, />Configured</)
  assert.doesNotMatch(langfuseBlock, /Traces will be sent to Langfuse for each agent session\./)
})