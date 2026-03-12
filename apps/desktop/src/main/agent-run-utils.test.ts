import { describe, expect, it } from "vitest"

import { getPreferredDelegationOutput } from "./agent-run-utils"

describe("getPreferredDelegationOutput", () => {
  it("prefers delegated respond_to_user content over assistant placeholder text", () => {
    expect(getPreferredDelegationOutput("", [
      {
        role: "assistant",
        content: "Working on it...",
        toolCalls: [{ name: "respond_to_user", arguments: { text: "Final delegated answer" } }],
      },
    ])).toBe("Final delegated answer")
  })

  it("falls back to the latest assistant message when no explicit user response exists", () => {
    expect(getPreferredDelegationOutput("raw tool output", [
      { role: "assistant", content: "Assistant summary" },
    ])).toBe("Assistant summary")
  })
})