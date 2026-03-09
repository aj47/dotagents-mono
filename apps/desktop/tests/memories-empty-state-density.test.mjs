import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const memoriesSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/memories.tsx'),
  'utf8',
)

const emptyStateMatch = memoriesSource.match(/filteredMemories\.length === 0 \? \(([\s\S]*?)\)\s*:\s*/)

assert.ok(emptyStateMatch, 'expected to find the desktop memories empty state block')

const emptyStateSource = emptyStateMatch[1]

test('desktop memories empty state avoids oversized hero chrome', () => {
  assert.doesNotMatch(emptyStateSource, /flex flex-col items-center justify-center py-12 text-center/)
  assert.doesNotMatch(emptyStateSource, /<Brain className="h-12 w-12 text-muted-foreground\/50 mb-4" \/>/)
  assert.match(emptyStateSource, /rounded-lg border border-dashed bg-muted\/20 px-5 py-6 text-center sm:px-6/)
  assert.match(emptyStateSource, /<h3 className="text-base font-medium">No memories yet<\/h3>/)
  assert.match(emptyStateSource, /mx-auto mt-1 max-w-sm text-sm text-muted-foreground/)
})

test('desktop memories empty state keeps both empty and search-miss orientation copy', () => {
  assert.match(emptyStateSource, /No memories yet/)
  assert.match(emptyStateSource, /No memories match your search\. Try a different query\./)
  assert.match(emptyStateSource, /Save summaries from agent sessions to build your knowledge base\./)
})