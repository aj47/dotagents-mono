import { describe, expect, it } from "vitest"
import {
  AGENT_STOP_NOTE,
  DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
  appendAgentStopNote,
  buildProfileContext,
  getPreferredDelegationOutput,
    isToolCallPlaceholderResponse,
    needsNativeToolCallingReminder,
  preferStoredUserResponse,
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

    it("unwraps pseudo respond_to_user assistant text before returning it", () => {
      expect(
        getPreferredDelegationOutput("stale output", [
          {
            role: "assistant",
            content: `[respond_to_user] {\n  "text": "Do this now"\n}`,
          },
        ]),
      ).toBe("Do this now")
    })
  })

  describe("preferStoredUserResponse", () => {
    it("preserves an existing final content value", () => {
      expect(preferStoredUserResponse("Explicit final summary", "Delivered to user")).toBe(
        "Explicit final summary",
      )
    })

    it("falls back to a stored respond_to_user message when final content is blank", () => {
      expect(preferStoredUserResponse("   ", "Delivered to user")).toBe("Delivered to user")
    })

    it("prefers a stored respond_to_user message over stale progress-only final content", () => {
      expect(
        preferStoredUserResponse(
          "Let me pull up all saved memories.",
          "Done. Deleted the broken skill folders and cleaned up the backups.",
        ),
      ).toBe("Done. Deleted the broken skill folders and cleaned up the backups.")
    })

    it("returns the original blank content when no stored user response exists", () => {
      expect(preferStoredUserResponse("", undefined)).toBe("")
    })

    it("unwraps pseudo respond_to_user final content when no stored response exists", () => {
      expect(
        preferStoredUserResponse(
          `[respond_to_user] {\n  "text": "Do this now (safe, minimal path)"\n}`,
          undefined,
        ),
      ).toBe("Do this now (safe, minimal path)")
    })

    it("renders pseudo respond_to_user images as markdown", () => {
      expect(
        preferStoredUserResponse(
          `[respond_to_user] {\n  "text": "See screenshot",\n  "images": [{"alt": "Shot", "path": "/tmp/shot.png"}]\n}`,
          undefined,
        ),
      ).toBe("See screenshot\n\n![Shot](/tmp/shot.png)")
    })
  })

  describe("native tool-calling reminder detection", () => {
    it("flags raw tool marker tokens for correction", () => {
      expect(
        needsNativeToolCallingReminder(
          "<|tool_calls_section_begin|><|tool_call_begin|>search<|tool_call_end|>",
        ),
      ).toBe(true)
    })

    it("flags pseudo tool placeholders for correction", () => {
      expect(isToolCallPlaceholderResponse("[Calling tools: iterm:read_terminal_output]")).toBe(true)
      expect(needsNativeToolCallingReminder("[Calling tools: iterm:read_terminal_output]")).toBe(true)
    })

    it("does not flag normal assistant text", () => {
      expect(isToolCallPlaceholderResponse("Done — the page shows the updated address.")).toBe(false)
      expect(needsNativeToolCallingReminder("Done — the page shows the updated address.")).toBe(false)
    })
  })
})
