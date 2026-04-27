import { beforeEach, describe, expect, it } from "vitest"

import {
  appendSessionUserResponse,
  clearSessionUserResponse,
  getSessionRunUserResponseEvents,
} from "./session-user-response-store"

describe("session-user-response-store", () => {
  beforeEach(() => {
    clearSessionUserResponse("session-dedupe")
  })

  it("dedupes only exact repeated response text for the same run", () => {
    const first = appendSessionUserResponse({
      sessionId: "session-dedupe",
      runId: 1,
      text: "Same response",
      timestamp: 1000,
    })

    const second = appendSessionUserResponse({
      sessionId: "session-dedupe",
      runId: 1,
      text: "Same response",
      timestamp: 2000,
    })

    expect(second).toEqual(first)
    expect(getSessionRunUserResponseEvents("session-dedupe", 1)).toHaveLength(1)
  })

  it("preserves formatting-only differences as separate response events", () => {
    appendSessionUserResponse({
      sessionId: "session-dedupe",
      runId: 1,
      text: "```ts\nconst x = 1;\n```",
      timestamp: 1000,
    })

    appendSessionUserResponse({
      sessionId: "session-dedupe",
      runId: 1,
      text: "```ts\nconst x = 1;\n``` ",
      timestamp: 2000,
    })

    const events = getSessionRunUserResponseEvents("session-dedupe", 1)
    expect(events).toHaveLength(2)
    expect(events[0]?.text).toBe("```ts\nconst x = 1;\n```")
    expect(events[1]?.text).toBe("```ts\nconst x = 1;\n``` ")
  })
})
