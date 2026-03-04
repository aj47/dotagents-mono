/**
 * BundleService - Export/Import agent configurations as portable .dotagents bundles.
 *
 * Phase 1: JSON-based bundle format with automatic secret stripping.
 * A .dotagents file is a JSON document containing a manifest plus embedded
 * agent profiles, MCP server configs, skills, repeat tasks, and memories.
 */

import fs from "fs"
import path from "path"
import { dialog, BrowserWindow, type OpenDialogOptions, type SaveDialogOptions } from "electron"
import type {
  AgentProfile,
  AgentSkill,
  AgentMemory,
  LoopConfig,
  AgentProfileConnectionType,
  AgentProfileRole,
} from "@shared/types"
import { getAgentsLayerPaths, type AgentsLayerPaths } from "./agents-files/modular-config"
import { loadAgentProfilesLayer, writeAgentsProfileFiles } from "./agents-files/agent-profiles"
import { loadAgentsSkillsLayer, writeAgentsSkillFile, skillIdToFilePath } from "./agents-files/skills"
import { loadAgentsMemoriesLayer, writeAgentsMemoryFile, memoryIdToFilePath } from "./agents-files/memories"
import { loadTasksLayer, writeTaskFile, taskIdToFilePath } from "./agents-files/tasks"
import { safeReadJsonFileSync, safeWriteJsonFileSync } from "./agents-files/safe-file"
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
    repeatTasks: number
    memories: number
  }
}

export interface BundleAgentProfile {
  id: string
  name: string
  displayName?: string
  description?: string
  enabled: boolean
  role?: AgentProfileRole
  systemPrompt?: string
  guidelines?: string
  connection: {
    type: AgentProfileConnectionType
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
  instructions: string
  source?: string
}

export interface BundleRepeatTask {
  id: string
  name: string
  prompt: string
  intervalMinutes: number
  enabled: boolean
  runOnStartup?: boolean
  // profileId omitted — the profile may not exist in the target environment
}

export interface BundleMemory {
  id: string
  title: string
  content: string
  importance: "low" | "medium" | "high" | "critical"
  tags: string[]
  keyFindings?: string[]
  userNotes?: string
}

export interface DotAgentsBundle {
  manifest: BundleManifest
  agentProfiles: BundleAgentProfile[]
  mcpServers: BundleMCPServer[]
  skills: BundleSkill[]
  repeatTasks: BundleRepeatTask[]
  memories: BundleMemory[]
}

export interface ExportBundleResult {
  success: boolean
  bundle?: DotAgentsBundle
  error?: string
}

export interface ExportBundleToFileResult {
  success: boolean
  filePath: string | null
  canceled: boolean
  error?: string
}

export interface BundleComponentSelection {
  agentProfiles?: boolean
  mcpServers?: boolean
  skills?: boolean
  repeatTasks?: boolean
  memories?: boolean
}

export interface ExportBundleOptions {
  name?: string
  description?: string
  components?: BundleComponentSelection
  skillIds?: string[]
}

// ============================================================================
// Import Types
// ============================================================================

export type ImportConflictStrategy = "skip" | "overwrite" | "rename"

export interface ImportOptions {
  /** How to handle conflicts when an item with the same ID already exists */
  conflictStrategy: ImportConflictStrategy
  /** Components to import (defaults to all) */
  components?: {
    agentProfiles?: boolean
    mcpServers?: boolean
    skills?: boolean
    repeatTasks?: boolean
    memories?: boolean
  }
}

export interface ImportItemResult {
  id: string
  name: string
  action: "imported" | "skipped" | "renamed" | "overwritten"
  newId?: string // Only set if renamed
  error?: string
}

export interface ImportBundleResult {
  success: boolean
  agentProfiles: ImportItemResult[]
  mcpServers: ImportItemResult[]
  skills: ImportItemResult[]
  repeatTasks: ImportItemResult[]
  memories: ImportItemResult[]
  errors: string[]
}

// ============================================================================
// Preview Types
// ============================================================================

export interface PreviewConflict {
  id: string
  name: string
  existingName?: string
}

export interface BundlePreviewResult {
  success: boolean
  filePath?: string
  bundle?: DotAgentsBundle
  conflicts?: {
    agentProfiles: PreviewConflict[]
    mcpServers: PreviewConflict[]
    skills: PreviewConflict[]
    repeatTasks: PreviewConflict[]
    memories: PreviewConflict[]
  }
  error?: string
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
const TOP_LEVEL_MCP_CONFIG_KEYS = [
  "mcpDisabledTools",
  "mcpRuntimeDisabledServers",
  "mcpToolsCollapsedServers",
  "mcpServersCollapsedServers",
] as const
const MCP_SERVER_CONFIG_KEYS = [
  "transport",
  "command",
  "args",
  "env",
  "url",
  "headers",
  "oauth",
  "timeout",
  "disabled",
] as const
const AGENT_PROFILE_CONNECTION_TYPES = ["internal", "acp", "stdio", "remote"] as const
const AGENT_PROFILE_ROLES = ["user-profile", "delegation-target", "external-agent"] as const

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

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

function isLikelyMcpServerConfig(value: unknown): value is Record<string, unknown> {
  if (!isRecordObject(value)) return false
  const keys = Object.keys(value)
  if (keys.length === 0) return true
  return keys.some((key) => (MCP_SERVER_CONFIG_KEYS as readonly string[]).includes(key))
}

function readLegacyTopLevelMcpServers(mcpJson: Record<string, unknown>): Record<string, unknown> {
  const legacyServers: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(mcpJson)) {
    if (key === "mcpConfig" || key === "mcpServers") continue
    if ((TOP_LEVEL_MCP_CONFIG_KEYS as readonly string[]).includes(key)) continue
    // Reserve future top-level `mcp*` config keys.
    if (key.startsWith("mcp")) continue
    if (!isRecordObject(value)) continue

    // Accept unknown object shapes as legacy servers for backward compatibility.
    if (!isLikelyMcpServerConfig(value)) {
      legacyServers[key] = value
      continue
    }

    legacyServers[key] = value
  }

  return legacyServers
}

function readMcpServersFromConfig(mcpJson: Record<string, unknown>): Record<string, unknown> {
  const nestedMcpConfig = mcpJson.mcpConfig
  if (isRecordObject(nestedMcpConfig)) {
    const nestedServers = (nestedMcpConfig as Record<string, unknown>).mcpServers
    if (isRecordObject(nestedServers)) {
      return nestedServers as Record<string, unknown>
    }
  }

  const topLevelServers = mcpJson.mcpServers
  if (isRecordObject(topLevelServers)) {
    return topLevelServers as Record<string, unknown>
  }

  return readLegacyTopLevelMcpServers(mcpJson)
}

function writeCanonicalMcpConfig(
  mcpJson: Record<string, unknown>,
  mcpServers: Record<string, unknown>
): Record<string, unknown> {
  const nextMcpJson = { ...mcpJson }
  delete nextMcpJson.mcpServers

  // Remove legacy top-level server entries so we only persist canonical mcpConfig.mcpServers.
  const legacyTopLevelServers = readLegacyTopLevelMcpServers(mcpJson)
  for (const legacyServerName of Object.keys(legacyTopLevelServers)) {
    delete nextMcpJson[legacyServerName]
  }

  // Also remove any top-level keys that match canonical server names to avoid duplicates.
  for (const serverName of Object.keys(mcpServers)) {
    if (serverName === "mcpConfig" || serverName === "mcpServers") continue
    if ((TOP_LEVEL_MCP_CONFIG_KEYS as readonly string[]).includes(serverName)) continue
    delete nextMcpJson[serverName]
  }

  const existingMcpConfig =
    isRecordObject(nextMcpJson.mcpConfig)
      ? { ...(nextMcpJson.mcpConfig as Record<string, unknown>) }
      : {}

  delete existingMcpConfig.mcpServers

  return {
    ...nextMcpJson,
    mcpConfig: {
      ...existingMcpConfig,
      mcpServers,
    },
  }
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

function loadMCPServersForBundle(layer: AgentsLayerPaths): BundleMCPServer[] {
  const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
    defaultValue: {},
  })

  const servers: BundleMCPServer[] = []
  const mcpServers = readMcpServersFromConfig(mcpConfig)

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

const DEFAULT_EXPORT_COMPONENTS: Required<BundleComponentSelection> = {
  agentProfiles: true,
  mcpServers: true,
  skills: true,
  repeatTasks: true,
  memories: true,
}

function loadSkillsForBundle(layer: AgentsLayerPaths, options?: { skillIds?: string[] }): BundleSkill[] {
  const skillsResult = loadAgentsSkillsLayer(layer)
  const selectedSkillIds = options?.skillIds?.length ? new Set(options.skillIds) : null

  return skillsResult.skills
    .filter(skill => !selectedSkillIds || selectedSkillIds.has(skill.id))
    .map((skill): BundleSkill => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    instructions: skill.instructions,
    source: skill.source || "local",
    }))
}

function loadRepeatTasksForBundle(layer: AgentsLayerPaths): BundleRepeatTask[] {
  const tasksResult = loadTasksLayer(layer)
  return tasksResult.tasks.map((task): BundleRepeatTask => ({
    id: task.id,
    name: task.name,
    prompt: task.prompt,
    intervalMinutes: task.intervalMinutes,
    enabled: task.enabled,
    runOnStartup: task.runOnStartup,
    // profileId intentionally omitted — may not exist in target environment
  }))
}

function loadMemoriesForBundle(layer: AgentsLayerPaths): BundleMemory[] {
  const memoriesResult = loadAgentsMemoriesLayer(layer)
  return memoriesResult.memories.map((memory): BundleMemory => ({
    id: memory.id,
    title: memory.title,
    content: memory.content,
    importance: memory.importance,
    tags: memory.tags,
    keyFindings: memory.keyFindings,
    userNotes: memory.userNotes,
  }))
}

export async function exportBundle(
  agentsDir: string,
  options?: ExportBundleOptions
): Promise<DotAgentsBundle> {
  const layer = getAgentsLayerPaths(agentsDir)
  const components = { ...DEFAULT_EXPORT_COMPONENTS, ...options?.components }

  const profiles = components.agentProfiles
    ? loadAgentProfilesLayer(layer).profiles.map(sanitizeAgentProfile)
    : []
  const mcpServers = components.mcpServers ? loadMCPServersForBundle(layer) : []
  const skills = components.skills ? loadSkillsForBundle(layer, { skillIds: options?.skillIds }) : []
  const repeatTasks = components.repeatTasks ? loadRepeatTasksForBundle(layer) : []
  const memories = components.memories ? loadMemoriesForBundle(layer) : []

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
        repeatTasks: repeatTasks.length,
        memories: memories.length,
      },
    },
    agentProfiles: profiles,
    mcpServers,
    skills,
    repeatTasks,
    memories,
  }

  logApp("[bundle-service] Exported bundle", {
    profiles: profiles.length,
    mcpServers: mcpServers.length,
    skills: skills.length,
    repeatTasks: repeatTasks.length,
    memories: memories.length,
  })

  return bundle
}

export async function exportBundleToFile(
  agentsDir: string,
  options?: ExportBundleOptions
): Promise<ExportBundleToFileResult> {
  let bundle: DotAgentsBundle
  try {
    bundle = await exportBundle(agentsDir, options)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logApp("[bundle-service] Failed to prepare bundle export", { error })
    return { success: false, filePath: null, canceled: false, error: errorMessage }
  }

  const bundleJson = JSON.stringify(bundle, null, 2)

  const saveDialogOptions: SaveDialogOptions = {
    title: "Export Agent Configuration",
    defaultPath: `${bundle.manifest.name.replace(/[^a-zA-Z0-9-_ ]/g, "")}.dotagents`,
    filters: [
      { name: "DotAgents Bundle", extensions: ["dotagents"] },
      { name: "JSON", extensions: ["json"] },
    ],
  }
  let result: Awaited<ReturnType<typeof dialog.showSaveDialog>>
  try {
    const win = BrowserWindow.getFocusedWindow()
    result = win
      ? await dialog.showSaveDialog(win, saveDialogOptions)
      : await dialog.showSaveDialog(saveDialogOptions)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logApp("[bundle-service] Failed to open save dialog", { error })
    return { success: false, filePath: null, canceled: false, error: errorMessage }
  }

  if (result.canceled || !result.filePath) {
    return { success: false, filePath: null, canceled: true }
  }

  try {
    fs.writeFileSync(result.filePath, bundleJson, "utf-8")
    logApp("[bundle-service] Bundle saved to", { filePath: result.filePath })
    return { success: true, filePath: result.filePath, canceled: false }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logApp("[bundle-service] Failed to save bundle", { filePath: result.filePath, error })
    return { success: false, filePath: null, canceled: false, error: errorMessage }
  }
}

// ============================================================================
// Preview (for import)
// ============================================================================

function isSupportedBundleFile(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase()
  return BUNDLE_FILE_EXTENSIONS.has(extension)
}

type LegacyBundleManifestComponents = Omit<BundleManifest["components"], "repeatTasks" | "memories"> & {
  repeatTasks?: number
  memories?: number
}

type LegacyDotAgentsBundle = Omit<DotAgentsBundle, "manifest" | "repeatTasks" | "memories"> & {
  manifest: Omit<BundleManifest, "components"> & {
    components: LegacyBundleManifestComponents
  }
  repeatTasks?: BundleRepeatTask[]
  memories?: BundleMemory[]
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string"
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isAgentProfileConnectionType(value: unknown): value is AgentProfileConnectionType {
  return typeof value === "string" && (AGENT_PROFILE_CONNECTION_TYPES as readonly string[]).includes(value)
}

function isAgentProfileRole(value: unknown): value is AgentProfileRole {
  return typeof value === "string" && (AGENT_PROFILE_ROLES as readonly string[]).includes(value)
}

function isBundleAgentProfile(value: unknown): value is BundleAgentProfile {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.id)) return false
  if (!isNonEmptyString(value.name)) return false
  if (typeof value.enabled !== "boolean") return false
  if (!isOptionalString(value.displayName)) return false
  if (!isOptionalString(value.description)) return false
  if (value.role !== undefined && !isAgentProfileRole(value.role)) return false
  if (!isOptionalString(value.systemPrompt)) return false
  if (!isOptionalString(value.guidelines)) return false
  if (!isRecordObject(value.connection)) return false
  return isAgentProfileConnectionType(value.connection.type)
}

function isBundleMcpServer(value: unknown): value is BundleMCPServer {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.name)) return false
  if (!isOptionalString(value.command)) return false
  if (!isOptionalString(value.transport)) return false
  if (value.args !== undefined && !isStringArray(value.args)) return false
  if (value.enabled !== undefined && typeof value.enabled !== "boolean") return false
  return true
}

function isBundleSkill(value: unknown): value is BundleSkill {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.id)) return false
  if (!isNonEmptyString(value.name)) return false
  if (!isOptionalString(value.description)) return false
  return typeof value.instructions === "string"
}

function isBundleRepeatTask(value: unknown): value is BundleRepeatTask {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.id)) return false
  if (!isNonEmptyString(value.name)) return false
  if (typeof value.prompt !== "string") return false
  if (!isNonNegativeFiniteNumber(value.intervalMinutes)) return false
  if (typeof value.enabled !== "boolean") return false
  return value.runOnStartup === undefined || typeof value.runOnStartup === "boolean"
}

function isBundleMemory(value: unknown): value is BundleMemory {
  if (!isRecordObject(value)) return false
  if (!isNonEmptyString(value.id)) return false
  if (!isNonEmptyString(value.title)) return false
  if (typeof value.content !== "string") return false
  if (!["low", "medium", "high", "critical"].includes(String(value.importance))) return false
  if (!isStringArray(value.tags)) return false
  if (value.keyFindings !== undefined && !isStringArray(value.keyFindings)) return false
  return value.userNotes === undefined || typeof value.userNotes === "string"
}

function hasValidManifestComponents(value: unknown): value is LegacyBundleManifestComponents {
  if (!isRecordObject(value)) return false
  if (!isNonNegativeFiniteNumber(value.agentProfiles)) return false
  if (!isNonNegativeFiniteNumber(value.mcpServers)) return false
  if (!isNonNegativeFiniteNumber(value.skills)) return false
  if (value.repeatTasks !== undefined && !isNonNegativeFiniteNumber(value.repeatTasks)) return false
  if (value.memories !== undefined && !isNonNegativeFiniteNumber(value.memories)) return false
  return true
}

function validateBundle(bundle: unknown): bundle is LegacyDotAgentsBundle {
  if (!bundle || typeof bundle !== "object") return false
  const b = bundle as Record<string, unknown>
  if (!b.manifest || typeof b.manifest !== "object") return false
  const m = b.manifest as Record<string, unknown>
  if (m.version !== 1) return false
  if (!isNonEmptyString(m.name)) return false
  if (!isOptionalString(m.description)) return false
  if (typeof m.createdAt !== "string" || Number.isNaN(Date.parse(m.createdAt))) return false
  if (!isNonEmptyString(m.exportedFrom)) return false
  if (!hasValidManifestComponents(m.components)) return false
  if (!Array.isArray(b.agentProfiles) || !b.agentProfiles.every(isBundleAgentProfile)) return false
  if (!Array.isArray(b.mcpServers) || !b.mcpServers.every(isBundleMcpServer)) return false
  if (!Array.isArray(b.skills) || !b.skills.every(isBundleSkill)) return false
  if ("repeatTasks" in b && b.repeatTasks !== undefined) {
    if (!Array.isArray(b.repeatTasks) || !b.repeatTasks.every(isBundleRepeatTask)) return false
  }
  if ("memories" in b && b.memories !== undefined) {
    if (!Array.isArray(b.memories) || !b.memories.every(isBundleMemory)) return false
  }
  return true
}

function normalizeBundle(bundle: LegacyDotAgentsBundle): DotAgentsBundle {
  const repeatTasks = Array.isArray(bundle.repeatTasks) ? bundle.repeatTasks : []
  const memories = Array.isArray(bundle.memories) ? bundle.memories : []
  const rawComponents = isRecordObject(bundle.manifest.components)
    ? (bundle.manifest.components as Record<string, unknown>)
    : {}
  const countOrFallback = (value: unknown, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback

  return {
    ...bundle,
    manifest: {
      ...bundle.manifest,
      components: {
        agentProfiles: countOrFallback(rawComponents.agentProfiles, bundle.agentProfiles.length),
        mcpServers: countOrFallback(rawComponents.mcpServers, bundle.mcpServers.length),
        skills: countOrFallback(rawComponents.skills, bundle.skills.length),
        repeatTasks: countOrFallback(rawComponents.repeatTasks, repeatTasks.length),
        memories: countOrFallback(rawComponents.memories, memories.length),
      },
    },
    repeatTasks,
    memories,
  }
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
    const parsed = JSON.parse(content) as unknown

    if (!validateBundle(parsed)) {
      throw new Error("Invalid bundle format or unsupported version")
    }

    return normalizeBundle(parsed)
  } catch (error) {
    logApp("[bundle-service] Failed to preview bundle", { filePath, error })
    return null
  }
}

/**
 * Preview a bundle and detect conflicts with existing items in the target layer.
 */
export function previewBundleWithConflicts(
  filePath: string,
  targetAgentsDir: string
): BundlePreviewResult {
  const bundle = previewBundle(filePath)
  if (!bundle) {
    return { success: false, error: "Failed to parse bundle file" }
  }

  const layer = getAgentsLayerPaths(targetAgentsDir)

  // Load existing items
  const existingProfiles = loadAgentProfilesLayer(layer)
  const existingSkills = loadAgentsSkillsLayer(layer)
  const existingTasks = loadTasksLayer(layer)
  const existingMemories = loadAgentsMemoriesLayer(layer)

  // Load existing MCP servers
  const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
    defaultValue: {},
  })
  const existingMcpServers = new Set(Object.keys(readMcpServersFromConfig(mcpConfig)))

  // Detect conflicts
  const conflicts = {
    agentProfiles: bundle.agentProfiles
      .filter(p => existingProfiles.originById.has(p.id))
      .map(p => {
        const existing = existingProfiles.profiles.find(ep => ep.id === p.id)
        return { id: p.id, name: p.name, existingName: existing?.name }
      }),
    mcpServers: bundle.mcpServers
      .filter(s => existingMcpServers.has(s.name))
      .map(s => ({ id: s.name, name: s.name })),
    skills: bundle.skills
      .filter(s => existingSkills.originById.has(s.id))
      .map(s => {
        const existing = existingSkills.skills.find(es => es.id === s.id)
        return { id: s.id, name: s.name, existingName: existing?.name }
      }),
    repeatTasks: bundle.repeatTasks
      .filter(t => existingTasks.originById.has(t.id))
      .map(t => {
        const existing = existingTasks.tasks.find(et => et.id === t.id)
        return { id: t.id, name: t.name, existingName: existing?.name }
      }),
    memories: bundle.memories
      .filter(m => existingMemories.originById.has(m.id))
      .map(m => {
        const existing = existingMemories.memories.find(em => em.id === m.id)
        return { id: m.id, name: m.title, existingName: existing?.title }
      }),
  }

  return { success: true, filePath, bundle, conflicts }
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

// ============================================================================
// Import
// ============================================================================

/**
 * Generate a unique ID by appending a suffix.
 * Used when renaming conflicting items during import.
 */
function generateUniqueId(baseId: string, existingIds: Set<string>): string {
  let counter = 1
  let newId = `${baseId}_imported`
  while (existingIds.has(newId)) {
    counter++
    newId = `${baseId}_imported_${counter}`
  }
  return newId
}

/**
 * Import a bundle into the target .agents directory.
 * Handles conflicts according to the specified strategy.
 */
export async function importBundle(
  filePath: string,
  targetAgentsDir: string,
  options: ImportOptions
): Promise<ImportBundleResult> {
  const result: ImportBundleResult = {
    success: false,
    agentProfiles: [],
    mcpServers: [],
    skills: [],
    repeatTasks: [],
    memories: [],
    errors: [],
  }

  // Parse bundle
  const bundle = previewBundle(filePath)
  if (!bundle) {
    result.errors.push("Failed to parse bundle file")
    return result
  }

  const layer = getAgentsLayerPaths(targetAgentsDir)
  const { conflictStrategy } = options
  const components = options.components ?? {
    agentProfiles: true,
    mcpServers: true,
    skills: true,
    repeatTasks: true,
    memories: true,
  }

  // Ensure directories exist
  fs.mkdirSync(targetAgentsDir, { recursive: true })

  // Import agent profiles
  if (components.agentProfiles !== false) {
    const existingProfiles = loadAgentProfilesLayer(layer)
    const existingIds = new Set(existingProfiles.profiles.map(p => p.id))

    for (const bundleProfile of bundle.agentProfiles) {
      try {
        const exists = existingIds.has(bundleProfile.id)

        if (exists && conflictStrategy === "skip") {
          result.agentProfiles.push({
            id: bundleProfile.id,
            name: bundleProfile.name,
            action: "skipped",
          })
          continue
        }

        let finalId = bundleProfile.id
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalId = generateUniqueId(bundleProfile.id, existingIds)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        // Convert bundle profile to full AgentProfile
        const now = Date.now()
        const fullProfile: AgentProfile = {
          id: finalId,
          name: bundleProfile.name,
          displayName: bundleProfile.displayName || bundleProfile.name,
          description: bundleProfile.description,
          systemPrompt: bundleProfile.systemPrompt,
          guidelines: bundleProfile.guidelines,
          connection: { type: bundleProfile.connection.type },
          role: bundleProfile.role,
          enabled: bundleProfile.enabled,
          createdAt: now,
          updatedAt: now,
        }

        writeAgentsProfileFiles(layer, fullProfile)
        existingIds.add(finalId)

        result.agentProfiles.push({
          id: bundleProfile.id,
          name: bundleProfile.name,
          action,
          newId: action === "renamed" ? finalId : undefined,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        result.agentProfiles.push({
          id: bundleProfile.id,
          name: bundleProfile.name,
          action: "skipped",
          error: msg,
        })
        result.errors.push(`Agent profile "${bundleProfile.name}": ${msg}`)
      }
    }
  }

  // Import MCP servers
  if (components.mcpServers !== false) {
    try {
      const mcpConfig = safeReadJsonFileSync<Record<string, unknown>>(layer.mcpJsonPath, {
        defaultValue: {},
      })
      const mcpServers = { ...readMcpServersFromConfig(mcpConfig) }
      const existingNames = new Set(Object.keys(mcpServers))
      let modified = false

      for (const bundleServer of bundle.mcpServers) {
        const exists = existingNames.has(bundleServer.name)

        if (exists && conflictStrategy === "skip") {
          result.mcpServers.push({
            id: bundleServer.name,
            name: bundleServer.name,
            action: "skipped",
          })
          continue
        }

        let finalName = bundleServer.name
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalName = generateUniqueId(bundleServer.name, existingNames)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        // Build server config
        const serverConfig: Record<string, unknown> = {}
        if (bundleServer.command) serverConfig.command = bundleServer.command
        if (bundleServer.args) serverConfig.args = bundleServer.args
        if (bundleServer.transport) serverConfig.transport = bundleServer.transport
        if (bundleServer.enabled === false) serverConfig.disabled = true

        mcpServers[finalName] = serverConfig
        existingNames.add(finalName)
        modified = true

        result.mcpServers.push({
          id: bundleServer.name,
          name: bundleServer.name,
          action,
          newId: action === "renamed" ? finalName : undefined,
        })
      }

      if (modified) {
        const newMcpConfig = writeCanonicalMcpConfig(mcpConfig, mcpServers)
        safeWriteJsonFileSync(layer.mcpJsonPath, newMcpConfig, {
          backupDir: layer.backupsDir,
          maxBackups: 10,
          pretty: true,
        })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      result.errors.push(`MCP servers import failed: ${msg}`)
    }
  }

  // Import skills
  if (components.skills !== false) {
    const existingSkills = loadAgentsSkillsLayer(layer)
    const existingIds = new Set(existingSkills.skills.map(s => s.id))

    for (const bundleSkill of bundle.skills) {
      try {
        const exists = existingIds.has(bundleSkill.id)

        if (exists && conflictStrategy === "skip") {
          result.skills.push({
            id: bundleSkill.id,
            name: bundleSkill.name,
            action: "skipped",
          })
          continue
        }

        let finalId = bundleSkill.id
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalId = generateUniqueId(bundleSkill.id, existingIds)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        const now = Date.now()
        const fullSkill: AgentSkill = {
          id: finalId,
          name: bundleSkill.name,
          description: bundleSkill.description || "",
          instructions: bundleSkill.instructions || "",
          createdAt: now,
          updatedAt: now,
          source: "imported",
        }

        // Create skill directory and write file
        const skillDir = path.join(layer.agentsDir, "skills", finalId)
        fs.mkdirSync(skillDir, { recursive: true })
        writeAgentsSkillFile(layer, fullSkill)
        existingIds.add(finalId)

        result.skills.push({
          id: bundleSkill.id,
          name: bundleSkill.name,
          action,
          newId: action === "renamed" ? finalId : undefined,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        result.skills.push({
          id: bundleSkill.id,
          name: bundleSkill.name,
          action: "skipped",
          error: msg,
        })
        result.errors.push(`Skill "${bundleSkill.name}": ${msg}`)
      }
    }
  }

  // Import repeat tasks
  if (components.repeatTasks !== false) {
    const existingTasks = loadTasksLayer(layer)
    const existingIds = new Set(existingTasks.tasks.map(t => t.id))

    for (const bundleTask of bundle.repeatTasks) {
      try {
        const exists = existingIds.has(bundleTask.id)

        if (exists && conflictStrategy === "skip") {
          result.repeatTasks.push({
            id: bundleTask.id,
            name: bundleTask.name,
            action: "skipped",
          })
          continue
        }

        let finalId = bundleTask.id
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalId = generateUniqueId(bundleTask.id, existingIds)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        const fullTask: LoopConfig = {
          id: finalId,
          name: bundleTask.name,
          prompt: bundleTask.prompt,
          intervalMinutes: bundleTask.intervalMinutes,
          enabled: bundleTask.enabled,
          runOnStartup: bundleTask.runOnStartup,
          // profileId intentionally not imported — may not exist in target
        }

        writeTaskFile(layer, fullTask)
        existingIds.add(finalId)

        result.repeatTasks.push({
          id: bundleTask.id,
          name: bundleTask.name,
          action,
          newId: action === "renamed" ? finalId : undefined,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        result.repeatTasks.push({
          id: bundleTask.id,
          name: bundleTask.name,
          action: "skipped",
          error: msg,
        })
        result.errors.push(`Repeat task "${bundleTask.name}": ${msg}`)
      }
    }
  }

  // Import memories
  if (components.memories !== false) {
    const existingMemories = loadAgentsMemoriesLayer(layer)
    const existingIds = new Set(existingMemories.memories.map(m => m.id))

    for (const bundleMemory of bundle.memories) {
      try {
        const exists = existingIds.has(bundleMemory.id)

        if (exists && conflictStrategy === "skip") {
          result.memories.push({
            id: bundleMemory.id,
            name: bundleMemory.title,
            action: "skipped",
          })
          continue
        }

        let finalId = bundleMemory.id
        let action: ImportItemResult["action"] = "imported"

        if (exists && conflictStrategy === "rename") {
          finalId = generateUniqueId(bundleMemory.id, existingIds)
          action = "renamed"
        } else if (exists && conflictStrategy === "overwrite") {
          action = "overwritten"
        }

        const now = Date.now()
        const fullMemory: AgentMemory = {
          id: finalId,
          title: bundleMemory.title,
          content: bundleMemory.content,
          importance: bundleMemory.importance,
          tags: bundleMemory.tags || [],
          keyFindings: bundleMemory.keyFindings,
          userNotes: bundleMemory.userNotes,
          createdAt: now,
          updatedAt: now,
        }

        // Create memories directory and write file
        const memoriesDir = path.join(layer.agentsDir, "memories")
        fs.mkdirSync(memoriesDir, { recursive: true })
        writeAgentsMemoryFile(layer, fullMemory)
        existingIds.add(finalId)

        result.memories.push({
          id: bundleMemory.id,
          name: bundleMemory.title,
          action,
          newId: action === "renamed" ? finalId : undefined,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        result.memories.push({
          id: bundleMemory.id,
          name: bundleMemory.title,
          action: "skipped",
          error: msg,
        })
        result.errors.push(`Memory "${bundleMemory.title}": ${msg}`)
      }
    }
  }

  result.success = result.errors.length === 0

  logApp("[bundle-service] Import completed", {
    success: result.success,
    profiles: result.agentProfiles.length,
    mcpServers: result.mcpServers.length,
    skills: result.skills.length,
    repeatTasks: result.repeatTasks.length,
    memories: result.memories.length,
    errors: result.errors.length,
  })

  return result
}

/**
 * Import a bundle from a file dialog, with preview and conflict detection.
 */
export async function importBundleFromDialog(
  targetAgentsDir: string,
  options: ImportOptions
): Promise<{
  filePath: string
  result: ImportBundleResult
} | null> {
  const openDialogOptions: OpenDialogOptions = {
    title: "Import Agent Configuration Bundle",
    properties: ["openFile"],
    filters: [{ name: "DotAgents Bundle", extensions: ["dotagents", "json"] }],
  }

  const win = BrowserWindow.getFocusedWindow()
  const dialogResult = win
    ? await dialog.showOpenDialog(win, openDialogOptions)
    : await dialog.showOpenDialog(openDialogOptions)

  if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
    return null
  }

  const selectedPath = dialogResult.filePaths[0]
  const importResult = await importBundle(selectedPath, targetAgentsDir, options)

  return { filePath: selectedPath, result: importResult }
}
