import { describe, expect, it } from "vitest"

import {
  extractLatestReusableSelectorRef,
  getToolRetryHeuristic,
} from "./tool-retry-heuristics"

describe("tool retry heuristics", () => {
  it("blocks blind auto-retries for selector timeouts and suggests a snapshot", () => {
    expect(getToolRetryHeuristic(
      {
        name: "browser:click",
        arguments: { selector: "@e59" },
      } as any,
      {
        isError: true,
        content: [{ type: "text", text: 'Timeout: @e59 is blocked, still loading, or not interactable.' }],
      } as any,
    )).toEqual({
      shouldAutoRetry: false,
      recoveryMessage: "Browser interaction using @e59 failed. Do not retry the same selector blindly. Take a fresh browser snapshot before the next browser tool call, and only reuse @e59 if the refreshed page confirms it is still valid.",
    })
  })

  it("does not auto-retry unsupported selector token failures", () => {
    expect(getToolRetryHeuristic(
      {
        name: "browser:click",
        arguments: { selector: "@e91" },
      } as any,
      {
        isError: true,
        content: [{ type: "text", text: 'Unsupported token "@e91" while parsing css selector' }],
      } as any,
    )).toEqual({
      shouldAutoRetry: false,
      recoveryMessage: "Browser interaction using @e91 failed. Do not retry the same selector blindly. Take a fresh browser snapshot before the next browser tool call, and only reuse @e91 if the refreshed page confirms it is still valid.",
    })
  })

  it("keeps infrastructure failures retryable", () => {
    expect(getToolRetryHeuristic(
      {
        name: "filesystem:read_file",
        arguments: { path: "/tmp/demo.txt" },
      } as any,
      {
        isError: true,
        content: [{ type: "text", text: "Connection reset by peer while calling remote server" }],
      } as any,
    )).toEqual({
      shouldAutoRetry: true,
    })
  })

  it("ignores selectors that only appear in error or recovery messages", () => {
    const history = [
      { role: "assistant", content: "The submit button is @e41." },
      { role: "tool", content: "[browser:click] ERROR: Timeout while clicking @e59." },
      { role: "user", content: "Browser interaction using @e59 failed. Do not retry the same selector blindly. Take a fresh browser snapshot before the next browser tool call, and only reuse @e59 if the refreshed page confirms it is still valid.", ephemeral: true },
    ] as const

    expect(extractLatestReusableSelectorRef(history as any, 0)).toBe("@e41")
  })
})
