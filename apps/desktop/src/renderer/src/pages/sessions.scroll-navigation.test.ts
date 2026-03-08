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

  it("recenters the active tile when single view changes so maximize and pager transitions do not inherit stale scroll positions", () => {
    expectSourceToContain("useEffect(() => {")
    expectSourceToContain(
      "if (!isFocusLayout || !maximizedSessionId) return",
    )
    expectSourceToContain("scrollSessionTileIntoView(maximizedSessionId)")
    expectSourceToContain(
      "}, [isFocusLayout, maximizedSessionId, scrollSessionTileIntoView])",
    )
    expectSourceToContain("ref={(el) => setSessionRef(pendingSessionId, el)}")
  })

  it("recenters and re-identifies the last focused tile when leaving single view so restore does not feel like a blind jump back to the grid", () => {
    expectSourceToContain(
      "const [recentSingleViewRestoreFeedback, setRecentSingleViewRestoreFeedback] =",
    )
    expectSourceToContain(
      "const previousIsFocusLayoutRef = useRef(isFocusLayout)",
    )
    expectSourceToContain(
      "const latestSingleViewSessionIdRef = useRef<string | null>(null)",
    )
    expectSourceToContain(
      "latestSingleViewSessionIdRef.current = maximizedSessionId",
    )
    expectSourceToContain("const wasFocusLayout = previousIsFocusLayoutRef.current")
    expectSourceToContain("previousIsFocusLayoutRef.current = isFocusLayout")
    expectSourceToContain("if (!wasFocusLayout || isFocusLayout) return")
    expectSourceToContain("const restoredSessionId =")
    expectSourceToContain("scrollSessionTileIntoView(restoredSessionId)")
    expectSourceToContain("setRecentSingleViewRestoreFeedback({")
    expectSourceToContain(
      "announcement: getSingleViewRestoreAnnouncementLabel({",
    )
    expectSourceToContain(
      'role="status" aria-live="polite" aria-atomic="true"',
    )
  })

  it("recenters keyboard-moved tiles after reorder so the grabbed session stays anchored in view", () => {
    expectSourceToContain("const handleKeyboardReorder = useCallback(")
    expectSourceToContain("setSessionOrder(nextOrder)")
    expectSourceToContain("captureSessionReorderFeedback(sessionId, nextOrder)")
    expectSourceToContain("scrollSessionTileIntoView(sessionId)")
    expectSourceToContain(
      "}, [captureSessionReorderFeedback, currentSessionOrder, scrollSessionTileIntoView])",
    )
  })

  it("keeps the focused tile anchored when switching between compare and grid so non-single layout changes do not feel like a blind reflow", () => {
    expectSourceToContain(
      "const previousTileLayoutModeRef = useRef(tileLayoutMode)",
    )
    expectSourceToContain("const previousTileLayoutMode = previousTileLayoutModeRef.current")
    expectSourceToContain("previousTileLayoutModeRef.current = tileLayoutMode")
    expectSourceToContain(
      'previousTileLayoutMode === tileLayoutMode ||\n      previousTileLayoutMode === "1x1" ||\n      tileLayoutMode === "1x1"',
    )
    expectSourceToContain("!focusedSessionId")
    expectSourceToContain("!focusableSessionIds.includes(focusedSessionId)")
    expectSourceToContain("scrollSessionTileIntoView(focusedSessionId)")
    expectSourceToContain(
      "}, [\n    focusableSessionIds,\n    focusedSessionId,\n    scrollSessionTileIntoView,\n    tileLayoutMode,\n  ])",
    )
  })
})
