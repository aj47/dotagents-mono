import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress scroll behavior", () => {
  it("pins the active session scroller in the same commit while streaming content grows", () => {
    expect(agentProgressSource).toContain("useLayoutEffect(() => {")
    expect(agentProgressSource).toContain("avoids a one-frame lag where new content renders above")
    expect(agentProgressSource).toContain("if (shouldAutoScroll) {\n        scrollToBottom(\"auto\")\n      }")
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
    expect(agentProgressSource).toContain("}, [shouldAutoScrollContent, visibleDisplayItems.length > 0])")
    expect(agentProgressSource).toContain("}, [clearPendingInitialScrollAttempts, scrollToBottom, shouldAutoScrollContent, visibleDisplayItems.length > 0])")
  })

  it("pins ACP sub-agent conversation updates without smooth-scroll lag while messages stream in", () => {
    expect(agentProgressSource).toContain("Keep ACP sub-agent conversation updates pinned in the same paint")
    expect(agentProgressSource).toContain("if (behavior === \"auto\") {\n      node.scrollTop = node.scrollHeight\n      return\n    }")
    expect(agentProgressSource).toContain("const hadNewMessages = conversation.length > previousConversationLengthRef.current")
    expect(agentProgressSource).toContain("scrollToBottom(\"auto\")")
  })
})