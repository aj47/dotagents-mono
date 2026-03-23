import { describe, expect, it } from "vitest"
import {
  applyLoopRunClassification,
  classifyLoopRunOutcome,
  LOOP_AUTO_PAUSE_FAILURE_THRESHOLD,
  prepareLoopForSave,
} from "./loop-failure-state"

describe("loop failure state helpers", () => {
  it("treats incomplete agent fallback copy as a loop failure", () => {
    expect(classifyLoopRunOutcome({
      content: "I couldn't complete the request after multiple attempts. Please try again with a narrower scope or additional guidance.",
    })).toEqual({
      failed: true,
      failureMessage: "I couldn't complete the request after multiple attempts. Please try again with a narrower scope or additional guidance.",
    })
  })

  it("treats ACP session setup failures as loop failures", () => {
    expect(classifyLoopRunOutcome({
      content: "Failed to create ACP session for agent augustus. Verify the agent command is valid and supports ACP methods like session/new.",
    })).toEqual({
      failed: true,
      failureMessage: "Failed to create ACP session for agent augustus. Verify the agent command is valid and supports ACP methods like session/new.",
    })
  })

  it("treats missing API key copy as a loop failure even without an Error prefix", () => {
    expect(classifyLoopRunOutcome({
      content: "API key is required for openai",
    })).toEqual({
      failed: true,
      failureMessage: "API key is required for openai",
    })
  })

  it("auto-pauses a loop after the configured consecutive automatic failures", () => {
    const loop = applyLoopRunClassification({
      id: "broken-repeat-task",
      name: "Broken Repeat Task",
      prompt: "Say hello",
      intervalMinutes: 1,
      enabled: true,
      consecutiveFailures: LOOP_AUTO_PAUSE_FAILURE_THRESHOLD - 1,
    }, {
      failed: true,
      failureMessage: "OpenAI API key is missing.",
    }, "automatic", 1774247285000)

    expect(loop.enabled).toBe(false)
    expect(loop.consecutiveFailures).toBe(LOOP_AUTO_PAUSE_FAILURE_THRESHOLD)
    expect(loop.autoPausedAt).toBe(1774247285000)
    expect(loop.lastFailureMessage).toBe("OpenAI API key is missing.")
  })

  it("does not increment the automatic failure streak for manual test runs", () => {
    const loop = applyLoopRunClassification({
      id: "broken-repeat-task",
      name: "Broken Repeat Task",
      prompt: "Say hello",
      intervalMinutes: 1,
      enabled: false,
      consecutiveFailures: 2,
      autoPausedAt: 1774247280000,
    }, {
      failed: true,
      failureMessage: "OpenAI API key is missing.",
    }, "manual", 1774247285000)

    expect(loop.enabled).toBe(false)
    expect(loop.consecutiveFailures).toBe(2)
    expect(loop.autoPausedAt).toBe(1774247280000)
    expect(loop.lastFailureAt).toBe(1774247285000)
  })

  it("clears auto-pause metadata when the user explicitly re-enables the task", () => {
    const loop = prepareLoopForSave({
      id: "broken-repeat-task",
      name: "Broken Repeat Task",
      prompt: "Say hello",
      intervalMinutes: 1,
      enabled: true,
      consecutiveFailures: 3,
      autoPausedAt: 1774247285000,
      lastFailureAt: 1774247285000,
      lastFailureMessage: "OpenAI API key is missing.",
    }, {
      id: "broken-repeat-task",
      name: "Broken Repeat Task",
      prompt: "Say hello",
      intervalMinutes: 1,
      enabled: false,
      consecutiveFailures: 3,
      autoPausedAt: 1774247285000,
      lastFailureAt: 1774247285000,
      lastFailureMessage: "OpenAI API key is missing.",
    })

    expect(loop.consecutiveFailures).toBe(0)
    expect(loop.autoPausedAt).toBeUndefined()
    expect(loop.lastFailureAt).toBeUndefined()
    expect(loop.lastFailureMessage).toBeUndefined()
  })
})
