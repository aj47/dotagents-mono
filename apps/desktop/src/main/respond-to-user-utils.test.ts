import { extractRespondToUserContentFromArgs as extractSharedRespondToUserContentFromArgs } from "@dotagents/shared"
import { describe, expect, it } from "vitest"

import {
  extractRespondToUserContentFromArgs,
  getOrderedRespondToUserContentsFromToolCalls,
  getLatestRespondToUserContentFromConversationHistory,
  getUnmaterializedUserResponseEvents,
  resolveLatestUserFacingResponse,
} from "./respond-to-user-utils"

describe("respond-to-user-utils", () => {
  it("extracts text and image markdown from respond_to_user args", () => {
    expect(extractRespondToUserContentFromArgs({
      text: "Done",
      images: [{ alt: "Preview", path: "/tmp/result.png" }],
    })).toBe("Done\n\n![Preview](/tmp/result.png)")
  })

  it("extracts image markdown from respond_to_user images[].url", () => {
    expect(extractRespondToUserContentFromArgs({
      images: [{ alt: "Preview", url: "https://example.com/result.png" }],
    })).toBe("![Preview](https://example.com/result.png)")
  })

  it("keeps shared respond_to_user image URL extraction aligned", () => {
    expect(extractSharedRespondToUserContentFromArgs({
      images: [{ alt: "Preview", url: "https://example.com/result.png" }],
    })).toBe("![Preview](https://example.com/result.png)")
  })

  it("keeps shared legacy embedded-image extraction working", () => {
    expect(extractSharedRespondToUserContentFromArgs({
      images: [{ altText: "Preview", mimeType: "image/png", data: "ZmFrZQ==" }],
    })).toBe("![Preview](data:image/png;base64,ZmFrZQ==)")
  })

  it("falls back to the latest respond_to_user entry in conversation history", () => {
    expect(getLatestRespondToUserContentFromConversationHistory([
      { role: "assistant", toolCalls: [{ name: "respond_to_user", arguments: { text: "Earlier" } }] },
      { role: "tool", toolCalls: [{ name: "respond_to_user", arguments: { text: "Ignored" } }] },
      { role: "assistant", toolCalls: [{ name: "respond_to_user", arguments: { text: "Latest" } }] },
    ])).toBe("Latest")
  })

  it("can scope conversation-history fallback to the current turn", () => {
    expect(getLatestRespondToUserContentFromConversationHistory([
      { role: "assistant", toolCalls: [{ name: "respond_to_user", arguments: { text: "Earlier" } }] },
      { role: "assistant", toolCalls: [{ name: "respond_to_user", arguments: { text: "Current" } }] },
    ], 1)).toBe("Current")
  })

  it("uses the latest ordered response event as the visible answer", () => {
    const responseEvents = [
      { id: "evt-1", sessionId: "session-1", runId: 2, ordinal: 1, text: "Draft", timestamp: 1 },
      { id: "evt-2", sessionId: "session-1", runId: 2, ordinal: 2, text: "Final", timestamp: 2 },
    ]

    expect(resolveLatestUserFacingResponse({ responseEvents })).toBe("Final")
  })

  it("keeps all explicit respond_to_user messages in order for later turn context", () => {
    expect(getOrderedRespondToUserContentsFromToolCalls([
      { name: "respond_to_user", arguments: { text: "1. First option\n2. Second option" } },
      { name: "web_search", arguments: { query: "ignored" } },
      { name: "respond_to_user", arguments: { text: "Please reply with the numbers you want." } },
    ])).toEqual([
      "1. First option\n2. Second option",
      "Please reply with the numbers you want.",
    ])
  })

  it("returns every unmaterialized response event instead of only the latest one", () => {
    const responseEvents = [
      { id: "evt-1", sessionId: "session-1", runId: 5, ordinal: 1, text: "1. First option", timestamp: 10 },
      { id: "evt-2", sessionId: "session-1", runId: 5, ordinal: 2, text: "Please reply with the numbers you want.", timestamp: 11 },
    ]

    expect(getUnmaterializedUserResponseEvents(responseEvents, [])).toEqual(responseEvents)
    expect(getUnmaterializedUserResponseEvents(responseEvents, ["evt-1"])).toEqual([responseEvents[1]])
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

  it("prefers current-run response events over prior-turn history", () => {
    expect(resolveLatestUserFacingResponse({
      responseEvents: [{ id: "evt-2", sessionId: "session-1", runId: 3, ordinal: 1, text: "Current run", timestamp: 2 }],
      conversationHistory: [{ role: "assistant", toolCalls: [{ name: "respond_to_user", arguments: { text: "Older history" } }] }],
      sinceIndex: 1,
    })).toBe("Current run")
  })
})
