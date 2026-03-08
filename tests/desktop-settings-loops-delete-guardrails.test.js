const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-loops.tsx'),
  'utf8'
)

test('repeat task deletion uses row-level confirmation and retry state instead of browser confirm', () => {
  assert.match(settingsSource, /const \[deleteConfirmId, setDeleteConfirmId\] = useState<string \| null>\(null\)/)
  assert.match(settingsSource, /const \[pendingDeleteId, setPendingDeleteId\] = useState<string \| null>\(null\)/)
  assert.match(settingsSource, /const \[deleteErrorById, setDeleteErrorById\] = useState<Record<string, string>>\(\{\}\)/)
  assert.match(settingsSource, /Delete &quot;\{loop\.name\}&quot;\?/) 
  assert.match(settingsSource, /Retry delete/)
  assert.match(settingsSource, /Deleting\.\.\./)
  assert.match(settingsSource, /The task is still shown below until deletion succeeds\./)
  assert.doesNotMatch(settingsSource, /confirm\(/)
})

test('repeat task deletion handles false delete results explicitly and disables row controls while pending', () => {
  assert.match(settingsSource, /const result = await tipcClient\.deleteLoop\(\{ loopId: loop\.id \}\)/)
  assert.match(settingsSource, /if \(!result\?\.success\) \{[\s\S]*setDeleteErrorById/)
  assert.match(settingsSource, /disabled=\{isDeleting\}[\s\S]*handleRunNow\(loop\)/)
  assert.match(settingsSource, /disabled=\{isDeleting\}[\s\S]*handleOpenTaskFile\(loop\)/)
  assert.match(settingsSource, /disabled=\{isDeleting\}[\s\S]*handleEdit\(loop\)/)
  assert.match(settingsSource, /<Switch[\s\S]*disabled=\{isDeleting\}/)
})