import { afterEach, describe, expect, it } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import { loadAgentProfilesLayer, writeAgentsProfileFiles, type AgentProfile } from "@dotagents/core"
import { getAgentsLayerPaths } from "@dotagents/core"
import { cleanupInvalidMcpServerReferencesInLayers } from "./agent-profile-mcp-cleanup"

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "agent-mcp-cleanup-"))
}

function cleanupDir(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true })
}

function createProfile(id: string, enabledServers: string[]): AgentProfile {
  const now = Date.now()
  return {
    id,
    name: id,
    displayName: id,
    enabled: true,
    connection: { type: "internal" },
    toolConfig: { enabledServers },
    createdAt: now,
    updatedAt: now,
  }
}

describe("agent-profile-mcp-cleanup", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    while (tempDirs.length > 0) {
      cleanupDir(tempDirs.pop()!)
    }
  })

  it("cleans stale MCP server references in persisted layers", () => {
    const globalDir = createTempDir()
    const workspaceDir = createTempDir()
    tempDirs.push(globalDir, workspaceDir)

    const globalLayer = getAgentsLayerPaths(globalDir)
    const workspaceLayer = getAgentsLayerPaths(workspaceDir)

    writeAgentsProfileFiles(globalLayer, createProfile("global-agent", ["github", "playwriter"]))
    writeAgentsProfileFiles(workspaceLayer, createProfile("workspace-agent", ["exa", "playwriter"]))

    const result = cleanupInvalidMcpServerReferencesInLayers(
      [globalLayer, workspaceLayer],
      ["github", "exa"],
      654,
    )

    expect(result.updatedProfileIds).toEqual(["global-agent", "workspace-agent"])
    expect(result.removedReferenceCount).toBe(2)

    expect(
      loadAgentProfilesLayer(globalLayer).profiles.find((profile) => profile.id === "global-agent")?.toolConfig?.enabledServers
    ).toEqual(["github"])
    expect(
      loadAgentProfilesLayer(workspaceLayer).profiles.find((profile) => profile.id === "workspace-agent")?.toolConfig?.enabledServers
    ).toEqual(["exa"])
    expect(
      loadAgentProfilesLayer(globalLayer).profiles.find((profile) => profile.id === "global-agent")?.updatedAt
    ).toBe(654)
  })
})
