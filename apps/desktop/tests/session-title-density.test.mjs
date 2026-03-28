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
  assert.match(source, /onMouseDown=\{\(event\) => event\.stopPropagation\(\)\}/)
  assert.match(source, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/)
  assert.match(source, /transition-\[padding-right\] duration-200 group-hover:pr-20/)
  assert.match(source, /absolute right-1 top-1\/2 z-20 flex -translate-y-1\/2 items-center gap-0 rounded-sm pl-1 opacity-0 transition-opacity/)
  assert.match(source, /text-\[12px\] font-medium leading-4/)
  assert.match(source, /flex min-w-0 items-center gap-1\.5/
  )
  assert.doesNotMatch(source, /pr-11/)
  assert.doesNotMatch(source, /group-focus-within:pointer-events-auto/)
  assert.doesNotMatch(
    source,
    /title=\{conversationId \? "Rename session title" : title\}/,
  )
  assert.doesNotMatch(source, /startTitleEditing\(conversationId, title\)\s*\}/)
})

test("active session rows prioritize the title with a left-edge status rail", () => {
  const source = read(
    "apps/desktop/src/renderer/src/components/active-agents-sidebar.tsx",
  )

  assert.match(source, /absolute bottom-1 left-0 top-1 w-0\.5 rounded-full/)
  assert.match(source, /transition-\[padding-right\] duration-200 group-hover:pr-14/)
  assert.match(source, /absolute right-1\.5 top-1\/2 z-20 flex -translate-y-1\/2 items-center gap-1 rounded-sm pl-1 opacity-0 transition-opacity/)
  assert.match(source, /absolute right-1 top-1\/2 z-20 flex -translate-y-1\/2 items-center gap-0 rounded-sm pl-1 opacity-0 transition-opacity/)
  assert.match(source, /min-w-0 flex-1 truncate text-\[11px\] leading-4 text-muted-foreground/)
  assert.doesNotMatch(source, /h-1 w-1 shrink-0 rounded-full/)
  assert.doesNotMatch(
    source,
    /\(isFocused \|\| isSessionExpanded\) && "pointer-events-auto opacity-100"/,
  )
})

test("agent selector keeps agent names text-first without internal or ACP badges", () => {
  const source = read(
    "apps/desktop/src/renderer/src/components/agent-selector.tsx",
  )

  assert.doesNotMatch(source, />\s*Internal\s*</)
  assert.doesNotMatch(source, />\s*ACP\s*</)
})
