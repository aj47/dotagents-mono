import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsGeneralSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-general.tsx'),
  'utf8',
)

const modularConfigBlock = settingsGeneralSource.match(
  /<ControlGroup[\s\S]*?title="Modular config \(\.agents\)"[\s\S]*?<\/ControlGroup>/,
)?.[0] ?? ''

test('desktop modular config settings use one compact explanatory block instead of split helper copy', () => {
  assert.ok(modularConfigBlock, 'expected to find the modular config settings group')
  assert.doesNotMatch(modularConfigBlock, /endDescription=\{/) 
  assert.doesNotMatch(modularConfigBlock, /Workspace overlay is enabled when a/)
  assert.match(modularConfigBlock, /Advanced configuration can live in <span className="font-mono">\.agents<\/span>\.[\s\S]*?Workspace[\s\S]*?<span className="font-mono">\.agents<\/span> overrides the global layer when present/)
})

test('desktop modular config settings consolidate folder and file actions into one dense control row', () => {
  assert.ok(modularConfigBlock, 'expected to find the modular config settings group')
  assert.doesNotMatch(modularConfigBlock, /<Control label="Open" className="px-3">/)
  assert.doesNotMatch(modularConfigBlock, /<Control label="Reveal files in Finder\/Explorer" className="px-3">/)
  assert.match(modularConfigBlock, /<Control label="Open folders & files" className="px-3">[\s\S]*?Global Folder[\s\S]*?Workspace Folder[\s\S]*?System Prompt[\s\S]*?Guidelines[\s\S]*?<\/Control>/)
})