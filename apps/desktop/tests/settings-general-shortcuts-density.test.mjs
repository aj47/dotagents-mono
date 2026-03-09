import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsGeneralSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-general.tsx'),
  'utf8',
)

const shortcutsGroup = settingsGeneralSource.match(
  /<ControlGroup[\s\S]*?title="Shortcuts"[\s\S]*?<\/ControlGroup>/,
)?.[0] ?? ''

test('desktop shortcuts helper keeps cancel guidance visible without a hover-only tooltip', () => {
  assert.ok(shortcutsGroup, 'expected to find the desktop shortcuts settings group')
  assert.match(
    settingsGeneralSource,
    /const customRecordingShortcutDisplay = effectiveRecordingShortcut[\s\S]*?\? formatKeyComboForDisplay\(effectiveRecordingShortcut\)[\s\S]*?: "your custom shortcut"/,
  )
  assert.match(
    settingsGeneralSource,
    /shortcut === "hold-ctrl"[\s\S]*?"Hold Ctrl to record\. Release it to finish; press any other key to cancel\."/,
  )
  assert.match(
    settingsGeneralSource,
    /shortcut === "custom"[\s\S]*?recordingShortcutMode === "toggle"[\s\S]*?`Press \$\{customRecordingShortcutDisplay\} to start or stop recording\. Press Esc to cancel\.`[\s\S]*?: `Hold \$\{customRecordingShortcutDisplay\} to record\. Release it to finish; press any other key to cancel\.`[\s\S]*?: "Press Ctrl\+\/ to start or stop recording\. Press Esc to cancel\."/,
  )
  assert.doesNotMatch(shortcutsGroup, /endDescription=\{/)
  assert.match(
    shortcutsGroup,
    /<Control label="Recording" className="px-3">[\s\S]*?<p className="text-\[11px\] leading-relaxed text-muted-foreground">[\s\S]*?\{recordingShortcutHelperText\}[\s\S]*?<\/p>/,
  )
  assert.doesNotMatch(shortcutsGroup, /<TooltipProvider/)
  assert.doesNotMatch(shortcutsGroup, /i-mingcute-information-fill/)
})