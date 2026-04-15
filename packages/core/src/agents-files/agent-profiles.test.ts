import { describe, it, expect } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import type { AgentProfile, AgentProfileConnectionType, AgentProfileRole } from "../types"
import { getAgentsLayerPaths, type AgentsLayerPaths } from "./modular-config"
import {
  AGENTS_PROFILE_CANONICAL_FILENAME,
  agentProfileIdToFilePath,
  getAgentProfilesDir,
  loadAgentProfilesLayer,
  writeAgentsProfileFiles,
} from "./agent-profiles"

function mkTempLayer(prefix: string): AgentsLayerPaths {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  return getAgentsLayerPaths(path.join(dir, ".agents"))
}

function writeAgentProfileMarkdown(
  layer: AgentsLayerPaths,
  options: {
    id: string
    connectionType: AgentProfileConnectionType
    role?: AgentProfileRole
  },
): void {
  const profileDir = path.join(getAgentProfilesDir(layer), options.id)
  fs.mkdirSync(profileDir, { recursive: true })

  const roleLine = options.role ? `role: ${options.role}\n` : ""
  const markdown = `---\nid: ${options.id}\nname: ${options.id}\ndisplayName: ${options.id}\nenabled: true\nconnection-type: ${options.connectionType}\n${roleLine}---\n\nPrompt\n`

  fs.writeFileSync(path.join(profileDir, AGENTS_PROFILE_CANONICAL_FILENAME), markdown, "utf8")
}

describe("agent-profiles role inference", () => {
  it.each(["acp", "stdio", "remote"] as const)(
    "infers delegation-target for %s profiles missing role",
    (connectionType) => {
      const layer = mkTempLayer("dotagents-agent-profiles-ext-")
      writeAgentProfileMarkdown(layer, {
        id: `ext-${connectionType}`,
        connectionType,
      })

      const { profiles } = loadAgentProfilesLayer(layer)
      expect(profiles).toHaveLength(1)
      expect(profiles[0].connection.type).toBe(connectionType)
      expect(profiles[0].role).toBe("delegation-target")
      expect(profiles[0].isAgentTarget).toBe(true)
    },
  )

  it("does not infer delegation-target for internal profiles missing role", () => {
    const layer = mkTempLayer("dotagents-agent-profiles-internal-")
    writeAgentProfileMarkdown(layer, {
      id: "internal-no-role",
      connectionType: "internal",
    })

    const { profiles } = loadAgentProfilesLayer(layer)
    expect(profiles).toHaveLength(1)
    expect(profiles[0].connection.type).toBe("internal")
    expect(profiles[0].role).toBeUndefined()
    expect(profiles[0].isAgentTarget).toBeUndefined()
  })

  it("preserves explicit external-agent role", () => {
    const layer = mkTempLayer("dotagents-agent-profiles-explicit-")
    writeAgentProfileMarkdown(layer, {
      id: "explicit-external-agent",
      connectionType: "acp",
      role: "external-agent",
    })

    const { profiles } = loadAgentProfilesLayer(layer)
    expect(profiles).toHaveLength(1)
    expect(profiles[0].role).toBe("external-agent")
    expect(profiles[0].isAgentTarget).toBe(true)
  })

  it("preserves explicit chat-agent role", () => {
    const layer = mkTempLayer("dotagents-agent-profiles-chat-agent-")
    writeAgentProfileMarkdown(layer, {
      id: "chat-agent",
      connectionType: "internal",
      role: "chat-agent",
    })

    const { profiles } = loadAgentProfilesLayer(layer)
    expect(profiles).toHaveLength(1)
    expect(profiles[0].role).toBe("chat-agent")
    expect(profiles[0].isAgentTarget).toBeUndefined()
  })

  it("normalizes legacy user-profile role to chat-agent", () => {
    const layer = mkTempLayer("dotagents-agent-profiles-legacy-user-profile-")
    writeAgentProfileMarkdown(layer, {
      id: "legacy-chat-agent",
      connectionType: "internal",
      role: "user-profile",
    })

    const { profiles } = loadAgentProfilesLayer(layer)
    expect(profiles).toHaveLength(1)
    expect(profiles[0].role).toBe("chat-agent")
    expect(profiles[0].isAgentTarget).toBeUndefined()
  })
})

describe("agent-profiles write behaviour", () => {
  it("does not rewrite agent.md when the in-memory profile is unchanged", () => {
    const layer = mkTempLayer("dotagents-agent-profiles-skip-")
    const profile: AgentProfile = {
      id: "main-agent",
      name: "main-agent",
      displayName: "Main Agent",
      systemPrompt: "You are helpful",
      guidelines: "",
      connection: { type: "internal" },
      enabled: true,
      isBuiltIn: true,
      isDefault: true,
      createdAt: 1,
      updatedAt: 1,
    }

    writeAgentsProfileFiles(layer, profile, { maxBackups: 5 })
    const mdPath = agentProfileIdToFilePath(layer, profile.id)
    const mtimeBefore = fs.statSync(mdPath).mtimeMs

    const waitUntil = Date.now() + 20
    while (Date.now() < waitUntil) { /* spin */ }

    writeAgentsProfileFiles(layer, profile, { maxBackups: 5 })

    expect(fs.statSync(mdPath).mtimeMs).toBe(mtimeBefore)
  })
})
