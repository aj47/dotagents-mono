import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sessionsSource = fs.readFileSync(path.join(__dirname, 'sessions.tsx'), 'utf8')

test('collapsed pending continuation tiles defer behind expanded tiles', () => {
  assert.match(sessionsSource, /const shouldDeferPendingProgressTile =\s*showPendingProgressTile &&\s*!!pendingSessionId &&\s*\(collapsedSessions\[pendingSessionId\] \?\? false\) &&\s*!isFocusLayout &&\s*orderedVisibleProgressEntries\.length > 0/)
  assert.match(sessionsSource, /\{showPendingProgressTile && !shouldDeferPendingProgressTile \? renderPendingProgressTile\(0\) : null\}/)
  assert.match(sessionsSource, /const pendingTileIndexOffset =\s*showPendingLoadingTile \|\|\s*\(showPendingProgressTile && !shouldDeferPendingProgressTile\)\s*\?\s*1\s*:\s*0/)
  assert.match(sessionsSource, /const adjustedIndex = pendingTileIndexOffset \? index \+ 1 : index/)
  assert.match(sessionsSource, /\{showPendingProgressTile && shouldDeferPendingProgressTile\s*\?\s*renderPendingProgressTile\(orderedVisibleProgressEntries\.length\)\s*:\s*null\}/)
})