import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const queuePanelSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/components/message-queue-panel.tsx'),
  'utf8',
)

const compactSection = queuePanelSource.split('if (compact) {')[1]?.split('\n\n  return (')[0] ?? ''

test('desktop compact queue controls keep a safer hit area without adding extra toolbar chrome', () => {
  assert.ok(compactSection, 'expected to find the compact queue branch')
  assert.match(compactSection, /flex flex-wrap items-center gap-2 rounded-md px-2 py-1\.5 text-xs/)
  assert.doesNotMatch(compactSection, /className="h-4 w-4 text-(green|amber)-/)
  assert.doesNotMatch(compactSection, /"h-4 w-4",/)
  assert.match(compactSection, /className="h-6 w-6 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 hover:bg-green-100 dark:hover:bg-green-900\/30"/)
  assert.match(compactSection, /className="h-6 w-6 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900\/30"/)
  assert.match(compactSection, /"h-6 w-6",/)
  assert.match(compactSection, /<Play className="h-3\.5 w-3\.5" \/>/)
  assert.match(compactSection, /<Pause className="h-3\.5 w-3\.5" \/>/)
  assert.match(compactSection, /<Trash2 className="h-3\.5 w-3\.5" \/>/)
})
