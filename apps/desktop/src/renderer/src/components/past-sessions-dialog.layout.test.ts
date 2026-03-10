import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const pastSessionsDialogSource = readFileSync(
  new URL("./past-sessions-dialog.tsx", import.meta.url),
  "utf8",
)

describe("past sessions dialog layout", () => {
  it("keeps the toolbar and session rows usable under narrow widths", () => {
    expect(pastSessionsDialogSource).toContain(
      'className="flex shrink-0 flex-wrap items-center gap-2"',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="relative min-w-0 flex-1"',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="flex flex-wrap items-start gap-2"',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="min-w-0 flex-1 truncate font-medium"',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed break-words [overflow-wrap:anywhere]"',
    )
  })

  it("wraps delete-all confirmation actions instead of clipping them under zoom", () => {
    expect(pastSessionsDialogSource).toContain(
      'className="flex flex-wrap items-center justify-end gap-2"',
    )
  })

  it("keeps per-session row actions keyboard-accessible", () => {
    expect(pastSessionsDialogSource).toContain(
      'focus-visible:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="ml-auto grid shrink-0 place-items-center self-start"',
    )
    expect(pastSessionsDialogSource).toContain(
      'group-hover:opacity-0 group-focus-within:opacity-0',
    )
    expect(pastSessionsDialogSource).toContain(
      'group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto',
    )
    expect(pastSessionsDialogSource).toContain(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
    )
    expect(pastSessionsDialogSource).toContain('aria-label={`Delete ${session.title}`}')
  })

  it("includes a keyboard-accessible pin action and pinned-first sort for past sessions", () => {
    expect(pastSessionsDialogSource).toContain("orderConversationHistoryByPinnedFirst")
    expect(pastSessionsDialogSource).toContain("return orderConversationHistoryByPinnedFirst(filteredSessions, pinnedSessionIds)")
    expect(pastSessionsDialogSource).toContain('aria-label={`${isPinned ? "Unpin" : "Pin"} ${session.title}`}')
    expect(pastSessionsDialogSource).toContain('onKeyDown={stopSessionRowKeyPropagation}')
  })
})