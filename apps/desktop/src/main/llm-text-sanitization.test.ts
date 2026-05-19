import { describe, expect, it } from "vitest"
import {
  sanitizeMessagesForLlmTransport,
  sanitizeTextForLlmTransport,
} from "./llm-text-sanitization"

describe("LLM text transport sanitization", () => {
  it("preserves valid surrogate pairs", () => {
    const value = "status: \uD83D\uDE80"

    expect(sanitizeTextForLlmTransport(value)).toBe(value)
  })

  it("replaces dangling high surrogates", () => {
    expect(sanitizeTextForLlmTransport("LinkedIn link \uD83D\nContext ref")).toBe(
      "LinkedIn link \uFFFD\nContext ref",
    )
  })

  it("replaces dangling low surrogates", () => {
    expect(sanitizeTextForLlmTransport("bad \uDC00 text")).toBe("bad \uFFFD text")
  })

  it("returns the same message array when no transport cleanup is needed", () => {
    const messages = [{ role: "user", content: "plain text" }]

    expect(sanitizeMessagesForLlmTransport(messages)).toBe(messages)
  })

  it("sanitizes only affected message content", () => {
    const messages = [
      { role: "system", content: "system" },
      { role: "user", content: "broken \uD83D" },
    ]

    const sanitized = sanitizeMessagesForLlmTransport(messages)

    expect(sanitized).not.toBe(messages)
    expect(sanitized[0]).toBe(messages[0])
    expect(sanitized[1]).toEqual({ role: "user", content: "broken \uFFFD" })
  })
})
