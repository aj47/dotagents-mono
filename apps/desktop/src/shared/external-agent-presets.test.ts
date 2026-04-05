import { describe, expect, it } from "vitest"

import {
  EXTERNAL_AGENT_PRESETS,
  detectExternalAgentPresetKey,
} from "./external-agent-presets"

describe("external-agent-presets", () => {
  it("keeps all curated ACP onboarding options available", () => {
    expect(Object.keys(EXTERNAL_AGENT_PRESETS)).toEqual([
      "auggie",
      "claude-code",
      "codex",
      "opencode",
    ])
    expect(EXTERNAL_AGENT_PRESETS.opencode.setupMode).toBe("managed")
  })

  it("detects presets from stored connection details", () => {
    expect(
      detectExternalAgentPresetKey({
        connectionType: "acp",
        connectionCommand: "opencode",
        connectionArgs: ["acp"],
      })
    ).toBe("opencode")

    expect(
      detectExternalAgentPresetKey({
        connectionType: "acp",
        connectionCommand: "claude-code-acp",
        connectionArgs: "",
      })
    ).toBe("claude-code")
  })

  it("returns undefined for unrelated agents", () => {
    expect(
      detectExternalAgentPresetKey({
        connectionType: "remote",
        connectionCommand: "https://example.com",
      })
    ).toBeUndefined()
  })
})