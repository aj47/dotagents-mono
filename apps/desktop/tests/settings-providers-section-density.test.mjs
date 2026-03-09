import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsProvidersSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-providers.tsx'),
  'utf8',
)

test('desktop provider sections replace the old banner blocks with compact inline notes', () => {
  const compactNoteMatches = settingsProvidersSource.match(/className="px-3 py-1\.5 text-\[11px\] text-muted-foreground"/g) ?? []

  assert.equal(compactNoteMatches.length, 7)
  assert.doesNotMatch(settingsProvidersSource, /className="px-3 py-2 bg-muted\/30 border-b"/)
  assert.doesNotMatch(settingsProvidersSource, /This provider is not currently selected for any feature\. Select it above to use it\./)
})

test('desktop provider sections keep shorter orientation copy while surfacing controls sooner', () => {
  assert.match(settingsProvidersSource, /Local speech-to-text with NVIDIA Parakeet on your device\./)
  assert.match(settingsProvidersSource, /Local text-to-speech with Kitten on your device\./)
  assert.match(settingsProvidersSource, /Local text-to-speech with Supertonic on your device\. Supports English, Korean, Spanish, Portuguese, and French\./)
  assert.match(settingsProvidersSource, /Not selected above\. You can still configure it here\./)
  assert.match(settingsProvidersSource, /Not selected above\. You can still manage presets here\./)
  assert.match(settingsProvidersSource, /Use a separate model for UI and memory summaries\./)
})