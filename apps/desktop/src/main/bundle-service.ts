/**
 * BundleService - Export/Import agent configurations as portable .dotagents bundles.
 *
 * Phase 1: JSON-based bundle format with automatic secret stripping.
 * A .dotagents file is a JSON document containing a manifest plus embedded
 * agent profiles, MCP server configs, and skills metadata.
 */

import fs from "fs"
import path from "path"
import { dialog, BrowserWindow, type OpenDialogOptions, type SaveDialogOptions } from "electron"
import type { AgentProfile } from "@shared/types"
import { getAgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer } from "./agents-files/agent-profiles"
import { safeReadJsonFileSync } from "./agents-files/safe-file"
import { logApp } from "./debug"

// ============================================================================
// Types
// ============================================================================

export interface BundleManifest {
  version: 1
  name: string
  description?: string
  createdAt: string
  exportedFrom: string
  components: {
    agentProfiles: number
    mcpServers: number
    skills: number
  }
}

export interface BundleAgentProfile {
  id: string
  name: string
  displayName?: string
  description?: string
  enabled: boolean
  role?: string
  systemPrompt?: string
  guidelines?: string
  connection: {
    type: string
    // Secrets stripped — no API keys, tokens, or passwords
  }
}

export interface BundleMCPServer {
  name: string
  command?: string
  args?: string[]
  transport?: string
  // URL/keys stripped
  enabled?: boolean
}

export interface BundleSkill {
  id: string
  name: string
  description?: string
  source?: string
}

export interface DotAgentsBundle {
  manifest: BundleManifest
  agentProfiles: BundleAgentProfile[]
  mcpServers: BundleMCPServer[]
  skills: BundleSkill[]
}

// ============================================================================
// Secret stripping
// ============================================================================

const SECRET_PATTERNS = [
  /key/i,
  /token/i,
  /secret/i,
  /password/i,
  /credential/i,
  /auth/i,
  /bearer/i,
]

const BUNDLE_FILE_EXTENSIONS = new Set([".dotagents", ".json"])

function isSecretKey(key: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(key))
}

function stripSecretsFromValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripSecretsFromValue(item))
  }

  if (typeof value === "object" && value !== null) {
    return stripSecretsFromObject(value as Record<string, unknown>)
  }

  return value
}

function stripSecretsFromObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isSecretKey(key) && typeof value === "string" && value.length > 0) {
      result[key] = "<CONFIGURE_YOUR_KEY>"
    } else {
      result[key] = stripSecretsFromValue(value)
    }
  }
  return result
}

// ============================================================================
// Export
// ============================================================================

function sanitizeAgentProfile(profile: AgentProfile): BundleAgentProfile {
  const sanitized: BundleAgentProfile = {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName,
    description: profile.description,
    enabled: profile.enabled,
    role: profile.role,
    systemPrompt: profile.systemPrompt,
    guidelines: profile.guidelines,
    connection: {
      type: profile.connection?.type || "internal",
    },
  }
  return sanitized
}

function loadMCPServers(agentsDir: string): BundleMCPServer[] {
  const layer = getAgentsLayerPaths(agentsDir)
  const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
    defaultValue: {},
  })

  const servers: BundleMCPServer[] = []
  const mcpServers = (mcpConfig as any)?.mcpServers || mcpConfig

  if (typeof mcpServers === "object" && mcpServers !== null) {
    for (const [name, config] of Object.entries(mcpServers)) {
      if (typeof config !== "object" || config === null) continue
      const serverConfig = config as Record<string, unknown>

      // Strip secrets from the server config
      const stripped = stripSecretsFromObject(serverConfig)

      servers.push({
        name,
        command: typeof stripped.command === "string" ? stripped.command : undefined,
        args: Array.isArray(stripped.args) ? stripped.args.map(String) : undefined,
        transport: typeof stripped.transport === "string" ? stripped.transport : undefined,
        enabled: typeof stripped.disabled === "boolean" ? !stripped.disabled : true,
      })
    }
  }

  return servers
}

function loadSkillsMetadata(agentsDir: string): BundleSkill[] {
  const skillsDir = path.join(agentsDir, "skills")
  if (!fs.existsSync(skillsDir)) return []

  const skills: BundleSkill[] = []
  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const skillMdPath = path.join(skillsDir, entry.name, "skill.md")
      if (fs.existsSync(skillMdPath)) {
        skills.push({
          id: entry.name,
          name: entry.name,
          description: `Skill from ${entry.name}`,
          source: "local",
        })
      }
    }
  } catch {
    // Skills directory not readable
  }

  return skills
}

export async function exportBundle(
  agentsDir: string,
  options?: { name?: string; description?: string }
): Promise<DotAgentsBundle> {
  const layer = getAgentsLayerPaths(agentsDir)
  const profilesResult = loadAgentProfilesLayer(layer)
  const profiles = profilesResult.profiles.map(sanitizeAgentProfile)
  const mcpServers = loadMCPServers(agentsDir)
  const skills = loadSkillsMetadata(agentsDir)

  const bundle: DotAgentsBundle = {
    manifest: {
      version: 1,
      name: options?.name || "My Agent Configuration",
      description: options?.description,
      createdAt: new Date().toISOString(),
      exportedFrom: "dotagents-desktop",
      components: {
        agentProfiles: profiles.length,
        mcpServers: mcpServers.length,
        skills: skills.length,
      },
    },
    agentProfiles: profiles,
    mcpServers,
    skills,
  }

  logApp("[bundle-service] Exported bundle", {
    profiles: profiles.length,
    mcpServers: mcpServers.length,
    skills: skills.length,
  })

  return bundle
}

export async function exportBundleToFile(
  agentsDir: string,
  options?: { name?: string; description?: string }
): Promise<string | null> {
  const bundle = await exportBundle(agentsDir, options)
  const bundleJson = JSON.stringify(bundle, null, 2)

  const saveDialogOptions: SaveDialogOptions = {
    title: "Export Agent Configuration",
    defaultPath: `${bundle.manifest.name.replace(/[^a-zA-Z0-9-_ ]/g, "")}.dotagents`,
    filters: [
      { name: "DotAgents Bundle", extensions: ["dotagents"] },
      { name: "JSON", extensions: ["json"] },
    ],
  }
  const win = BrowserWindow.getFocusedWindow()
  const result = win
    ? await dialog.showSaveDialog(win, saveDialogOptions)
    : await dialog.showSaveDialog(saveDialogOptions)

  if (result.canceled || !result.filePath) {
    return null
  }

  try {
    fs.writeFileSync(result.filePath, bundleJson, "utf-8")
    logApp("[bundle-service] Bundle saved to", { filePath: result.filePath })
    return result.filePath
  } catch (error) {
    logApp("[bundle-service] Failed to save bundle", { filePath: result.filePath, error })
    return null
  }
}

// ============================================================================
// Preview (for import)
// ============================================================================

function isSupportedBundleFile(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase()
  return BUNDLE_FILE_EXTENSIONS.has(extension)
}

export function previewBundle(filePath: string): DotAgentsBundle | null {
  try {
    const normalizedPath = path.resolve(filePath)
    if (!isSupportedBundleFile(normalizedPath)) {
      throw new Error("Unsupported bundle file extension")
    }

    const stats = fs.statSync(normalizedPath)
    if (!stats.isFile()) {
      throw new Error("Bundle path must be a file")
    }

    const content = fs.readFileSync(normalizedPath, "utf-8")
    const bundle = JSON.parse(content) as DotAgentsBundle

    // Basic validation
    if (!bundle.manifest || bundle.manifest.version !== 1) {
      throw new Error("Invalid bundle format or unsupported version")
    }

    return bundle
  } catch (error) {
    logApp("[bundle-service] Failed to preview bundle", { filePath, error })
    return null
  }
}

export async function previewBundleFromDialog(): Promise<{
  filePath: string
  bundle: DotAgentsBundle
} | null> {
  const openDialogOptions: OpenDialogOptions = {
    title: "Select Agent Configuration Bundle",
    properties: ["openFile"],
    filters: [{ name: "DotAgents Bundle", extensions: ["dotagents", "json"] }],
  }
  const win = BrowserWindow.getFocusedWindow()
  const result = win
    ? await dialog.showOpenDialog(win, openDialogOptions)
    : await dialog.showOpenDialog(openDialogOptions)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const selectedPath = result.filePaths[0]
  const bundle = previewBundle(selectedPath)
  if (!bundle) {
    return null
  }

  return { filePath: selectedPath, bundle }
}
