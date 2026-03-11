import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const sidebarSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/components/active-agents-sidebar.tsx'),
  'utf8',
)

test('desktop active agents sidebar separates sessions from the rest of the rail', () => {
  assert.match(sidebarSource, /border-border\/50 mb-2 border-b px-2 pb-2/)
})

test('desktop sidebar past-session rows reclaim width for titles instead of spending it on archive chrome', () => {
  assert.doesNotMatch(sidebarSource, /<Archive className="h-3 w-3 shrink-0 opacity-50"/)
  assert.match(sidebarSource, /mt-1 max-h-\[45vh\] space-y-0\.5 overflow-y-auto pl-1\.5 pr-0\.5/)
  assert.match(sidebarSource, /text-muted-foreground flex min-w-0 items-center rounded-md px-1 py-1 text-xs transition-colors/)
  assert.match(sidebarSource, /title=\{session\.conversationTitle \|\| "Untitled session"\}/)
})