import { describe, it, expect } from "vitest"
import {
  constructSystemPrompt,
  constructMinimalSystemPrompt,
  getEffectiveSystemPrompt,
  DEFAULT_SYSTEM_PROMPT,
  AGENT_MODE_ADDITIONS,
} from "./system-prompts"

describe("system-prompts (core)", () => {
  describe("getEffectiveSystemPrompt", () => {
    it("returns custom prompt when provided", () => {
      expect(getEffectiveSystemPrompt("Custom prompt")).toBe("Custom prompt")
    })

    it("returns default prompt when custom is empty", () => {
      expect(getEffectiveSystemPrompt("")).toBe(DEFAULT_SYSTEM_PROMPT)
    })

    it("returns default prompt when custom is undefined", () => {
      expect(getEffectiveSystemPrompt(undefined)).toBe(DEFAULT_SYSTEM_PROMPT)
    })
  })

  describe("constructSystemPrompt", () => {
    it("includes default system prompt", () => {
      const result = constructSystemPrompt([])
      expect(result).toContain("autonomous AI assistant")
    })

    it("includes agent mode additions when isAgentMode is true", () => {
      const result = constructSystemPrompt([], undefined, true)
      expect(result).toContain("AGENT MODE")
      expect(result).toContain("respond_to_user")
    })

    it("includes tool listing when tools are provided", () => {
      const tools = [
        { name: "server:tool1", description: "Test tool 1" },
        { name: "server:tool2", description: "Test tool 2" },
      ]
      const result = constructSystemPrompt(tools)
      expect(result).toContain("2 tools total")
      expect(result).toContain("tool1, tool2")
    })

    it("includes guidelines when provided", () => {
      const result = constructSystemPrompt([], "Be helpful")
      expect(result).toContain("USER GUIDELINES")
      expect(result).toContain("Be helpful")
    })

    it("includes skills instructions when provided", () => {
      const skills = "SKILLS_BLOCK_UNIQUE_12345"
      const result = constructSystemPrompt([], undefined, true, undefined, undefined, skills)
      // Skills should appear exactly once
      expect(result.split(skills).length - 1).toBe(1)
    })

    it("includes memories when provided", () => {
      const memories = [
        { id: "1", createdAt: 1, updatedAt: 1, title: "t", content: "User prefers TypeScript", tags: [], importance: "high" as const },
      ]
      const result = constructSystemPrompt([], undefined, false, undefined, undefined, undefined, undefined, memories)
      expect(result).toContain("MEMORIES FROM PREVIOUS SESSIONS")
      expect(result).toContain("User prefers TypeScript")
    })

    it("includes ACP routing prompt from additions", () => {
      const additions = { acpRoutingPrompt: "ACP_ROUTING_PROMPT_HERE" }
      const result = constructSystemPrompt([], undefined, true, undefined, undefined, undefined, undefined, undefined, additions)
      expect(result).toContain("ACP_ROUTING_PROMPT_HERE")
    })

    it("includes agents delegation prompt from additions", () => {
      const additions = { agentsDelegationPrompt: "AGENTS_DELEGATION_HERE" }
      const result = constructSystemPrompt([], undefined, true, undefined, undefined, undefined, undefined, undefined, additions)
      expect(result).toContain("AGENTS_DELEGATION_HERE")
    })

    it("does not include additions when not in agent mode", () => {
      const additions = { acpRoutingPrompt: "ACP_ROUTING_PROMPT_HERE" }
      const result = constructSystemPrompt([], undefined, false, undefined, undefined, undefined, undefined, undefined, additions)
      expect(result).not.toContain("ACP_ROUTING_PROMPT_HERE")
    })

    it("includes agent properties when provided", () => {
      const result = constructSystemPrompt([], undefined, false, undefined, undefined, undefined, { role: "developer" })
      expect(result).toContain("AGENT PROPERTIES")
      expect(result).toContain("role: developer")
    })
  })

  describe("constructMinimalSystemPrompt", () => {
    it("includes compact tool listing", () => {
      const tools = [
        { name: "read_file", inputSchema: { properties: { path: { type: "string" } } } },
      ]
      const result = constructMinimalSystemPrompt(tools)
      expect(result).toContain("read_file(path)")
    })

    it("includes agent mode instructions", () => {
      const result = constructMinimalSystemPrompt([], true)
      expect(result).toContain("Agent mode")
    })

    it("includes skills index when provided", () => {
      const result = constructMinimalSystemPrompt([], false, undefined, "skill-1, skill-2")
      expect(result).toContain("skill-1, skill-2")
    })
  })
})
