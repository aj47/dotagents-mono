#!/usr/bin/env bun
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
import {
  REMOTE_SERVER_API_BUILDERS,
  REMOTE_SERVER_API_PATHS,
  REMOTE_SERVER_API_PREFIX,
  getRemoteServerApiRoutePath,
} from "@dotagents/shared/remote-server-api"

type Config = { remoteServerPort?: number; remoteServerApiKey?: string }
type StreamHandlers = {
  step?: (title: string, description?: string) => void
  text?: (text: string) => void
  done?: (content: string, conversationId?: string) => void
}
type ServerSettings = {
  url: string
  apiKey: string
  configPath: string
  apiKeySource: string
}

const SECRET_REF_PREFIX = "dotagents-secret://"
const SECRETS_LOCAL_JSON = "secrets.local.json"

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

const COMMAND_HELP = [
  "Slash commands:",
  "  /status                         Show server, health, session, and integration status",
  "  /health                         Show health checks",
  "  /agents                         List agent profiles",
  "  /profiles                       List legacy profiles",
  "  /use <profile-id>               Select the current legacy profile",
  "  /profile export <profile-id>    Print profile JSON",
  "  /profile import <json>          Import profile JSON",
  "  /settings                       Show remote settings",
  "  /settings patch <json>          Patch remote settings",
  "  /presets                        List model endpoints",
  "  /preset use <preset-id>         Select a model endpoint",
  "  /preset create <json>           Create a model endpoint",
  "  /preset update <id> <json>      Update a model endpoint",
  "  /preset delete <id>             Delete a model endpoint",
  "  /skills                         List skills and current-profile enablement",
  "  /skill <skill-id>               Toggle a skill for the current profile",
  "  /skill show <id>                Show skill details",
  "  /skill create <json>            Create a skill",
  "  /skill update <id> <json>       Update a skill",
  "  /skill delete <id>              Delete a skill",
  "  /notes                          List knowledge notes",
  "  /note show <id>                 Show note details",
  "  /note create <json>             Create a note",
  "  /note update <id> <json>        Update a note",
  "  /note delete <id>               Delete a note",
  "  /loops                          List repeat tasks",
  "  /loop create <json>             Create a repeat task",
  "  /loop update <id> <json>        Update a repeat task",
  "  /loop delete <id>               Delete a repeat task",
  "  /loop run <loop-id>             Run a repeat task now",
  "  /loop toggle <loop-id>          Toggle a repeat task",
  "  /agent show <id>                Show agent profile details",
  "  /agent create <json>            Create an agent profile",
  "  /agent update <id> <json>       Update an agent profile",
  "  /agent delete <id>              Delete an agent profile",
  "  /agent toggle <id>              Toggle an agent profile",
  "  /mcp                            Show MCP server status",
  "  /mcp servers                    List saved MCP servers",
  "  /mcp tools [server]             List MCP tools",
  "  /mcp logs <server> [count]      Show MCP server logs",
  "  /mcp test <server>              Test an MCP server",
  "  /mcp start|stop|restart <server> Control an MCP server",
  "  /mcp enable-tool|disable-tool <tool> Toggle a tool",
  "  /mcp enable-server|disable-server <server> Toggle saved MCP server",
  "  /mcp clear-logs <server>        Clear MCP server logs",
  "  /errors [count]                 Show recent operator errors",
  "  /logs [count] [level]           Show operator logs",
  "  /audit [count]                  Show operator audit entries",
  "  /conversations                  List recent server conversations",
  "  /session stop <session-id>      Stop an active agent session",
  "  /queues                         List queued desktop messages",
  "  /queue pause|resume|clear <conversation-id>",
  "  /queue msg delete|retry|update <conversation-id> <message-id> [text]",
  "  /remote-server                  Show remote server status",
  "  /tunnel [setup|start|stop]      Show or control the Cloudflare tunnel",
  "  /integrations                   Show integration status",
  "  /discord [logs|connect|disconnect|clear-logs]",
  "  /whatsapp [connect|logout]      Show or control WhatsApp",
  "  /updater [check|download|reveal|open|releases]",
  "  /speech [show|download] <provider>",
  "  /run-agent <prompt-or-json>     Run the desktop agent",
  "  /server restart                 Restart the remote server",
  "  /app restart                    Restart the desktop app",
  "  /key rotate                     Rotate the remote server API key",
  "  /stop                           Emergency-stop active agent sessions",
  "  /clear                          Clear the TUI log",
  "  /quit                           Exit",
].join("\n")

function configFilePath() {
  const home = os.homedir()
  const linux = path.join(home, ".config", "app.dotagents", "config.json")
  const mac = path.join(
    home,
    "Library",
    "Application Support",
    "app.dotagents",
    "config.json",
  )
  const windows = process.env.APPDATA
    ? path.join(process.env.APPDATA, "app.dotagents", "config.json")
    : path.join(home, "AppData", "Roaming", "app.dotagents", "config.json")
  const candidates =
    process.platform === "win32"
      ? [windows, linux, mac]
      : [linux, mac]
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]
}

function readConfig(): Config {
  try {
    return JSON.parse(fs.readFileSync(configFilePath(), "utf8"))
  } catch {
    return {}
  }
}

function secretReferenceCandidates(secretId: string): string[] {
  const candidates = new Set([secretId])
  let current = secretId
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(current)
      if (decoded === current) break
      candidates.add(decoded)
      current = decoded
    } catch {
      break
    }
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

function normalizeServerUrl(value: string): string {
  const trimmed = value.replace(/\/+$/, "")
  return trimmed.endsWith(REMOTE_SERVER_API_PREFIX)
    ? trimmed.slice(0, -REMOTE_SERVER_API_PREFIX.length)
    : trimmed
}

function parseArgs() {
  const args = process.argv.slice(2)
  const onceIndex = args.findIndex((arg) => arg === "--once")
  return {
    help: args.includes("--help") || args.includes("-h"),
    once: onceIndex >= 0 ? args.slice(onceIndex + 1).join(" ") : "",
  }
}

function textDelta(previous: string, next: string) {
  if (!next) return ""
  if (!previous) return next
  if (next.startsWith(previous)) return next.slice(previous.length)
  if (previous.startsWith(next)) return ""
  return `\n${next}`
}

function routeUrl(pathname: string): string {
  return `${serverSettings().url}${getRemoteServerApiRoutePath(pathname)}`
}

async function apiRequest<T>(pathname: string, options: RequestInit = {}): Promise<T> {
  const { apiKey, apiKeySource } = serverSettings()
  const headers = new Headers(options.headers)
  if (apiKey) headers.set("authorization", `Bearer ${apiKey}`)
  if (options.body !== undefined && options.body !== null && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  const res = await fetch(routeUrl(pathname), {
    ...options,
    headers,
  })

  if (!res.ok) {
    const details = await res
      .clone()
      .json()
      .then((body) => body?.error || body?.message || JSON.stringify(body))
      .catch(async () => await res.text().catch(() => res.statusText))
    const authHint =
      res.status === 401
        ? ` Check API key source: ${apiKeySource}. You can override with DOTAGENTS_API_KEY.`
        : ""
    throw new Error(`Server returned HTTP ${res.status}${details ? `: ${details}` : ""}.${authHint}`)
  }

  if (res.status === 204) return undefined as T
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) return await res.json()
  return (await res.text()) as T
}

function boolLabel(value: unknown): string {
  return value ? "yes" : "no"
}

function compactText(value: unknown, fallback = "-"): string {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

function compactSnippet(value: unknown, maxLength = 96): string {
  const text = compactText(value, "").replace(/\s+/g, " ").trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`
}

function positiveNumberArg(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback
}

function formatTimestamp(timestamp?: number): string {
  return timestamp ? new Date(timestamp).toLocaleString() : "-"
}

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

function formatJsonObject(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2)
}

function formatActionResponse(response: any, fallbackAction: string): string {
  const success = response?.success === false ? "failed" : "ok"
  const action = compactText(response?.action, fallbackAction)
  const message = compactText(response?.message || response?.error, "")
  return [action, success, message].filter(Boolean).join(": ")
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

async function runServerCommand(input: string): Promise<string | undefined> {
  const message = input.trim()
  if (!message.startsWith("/")) return undefined

  const [command, ...args] = message.slice(1).split(/\s+/).filter(Boolean)
  if (!command || command === "help") return COMMAND_HELP

  if (command === "status") {
    return formatStatus(await apiRequest(REMOTE_SERVER_API_PATHS.operatorStatus))
  }

  if (command === "health") {
    return formatHealth(await apiRequest(REMOTE_SERVER_API_PATHS.operatorHealth))
  }

  if (command === "agents") {
    return formatAgentProfiles(await apiRequest(REMOTE_SERVER_API_PATHS.agentProfiles))
  }

  if (command === "profiles") {
    return formatProfiles(await apiRequest(REMOTE_SERVER_API_PATHS.profiles))
  }

  if (command === "use") {
    const profileId = args[0]
    if (!profileId) return "Usage: /use <profile-id>"
    const response = await apiRequest(REMOTE_SERVER_API_PATHS.currentProfile, {
      method: "POST",
      body: JSON.stringify({ profileId }),
    })
    return `Current profile: ${compactText((response as any)?.profile?.id || profileId)}`
  }

  if (command === "profile") {
    const action = args[0]
    if (action === "export") {
      const profileId = args[1]
      if (!profileId) return "Usage: /profile export <profile-id>"
      const response = await apiRequest<{ profileJson?: string }>(REMOTE_SERVER_API_BUILDERS.profileExport(profileId))
      return response.profileJson || ""
    }

    if (action === "import") {
      const profileJson = args.slice(1).join(" ").trim()
      if (!profileJson) return "Usage: /profile import <json>"
      const response = await apiRequest(REMOTE_SERVER_API_PATHS.profileImport, {
        method: "POST",
        body: JSON.stringify({ profileJson }),
      })
      return `Profile imported: ${compactText((response as any)?.profile?.id)}`
    }

    return "Usage: /profile export <profile-id> | /profile import <json>"
  }

  if (command === "settings") {
    const action = args[0]
    if (!action) return formatSettings(await apiRequest(REMOTE_SERVER_API_PATHS.settings))
    if (action === "patch") {
      const parsed = parseJsonPayload(args, "/settings patch <json>", 1)
      if (!parsed.ok) return parsed.message
      return formatSettingsPatch(await apiRequest(REMOTE_SERVER_API_PATHS.settings, {
        method: "PATCH",
        body: JSON.stringify(parsed.value),
      }))
    }
    return "Usage: /settings [patch <json>]"
  }

  if (command === "presets") {
    return formatModelPresets(await apiRequest(REMOTE_SERVER_API_PATHS.operatorModelPresets))
  }

  if (command === "preset") {
    const action = args[0]
    if (!action) return "Usage: /preset use|create|update|delete"

    if (action === "use") {
      const presetId = args[1]
      if (!presetId) return "Usage: /preset use <preset-id>"
      return formatSettingsPatch(await apiRequest(REMOTE_SERVER_API_PATHS.settings, {
        method: "PATCH",
        body: JSON.stringify({ currentModelPresetId: presetId }),
      }))
    }

    if (action === "create") {
      const parsed = parseJsonPayload(args, "/preset create <json>", 1)
      if (!parsed.ok) return parsed.message
      return formatModelPresetMutation(await apiRequest(REMOTE_SERVER_API_PATHS.operatorModelPresets, {
        method: "POST",
        body: JSON.stringify(parsed.value),
      }), "created")
    }

    if (action === "update") {
      const presetId = args[1]
      if (!presetId) return "Usage: /preset update <id> <json>"
      const parsed = parseJsonPayload(args, "/preset update <id> <json>", 2)
      if (!parsed.ok) return parsed.message
      return formatModelPresetMutation(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorModelPreset(presetId), {
        method: "PATCH",
        body: JSON.stringify(parsed.value),
      }), "updated")
    }

    if (action === "delete") {
      const presetId = args[1]
      if (!presetId) return "Usage: /preset delete <id>"
      return formatModelPresetMutation(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorModelPreset(presetId), {
        method: "DELETE",
      }), "deleted")
    }

    return "Usage: /preset use|create|update|delete"
  }

  if (command === "skills") {
    return formatSkills(await apiRequest(REMOTE_SERVER_API_PATHS.skills))
  }

  if (command === "skill") {
    const action = args[0]
    if (!action) return "Usage: /skill <skill-id> | /skill show|toggle|create|update|delete"

    if (action === "show") {
      const skillId = args[1]
      if (!skillId) return "Usage: /skill show <id>"
      return formatJsonObject(await apiRequest(REMOTE_SERVER_API_BUILDERS.skill(skillId)))
    }

    if (action === "create") {
      const parsed = parseJsonPayload(args, "/skill create <json>", 1)
      if (!parsed.ok) return parsed.message
      return formatSkillResponse(await apiRequest(REMOTE_SERVER_API_PATHS.skills, {
        method: "POST",
        body: JSON.stringify(parsed.value),
      }), "created")
    }

    if (action === "update") {
      const skillId = args[1]
      if (!skillId) return "Usage: /skill update <id> <json>"
      const parsed = parseJsonPayload(args, "/skill update <id> <json>", 2)
      if (!parsed.ok) return parsed.message
      return formatSkillResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.skill(skillId), {
        method: "PATCH",
        body: JSON.stringify(parsed.value),
      }), "updated")
    }

    if (action === "delete") {
      const skillId = args[1]
      if (!skillId) return "Usage: /skill delete <id>"
      return formatDeleteResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.skill(skillId), {
        method: "DELETE",
      }), "Skill")
    }

    const skillId = action === "toggle" ? args[1] : action
    if (!skillId) return "Usage: /skill <skill-id> | /skill toggle <skill-id>"
    return formatSkillToggle(await apiRequest(REMOTE_SERVER_API_BUILDERS.skillToggleProfile(skillId), {
      method: "POST",
    }))
  }

  if (command === "notes") {
    return formatKnowledgeNotes(await apiRequest(REMOTE_SERVER_API_PATHS.knowledgeNotes))
  }

  if (command === "note") {
    const action = args[0]
    if (!action) return "Usage: /note show|create|update|delete"

    if (action === "show") {
      const noteId = args[1]
      if (!noteId) return "Usage: /note show <id>"
      return formatJsonObject(await apiRequest(REMOTE_SERVER_API_BUILDERS.knowledgeNote(noteId)))
    }

    if (action === "create") {
      const parsed = parseJsonPayload(args, "/note create <json>", 1)
      if (!parsed.ok) return parsed.message
      return formatKnowledgeNoteResponse(await apiRequest(REMOTE_SERVER_API_PATHS.knowledgeNotes, {
        method: "POST",
        body: JSON.stringify(parsed.value),
      }), "created")
    }

    if (action === "update") {
      const noteId = args[1]
      if (!noteId) return "Usage: /note update <id> <json>"
      const parsed = parseJsonPayload(args, "/note update <id> <json>", 2)
      if (!parsed.ok) return parsed.message
      return formatKnowledgeNoteResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.knowledgeNote(noteId), {
        method: "PATCH",
        body: JSON.stringify(parsed.value),
      }), "updated")
    }

    if (action === "delete") {
      const noteId = args[1]
      if (!noteId) return "Usage: /note delete <id>"
      return formatDeleteResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.knowledgeNote(noteId), {
        method: "DELETE",
      }), "Note")
    }

    return "Usage: /note show|create|update|delete"
  }

  if (command === "loops") {
    return formatLoops(await apiRequest(REMOTE_SERVER_API_PATHS.loops))
  }

  if (command === "loop") {
    const action = args[0]
    if (!action) {
      return "Usage: /loop create|update|delete|run|toggle"
    }

    if (action === "create") {
      const parsed = parseJsonPayload(args, "/loop create <json>", 1)
      if (!parsed.ok) return parsed.message
      return formatLoopAction(await apiRequest(REMOTE_SERVER_API_PATHS.loops, {
        method: "POST",
        body: JSON.stringify(parsed.value),
      }), "created")
    }

    if (action === "update") {
      const loopId = args[1]
      if (!loopId) return "Usage: /loop update <id> <json>"
      const parsed = parseJsonPayload(args, "/loop update <id> <json>", 2)
      if (!parsed.ok) return parsed.message
      return formatLoopAction(await apiRequest(REMOTE_SERVER_API_BUILDERS.loop(loopId), {
        method: "PATCH",
        body: JSON.stringify(parsed.value),
      }), "updated")
    }

    if (action === "delete") {
      const loopId = args[1]
      if (!loopId) return "Usage: /loop delete <id>"
      return formatDeleteResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.loop(loopId), {
        method: "DELETE",
      }), "Loop")
    }

    const loopId = args[1]
    if (!loopId || !["run", "toggle"].includes(action)) {
      return "Usage: /loop create|update|delete|run|toggle"
    }
    const path = action === "run"
      ? REMOTE_SERVER_API_BUILDERS.loopRun(loopId)
      : REMOTE_SERVER_API_BUILDERS.loopToggle(loopId)
    return formatLoopAction(await apiRequest(path, { method: "POST" }), action)
  }

  if (command === "agent") {
    const action = args[0]
    if (!action) return "Usage: /agent show|create|update|delete|toggle"

    if (action === "show") {
      const agentId = args[1]
      if (!agentId) return "Usage: /agent show <id>"
      return formatJsonObject(await apiRequest(REMOTE_SERVER_API_BUILDERS.agentProfile(agentId)))
    }

    if (action === "create") {
      const parsed = parseJsonPayload(args, "/agent create <json>", 1)
      if (!parsed.ok) return parsed.message
      return formatAgentProfileResponse(await apiRequest(REMOTE_SERVER_API_PATHS.agentProfiles, {
        method: "POST",
        body: JSON.stringify(parsed.value),
      }), "created")
    }

    if (action === "update") {
      const agentId = args[1]
      if (!agentId) return "Usage: /agent update <id> <json>"
      const parsed = parseJsonPayload(args, "/agent update <id> <json>", 2)
      if (!parsed.ok) return parsed.message
      return formatAgentProfileResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.agentProfile(agentId), {
        method: "PATCH",
        body: JSON.stringify(parsed.value),
      }), "updated")
    }

    if (action === "delete") {
      const agentId = args[1]
      if (!agentId) return "Usage: /agent delete <id>"
      await apiRequest(REMOTE_SERVER_API_BUILDERS.agentProfile(agentId), { method: "DELETE" })
      return `Agent deleted: ${agentId}`
    }

    if (action === "toggle") {
      const agentId = args[1]
      if (!agentId) return "Usage: /agent toggle <id>"
      return formatAgentProfileResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.agentProfileToggle(agentId), {
        method: "POST",
      }), "toggled")
    }

    return "Usage: /agent show|create|update|delete|toggle"
  }

  if (command === "mcp") {
    const action = args[0]
    if (!action) return formatMcpStatus(await apiRequest(REMOTE_SERVER_API_PATHS.operatorMcp))

    if (action === "tools") {
      return formatMcpTools(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorMcpTools(args[1])))
    }

    if (action === "servers") {
      return formatSavedMcpServers(await apiRequest(REMOTE_SERVER_API_PATHS.mcpServers))
    }

    if (action === "logs") {
      const server = args[1]
      if (!server) return "Usage: /mcp logs <server> [count]"
      const count = args[2] ? Number(args[2]) : undefined
      return formatMcpLogs(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorMcpServerLogs(server, count)))
    }

    if (action === "clear-logs") {
      const server = args[1]
      if (!server) return "Usage: /mcp clear-logs <server>"
      return formatActionResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorMcpServerLogsClear(server), {
        method: "POST",
      }), "mcp-clear-logs")
    }

    if (action === "test") {
      const server = args[1]
      if (!server) return "Usage: /mcp test <server>"
      return formatActionResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorMcpServerTest(server), {
        method: "POST",
      }), "mcp-test")
    }

    if (["start", "stop", "restart"].includes(action)) {
      const server = args[1]
      if (!server) return `Usage: /mcp ${action} <server>`
      const path =
        action === "start"
          ? REMOTE_SERVER_API_PATHS.operatorMcpStart
          : action === "stop"
            ? REMOTE_SERVER_API_PATHS.operatorMcpStop
            : REMOTE_SERVER_API_PATHS.operatorMcpRestart
      return formatActionResponse(await apiRequest(path, {
        method: "POST",
        body: JSON.stringify({ server }),
      }), `mcp-${action}`)
    }

    if (action === "enable-tool" || action === "disable-tool") {
      const toolName = args[1]
      if (!toolName) return `Usage: /mcp ${action} <tool-name>`
      const response = await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorMcpToolToggle(toolName), {
        method: "POST",
        body: JSON.stringify({ enabled: action === "enable-tool" }),
      })
      return formatActionResponse(response, "mcp-tool-toggle")
    }

    if (action === "enable-server" || action === "disable-server") {
      const server = args[1]
      if (!server) return `Usage: /mcp ${action} <server>`
      const response = await apiRequest(REMOTE_SERVER_API_BUILDERS.mcpServerToggle(server), {
        method: "POST",
        body: JSON.stringify({ enabled: action === "enable-server" }),
      })
      return formatActionResponse(response, "mcp-server-toggle")
    }

    return "Usage: /mcp [servers|tools|logs|clear-logs|test|start|stop|restart|enable-tool|disable-tool|enable-server|disable-server]"
  }

  if (command === "errors") {
    const count = positiveNumberArg(args[0], 10)
    return formatRecentEvents(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorErrors(count)), "Errors", "errors")
  }

  if (command === "logs") {
    const count = positiveNumberArg(args[0], 20)
    const level = args[1]
    if (level && !["error", "warning", "info"].includes(level)) {
      return "Usage: /logs [count] [error|warning|info]"
    }
    return formatRecentEvents(
      await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorLogs(count, level as "error" | "warning" | "info" | undefined)),
      "Logs",
      "logs",
    )
  }

  if (command === "audit") {
    const count = positiveNumberArg(args[0], 20)
    return formatAuditEntries(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorAudit(count)))
  }

  if (command === "conversations") {
    return formatConversations(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorConversations(20)))
  }

  if (command === "session") {
    const action = args[0]
    const sessionId = args[1]
    if (action !== "stop" || !sessionId) return "Usage: /session stop <session-id>"
    return formatActionResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorAgentSessionStop(sessionId), {
      method: "POST",
    }), "session-stop")
  }

  if (command === "queues") {
    return formatMessageQueues(await apiRequest(REMOTE_SERVER_API_PATHS.operatorMessageQueues))
  }

  if (command === "queue") {
    const action = args[0]
    const conversationId = args[1]

    if (["pause", "resume", "clear"].includes(action || "")) {
      if (!conversationId) return `Usage: /queue ${action} <conversation-id>`
      const path =
        action === "pause"
          ? REMOTE_SERVER_API_BUILDERS.operatorMessageQueuePause(conversationId)
          : action === "resume"
            ? REMOTE_SERVER_API_BUILDERS.operatorMessageQueueResume(conversationId)
            : REMOTE_SERVER_API_BUILDERS.operatorMessageQueueClear(conversationId)
      return formatActionResponse(await apiRequest(path, { method: "POST" }), `message-queue-${action}`)
    }

    if (action === "msg") {
      const messageAction = args[1]
      const queuedConversationId = args[2]
      const messageId = args[3]
      if (!messageAction || !queuedConversationId || !messageId) {
        return "Usage: /queue msg delete|retry|update <conversation-id> <message-id> [text]"
      }
      if (messageAction === "delete" || messageAction === "remove") {
        return formatActionResponse(await apiRequest(
          REMOTE_SERVER_API_BUILDERS.operatorMessageQueueMessage(queuedConversationId, messageId),
          { method: "DELETE" },
        ), "message-queue-message-delete")
      }
      if (messageAction === "retry") {
        return formatActionResponse(await apiRequest(
          REMOTE_SERVER_API_BUILDERS.operatorMessageQueueMessageRetry(queuedConversationId, messageId),
          { method: "POST" },
        ), "message-queue-message-retry")
      }
      if (messageAction === "update") {
        const text = args.slice(4).join(" ").trim()
        if (!text) return "Usage: /queue msg update <conversation-id> <message-id> <text>"
        return formatActionResponse(await apiRequest(
          REMOTE_SERVER_API_BUILDERS.operatorMessageQueueMessage(queuedConversationId, messageId),
          {
            method: "PATCH",
            body: JSON.stringify({ text }),
          },
        ), "message-queue-message-update")
      }
    }

    return "Usage: /queue pause|resume|clear <conversation-id> | /queue msg delete|retry|update <conversation-id> <message-id> [text]"
  }

  if (command === "remote-server") {
    return formatRemoteServer(await apiRequest(REMOTE_SERVER_API_PATHS.operatorRemoteServer))
  }

  if (command === "tunnel") {
    const action = args[0]
    if (!action) return formatTunnel(await apiRequest(REMOTE_SERVER_API_PATHS.operatorTunnel))
    if (action === "setup") return formatTunnelSetup(await apiRequest(REMOTE_SERVER_API_PATHS.operatorTunnelSetup))
    if (action === "start" || action === "stop") {
      const path = action === "start"
        ? REMOTE_SERVER_API_PATHS.operatorTunnelStart
        : REMOTE_SERVER_API_PATHS.operatorTunnelStop
      return formatActionResponse(await apiRequest(path, { method: "POST" }), `tunnel-${action}`)
    }
    return "Usage: /tunnel [setup|start|stop]"
  }

  if (command === "integrations") {
    return formatIntegrations(await apiRequest(REMOTE_SERVER_API_PATHS.operatorIntegrations))
  }

  if (command === "discord") {
    const action = args[0]
    if (!action) return formatDiscord(await apiRequest(REMOTE_SERVER_API_PATHS.operatorDiscord))
    if (action === "logs") {
      const count = positiveNumberArg(args[1], 20)
      return formatDiscordLogs(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorDiscordLogs(count)))
    }
    if (["connect", "disconnect", "clear-logs"].includes(action)) {
      const path =
        action === "connect"
          ? REMOTE_SERVER_API_PATHS.operatorDiscordConnect
          : action === "disconnect"
            ? REMOTE_SERVER_API_PATHS.operatorDiscordDisconnect
            : REMOTE_SERVER_API_PATHS.operatorDiscordClearLogs
      return formatActionResponse(await apiRequest(path, { method: "POST" }), `discord-${action}`)
    }
    return "Usage: /discord [logs|connect|disconnect|clear-logs]"
  }

  if (command === "whatsapp") {
    const action = args[0]
    if (!action) return formatWhatsApp(await apiRequest(REMOTE_SERVER_API_PATHS.operatorWhatsApp))
    if (action === "connect" || action === "logout") {
      const path = action === "connect"
        ? REMOTE_SERVER_API_PATHS.operatorWhatsAppConnect
        : REMOTE_SERVER_API_PATHS.operatorWhatsAppLogout
      return formatActionResponse(await apiRequest(path, { method: "POST" }), `whatsapp-${action}`)
    }
    return "Usage: /whatsapp [connect|logout]"
  }

  if (command === "updater") {
    const action = args[0]
    if (!action) return formatUpdater(await apiRequest(REMOTE_SERVER_API_PATHS.operatorUpdater))
    if (["check", "download", "reveal", "open", "releases"].includes(action)) {
      const path =
        action === "check"
          ? REMOTE_SERVER_API_PATHS.operatorUpdaterCheck
          : action === "download"
            ? REMOTE_SERVER_API_PATHS.operatorUpdaterDownloadLatest
            : action === "reveal"
              ? REMOTE_SERVER_API_PATHS.operatorUpdaterRevealDownload
              : action === "open"
                ? REMOTE_SERVER_API_PATHS.operatorUpdaterOpenDownload
                : REMOTE_SERVER_API_PATHS.operatorUpdaterOpenReleases
      return formatActionResponse(await apiRequest(path, { method: "POST" }), `updater-${action}`)
    }
    return "Usage: /updater [check|download|reveal|open|releases]"
  }

  if (command === "speech") {
    const action = args[0]
    if (!action) return formatLocalSpeechModels(await apiRequest(REMOTE_SERVER_API_PATHS.operatorLocalSpeechModels))
    const providerId = args[1]
    if ((action === "show" || action === "download") && !providerId) return `Usage: /speech ${action} <provider>`
    if (action === "show") {
      return formatLocalSpeechModel(providerId, await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorLocalSpeechModel(providerId)))
    }
    if (action === "download") {
      return formatActionResponse(await apiRequest(REMOTE_SERVER_API_BUILDERS.operatorLocalSpeechModelDownload(providerId), {
        method: "POST",
      }), "local-speech-download")
    }
    return "Usage: /speech [show|download] <provider>"
  }

  if (command === "run-agent") {
    const payload = args.join(" ").trim()
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
    return formatRunAgent(await apiRequest(REMOTE_SERVER_API_PATHS.operatorRunAgent, {
      method: "POST",
      body: JSON.stringify(body),
    }))
  }

  if (command === "server") {
    if (args[0] !== "restart") return "Usage: /server restart"
    return formatActionResponse(await apiRequest(REMOTE_SERVER_API_PATHS.operatorRestartRemoteServer, {
      method: "POST",
    }), "restart-remote-server")
  }

  if (command === "app") {
    if (args[0] !== "restart") return "Usage: /app restart"
    return formatActionResponse(await apiRequest(REMOTE_SERVER_API_PATHS.operatorRestartApp, {
      method: "POST",
    }), "restart-app")
  }

  if (command === "key") {
    if (args[0] !== "rotate") return "Usage: /key rotate"
    return formatApiKeyRotation(await apiRequest(REMOTE_SERVER_API_PATHS.operatorRotateApiKey, {
      method: "POST",
    }))
  }

  if (command === "stop") {
    return formatActionResponse(await apiRequest(REMOTE_SERVER_API_PATHS.emergencyStop, {
      method: "POST",
    }), "emergency-stop")
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
  const { apiKey, apiKeySource } = serverSettings()
  const res = await fetch(routeUrl(REMOTE_SERVER_API_PATHS.chatCompletions), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: message }],
      stream: true,
      conversation_id: conversationId,
    }),
  })
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
