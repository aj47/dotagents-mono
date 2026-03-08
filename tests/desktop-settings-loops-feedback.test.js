const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-loops.tsx'),
  'utf8'
)

test('repeat task settings keep load and fetch-failure states distinct from the empty state', () => {
  assert.match(settingsSource, /const isLoadingLoops = loopsQuery\.isLoading && !loopsQuery\.data/)
  assert.match(settingsSource, /const hasLoopLoadError = loopsQuery\.isError && !loopsQuery\.data/)
  assert.match(settingsSource, /Loading repeat tasks\.\.\./)
  assert.match(settingsSource, /Checking your saved schedules and their latest run details\./)
  assert.match(settingsSource, /Couldn&apos;t load repeat tasks/)
  assert.match(settingsSource, /not showing the empty-state placeholder yet\./)
  assert.match(settingsSource, /getLoopQueryErrorMessage\(loopsQuery\.error\)/)
  assert.match(settingsSource, /void loopsQuery\.refetch\(\)/)
  assert.match(settingsSource, /Retry loading/)
})

test('repeat task empty state still exists for the genuine no-tasks case', () => {
  assert.match(settingsSource, /No repeat tasks configured\. Click &quot;Add Task&quot; to create one\./)
})