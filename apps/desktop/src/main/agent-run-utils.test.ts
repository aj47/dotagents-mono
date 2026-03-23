import { describe, expect, it } from "vitest"

import {
  AGENT_STOP_NOTE,
  AGENT_SESSION_COST_LIMIT_STOP_NOTE,
  DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
  appendAgentStopNote,
  appendAgentStopNoteForReason,
  buildProfileContext,
  getAgentStopMessage,
  getPreferredDelegationOutput,
  resolveAgentIterationLimits,
} from "./agent-run-utils"

describe("resolveAgentIterationLimits", () => {
  it("keeps infinite loop iterations but caps the guardrail budget", () => {
    expect(resolveAgentIterationLimits(Number.POSITIVE_INFINITY)).toEqual({
      loopMaxIterations: Number.POSITIVE_INFINITY,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    })
  })

  it("falls back to the default guardrail budget for other non-finite values", () => {
    expect(resolveAgentIterationLimits(Number.NaN)).toEqual({
      loopMaxIterations: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    })
  })

  it("normalizes finite values to at least one whole iteration", () => {
    expect(resolveAgentIterationLimits(2.9)).toEqual({
      loopMaxIterations: 2,
      guardrailBudget: 2,
    })

    expect(resolveAgentIterationLimits(0)).toEqual({
      loopMaxIterations: 1,
      guardrailBudget: 1,
    })
  })
})

describe("appendAgentStopNote", () => {
  it("appends the emergency stop note once after trimming trailing whitespace", () => {
    expect(appendAgentStopNote("Finished work.   ")).toBe(
      `Finished work.\n\n${AGENT_STOP_NOTE}`,
    )
  })

  it("does not duplicate the emergency stop note", () => {
    expect(appendAgentStopNote(`Finished work\n\n${AGENT_STOP_NOTE}`)).toBe(
      `Finished work\n\n${AGENT_STOP_NOTE}`,
    )
  })

  it("uses the session cost limit note when requested", () => {
    expect(appendAgentStopNoteForReason("Finished work", "session_cost_limit")).toBe(
      `Finished work\n\n${AGENT_SESSION_COST_LIMIT_STOP_NOTE}`,
    )
  })
})

describe("getAgentStopMessage", () => {
  it("maps stop reasons to user-facing copy", () => {
    expect(getAgentStopMessage("kill_switch")).toBe(
      "Agent mode was stopped by emergency kill switch",
    )
    expect(getAgentStopMessage("session_cost_limit")).toBe(
      "Agent mode was stopped after reaching the session cost limit",
    )
  })
})

describe("buildProfileContext", () => {
  it("combines existing context with display name, prompts, and delegation guardrails", () => {
    expect(buildProfileContext({
      profileName: "fallback-name",
      displayName: "  Helpful Agent  ",
      systemPrompt: "Be concise.",
      guidelines: "Prefer bullets.",
      disableDelegation: true,
    }, "Workspace context")).toBe(
      "Workspace context\n\n[Acting as: Helpful Agent]\n\nSystem Prompt: Be concise.\n\nGuidelines: Prefer bullets.\n\nDelegation rule: this is already a delegated run. Execute the task directly and do not delegate to other agents or sub-sessions.",
    )
  })

  it("returns undefined when neither profile nor existing context contributes content", () => {
    expect(buildProfileContext(undefined)).toBeUndefined()
  })
})

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

  it("prefers ACP-style respond_to_user tool messages over trailing fallback text", () => {
    expect(getPreferredDelegationOutput("Internal trailing completion text", [
      {
        role: "tool",
        content: "Final delegated answer",
        toolName: "Tool: Respond to User",
        toolInput: { text: "Final delegated answer" },
      },
    ])).toBe("Final delegated answer")
  })

  it("falls back to the latest assistant message when no explicit user response exists", () => {
    expect(getPreferredDelegationOutput("raw tool output", [
      { role: "assistant", content: "Assistant summary" },
    ])).toBe("Assistant summary")
  })
})
