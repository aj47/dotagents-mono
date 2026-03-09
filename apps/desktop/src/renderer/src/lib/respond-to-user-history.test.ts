import { describe, expect, it } from "vitest"
import { extractRespondToUserResponsesFromMessages } from "./respond-to-user-history"

const RESPOND_TO_USER_TOOL = "respond_to_user"

describe("respond-to-user history", () => {
  it("does not reuse a previous turn's respond_to_user content after a follow-up user message", () => {
    const responses = extractRespondToUserResponsesFromMessages([
      { role: "user" },
      {
        role: "assistant",
        toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: "Old answer" } }],
      },
      { role: "user" },
    ])

    expect(responses).toEqual([])
  })

  it("keeps multiple respond_to_user updates from the current turn", () => {
    const responses = extractRespondToUserResponsesFromMessages([
      { role: "user" },
      {
        role: "assistant",
        toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: "First answer" } }],
      },
      {
        role: "assistant",
        toolCalls: [{ name: RESPOND_TO_USER_TOOL, arguments: { text: "Second answer" } }],
      },
    ])

    expect(responses).toEqual(["First answer", "Second answer"])
  })
})