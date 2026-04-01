import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const queuePanelSource = fs.readFileSync(
  path.join(process.cwd(), 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'message-queue-panel.tsx'),
  'utf8',
)

const queuedMessageItemSource = queuePanelSource.match(/function QueuedMessageItem\([\s\S]*?\n}\n\n\/\*\*/)?.[0] ?? ''

test('desktop queued-message rows keep compact inline icon actions instead of a secondary metadata row', () => {
  assert.ok(queuedMessageItemSource, 'expected to find the queued message item component')
  assert.match(queuedMessageItemSource, /<div className="flex min-w-0 items-start gap-2">/)
  assert.match(queuedMessageItemSource, /<div className="flex min-w-0 flex-1 items-start gap-1\.5">/)
  assert.match(queuedMessageItemSource, /<div className="min-w-0 flex-1">/)
  assert.match(queuedMessageItemSource, /\{!isProcessing && \(\s*<div className="ml-auto flex shrink-0 items-center gap-0\.5 self-start">/)
  assert.match(queuedMessageItemSource, /<RotateCcw className=\{cn\("h-3\.5 w-3\.5", retryMutation\.isPending && "animate-spin"\)\} \/>/)
  assert.match(queuedMessageItemSource, /<Pencil className="h-3\.5 w-3\.5" \/>/)
  assert.match(queuedMessageItemSource, /<Trash2 className="h-3\.5 w-3\.5" \/>/)
  assert.match(queuedMessageItemSource, /aria-label="Edit message"/)
  assert.match(queuedMessageItemSource, /aria-label="Remove from queue"/)
  assert.match(queuedMessageItemSource, /!isAddedToHistory && \(/)
  assert.doesNotMatch(queuedMessageItemSource, /formatTime\(message\.createdAt\)/)
  assert.doesNotMatch(queuedMessageItemSource, /\{isFailed \? "Failed" : isProcessing \? "Processing\.\.\." : "Queued"\}/)
  assert.doesNotMatch(queuedMessageItemSource, /opacity-0 group-hover:opacity-100/)
})