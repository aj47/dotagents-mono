import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8")
}

test("conversation service exposes rename + auto-title helpers", () => {
  const source = read("apps/desktop/src/main/conversation-service.ts")

  assert.match(source, /async renameConversationTitle\(/)
  assert.match(source, /async maybeAutoGenerateConversationTitle\(/)
  assert.match(source, /Generate a short session title for this conversation\./)
  assert.match(source, /MAX_AGENT_SESSION_TITLE_WORDS = 10/)
})

test("runtime tool surface exposes set_session_title", () => {
  const definitions = read("apps/desktop/src/main/runtime-tool-definitions.ts")
  const handlers = read("apps/desktop/src/main/runtime-tools.ts")

  assert.match(definitions, /name: "set_session_title"/)
  assert.match(handlers, /set_session_title: async/)
  assert.match(handlers, /conversationService\.renameConversationTitle\(/)
})

test("sidebar keeps session renaming behind an explicit overflow action and persists edits", () => {
  const source = read(
    "apps/desktop/src/renderer/src/components/active-agents-sidebar.tsx",
  )

  assert.match(source, /aria-label="Rename session title"/)
  assert.match(source, /tipcClient\.renameConversationTitle\(/)
  assert.match(source, /event\.key === "Enter"/)
  assert.match(source, /event\.key === "Escape"/)
  assert.match(source, /SessionOverflowMenu/)
  assert.match(source, /<MoreHorizontal className="h-3 w-3" \/>/)
  assert.match(source, /<DropdownMenuItem onSelect=\{\(\) => onRename\(\)\}>/)
  assert.match(source, /group-focus-within:opacity-100/)
  assert.doesNotMatch(
    source,
    /title=\{conversationId \? "Rename session title" : title\}/,
  )
  assert.doesNotMatch(source, /startTitleEditing\(conversationId, title\)\s*\}/)
})

test("agent selector keeps agent names text-first without internal or ACP badges", () => {
  const source = read(
    "apps/desktop/src/renderer/src/components/agent-selector.tsx",
  )

  assert.doesNotMatch(source, />\s*Internal\s*</)
  assert.doesNotMatch(source, />\s*ACP\s*</)
})
