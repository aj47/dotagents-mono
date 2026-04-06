import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const settingsLoopsSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-loops.tsx'),
  'utf8',
)

const renderLoopListBlock = settingsLoopsSource.match(/const renderLoopList = \(\) => \(([\s\S]*?)\n  \)\n\n  const renderEditForm/)?.[1] ?? ''
const renderEditFormBlock = settingsLoopsSource.match(/const renderEditForm = \(\) => \{[\s\S]*?return \(([\s\S]*?)\n    \)\n  \}\n\n  return \(/)?.[1] ?? ''

test('desktop repeat-task settings remove the dedicated page-title chrome from the list view', () => {
  assert.doesNotMatch(settingsLoopsSource, /<h1 className="text-lg font-semibold">Repeat Tasks<\/h1>/)
  assert.doesNotMatch(settingsLoopsSource, /Configure tasks to run automatically at regular intervals/)
  assert.match(settingsLoopsSource, /className="modern-panel h-full overflow-y-auto overflow-x-hidden px-6 py-4"/)
})

test('desktop repeat-task settings keep the primary action in a compact top-right row', () => {
  assert.match(settingsLoopsSource, /<div className="mb-3 flex flex-wrap items-center justify-end gap-2">[\s\S]*?<Button size="sm" className="gap-1\.5" onClick=\{handleCreate\}>[\s\S]*?Add Task/)
})

test('desktop repeat-task settings keep add-task available while the edit form provides local orientation', () => {
  assert.doesNotMatch(settingsLoopsSource, /\{!editing && \(/)
  assert.match(settingsLoopsSource, /<CardTitle className="text-lg">\{isCreating \? "Add Repeat Task" : "Edit Repeat Task"\}<\/CardTitle>/)
})

test('desktop repeat-task edit form keeps interval controls, toggles, and actions compact on narrow settings widths', () => {
  assert.ok(renderEditFormBlock, 'expected to find the desktop repeat-task edit form block')
  assert.doesNotMatch(renderEditFormBlock, /Configure a task to run automatically at regular intervals/)
  assert.match(renderEditFormBlock, /<CardDescription>Set the prompt, interval, and startup behavior\.<\/CardDescription>/)
  assert.match(renderEditFormBlock, /<div className="flex flex-wrap items-center gap-2">[\s\S]*?className="h-8 w-20"/)
  assert.match(renderEditFormBlock, /className="mt-1 flex flex-wrap gap-1\.5"[\s\S]*?className="h-7 px-2 text-xs"/)
  assert.match(renderEditFormBlock, /className="flex flex-wrap items-center gap-x-6 gap-y-2"/)
  assert.match(renderEditFormBlock, /<Button size="sm" variant="outline" className="gap-1\.5" onClick=\{handleCancel\}>/)
  assert.match(renderEditFormBlock, /<Button size="sm" className="gap-1\.5" onClick=\{handleSave\}>/)
})

test('desktop repeat-task list keeps runtime state compact by removing redundant active and startup badges', () => {
  assert.ok(renderLoopListBlock, 'expected to find the desktop repeat-task list block')
  assert.match(renderLoopListBlock, /\{isRunning \? \(/)
  assert.match(renderLoopListBlock, /<Badge variant="secondary">Running<\/Badge>/)
  assert.match(renderLoopListBlock, /\) : !loop\.enabled \? \(/)
  assert.match(renderLoopListBlock, /<Badge variant="outline">Disabled<\/Badge>/)
  assert.doesNotMatch(renderLoopListBlock, /<Badge variant="default">Active<\/Badge>/)
  assert.doesNotMatch(renderLoopListBlock, /<Badge variant="secondary">Run on startup<\/Badge>/)
  assert.match(renderLoopListBlock, /\{loop\.runOnStartup && <div>Runs on startup<\/div>\}/)
})

test('desktop repeat-task settings auto-refresh when the tasks folder changes on disk', () => {
  assert.match(settingsLoopsSource, /rendererHandlers\.loopsFolderChanged\.listen\(\(\) => \{/) 
  assert.match(settingsLoopsSource, /queryClient\.invalidateQueries\(\{ queryKey: \["loops"\] \}\)/)
  assert.match(settingsLoopsSource, /queryClient\.invalidateQueries\(\{ queryKey: \["loop-statuses"\] \}\)/)
})