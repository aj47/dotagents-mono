import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const repoRoot = path.resolve(process.cwd())

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8")
}

test("session tiles allow selecting title and footer text without triggering tile focus", () => {
  const source = read("apps/desktop/src/renderer/src/components/session-tile.tsx")

  assert.match(source, /function hasActiveTextSelection\(container\?: HTMLElement \| null\): boolean \{/)
  assert.match(source, /onClick=\{handleTileClick\}/)
  assert.match(source, /hasActiveTextSelection\(event\.currentTarget\)/)
  assert.match(source, /className="markdown-selectable flex-1 truncate font-medium text-sm"/)
  assert.match(source, /className="markdown-selectable px-3 py-2 border-t bg-muted\/20 text-xs text-muted-foreground flex-shrink-0 flex items-center gap-2"/)
})
