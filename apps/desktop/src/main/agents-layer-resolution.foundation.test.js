import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configSource = fs.readFileSync(path.join(__dirname, 'config.ts'), 'utf8')
const tipcSource = fs.readFileSync(path.join(__dirname, 'tipc.ts'), 'utf8')
const agentProfileServiceSource = fs.readFileSync(path.join(__dirname, 'agent-profile-service.ts'), 'utf8')
const skillsServiceSource = fs.readFileSync(path.join(__dirname, 'skills-service.ts'), 'utf8')
const memoryServiceSource = fs.readFileSync(path.join(__dirname, 'memory-service.ts'), 'utf8')
const loopServiceSource = fs.readFileSync(path.join(__dirname, 'loop-service.ts'), 'utf8')

test('config centralizes runtime .agents layer resolution for future slot-aware callers', () => {
  assert.match(configSource, /export type RuntimeAgentsLayerName = "global" \| "slot" \| "workspace"/)
  assert.match(configSource, /export function getRuntimeAgentsLayers\(\): RuntimeAgentsLayers/)
  assert.match(configSource, /global -> active slot -> workspace/)
  assert.match(configSource, /workspace wins on conflicts/)
  assert.match(configSource, /activeSlotLayer: RuntimeAgentsLayer \| null/)
  assert.match(configSource, /orderedLayers: \[globalLayer, \.{3}\(activeSlotLayer \? \[activeSlotLayer\] : \[\]\), \.{3}\(workspaceLayer \? \[workspaceLayer\] : \[\]\)\]/)
  assert.match(configSource, /writableLayer: workspaceLayer \?\? globalLayer/)
  assert.match(configSource, /workspaceSource: "env" \| "upward" \| null/)
})

test('core desktop services read current layer ordering through getRuntimeAgentsLayers', () => {
  assert.match(agentProfileServiceSource, /getRuntimeAgentsLayers\(\)/)
  assert.match(agentProfileServiceSource, /loadMergedAgentProfiles\(/)
  assert.match(skillsServiceSource, /getRuntimeAgentsLayers\(\)/)
  assert.match(memoryServiceSource, /getRuntimeAgentsLayers\(\)/)
  assert.match(loopServiceSource, /getRuntimeAgentsLayers\(\)/)
})

test('tipc bundle and cleanup flows share the centralized layer contract', () => {
  assert.match(tipcSource, /const \{ globalLayer, workspaceLayer, workspaceSource \} = getRuntimeAgentsLayers\(\)/)
  assert.match(tipcSource, /const \{ orderedLayers \} = getRuntimeAgentsLayers\(\)/)
  assert.match(tipcSource, /const \{ globalLayer, orderedLayers, workspaceLayer \} = getRuntimeAgentsLayers\(\)/)
  assert.match(tipcSource, /const \{ globalLayer, activeSlotLayer, workspaceLayer, writableLayer \} = getRuntimeAgentsLayers\(\)/)
  assert.match(tipcSource, /const \{ writableLayer \} = getRuntimeAgentsLayers\(\)/)
  assert.match(configSource, /export function setActiveBundleSlot\(slotId: string \| null\): BundleSlotState/)
  assert.match(configSource, /export function getBundleSlotDirectory\(slotId: string\): \{ id: string; slotDir: string \}/)
  assert.match(configSource, /export function createBundleSlot\(slotId: string\): BundleSlotSummary/)
  assert.match(configSource, /safeWriteJsonFileSync\(\s*activeBundleSlotStatePath,/)
  assert.match(tipcSource, /setActiveBundleSlot: t\.procedure/)
  assert.match(tipcSource, /clearActiveBundleSlot: t\.procedure\.action\(async \(\) =>/)
  assert.match(tipcSource, /type BundleImportTargetMode = "default" \| "active-slot" \| "new-slot"/)
  assert.match(tipcSource, /if \(targetMode === "new-slot"\) \{[\s\S]*createBundleSlot\(slot\.id\)/)
  assert.match(tipcSource, /await refreshRuntimeAfterAgentsLayerChange\(\)/)
})