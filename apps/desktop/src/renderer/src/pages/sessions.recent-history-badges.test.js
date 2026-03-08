import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sessionsSource = fs.readFileSync(path.join(__dirname, 'sessions.tsx'), 'utf8')
const pastSessionsDialogSource = fs.readFileSync(path.join(__dirname, '../components/past-sessions-dialog.tsx'), 'utf8')
const historyBadgeSource = fs.readFileSync(path.join(__dirname, '../lib/conversation-history-badges.ts'), 'utf8')

test('sessions recent history surface reuses the shared provenance badge helper', () => {
  assert.match(sessionsSource, /import \{ Badge \} from "@renderer\/components\/ui\/badge"/)
  assert.match(sessionsSource, /import \{ getConversationHistoryBadge \} from "@renderer\/lib\/conversation-history-badges"/)
  assert.match(sessionsSource, /const historyBadge = getConversationHistoryBadge\(session\)/)
  assert.match(sessionsSource, /title=\{historyBadge\.title\}/)
  assert.match(sessionsSource, /\{historyBadge\.label\}/)
})

test('past sessions dialog also uses the shared provenance badge helper contract', () => {
  assert.match(pastSessionsDialogSource, /import \{ getConversationHistoryBadge \} from "@renderer\/lib\/conversation-history-badges"/)
  assert.match(pastSessionsDialogSource, /const historyBadge = getConversationHistoryBadge\(session\)/)
  assert.match(historyBadgeSource, /export function getConversationHistoryBadge\(/)
  assert.match(historyBadgeSource, /History compacted/)
  assert.match(historyBadgeSource, /History partial/)
  assert.match(historyBadgeSource, /Earlier raw history is unavailable for this legacy summarized session\./)
})

