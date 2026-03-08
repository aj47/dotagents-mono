import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const agentProgressSource = fs.readFileSync(path.join(__dirname, 'agent-progress.tsx'), 'utf8')
const sessionsSource = fs.readFileSync(path.join(__dirname, '..', 'pages', 'sessions.tsx'), 'utf8')
const sharedTypesSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'shared', 'types.ts'), 'utf8')

test('AgentProgressUpdate carries preserved full-history metadata', () => {
  assert.match(sharedTypesSource, /fullConversationHistory\?: Array<\{/)
  assert.match(sharedTypesSource, /conversationCompaction\?: ConversationCompactionMetadata/)
})

test('pending past sessions forward raw history and compaction data into progress', () => {
  assert.match(sessionsSource, /fullConversationHistory: conv\.rawMessages\?\.map\(mapConversationMessage\)/)
  assert.match(sessionsSource, /conversationCompaction: conv\.compaction/)
  assert.match(sessionsSource, /isSummary: message\.isSummary/)
})

test('tile transcript exposes a full-history toggle and legacy partial warning', () => {
  assert.match(agentProgressSource, /Show Full History/)
  assert.match(agentProgressSource, /Show Active Window/)
  assert.match(agentProgressSource, /currently represented by \$\{summaryBlockCount\} summary block/)
  assert.match(agentProgressSource, /Showing \$\{storedHistoryMessageCount \?\? representedHistoryMessageCount\} stored messages from disk\./)
  assert.match(agentProgressSource, /Showing full history from disk/)
  assert.match(agentProgressSource, /Active context window starts here\./)
  assert.match(agentProgressSource, /Earlier summarized history is unavailable for this legacy session\./)
})

test('live tiles lazily hydrate preserved history from disk when only summaries are in memory', () => {
  assert.match(agentProgressSource, /useConversationQuery/)
  assert.match(agentProgressSource, /storedConversationQuery\.data\?\.rawMessages\?\.map\(mapConversationMessageForProgress\)/)
  assert.match(agentProgressSource, /Checking for preserved full history on disk/)
  assert.match(agentProgressSource, /Couldn&apos;t load preserved full history from disk\./)
  assert.match(agentProgressSource, /storedConversationQuery\.refetch\(\)/)
})