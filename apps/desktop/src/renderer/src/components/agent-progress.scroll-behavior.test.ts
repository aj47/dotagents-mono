import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress scroll behavior", () => {
  it("pins the active session scroller in the same commit while streaming content grows", () => {
    expect(agentProgressSource).toContain("useLayoutEffect(() => {")
    expect(agentProgressSource).toContain("avoids a one-frame lag where new content renders above")
    expect(agentProgressSource).toContain("if (shouldAutoScroll) {\n        scrollToBottom()\n      }")
  })

  it("cancels delayed initial auto-scroll retries once the user scrolls away from bottom", () => {
    expect(agentProgressSource).toContain("const pendingInitialScrollTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])")
    expect(agentProgressSource).toContain("const clearPendingInitialScrollAttempts = useCallback(() => {")
    expect(agentProgressSource).toContain("pendingInitialScrollTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))")
    expect(agentProgressSource).toContain("if (!shouldAutoScrollRef.current) return")
    expect(agentProgressSource).toContain("clearPendingInitialScrollAttempts()")
  })

  it("keeps retry timers in sync with the current auto-scroll mode and session lifecycle", () => {
    expect(agentProgressSource).toContain("shouldAutoScrollRef.current = shouldAutoScroll")
    expect(agentProgressSource).toContain("return clearPendingInitialScrollAttempts")
    expect(agentProgressSource).toContain("}, [clearPendingInitialScrollAttempts, progress?.sessionId])")
    expect(agentProgressSource).toContain("}, [clearPendingInitialScrollAttempts, displayItems.length > 0])")
  })

  it("snaps shared session scrolling back to the live stream once the user returns near bottom", () => {
    expect(agentProgressSource).toContain("const BOTTOM_PIN_TOLERANCE_PX = 24")
    expect(agentProgressSource).toContain("const isAtBottom = distanceFromBottom <= BOTTOM_PIN_TOLERANCE_PX")
    expect(agentProgressSource).toContain("scrollContainer.scrollTop = scrollContainer.scrollHeight")
    expect(agentProgressSource).toContain("the very next chunk reopens a much")
  })

  it("pins ACP sub-agent conversation updates without smooth-scroll lag while messages stream in", () => {
    expect(agentProgressSource).toContain("Keep ACP sub-agent conversation updates pinned in the same paint")
    expect(agentProgressSource).toContain("if (behavior === \"auto\") {\n      node.scrollTop = node.scrollHeight\n      return\n    }")
    expect(agentProgressSource).toContain("const hadNewMessages = conversation.length > previousConversationLengthRef.current")
    expect(agentProgressSource).toContain("scrollToBottom(\"auto\")")
  })

  it("snaps the ACP Latest button back to bottom immediately instead of animating recovery", () => {
    expect(agentProgressSource).toContain("Recover to the latest delegated message immediately")
    expect(agentProgressSource).toContain("setIsPinnedToBottom(true)")
    expect(agentProgressSource).toContain("scrollToBottom(\"auto\")")
    expect(agentProgressSource).not.toContain("setIsPinnedToBottom(true)\n                scrollToBottom(\"smooth\")")
  })
})