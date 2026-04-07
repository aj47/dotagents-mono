import type { Client, Message } from "discord.js"
import { configStore } from "./config"
import { emergencyStopAll } from "./emergency-stop"
import { logApp } from "./debug"
import { agentProfileService } from "./agent-profile-service"
import { runAgent } from "./remote-server"
import {
  getDiscordResolvedDefaultProfileId,
  getDiscordResolvedToken,
} from "./discord-config"
import {
  canUseMutatingSlashCommand,
  canUseReadOnlySlashCommand,
  getDiscordConversationId,
  getDiscordMessageRejectionReason,
  isBotNameMentioned,
  splitDiscordMessageContent,
} from "./discord-utils"
import {
  DISCORD_UNAVAILABLE_ERROR,
  getDiscordDependencyStatus,
  isDiscordDependencyMissingError,
} from "./discord-dependency"

type DiscordLogLevel = "info" | "warn" | "error"

export interface DiscordLogEntry {
  id: string
  level: DiscordLogLevel
  message: string
  timestamp: number
}

export interface DiscordStatus {
  available: boolean
  enabled: boolean
  connected: boolean
  connecting: boolean
  tokenConfigured?: boolean
  tokenSource?: "config" | "env"
  defaultProfileId?: string
  defaultProfileName?: string
  defaultProfileSource?: "config" | "env"
  botId?: string
  botUsername?: string
  lastError?: string
  lastEventAt?: number
}

type OperatorCommandMethod = "GET" | "POST"

interface ParsedOperatorCommand {
  key:
    | "help"
    | "status"
    | "health"
    | "errors"
    | "audit"
    | "tunnel-status"
    | "tunnel-start"
    | "tunnel-stop"
    | "discord-status"
    | "discord-connect"
    | "discord-disconnect"
    | "whatsapp-status"
    | "whatsapp-connect"
    | "whatsapp-logout"
    | "updater-status"
    | "updater-check"
    | "updater-download"
    | "updater-reveal"
    | "updater-open-download"
    | "updater-open-releases"
    | "system"
    | "sessions"
    | "conversations"
    | "run-agent"
    | "logs"
    | "mcp"
    | "mcp-restart"
    | "restart-server"
    | "restart-app"
  label: string
  method?: OperatorCommandMethod
  path?: string
  query?: Record<string, string>
  body?: Record<string, unknown>
}

const OPERATOR_DETAIL_REDACTION_PATTERN = /(api.?key|token|secret|qr)/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function formatOperatorTimestamp(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value).toISOString()
    : null
}

function formatOperatorDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatOperatorScalar(value: unknown): string | null {
  if (typeof value === "boolean") return value ? "yes" : "no"
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null
  if (typeof value === "string") {
    if (!value.trim()) return null
    if (/bearer\s+/i.test(value)) return "[redacted]"
    return value
  }
  return null
}

function getOperatorBoolean(value: unknown): boolean {
  return value === true
}

function getOperatorString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined
}

function getOperatorNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function formatOperatorDetailLines(details: unknown, options: { skipKeys?: string[] } = {}): string[] {
  if (!isRecord(details)) return []

  const skipKeys = new Set(options.skipKeys ?? [])
  const lines: string[] = []
  for (const [key, value] of Object.entries(details)) {
    if (skipKeys.has(key) || OPERATOR_DETAIL_REDACTION_PATTERN.test(key)) continue
    const formatted = formatOperatorScalar(value)
    if (!formatted) continue
    lines.push(`- ${key}: ${formatted}`)
  }
  return lines
}

function getOperatorHelpText(channel: string): string {
  return [
    `Operator commands for ${channel}:`,
    "- /ops help",
    "- /ops status",
    "- /ops health",
    "- /ops errors [count]",
    "- /ops audit [count]",
    "- /ops system",
    "- /ops sessions",
    "- /ops conversations [count]",
    "- /ops run <prompt>",
    "- /ops logs [count] [error|warning|info]",
    "- /ops mcp | mcp restart <server>",
    "- /ops updater | updater check | updater download | updater reveal | updater open | updater releases",
    "- /ops tunnel | tunnel start | tunnel stop",
    "- /ops discord status | connect | disconnect",
    "- /ops whatsapp status | connect | logout",
    "- /ops restart-server",
    "- /ops restart-app",
  ].join("\n")
}

function sanitizeDiscordAllowlist(values: string[] | undefined): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean)
}

function getDiscordOperatorAccessRejectionReason(
  cfg: ReturnType<typeof configStore.get>,
  message: Message<boolean>,
): string | null {
  const allowUserIds = sanitizeDiscordAllowlist(cfg.discordOperatorAllowUserIds)
  const allowGuildIds = sanitizeDiscordAllowlist(cfg.discordOperatorAllowGuildIds)
  const allowChannelIds = sanitizeDiscordAllowlist(cfg.discordOperatorAllowChannelIds)
  const allowRoleIds = sanitizeDiscordAllowlist(cfg.discordOperatorAllowRoleIds)

  // Fail closed: if no operator allowlist is configured, deny all operator
  // commands. Previously this branch returned `null` ("allow") which combined
  // with parsing `/ops` before the normal Discord chat gate would let any
  // Discord user that can message the bot run privileged operator commands
  // (e.g. `/ops restart-server`, `/ops tunnel start`) on a fresh install.
  // Operator command access is now opt-in and must be explicitly configured
  // via `discordOperatorAllow*` (user / role / guild / channel).
  if (allowUserIds.length === 0 && allowGuildIds.length === 0 && allowChannelIds.length === 0 && allowRoleIds.length === 0) {
    return "Discord operator commands are disabled. Configure discordOperatorAllowUserIds (or guild/channel/role) to enable them."
  }

  // Check if user has an allowed role (role match grants access regardless of user/channel allowlists)
  if (allowRoleIds.length > 0 && message.member) {
    const memberRoleIds = Array.from(message.member.roles.cache.keys())
    if (memberRoleIds.some((roleId) => allowRoleIds.includes(roleId))) {
      return null // Role match grants operator access
    }
  }

  if (allowUserIds.length > 0 && allowUserIds.includes(message.author.id)) {
    return null // User match grants operator access
  }

  if (allowGuildIds.length > 0 && message.guildId && allowGuildIds.includes(message.guildId)) {
    // Guild match — still check channel if channel allowlist is set
    const operatorChannelId = message.channel.isThread()
      ? (message.channel.parentId || message.channel.id)
      : message.channel.id
    if (allowChannelIds.length > 0 && !allowChannelIds.includes(operatorChannelId)) {
      return "channel is not in the Discord operator allowlist"
    }
    return null
  }

  // No match found
  if (allowRoleIds.length > 0) {
    return "user does not have an operator-allowlisted role"
  }
  if (allowUserIds.length > 0) {
    return "user is not in the Discord operator allowlist"
  }
  if (allowGuildIds.length > 0) {
    return "guild is not in the Discord operator allowlist"
  }

  const operatorChannelId = message.channel.isThread()
    ? (message.channel.parentId || message.channel.id)
    : message.channel.id
  if (allowChannelIds.length > 0 && !allowChannelIds.includes(operatorChannelId)) {
    return "channel is not in the Discord operator allowlist"
  }

  return null
}

function parseOperatorCountToken(token: string | undefined): number | null {
  if (!token) return null
  const count = Number.parseInt(token, 10)
  return Number.isInteger(count) && count > 0 ? count : Number.NaN
}

function parseOperatorCommand(prompt: string): ParsedOperatorCommand | null {
  const normalizedPrompt = prompt.trim()
  if (!/^\/ops(?:\s|$)/i.test(normalizedPrompt)) return null

  const body = normalizedPrompt.replace(/^\/ops\b/i, "").trim()
  if (!body || body.toLowerCase() === "help") {
    return { key: "help", label: "/ops help" }
  }

  const parts = body.split(/\s+/)
  const [first = "", second = ""] = parts.map((part) => part.toLowerCase())

  if (first === "status" && parts.length === 1) {
    return { key: "status", label: "/ops status", method: "GET", path: "status" }
  }
  if (first === "system" && parts.length === 1) {
    return { key: "system", label: "/ops system", method: "GET", path: "status" }
  }
  if (first === "sessions" && parts.length === 1) {
    return { key: "sessions", label: "/ops sessions", method: "GET", path: "status" }
  }
  if (first === "conversations" && parts.length <= 2) {
    const count = parseOperatorCountToken(second)
    if (Number.isNaN(count)) return { key: "help", label: "/ops help" }
    return {
      key: "conversations",
      label: second ? `/ops conversations ${second}` : "/ops conversations",
      method: "GET",
      path: "conversations",
      ...(count ? { query: { count: String(count) } } : {}),
    }
  }
  if (first === "run" && parts.length >= 2) {
    const agentPrompt = body.replace(/^run\s+/i, "").trim()
    if (!agentPrompt) return { key: "help", label: "/ops help" }
    return {
      key: "run-agent",
      label: `/ops run (${agentPrompt.length} chars)`,
      method: "POST",
      path: "actions/run-agent",
      body: { prompt: agentPrompt },
    }
  }
  if (first === "mcp" && parts.length === 1) {
    return { key: "mcp", label: "/ops mcp", method: "GET", path: "mcp" }
  }
  if (first === "mcp" && second === "restart" && parts.length === 3) {
    const serverName = parts[2]
    return {
      key: "mcp-restart",
      label: `/ops mcp restart ${serverName}`,
      method: "POST",
      path: "actions/mcp-restart",
      body: { server: serverName },
    }
  }
  if (first === "health" && parts.length === 1) {
    return { key: "health", label: "/ops health", method: "GET", path: "health" }
  }
  if (first === "logs" && parts.length <= 3) {
    const validLevels = new Set(["error", "warning", "info"])
    const countToken = second && !validLevels.has(second) ? second : parts[2]
    const levelToken = second && validLevels.has(second) ? second : (parts[2] && validLevels.has(parts[2]) ? parts[2] : undefined)
    const count = countToken ? parseOperatorCountToken(countToken) : 0
    if (Number.isNaN(count)) return { key: "help", label: "/ops help" }
    const queryParams: Record<string, string> = {}
    if (count) queryParams.count = String(count)
    if (levelToken) queryParams.level = levelToken
    return {
      key: "logs",
      label: `/ops logs${countToken ? ` ${countToken}` : ""}${levelToken ? ` ${levelToken}` : ""}`,
      method: "GET",
      path: "logs",
      ...(Object.keys(queryParams).length > 0 ? { query: queryParams } : {}),
    }
  }
  if (first === "errors" && parts.length <= 2) {
    const count = parseOperatorCountToken(second)
    if (Number.isNaN(count)) return { key: "help", label: "/ops help" }
    return {
      key: "errors",
      label: second ? `/ops errors ${second}` : "/ops errors",
      method: "GET",
      path: "errors",
      ...(count ? { query: { count: String(count) } } : {}),
    }
  }
  if (first === "audit" && parts.length <= 2) {
    const count = parseOperatorCountToken(second)
    if (Number.isNaN(count)) return { key: "help", label: "/ops help" }
    return {
      key: "audit",
      label: second ? `/ops audit ${second}` : "/ops audit",
      method: "GET",
      path: "audit",
      ...(count ? { query: { count: String(count) } } : {}),
    }
  }
  if (first === "updater") {
    if (parts.length === 1 || (parts.length === 2 && second === "status")) {
      return { key: "updater-status", label: "/ops updater", method: "GET", path: "updater" }
    }
    if (parts.length === 2 && second === "check") {
      return { key: "updater-check", label: "/ops updater check", method: "POST", path: "updater/check" }
    }
    if (parts.length === 2 && (second === "download" || second === "install")) {
      return { key: "updater-download", label: `/ops updater ${second}`, method: "POST", path: "updater/download-latest" }
    }
    if (parts.length === 2 && second === "reveal") {
      return { key: "updater-reveal", label: "/ops updater reveal", method: "POST", path: "updater/reveal-download" }
    }
    if (parts.length === 2 && second === "open") {
      return { key: "updater-open-download", label: "/ops updater open", method: "POST", path: "updater/open-download" }
    }
    if (parts.length === 2 && second === "releases") {
      return { key: "updater-open-releases", label: `/ops updater ${second}`, method: "POST", path: "updater/open-releases" }
    }
  }
  if (first === "tunnel") {
    if (parts.length === 1 || (parts.length === 2 && second === "status")) {
      return { key: "tunnel-status", label: "/ops tunnel", method: "GET", path: "tunnel" }
    }
    if (parts.length === 2 && second === "start") {
      return { key: "tunnel-start", label: "/ops tunnel start", method: "POST", path: "tunnel/start" }
    }
    if (parts.length === 2 && second === "stop") {
      return { key: "tunnel-stop", label: "/ops tunnel stop", method: "POST", path: "tunnel/stop" }
    }
  }
  if (first === "discord") {
    if (parts.length === 1 || (parts.length === 2 && second === "status")) {
      return { key: "discord-status", label: "/ops discord status", method: "GET", path: "discord" }
    }
    if (parts.length === 2 && second === "connect") {
      return { key: "discord-connect", label: "/ops discord connect", method: "POST", path: "discord/connect" }
    }
    if (parts.length === 2 && second === "disconnect") {
      return { key: "discord-disconnect", label: "/ops discord disconnect", method: "POST", path: "discord/disconnect" }
    }
  }
  if (first === "whatsapp") {
    if (parts.length === 1 || (parts.length === 2 && second === "status")) {
      return { key: "whatsapp-status", label: "/ops whatsapp status", method: "GET", path: "whatsapp" }
    }
    if (parts.length === 2 && second === "connect") {
      return { key: "whatsapp-connect", label: "/ops whatsapp connect", method: "POST", path: "whatsapp/connect" }
    }
    if (parts.length === 2 && second === "logout") {
      return { key: "whatsapp-logout", label: "/ops whatsapp logout", method: "POST", path: "whatsapp/logout" }
    }
  }
  if (first === "restart-server" && parts.length === 1) {
    return {
      key: "restart-server",
      label: "/ops restart-server",
      method: "POST",
      path: "actions/restart-remote-server",
    }
  }
  if (first === "restart-app" && parts.length === 1) {
    return {
      key: "restart-app",
      label: "/ops restart-app",
      method: "POST",
      path: "actions/restart-app",
    }
  }

  return { key: "help", label: "/ops help" }
}

function formatOperatorActionResponse(payload: unknown): string {
  if (!isRecord(payload)) return "Operator action completed."

  const details = isRecord(payload.details) ? payload.details : undefined
  const status = typeof details?.status === "string" ? details.status : undefined

  const lines = [
    status === "qr_required"
      ? "WhatsApp needs authentication in the desktop app. Open the app to continue linking the account."
      : (typeof payload.message === "string" && payload.message) || "Operator action completed.",
  ]

  if (typeof payload.success === "boolean") {
    lines.push(`- success: ${payload.success ? "yes" : "no"}`)
  }
  if (payload.scheduled === true) {
    lines.push("- scheduled: yes")
  }
  if (typeof payload.error === "string" && payload.error && payload.error !== payload.message) {
    lines.push(`- error: ${payload.error}`)
  }

  lines.push(...formatOperatorDetailLines(details, { skipKeys: ["status"] }))
  return lines.join("\n")
}

function formatOperatorPayload(command: ParsedOperatorCommand, payload: unknown): string {
  if (!isRecord(payload)) {
    return typeof payload === "string" && payload ? payload : "Operator response was empty."
  }

  if (typeof payload.error === "string" && payload.error) {
    return `Operator request failed: ${payload.error}`
  }

  if (command.key === "status") {
    const remoteServer = isRecord(payload.remoteServer) ? payload.remoteServer : undefined
    const health = isRecord(payload.health) ? payload.health : undefined
    const tunnel = isRecord(payload.tunnel) ? payload.tunnel : undefined
    const integrations = isRecord(payload.integrations) ? payload.integrations : undefined
    const discord = isRecord(integrations?.discord) ? integrations.discord : undefined
    const whatsapp = isRecord(integrations?.whatsapp) ? integrations.whatsapp : undefined
    const recentErrors = isRecord(payload.recentErrors) ? payload.recentErrors : undefined
    const remoteServerRunning = getOperatorBoolean(remoteServer?.running)
    const remoteServerBind = getOperatorString(remoteServer?.bind) || "127.0.0.1"
    const remoteServerPort = getOperatorNumber(remoteServer?.port)
    const healthOverall = getOperatorString(health?.overall) || "unknown"
    const tunnelRunning = getOperatorBoolean(tunnel?.running)
    const tunnelStarting = getOperatorBoolean(tunnel?.starting)
    const tunnelMode = getOperatorString(tunnel?.mode)
    const tunnelUrl = getOperatorString(tunnel?.url)
    const discordConnected = getOperatorBoolean(discord?.connected)
    const discordConnecting = getOperatorBoolean(discord?.connecting)
    const discordEnabled = getOperatorBoolean(discord?.enabled)
    const whatsappConnected = getOperatorBoolean(whatsapp?.connected)
    const whatsappEnabled = getOperatorBoolean(whatsapp?.enabled)
    const whatsappAutoReply = getOperatorBoolean(whatsapp?.autoReplyEnabled)
    const recentErrorTotal = getOperatorNumber(recentErrors?.total) || 0
    const recentErrorWindow = getOperatorNumber(recentErrors?.errorsInLastFiveMinutes) || 0

    return [
      "Operator status",
      remoteServer
        ? `- remote server: ${remoteServerRunning ? "running" : "stopped"} on ${remoteServerBind}:${remoteServerPort ?? "unknown"}`
        : "- remote server: unavailable",
      health ? `- health: ${healthOverall}` : "- health: unavailable",
      tunnel
        ? `- tunnel: ${tunnelRunning ? "running" : tunnelStarting ? "starting" : "stopped"}${tunnelMode ? ` (${tunnelMode})` : ""}${tunnelUrl ? ` ${tunnelUrl}` : ""}`
        : "- tunnel: unavailable",
      discord
        ? `- discord: ${discordConnected ? "connected" : discordConnecting ? "connecting" : discordEnabled ? "enabled" : "disabled"}`
        : "- discord: unavailable",
      whatsapp
        ? `- whatsapp: ${whatsappConnected ? "connected" : whatsappEnabled ? "enabled" : "disabled"} (auto-reply ${whatsappAutoReply ? "on" : "off"})`
        : "- whatsapp: unavailable",
      recentErrors
        ? `- recent errors: ${recentErrorTotal} total, ${recentErrorWindow} in the last 5m`
        : "- recent errors: unavailable",
    ].join("\n")
  }

  if (command.key === "health") {
    const checks = isRecord(payload.checks) ? payload.checks : {}
    const lines = [
      `Health snapshot: ${typeof payload.overall === "string" ? payload.overall : "unknown"}`,
    ]

    for (const [name, entry] of Object.entries(checks)) {
      if (!isRecord(entry)) continue
      const status = typeof entry.status === "string" ? entry.status : "unknown"
      const message = typeof entry.message === "string" ? entry.message : ""
      lines.push(`- ${name}: ${status}${message ? ` — ${message}` : ""}`)
    }

    return lines.join("\n")
  }

  if (command.key === "system") {
    const system = isRecord(payload.system) ? payload.system : undefined
    if (!system) return "System metrics unavailable."
    const mem = isRecord(system.memoryUsage) ? system.memoryUsage : undefined
    const lines = [
      `System: ${getOperatorString(system.hostname) || "unknown"}`,
      `- platform: ${getOperatorString(system.platform) || "?"}/${getOperatorString(system.arch) || "?"}`,
      `- app: ${getOperatorString(system.appVersion) || "?"} • electron: ${getOperatorString(system.electronVersion) || "?"} • node: ${getOperatorString(system.nodeVersion) || "?"}`,
    ]
    if (mem) {
      lines.push(`- memory: ${getOperatorNumber(mem.rssMB) || 0} MB RSS, ${getOperatorNumber(system.freeMemoryMB) || 0}/${getOperatorNumber(system.totalMemoryMB) || 0} MB free`)
    }
    lines.push(`- cpus: ${getOperatorNumber(system.cpuCount) || 0}`)
    const processUptime = getOperatorNumber(system.processUptimeSeconds) || 0
    const systemUptime = getOperatorNumber(system.uptimeSeconds) || 0
    lines.push(`- process uptime: ${formatOperatorDuration(processUptime)} • system uptime: ${formatOperatorDuration(systemUptime)}`)
    return lines.join("\n")
  }

  if (command.key === "sessions") {
    const sessions = isRecord(payload.sessions) ? payload.sessions : undefined
    if (!sessions) return "Sessions info unavailable."
    const active = getOperatorNumber(sessions.activeSessions) || 0
    const recent = getOperatorNumber(sessions.recentSessions) || 0
    const details = Array.isArray(sessions.activeSessionDetails) ? sessions.activeSessionDetails : []
    const lines = [
      `Agent sessions: ${active} active, ${recent} recent`,
    ]
    if (details.length === 0) {
      lines.push("- No active agent sessions")
    }
    for (const entry of details) {
      if (!isRecord(entry)) continue
      const title = getOperatorString(entry.title) || getOperatorString(entry.id) || "unknown"
      const status = getOperatorString(entry.status) || "?"
      const iter = getOperatorNumber(entry.currentIteration) || 0
      const maxIter = getOperatorNumber(entry.maxIterations) || "?"
      const started = formatOperatorTimestamp(entry.startTime)
      lines.push(`- ${title}: ${status} (${iter}/${maxIter}) since ${started || "unknown"}`)
    }
    return lines.join("\n")
  }

  if (command.key === "conversations") {
    const conversations = Array.isArray(payload.conversations) ? payload.conversations : []
    const lines = [`Recent conversations (${conversations.length})`]
    if (conversations.length === 0) {
      lines.push("- No conversations found.")
      return lines.join("\n")
    }
    for (const entry of conversations) {
      if (!isRecord(entry)) continue
      const title = getOperatorString(entry.title) || "Untitled"
      const msgs = getOperatorNumber(entry.messageCount) || 0
      const updated = formatOperatorTimestamp(entry.updatedAt)
      const preview = getOperatorString(entry.preview) || ""
      lines.push(`- ${title} (${msgs} msgs, ${updated || "unknown"})${preview ? ` — ${preview.slice(0, 80)}` : ""}`)
    }
    return lines.join("\n")
  }

  if (command.key === "mcp") {
    const servers = Array.isArray(payload.servers) ? payload.servers : []
    const total = getOperatorNumber(payload.totalServers) || 0
    const connected = getOperatorNumber(payload.connectedServers) || 0
    const totalTools = getOperatorNumber(payload.totalTools) || 0
    const lines = [`MCP servers: ${connected}/${total} connected, ${totalTools} tools`]
    for (const entry of servers) {
      if (!isRecord(entry)) continue
      const name = getOperatorString(entry.name) || "?"
      const isConnected = entry.connected === true
      const tools = getOperatorNumber(entry.toolCount) || 0
      const enabled = entry.enabled !== false
      const error = getOperatorString(entry.error)
      const statusEmoji = isConnected ? "✓" : enabled ? "✗" : "○"
      lines.push(`${statusEmoji} ${name}: ${tools} tools${!enabled ? " (disabled)" : ""}${error ? ` — ${error}` : ""}`)
    }
    return lines.join("\n")
  }

  if (command.key === "mcp-restart") {
    const success = payload.success === true
    const server = getOperatorString(payload.server) || "?"
    if (!success) {
      const errorMsg = getOperatorString(payload.error) || "Unknown error"
      return `MCP restart failed for ${server}: ${errorMsg}`
    }
    return `MCP server "${server}" restarted successfully.`
  }

  if (command.key === "logs") {
    const logs = Array.isArray(payload.logs) ? payload.logs : []
    const levelFilter = getOperatorString(payload.level)
    const lines = [`Recent logs (${logs.length})${levelFilter ? ` [${levelFilter}]` : ""}`]
    if (logs.length === 0) {
      lines.push("- No log entries found.")
      return lines.join("\n")
    }
    for (const entry of logs) {
      if (!isRecord(entry)) continue
      const timestamp = formatOperatorTimestamp(entry.timestamp)
      const level = getOperatorString(entry.level) || "?"
      const component = getOperatorString(entry.component) || "?"
      const message = getOperatorString(entry.message) || ""
      lines.push(`- ${timestamp || "?"} [${level}] ${component}: ${message.slice(0, 120)}`)
    }
    return lines.join("\n")
  }

  if (command.key === "run-agent") {
    const success = payload.success === true
    const content = getOperatorString(payload.content) || ""
    const conversationId = getOperatorString(payload.conversationId) || "unknown"
    const messageCount = getOperatorNumber(payload.messageCount) || 0
    if (!success) {
      const errorMsg = getOperatorString(payload.error) || "Unknown error"
      return `Agent run failed: ${errorMsg}`
    }
    const preview = content.length > 500 ? content.slice(0, 500) + "…" : content
    return [
      `Agent completed (${messageCount} messages, conversation ${conversationId})`,
      preview,
    ].join("\n")
  }

  if (command.key === "errors") {
    const errors = Array.isArray(payload.errors) ? payload.errors : []
    const lines = [`Recent errors (${errors.length})`]

    if (errors.length === 0) {
      lines.push("- No recent errors reported.")
      return lines.join("\n")
    }

    for (const entry of errors) {
      if (!isRecord(entry)) continue
      const timestamp = formatOperatorTimestamp(entry.timestamp)
      const level = typeof entry.level === "string" ? entry.level : "error"
      const component = typeof entry.component === "string" ? entry.component : "unknown"
      const message = typeof entry.message === "string" ? entry.message : "Unknown error"
      lines.push(`- ${timestamp || "unknown time"} [${level}] ${component}: ${message}`)
    }

    return lines.join("\n")
  }

  if (command.key === "audit") {
    const entries = Array.isArray(payload.entries) ? payload.entries : []
    const lines = [`Recent operator audit entries (${entries.length})`]

    if (entries.length === 0) {
      lines.push("- No audit entries reported.")
      return lines.join("\n")
    }

    for (const entry of entries) {
      if (!isRecord(entry)) continue
      const timestamp = formatOperatorTimestamp(entry.timestamp)
      const action = typeof entry.action === "string" ? entry.action : "unknown"
      const path = typeof entry.path === "string" ? entry.path : "unknown"
      const success = typeof entry.success === "boolean" ? (entry.success ? "success" : "failure") : "unknown"
      const failureReason = typeof entry.failureReason === "string" ? ` (${entry.failureReason})` : ""
      lines.push(`- ${timestamp || "unknown time"} ${success}: ${action} via ${path}${failureReason}`)
    }

    return lines.join("\n")
  }

  if (command.key === "tunnel-status") {
    const running = getOperatorBoolean(payload.running)
    const starting = getOperatorBoolean(payload.starting)
    const mode = getOperatorString(payload.mode)
    const url = getOperatorString(payload.url)
    const error = getOperatorString(payload.error)
    const lines = [
      `Tunnel: ${running ? "running" : starting ? "starting" : "stopped"}${mode ? ` (${mode})` : ""}`,
    ]
    if (url) lines.push(`- url: ${url}`)
    if (error) lines.push(`- error: ${error}`)
    return lines.join("\n")
  }

  if (command.key === "discord-status") {
    const connected = getOperatorBoolean(payload.connected)
    const connecting = getOperatorBoolean(payload.connecting)
    const enabled = getOperatorBoolean(payload.enabled)
    const available = getOperatorBoolean(payload.available)
    const tokenConfigured = payload.tokenConfigured
    const defaultProfileName = getOperatorString(payload.defaultProfileName)
    const botUsername = getOperatorString(payload.botUsername)
    const lastError = getOperatorString(payload.lastError)
    const lines = [
      `Discord: ${connected ? "connected" : connecting ? "connecting" : enabled ? "enabled" : "disabled"}`,
      `- available: ${available ? "yes" : "no"}`,
    ]
    if (typeof tokenConfigured === "boolean") lines.push(`- token configured: ${tokenConfigured ? "yes" : "no"}`)
    if (defaultProfileName) lines.push(`- default profile: ${defaultProfileName}`)
    if (botUsername) lines.push(`- bot: ${botUsername}`)
    if (lastError) lines.push(`- last error: ${lastError}`)
    if (isRecord(payload.logs)) lines.push(...formatOperatorDetailLines(payload.logs))
    return lines.join("\n")
  }

  if (command.key === "whatsapp-status") {
    const connected = getOperatorBoolean(payload.connected)
    const enabled = getOperatorBoolean(payload.enabled)
    const serverConnected = getOperatorBoolean(payload.serverConnected)
    const autoReplyEnabled = getOperatorBoolean(payload.autoReplyEnabled)
    const logMessagesEnabled = getOperatorBoolean(payload.logMessagesEnabled)
    const allowedSenderCount = getOperatorNumber(payload.allowedSenderCount) || 0
    const hasCredentials = payload.hasCredentials
    const lastError = getOperatorString(payload.lastError)
    const lines = [
      `WhatsApp: ${connected ? "connected" : enabled ? "enabled" : "disabled"}`,
      `- server connected: ${serverConnected ? "yes" : "no"}`,
      `- auto-reply: ${autoReplyEnabled ? "on" : "off"}`,
      `- log messages: ${logMessagesEnabled ? "on" : "off"}`,
      `- allowed senders: ${allowedSenderCount}`,
    ]
    if (typeof hasCredentials === "boolean") lines.push(`- credentials present: ${hasCredentials ? "yes" : "no"}`)
    if (lastError) lines.push(`- last error: ${lastError}`)
    if (isRecord(payload.logs)) lines.push(...formatOperatorDetailLines(payload.logs))
    return lines.join("\n")
  }

  return formatOperatorActionResponse(payload)
}

async function readOperatorPayload(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

/**
 * Per-command operator request timeout (ms).
 *
 * The original implementation used a flat 5s ceiling for everything except
 * `run-agent`, which is too tight for legitimately slow actions like
 * `updater download`, `tunnel start`, integration `connect`/`logout`, or app
 * restarts. We tier the timeout instead:
 *
 *   - `run-agent`             → 120s (long-running LLM call)
 *   - any other POST action   →  60s (downloads, tunnel start, restarts, etc.)
 *   - GET reads (status/logs) →  10s (still fail fast if the server is down)
 */
function getOperatorCommandTimeoutMs(command: ParsedOperatorCommand): number {
  if (command.key === "run-agent") return 120_000
  if (command.method === "POST") return 60_000
  return 10_000
}

async function executeDiscordOperatorCommand(command: ParsedOperatorCommand): Promise<string> {
  if (command.key === "help") {
    return getOperatorHelpText("Discord")
  }

  const cfg = configStore.get()
  const apiKey = cfg.remoteServerApiKey?.trim()
  const port = cfg.remoteServerPort || 3210

  if (!apiKey) {
    return "Operator API is unavailable because the remote server API key is not configured in desktop settings."
  }

  const operatorBaseUrl = new URL("/v1/operator/", `http://127.0.0.1:${port}`)
  const url = new URL(command.path || "status", operatorBaseUrl)
  for (const [key, value] of Object.entries(command.query ?? {})) {
    url.searchParams.set(key, value)
  }

  try {
    const fetchOptions: RequestInit = {
      method: command.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(command.body ? { "Content-Type": "application/json" } : {}),
      },
      signal: AbortSignal.timeout(getOperatorCommandTimeoutMs(command)),
    }
    if (command.body) {
      fetchOptions.body = JSON.stringify(command.body)
    }
    const response = await fetch(url, fetchOptions)
    const payload = await readOperatorPayload(response)

    if (!response.ok) {
      const errorMessage = isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : typeof payload === "string" && payload
          ? payload
          : `HTTP ${response.status}`
      const authHint = response.status === 401 ? " Check the remote server API key." : ""
      return `Operator API request failed (${response.status}): ${errorMessage}.${authHint}`
    }

    return formatOperatorPayload(command, payload)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return `Operator API is unavailable on 127.0.0.1:${port}. Make sure the remote server is running locally. (${errorMessage})`
  }
}

interface PendingMessage {
  authorName: string
  authorId: string
  content: string
  timestamp: number
}

/** Max messages to buffer per channel before oldest are dropped */
const PENDING_HISTORY_MAX = 50
/** Max age of pending messages in ms (10 minutes) */
const PENDING_HISTORY_TTL = 10 * 60 * 1000

/** Sentinel the LLM can output to suppress a reply */
const NO_REPLY_SENTINEL = "[NO_REPLY]"

/**
 * Instruction appended to the prompt when the bot was NOT directly @mentioned.
 * Tells the LLM it may choose not to reply.
 */
const DISCORD_SMART_REPLY_INSTRUCTION = `

IMPORTANT — REPLY POLICY (Discord group chat):
You were NOT directly @mentioned in this message. You are observing a group conversation.
You should ONLY reply if:
• Someone clearly addressed you by name and asked a question or requested help
• You have genuinely useful, specific information to contribute that hasn't been said
• The conversation is directly about a topic you were previously asked to help with

You should NOT reply if:
• People are just chatting casually with each other
• The conversation doesn't need your input
• Someone mentioned your name in passing but isn't talking to you
• Your response would just be agreeing, acknowledging, or restating what was said

If you decide not to reply, respond with ONLY the text: ${NO_REPLY_SENTINEL}
Do NOT explain why you're not replying. Just output ${NO_REPLY_SENTINEL} and nothing else.
`

/**
 * Check if a response is a NO_REPLY sentinel (should be suppressed)
 */
function isNoReplyResponse(content: string): boolean {
  const trimmed = content.trim()
  return (
    trimmed === NO_REPLY_SENTINEL ||
    trimmed === "NO_REPLY" ||
    trimmed === "[NO_REPLY]" ||
    trimmed.startsWith(NO_REPLY_SENTINEL) && trimmed.length < NO_REPLY_SENTINEL.length + 10
  )
}

class DiscordService {
  private client: Client | null = null
  private status: DiscordStatus = {
    available: getDiscordDependencyStatus().available,
    enabled: false,
    connected: false,
    connecting: false,
  }
  private logs: DiscordLogEntry[] = []
  private readonly maxLogs = 200
  private startPromise: Promise<{ success: boolean; error?: string }> | null = null
  private readonly processingChains = new Map<string, Promise<void>>()
  /** Buffered non-mentioned messages per channel, injected as context when bot IS mentioned */
  private readonly pendingHistory = new Map<string, PendingMessage[]>()
  /**
   * IDs of the Discord application owner (or, if the application is owned by a
   * Team, every team member). Populated on `ready` via `client.application.fetch()`.
   * Owners are always allowed to invoke slash commands so they can bootstrap the
   * `discordDmAllowUserIds` allowlist on a fresh install via `/dm allow`.
   */
  private applicationOwnerIds: ReadonlySet<string> = new Set()

  private addPendingMessage(channelId: string, msg: PendingMessage) {
    const list = this.pendingHistory.get(channelId) ?? []
    list.push(msg)
    // Trim to max size and TTL
    const cutoff = Date.now() - PENDING_HISTORY_TTL
    const trimmed = list.filter((m) => m.timestamp > cutoff).slice(-PENDING_HISTORY_MAX)
    this.pendingHistory.set(channelId, trimmed)
  }

  /** Return pending messages since last mention, without deleting them (they age out via TTL) */
  private consumePendingHistory(channelId: string): PendingMessage[] {
    const list = this.pendingHistory.get(channelId) ?? []
    // Clear after consuming — the conversation history will carry forward from here
    this.pendingHistory.set(channelId, [])
    const cutoff = Date.now() - PENDING_HISTORY_TTL
    return list.filter((m) => m.timestamp > cutoff)
  }

  private formatPendingContext(messages: PendingMessage[]): string {
    if (messages.length === 0) return ""
    const lines = messages.map(
      (m) => `[${m.authorName}]: ${m.content}`,
    )
    return `\n\n<recent_channel_context>\nRecent messages in this channel (for context — you were not mentioned in these):\n${lines.join("\n")}\n</recent_channel_context>`
  }

  private addLog(level: DiscordLogLevel, message: string) {
    const entry = {
      id: `discord-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level,
      message,
      timestamp: Date.now(),
    }
    this.logs = [...this.logs.slice(-(this.maxLogs - 1)), entry]
    this.status.lastEventAt = entry.timestamp
    if (level === "error") {
      this.status.lastError = message
    }
    logApp(`[discord] ${message}`)
  }

  private setStatus(partial: Partial<DiscordStatus>) {
    this.status = { ...this.status, ...partial }
  }

  getStatus(): DiscordStatus {
    const cfg = configStore.get()
    const token = getDiscordResolvedToken(cfg)
    const defaultProfile = getDiscordResolvedDefaultProfileId(cfg)
    const dependencyStatus = getDiscordDependencyStatus()
    const profile = defaultProfile.profileId
      ? agentProfileService.getById(defaultProfile.profileId)
      : undefined

    return {
      ...this.status,
      available: dependencyStatus.available,
      enabled: !!cfg.discordEnabled,
      tokenConfigured: !!token.token,
      tokenSource: token.source,
      defaultProfileId: defaultProfile.profileId,
      defaultProfileName: profile?.displayName,
      defaultProfileSource: defaultProfile.source,
      lastError: dependencyStatus.available ? this.status.lastError : dependencyStatus.error,
    }
  }

  getLogs(): DiscordLogEntry[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  async start(): Promise<{ success: boolean; error?: string }> {
    if (this.startPromise) return this.startPromise
    if (this.client?.isReady()) {
      this.setStatus({ connected: true, connecting: false, enabled: !!configStore.get().discordEnabled })
      return { success: true }
    }

    const cfg = configStore.get()
    const dependencyStatus = getDiscordDependencyStatus()
    const token = getDiscordResolvedToken(cfg).token
    if (!cfg.discordEnabled) {
      const error = "Discord integration is disabled"
      this.setStatus({ enabled: false, connected: false, connecting: false, lastError: error })
      return { success: false, error }
    }
    if (!dependencyStatus.available) {
      const error = dependencyStatus.error || DISCORD_UNAVAILABLE_ERROR
      this.setStatus({ available: false, enabled: true, connected: false, connecting: false, lastError: error })
      return { success: false, error }
    }
    if (!token) {
      const error = "Discord bot token is required"
      this.setStatus({ enabled: true, connected: false, connecting: false, lastError: error })
      return { success: false, error }
    }

    this.startPromise = this.startInternal(token)
    try {
      return await this.startPromise
    } finally {
      this.startPromise = null
    }
  }

  private async startInternal(token: string): Promise<{ success: boolean; error?: string }> {
    this.setStatus({ available: true, enabled: true, connecting: true, connected: false, lastError: undefined })

    try {
      const discord = await import("discord.js")
      const client = new discord.Client({
        intents: [
          discord.GatewayIntentBits.Guilds,
          discord.GatewayIntentBits.GuildMessages,
          discord.GatewayIntentBits.DirectMessages,
          discord.GatewayIntentBits.MessageContent,
        ],
        partials: [discord.Partials.Channel],
      })

      client.once("ready", async () => {
        this.setStatus({
          connected: true,
          connecting: false,
          botId: client.user?.id,
          botUsername: client.user?.username,
          lastError: undefined,
        })
        // Set online presence
        client.user?.setPresence({
          status: "online",
          activities: [{ name: "Ready to help", type: discord.ActivityType.Custom }],
        })
        this.addLog("info", `Connected as ${client.user?.username || "unknown bot"}`)

        // Cache application owner / team member IDs so they can always invoke
        // slash commands (used to bootstrap `discordDmAllowUserIds` from a
        // fresh install via `/dm allow`).
        await this.loadApplicationOwners(client)

        // Register slash commands
        try {
          await this.registerSlashCommands(discord, client)
        } catch (err) {
          this.addLog("warn", `Failed to register slash commands: ${err instanceof Error ? err.message : String(err)}`)
        }
      })

      client.on("error", (error) => {
        this.setStatus({ connected: false, connecting: false, lastError: error.message })
        this.addLog("error", `Discord client error: ${error.message}`)
      })

      client.on("shardError", (error) => {
        this.setStatus({ connected: false, connecting: false, lastError: error.message })
        this.addLog("error", `Discord gateway error: ${error.message}`)
      })

      client.on("messageCreate", (message) => {
        void this.handleMessage(message).catch((error) => {
          const messageText = error instanceof Error ? error.message : String(error)
          this.addLog("error", `Failed to handle Discord message: ${messageText}`)
        })
      })

      client.on("interactionCreate", (interaction) => {
        void this.handleSlashCommand(interaction).catch((error) => {
          const messageText = error instanceof Error ? error.message : String(error)
          this.addLog("error", `Failed to handle Discord interaction: ${messageText}`)
        })
      })

      await client.login(token)
      this.client = client
      return { success: true }
    } catch (error) {
      const dependencyStatus = isDiscordDependencyMissingError(error)
        ? { available: false, error: DISCORD_UNAVAILABLE_ERROR }
        : { available: true, error: error instanceof Error ? error.message : String(error) }
      const message = dependencyStatus.error || "Unknown error"
      this.setStatus({ available: dependencyStatus.available, connected: false, connecting: false, lastError: message })
      this.addLog("error", `Failed to start Discord integration: ${message}`)
      return { success: false, error: message }
    }
  }

  async stop(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.client) {
        await this.client.destroy()
        this.client = null
      }
      this.processingChains.clear()
      this.pendingHistory.clear()
      this.applicationOwnerIds = new Set()
      this.setStatus({ connected: false, connecting: false, botId: undefined, botUsername: undefined })
      this.addLog("info", "Discord integration stopped")
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.setStatus({ connected: false, connecting: false, lastError: message })
      this.addLog("error", `Failed to stop Discord integration: ${message}`)
      return { success: false, error: message }
    }
  }

  async restart(): Promise<{ success: boolean; error?: string }> {
    await this.stop()
    return this.start()
  }

  private async handleMessage(message: Message<boolean>) {
    if (!this.client?.user) return
    if (message.author.bot) return

    const cfg = configStore.get()
    if (!cfg.discordEnabled) return

    const isDirectMessage = !message.inGuild()

    // Fetch the author's role IDs from the guild member (if in a guild)
    let authorRoleIds: string[] | undefined
    if (!isDirectMessage && message.member) {
      authorRoleIds = Array.from(message.member.roles.cache.keys())
    }

    const atMentioned = message.mentions.users.has(this.client.user.id)
    const nameMentioned = !atMentioned && isBotNameMentioned(
      message.content,
      this.client.user.username,
      this.client.user.displayName,
    )

    // Strip the bot mention up front so we can detect operator commands
    // (`/ops ...`) before applying the regular Discord chat gate. Operator
    // commands have their own dedicated allowlists (`discordOperatorAllow*`)
    // enforced inside `maybeHandleOperatorCommand`, so they must bypass the
    // chat-mention / DM gate — otherwise the documented `/ops` text commands
    // are silently dropped under the safe defaults (DMs off, @-mention
    // required for guilds).
    const prompt = this.stripBotMention(message.content).trim()

    if (prompt && parseOperatorCommand(prompt)) {
      await this.maybeHandleOperatorCommand(message, prompt)
      return
    }

    const rejectionReason = getDiscordMessageRejectionReason({
      authorId: message.author.id,
      channelId: message.channel.id,
      guildId: message.guildId,
      isDirectMessage,
      mentioned: atMentioned,
      nameMentioned,
      requireMention: cfg.discordRequireMention ?? true,
      dmEnabled: cfg.discordDmEnabled ?? true,
      allowUserIds: cfg.discordAllowUserIds,
      allowGuildIds: cfg.discordAllowGuildIds,
      allowChannelIds: cfg.discordAllowChannelIds,
      allowRoleIds: cfg.discordAllowRoleIds,
      dmAllowUserIds: cfg.discordDmAllowUserIds,
      authorRoleIds,
    })

    if (rejectionReason) {
      // Buffer non-mentioned messages in group channels as context for when the bot IS mentioned
      if (rejectionReason === "bot mention required" && !isDirectMessage) {
        this.addPendingMessage(message.channel.id, {
          authorName: message.member?.displayName || message.author.displayName || message.author.username,
          authorId: message.author.id,
          content: message.content.substring(0, 500), // Cap at 500 chars
          timestamp: Date.now(),
        })
      }

      // Always surface the rejection reason in the Recent Logs panel so the
      // operator can see why a message was dropped. Without this, the only
      // observable symptom is "the bot doesn't reply", which gives no clue
      // whether the gate, allowlist, or DM-disabled flag is responsible.
      //
      // Author IDs are PII and are omitted by default. If the operator opts
      // into verbose diagnostics via `discordLogMessages`, include the author
      // ID — mirroring the privacy escalation used by the accepted-message
      // path below.
      const shouldLogAuthor = cfg.discordLogMessages ?? false
      const context = isDirectMessage ? "DM" : "guild message"
      const authorSuffix = shouldLogAuthor ? ` from ${message.author.id}` : ""
      this.addLog("info", `Dropped Discord ${context}${authorSuffix}: ${rejectionReason}`)
      return
    }

    if (!prompt) {
      this.addLog("info", `Ignored Discord message from ${message.author.id}: empty prompt after mention stripping`)
      return
    }

    let profileId = getDiscordResolvedDefaultProfileId(cfg).profileId
    let profile = profileId ? agentProfileService.getById(profileId) : undefined

    // Fall back to the current/default agent profile when none is explicitly configured
    if (!profile) {
      profile = agentProfileService.getCurrentProfile()
      profileId = profile?.id
    }

    if (!profile || !profileId) {
      await this.sendChunks(message, "No agent profile is available. Please create one in settings.")
      this.addLog("warn", "Rejected Discord message because no agent profile is available")
      return
    }

    const conversationId = getDiscordConversationId({
      channelId: message.channel.isThread() ? (message.channel.parentId || message.channel.id) : message.channel.id,
      guildId: message.guildId,
      threadId: message.channel.isThread() ? message.channel.id : undefined,
      isDirectMessage,
    })

    // Consume any buffered channel context and prepend to the prompt
    const pendingMessages = !isDirectMessage ? this.consumePendingHistory(message.channel.id) : []
    const contextSuffix = this.formatPendingContext(pendingMessages)

    // Determine if the bot should be allowed to skip replying.
    // Direct @mentions and DMs always get a reply. Name mentions and
    // non-mention mode get the smart reply instruction so the LLM can
    // decide whether it has something useful to say.
    const allowNoReply = !isDirectMessage && !atMentioned
    const smartReplyInstruction = allowNoReply ? DISCORD_SMART_REPLY_INSTRUCTION : ""

    const enrichedPrompt = `${prompt}${contextSuffix}${smartReplyInstruction}`

    const processingChain = (this.processingChains.get(conversationId) || Promise.resolve())
      .catch(() => undefined)
      .then(async () => {
        const shouldLogMessages = cfg.discordLogMessages ?? false
        const promptSummary = shouldLogMessages ? `: ${prompt}` : ` (${prompt.length} chars)`
        const contextNote = pendingMessages.length > 0 ? ` (+${pendingMessages.length} context msgs)` : ""
        this.addLog("info", `Processing Discord message for ${conversationId}${promptSummary}${contextNote}`)

        // Show typing indicator while processing (refreshes every 8s since Discord expires it at 10s)
        let typingInterval: ReturnType<typeof setInterval> | undefined
        try {
          if ("sendTyping" in message.channel && typeof message.channel.sendTyping === "function") {
            await message.channel.sendTyping()
            typingInterval = setInterval(() => {
              if ("sendTyping" in message.channel && typeof message.channel.sendTyping === "function") {
                message.channel.sendTyping().catch(() => {})
              }
            }, 8000)
          }
        } catch {
          // Typing indicator is best-effort
        }

        try {
          const result = await runAgent({
            prompt: enrichedPrompt,
            conversationId,
            profileId,
          })
          const responseText = result.content?.trim() || "Done."

          // Suppress NO_REPLY responses — the LLM decided it has nothing useful to add
          if (isNoReplyResponse(responseText)) {
            this.addLog("info", `Suppressed reply for ${conversationId} (NO_REPLY)`)
            return
          }

          await this.sendChunks(message, responseText)
          this.addLog("info", `Replied to Discord conversation ${conversationId}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          this.addLog("error", `Discord reply failed for ${conversationId}: ${errorMessage}`)
          await this.sendChunks(message, `I hit an error while processing that message: ${errorMessage}`)
        } finally {
          if (typingInterval) clearInterval(typingInterval)
        }
      })
      .finally(() => {
        if (this.processingChains.get(conversationId) === processingChain) {
          this.processingChains.delete(conversationId)
        }
      })

    this.processingChains.set(conversationId, processingChain)
    await processingChain
  }

  private async maybeHandleOperatorCommand(message: Message<boolean>, prompt: string): Promise<boolean> {
    const command = parseOperatorCommand(prompt)
    if (!command) return false

    const cfg = configStore.get()
    const operatorAccessRejectionReason = getDiscordOperatorAccessRejectionReason(cfg, message)
    if (operatorAccessRejectionReason) {
      this.addLog("warn", `Denied Discord operator command from ${message.author.id}: ${operatorAccessRejectionReason}`)
      await this.sendChunks(message, "Operator access denied for this Discord user/channel. Update the Discord operator allowlists in settings to grant /ops access.")
      return true
    }

    this.addLog("info", `Handling Discord operator command from ${message.author.id}: ${command.label}`)

    try {
      const responseText = await executeDiscordOperatorCommand(command)
      await this.sendChunks(message, responseText)
      this.addLog("info", `Completed Discord operator command from ${message.author.id}: ${command.label}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.addLog("error", `Discord operator command failed for ${message.author.id}: ${errorMessage}`)
      await this.sendChunks(message, `Operator command failed: ${errorMessage}`)
    }

    return true
  }

  private stripBotMention(content: string): string {
    let result = content
    const botId = this.client?.user?.id
    if (botId) {
      result = result.replace(new RegExp(`<@!?${botId}>`, "g"), " ")
    }
    // Also strip the bot's username/display name when used as a casual mention
    const botUsername = this.client?.user?.username
    const botDisplayName = this.client?.user?.displayName
    for (const name of [botUsername, botDisplayName]) {
      if (name && name.length >= 2) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        result = result.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ")
      }
    }
    return result.replace(/\s+/g, " ").trim()
  }

  private async sendChunks(message: Message<boolean>, content: string) {
    const chunks = splitDiscordMessageContent(content)
    if (chunks.length === 0) return
    if (!("send" in message.channel) || typeof message.channel.send !== "function") return
    for (const chunk of chunks) {
      await message.channel.send({ content: chunk })
    }
  }

  // ── Slash Commands ───────────────────────────────────────────

  private async registerSlashCommands(discord: typeof import("discord.js"), client: Client) {
    const { SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = discord

    // Mutating commands are hidden in Discord's command picker from members
    // who lack the Administrator permission as a first line of defense. The
    // authoritative runtime check (see `handleSlashCommand`) still denies
    // non-application-owners regardless of server permissions.
    const adminOnly = PermissionFlagsBits.Administrator

    const commands = [
      new SlashCommandBuilder()
        .setName("status")
        .setDescription("Show bot status, health, and integrations"),

      new SlashCommandBuilder()
        .setName("whoami")
        .setDescription("Show your Discord ID and trust level for this bot"),

      new SlashCommandBuilder()
        .setName("dm")
        .setDescription("Manage DM access control")
        .setDefaultMemberPermissions(adminOnly)
        .addSubcommand((sub) =>
          sub.setName("on").setDescription("Enable DMs (with allowlist filtering)"),
        )
        .addSubcommand((sub) =>
          sub.setName("off").setDescription("Disable all DMs"),
        )
        .addSubcommand((sub) =>
          sub
            .setName("allow")
            .setDescription("Add a user to the DM allowlist")
            .addUserOption((opt) => opt.setName("user").setDescription("User to allow").setRequired(true)),
        )
        .addSubcommand((sub) =>
          sub
            .setName("deny")
            .setDescription("Remove a user from the DM allowlist")
            .addUserOption((opt) => opt.setName("user").setDescription("User to remove").setRequired(true)),
        )
        .addSubcommand((sub) =>
          sub.setName("list").setDescription("Show the DM allowlist"),
        ),

      new SlashCommandBuilder()
        .setName("access")
        .setDescription("Manage bot access control")
        .setDefaultMemberPermissions(adminOnly)
        .addSubcommand((sub) =>
          sub.setName("show").setDescription("Show current access rules"),
        )
        .addSubcommand((sub) =>
          sub
            .setName("allow-user")
            .setDescription("Add a user to the allowlist")
            .addUserOption((opt) => opt.setName("user").setDescription("User to allow").setRequired(true)),
        )
        .addSubcommand((sub) =>
          sub
            .setName("deny-user")
            .setDescription("Remove a user from the allowlist")
            .addUserOption((opt) => opt.setName("user").setDescription("User to remove").setRequired(true)),
        )
        .addSubcommand((sub) =>
          sub
            .setName("allow-role")
            .setDescription("Add a role to the allowlist")
            .addRoleOption((opt) => opt.setName("role").setDescription("Role to allow").setRequired(true)),
        )
        .addSubcommand((sub) =>
          sub
            .setName("deny-role")
            .setDescription("Remove a role from the allowlist")
            .addRoleOption((opt) => opt.setName("role").setDescription("Role to remove").setRequired(true)),
        )
        .addSubcommand((sub) =>
          sub
            .setName("allow-channel")
            .setDescription("Add a channel to the allowlist")
            .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to allow").setRequired(true)),
        )
        .addSubcommand((sub) =>
          sub
            .setName("deny-channel")
            .setDescription("Remove a channel from the allowlist")
            .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to remove").setRequired(true)),
        ),

      new SlashCommandBuilder()
        .setName("mention")
        .setDescription("Configure mention requirements")
        .setDefaultMemberPermissions(adminOnly)
        .addSubcommand((sub) =>
          sub.setName("on").setDescription("Require @mention or name mention to respond (default)"),
        )
        .addSubcommand((sub) =>
          sub.setName("off").setDescription("Respond to all messages in allowed channels"),
        ),

      new SlashCommandBuilder()
        .setName("logs")
        .setDescription("Show recent bot logs")
        .addIntegerOption((opt) =>
          opt.setName("count").setDescription("Number of log entries (default: 10)").setMinValue(1).setMaxValue(50),
        ),

      new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Emergency stop — cancel all running agent tasks")
        .setDefaultMemberPermissions(adminOnly),
    ]

    const rest = new REST({ version: "10" }).setToken(client.token!)
    await rest.put(Routes.applicationCommands(client.user!.id), {
      body: commands.map((c) => c.toJSON()),
    })
    this.addLog("info", `Registered ${commands.length} slash commands`)
  }

  /**
   * Fetch the Discord application's owner (or, for team-owned apps, every team
   * member) and cache the resulting user IDs. These IDs are always allowed to
   * invoke slash commands so the bot owner can bootstrap the
   * `discordDmAllowUserIds` allowlist on a fresh install via `/dm allow`.
   *
   * The desktop settings UI does not currently expose `discordDmAllowUserIds`,
   * so without this bypass a fresh install would have no way to authorize the
   * first user without hand-editing the config file.
   */
  private async loadApplicationOwners(client: import("discord.js").Client): Promise<void> {
    try {
      const application = await client.application?.fetch()
      if (!application) {
        this.applicationOwnerIds = new Set()
        return
      }
      const owner = application.owner
      const ids = new Set<string>()
      if (owner) {
        if ("members" in owner) {
          // Team-owned application: trust every team member.
          for (const member of owner.members.values()) {
            ids.add(member.user.id)
          }
        } else {
          // User-owned application.
          ids.add(owner.id)
        }
      }
      this.applicationOwnerIds = ids
      if (ids.size > 0) {
        this.addLog("info", `Cached ${ids.size} Discord application owner ID(s) for slash command authorization`)
      } else {
        this.addLog("warn", "Could not determine Discord application owner; slash commands will require discordDmAllowUserIds")
      }
    } catch (err) {
      this.addLog("warn", `Failed to load Discord application owner: ${err instanceof Error ? err.message : String(err)}`)
      this.applicationOwnerIds = new Set()
    }
  }

  /**
   * Slash commands that only READ state or identify the caller. These are
   * safe for any user in the DM allowlist (as well as app owners) because
   * they cannot mutate access lists, run agents, or cancel work.
   */
  private static readonly READ_ONLY_SLASH_COMMANDS: ReadonlySet<string> = new Set([
    "status",
    "logs",
    "whoami",
  ])

  /**
   * Returns the trust level of a caller for logging/reporting purposes.
   *   - "owner"      → Discord application owner (or Team member)
   *   - "allowlist"  → on `discordDmAllowUserIds`
   *   - "none"       → no trust
   */
  private classifyCaller(userId: string): "owner" | "allowlist" | "none" {
    if (this.applicationOwnerIds.has(userId)) return "owner"
    const cfg = configStore.get()
    const dmAllowList = sanitizeDiscordAllowlist(cfg.discordDmAllowUserIds)
    return dmAllowList.includes(userId) ? "allowlist" : "none"
  }

  private async handleSlashCommand(interaction: import("discord.js").Interaction) {
    if (!interaction.isChatInputCommand()) return

    const { commandName } = interaction
    const userId = interaction.user.id
    const isReadOnly = DiscordService.READ_ONLY_SLASH_COMMANDS.has(commandName)
    const cfg = configStore.get()
    const dmAllowUserIds = sanitizeDiscordAllowlist(cfg.discordDmAllowUserIds)

    // Two-tier auth:
    //   • Read-only commands (/status, /logs, /whoami) → owner OR allowlist
    //   • Mutating commands (/dm, /access, /mention, /stop) → owner ONLY
    //
    // The mutating tier is locked to the Discord application owner (or Team
    // members) because anyone on the DM allowlist can otherwise transitively
    // grant admin via `/dm allow @other_user`, effectively escalating to
    // owner-equivalent privileges.
    const authorized = isReadOnly
      ? canUseReadOnlySlashCommand({
          userId,
          applicationOwnerIds: this.applicationOwnerIds,
          dmAllowUserIds,
        })
      : canUseMutatingSlashCommand({
          userId,
          applicationOwnerIds: this.applicationOwnerIds,
        })

    if (!authorized) {
      // Security event: always logged (overrides the privacy default) so an
      // operator can see unauthorized attempts in the desktop app log panel.
      const displayName = interaction.user.username ?? "unknown"
      this.addLog(
        "warn",
        `Denied /${commandName} from ${displayName} (${userId}) — ${
          isReadOnly ? "not in allowlist and not application owner" : "mutating command is owner-only"
        }`,
      )
      const reason = isReadOnly
        ? "⛔ You don't have permission to use bot commands. Ask the bot owner to run `/dm allow @you`."
        : "⛔ This command is restricted to the Discord application owner. Run `/whoami` to see your current trust level."
      await interaction.reply({ content: reason, ephemeral: true })
      return
    }

    try {
      switch (commandName) {
        case "status":
          await this.handleStatusCommand(interaction)
          break
        case "whoami":
          await this.handleWhoamiCommand(interaction)
          break
        case "dm":
          await this.handleDmCommand(interaction)
          break
        case "access":
          await this.handleAccessCommand(interaction)
          break
        case "mention":
          await this.handleMentionCommand(interaction)
          break
        case "logs":
          await this.handleLogsCommand(interaction)
          break
        case "stop":
          await this.handleStopCommand(interaction)
          break
        default:
          await interaction.reply({ content: "Unknown command.", ephemeral: true })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.addLog("error", `Slash command /${commandName} failed: ${msg}`)
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: `❌ Error: ${msg}`, ephemeral: true }).catch(() => {})
      } else {
        await interaction.reply({ content: `❌ Error: ${msg}`, ephemeral: true }).catch(() => {})
      }
    }
  }

  private async handleStatusCommand(interaction: import("discord.js").ChatInputCommandInteraction) {
    const cfg = configStore.get()
    const status = this.getStatus()
    const ownerCount = this.applicationOwnerIds.size
    const ownerLine =
      ownerCount > 0
        ? `• Owners: ${ownerCount} trusted (auto-detected from Discord app)`
        : `• Owners: ⚠️ none detected — restart the bot to refresh`
    const lines = [
      `**Bot Status**`,
      `• Connected: ${status.connected ? "✅ yes" : "❌ no"}${status.botUsername ? ` (${status.botUsername})` : ""}`,
      ownerLine,
      `• DMs: ${cfg.discordDmEnabled ? "✅ enabled" : "❌ disabled"}`,
      `• Require mention: ${cfg.discordRequireMention !== false ? "yes" : "no"}`,
      `• DM allowlist: ${(cfg.discordDmAllowUserIds || []).length} users`,
      `• User allowlist: ${(cfg.discordAllowUserIds || []).length} users`,
      `• Role allowlist: ${(cfg.discordAllowRoleIds || []).length} roles`,
      `• Channel allowlist: ${(cfg.discordAllowChannelIds || []).length} channels`,
    ]
    await interaction.reply({ content: lines.join("\n"), ephemeral: true })
  }

  private async handleWhoamiCommand(interaction: import("discord.js").ChatInputCommandInteraction) {
    const userId = interaction.user.id
    const level = this.classifyCaller(userId)
    const trustLine =
      level === "owner"
        ? "✅ **Application owner** — full access (all slash commands, no allowlist required)"
        : level === "allowlist"
          ? "✅ **Allowlisted** — can use read-only slash commands (`/status`, `/logs`, `/whoami`) and DM the bot. Mutating commands are owner-only."
          : "⛔ **No access** — ask the bot owner to run `/dm allow @you` to grant read-only access."
    const lines = [
      `**You are:** <@${userId}>`,
      `**Your Discord ID:** \`${userId}\``,
      `**Trust level:** ${trustLine}`,
    ]
    await interaction.reply({ content: lines.join("\n"), ephemeral: true })
  }

  private async handleDmCommand(interaction: import("discord.js").ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    const cfg = configStore.get()

    switch (sub) {
      case "on":
        configStore.save({ ...configStore.get(), ...{ discordDmEnabled: true } })
        await interaction.reply({ content: "✅ DMs enabled (filtered by allowlist)", ephemeral: true })
        break
      case "off":
        configStore.save({ ...configStore.get(), ...{ discordDmEnabled: false } })
        await interaction.reply({ content: "✅ DMs disabled", ephemeral: true })
        break
      case "allow": {
        const user = interaction.options.getUser("user", true)
        const list = new Set(cfg.discordDmAllowUserIds || [])
        list.add(user.id)
        configStore.save({ ...configStore.get(), ...{ discordDmAllowUserIds: [...list], discordDmEnabled: true } })
        await interaction.reply({ content: `✅ <@${user.id}> added to DM allowlist`, ephemeral: true })
        break
      }
      case "deny": {
        const user = interaction.options.getUser("user", true)
        const list = (cfg.discordDmAllowUserIds || []).filter((id) => id !== user.id)
        configStore.save({ ...configStore.get(), ...{ discordDmAllowUserIds: list } })
        await interaction.reply({ content: `✅ <@${user.id}> removed from DM allowlist`, ephemeral: true })
        break
      }
      case "list": {
        const ids = cfg.discordDmAllowUserIds || []
        if (ids.length === 0) {
          await interaction.reply({ content: "DM allowlist is empty — no one can DM the bot.", ephemeral: true })
        } else {
          const mentions = ids.map((id) => `• <@${id}>`).join("\n")
          await interaction.reply({ content: `**DM Allowlist** (${ids.length} users)\n${mentions}`, ephemeral: true })
        }
        break
      }
    }
  }

  private async handleAccessCommand(interaction: import("discord.js").ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    const cfg = configStore.get()

    const updateList = (field: keyof typeof cfg, id: string, action: "add" | "remove") => {
      const current = (cfg[field] as string[] | undefined) || []
      const updated = action === "add" ? [...new Set([...current, id])] : current.filter((x) => x !== id)
      configStore.save({ ...configStore.get(), ...{ [field]: updated } as Partial<typeof cfg> })
      return updated
    }

    switch (sub) {
      case "show": {
        const show = (label: string, ids?: string[]) => {
          if (!ids || ids.length === 0) return ""
          return `• ${label}: ${ids.length} entries\n`
        }
        const lines = [
          "**Access Control**",
          show("User allowlist", cfg.discordAllowUserIds),
          show("Role allowlist", cfg.discordAllowRoleIds),
          show("Channel allowlist", cfg.discordAllowChannelIds),
          show("Guild allowlist", cfg.discordAllowGuildIds),
          show("DM allowlist", cfg.discordDmAllowUserIds),
        ].filter(Boolean)
        if (lines.length === 1) lines.push("No restrictions — all users can interact (when mentioned).")
        await interaction.reply({ content: lines.join("\n"), ephemeral: true })
        break
      }
      case "allow-user": {
        const user = interaction.options.getUser("user", true)
        updateList("discordAllowUserIds", user.id, "add")
        await interaction.reply({ content: `✅ <@${user.id}> added to user allowlist`, ephemeral: true })
        break
      }
      case "deny-user": {
        const user = interaction.options.getUser("user", true)
        updateList("discordAllowUserIds", user.id, "remove")
        await interaction.reply({ content: `✅ <@${user.id}> removed from user allowlist`, ephemeral: true })
        break
      }
      case "allow-role": {
        const role = interaction.options.getRole("role", true)
        updateList("discordAllowRoleIds", role.id, "add")
        await interaction.reply({ content: `✅ Role **${role.name}** added to allowlist`, ephemeral: true })
        break
      }
      case "deny-role": {
        const role = interaction.options.getRole("role", true)
        updateList("discordAllowRoleIds", role.id, "remove")
        await interaction.reply({ content: `✅ Role **${role.name}** removed from allowlist`, ephemeral: true })
        break
      }
      case "allow-channel": {
        const channel = interaction.options.getChannel("channel", true)
        updateList("discordAllowChannelIds", channel.id, "add")
        await interaction.reply({ content: `✅ <#${channel.id}> added to channel allowlist`, ephemeral: true })
        break
      }
      case "deny-channel": {
        const channel = interaction.options.getChannel("channel", true)
        updateList("discordAllowChannelIds", channel.id, "remove")
        await interaction.reply({ content: `✅ <#${channel.id}> removed from channel allowlist`, ephemeral: true })
        break
      }
    }
  }

  private async handleMentionCommand(interaction: import("discord.js").ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    if (sub === "on") {
      configStore.save({ ...configStore.get(), ...{ discordRequireMention: true } })
      await interaction.reply({ content: "✅ Bot now requires @mention or name mention to respond", ephemeral: true })
    } else {
      configStore.save({ ...configStore.get(), ...{ discordRequireMention: false } })
      await interaction.reply({ content: "⚠️ Bot will now respond to **all** messages in allowed channels", ephemeral: true })
    }
  }

  private async handleLogsCommand(interaction: import("discord.js").ChatInputCommandInteraction) {
    const count = interaction.options.getInteger("count") ?? 10
    const logs = this.getLogs().slice(-count)
    if (logs.length === 0) {
      await interaction.reply({ content: "No logs.", ephemeral: true })
      return
    }
    const lines = logs.map((l) => {
      const ts = new Date(l.timestamp).toLocaleTimeString()
      const icon = l.level === "error" ? "🔴" : l.level === "warn" ? "🟡" : "⚪"
      return `${icon} \`${ts}\` ${l.message}`
    })
    // Discord has a 2000 char limit
    let content = lines.join("\n")
    if (content.length > 1900) content = content.substring(0, 1900) + "\n..."
    await interaction.reply({ content, ephemeral: true })
  }

  private async handleStopCommand(interaction: import("discord.js").ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })
    try {
      await emergencyStopAll()
      await interaction.editReply({ content: "✅ Emergency stop — all running tasks cancelled" })
    } catch (err) {
      await interaction.editReply({ content: `❌ Stop failed: ${err instanceof Error ? err.message : String(err)}` })
    }
  }
}

export const discordService = new DiscordService()
