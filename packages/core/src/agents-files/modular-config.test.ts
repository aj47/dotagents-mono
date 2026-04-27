import { describe, it, expect } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import type { Config } from "../types"
import {
  findAgentsDirUpward,
  getAgentsLayerPaths,
  loadAgentsLayerConfig,
  loadMergedAgentsConfig,
  writeAgentsLayerFromConfig,
  writeAgentsPrompts,
} from "./modular-config"

const DEFAULT_PROMPT = "DEFAULT PROMPT\nLine2"

function mkTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, "utf8")
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8")
}

describe("modular-config", () => {
  it("loads layer config and normalizes default system prompt", () => {
    const dir = mkTempDir("dotagents-modular-config-")
    const agentsDir = path.join(dir, ".agents")
    const layer = getAgentsLayerPaths(agentsDir)

    writeJson(layer.settingsJsonPath, { textInputEnabled: false })
    writeFile(
      layer.systemPromptMdPath,
      `---\nkind: system-prompt\n---\n\n${DEFAULT_PROMPT}\n`,
    )
    writeFile(layer.agentsMdPath, `---\nkind: agents\n---\n\nHello guidelines\n`)

    const loaded = loadAgentsLayerConfig(layer)
    expect(loaded.textInputEnabled).toBe(false)
  })

  it("merges workspace layer over global layer", () => {
    const dir = mkTempDir("dotagents-modular-merge-")
    const globalAgentsDir = path.join(dir, "global", ".agents")
    const workspaceAgentsDir = path.join(dir, "workspace", ".agents")

    const globalLayer = getAgentsLayerPaths(globalAgentsDir)
    const workspaceLayer = getAgentsLayerPaths(workspaceAgentsDir)

    writeJson(globalLayer.settingsJsonPath, { textInputEnabled: false })
    writeJson(workspaceLayer.settingsJsonPath, { textInputEnabled: true })

    const { merged, hasAnyAgentsFiles } = loadMergedAgentsConfig(
      { globalAgentsDir, workspaceAgentsDir }
    )

    expect(hasAnyAgentsFiles).toBe(true)
    expect(merged.textInputEnabled).toBe(true)
  })

  it("writes expected files and splits config into buckets", () => {
    const dir = mkTempDir("dotagents-modular-write-")
    const agentsDir = path.join(dir, ".agents")
    const layer = getAgentsLayerPaths(agentsDir)

    const config = {
      textInputEnabled: false,
      mcpMaxIterations: 99,
      openaiApiKey: "sk-test",
      themePreference: "dark",
      mcpCustomSystemPrompt: "",
      mcpToolsSystemPrompt: "Extra guidelines",
    } as unknown as Config

    writeAgentsLayerFromConfig(layer, config, { maxBackups: 3 })
    writeAgentsPrompts(layer, "", "Extra guidelines", DEFAULT_PROMPT, { maxBackups: 3 })

    const systemMd = fs.readFileSync(layer.systemPromptMdPath, "utf8")
    expect(systemMd).toContain("kind: system-prompt")
    expect(systemMd).toContain(DEFAULT_PROMPT)

    const agentsMd = fs.readFileSync(layer.agentsMdPath, "utf8")
    expect(agentsMd).toContain("kind: agents")
    expect(agentsMd).toContain("Extra guidelines")

    const settings = JSON.parse(fs.readFileSync(layer.settingsJsonPath, "utf8"))
    const mcp = JSON.parse(fs.readFileSync(layer.mcpJsonPath, "utf8"))
    const models = JSON.parse(fs.readFileSync(layer.modelsJsonPath, "utf8"))
    const layout = JSON.parse(fs.readFileSync(layer.layoutJsonPath, "utf8"))

    expect(settings.textInputEnabled).toBe(false)
    expect(mcp.mcpMaxIterations).toBe(99)
    expect(models.openaiApiKey).toBe("sk-test")
    expect(layout.themePreference).toBe("dark")
  })

  it("keeps app-local conversation pin state out of .agents files", () => {
    const dir = mkTempDir("dotagents-modular-app-local-")
    const agentsDir = path.join(dir, ".agents")
    const layer = getAgentsLayerPaths(agentsDir)

    const config = {
      textInputEnabled: false,
      pinnedSessionIds: ["conv-pinned"],
      archivedSessionIds: ["conv-archived"],
    } as unknown as Config

    writeAgentsLayerFromConfig(layer, config, { maxBackups: 3 })

    const settings = JSON.parse(fs.readFileSync(layer.settingsJsonPath, "utf8"))
    expect(settings.textInputEnabled).toBe(false)
    expect(settings).not.toHaveProperty("pinnedSessionIds")
    expect(settings).not.toHaveProperty("archivedSessionIds")

    writeJson(layer.settingsJsonPath, {
      textInputEnabled: true,
      pinnedSessionIds: ["stale-pin-from-agents"],
      archivedSessionIds: ["stale-archive-from-agents"],
    })

    const loaded = loadAgentsLayerConfig(layer)
    expect(loaded.textInputEnabled).toBe(true)
    expect(loaded).not.toHaveProperty("pinnedSessionIds")
    expect(loaded).not.toHaveProperty("archivedSessionIds")
  })

  it("does not rewrite layer JSON files when the in-memory value is unchanged", () => {
    const dir = mkTempDir("dotagents-modular-skip-")
    const agentsDir = path.join(dir, ".agents")
    const layer = getAgentsLayerPaths(agentsDir)

    const config = {
      textInputEnabled: false,
      mcpMaxIterations: 99,
      themePreference: "dark",
    } as unknown as Config

    writeAgentsLayerFromConfig(layer, config, { maxBackups: 5 })
    const mtimes = {
      settings: fs.statSync(layer.settingsJsonPath).mtimeMs,
      mcp: fs.statSync(layer.mcpJsonPath).mtimeMs,
      layout: fs.statSync(layer.layoutJsonPath).mtimeMs,
    }

    const waitUntil = Date.now() + 20
    while (Date.now() < waitUntil) { /* spin */ }

    writeAgentsLayerFromConfig(layer, config, { maxBackups: 5 })

    expect(fs.statSync(layer.settingsJsonPath).mtimeMs).toBe(mtimes.settings)
    expect(fs.statSync(layer.mcpJsonPath).mtimeMs).toBe(mtimes.mcp)
    expect(fs.statSync(layer.layoutJsonPath).mtimeMs).toBe(mtimes.layout)

    // No backups should have been rotated for a no-op save.
    const backups = fs.existsSync(layer.backupsDir)
      ? fs.readdirSync(layer.backupsDir).filter((f) => f.endsWith(".bak"))
      : []
    expect(backups.length).toBe(0)
  })

  it("does not rewrite system-prompt.md / agents.md when unchanged", () => {
    const dir = mkTempDir("dotagents-modular-prompts-skip-")
    const agentsDir = path.join(dir, ".agents")
    const layer = getAgentsLayerPaths(agentsDir)

    writeAgentsPrompts(layer, "my prompt", "my guidelines", DEFAULT_PROMPT, { maxBackups: 5 })
    const sysMtime = fs.statSync(layer.systemPromptMdPath).mtimeMs
    const agentsMtime = fs.statSync(layer.agentsMdPath).mtimeMs

    const waitUntil = Date.now() + 20
    while (Date.now() < waitUntil) { /* spin */ }

    writeAgentsPrompts(layer, "my prompt", "my guidelines", DEFAULT_PROMPT, { maxBackups: 5 })

    expect(fs.statSync(layer.systemPromptMdPath).mtimeMs).toBe(sysMtime)
    expect(fs.statSync(layer.agentsMdPath).mtimeMs).toBe(agentsMtime)
  })

  it("finds .agents directory upward", () => {
    const dir = mkTempDir("dotagents-find-agents-")
    const rootAgents = path.join(dir, ".agents")
    fs.mkdirSync(rootAgents, { recursive: true })

    const deep = path.join(dir, "a", "b", "c")
    fs.mkdirSync(deep, { recursive: true })

    expect(findAgentsDirUpward(deep)).toBe(rootAgents)
  })
})
