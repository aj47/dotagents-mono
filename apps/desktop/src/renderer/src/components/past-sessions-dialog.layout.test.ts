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
      'className="flex flex-wrap items-start gap-2"',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="min-w-0 flex-1 truncate font-medium"',
    )
  })

  it("keeps per-session delete affordances keyboard-accessible", () => {
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
      'focus-visible:opacity-100 focus-visible:pointer-events-auto group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto',
    )
    expect(pastSessionsDialogSource).toContain('aria-label={`Delete ${session.title}`}')
  })
})