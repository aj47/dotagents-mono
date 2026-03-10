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
  assert.match(sessionsSource, /flex flex-wrap items-center justify-center gap-2\.5 text-xs text-muted-foreground/)
  assert.match(sessionsSource, /mt-6 w-full max-w-xl text-left/)
  assert.match(sessionsSource, /group flex w-full items-center gap-1\.5 rounded-md px-1\.5 py-1 text-sm text-left transition-colors/)
})

test('desktop sessions empty state recent list supports pinning and pinned-first ordering', () => {
  assert.match(sessionsSource, /orderConversationHistoryByPinnedFirst/)
  assert.match(sessionsSource, /sortedRecentSessions\.slice\(0, RECENT_SESSIONS_LIMIT\)/)
  assert.match(sessionsSource, /aria-label=\{`\$\{isPinned \? "Unpin" : "Pin"\} \$\{session\.title\}`\}/)
  assert.match(sessionsSource, /onKeyDown=\{stopSessionRowKeyPropagation\}/)
  assert.match(sessionsSource, /group-hover:w-5 group-hover:opacity-100 group-focus-within:mr-1 group-focus-within:w-5 group-focus-within:opacity-100/)
  assert.match(sessionsSource, /pointer-events-none rounded p-0\.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground[\s\S]*group-hover:pointer-events-auto group-focus-within:pointer-events-auto/)
})