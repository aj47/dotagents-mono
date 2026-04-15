import { describe, expect, it } from "vitest"

import { buildModelReplayMessages } from "./model-replay"

describe("model-replay", () => {
  it("collapses split tool results into a single replay user message", () => {
    const replay = buildModelReplayMessages([
      {
        role: "user",
        content: "Inspect the repo",
      },
      {
        role: "assistant",
        content: "",
        toolCalls: [
          { name: "respond_to_user", arguments: { text: "Working on it" } },
          { name: "execute_command", arguments: { command: "pwd" } },
          { name: "execute_command", arguments: { command: "ls" } },
        ] as any,
      },
      {
        role: "tool",
        content: "",
        toolResults: [
          { isError: false, content: [{ type: "text", text: "ok" }] },
        ] as any,
      },
      {
        role: "tool",
        content: "",
        toolResults: [
          { isError: false, content: [{ type: "text", text: JSON.stringify({ success: true, command: "pwd", stdout: "/repo" }) }] },
        ] as any,
      },
      {
        role: "tool",
        content: "",
        toolResults: [
          { isError: false, content: [{ type: "text", text: JSON.stringify({ success: true, command: "ls", stdout: "file.ts" }) }] },
        ] as any,
      },
    ] as any)

    expect(replay).toHaveLength(2)
    expect(replay[0]).toEqual({ role: "user", content: "Inspect the repo" })
    expect(replay[1]?.role).toBe("user")
    expect(replay[1]?.content).toContain("[execute_command] command: pwd")
    expect(replay[1]?.content).toContain("[execute_command] command: ls")
    expect(replay[1]?.content).not.toContain("respond_to_user")
  })

  it("keeps internal nudges and omits skipModelReplay assistant entries", () => {
    const replay = buildModelReplayMessages([
      {
        role: "user",
        content: "real user",
      },
      {
        role: "user",
        content: "Please finish the parent task.",
      },
      {
        role: "assistant",
        content: "hidden assistant",
        skipModelReplay: true,
      },
      {
        role: "assistant",
        content: "visible assistant",
      },
    ] as any)

    expect(replay).toEqual([
      { role: "user", content: "real user" },
      { role: "user", content: "Please finish the parent task." },
      { role: "assistant", content: "visible assistant" },
    ])
  })

  it("adds the summary prompt on demand after the replay assistant tail", () => {
    const replay = buildModelReplayMessages([
      { role: "user", content: "Do the thing" },
      { role: "assistant", content: "Done." },
    ] as any, { addSummaryPrompt: true })

    expect(replay[2]).toEqual({
      role: "user",
      content: "Please provide a brief summary of what was accomplished.",
    })
  })
})
