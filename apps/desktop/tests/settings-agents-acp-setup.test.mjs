import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsAgentsSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-agents.tsx'),
  'utf8',
)

const presetSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/shared/external-agent-presets.ts'),
  'utf8',
)

const tipcSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/main/tipc.ts'),
  'utf8',
)

const commandVerificationSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/main/command-verification-service.ts'),
  'utf8',
)

test('desktop agent presets include Codex and OpenCode ACP defaults with setup guidance', () => {
  assert.match(presetSource, /codex:\s*\{[\s\S]*displayName: "Codex"/)
  assert.match(presetSource, /codex:[\s\S]*connectionCommand: "codex-acp"/)
  assert.match(presetSource, /codex:[\s\S]*installCommand: "npm install -g @zed-industries\/codex-acp"/)
  assert.match(presetSource, /opencode:\s*\{[\s\S]*displayName: "OpenCode"/)
  assert.match(presetSource, /opencode:[\s\S]*connectionCommand: "opencode"/)
  assert.match(presetSource, /opencode:[\s\S]*connectionArgs: "acp"/)
  assert.match(presetSource, /opencode:[\s\S]*docsUrl: "https:\/\/opencode\.ai\/docs\/acp\/"/)
  assert.match(presetSource, /setupMode: "managed"/)
})

test('desktop agent edit form exposes external-agent verification and actionable setup copy', () => {
  assert.match(settingsAgentsSource, /External Agent Setup/)
  assert.match(settingsAgentsSource, /Verify Setup/)
  assert.match(settingsAgentsSource, /Runs .* to confirm the command is runnable\./)
  assert.match(settingsAgentsSource, /Verification passed/)
  assert.match(settingsAgentsSource, /Verification needs attention/)
})

test('desktop tipc exposes the external-agent verification route backed by a help-probe service', () => {
  assert.match(tipcSource, /verifyExternalAgentCommand: t\.procedure/)
  assert.match(tipcSource, /await import\("\.\/command-verification-service"\)/)
  assert.match(commandVerificationSource, /const VERIFY_TIMEOUT_MS = 4000/)
  assert.match(commandVerificationSource, /Successfully ran \$\{probePreview\}/)
  assert.match(commandVerificationSource, /Finish any first-run setup or login in your terminal, then retry\./)
})