import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const queuePanelSource = fs.readFileSync(
  path.join(process.cwd(), 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'message-queue-panel.tsx'),
  'utf8',
)

const queuedMessageItemSource = queuePanelSource.match(/function QueuedMessageItem\([\s\S]*?\n}\n\n\/\*\*/)?.[0] ?? ''

test('desktop queued-message rows keep stable text-first actions instead of a hover-only side rail', () => {
  assert.ok(queuedMessageItemSource, 'expected to find the queued message item component')
  assert.match(queuedMessageItemSource, /<div className="flex min-w-0 items-start gap-2">/)
  assert.match(queuedMessageItemSource, /<div className="flex min-w-0 flex-1 flex-col">/)
  assert.match(
    queuedMessageItemSource,
    /<div className="mt-1 flex flex-wrap items-center gap-2">[\s\S]*?<\/div>\s*\{\/\* Hide action buttons when processing \*\/\}\s*\{!isProcessing && \(\s*<div className="mt-2 flex w-full flex-wrap items-center gap-1\.5">/
  )
  assert.match(queuedMessageItemSource, />\s*\{retryMutation\.isPending \? "Retrying…" : "Retry"\}\s*<\//)
  assert.match(queuedMessageItemSource, />\s*Edit\s*<\//)
  assert.match(queuedMessageItemSource, />\s*Remove\s*<\//)
  assert.match(queuedMessageItemSource, /!isAddedToHistory && \(/)
  assert.doesNotMatch(queuedMessageItemSource, /opacity-0 group-hover:opacity-100/)
})