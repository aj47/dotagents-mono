import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const sessionGridSource = fs.readFileSync(new URL('./session-grid.tsx', import.meta.url), 'utf8')

test('collapsed session tiles keep the measured grid column width so neighboring tiles can reflow into freed space', () => {
  assert.match(sessionGridSource, /const collapsedWidth = containerWidth > 0\s+\? calculateTileWidth\(containerWidth, gap, layoutMode\)\s+: width/)
  assert.match(sessionGridSource, /const effectiveWidth = isCollapsed \? collapsedWidth : width/)
  assert.match(sessionGridSource, /style=\{\{ width: effectiveWidth, height: isCollapsed \? "auto" : height \}\}/)
})
