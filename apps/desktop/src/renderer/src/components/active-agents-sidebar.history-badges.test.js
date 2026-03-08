import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sidebarSource = fs.readFileSync(path.join(__dirname, 'active-agents-sidebar.tsx'), 'utf8')

test('active agents sidebar reuses the shared history provenance badge helper', () => {
  assert.match(sidebarSource, /import \{ Badge \} from "@renderer\/components\/ui\/badge"/)
  assert.match(sidebarSource, /import \{ getConversationHistoryBadge \} from "@renderer\/lib\/conversation-history-badges"/)
  assert.match(sidebarSource, /historyItem\?: ConversationHistoryItem/)
  assert.match(sidebarSource, /const historyBadge = historyItem\s*\?\s*getConversationHistoryBadge\(historyItem\)\s*:\s*null/)
  assert.match(sidebarSource, /title=\{historyBadge\.title\}/)
  assert.match(sidebarSource, /\{historyBadge\.label\}/)
})

test('recent runtime sessions inherit persisted history provenance when conversation ids match', () => {
  assert.match(sidebarSource, /const conversationHistoryById = useMemo\(/)
  assert.match(sidebarSource, /conversationHistoryById\.get\(session\.conversationId\)/)
  assert.match(sidebarSource, /addPastSession\(\s*session,\s*"recent",/)
  assert.match(sidebarSource, /addPastSession\(mappedSession, "history", historyItem\)/)
})