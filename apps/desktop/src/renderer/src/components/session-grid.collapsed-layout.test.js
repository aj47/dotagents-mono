import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const sessionGridSource = fs.readFileSync(new URL('./session-grid.tsx', import.meta.url), 'utf8')

test('collapsed session tiles expand to the full measured grid width so they do not hold a half-width column', () => {
  assert.match(sessionGridSource, /const effectiveWidth = isCollapsed && containerWidth > 0 \? containerWidth : width/)
  assert.match(sessionGridSource, /style=\{\{ width: effectiveWidth, height: isCollapsed \? "auto" : height \}\}/)
})