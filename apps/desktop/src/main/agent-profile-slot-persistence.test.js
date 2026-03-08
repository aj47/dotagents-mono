import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const agentProfileServiceSource = fs.readFileSync(path.join(__dirname, 'agent-profile-service.ts'), 'utf8')
const modularConfigSource = fs.readFileSync(path.join(__dirname, 'agents-files', 'modular-config.ts'), 'utf8')

test('agent profile persistence keeps track of layered origins for later writes', () => {
  assert.match(agentProfileServiceSource, /private profileOriginById = new Map<string, AgentProfileOrigin>\(\)/)
  assert.match(agentProfileServiceSource, /private resolveProfilePersistenceLayer\(profileId: string\): RuntimeAgentsLayer/)
  assert.match(agentProfileServiceSource, /const origin = this\.profileOriginById\.get\(profileId\)/)
  assert.match(agentProfileServiceSource, /for \(const layer of \[\.\.\.orderedLayers\]\.reverse\(\)\)/)
  assert.match(agentProfileServiceSource, /return getRuntimeAgentsLayers\(\)\.writableLayer/)
  assert.match(agentProfileServiceSource, /const targetLayer = this\.resolveProfilePersistenceLayer\(profile\.id\)/)
  assert.match(agentProfileServiceSource, /deleteAgentProfileFiles\(targetLayer\.paths, id\)/)
})

test('main-agent prompt loading/saving respects the highest available prompt layer instead of only the topmost overlay', () => {
  assert.match(agentProfileServiceSource, /private promptSourceLayers = \{/)
  assert.match(agentProfileServiceSource, /let systemPromptLayer: RuntimeAgentsLayer \| null = null/)
  assert.match(agentProfileServiceSource, /let agentsGuidelinesLayer: RuntimeAgentsLayer \| null = null/)
  assert.match(agentProfileServiceSource, /if \(systemPrompt === null && loaded\.systemPrompt !== null\)/)
  assert.match(agentProfileServiceSource, /if \(agentsGuidelines === null && loaded\.agentsGuidelines !== null\)/)
  assert.match(agentProfileServiceSource, /const systemPromptLayer = this\.promptSourceLayers\.systemPrompt \?\? profileLayer/)
  assert.match(agentProfileServiceSource, /const agentsGuidelinesLayer = this\.promptSourceLayers\.agentsGuidelines \?\? profileLayer/)
  assert.doesNotMatch(agentProfileServiceSource, /const agentsLayerPaths = orderedLayers\[orderedLayers\.length - 1\]\?\.paths/)
})

test('modular config exposes per-file prompt writers so layered prompt sources can persist independently', () => {
  assert.match(modularConfigSource, /export function writeSystemPromptFile\(/)
  assert.match(modularConfigSource, /export function writeAgentsGuidelinesFile\(/)
  assert.match(modularConfigSource, /writeSystemPromptFile\(layer, systemPrompt, defaultSystemPrompt, options\)/)
  assert.match(modularConfigSource, /writeAgentsGuidelinesFile\(layer, agentsGuidelines, options\)/)
})