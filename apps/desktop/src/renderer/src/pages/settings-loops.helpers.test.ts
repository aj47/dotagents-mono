import { describe, expect, it } from "vitest"
import {
  formatFailureSummary,
  formatLoopIntervalDraft,
  getLoopEnabledLabel,
  getLoopFailureHeadline,
  parseLoopIntervalDraft,
} from "./settings-loops.helpers"

describe("repeat-task page helpers", () => {
  it("keeps interval drafts empty-safe for backspace editing", () => {
    expect(formatLoopIntervalDraft(15)).toBe("15")
    expect(parseLoopIntervalDraft("")).toBeNull()
    expect(parseLoopIntervalDraft("5")).toBe(5)
  })

  it("rejects invalid interval drafts instead of silently coercing them", () => {
    expect(parseLoopIntervalDraft("0")).toBeNull()
    expect(parseLoopIntervalDraft("1.5")).toBeNull()
    expect(parseLoopIntervalDraft("abc")).toBeNull()
  })

  it("formats auto-paused failure copy for the task card", () => {
    expect(getLoopFailureHeadline({
      autoPausedAt: 1774247285000,
      consecutiveFailures: 3,
    })).toBe("Auto-paused after 3 consecutive failed automatic runs")
    expect(getLoopEnabledLabel({
      enabled: false,
      autoPausedAt: 1774247285000,
    })).toBe("Auto-paused")
    expect(formatFailureSummary("OpenAI API key is missing.")).toBe("OpenAI API key is missing.")
  })
})
