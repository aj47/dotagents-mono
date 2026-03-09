import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsGeneralSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-general.tsx'),
  'utf8',
)

const shortcutsGroup = settingsGeneralSource.match(
  /<ControlGroup[\s\S]*?title="Shortcuts"[\s\S]*?<Control label="Recording" className="px-3">/,
)?.[0] ?? ''

test('desktop shortcuts helper keeps cancel guidance visible without a hover-only tooltip', () => {
  assert.ok(shortcutsGroup, 'expected to find the desktop shortcuts settings group')
  assert.match(
    shortcutsGroup,
    /shortcut === "hold-ctrl"[\s\S]*?"Hold Ctrl to record, release it to finish, and press any other key to cancel\."/,
  )
  assert.match(
    shortcutsGroup,
    /: "Press Ctrl\+\/ to start and finish recording\. Press Esc to cancel\."/,
  )
  assert.doesNotMatch(shortcutsGroup, /<TooltipProvider/)
  assert.doesNotMatch(shortcutsGroup, /i-mingcute-information-fill/)
})