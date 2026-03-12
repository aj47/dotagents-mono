import { describe, expect, it } from "vitest"

import {
  extractRespondToUserContentFromArgs,
  getLatestRespondToUserContentFromConversationHistory,
  getLatestRespondToUserContentFromToolCalls,
  resolveLatestUserFacingResponse,
} from "./respond-to-user-utils"

describe("respond-to-user-utils", () => {
  it("extracts text and image markdown from respond_to_user args", () => {
    expect(extractRespondToUserContentFromArgs({
      text: "Done",
      images: [{ alt: "Preview", path: "/tmp/result.png" }],
    })).toBe("Done\n\n![Preview](/tmp/result.png)")
  })

  it("returns the latest respond_to_user content from tool calls", () => {
    expect(getLatestRespondToUserContentFromToolCalls([
      { name: "web_search", arguments: { query: "ignore" } },
      { name: "respond_to_user", arguments: { text: "First update" } },
      { name: "respond_to_user", arguments: { text: "Final answer" } },
    ])).toBe("Final answer")
  })

  it("falls back to the latest respond_to_user entry in conversation history", () => {
    expect(getLatestRespondToUserContentFromConversationHistory([
      { role: "assistant", toolCalls: [{ name: "respond_to_user", arguments: { text: "Earlier" } }] },
      { role: "tool", toolCalls: [{ name: "respond_to_user", arguments: { text: "Ignored" } }] },
      { role: "assistant", toolCalls: [{ name: "respond_to_user", arguments: { text: "Latest" } }] },
    ])).toBe("Latest")
  })

  it("prefers the current iteration's planned respond_to_user over a stale stored response", () => {
    expect(resolveLatestUserFacingResponse({
      storedResponse: "Stale answer",
      plannedToolCalls: [{ name: "respond_to_user", arguments: { text: "Fresh answer" } }],
      conversationHistory: [{ role: "assistant", toolCalls: [{ name: "respond_to_user", arguments: { text: "Older history" } }] }],
    })).toBe("Fresh answer")
  })

  it("uses the stored response before falling back to history", () => {
    expect(resolveLatestUserFacingResponse({
      storedResponse: "Stored answer",
      conversationHistory: [{ role: "assistant", toolCalls: [{ name: "respond_to_user", arguments: { text: "History answer" } }] }],
    })).toBe("Stored answer")
  })
})