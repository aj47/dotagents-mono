import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsGeneralSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-general.tsx'),
  'utf8',
)

const compactionControl = settingsGeneralSource.match(
  /<Control[\s\S]*?label="Context Compaction"[\s\S]*?<\/Control>/,
)?.[0] ?? ''

test('desktop settings exposes compact context compaction threshold controls', () => {
  assert.ok(compactionControl, 'expected to find the Context Compaction control')
  assert.match(compactionControl, /Context window ratio/)
  assert.match(compactionControl, /Summary chars/)
  assert.match(compactionControl, /Messages/)
  assert.match(compactionControl, /Token override/)
  assert.match(compactionControl, /sm:grid-cols-3/)
  assert.match(compactionControl, /placeholder="Use ratio"/)
})

test('desktop settings saves all context compaction threshold config keys', () => {
  assert.match(settingsGeneralSource, /mcpContextTargetRatioPercentDraft/)
  assert.match(settingsGeneralSource, /mcpContextTargetRatio: parsedValue \/ 100/)
  assert.match(settingsGeneralSource, /mcpContextSummarizeCharThresholdDraft/)
  assert.match(settingsGeneralSource, /saveConfig\(\{ mcpContextSummarizeCharThreshold: parsedValue \}\)/)
  assert.match(settingsGeneralSource, /mcpConversationCompactionMessageThresholdDraft/)
  assert.match(settingsGeneralSource, /mcpConversationCompactionMessageThreshold: parsedValue/)
  assert.match(settingsGeneralSource, /mcpConversationCompactionTokenThresholdDraft/)
  assert.match(settingsGeneralSource, /mcpConversationCompactionTokenThreshold: parsedValue/)
  assert.match(settingsGeneralSource, /mcpConversationCompactionTokenThreshold: undefined/)
})
