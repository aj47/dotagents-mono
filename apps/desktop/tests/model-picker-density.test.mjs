import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const modelSelectorSource = readFileSync(new URL('../src/renderer/src/components/model-selector.tsx', import.meta.url), 'utf8')
const presetModelSelectorSource = readFileSync(new URL('../src/renderer/src/components/preset-model-selector.tsx', import.meta.url), 'utf8')

test('desktop provider model selector uses shorter labels and text-first actions', () => {
  assert.match(modelSelectorSource, /className="flex flex-wrap items-start justify-between gap-2"/)
  assert.match(modelSelectorSource, /className="h-6 whitespace-nowrap px-2 text-\[11px\] font-medium"/)
  assert.match(modelSelectorSource, /\{useCustomInput \? "List" : "Custom"\}/)
  assert.match(modelSelectorSource, /\{isLoading \? "Loading\.\.\." : "Refresh"\}/)
  assert.match(modelSelectorSource, /label="Agent\/MCP model"/)
  assert.match(modelSelectorSource, /label="Transcript model"/)
  assert.doesNotMatch(modelSelectorSource, /title=\{useCustomInput \? "Switch to model list" : "Use custom model name"\}/)
  assert.doesNotMatch(modelSelectorSource, /<Edit3 className="h-3 w-3" \/>/)
  assert.doesNotMatch(modelSelectorSource, /<RefreshCw/)
})

test('desktop preset model selector keeps the refresh action explicit and wrap-safe', () => {
  assert.match(presetModelSelectorSource, /className="flex flex-wrap items-start justify-between gap-2"/)
  assert.match(presetModelSelectorSource, /className="h-6 whitespace-nowrap px-2 text-\[11px\] font-medium"/)
  assert.match(presetModelSelectorSource, /\{isLoading \? "Loading\.\.\." : "Refresh"\}/)
  assert.doesNotMatch(presetModelSelectorSource, /<RefreshCw/)
})