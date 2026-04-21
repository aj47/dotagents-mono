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
import { AGENTS_SECRETS_LOCAL_JSON, SECRET_REF_PREFIX } from "./secrets"

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
    expect(models.openaiApiKey).toMatch(new RegExp(`^${SECRET_REF_PREFIX}`))
    expect(layout.themePreference).toBe("dark")

    const secrets = JSON.parse(fs.readFileSync(path.join(agentsDir, AGENTS_SECRETS_LOCAL_JSON), "utf8"))
    expect(Object.values(secrets.secrets)).toContain("sk-test")
    expect(fs.readFileSync(path.join(agentsDir, ".gitignore"), "utf8")).toContain(`**/${AGENTS_SECRETS_LOCAL_JSON}*`)

    const loaded = loadAgentsLayerConfig(layer)
    expect(loaded.openaiApiKey).toBe("sk-test")
  })

  it("stores nested MCP and provider credentials as local secret refs", () => {
    const dir = mkTempDir("dotagents-modular-secrets-")
    const agentsDir = path.join(dir, ".agents")
    const layer = getAgentsLayerPaths(agentsDir)

    const config = {
      langfusePublicKey: "pk-lf-public",
      langfuseSecretKey: "sk-lf-secret",
      modelPresets: [{ id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", apiKey: "sk-model" }],
      mcpConfig: {
        mcpServers: {
          github: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            env: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_secret", SAFE_FLAG: "1" },
            headers: { Authorization: "Bearer server-secret", Accept: "application/json" },
            oauth: { clientSecret: "oauth-secret", serverMetadata: { token_endpoint: "https://example.com/token" } },
          },
        },
      },
    } as unknown as Config

    writeAgentsLayerFromConfig(layer, config)

    const settings = JSON.parse(fs.readFileSync(layer.settingsJsonPath, "utf8"))
    const models = JSON.parse(fs.readFileSync(layer.modelsJsonPath, "utf8"))
    const mcp = JSON.parse(fs.readFileSync(layer.mcpJsonPath, "utf8"))

    expect(settings.langfusePublicKey).toBe("pk-lf-public")
    expect(settings.langfuseSecretKey).toMatch(new RegExp(`^${SECRET_REF_PREFIX}`))
    expect(models.modelPresets[0].apiKey).toMatch(new RegExp(`^${SECRET_REF_PREFIX}`))
    expect(mcp.mcpConfig.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN).toMatch(new RegExp(`^${SECRET_REF_PREFIX}`))
    expect(mcp.mcpConfig.mcpServers.github.headers.Authorization).toMatch(new RegExp(`^${SECRET_REF_PREFIX}`))
    expect(mcp.mcpConfig.mcpServers.github.headers.Accept).toBe("application/json")
    expect(mcp.mcpConfig.mcpServers.github.oauth.clientSecret).toMatch(new RegExp(`^${SECRET_REF_PREFIX}`))
    expect(mcp.mcpConfig.mcpServers.github.oauth.serverMetadata.token_endpoint).toBe("https://example.com/token")

    const loaded = loadAgentsLayerConfig(layer)
    expect(loaded.langfuseSecretKey).toBe("sk-lf-secret")
    expect(loaded.modelPresets[0].apiKey).toBe("sk-model")
    expect(loaded.mcpConfig.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN).toBe("ghp_secret")
    expect(loaded.mcpConfig.mcpServers.github.headers.Authorization).toBe("Bearer server-secret")
    expect(loaded.mcpConfig.mcpServers.github.oauth.clientSecret).toBe("oauth-secret")
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
