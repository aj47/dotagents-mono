import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionsSource = readFileSync(new URL("./sessions.tsx", import.meta.url), "utf8")

describe("sessions pending loading tile", () => {
  it("gives the pending continuation loading tile visible status copy instead of an anonymous skeleton", () => {
    expect(sessionsSource).toContain(
      'const PENDING_LOADING_TILE_STATUS_LABEL = "Opening conversation…"',
    )
    expect(sessionsSource).toContain(
      'const PENDING_LOADING_TILE_HELPER_TEXT =',
    )
    expect(sessionsSource).toContain('role="status"')
    expect(sessionsSource).toContain('aria-live="polite"')
    expect(sessionsSource).toContain('aria-label={PENDING_LOADING_TILE_STATUS_LABEL}')
    expect(sessionsSource).toContain(
      'className="border-border/60 flex min-w-0 items-start gap-3 border-b pb-3"',
    )
    expect(sessionsSource).toContain(
      'className="text-sm font-medium leading-snug break-words [overflow-wrap:anywhere]"',
    )
    expect(sessionsSource).toContain(
      'className="text-muted-foreground text-xs leading-relaxed break-words [overflow-wrap:anywhere]"',
    )
    expect(sessionsSource).toContain('aria-hidden="true"')
  })
})