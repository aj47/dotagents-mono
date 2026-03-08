import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('./sessions.tsx', import.meta.url), 'utf8')

test('issue 55 packs collapsed tiles after expanded ones so open tiles reclaim the main grid area', () => {
  assert.match(source, /const hasCollapsedVisibleTile = useMemo\(/)
  assert.match(source, /const orderedVisibleProgressEntries = useMemo\(\(\) => \{/)
  assert.match(source, /const expandedEntries: typeof visibleProgressEntries = \[\]/)
  assert.match(source, /const collapsedEntries: typeof visibleProgressEntries = \[\]/)
  assert.match(source, /return \[\.\.\.expandedEntries, \.\.\.collapsedEntries\]/)
})

test('issue 55 disables drag reorder while collapsed packing is active', () => {
  assert.match(
    source,
    /const canReorderTiles =\s+!isFocusLayout && allProgressEntries\.length > 1 && !hasCollapsedVisibleTile/,
  )
})