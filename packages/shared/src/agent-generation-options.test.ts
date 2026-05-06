import { describe, expect, it } from "vitest"

import {
  CODEX_TEXT_VERBOSITY_OPTIONS,
  DEFAULT_CODEX_REASONING_EFFORT,
  DEFAULT_CODEX_TEXT_VERBOSITY,
  DEFAULT_OPENAI_REASONING_EFFORT,
  OPENAI_REASONING_EFFORT_OPTIONS,
  getOpenAiReasoningEffortDefault,
  isCodexTextVerbosityUpdateValue,
  isOpenAiReasoningEffortUpdateValue,
} from "./agent-generation-options"

describe("agent generation options", () => {
  it("describes reasoning effort options and defaults", () => {
    expect(OPENAI_REASONING_EFFORT_OPTIONS.map((option) => option.value)).toEqual([
      "none",
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
    ])
    expect(DEFAULT_OPENAI_REASONING_EFFORT).toBe("medium")
    expect(DEFAULT_CODEX_REASONING_EFFORT).toBe("low")
    expect(getOpenAiReasoningEffortDefault("openai")).toBe("medium")
    expect(getOpenAiReasoningEffortDefault("chatgpt-web")).toBe("low")
  })

  it("validates reasoning effort updates", () => {
    expect(isOpenAiReasoningEffortUpdateValue("none")).toBe(true)
    expect(isOpenAiReasoningEffortUpdateValue("xhigh")).toBe(true)
    expect(isOpenAiReasoningEffortUpdateValue("ultra")).toBe(false)
    expect(isOpenAiReasoningEffortUpdateValue(undefined)).toBe(false)
  })

  it("describes and validates Codex text verbosity options", () => {
    expect(CODEX_TEXT_VERBOSITY_OPTIONS.map((option) => option.value)).toEqual(["low", "medium", "high"])
    expect(DEFAULT_CODEX_TEXT_VERBOSITY).toBe("medium")
    expect(isCodexTextVerbosityUpdateValue("low")).toBe(true)
    expect(isCodexTextVerbosityUpdateValue("verbose")).toBe(false)
    expect(isCodexTextVerbosityUpdateValue(undefined)).toBe(false)
  })
})
