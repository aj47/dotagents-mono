import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress scroll behavior", () => {
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
})