import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const memoriesSource = readFileSync(new URL("./memories.tsx", import.meta.url), "utf8")

describe("memories page layout", () => {
  it("wraps the bulk actions bar safely and keeps its selection summary aligned with the visible list", () => {
    expect(memoriesSource).toContain("const hasVisibleSelections = visibleSelectedCount > 0")
    expect(memoriesSource).toContain(
      'const selectionSummaryLabel = hasVisibleSelections ? `${visibleSelectedCount} selected` : "Select all"',
    )
    expect(memoriesSource).toContain(
      'className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"',
    )
    expect(memoriesSource).toContain(
      'aria-label={allSelected ? "Deselect all visible memories" : "Select all visible memories"}',
    )
    expect(memoriesSource).toContain(
      'className="min-w-0 flex-1 text-sm text-muted-foreground break-words [overflow-wrap:anywhere]"',
    )
    expect(memoriesSource).toContain(
      'className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2"',
    )
    expect(memoriesSource).toContain("Delete Selected ({visibleSelectedCount})")
  })
})