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

  it("gives long memory titles a compact multiline fallback next to the importance badge", () => {
    expect(memoriesSource).toContain(
      'className="mb-1 flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1"',
    )
    expect(memoriesSource).toContain(
      'className="min-w-0 flex-1 text-sm font-medium leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]"',
    )
    expect(memoriesSource).toContain(
      'className={cn("shrink-0 text-[10px] px-1.5 py-0", importanceColors[memory.importance])}',
    )
  })

  it("gives per-memory icon controls full-size affordances and explicit labels", () => {
    expect(memoriesSource).toContain(
      'className="mt-0.5 h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"',
    )
    expect(memoriesSource).toContain(
      'aria-label={isSelected ? `Deselect memory: ${memory.title}` : `Select memory: ${memory.title}`}',
    )
    expect(memoriesSource).toContain('aria-pressed={isSelected}')
    expect(memoriesSource).toContain(
      'aria-label={isExpanded ? `Collapse memory: ${memory.title}` : `Expand memory: ${memory.title}`}',
    )
    expect(memoriesSource).toContain('aria-expanded={isExpanded}')
    expect(memoriesSource).toContain('aria-label={`Edit memory: ${memory.title}`}')
    expect(memoriesSource).toContain('aria-label={`Delete memory: ${memory.title}`}')
  })

  it("shows a dedicated error state with retry instead of falling through to the empty list copy", () => {
    expect(memoriesSource).toContain(") : memoriesQuery.isError ? (")
    expect(memoriesSource).toContain("Couldn't load memories")
    expect(memoriesSource).toContain("Retry loading memories")
    expect(memoriesSource).toContain('onClick={() => void memoriesQuery.refetch()}')
    expect(memoriesSource).toContain('disabled={memoriesQuery.isFetching}')
  })
})