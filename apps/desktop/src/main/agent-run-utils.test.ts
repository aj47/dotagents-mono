import { describe, expect, it } from "vitest"
import {
  AGENT_STOP_NOTE,
  DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
  appendAgentStopNote,
  buildProfileContext,
  getLatestPlainAssistantMessageContent,
  getPreferredAgentFinalOutput,
  getPreferredDelegationOutput,
  resolveAgentIterationLimits,
} from "./agent-run-utils"

describe("agent-run-utils", () => {
  describe("resolveAgentIterationLimits", () => {
    it("preserves finite iteration limits", () => {
      expect(resolveAgentIterationLimits(25)).toEqual({
        loopMaxIterations: 25,
        guardrailBudget: 25,
      })
    })

    it("keeps unlimited loops unlimited while capping guardrails", () => {
      expect(resolveAgentIterationLimits(Number.POSITIVE_INFINITY)).toEqual({
        loopMaxIterations: Number.POSITIVE_INFINITY,
        guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
      })
    })

    it("falls back to a safe finite budget for invalid values", () => {
      expect(resolveAgentIterationLimits(Number.NaN)).toEqual({
        loopMaxIterations: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
        guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
      })
      expect(resolveAgentIterationLimits(-4)).toEqual({
        loopMaxIterations: 1,
        guardrailBudget: 1,
      })
    })
  })

  describe("appendAgentStopNote", () => {
    it("appends the stop note once to existing content", () => {
      expect(appendAgentStopNote("Done")).toBe(`Done\n\n${AGENT_STOP_NOTE}`)
      expect(appendAgentStopNote(`Done\n\n${AGENT_STOP_NOTE}`)).toBe(
        `Done\n\n${AGENT_STOP_NOTE}`,
      )
    })

    it("returns only the stop note when no content exists", () => {
      expect(appendAgentStopNote("")).toBe(AGENT_STOP_NOTE)
    })
  })

  describe("buildProfileContext", () => {
    it("prefers a non-empty displayName and falls back to profileName", () => {
      expect(buildProfileContext({
        displayName: "Friendly Agent",
        profileName: "fallback-agent",
        guidelines: "Stay helpful",
      })).toContain("[Acting as: Friendly Agent]")

      expect(buildProfileContext({
        displayName: "   ",
        profileName: "fallback-agent",
        guidelines: "Stay helpful",
      })).toContain("[Acting as: fallback-agent]")

      expect(buildProfileContext({
        displayName: undefined,
        profileName: "fallback-agent",
        guidelines: "Stay helpful",
      } as any)).toContain("[Acting as: fallback-agent]")

      expect(buildProfileContext({
        displayName: "",
        profileName: "  trimmed-agent  ",
      })).toContain("[Acting as: trimmed-agent]")
    })

    it("adds a direct-execution note for delegated specialist runs", () => {
      expect(buildProfileContext({
        displayName: "Web Browser",
        disableDelegation: true,
      })).toContain("do not delegate to other agents or sub-sessions")
    })
  })

  describe("getPreferredDelegationOutput", () => {
    it("prefers the latest assistant message over stale output", () => {
      expect(
        getPreferredDelegationOutput("I'll start by loading the page", [
          { role: "user", content: "Do the task" },
          { role: "assistant", content: "I'll start by loading the page" },
          { role: "assistant", content: "Finished the task successfully" },
        ]),
      ).toBe("Finished the task successfully")
    })

    it("falls back to the provided output when no assistant message exists", () => {
      expect(
        getPreferredDelegationOutput("Final output", [
          { role: "user", content: "Do the task" },
          { role: "tool", content: "tool result" },
        ]),
      ).toBe("Final output")
    })

    it("ignores blank assistant messages when choosing the final output", () => {
      expect(
        getPreferredDelegationOutput("Final output", [
          { role: "assistant", content: "   " },
          { role: "assistant", content: "Real final output" },
        ]),
      ).toBe("Real final output")
    })
  })

  describe("getLatestPlainAssistantMessageContent", () => {
    it("skips assistant entries that only carry tool metadata", () => {
      expect(
        getLatestPlainAssistantMessageContent([
          { role: "assistant", content: "[respond_to_user] { ... }", toolCalls: [{ name: "respond_to_user" }] },
          { role: "assistant", content: "Cleanup is done." },
        ]),
      ).toBe("Cleanup is done.")
    })
  })

  describe("getPreferredAgentFinalOutput", () => {
    it("prefers the latest plain assistant message over stale finalContent", () => {
      expect(
        getPreferredAgentFinalOutput("Earlier answer", [
          { role: "assistant", content: "Earlier answer" },
          { role: "assistant", content: "[respond_to_user] { ... }", toolCalls: [{ name: "respond_to_user" }] },
          { role: "assistant", content: "Cleanup is done and one loop is running." },
        ]),
      ).toBe("Cleanup is done and one loop is running.")
    })

    it("falls back to stored respond_to_user content when conversation only has tool-call wrappers", () => {
      expect(
        getPreferredAgentFinalOutput("", [
          { role: "assistant", content: "[respond_to_user] { ... }", toolCalls: [{ name: "respond_to_user" }] },
        ], "Actual final user-facing response"),
      ).toBe("Actual final user-facing response")
    })

    it("preserves emergency-stop content instead of reviving stale respond_to_user text", () => {
      expect(
        getPreferredAgentFinalOutput(AGENT_STOP_NOTE, undefined, "Older response"),
      ).toBe(AGENT_STOP_NOTE)
    })
  })
})
