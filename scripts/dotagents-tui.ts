#!/usr/bin/env bun
import QRCode from "qrcode"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  TextAttributes,
  TextRenderable,
  createCliRenderer,
} from "@opentui/core"
import { getAgentsKnowledgeDir, getAgentsLayerPaths, getAgentsSkillsDir, getDebugFlags, getPrimaryAgentsKnowledgeDir, globalAgentsFolder, loadAgentsKnowledgeNotesLayer, loadAgentsSkillsLayer, loadTasksLayer, resolveWorkspaceAgentsFolder, skillIdToFilePath, taskIdToFilePath, writeAgentsSkillFile, writeKnowledgeNoteFile, writeTaskFile, type KnowledgeNote } from "@dotagents/core"
import { deleteSlot, getSandboxState, renameSlot, restoreBaseline, saveBaseline, saveCurrentAsSlot, switchToSlot } from "../apps/desktop/src/main/sandbox-service"
import { REMOTE_SERVER_API_PREFIX } from "@dotagents/shared/remote-server-api"
import { buildDotAgentsConfigDeepLink, ensureRemoteServerV1BaseUrl, redactSecretForDisplay } from "@dotagents/shared/remote-pairing"
import { ExtendedSettingsApiClient } from "@dotagents/shared/settings-api-client"
import { isInstalled as isLangfuseInstalled } from "../apps/desktop/src/main/langfuse-loader"
import { DEFAULT_SYSTEM_PROMPT } from "../apps/desktop/src/main/system-prompts-default"
type Config = Record<string, unknown> & { remoteServerPort?: number; remoteServerApiKey?: string }
type StreamHandlers = { step?: (title: string, description?: string) => void; text?: (text: string) => void; done?: (content: string, conversationId?: string) => void }
type ServerSettings = { url: string; apiKey: string; configPath: string; apiKeySource: string }
const SECRET_REF_PREFIX = "dotagents-secret://", SECRETS_LOCAL_JSON = "secrets.local.json"
const FOLDER_OPEN_TARGETS = "global|workspace|skills|knowledge|global-skills|workspace-skills|global-knowledge|workspace-knowledge|system-prompt|agents-guidelines"
const COLORS = {
  bg: "#0b0f14",
  panel: "#101820",
  border: "#263445",
  dim: "#7d8590",
  accent: "#7dd3fc",
  user: "#a7f3d0",
  agent: "#f8fafc",
  error: "#f87171",
}
const COMMAND_HELP = `Slash commands:
  Runtime: /status, /health, /models [provider], /settings [patch <json>], /presets, /preset use|create|update|delete
  Config: /profiles, /use <profile-id>, /profile current|export|import, /config [path|patch <json>], /folders [open <target>], /system-prompt default, /sandbox [...], /debug-flags, /agents [reload], /agent show|verify|create|update|delete|toggle
  Content: /bundle items|export|preview|import, /skills, /skill show|create|update|delete|delete-many|import-file|import-folder|import-parent-folder|import-markdown|import-github|export|export-file|open, /notes, /note show|create|update|delete|open, /loops, /loop create|import-markdown|export|update|delete|run|toggle|start|stop|open
  Operator: /mcp [...], /errors [count|clear], /diagnostics [save [path]], /logs [count] [level], /audit [count], /approvals [limit], /approval <id> approve|reject
  Sessions/Queues: /conversations, /conversation [...], /session show|stop|snooze|unsnooze|clear, /sessions clear-inactive|snooze-hide, /queues, /queue pause|resume|clear, /queue msg delete|retry|update
  Integrations/Desktop: /provider chatgpt-web [login|logout], /integrations, /langfuse [installed], /discord [...], /whatsapp [...], /push [...], /permissions open-microphone-settings, /clipboard write <text>, /remote-server [qr [url]], /tunnel [setup|start|stop], /updater [...], /speech [show|download] <provider>, /tts stop|speak <json>, /window main|panel <action>
  Actions: /run-agent <prompt-or-json>, /server restart, /app restart, /key rotate, /stop, /clear, /quit`
function configFilePath() {
  const home = os.homedir()
  const linux = path.join(home, ".config", "app.dotagents", "config.json"), mac = path.join(home, "Library", "Application Support", "app.dotagents", "config.json")
  const windows = path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "app.dotagents", "config.json")
  const candidates = process.platform === "win32" ? [windows, linux, mac] : [linux, mac]
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]
}
function readConfig(): Config { try { return JSON.parse(fs.readFileSync(configFilePath(), "utf8")) } catch { return {} } }
function formatLocalConfig(config = readConfig()): string { const display = { ...config }; if (typeof display.remoteServerApiKey === "string") display.remoteServerApiKey = redactSecretForDisplay(display.remoteServerApiKey); return formatJsonObject(display) }
function patchLocalConfig(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Expected JSON object"
  const filePath = configFilePath(), next = { ...readConfig(), ...(value as Record<string, unknown>) }
  fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(next, null, 2))
  return formatLocalConfig(next)
}
function secretReferenceCandidates(secretId: string): string[] {
  const candidates = new Set([secretId])
  let current = secretId
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(current)
      if (decoded === current) break
      candidates.add(decoded); current = decoded
    } catch { break }
  }
  return [...candidates]
}
function resolveSecretReference(value: string): string | undefined {
  if (!value.startsWith(SECRET_REF_PREFIX)) return value
  const secretId = value.slice(SECRET_REF_PREFIX.length)
  if (!secretId) return undefined

  try {
    const parsed = JSON.parse(
      fs.readFileSync(
        path.join(os.homedir(), ".agents", SECRETS_LOCAL_JSON),
        "utf8",
      ),
    ) as { secrets?: Record<string, unknown> }
    for (const candidate of secretReferenceCandidates(secretId)) {
      const secret = parsed.secrets?.[candidate]
      if (typeof secret === "string" && secret.length > 0) return secret
    }
  } catch {
    // Missing local secret storage means we cannot resolve the reference.
  }
  return undefined
}
function serverSettings(): ServerSettings {
  const configPath = configFilePath()
  const cfg = readConfig()
  const url =
    process.env.DOTAGENTS_SERVER_URL ||
    `http://127.0.0.1:${cfg.remoteServerPort || 3210}`
  const resolvedConfigKey = cfg.remoteServerApiKey
    ? resolveSecretReference(cfg.remoteServerApiKey)?.trim()
    : ""
  const apiKey = process.env.DOTAGENTS_API_KEY || resolvedConfigKey || ""
  const apiKeySource = process.env.DOTAGENTS_API_KEY
    ? "DOTAGENTS_API_KEY"
    : cfg.remoteServerApiKey?.startsWith(SECRET_REF_PREFIX)
      ? resolvedConfigKey
        ? `${configPath} → ~/.agents/${SECRETS_LOCAL_JSON}`
        : `${configPath} → unresolved secret reference`
      : cfg.remoteServerApiKey
        ? configPath
        : "missing"
  return { url: normalizeServerUrl(url), apiKey, configPath, apiKeySource }
}
function settingsApiClient(): ExtendedSettingsApiClient { const { url, apiKey } = serverSettings(); return new ExtendedSettingsApiClient(url, apiKey) }
function normalizeServerUrl(value: string): string {
  const trimmed = value.replace(/\/+$/, "")
  return trimmed.endsWith(REMOTE_SERVER_API_PREFIX)
    ? trimmed.slice(0, -REMOTE_SERVER_API_PREFIX.length)
    : trimmed
}
function parseArgs() {
  const args = process.argv.slice(2), onceIndex = args.findIndex((arg) => arg === "--once")
  return { help: args.includes("--help") || args.includes("-h"), once: onceIndex >= 0 ? args.slice(onceIndex + 1).join(" ") : "" }
}
function textDelta(previous: string, next: string) {
  if (!next) return ""
  if (!previous) return next
  if (next.startsWith(previous)) return next.slice(previous.length)
  if (previous.startsWith(next)) return ""
  return `\n${next}`
}
function boolLabel(value: unknown): string { return value ? "yes" : "no" }
function compactText(value: unknown, fallback = "-"): string {
  return typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" || typeof value === "boolean" ? String(value) : fallback
}
function compactSnippet(value: unknown, maxLength = 96): string {
  const text = compactText(value, "").replace(/\s+/g, " ").trim()
  return text.length <= maxLength ? text : `${text.slice(0, Math.max(0, maxLength - 3))}...`
}
function positiveNumberArg(value: string | undefined, fallback: number): number {
  const parsed = value ? Number(value) : fallback
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback
}
function formatTimestamp(timestamp?: number): string { return timestamp ? new Date(timestamp).toLocaleString() : "-" }
function listLines<T>(
  items: T[] | undefined,
  empty: string,
  formatter: (item: T, index: number) => string,
): string[] {
  if (!items || items.length === 0) return [`  ${empty}`]
  return items.map((item, index) => formatter(item, index))
}
function parseJsonPayload(args: string[], usage: string, startIndex = 0): { ok: true; value: unknown } | { ok: false; message: string } {
  const payload = args.slice(startIndex).join(" ").trim()
  if (!payload) return { ok: false, message: `Usage: ${usage}` }
  try {
    return { ok: true, value: JSON.parse(payload) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, message: `Invalid JSON payload: ${message}\nUsage: ${usage}` }
  }
}
function withJsonPayload(args: string[], usage: string, startIndex: number, run: (value: unknown) => string | Promise<string>): string | Promise<string> {
  const parsed = parseJsonPayload(args, usage, startIndex)
  return parsed.ok ? run(parsed.value) : parsed.message
}
function textPayload(args: string[], startIndex = 0): string { return args.slice(startIndex).join(" ").trim() }
function formatJsonObject(value: unknown): string { return JSON.stringify(value ?? {}, null, 2) }
function formatActionResponse(response: any, fallbackAction: string): string {
  const success = response?.success === false ? "failed" : "ok"
  return [compactText(response?.action, fallbackAction), success, compactText(response?.message || response?.error, "")].filter(Boolean).join(": ")
}
function formatStatus(status: any): string {
  const remote = status?.remoteServer || {}
  const tunnel = status?.tunnel || {}
  const sessions = status?.sessions || {}
  const integrations = status?.integrations || {}
  const discord = integrations.discord || {}
  const whatsapp = integrations.whatsapp || {}
  const push = integrations.pushNotifications || {}
  const system = status?.system || {}
  const url = remote.url || remote.connectableUrl || `${remote.bind || "127.0.0.1"}:${remote.port || "?"}`
  return [
    "Status",
    `  Health: ${compactText(status?.health?.overall)}`,
    `  Remote server: ${remote.running ? "running" : "stopped"} (${url})`,
    `  Tunnel: ${tunnel.running ? "running" : tunnel.starting ? "starting" : "stopped"}${tunnel.url ? ` (${tunnel.url})` : ""}`,
    `  Sessions: ${sessions.activeSessions ?? 0} active, ${sessions.recentSessions ?? 0} recent`,
    `  Discord: enabled ${boolLabel(discord.enabled)}, connected ${boolLabel(discord.connected)}`,
    `  WhatsApp: enabled ${boolLabel(whatsapp.enabled)}, connected ${boolLabel(whatsapp.connected)}`,
    `  Push: ${push.tokenCount ?? 0} token(s)`,
    `  System: ${compactText(system.platform)}/${compactText(system.arch)} uptime ${Math.round(system.uptimeSeconds ?? 0)}s`,
    `  Recent errors: ${status?.recentErrors?.total ?? 0} total, ${status?.recentErrors?.errorsInLastFiveMinutes ?? 0} in last 5m`,
  ].join("\n")
}
function formatHealth(health: any): string {
  const checks: Array<[string, any]> =
    health?.checks && typeof health.checks === "object" ? Object.entries(health.checks) : []
  return [
    `Health: ${compactText(health?.overall)}`,
    ...listLines(checks, "No checks reported", ([name, check]) => {
      return `  ${name}: ${compactText(check?.status)} - ${compactText(check?.message)}`
    }),
  ].join("\n")
}
function formatAgentProfiles(response: any): string {
  return [
    `Agent profiles (${response?.profiles?.length ?? 0})`,
    ...listLines(response?.profiles, "No agent profiles", (profile: any) => {
      const state = profile.enabled ? "enabled" : "disabled"
      return `  ${profile.id} - ${compactText(profile.displayName || profile.name)} (${state}, ${compactText(profile.connectionType)})`
    }),
  ].join("\n")
}
function formatAgentsFolders(): string {
  const formatLayer = (label: string, agentsDir: string) => {
    const layer = getAgentsLayerPaths(agentsDir)
    return [
      `  ${label}: ${agentsDir}`,
      `    system prompt: ${layer.systemPromptMdPath} (${fs.existsSync(layer.systemPromptMdPath) ? "exists" : "missing"})`,
      `    agents guidelines: ${layer.agentsMdPath}`,
      `    skills: ${getAgentsSkillsDir(layer)}`,
      `    knowledge: ${getAgentsKnowledgeDir(layer)}`,
    ].join("\n")
  }
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  return [
    "Agents folders",
    formatLayer("global", globalAgentsFolder),
    workspaceAgentsFolder ? formatLayer("workspace", workspaceAgentsFolder) : "  workspace: none",
  ].join("\n")
}
function formatSandboxState(): string {
  const state = getSandboxState(globalAgentsFolder)
  return [
    `Sandbox slots${state.activeSlot ? ` - active ${state.activeSlot}` : ""}`,
    ...listLines(state.slots, "No sandbox slots", (slot: any) =>
      `  ${slot.name} (${slot.isDefault ? "default" : "slot"}${slot.name === state.activeSlot ? ", active" : ""}${slot.sourceBundleName ? `, from ${slot.sourceBundleName}` : ""}) - ${slot.updatedAt}`),
  ].join("\n")
}
function formatSandboxResult(response: any, action: string): string {
  if (response?.success === false) return `sandbox-${action}: failed: ${compactText(response.error)}`
  return [`sandbox-${action}: ok`, response?.slot?.name || response?.activeSlot ? `  Slot: ${response?.slot?.name || response.activeSlot}` : ""].filter(Boolean).join("\n")
}
function formatProfiles(response: any): string {
  return [
    `Profiles (${response?.profiles?.length ?? 0})${response?.currentProfileId ? ` - current ${response.currentProfileId}` : ""}`,
    ...listLines(response?.profiles, "No profiles", (profile: any) => {
      const current = profile.id === response?.currentProfileId ? " current" : ""
      return `  ${profile.id} - ${compactText(profile.name)}${current}`
    }),
  ].join("\n")
}
function formatSettings(response: any): string {
  const provider = response?.agentProviderId || response?.providerId
  return [
    "Settings",
    `  Agent provider: ${compactText(provider)}`,
    `  Model preset: ${compactText(response?.currentModelPresetId)}`,
    `  Remote server: ${response?.remoteServerEnabled ? "enabled" : "disabled"} on ${compactText(response?.remoteServerBindAddress)}:${compactText(response?.remoteServerPort)}`,
    `  MCP tools provider: ${compactText(response?.mcpToolsProviderId)}`,
    `  Discord: ${boolLabel(response?.discordEnabled)}`,
    `  WhatsApp: ${boolLabel(response?.whatsappEnabled)}`,
    `  Langfuse: ${boolLabel(response?.langfuseEnabled)}`,
  ].join("\n")
}
function formatSettingsPatch(response: any): string {
  const updated = Array.isArray(response?.updated) ? response.updated.join(", ") : ""
  return `Settings updated${updated ? `: ${updated}` : ""}`
}
function formatModelPresets(response: any): string {
  return [
    `Model endpoints (${response?.presets?.length ?? 0})${response?.currentModelPresetId ? ` - current ${response.currentModelPresetId}` : ""}`,
    ...listLines(response?.presets, "No model endpoints", (preset: any) => {
      const current = preset.id === response?.currentModelPresetId ? " current" : ""
      const builtIn = preset.isBuiltIn ? ", built-in" : ""
      return `  ${preset.id} - ${compactText(preset.name)}${current}${builtIn} - ${compactText(preset.baseUrl)}`
    }),
  ].join("\n")
}
function formatModelPresetMutation(response: any, action: string): string {
  const preset = response?.preset
  const id = preset?.id || response?.deletedPresetId || response?.currentModelPresetId
  return `Model endpoint ${action}: ${compactText(id)}`
}
function formatSkills(response: any): string {
  return [
    `Skills (${response?.skills?.length ?? 0})${response?.currentProfileId ? ` - profile ${response.currentProfileId}` : ""}`,
    ...listLines(response?.skills, "No skills", (skill: any) => {
      const enabled = skill.enabledForProfile ? "on" : "off"
      return `  ${skill.id} - ${compactText(skill.name)} (${enabled})${skill.description ? ` - ${skill.description}` : ""}`
    }),
  ].join("\n")
}
function formatSkillToggle(response: any): string {
  return `Skill ${compactText(response?.skillId)} is now ${response?.enabledForProfile ? "enabled" : "disabled"} for the current profile.`
}
function formatSkillResponse(response: any, action = "saved"): string {
  const skill = response?.skill
  if (!skill) return formatActionResponse(response, `skill-${action}`)
  return `Skill ${action}: ${compactText(skill.id)} - ${compactText(skill.name)}`
}
function formatDeleteResponse(response: any, resource: string): string {
  return `${resource} deleted: ${compactText(response?.id)}`
}
function formatKnowledgeNotes(response: any): string {
  return [
    `Knowledge notes (${response?.notes?.length ?? 0})`,
    ...listLines(response?.notes, "No knowledge notes", (note: any) => {
      const tags = Array.isArray(note.tags) && note.tags.length > 0 ? ` [${note.tags.join(", ")}]` : ""
      return `  ${note.id} - ${compactText(note.title)} (${compactText(note.context)})${tags}`
    }),
  ].join("\n")
}
function formatKnowledgeNoteResponse(response: any, action = "saved"): string {
  const note = response?.note
  if (!note) return formatActionResponse(response, `note-${action}`)
  return `Note ${action}: ${compactText(note.id)} - ${compactText(note.title)}`
}
function formatLoops(response: any): string {
  return [
    `Repeat tasks (${response?.loops?.length ?? 0})`,
    ...listLines(response?.loops, "No repeat tasks", (loop: any) => {
      const enabled = loop.enabled ? "enabled" : "disabled"
      const running = loop.isRunning ? ", running" : ""
      return `  ${loop.id} - ${compactText(loop.name)} (${enabled}${running}, every ${loop.intervalMinutes ?? "?"}m)`
    }),
  ].join("\n")
}
function formatLoopAction(response: any, action: string): string {
  if (response?.loop) {
    return `Loop ${compactText(response.loop.id)} ${action}: ${compactText(response.loop.name)}`
  }
  return formatActionResponse(response, `loop-${action}`)
}
function formatAgentProfileResponse(response: any, action = "saved"): string {
  const profile = response?.profile
  if (profile) return `Agent ${action}: ${compactText(profile.id)} - ${compactText(profile.displayName || profile.name)}`
  if (typeof response?.enabled === "boolean") {
    return `Agent ${compactText(response?.id)} is now ${response.enabled ? "enabled" : "disabled"}.`
  }
  return formatActionResponse(response, `agent-${action}`)
}
function formatMcpStatus(response: any): string {
  return [
    `MCP: ${response?.connectedServers ?? 0}/${response?.totalServers ?? 0} servers connected, ${response?.totalTools ?? 0} tools`,
    ...listLines(response?.servers, "No MCP servers", (server: any) => {
      const state = server.connected ? "connected" : "disconnected"
      const enabled = server.enabled && server.runtimeEnabled && !server.configDisabled ? "enabled" : "disabled"
      const error = server.error ? ` - ${server.error}` : ""
      return `  ${server.name} - ${state}, ${enabled}, ${server.toolCount ?? 0} tools${error}`
    }),
  ].join("\n")
}
function formatSavedMcpServers(response: any): string {
  return [
    `Saved MCP servers (${response?.servers?.length ?? 0})`,
    ...listLines(response?.servers, "No saved MCP servers", (server: any) => {
      const state = server.connected ? "connected" : "disconnected"
      const enabled = server.enabled ? "enabled" : "disabled"
      const error = server.error ? ` - ${server.error}` : ""
      return `  ${server.name} - ${state}, ${enabled}, ${server.toolCount ?? 0} tools${error}`
    }),
  ].join("\n")
}
function formatMcpTools(response: any): string {
  return [
    `MCP tools (${response?.count ?? response?.tools?.length ?? 0})${response?.server ? ` - ${response.server}` : ""}`,
    ...listLines(response?.tools, "No MCP tools", (tool: any) => {
      const enabled = tool.enabled && tool.serverEnabled ? "on" : "off"
      return `  ${tool.name} - ${enabled} (${compactText(tool.sourceLabel || tool.sourceName)})`
    }),
  ].join("\n")
}
function formatMcpLogs(response: any): string {
  return [
    `MCP logs: ${compactText(response?.server)} (${response?.logs?.length ?? 0})`,
    ...listLines(response?.logs, "No log entries", (entry: any) => {
      return `  ${formatTimestamp(entry.timestamp)} - ${compactText(entry.message)}`
    }),
  ].join("\n")
}
function formatConversations(response: any): string {
  return [
    `Conversations (${response?.count ?? response?.conversations?.length ?? 0})`,
    ...listLines(response?.conversations, "No conversations", (conversation: any) => {
      return `  ${conversation.id} - ${compactText(conversation.title)} (${conversation.messageCount ?? 0} messages) - ${compactText(conversation.preview, "")}`
    }),
  ].join("\n")
}
function formatRecentEvents(response: any, title: string, field: "errors" | "logs"): string {
  const entries = response?.[field]
  return [
    `${title} (${response?.count ?? entries?.length ?? 0})`,
    ...listLines(entries, `No ${title.toLowerCase()}`, (entry: any) => {
      return `  ${formatTimestamp(entry.timestamp)} - ${compactText(entry.level)} - ${compactText(entry.component)}: ${compactText(entry.message)}`
    }),
  ].join("\n")
}
function formatAuditEntries(response: any): string {
  return [
    `Audit (${response?.count ?? response?.entries?.length ?? 0})`,
    ...listLines(response?.entries, "No audit entries", (entry: any) => {
      const status = entry.success ? "ok" : "failed"
      const device = entry.deviceId ? ` device ${entry.deviceId}` : ""
      const failure = entry.failureReason ? ` - ${entry.failureReason}` : ""
      return `  ${formatTimestamp(entry.timestamp)} - ${status} - ${compactText(entry.action)} ${compactText(entry.path)}${device}${failure}`
    }),
  ].join("\n")
}
function formatRemoteServer(response: any): string {
  const url = response?.connectableUrl || response?.url || `${compactText(response?.bind)}:${compactText(response?.port)}`
  return [
    "Remote server",
    `  Running: ${boolLabel(response?.running)}`,
    `  URL: ${url}`,
    response?.lastError ? `  Last error: ${response.lastError}` : "",
  ].filter(Boolean).join("\n")
}
async function formatRemoteServerQr(client: ExtendedSettingsApiClient, urlOverride?: string): Promise<string> {
  const settings = serverSettings()
  if (!settings.apiKey) {
    return `Cannot print QR code: missing remote server API key (${settings.apiKeySource})`
  }
  const status = await client.getOperatorRemoteServer()
  const baseUrl = urlOverride || status?.connectableUrl || status?.url || settings.url
  const serverUrl = ensureRemoteServerV1BaseUrl(normalizeServerUrl(baseUrl))
  const qrString = await QRCode.toString(
    buildDotAgentsConfigDeepLink({ baseUrl: serverUrl, apiKey: settings.apiKey }),
    { type: "terminal", small: true, errorCorrectionLevel: "M" },
  )
  return [
    "Mobile App Connection QR Code",
    "",
    qrString.trimEnd(),
    `Server URL: ${serverUrl}`,
    `API Key: ${redactSecretForDisplay(settings.apiKey)}`,
  ].join("\n")
}
function formatTunnel(response: any): string {
  return [
    "Tunnel",
    `  State: ${response?.running ? "running" : response?.starting ? "starting" : "stopped"}`,
    `  Mode: ${compactText(response?.mode)}`,
    `  URL: ${compactText(response?.url)}`,
    response?.error ? `  Error: ${response.error}` : "",
  ].filter(Boolean).join("\n")
}
function formatTunnelSetup(response: any): string {
  return [
    "Tunnel setup",
    `  Installed: ${boolLabel(response?.installed)}`,
    `  Logged in: ${boolLabel(response?.loggedIn)}`,
    `  Mode: ${compactText(response?.mode)}`,
    `  Auto-start: ${boolLabel(response?.autoStart)}`,
    `  Named tunnel configured: ${boolLabel(response?.namedTunnelConfigured)}`,
    `  Hostname: ${compactText(response?.configuredHostname)}`,
    `  Credentials path configured: ${boolLabel(response?.credentialsPathConfigured)}`,
    `  Discovered tunnels: ${response?.tunnelCount ?? response?.tunnels?.length ?? 0}`,
    ...listLines(response?.tunnels, "No discovered tunnels", (tunnel: any) => {
      return `  ${tunnel.id} - ${compactText(tunnel.name)}`
    }),
    response?.error ? `  Error: ${response.error}` : "",
  ].filter(Boolean).join("\n")
}
function formatIntegrations(response: any): string {
  const discord = response?.discord || {}
  const whatsapp = response?.whatsapp || {}
  const push = response?.pushNotifications || {}
  return [
    "Integrations",
    `  Discord: enabled ${boolLabel(discord.enabled)}, connected ${boolLabel(discord.connected)}, logs ${discord.logs?.total ?? 0}`,
    `  WhatsApp: enabled ${boolLabel(whatsapp.enabled)}, connected ${boolLabel(whatsapp.connected)}, logs ${whatsapp.logs?.total ?? 0}`,
    `  Push notifications: enabled ${boolLabel(push.enabled)}, tokens ${push.tokenCount ?? 0}`,
  ].join("\n")
}
function formatDiscord(response: any): string {
  return [
    "Discord",
    `  Available: ${boolLabel(response?.available)}`,
    `  Enabled: ${boolLabel(response?.enabled)}`,
    `  Connected: ${boolLabel(response?.connected)}`,
    `  Token configured: ${boolLabel(response?.tokenConfigured)}`,
    `  Bot: ${compactText(response?.botUsername)}`,
    `  Default profile: ${compactText(response?.defaultProfileName || response?.defaultProfileId)}`,
    `  Logs: ${response?.logs?.total ?? 0}`,
    response?.lastError ? `  Last error: ${response.lastError}` : "",
  ].filter(Boolean).join("\n")
}
function formatDiscordLogs(response: any): string {
  return [
    `Discord logs (${response?.count ?? response?.logs?.length ?? 0})`,
    ...listLines(response?.logs, "No Discord logs", (entry: any) => {
      return `  ${formatTimestamp(entry.timestamp)} - ${compactText(entry.level)} - ${compactText(entry.message)}`
    }),
  ].join("\n")
}
function formatWhatsApp(response: any): string {
  return [
    "WhatsApp",
    `  Available: ${boolLabel(response?.available)}`,
    `  Enabled: ${boolLabel(response?.enabled)}`,
    `  Connected: ${boolLabel(response?.connected)}`,
    `  Server configured: ${boolLabel(response?.serverConfigured)}`,
    `  Auto-reply: ${boolLabel(response?.autoReplyEnabled)}`,
    `  Allowed senders: ${response?.allowedSenderCount ?? 0}`,
    `  Logs: ${response?.logs?.total ?? 0}`,
    response?.lastError ? `  Last error: ${response.lastError}` : "",
  ].filter(Boolean).join("\n")
}
function formatUpdater(response: any): string {
  return [
    "Updater",
    `  Enabled: ${boolLabel(response?.enabled)}`,
    `  Mode: ${compactText(response?.mode)}`,
    `  Current version: ${compactText(response?.currentVersion)}`,
    `  Update available: ${response?.updateAvailable === undefined ? "unknown" : boolLabel(response.updateAvailable)}`,
    `  Last checked: ${formatTimestamp(response?.lastCheckedAt)}`,
    `  Latest release: ${compactText(response?.latestRelease?.tagName || response?.latestRelease?.name)}`,
    `  Preferred asset: ${compactText(response?.preferredAsset?.name)}`,
    `  Last downloaded: ${compactText(response?.lastDownloadedFileName)}`,
    response?.lastCheckError ? `  Last check error: ${response.lastCheckError}` : "",
  ].filter(Boolean).join("\n")
}
function formatLocalSpeechModels(response: any): string {
  const models = response?.models && typeof response.models === "object"
    ? Object.entries(response.models)
    : []
  return [
    `Local speech models (${models.length})`,
    ...listLines(models, "No local speech models", ([providerId, status]: [string, any]) => {
      const state = status.downloaded ? "downloaded" : status.downloading ? `downloading ${status.progress ?? 0}%` : "missing"
      const error = status.error ? ` - ${status.error}` : ""
      return `  ${providerId} - ${state}${error}`
    }),
  ].join("\n")
}
function formatLocalSpeechModel(providerId: string, response: any): string {
  const state = response?.downloaded ? "downloaded" : response?.downloading ? `downloading ${response.progress ?? 0}%` : "missing"
  return [
    `Local speech model: ${providerId}`,
    `  State: ${state}`,
    `  Path: ${compactText(response?.path)}`,
    response?.error ? `  Error: ${response.error}` : "",
  ].filter(Boolean).join("\n")
}
function formatMessageQueues(response: any): string {
  return [
    `Message queues (${response?.count ?? response?.queues?.length ?? 0} conversations, ${response?.totalMessages ?? 0} messages)`,
    ...listLines(response?.queues, "No queued messages", (queue: any) => {
      const header = `  ${queue.conversationId} - ${queue.messageCount ?? queue.messages?.length ?? 0} message(s), ${queue.isPaused ? "paused" : "active"}`
      const messages = (queue.messages || []).map((message: any) => {
        const error = message.errorMessage ? ` - ${message.errorMessage}` : ""
        return `    ${message.id} - ${compactText(message.status)} - ${compactSnippet(message.text)}${error}`
      })
      return [header, ...messages].join("\n")
    }),
  ].join("\n")
}
function formatRunAgent(response: any): string {
  if (response?.success === false) return formatActionResponse(response, "run-agent")
  return [
    `run-agent: ok: ${compactText(response?.conversationId)}`,
    `  Messages: ${response?.messageCount ?? 0}`,
    `  Content: ${compactSnippet(response?.content, 200)}`,
  ].join("\n")
}
function formatApiKeyRotation(response: any): string {
  const scheduled = response?.restartScheduled || response?.scheduled
  return [
    formatActionResponse(response, "rotate-api-key"),
    `Restart scheduled: ${boolLabel(scheduled)}`,
    response?.apiKey ? "New API key returned by server; update clients before old credentials are discarded." : "",
  ].filter(Boolean).join("\n")
}
async function saveResponseBody(response: Response, outputPath: string, action: string): Promise<string> {
  if (!response.ok) throw new Error(`${action} failed: HTTP ${response.status}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  const resolvedPath = path.resolve(outputPath)
  fs.writeFileSync(resolvedPath, bytes)
  return [
    `${action}: ok: ${resolvedPath}`,
    `  MIME: ${compactText(response.headers.get("content-type"))}`,
    `  Bytes: ${bytes.byteLength}`,
  ].join("\n")
}
function writeClipboardText(text: string): string {
  const file = process.env.DOTAGENTS_TUI_CLIPBOARD_FILE
  if (file) { fs.writeFileSync(file, text); return "clipboard-write: ok" }
  const candidates: Array<[string, string[]]> = process.platform === "darwin"
    ? [["pbcopy", []]]
    : process.platform === "win32"
      ? [["clip.exe", []]]
      : [["wl-copy", []], ["xclip", ["-selection", "clipboard"]], ["xsel", ["--clipboard", "--input"]]]
  let lastError = "no clipboard command available"
  for (const [command, args] of candidates) {
    const { error, status, stderr } = spawnSync(command, args, { input: text, encoding: "utf8" })
    if (!error && status === 0) return "clipboard-write: ok"
    lastError = error?.message || stderr || `exit ${status ?? "unknown"}`
  }
  return `clipboard-write: failed: ${compactText(lastError)}`
}
function openTarget(target: string, label: string): string {
  const captureFile = process.env.DOTAGENTS_TUI_OPEN_PATH_FILE
  if (captureFile) { fs.appendFileSync(captureFile, `${target}\n`); return `${label}: ok: ${target}` }
  const candidates: Array<[string, string[]]> = process.platform === "darwin" ? [["open", [target]]] : process.platform === "win32" ? [["cmd.exe", ["/c", "start", "", target]]] : [["xdg-open", [target]]]
  let lastError = "no open command available"
  for (const [command, args] of candidates) {
    const { error, status, stderr } = spawnSync(command, args, { encoding: "utf8" })
    if (!error && status === 0) return `${label}: ok: ${target}`
    lastError = error?.message || stderr || `exit ${status ?? "unknown"}`
  }
  return `${label}: failed: ${compactText(lastError)}`
}
function openLocalPath(targetPath: string, isFile = false): string {
  const resolvedPath = path.resolve(targetPath)
  fs.mkdirSync(isFile ? path.dirname(resolvedPath) : resolvedPath, { recursive: true })
  if (isFile && !fs.existsSync(resolvedPath)) fs.writeFileSync(resolvedPath, "")
  return openTarget(resolvedPath, "open-path")
}
function openMicrophoneSettings(): string {
  return openTarget(process.platform === "win32" ? "ms-settings:privacy-microphone" : "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone", "open-microphone-settings")
}
function readSkillMarkdown(importPath: string, isFolder = false): string {
  return fs.readFileSync(path.resolve(isFolder ? path.join(importPath, "SKILL.md") : importPath), "utf8")
}
function currentAgentsLayers() {
  const workspace = resolveWorkspaceAgentsFolder(), globalLayer = getAgentsLayerPaths(globalAgentsFolder), workspaceLayer = workspace ? getAgentsLayerPaths(workspace) : null
  return { workspace, globalLayer, workspaceLayer, layer: workspaceLayer || globalLayer, layers: [workspaceLayer, globalLayer].filter(Boolean) as ReturnType<typeof getAgentsLayerPaths>[] }
}
function openAgentsPathTarget(target = "global"): string {
  const { workspace, globalLayer, workspaceLayer, layer } = currentAgentsLayers()
  const item = ({
    global: { path: globalAgentsFolder },
    workspace: { path: workspace || "" },
    skills: { path: getAgentsSkillsDir(layer) },
    knowledge: { path: getPrimaryAgentsKnowledgeDir(layer) },
    "global-skills": { path: getAgentsSkillsDir(globalLayer) },
    "workspace-skills": { path: workspaceLayer ? getAgentsSkillsDir(workspaceLayer) : "" },
    "global-knowledge": { path: getPrimaryAgentsKnowledgeDir(globalLayer) },
    "workspace-knowledge": { path: workspaceLayer ? getPrimaryAgentsKnowledgeDir(workspaceLayer) : "" },
    "system-prompt": { path: layer.systemPromptMdPath, file: true },
    "agents-guidelines": { path: layer.agentsMdPath, file: true },
  } as Record<string, { path: string; file?: boolean }>)[target]
  if (!item) return `Usage: /folders open ${FOLDER_OPEN_TARGETS}`
  return item.path ? openLocalPath(item.path, item.file) : "open-path: failed: no workspace .agents folder configured"
}
async function openLoopTaskFileTarget(client: ExtendedSettingsApiClient, loopId?: string): Promise<string> {
  if (!loopId) return "Usage: /loop open <id>"
  const { globalLayer, layers } = currentAgentsLayers()
  for (const layer of layers) {
    const filePath = loadTasksLayer(layer).originById.get(loopId)?.filePath
    if (filePath) return openLocalPath(filePath, true)
  }
  const loop = (await client.getLoops()).loops?.find((item: any) => item.id === loopId)
  if (!loop) return `open-path: failed: task with id ${loopId} not found`
  writeTaskFile(globalLayer, loop, { maxBackups: 10 })
  return openLocalPath(taskIdToFilePath(globalLayer, loopId), true)
}
async function openSkillFileTarget(client: ExtendedSettingsApiClient, skillId?: string): Promise<string> {
  if (!skillId) return "Usage: /skill open <id>"
  const { globalLayer, layers } = currentAgentsLayers()
  for (const layer of layers) {
    const filePath = loadAgentsSkillsLayer(layer).originById.get(skillId)?.filePath
    if (filePath) return openLocalPath(filePath, true)
  }
  const skill = (await client.getSkill(skillId)).skill
  if (!skill) return `open-path: failed: skill with id ${skillId} not found`
  writeAgentsSkillFile(globalLayer, skill, { maxBackups: 10 })
  return openLocalPath(skillIdToFilePath(globalLayer, skillId), true)
}
async function openKnowledgeNoteFileTarget(client: ExtendedSettingsApiClient, noteId?: string): Promise<string> {
  if (!noteId) return "Usage: /note open <id>"
  const { globalLayer, layers } = currentAgentsLayers()
  for (const layer of layers) {
    const filePath = loadAgentsKnowledgeNotesLayer(layer).originById.get(noteId)?.filePath
    if (filePath) return openLocalPath(filePath, true)
  }
  const note = (await client.getKnowledgeNote(noteId)).note
  const { filePath } = writeKnowledgeNoteFile(globalLayer, note as KnowledgeNote, { knowledgeRootPath: getPrimaryAgentsKnowledgeDir(globalLayer), maxBackups: 10 })
  return openLocalPath(filePath, true)
}
async function runServerCommand(input: string): Promise<string | undefined> {
  const message = input.trim()
  if (!message.startsWith("/")) return undefined

  const [command, ...args] = message.slice(1).split(/\s+/).filter(Boolean)
  if (!command || command === "help") return COMMAND_HELP
  const client = settingsApiClient()
  if (command === "status") return formatStatus(await client.getOperatorStatus())
  if (command === "health") return formatHealth(await client.getOperatorHealth())
  if (command === "agents") {
    if (args[0] === "reload") return formatActionResponse(await client.reloadAgentProfiles(), "agents-reload")
    if (args.length > 0) return "Usage: /agents [reload]"
    return formatAgentProfiles(await client.getAgentProfiles())
  }
  if (command === "profiles") return formatProfiles(await client.getProfiles())
  if (command === "use") {
    const profileId = args[0]
    if (!profileId) return "Usage: /use <profile-id>"
    const response = await client.setCurrentProfile(profileId)
    return `Current profile: ${compactText((response as any)?.profile?.id || profileId)}`
  }
  if (command === "profile") {
    const action = args[0]
    if (action === "current") return formatJsonObject(await client.getCurrentProfile())
    if (action === "export") {
      const profileId = args[1]
      if (!profileId) return "Usage: /profile export <profile-id>"
      const response = await client.exportProfile(profileId)
      return response.profileJson || ""
    }
    if (action === "import") {
      const profileJson = textPayload(args, 1)
      if (!profileJson) return "Usage: /profile import <json>"
      const response = await client.importProfile(profileJson)
      return `Profile imported: ${compactText((response as any)?.profile?.id)}`
    }
    return "Usage: /profile current | /profile export <profile-id> | /profile import <json>"
  }
  if (command === "models") return formatJsonObject(args[0] ? await client.getModels(args[0] as any) : await client.getOpenAICompatibleModels())
  if (command === "settings") {
    const action = args[0]
    if (!action) return formatSettings(await client.getSettings())
    if (action === "patch") return withJsonPayload(args, "/settings patch <json>", 1, async (value) => formatSettingsPatch(await client.updateSettings(value as any)))
    return "Usage: /settings [patch <json>]"
  }
  if (command === "config") {
    const action = args[0]
    if (!action) return formatLocalConfig()
    if (action === "path") return configFilePath()
    if (action === "patch") return withJsonPayload(args, "/config patch <json>", 1, patchLocalConfig)
    return "Usage: /config [path|patch <json>]"
  }
  if (command === "presets") return formatModelPresets(await client.getModelPresets())
  if (command === "folders") {
    if (args[0] === "open") return openAgentsPathTarget(args[1])
    if (args.length > 0) return `Usage: /folders [open ${FOLDER_OPEN_TARGETS}]`
    return formatAgentsFolders()
  }
  if (command === "system-prompt") return args[0] === "default" ? DEFAULT_SYSTEM_PROMPT : "Usage: /system-prompt default"
  if (command === "debug-flags") return formatJsonObject(getDebugFlags())
  if (command === "sandbox") {
    const action = args[0]
    if (!action || action === "list") return formatSandboxState()
    if (action === "save-baseline") return formatSandboxResult(saveBaseline(globalAgentsFolder), "save-baseline")
    if (action === "restore") return formatSandboxResult(restoreBaseline(globalAgentsFolder), "restore")
    if (action === "save" || action === "switch" || action === "delete") {
      const name = textPayload(args, 1)
      if (!name) return `Usage: /sandbox ${action} <slot-name>`
      const result = action === "save"
        ? saveCurrentAsSlot(globalAgentsFolder, name)
        : action === "switch"
          ? switchToSlot(globalAgentsFolder, name)
          : deleteSlot(globalAgentsFolder, name)
      return formatSandboxResult(result, action)
    }
    if (action === "rename") {
      const oldName = args[1]
      const newName = textPayload(args, 2)
      if (!oldName || !newName) return "Usage: /sandbox rename <old-name> <new-name>"
      return formatSandboxResult(renameSlot(globalAgentsFolder, oldName, newName), "rename")
    }
    return "Usage: /sandbox [list|save-baseline|save|switch|restore|delete|rename]"
  }
  if (command === "preset") {
    const action = args[0]
    if (!action) return "Usage: /preset use|create|update|delete"
    if (action === "use") {
      const presetId = args[1]
      if (!presetId) return "Usage: /preset use <preset-id>"
      return formatSettingsPatch(await client.updateSettings({ currentModelPresetId: presetId } as any))
    }
    if (action === "create") {
      return withJsonPayload(args, "/preset create <json>", 1, async (value) => formatModelPresetMutation(await client.createModelPreset(value as any), "created"))
    }
    if (action === "update") {
      const presetId = args[1]
      if (!presetId) return "Usage: /preset update <id> <json>"
      return withJsonPayload(args, "/preset update <id> <json>", 2, async (value) => formatModelPresetMutation(await client.updateModelPreset(presetId, value as any), "updated"))
    }
    if (action === "delete") {
      const presetId = args[1]
      if (!presetId) return "Usage: /preset delete <id>"
      return formatModelPresetMutation(await client.deleteModelPreset(presetId), "deleted")
    }
    return "Usage: /preset use|create|update|delete"
  }
  if (command === "skills") return formatSkills(await client.getSkills())
  if (command === "skill") {
    const action = args[0]
    if (!action) return "Usage: /skill <skill-id> | /skill show|toggle|create|update|delete|open"
    if (action === "open") return openSkillFileTarget(client, args[1])
    if (action === "show") {
      const skillId = args[1]
      if (!skillId) return "Usage: /skill show <id>"
      return formatJsonObject(await client.getSkill(skillId))
    }
    if (action === "create") {
      return withJsonPayload(args, "/skill create <json>", 1, async (value) => formatSkillResponse(await client.createSkill(value as any), "created"))
    }
    if (action === "update") {
      const skillId = args[1]
      if (!skillId) return "Usage: /skill update <id> <json>"
      return withJsonPayload(args, "/skill update <id> <json>", 2, async (value) => formatSkillResponse(await client.updateSkill(skillId, value as any), "updated"))
    }
    if (action === "delete") {
      const skillId = args[1]
      if (!skillId) return "Usage: /skill delete <id>"
      return formatDeleteResponse(await client.deleteSkill(skillId), "Skill")
    }
    if (action === "delete-many") {
      const ids = args.slice(1)
      if (ids.length === 0) return "Usage: /skill delete-many <ids...>"
      return formatJsonObject(await client.deleteSkills(ids))
    }
    if (action === "import-markdown") {
      const content = textPayload(args, 1)
      if (!content) return "Usage: /skill import-markdown <markdown>"
      return formatSkillResponse(await client.importSkillFromMarkdown(content), "imported")
    }
    if (action === "import-file" || action === "import-folder") {
      const importPath = textPayload(args, 1)
      if (!importPath) return `Usage: /skill ${action} <path>`
      return formatSkillResponse(await client.importSkillFromMarkdown(readSkillMarkdown(importPath, action === "import-folder")), "imported")
    }
    if (action === "import-parent-folder") {
      const parentPath = textPayload(args, 1)
      if (!parentPath) return "Usage: /skill import-parent-folder <path>"
      const imported: any[] = [], errors: Array<{ folder: string; error: string }> = []
      for (const entry of fs.readdirSync(path.resolve(parentPath), { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const childPath = path.join(parentPath, entry.name)
        if (!fs.existsSync(path.join(childPath, "SKILL.md"))) continue
        try { imported.push((await client.importSkillFromMarkdown(readSkillMarkdown(childPath, true))).skill) }
        catch (error) { errors.push({ folder: entry.name, error: error instanceof Error ? error.message : String(error) }) }
      }
      return formatJsonObject({ imported, skipped: [], errors })
    }
    if (action === "import-github") {
      const repoIdentifier = args[1]
      if (!repoIdentifier) return "Usage: /skill import-github <owner/repo>"
      return formatJsonObject(await client.importSkillFromGitHub(repoIdentifier))
    }
    if (action === "export") {
      const skillId = args[1]
      if (!skillId) return "Usage: /skill export <id>"
      return (await client.exportSkillToMarkdown(skillId)).content || ""
    }
    if (action === "export-file") {
      const skillId = args[1], outputPath = textPayload(args, 2)
      if (!skillId || !outputPath) return "Usage: /skill export-file <id> <path>"
      const resolvedPath = path.resolve(outputPath)
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true })
      fs.writeFileSync(resolvedPath, (await client.exportSkillToMarkdown(skillId)).content || "")
      return `skill-export-file: ok: ${resolvedPath}`
    }

    const skillId = action === "toggle" ? args[1] : action
    if (!skillId) return "Usage: /skill <skill-id> | /skill toggle <skill-id>"
    return formatSkillToggle(await client.toggleSkillForProfile(skillId))
  }
  if (command === "notes") {
    const action = args[0]
    if (!action) return formatKnowledgeNotes(await client.getKnowledgeNotes())
    if (action === "search") {
      const payload = textPayload(args, 1)
      if (!payload) return "Usage: /notes search <json|query>"
      const parsed = payload.startsWith("{") ? parseJsonPayload(args, "/notes search <json>", 1) : undefined
      if (parsed && !parsed.ok) return parsed.message
      const request = parsed?.value ?? { query: payload, limit: 100 }
      return formatKnowledgeNotes(await client.searchKnowledgeNotes(request as any))
    }
    if (action === "delete-many") {
      const ids = args.slice(1)
      if (ids.length === 0) return "Usage: /notes delete-many <ids...>"
      return formatJsonObject(await client.deleteKnowledgeNotes(ids))
    }
    if (action === "delete-all") return formatJsonObject(await client.deleteAllKnowledgeNotes())
    return "Usage: /notes [search|delete-many|delete-all]"
  }
  if (command === "note") {
    const action = args[0]
    if (!action) return "Usage: /note show|create|update|delete|open"
    if (action === "show") {
      const noteId = args[1]
      if (!noteId) return "Usage: /note show <id>"
      return formatJsonObject(await client.getKnowledgeNote(noteId))
    }
    if (action === "open") return openKnowledgeNoteFileTarget(client, args[1])
    if (action === "create") {
      return withJsonPayload(args, "/note create <json>", 1, async (value) => formatKnowledgeNoteResponse(await client.createKnowledgeNote(value as any), "created"))
    }
    if (action === "update") {
      const noteId = args[1]
      if (!noteId) return "Usage: /note update <id> <json>"
      return withJsonPayload(args, "/note update <id> <json>", 2, async (value) => formatKnowledgeNoteResponse(await client.updateKnowledgeNote(noteId, value as any), "updated"))
    }
    if (action === "delete") {
      const noteId = args[1]
      if (!noteId) return "Usage: /note delete <id>"
      return formatDeleteResponse(await client.deleteKnowledgeNote(noteId), "Note")
    }
    return "Usage: /note show|create|update|delete|open"
  }
  if (command === "loops") {
    const action = args[0]
    if (!action) return formatLoops(await client.getLoops())
    if (action === "statuses") return formatJsonObject(await client.getLoopStatuses())
    if (action === "start-all") return formatActionResponse(await client.startAllLoops(), "loops-start-all")
    if (action === "stop-all") return formatActionResponse(await client.stopAllLoops(), "loops-stop-all")
    return "Usage: /loops [statuses|start-all|stop-all]"
  }
  if (command === "loop") {
    const action = args[0]
    if (!action) return "Usage: /loop create|import-markdown|export|update|delete|run|toggle|start|stop|open"
    if (action === "create") {
      return withJsonPayload(args, "/loop create <json>", 1, async (value) => formatLoopAction(await client.createLoop(value as any), "created"))
    }
    if (action === "import-markdown") {
      const content = textPayload(args, 1)
      if (!content) return "Usage: /loop import-markdown <markdown>"
      return formatLoopAction(await client.importLoopFromMarkdown(content), "imported")
    }
    if (action === "export") {
      const loopId = args[1]
      if (!loopId) return "Usage: /loop export <id>"
      return (await client.exportLoopToMarkdown(loopId)).content || ""
    }
    if (action === "update") {
      const loopId = args[1]
      if (!loopId) return "Usage: /loop update <id> <json>"
      return withJsonPayload(args, "/loop update <id> <json>", 2, async (value) => formatLoopAction(await client.updateLoop(loopId, value as any), "updated"))
    }
    if (action === "delete") {
      const loopId = args[1]
      if (!loopId) return "Usage: /loop delete <id>"
      return formatDeleteResponse(await client.deleteLoop(loopId), "Loop")
    }
    if (action === "open") return openLoopTaskFileTarget(client, args[1])

    const loopId = args[1]
    if (!loopId || !["run", "toggle", "start", "stop"].includes(action)) {
      return "Usage: /loop create|import-markdown|export|update|delete|run|toggle|start|stop|open"
    }
    if (action === "run") return formatLoopAction(await client.runLoop(loopId), action)
    if (action === "toggle") return formatLoopAction(await client.toggleLoop(loopId), action)
    if (action === "start") return formatLoopAction(await client.startLoop(loopId), action)
    return formatLoopAction(await client.stopLoop(loopId), action)
  }
  if (command === "agent") {
    const action = args[0]
    if (!action) return "Usage: /agent show|create|update|delete|toggle"
    if (action === "show") {
      const agentId = args[1]
      if (!agentId) return "Usage: /agent show <id>"
      return formatJsonObject(await client.getAgentProfile(agentId))
    }
    if (action === "verify") {
      return withJsonPayload(args, "/agent verify <json>", 1, async (value) => formatJsonObject(await client.verifyExternalAgentCommand(value as any)))
    }
    if (action === "create") {
      return withJsonPayload(args, "/agent create <json>", 1, async (value) => formatAgentProfileResponse(await client.createAgentProfile(value as any), "created"))
    }
    if (action === "update") {
      const agentId = args[1]
      if (!agentId) return "Usage: /agent update <id> <json>"
      return withJsonPayload(args, "/agent update <id> <json>", 2, async (value) => formatAgentProfileResponse(await client.updateAgentProfile(agentId, value as any), "updated"))
    }
    if (action === "delete") {
      const agentId = args[1]
      if (!agentId) return "Usage: /agent delete <id>"
      await client.deleteAgentProfile(agentId)
      return `Agent deleted: ${agentId}`
    }
    if (action === "toggle") {
      const agentId = args[1]
      if (!agentId) return "Usage: /agent toggle <id>"
      return formatAgentProfileResponse(await client.toggleAgentProfile(agentId), "toggled")
    }
    return "Usage: /agent show|verify|create|update|delete|toggle"
  }
  if (command === "bundle" || command === "bundles") {
    const action = args[0]
    if (action === "items") return formatJsonObject(await client.getBundleExportableItems())
    if (action === "export" || action === "export-file") {
      const parsed = action === "export-file" ? (args.length > 2 ? parseJsonPayload(args, "/bundle export-file <path> [json]", 2) : undefined) : (args.length > 1 ? parseJsonPayload(args, "/bundle export [json]", 1) : undefined)
      if (parsed && !parsed.ok) return parsed.message
      const response = await client.exportBundle((parsed?.value ?? {}) as any)
      if (action === "export") return formatJsonObject(response)
      const outputPath = args[1]
      if (!outputPath) return "Usage: /bundle export-file <path> [json]"
      fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true })
      fs.writeFileSync(path.resolve(outputPath), response.bundleJson)
      return `bundle-export-file: ok: ${path.resolve(outputPath)}`
    }
    if (action === "preview" || action === "preview-file") {
      const bundleJson = action === "preview-file" && args[1] ? fs.readFileSync(path.resolve(args[1]), "utf8") : textPayload(args, 1)
      if (!bundleJson) return "Usage: /bundle preview <bundle-json>"
      return formatJsonObject(await client.previewBundleImport({ bundleJson }))
    }
    if (action === "import" || action === "import-file") {
      const parsed = action === "import-file" && args.length <= 2 ? { ok: true, value: {} } as const : parseJsonPayload(args, action === "import-file" ? "/bundle import-file <path> [json-options]" : "/bundle import <json-request>", action === "import-file" ? 2 : 1)
      if (!parsed.ok) return parsed.message
      const value = parsed.value as any, bundleJson = action === "import-file" && args[1] ? fs.readFileSync(path.resolve(args[1]), "utf8") : undefined
      const request = typeof value?.bundleJson === "string"
        ? value
        : { bundleJson: bundleJson ?? JSON.stringify(value), conflictStrategy: "rename", ...value }
      return formatJsonObject(await client.importBundle(request))
    }
    return "Usage: /bundle items|export [json]|export-file <path> [json]|preview <bundle-json>|preview-file <path>|import <json-request>|import-file <path> [json-options]"
  }
  if (command === "mcp") {
    const action = args[0]
    if (!action) return formatMcpStatus(await client.getOperatorMCP())
    if (action === "tools") {
      return formatMcpTools(await client.getOperatorMCPTools(args[1]))
    }
    if (action === "servers") {
      return formatSavedMcpServers(await client.getMCPServers())
    }
    if (action === "logs") {
      const server = args[1]
      if (!server) return "Usage: /mcp logs <server> [count]"
      const count = args[2] ? Number(args[2]) : undefined
      return formatMcpLogs(await client.getOperatorMCPServerLogs(server, count))
    }
    if (action === "clear-logs") {
      const server = args[1]
      if (!server) return "Usage: /mcp clear-logs <server>"
      return formatActionResponse(await client.clearOperatorMCPServerLogs(server), "mcp-clear-logs")
    }
    if (action === "test") {
      const server = args[1]
      if (!server) return "Usage: /mcp test <server>"
      return formatActionResponse(await client.testOperatorMCPServer(server), "mcp-test")
    }
    if (["start", "stop", "restart"].includes(action)) {
      const server = args[1]
      if (!server) return `Usage: /mcp ${action} <server>`
      const response = action === "start"
        ? await client.startMCPServer(server)
        : action === "stop"
          ? await client.stopMCPServer(server)
          : await client.restartMCPServer(server)
      return formatActionResponse(response, `mcp-${action}`)
    }
    if (action === "enable-tool" || action === "disable-tool") {
      const toolName = args[1]
      if (!toolName) return `Usage: /mcp ${action} <tool-name>`
      const response = await client.setOperatorMCPToolEnabled(toolName, action === "enable-tool")
      return formatActionResponse(response, "mcp-tool-toggle")
    }
    if (action === "enable-server" || action === "disable-server") {
      const server = args[1]
      if (!server) return `Usage: /mcp ${action} <server>`
      const response = await client.toggleMCPServer(server, action === "enable-server")
      return formatActionResponse(response, "mcp-server-toggle")
    }
    if (action === "export-config") return formatJsonObject(await client.exportMCPServerConfigs())
    if (action === "export-config-file") {
      const outputPath = args[1]
      if (!outputPath) return "Usage: /mcp export-config-file <path>"
      const resolvedPath = path.resolve(outputPath)
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true })
      fs.writeFileSync(resolvedPath, formatJsonObject(await client.exportMCPServerConfigs()))
      return `mcp-export-config-file: ok: ${resolvedPath}`
    }
    if (action === "import-config") {
      return withJsonPayload(args, "/mcp import-config <json>", 1, async (value) => formatJsonObject(await client.importMCPServerConfigs(value as any)))
    }
    if (action === "import-config-file") {
      const inputPath = args[1]
      if (!inputPath) return "Usage: /mcp import-config-file <path>"
      return formatJsonObject(await client.importMCPServerConfigs(JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8")) as any))
    }
    if (action === "upsert-server") {
      const server = args[1]
      if (!server) return "Usage: /mcp upsert-server <server> <json>"
      return withJsonPayload(args, "/mcp upsert-server <server> <json>", 2, async (value) => formatJsonObject(await client.upsertMCPServerConfig(server, value as any)))
    }
    if (action === "delete-server-config") {
      const server = args[1]
      if (!server) return "Usage: /mcp delete-server-config <server>"
      return formatJsonObject(await client.deleteMCPServerConfig(server))
    }
    if (action === "oauth") {
      const server = args[1]
      const oauthAction = args[2] || "status"
      if (!server) return "Usage: /mcp oauth <server> [status|start|revoke]"
      if (oauthAction === "status") return formatJsonObject(await client.getMcpOAuthStatus(server))
      if (oauthAction === "start") return formatActionResponse(await client.initiateMcpOAuthFlow(server), "mcp-oauth-start")
      if (oauthAction === "revoke") return formatActionResponse(await client.revokeMcpOAuthTokens(server), "mcp-oauth-revoke")
      return "Usage: /mcp oauth <server> [status|start|revoke]"
    }
    return "Usage: /mcp [servers|tools|logs|clear-logs|test|start|stop|restart|enable-tool|disable-tool|enable-server|disable-server|export-config|export-config-file|import-config|import-config-file|upsert-server|delete-server-config|oauth]"
  }
  if (command === "errors") {
    if (args[0] === "clear") return formatActionResponse(await client.clearOperatorErrors(), "operator-clear-errors")
    const count = positiveNumberArg(args[0], 10)
    return formatRecentEvents(await client.getOperatorErrors(count), "Errors", "errors")
  }
  if (command === "diagnostics") {
    if (args[0] === "save") return formatActionResponse(await client.saveOperatorDiagnosticReport(args[1]), "operator-save-diagnostic-report")
    if (args.length > 0) return "Usage: /diagnostics [save [path]]"
    return formatJsonObject(await client.getOperatorDiagnosticReport())
  }
  if (command === "logs") {
    const count = positiveNumberArg(args[0], 20)
    const level = args[1]
    if (level && !["error", "warning", "info"].includes(level)) {
      return "Usage: /logs [count] [error|warning|info]"
    }
    return formatRecentEvents(
      await client.getOperatorLogs(count, level as "error" | "warning" | "info" | undefined),
      "Logs",
      "logs",
    )
  }
  if (command === "audit") {
    const count = positiveNumberArg(args[0], 20)
    return formatAuditEntries(await client.getOperatorAudit(count))
  }
  if (command === "conversations") {
    return formatConversations(await client.getOperatorConversations(20))
  }
  if (command === "conversation") {
    const action = args[0]
    if (action === "list") return formatJsonObject(await client.getConversations())
    if (action === "asset") {
      const kind = args[1]
      const id = args[2]
      const fileName = args[3]
      const outputPath = args[4]
      if (!["image", "video"].includes(kind || "") || !id || !fileName || !outputPath) return "Usage: /conversation asset image|video <id> <file> <output-path>"
      const response = kind === "image"
        ? await client.getConversationImageAssetResponse(id, fileName)
        : await client.getConversationVideoAssetResponse(id, fileName)
      return saveResponseBody(response, outputPath, `conversation-${kind}-asset`)
    }
    if (action === "show") {
      const id = args[1]
      if (!id) return "Usage: /conversation show <id>"
      return formatJsonObject(await client.getConversation(id))
    }
    if (action === "create") {
      return withJsonPayload(args, "/conversation create <json>", 1, async (value) => formatJsonObject(await client.createConversation(value as any)))
    }
    if (action === "update") {
      const id = args[1]
      if (!id) return "Usage: /conversation update <id> <json>"
      return withJsonPayload(args, "/conversation update <id> <json>", 2, async (value) => formatJsonObject(await client.updateConversation(id, value as any)))
    }
    if (action === "branch") {
      const id = args[1]
      if (!id) return "Usage: /conversation branch <id> <json>"
      return withJsonPayload(args, "/conversation branch <id> <json>", 2, async (value) => formatJsonObject(await client.branchConversation(id, value as any)))
    }
    if (action === "delete") {
      const id = args[1]
      if (!id) return "Usage: /conversation delete <id>"
      return formatJsonObject(await client.deleteConversation(id))
    }
    if (action === "delete-all") return formatJsonObject(await client.deleteAllConversations())
    return "Usage: /conversation list|asset|show|create|update|branch|delete|delete-all"
  }
  if (command === "approvals") {
    const limit = positiveNumberArg(args[0], 20)
    return formatJsonObject(await client.getAgentSessionCandidates(limit))
  }
  if (command === "approval") {
    const approvalId = args[0]
    const action = args[1]
    if (!approvalId || !["approve", "reject"].includes(action || "")) return "Usage: /approval <id> approve|reject"
    return formatJsonObject(await client.respondToToolApproval(approvalId, action === "approve"))
  }
  if (command === "session") {
    const action = args[0]
    const sessionId = args[1]
    const run = sessionId ? ({
      show: () => client.showOperatorAgentSession(sessionId),
      stop: () => client.stopOperatorAgentSession(sessionId),
      snooze: () => client.snoozeOperatorAgentSession(sessionId),
      unsnooze: () => client.unsnoozeOperatorAgentSession(sessionId),
      clear: () => client.clearOperatorAgentSession(sessionId),
    } as Record<string, () => Promise<any>>)[action || ""] : undefined
    return run ? formatActionResponse(await run(), `session-${action}`) : "Usage: /session show|stop|snooze|unsnooze|clear <session-id>"
  }
  if (command === "sessions") {
    const action = args[0]
    if (action === "clear-inactive") return formatActionResponse(await client.clearInactiveOperatorAgentSessions(), "sessions-clear-inactive")
    if (action === "snooze-hide") return formatActionResponse(await client.snoozeOperatorAgentSessionsAndHidePanel(args.slice(1)), "sessions-snooze-hide")
    return "Usage: /sessions clear-inactive|snooze-hide [session-ids...]"
  }
  if (command === "queues") {
    return formatMessageQueues(await client.getOperatorMessageQueues())
  }
  if (command === "queue") {
    const action = args[0]
    const conversationId = args[1]
    if (["pause", "resume", "clear"].includes(action || "")) {
      if (!conversationId) return `Usage: /queue ${action} <conversation-id>`
      const path =
        action === "pause"
          ? client.pauseOperatorMessageQueue(conversationId)
          : action === "resume"
            ? client.resumeOperatorMessageQueue(conversationId)
            : client.clearOperatorMessageQueue(conversationId)
      return formatActionResponse(await path, `message-queue-${action}`)
    }
    if (action === "msg") {
      const messageAction = args[1]
      const queuedConversationId = args[2]
      const messageId = args[3]
      if (!messageAction || !queuedConversationId || !messageId) {
        return "Usage: /queue msg delete|retry|update <conversation-id> <message-id> [text]"
      }
      if (messageAction === "delete" || messageAction === "remove") {
        return formatActionResponse(await client.removeOperatorQueuedMessage(queuedConversationId, messageId), "message-queue-message-delete")
      }
      if (messageAction === "retry") {
        return formatActionResponse(await client.retryOperatorQueuedMessage(queuedConversationId, messageId), "message-queue-message-retry")
      }
      if (messageAction === "update") {
        const text = args.slice(4).join(" ").trim()
        if (!text) return "Usage: /queue msg update <conversation-id> <message-id> <text>"
        return formatActionResponse(await client.updateOperatorQueuedMessageText(queuedConversationId, messageId, text), "message-queue-message-update")
      }
    }
    return "Usage: /queue pause|resume|clear <conversation-id> | /queue msg delete|retry|update <conversation-id> <message-id> [text]"
  }
  if (command === "provider") {
    const provider = args[0]
    const action = args[1]
    if (provider !== "chatgpt-web") return "Usage: /provider chatgpt-web [login|logout]"
    if (!action) return formatJsonObject(await client.getChatGptWebAuthStatus())
    if (action === "login") return formatActionResponse(await client.loginChatGptWebOAuth(), "chatgpt-web-login")
    if (action === "logout") return formatActionResponse(await client.logoutChatGptWebOAuth(), "chatgpt-web-logout")
    return "Usage: /provider chatgpt-web [login|logout]"
  }
  if (command === "langfuse") {
    return args.length === 0 || args[0] === "installed" ? `Langfuse installed: ${boolLabel(isLangfuseInstalled)}` : "Usage: /langfuse [installed]"
  }
  if (command === "permissions") {
    return args[0] === "open-microphone-settings" ? openMicrophoneSettings() : "Usage: /permissions open-microphone-settings"
  }
  if (command === "clipboard") {
    const text = textPayload(args, 1)
    if (args[0] !== "write" || !text) return "Usage: /clipboard write <text>"
    return writeClipboardText(text)
  }
  if (command === "remote-server") {
    if (args[0] === "qr") return formatRemoteServerQr(client, textPayload(args, 1) || undefined)
    if (args.length > 0) return "Usage: /remote-server [qr [url]]"
    return formatRemoteServer(await client.getOperatorRemoteServer())
  }
  if (command === "tunnel") {
    const action = args[0]
    if (!action) return formatTunnel(await client.getOperatorTunnel())
    if (action === "setup") return formatTunnelSetup(await client.getOperatorTunnelSetup())
    if (action === "start" || action === "stop") {
      return formatActionResponse(
        action === "start" ? await client.startOperatorTunnel() : await client.stopOperatorTunnel(),
        `tunnel-${action}`,
      )
    }
    return "Usage: /tunnel [setup|start|stop]"
  }
  if (command === "integrations") {
    return formatIntegrations(await client.getOperatorIntegrations())
  }
  if (command === "discord") {
    const action = args[0]
    if (!action) return formatDiscord(await client.getOperatorDiscord())
    if (action === "logs") {
      const count = positiveNumberArg(args[1], 20)
      return formatDiscordLogs(await client.getOperatorDiscordLogs(count))
    }
    const run = ({ connect: () => client.connectOperatorDiscord(), disconnect: () => client.disconnectOperatorDiscord(), "clear-logs": () => client.clearOperatorDiscordLogs() } as Record<string, () => Promise<any>>)[action]
    return run ? formatActionResponse(await run(), `discord-${action}`) : "Usage: /discord [logs|connect|disconnect|clear-logs]"
  }
  if (command === "whatsapp") {
    const action = args[0]
    if (!action) return formatWhatsApp(await client.getOperatorWhatsApp())
    if (action === "connect" || action === "logout") {
      return formatActionResponse(
        action === "connect" ? await client.connectOperatorWhatsApp() : await client.logoutOperatorWhatsApp(),
        `whatsapp-${action}`,
      )
    }
    return "Usage: /whatsapp [connect|logout]"
  }
  if (command === "updater") {
    const action = args[0]
    if (!action) return formatUpdater(await client.getOperatorUpdater())
    const run = ({ check: () => client.checkOperatorUpdater(), download: () => client.downloadOperatorUpdateAsset(), reveal: () => client.revealOperatorUpdateAsset(), open: () => client.openOperatorUpdateAsset(), releases: () => client.openOperatorReleasesPage() } as Record<string, () => Promise<any>>)[action]
    return run ? formatActionResponse(await run(), `updater-${action}`) : "Usage: /updater [check|download|reveal|open|releases]"
  }
  if (command === "speech") {
    const action = args[0]
    if (!action) return formatLocalSpeechModels(await client.getLocalSpeechModelStatuses())
    const providerId = args[1]
    if ((action === "show" || action === "download") && !providerId) return `Usage: /speech ${action} <provider>`
    if (action === "show") {
      return formatLocalSpeechModel(providerId, await client.getLocalSpeechModelStatus(providerId as any))
    }
    if (action === "download") {
      return formatActionResponse(await client.downloadLocalSpeechModel(providerId as any), "local-speech-download")
    }
    return "Usage: /speech [show|download] <provider>"
  }
  if (command === "tts") {
    const action = args[0]
    if (action === "stop") return formatActionResponse(await client.stopOperatorTtsPlayback(), "stop-tts")
    if (action === "speak") {
      const parsed = parseJsonPayload(args, "/tts speak <json>", 1)
      if (!parsed.ok) return parsed.message
      const response = await client.synthesizeSpeech(parsed.value as any)
      return [
        "tts-speak: ok",
        `  MIME: ${response.mimeType}`,
        `  Provider: ${compactText(response.provider)}`,
        `  Bytes: ${response.audio.byteLength}`,
      ].join("\n")
    }
    return "Usage: /tts stop|speak <json>"
  }
  if (command === "push") {
    const action = args[0]
    if (action === "status") return formatJsonObject(await client.getPushStatus())
    if (action === "register") {
      return withJsonPayload(args, "/push register <json>", 1, async (value) => formatActionResponse(await client.registerPushToken(value as any), "push-register"))
    }
    if (action === "unregister") {
      const token = args[1]
      if (!token) return "Usage: /push unregister <token>"
      return formatActionResponse(await client.unregisterPushToken(token), "push-unregister")
    }
    if (action === "clear-badge") {
      const token = args[1]
      if (!token) return "Usage: /push clear-badge <token>"
      return formatActionResponse(await client.clearPushBadge(token), "push-clear-badge")
    }
    return "Usage: /push status|register <json>|unregister <token>|clear-badge <token>"
  }
  if (command === "window") {
    const target = args[0]
    const action = args[1]
    if (target === "main" && (!action || action === "show")) {
      const route = args[2] ? { path: args[2] } : undefined
      return formatActionResponse(await client.showOperatorMainWindow(route as any), "window-main-show")
    }
    if (target === "panel") {
      if (action === "show") return formatActionResponse(await client.showOperatorPanelWindow(), "window-panel-show")
      if (action === "hide") return formatActionResponse(await client.hideOperatorPanelWindow(), "window-panel-hide")
      if (action === "reset") return formatActionResponse(await client.resetOperatorPanelWindow(), "window-panel-reset")
    }
    return "Usage: /window main [show] [route] | /window panel show|hide|reset"
  }
  if (command === "run-agent") {
    const payload = textPayload(args)
    if (!payload) return "Usage: /run-agent <prompt-or-json>"
    const parsedBody = payload.startsWith("{") ? parseJsonPayload(args, "/run-agent <json>") : undefined
    if (parsedBody && !parsedBody.ok) {
      return parsedBody.message
    }
    const body = parsedBody?.value ?? { prompt: payload }
    if (!body) {
      const parsed = parseJsonPayload(args, "/run-agent <json>")
      return parsed.ok ? "Usage: /run-agent <prompt-or-json>" : parsed.message
    }
    return formatRunAgent(await client.runOperatorAgent(body as any))
  }
  if (command === "server") {
    if (args[0] !== "restart") return "Usage: /server restart"
    return formatActionResponse(await client.restartRemoteServer(), "restart-remote-server")
  }
  if (command === "app") {
    if (args[0] !== "restart") return "Usage: /app restart"
    return formatActionResponse(await client.restartApp(), "restart-app")
  }
  if (command === "key") {
    if (args[0] !== "rotate") return "Usage: /key rotate"
    return formatApiKeyRotation(await client.rotateOperatorApiKey())
  }
  if (command === "stop") {
    return formatActionResponse(await client.emergencyStop(), "emergency-stop")
  }
  if (command === "quit" || command === "exit" || command === "clear") {
    return ""
  }
  return `Unknown command: /${command}\n${COMMAND_HELP}`
}
async function streamChat(
  message: string,
  conversationId: string | undefined,
  handlers: StreamHandlers,
) {
  const { apiKeySource } = serverSettings()
  const res = await settingsApiClient().requestChatCompletionResponse(
    {
      messages: [{ role: "user", content: message }],
      stream: true,
      conversation_id: conversationId,
    },
  )
  if (!res.ok || !res.body) {
    const authHint =
      res.status === 401
        ? ` Check API key source: ${apiKeySource}. You can override with DOTAGENTS_API_KEY.`
        : ""
    throw new Error(`Server returned HTTP ${res.status}.${authHint}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  const seenSteps = new Set<string>()
  const findEventBoundary = (value: string) => {
    const match = /\r?\n\r?\n/.exec(value)
    return match && match.index !== undefined
      ? { index: match.index, length: match[0].length }
      : undefined
  }
  const handleEvent = (raw: string) => {
    const data = raw
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data: ?/, ""))
      .join("\n")
    if (!data) return
    let event
    try {
      event = JSON.parse(data)
    } catch (error) {
      const preview = data.length > 120 ? `${data.slice(0, 117)}...` : data
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Invalid SSE data frame: ${preview} (${message})`)
    }
    if (event.type === "progress") {
      const payload = event.data || {}
      const steps = Array.isArray(payload.steps) ? payload.steps : []
      for (const step of steps) {
        if (!step?.id || seenSteps.has(step.id)) continue
        seenSteps.add(step.id)
        if (step.title !== "Agent response")
          handlers.step?.(step.title || step.type || "step", step.description)
      }
      if (typeof payload.streamingContent?.text === "string")
        handlers.text?.(payload.streamingContent.text)
    } else if (event.type === "done") {
      handlers.done?.(event.data?.content || "", event.data?.conversation_id)
    } else if (event.type === "error") {
      throw new Error(event.data?.message || "stream error")
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    let boundary = findEventBoundary(buffer)
    while (boundary) {
      handleEvent(buffer.slice(0, boundary.index).trim())
      buffer = buffer.slice(boundary.index + boundary.length)
      boundary = findEventBoundary(buffer)
    }
    if (done) break
  }
  if (buffer.trim()) handleEvent(buffer.trim())
}
function usage() {
  console.log(
    `DotAgents OpenTUI client\n\nRun:   pnpm tui\nSmoke: pnpm tui -- --once "hello"\nOps:   pnpm tui -- --once "/status"\nEnv:   DOTAGENTS_SERVER_URL=http://127.0.0.1:3210 DOTAGENTS_API_KEY=...`,
  )
}
async function runOnce(message: string) {
  const commandOutput = await runServerCommand(message)
  if (commandOutput !== undefined) {
    console.log(commandOutput)
    return
  }

  let last = ""
  await streamChat(message, undefined, {
    step: (title, desc) => console.log(`• ${title}${desc ? ` — ${desc}` : ""}`),
    text: (text) => {
      const delta = textDelta(last, text)
      if (delta) process.stdout.write(delta)
      last = text
    },
    done: (content) => {
      const delta = textDelta(last, content)
      process.stdout.write(delta)
      console.log()
    },
  })
}
async function runTui() {
  if (!process.stdout.isTTY)
    throw new Error(
      "OpenTUI needs an interactive terminal. Use --once for non-interactive smoke checks.",
    )
  const { url } = serverSettings()
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
    backgroundColor: COLORS.bg,
    consoleMode: "disabled",
  })
  const root = new BoxRenderable(renderer, {
    id: "root",
    width: "100%",
    height: "100%",
    flexDirection: "column",
    padding: 1,
    gap: 1,
    backgroundColor: COLORS.bg,
  })
  const header = new TextRenderable(renderer, {
    content: `DotAgents TUI  ${url}  - enter send - /help commands - /quit exit - ctrl+l clear`,
    fg: COLORS.accent,
    attributes: TextAttributes.BOLD,
  })
  const log = new ScrollBoxRenderable(renderer, {
    id: "log",
    width: "100%",
    flexGrow: 1,
    border: true,
    borderStyle: "rounded",
    borderColor: COLORS.border,
    padding: 1,
    stickyScroll: true,
    stickyStart: "bottom",
    backgroundColor: COLORS.panel,
  })
  const status = new TextRenderable(renderer, {
    content: "Ready",
    fg: COLORS.dim,
  })
  const input = new InputRenderable(renderer, {
    id: "input",
    width: "100%",
    placeholder: "Message the agent…",
    backgroundColor: COLORS.panel,
    focusedBackgroundColor: "#15202b",
    textColor: COLORS.agent,
    cursorColor: COLORS.accent,
  })
  root.add(header)
  root.add(log)
  root.add(status)
  root.add(input)
  renderer.root.add(root)

  let busy = false,
    conversationId: string | undefined
  const addLine = (content: string, fg = COLORS.agent) => {
    log.add(
      new TextRenderable(renderer, {
        content,
        width: "100%",
        fg,
        marginBottom: 1,
      }),
    )
    log.scrollTo(log.scrollHeight)
    renderer.requestRender()
  }
  const clearLog = () => {
    for (const child of log.getChildren()) log.remove(child.id)
    renderer.requestRender()
  }
  addLine("Connected. Type a message or /help for server commands.", COLORS.dim)

  input.on(InputRenderableEvents.ENTER, async (value: string) => {
    const message = value.trim()
    if (!message || busy) return
    input.value = ""
    if (message === "/quit" || message === "/exit") {
      renderer.destroy()
      process.exit(0)
    }
    if (message === "/clear") {
      clearLog()
      return
    }
    busy = true
    const isCommand = message.startsWith("/")
    addLine(`${isCommand ? "Command" : "You"}: ${message}`, COLORS.user)
    const reply = new TextRenderable(renderer, {
      content: isCommand ? "Server: " : "Agent: ",
      width: "100%",
      fg: COLORS.agent,
      marginBottom: 1,
    })
    log.add(reply)
    let streamed = ""
    try {
      const commandOutput = await runServerCommand(message)
      if (commandOutput !== undefined) {
        reply.content = `Server:\n${commandOutput}`
        status.content = "Ready"
      } else {
        await streamChat(message, conversationId, {
          step: (title, desc) => {
            status.content = `${title}${desc ? ` - ${desc}` : ""}`
            renderer.requestRender()
          },
          text: (text) => {
            streamed = text
            reply.content = `Agent: ${streamed}`
            log.scrollTo(log.scrollHeight)
            renderer.requestRender()
          },
          done: (content, cid) => {
            conversationId = cid || conversationId
            if (content && content !== streamed) {
              streamed = content
              reply.content = `Agent: ${streamed}`
            }
          },
        })
        status.content = conversationId ? `Ready - ${conversationId}` : "Ready"
      }
    } catch (error) {
      reply.content = `Error: ${error instanceof Error ? error.message : String(error)}`
      reply.setForegroundColor?.(COLORS.error)
      status.content = "Error"
    } finally {
      busy = false
      renderer.requestRender()
    }
  })
  renderer.keyInput.on("keypress", (key) => {
    if (key.ctrl && key.name === "l") clearLog()
  })
  input.focus()
  renderer.start()
}
const args = parseArgs()
if (args.help) usage()
else if (args.once) await runOnce(args.once)
else await runTui()
