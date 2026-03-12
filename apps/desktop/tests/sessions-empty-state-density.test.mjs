import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const sessionsSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/sessions.tsx'),
  'utf8',
)

test('desktop sessions empty state trims decorative chrome and keeps the selector compact', () => {
  assert.doesNotMatch(sessionsSource, /rounded-full bg-muted p-4/)
  assert.match(sessionsSource, /flex w-full flex-col items-center px-5 py-6 text-center sm:px-6/)
  assert.match(sessionsSource, /mb-3 rounded-full bg-muted\/70 p-2\.5/)
  assert.match(sessionsSource, /MessageCircle className="h-5 w-5 text-muted-foreground"/)
  assert.match(sessionsSource, /mb-5 max-w-sm text-sm leading-relaxed text-muted-foreground/)
  assert.match(sessionsSource, /<AgentSelector[\s\S]*?onSelectAgent=\{onSelectAgent\}[\s\S]*?compact/)
})

test('desktop sessions empty state keeps secondary controls and recent sessions tighter', () => {
  assert.match(sessionsSource, /<PredefinedPromptsMenu onSelectPrompt=\{onSelectPrompt\} buttonSize="sm" \/>/)
  assert.match(sessionsSource, /Scan QR Code/)
  assert.match(sessionsSource, /flex flex-wrap items-center justify-center gap-2\.5 text-xs text-muted-foreground/)
  assert.match(sessionsSource, /mt-6 w-full max-w-md text-left/)
})

test('desktop sessions empty state recent list supports pinning and pinned-first ordering', () => {
  assert.match(sessionsSource, /orderConversationHistoryByPinnedFirst/)
  assert.match(sessionsSource, /sortedRecentSessions\.slice\(0, RECENT_SESSIONS_LIMIT\)/)
  assert.match(sessionsSource, /aria-label=\{`\$\{isPinned \? "Unpin" : "Pin"\} \$\{session\.title\}`\}/)
  assert.match(sessionsSource, /onKeyDown=\{stopSessionRowKeyPropagation\}/)
})

test('desktop sessions home switches between conversation history and connection guidance', () => {
  assert.match(sessionsSource, /Conversation History/)
  assert.match(sessionsSource, /Connection Info/)
  assert.match(sessionsSource, /Use the cog for deeper settings\./)
  assert.match(sessionsSource, /<ConnectionPairingDialog/)
})