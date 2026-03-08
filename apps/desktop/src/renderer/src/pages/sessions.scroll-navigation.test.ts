import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionsSource = readFileSync(
  new URL("./sessions.tsx", import.meta.url),
  "utf8",
)
const compactSessionsSource = sessionsSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactSessionsSource).toContain(fragment.replace(/\s+/g, ""))
}

function expectSourceNotToContain(fragment: string) {
  expect(compactSessionsSource).not.toContain(fragment.replace(/\s+/g, ""))
}

describe("sessions scroll navigation", () => {
  it("coalesces pending session-tile scroll requests onto requestAnimationFrame instead of leaving delayed smooth-scroll timers behind", () => {
    expectSourceToContain(
      "const pendingSessionScrollRafRef = useRef<number | null>(null)",
    )
    expectSourceToContain(
      "const clearPendingSessionScroll = useCallback(() => {",
    )
    expectSourceToContain(
      "cancelAnimationFrame(pendingSessionScrollRafRef.current)",
    )
    expectSourceToContain("let remainingAnimationFrameAttempts = 3")
    expectSourceToContain(
      "pendingSessionScrollRafRef.current = requestAnimationFrame(",
    )
    expectSourceNotToContain(
      "setTimeout(() => { sessionRefs.current[targetSessionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })",
    )
  })

  it("uses an immediate scrollIntoView path for route, sidebar, and continue-session navigation so manual scrolling is not yanked later", () => {
    expectSourceToContain(
      'targetTile.scrollIntoView({ behavior: "auto", block: "center" })',
    )
    expectSourceToContain("scrollSessionTileIntoView(activeSession[0])")
    expectSourceToContain(
      "scrollSessionTileIntoView(scrollToSessionId, { clearScrollRequest: true })",
    )
    expectSourceToContain("scrollSessionTileIntoView(existingSession[0])")
    expectSourceNotToContain(
      "scrollIntoView({ behavior: 'smooth', block: 'center' })",
    )
  })
})
