import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const sessionGridSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/components/session-grid.tsx'),
  'utf8',
)

test('desktop session grid trims outer gutters so live tiles keep more usable space', () => {
  assert.match(sessionGridSource, /gap: 12,/)
  assert.match(sessionGridSource, /Default to gap-3 = 12px/)
  assert.match(sessionGridSource, /columnGap = !Number\.isNaN\(parsedColumnGap\) \? parsedColumnGap : \(!Number\.isNaN\(parsedGap\) \? parsedGap : 12\)/)
  assert.match(sessionGridSource, /"flex min-h-full w-full flex-wrap content-start gap-3 p-3"/)
  assert.doesNotMatch(sessionGridSource, /"flex flex-wrap gap-4 p-4 content-start min-h-full w-full"/)
})