import { describe, expect, it } from "vitest"

import {
  normalizeVerificationResultForCompletion,
  resolveIterationLimitFinalContent,
} from "./llm-continuation-guards"

describe("continuation guard helpers", () => {
  it("normalizes verifier output using explicit conversation states", () => {
    expect(normalizeVerificationResultForCompletion(
      { conversationState: "needs_input", isComplete: false, confidence: 0.92, missingItems: [" 2FA code ", ""] },
    )).toEqual(expect.objectContaining({
      conversationState: "needs_input",
      isComplete: true,
      missingItems: ["2FA code"],
    }))
  })

  it("falls back to complete when verifier only returns isComplete=true", () => {
    expect(normalizeVerificationResultForCompletion(
      { isComplete: true, confidence: 0.88, missingItems: [] },
    )).toEqual(expect.objectContaining({ isComplete: true }))
  })

  it("falls back to running when verifier output is incomplete", () => {
    expect(normalizeVerificationResultForCompletion(
      { reason: "More work remains", missingItems: ["summary"] },
    )).toEqual(expect.objectContaining({
      conversationState: "running",
      isComplete: false,
      missingItems: ["summary"],
    }))
  })

  it("prefers stored respond_to_user content at iteration limit", () => {
    expect(resolveIterationLimitFinalContent({
      finalContent: "",
      storedResponse: "Done! Two new iTerm windows are open.",
      conversationHistory: [{ role: "assistant", content: "Let me also check PR details." }],
      hasRecentErrors: false,
    })).toEqual({
      content: "Done! Two new iTerm windows are open.",
      usedExplicitUserResponse: true,
    })
  })

  it("falls back to the latest assistant content when no explicit user response exists", () => {
    expect(resolveIterationLimitFinalContent({
      finalContent: "",
      conversationHistory: [{ role: "assistant", content: "Latest assistant summary" }],
      hasRecentErrors: false,
    })).toEqual({
      content: "Latest assistant summary",
      usedExplicitUserResponse: false,
    })
  })

  it("ignores raw tool transcript final content and prefers a real assistant summary", () => {
    expect(resolveIterationLimitFinalContent({
      finalContent: '[execute_command] {"command":"pwd"}',
      conversationHistory: [{ role: "assistant", content: "I confirmed the working directory." }],
      hasRecentErrors: false,
    })).toEqual({
      content: "I confirmed the working directory.",
      usedExplicitUserResponse: false,
    })
  })

  it("does not surface progress-update text when iteration limit is reached", () => {
    expect(resolveIterationLimitFinalContent({
      finalContent: "Let me check one more thing.",
      conversationHistory: [{ role: "assistant", content: "I'll verify the final step." }],
      hasRecentErrors: false,
    })).toEqual({
      content: "Task reached maximum iteration limit while still in progress. Some actions may have been completed successfully - please review the tool results above.",
      usedExplicitUserResponse: false,
    })
  })
})