const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const controlSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'ui', 'control.tsx'),
  'utf8',
)

test('desktop ControlGroup uses a full-width disclosure row for collapsible settings groups', () => {
  assert.match(controlSource, /overflow-hidden rounded-lg border bg-card\/40/)
  assert.match(controlSource, /group flex w-full items-center justify-between gap-3 px-3 py-2\.5 text-left/)
  assert.match(controlSource, /aria-expanded=\{showContent\}/)
  assert.match(controlSource, /aria-controls=\{contentId\}/)
  assert.match(controlSource, /hover:bg-accent\/30/)
})