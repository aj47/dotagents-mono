import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsLoopsSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-loops.tsx'),
  'utf8',
)

test('desktop repeat-task settings remove the dedicated page-title chrome from the list view', () => {
  assert.doesNotMatch(settingsLoopsSource, /<h1 className="text-lg font-semibold">Repeat Tasks<\/h1>/)
  assert.doesNotMatch(settingsLoopsSource, /Configure tasks to run automatically at regular intervals/)
  assert.match(settingsLoopsSource, /className="modern-panel h-full overflow-y-auto overflow-x-hidden px-6 py-4"/)
})

test('desktop repeat-task settings keep the primary action in a compact top-right row', () => {
  assert.match(settingsLoopsSource, /\{!editing && \([\s\S]*?<div className="mb-3 flex flex-wrap items-center justify-end gap-2">[\s\S]*?<Button size="sm" className="gap-1\.5" onClick=\{handleCreate\}>[\s\S]*?Add Task/)
})