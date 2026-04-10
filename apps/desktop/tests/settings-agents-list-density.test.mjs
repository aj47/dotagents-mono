import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsAgentsSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-agents.tsx'),
  'utf8',
)

const renderAgentListBlock = settingsAgentsSource.match(/function renderAgentList\(\) \{([\s\S]*?)\n  \}\n\n  function renderEditForm/)?.[1] ?? ''

test('desktop settings agents summarize low-priority card metadata into one muted line', () => {
  assert.match(settingsAgentsSource, /function getAgentCardSummaryItems\(agent: AgentProfile, availableSkillCount: number\): string\[]/)
  assert.match(settingsAgentsSource, /const items: string\[] = \[agent\.connection\.type\]/)
  assert.match(settingsAgentsSource, /const agentProviderId = agent\.modelConfig\?\.agentProviderId \|\| agent\.modelConfig\?\.mcpToolsProviderId/)
  assert.match(settingsAgentsSource, /items\.push\(`\$\{enabledServerCount\} server\$\{enabledServerCount === 1 \? "" : "s"\}`\)/)
  assert.match(settingsAgentsSource, /items\.push\(`\$\{enabledSkillCount\} skill\$\{enabledSkillCount === 1 \? "" : "s"\}`\)/)
  assert.match(settingsAgentsSource, /items\.push\(`\$\{propertyCount\} prop\$\{propertyCount === 1 \? "" : "s"\}`\)/)
})

test('desktop settings agents keep only high-signal status badges and render the rest as summary text', () => {
  assert.ok(renderAgentListBlock, 'expected to find the desktop settings agents list block')
  assert.match(renderAgentListBlock, /const summaryItems = getAgentCardSummaryItems\(agent, skills\.length\)/)
  assert.match(renderAgentListBlock, /\{\(agent\.isBuiltIn \|\| agent\.isDefault \|\| !agent\.enabled\) && \(/)
  assert.match(renderAgentListBlock, /Built-in/)
  assert.match(renderAgentListBlock, /Default/)
  assert.match(renderAgentListBlock, /Disabled/)
  assert.match(renderAgentListBlock, /<p className="text-\[11px\] leading-tight text-muted-foreground">\s*\{summaryItems\.join\(" • "\)\}/)
  assert.doesNotMatch(renderAgentListBlock, /\{agent\.connection\.type\}<\/Badge>/)
  assert.doesNotMatch(renderAgentListBlock, /enabledServers!\.length/) 
  assert.doesNotMatch(renderAgentListBlock, /Object\.keys\(agent\.properties\)\.length} props<\/Badge>/)
})

test('desktop settings agents keep the empty state compact and text-first', () => {
  assert.ok(renderAgentListBlock, 'expected to find the desktop settings agents list block')
  assert.match(renderAgentListBlock, /<div className="col-span-full rounded-lg border border-dashed bg-muted\/20 px-4 py-7 text-center">/)
  assert.match(renderAgentListBlock, /<p className="text-sm font-medium text-foreground">No agents yet\.<\/p>/)
  assert.match(renderAgentListBlock, /Create one with Add Agent or import an existing bundle\./)
  assert.doesNotMatch(renderAgentListBlock, /text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl/)
})