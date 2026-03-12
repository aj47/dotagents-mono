import { describe, expect, it } from "vitest"

import {
  hasSelfAdmittedPartialCompletion,
  isDeliverableResponseContent,
  looksLikeToolCallPlaceholderContent,
  normalizeVerificationResultForCompletion,
  resolveIterationLimitFinalContent,
} from "./llm-continuation-guards"

describe("continuation guard helpers", () => {
  it("treats raw bracketed tool transcripts as non-deliverable", () => {
    expect(looksLikeToolCallPlaceholderContent('[execute_command] {"command":"pwd"}')).toBe(true)
    expect(isDeliverableResponseContent('[execute_command] {"command":"pwd"}')).toBe(false)
  })

  it("still allows normal final user-facing responses", () => {
    expect(isDeliverableResponseContent("I opened the folder and confirmed the file is there.")).toBe(true)
  })

  it("detects self-admitted partial completion language", () => {
    expect(hasSelfAdmittedPartialCompletion("Not fully, but it's pretty close. I still need to finish one part.")).toBe(true)
  })

  it("does not treat clarification or blocker requests as self-admitted partial completion", () => {
    expect(hasSelfAdmittedPartialCompletion("I still need your 2FA code before I can continue.")).toBe(false)
    expect(hasSelfAdmittedPartialCompletion("I still need to get your 2FA code before I can continue.")).toBe(false)
    expect(hasSelfAdmittedPartialCompletion("I still have to wait for your confirmation before I can continue.")).toBe(false)
  })

  it("overrides verifier false positives when the final response admits partial completion", () => {
    expect(normalizeVerificationResultForCompletion(
      { isComplete: true, confidence: 0.92, missingItems: [] },
      "Not fully, but it's pretty close. I still need to finish one part.",
    )).toEqual(expect.objectContaining({
      isComplete: false,
      reason: expect.stringContaining("partially complete"),
    }))
  })

  it("preserves legitimate blocked explanations as complete when they do not admit partial completion", () => {
    expect(normalizeVerificationResultForCompletion(
      { isComplete: true, confidence: 0.88, missingItems: [] },
      "I can't complete this without your 2FA code, so I need that from you before I can continue.",
    )).toEqual(expect.objectContaining({ isComplete: true }))
  })

  it("preserves verifier-complete results for clarification responses that use still-need phrasing", () => {
    expect(normalizeVerificationResultForCompletion(
      { isComplete: true, confidence: 0.88, missingItems: [] },
      "I still need to get your 2FA code before I can continue.",
    )).toEqual(expect.objectContaining({ isComplete: true }))
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
})