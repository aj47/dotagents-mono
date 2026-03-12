import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const appLayoutSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/components/app-layout.tsx'),
  'utf8',
)

test('desktop app layout hides the old always-visible settings panel behind a cog modal', () => {
  assert.match(appLayoutSource, /<HomeSettingsDialog[\s\S]*?open=\{settingsDialogOpen\}/)
  assert.match(appLayoutSource, /<Settings2 className="h-3\.5 w-3\.5" \/>/)
  assert.doesNotMatch(appLayoutSource, /<AgentCapabilitiesSidebar/)
  assert.doesNotMatch(appLayoutSource, /Settings Section - Collapsible/)
})