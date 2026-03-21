import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('conversation service exposes rename + auto-title helpers', () => {
  const source = read('apps/desktop/src/main/conversation-service.ts')

  assert.match(source, /async renameConversationTitle\(/)
  assert.match(source, /async maybeAutoGenerateConversationTitle\(/)
  assert.match(source, /Generate a short session title for this conversation\./)
  assert.match(source, /MAX_AGENT_SESSION_TITLE_WORDS = 10/)
})

test('runtime tool surface exposes set_session_title', () => {
  const definitions = read('apps/desktop/src/main/runtime-tool-definitions.ts')
  const handlers = read('apps/desktop/src/main/runtime-tools.ts')

  assert.match(definitions, /name: "set_session_title"/)
  assert.match(handlers, /set_session_title: async/)
  assert.match(handlers, /conversationService\.renameConversationTitle\(/)
})

test('sidebar uses menu-driven session title editing', () => {
  const source = read('apps/desktop/src/renderer/src/components/active-agents-sidebar.tsx')

  assert.match(source, /<DropdownMenu>/)
  assert.match(source, /MoreHorizontal/)
  assert.match(source, /DropdownMenuItem/)
  assert.match(source, /renderSessionMenu/)
  assert.match(source, /tipcClient\.renameConversationTitle\(/)
  assert.match(source, /type="button"/)
  assert.match(source, /startTitleEditing\(conversationId, title\)/)
})
