import { describe, expect, it } from "vitest"

import { getLowContextPromptGuardResponse } from "./agent-low-context-guard"

describe("agent-low-context-guard", () => {
  it("acknowledges short pause requests even when there is conversation history", () => {
    expect(getLowContextPromptGuardResponse("i actually have to hold on this for now", true)).toEqual(
      expect.objectContaining({
        response: expect.stringContaining("pause this for now"),
      }),
    )
  })

  it("returns a clarification response for bare next-step prompts without history", () => {
    expect(getLowContextPromptGuardResponse("What should I do next?", false)).toEqual(
      expect.objectContaining({
        response: expect.stringContaining("I need a bit more context before I can suggest the next step."),
      }),
    )
  })

  it("returns a clarification response for bare continue prompts without history", () => {
    expect(getLowContextPromptGuardResponse("continue", false)).toEqual(
      expect.objectContaining({
        response: expect.stringContaining("I don’t have enough context to continue yet."),
      }),
    )
  })

  it("does not trigger once there is conversation history", () => {
    expect(getLowContextPromptGuardResponse("What should I do next?", true)).toBeNull()
  })

  it("asks for clarification on fragmentary follow-ups that repeat recent user context", () => {
    expect(
      getLowContextPromptGuardResponse(
        "terminals and one agent running in each",
        true,
        [
          "okay yeah lets clean up first and dont start any new tasks yet we should have one agent running in an item terminal window thats working on those a loops",
        ],
      ),
    ).toEqual(
      expect.objectContaining({
        response: expect.stringContaining("may have been cut off"),
      }),
    )
  })

  it("asks for clarification on dangling cut-off follow-ups", () => {
    expect(
      getLowContextPromptGuardResponse("the file then you give the", true, ["show me the file and then give the trigger words"]),
    ).toEqual(
      expect.objectContaining({
        response: expect.stringContaining("may have been cut off"),
      }),
    )
  })

  it("asks for clarification on short cut-off action requests", () => {
    expect(getLowContextPromptGuardResponse("create kentucky to", true)).toEqual(
      expect.objectContaining({
        response: expect.stringContaining("may have been cut off"),
      }),
    )
  })

  it("does not over-trigger on prompts that already include real context", () => {
    expect(getLowContextPromptGuardResponse("What should I do next after pnpm test fails?", false)).toBeNull()
  })

  it("does not treat explicit actionable pause commands as passive deferrals", () => {
    expect(getLowContextPromptGuardResponse("pause the mobile-app-improvement-loop", true)).toBeNull()
  })

  it("does not block short follow-ups that still read like complete statements", () => {
    expect(
      getLowContextPromptGuardResponse(
        "you have checked out on your machine",
        true,
        ["what kind of trigger words would activate the new skill"],
      ),
    ).toBeNull()
  })
})