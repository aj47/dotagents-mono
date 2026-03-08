const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-loops.tsx'),
  'utf8'
)

test('repeat task editor tracks a dirty baseline and warns before canceling a dirty draft', () => {
  assert.match(settingsSource, /const \[editingBaseline, setEditingBaseline\] = useState<EditingLoop \| null>\(null\)/)
  assert.match(settingsSource, /const isEditingDirty = hasLoopDraftChanges\(editing, editingBaseline\)/)
  assert.match(settingsSource, /Discard this new task draft\? Your unsaved changes will be lost\./)
  assert.match(settingsSource, /Discard your changes to \\\"\$\{editingLabel\}\\\"\? Your unsaved edits will be lost\./)
  assert.match(settingsSource, /You have unsaved changes\. Save before leaving or replacing this task draft\./)
})

test('repeat task editor confirms before replacing an in-progress draft with a new task or different task edit', () => {
  assert.match(settingsSource, /Start a new task and replace your current draft\? Your unsaved changes will be overwritten\./)
  assert.match(settingsSource, /Discard your current draft and edit \\\"\$\{loop\.name\}\\\" instead\? Your unsaved changes will be overwritten\./)
  assert.match(settingsSource, /setEditingBaseline\(cloneEditingLoop\(nextEditing\)\)/)
})