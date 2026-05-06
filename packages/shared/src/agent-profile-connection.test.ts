import { describe, expect, it } from "vitest"

import {
  applyConnectionTypeChange,
  buildAgentConnectionCommandPreview,
  buildAgentConnectionRequestFields,
  getAgentConnectionFormValidationError,
  normalizeAgentConnectionFormFieldsForEdit,
  normalizeAgentEditConnectionType,
  normalizeAgentConnectionArgs,
  sanitizeAgentProfileConnection,
} from "./agent-profile-connection"

describe("sanitizeAgentProfileConnection", () => {
  it("normalizes legacy local ACP connection types while preserving local launch fields", () => {
    const connection = sanitizeAgentProfileConnection(
      { connectionType: "acp" },
      {
        type: "acp",
        command: "auggie",
        args: ["--acp"],
        baseUrl: "https://stale-hidden.example/v1",
        cwd: "/workspace/agent",
      },
    )

    expect(connection).toEqual({
      type: "acpx",
      command: "auggie",
      args: ["--acp"],
      cwd: "/workspace/agent",
    })
    expect("baseUrl" in connection).toBe(false)
  })

  it("keeps only remote URL data for remote connections", () => {
    const connection = sanitizeAgentProfileConnection(
      { connectionType: "remote" },
      {
        type: "remote",
        command: "should-not-persist",
        baseUrl: "https://remote.example/v1",
        cwd: "/workspace/agent",
      },
    )

    expect(connection).toEqual({
      type: "remote",
      baseUrl: "https://remote.example/v1",
    })
    expect("command" in connection).toBe(false)
    expect("cwd" in connection).toBe(false)
  })

  it("treats blank visible fields as explicit clears instead of preserving stale saved values", () => {
    const connection = sanitizeAgentProfileConnection(
      {
        connectionType: "remote",
        connectionBaseUrl: "   ",
      },
      {
        type: "remote",
        baseUrl: "https://remote.example/v1",
      },
    )

    expect(connection).toEqual({
      type: "remote",
    })
    expect("baseUrl" in connection).toBe(false)
  })

  it("normalizes explicit local connection form fields for persisted profile records", () => {
    const connection = sanitizeAgentProfileConnection({
      connectionType: "acpx",
      connectionCommand: " npx ",
      connectionArgs: " -y  @example/agent ",
      connectionBaseUrl: "https://hidden.example/v1",
      connectionCwd: " /workspace/project ",
    })

    expect(connection).toEqual({
      type: "acpx",
      command: "npx",
      args: ["-y", "@example/agent"],
      cwd: "/workspace/project",
    })
    expect("baseUrl" in connection).toBe(false)
  })
})

describe("agent connection request helpers", () => {
  it("normalizes persisted profile connection types for edit forms", () => {
    expect(normalizeAgentEditConnectionType("internal")).toBe("internal")
    expect(normalizeAgentEditConnectionType("remote")).toBe("remote")
    expect(normalizeAgentEditConnectionType("acpx")).toBe("acpx")
    expect(normalizeAgentEditConnectionType("acp")).toBe("acpx")
    expect(normalizeAgentEditConnectionType("stdio")).toBe("acpx")
    expect(normalizeAgentEditConnectionType("unknown")).toBe("internal")
    expect(normalizeAgentEditConnectionType(undefined)).toBe("internal")
  })

  it("clears hidden remote URL state when switching away from remote", () => {
    const nextFormData = applyConnectionTypeChange({
      connectionType: "remote",
      connectionCommand: "node",
      connectionArgs: "agent.js --acp",
      connectionBaseUrl: " https://remote.example/v1 ",
      connectionCwd: "/tmp/agent",
    }, "acpx")

    expect(nextFormData).toMatchObject({
      connectionType: "acpx",
      connectionBaseUrl: "",
      connectionCommand: "node",
      connectionArgs: "agent.js --acp",
      connectionCwd: "/tmp/agent",
    })

    expect(applyConnectionTypeChange({
      connectionType: "remote",
      connectionBaseUrl: "https://remote.example/v1",
      displayName: "Desktop Agent",
    }, "internal")).toEqual({
      connectionType: "internal",
      connectionBaseUrl: "",
      displayName: "Desktop Agent",
    })
  })

  it("normalizes command args and previews consistently for command verification", () => {
    expect(normalizeAgentConnectionArgs(" -y  @example/agent --acp ")).toEqual(["-y", "@example/agent", "--acp"])
    expect(normalizeAgentConnectionArgs([" --acp ", "", "profile with spaces"])).toEqual(["--acp", "profile with spaces"])
    expect(normalizeAgentConnectionArgs("   ")).toEqual([])
    expect(buildAgentConnectionCommandPreview(" npx ", " -y @example/agent ")).toBe("npx -y @example/agent")
  })

  it("validates visible connection fields before profile saves", () => {
    expect(getAgentConnectionFormValidationError({
      connectionType: "acpx",
      connectionCommand: "   ",
    })).toBe("Add a command for acpx agents before saving.")

    expect(getAgentConnectionFormValidationError({
      connectionType: "remote",
      connectionBaseUrl: "   ",
    })).toBe("Add a base URL before saving a remote agent.")

    expect(getAgentConnectionFormValidationError({
      connectionType: "internal",
    })).toBeUndefined()
  })

  it("normalizes persisted connection records into editable form fields", () => {
    expect(normalizeAgentConnectionFormFieldsForEdit({
      type: "stdio",
      agent: "default",
      command: " codex-acp ",
      args: [" --stdio ", ""],
      baseUrl: "https://hidden.example/v1",
      cwd: "/workspace/project",
    })).toEqual({
      connectionType: "acpx",
      connectionAgent: "default",
      connectionCommand: " codex-acp ",
      connectionArgs: "--stdio",
      connectionBaseUrl: "https://hidden.example/v1",
      connectionCwd: "/workspace/project",
    })

    expect(normalizeAgentConnectionFormFieldsForEdit(undefined, "remote")).toMatchObject({
      connectionType: "remote",
      connectionCommand: "",
      connectionArgs: "",
      connectionBaseUrl: "",
      connectionCwd: "",
    })
  })

  it("omits hidden Base URL fields from acpx saves while preserving visible local launch fields", () => {
    const requestFields = buildAgentConnectionRequestFields({
      connectionType: "acpx",
      connectionCommand: " node ",
      connectionArgs: " agent.js --acp ",
      connectionBaseUrl: "https://stale-hidden.example/v1",
      connectionCwd: " /workspace/agent ",
    })

    expect(requestFields).toEqual({
      connectionType: "acpx",
      connectionCommand: "node",
      connectionArgs: "agent.js --acp",
      connectionCwd: "/workspace/agent",
    })
    expect("connectionBaseUrl" in requestFields).toBe(false)
  })

  it("sends only the visible remote Base URL for remote saves", () => {
    const requestFields = buildAgentConnectionRequestFields({
      connectionType: "remote",
      connectionCommand: "node",
      connectionArgs: "agent.js --acp",
      connectionBaseUrl: " https://remote.example/v1 ",
      connectionCwd: "/workspace/agent",
    })

    expect(requestFields).toEqual({
      connectionType: "remote",
      connectionBaseUrl: "https://remote.example/v1",
    })
    expect("connectionCommand" in requestFields).toBe(false)
    expect("connectionArgs" in requestFields).toBe(false)
    expect("connectionCwd" in requestFields).toBe(false)
  })
})
