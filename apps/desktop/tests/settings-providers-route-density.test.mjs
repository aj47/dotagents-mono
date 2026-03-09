import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const routeSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-providers-and-models.tsx'),
  'utf8',
)

test('desktop providers/models route does not wrap providers in an extra scroll panel', () => {
  assert.match(routeSource, /<ProvidersSettings\s*\/>/)
  assert.doesNotMatch(routeSource, /modern-panel h-full overflow-y-auto overflow-x-hidden px-6 py-4/)
  assert.doesNotMatch(routeSource, /space-y-8/)
})

test('desktop providers/models route still includes the models section hook point', () => {
  assert.match(routeSource, /<ModelsSettings\s*\/>/)
})