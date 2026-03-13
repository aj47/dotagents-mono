/**
 * WhatsApp MCP Server for DotAgents
 *
 * This MCP server enables WhatsApp messaging capabilities through the
 * Model Context Protocol. It allows AI agents to send and receive
 * WhatsApp messages.
 *
 * Usage:
 *   npx @dotagents/mcp-whatsapp
 *
 * Or add to DotAgents MCP config:
 *   {
 *     "mcpServers": {
 *       "whatsapp": {
 *         "command": "npx",
 *         "args": ["@dotagents/mcp-whatsapp"]
 *       }
 *     }
 *   }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import path from "path"
import os from "os"
import fs from "fs"
import { WhatsAppSession } from "./session.js"
import type { WhatsAppConfig, WhatsAppMessage } from "./types.js"

// Configuration from environment variables
const config: WhatsAppConfig = {
  authDir: process.env.WHATSAPP_AUTH_DIR || path.join(os.homedir(), ".dotagents", "whatsapp-auth"),
  allowFrom: process.env.WHATSAPP_ALLOW_FROM?.split(",").map((s) => s.trim()) || [],
  operatorAllowFrom: process.env.WHATSAPP_OPERATOR_ALLOW_FROM?.split(",").map((s) => s.trim()).filter(Boolean) || [],
  autoReply: process.env.WHATSAPP_AUTO_REPLY === "true",
  callbackUrl: process.env.WHATSAPP_CALLBACK_URL,
  callbackApiKey: process.env.WHATSAPP_CALLBACK_API_KEY,
  logMessages: process.env.WHATSAPP_LOG_MESSAGES === "true",
}

// Create WhatsApp session
const whatsapp = new WhatsAppSession(config)

// Pending messages queue for the agent to process
const pendingMessages: WhatsAppMessage[] = []
const MAX_PENDING_MESSAGES = 100

/**
 * Normalize a chatId to a consistent format for use as a map/set key.
 * WhatsApp can return different JID formats for the same chat:
 * - "@s.whatsapp.net" (phone number format)
 * - "@lid" (Linked ID format)
 * This function extracts just the numeric ID to ensure consistency.
 */
function normalizeChatId(chatId: string): string {
  // Strip the @suffix and non-numeric characters to get a consistent key
  return chatId.replace(/@.*$/, "").replace(/[^0-9]/g, "")
}

function normalizeWhatsAppOperatorIdentity(value: string | undefined): string {
  return (value || "").replace(/@.*$/, "").replace(/[^0-9]/g, "")
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
    "- /ops updater | updater check | updater download | updater reveal | updater open | updater releases",
    "- /ops tunnel | tunnel start | tunnel stop",
    "- /ops discord status | connect | disconnect",
    "- /ops whatsapp status | connect | logout",
    "- /ops restart-server",
    "- /ops restart-app",
  ].join("\n")
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
  const status = getOperatorString(details?.status)
  const lines = [
    status === "qr_required"
      ? "WhatsApp needs authentication in the desktop app. Open the app to continue linking the account."
      : getOperatorString(payload.message) || "Operator action completed.",
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
      `Health snapshot: ${getOperatorString(payload.overall) || "unknown"}`,
    ]

    for (const [name, entry] of Object.entries(checks)) {
      if (!isRecord(entry)) continue
      const status = getOperatorString(entry.status) || "unknown"
      const message = getOperatorString(entry.message) || ""
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
      const level = getOperatorString(entry.level) || "error"
      const component = getOperatorString(entry.component) || "unknown"
      const message = getOperatorString(entry.message) || "Unknown error"
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
      const action = getOperatorString(entry.action) || "unknown"
      const path = getOperatorString(entry.path) || "unknown"
      const success = typeof entry.success === "boolean" ? (entry.success ? "success" : "failure") : "unknown"
      const failureReason = getOperatorString(entry.failureReason)
      lines.push(`- ${timestamp || "unknown time"} ${success}: ${action} via ${path}${failureReason ? ` (${failureReason})` : ""}`)
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

async function executeWhatsAppOperatorCommand(command: ParsedOperatorCommand): Promise<string> {
  if (command.key === "help") {
    return getOperatorHelpText("WhatsApp")
  }

  if (!config.callbackUrl) {
    return "Operator API is unavailable because the WhatsApp callback URL is not configured."
  }
  if (!config.callbackApiKey) {
    return "Operator API is unavailable because the WhatsApp callback API key is not configured."
  }

  let operatorBaseUrl: URL
  try {
    operatorBaseUrl = new URL("/v1/operator/", config.callbackUrl)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return `Operator API is unavailable because the callback URL is invalid. (${errorMessage})`
  }

  const url = new URL(command.path || "status", operatorBaseUrl)
  for (const [key, value] of Object.entries(command.query ?? {})) {
    url.searchParams.set(key, value)
  }

  try {
    const timeoutMs = command.key === "run-agent" ? 120_000 : 5000
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const fetchOptions: RequestInit = {
      method: command.method,
      headers: {
        Authorization: `Bearer ${config.callbackApiKey}`,
        ...(command.body ? { "Content-Type": "application/json" } : {}),
      },
    }
    if (command.body) {
      fetchOptions.body = JSON.stringify(command.body)
    }
    const response = await Promise.race([
      fetch(url.toString(), fetchOptions),
      new Promise<Response>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
      }),
    ]).finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    })
    const payload = await readOperatorPayload(response)

    if (!response.ok) {
      const errorMessage = isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : typeof payload === "string" && payload
          ? payload
          : `HTTP ${response.status}`
      const authHint = response.status === 401 ? " Check the callback API key." : ""
      return `Operator API request failed (${response.status}): ${errorMessage}.${authHint}`
    }

    return formatOperatorPayload(command, payload)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return `Operator API is unavailable at ${operatorBaseUrl.origin}. Make sure the remote server is reachable from the configured callback URL. (${errorMessage})`
  }
}

async function maybeHandleWhatsAppOperatorCommand(message: WhatsAppMessage): Promise<boolean> {
  const command = parseOperatorCommand(message.text || "")
  if (!command) return false

  const replyTarget = message.chatId || message.from
  const operatorAllowFrom = config.operatorAllowFrom ?? []
  if (operatorAllowFrom.length > 0) {
    const senderId = normalizeWhatsAppOperatorIdentity(message.from)
    const chatId = normalizeWhatsAppOperatorIdentity(message.chatId)
    const isOperatorAllowed = operatorAllowFrom.some((allowed) => {
      const normalizedAllowed = normalizeWhatsAppOperatorIdentity(allowed)
      return normalizedAllowed.length >= 7 && (normalizedAllowed === senderId || normalizedAllowed === chatId)
    })

    if (!isOperatorAllowed) {
      console.error(`[MCP-WhatsApp] Denied operator command from ${replyTarget}: sender not in WHATSAPP_OPERATOR_ALLOW_FROM`)
      await whatsapp.sendMessage({
        to: replyTarget,
        text: "Operator access denied for this WhatsApp sender/chat. Add the sender to the WhatsApp operator allowlist to grant /ops access.",
      })
      return true
    }
  }

  console.error(`[MCP-WhatsApp] Handling operator command from ${replyTarget}: ${command.label}`)

  try {
    const responseText = await executeWhatsAppOperatorCommand(command)
    await whatsapp.sendMessage({
      to: replyTarget,
      text: responseText,
    })
    console.error(`[MCP-WhatsApp] Completed operator command for ${replyTarget}: ${command.label}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[MCP-WhatsApp] Operator command failed for ${replyTarget}: ${errorMessage}`)
    try {
      await whatsapp.sendMessage({
        to: replyTarget,
        text: `Operator command failed: ${errorMessage}`,
      })
    } catch (sendError) {
      console.error("[MCP-WhatsApp] Failed to send operator error reply:", sendError)
    }
  }

  return true
}

// Track users who have requested a new session via /new command
// Key: normalized chatId (numeric only), Value: true if new session requested
const newSessionRequested: Set<string> = new Set()

// Track active conversation IDs per chat
// Key: normalized chatId (numeric only), Value: current active conversationId (with timestamp if created via /new)
// This ensures subsequent messages go to the same conversation after /new
const activeConversations: Map<string, string> = new Map()

// File path for persisting active conversations
const ACTIVE_CONVERSATIONS_FILE = path.join(config.authDir, "active-conversations.json")

/**
 * Load active conversations from disk.
 * Called on startup to restore conversation state after server restart.
 */
function loadActiveConversations(): void {
  try {
    if (fs.existsSync(ACTIVE_CONVERSATIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACTIVE_CONVERSATIONS_FILE, "utf-8"))
      if (data && typeof data === "object") {
        for (const [chatId, conversationId] of Object.entries(data)) {
          if (typeof conversationId === "string") {
            activeConversations.set(chatId, conversationId)
          }
        }
        console.error(`[MCP-WhatsApp] Loaded ${activeConversations.size} active conversation(s) from disk`)
      }
    }
  } catch (error) {
    console.error(`[MCP-WhatsApp] Failed to load active conversations:`, error)
  }
}

/**
 * Save active conversations to disk.
 * Called whenever a new conversation is started via /new.
 */
function saveActiveConversations(): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(ACTIVE_CONVERSATIONS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const data: Record<string, string> = {}
    for (const [chatId, conversationId] of activeConversations) {
      data[chatId] = conversationId
    }
    fs.writeFileSync(ACTIVE_CONVERSATIONS_FILE, JSON.stringify(data, null, 2))
    console.error(`[MCP-WhatsApp] Saved ${activeConversations.size} active conversation(s) to disk`)
  } catch (error) {
    console.error(`[MCP-WhatsApp] Failed to save active conversations:`, error)
  }
}

// Load active conversations on startup
loadActiveConversations()

// Message processing queue per chat to ensure serial processing
// This prevents race conditions when multiple messages arrive for the same conversation
// Key: normalized chatId (numeric only), Value: { queue: messages waiting to be processed, isProcessing: whether a message is currently being processed }
const messageQueues: Map<string, { queue: WhatsAppMessage[], isProcessing: boolean }> = new Map()

// Process the next message in a chat's queue
async function processNextMessage(chatId: string): Promise<void> {
  const queueState = messageQueues.get(chatId)
  if (!queueState || queueState.queue.length === 0 || queueState.isProcessing) {
    return
  }

  const message = queueState.queue.shift()!
  queueState.isProcessing = true
  console.error(`[MCP-WhatsApp] Processing queued message for ${chatId} (${queueState.queue.length} remaining in queue)`)

  try {
    await processMessage(message)
  } catch (error) {
    console.error(`[MCP-WhatsApp] Error processing queued message for ${chatId}:`, error)
  } finally {
    queueState.isProcessing = false
    // Process next message in queue if any
    if (queueState.queue.length > 0) {
      // Small delay to allow disk writes to complete and prevent overwhelming the agent
      setTimeout(() => processNextMessage(chatId), 100)
    }
  }
}

// Queue a message for processing
function queueMessage(message: WhatsAppMessage): void {
  const rawChatId = message.chatId || message.from
  const chatId = normalizeChatId(rawChatId) // Normalize for consistent queue management

  if (!messageQueues.has(chatId)) {
    messageQueues.set(chatId, { queue: [], isProcessing: false })
  }

  const queueState = messageQueues.get(chatId)!
  queueState.queue.push(message)
  console.error(`[MCP-WhatsApp] Queued message for ${chatId} (queue size: ${queueState.queue.length})`)

  // Start processing if not already in progress
  processNextMessage(chatId)
}

// Process a single message (extracted from the original message handler)
async function processMessage(message: WhatsAppMessage): Promise<void> {
  const rawChatId = message.chatId || message.from
  const chatId = normalizeChatId(rawChatId) // Normalize for consistent key lookups
  const messageText = message.text || ""

  // Debug log for message processing
  console.error(`[MCP-WhatsApp] === PROCESSING MESSAGE ===`)
  console.error(`[MCP-WhatsApp] Chat ID: ${rawChatId} (normalized: ${chatId})`)

  // Add to pending queue (for compatibility with existing get_messages tool)
  pendingMessages.push(message)
  if (pendingMessages.length > MAX_PENDING_MESSAGES) {
    pendingMessages.shift()
  }

  // If callback URL is configured, forward the message
  if (config.callbackUrl && config.callbackApiKey) {
    try {
      // Use message.chatId for groups/DMs instead of message.from
      // In groups, message.from is the participant, but we need to reply to the chat
      const replyTarget = rawChatId

      // Determine conversation ID - use new unique ID if /new was requested
      // Otherwise use the active conversation for this chat (persists the timestamped ID)
      // Use normalized chatId in conversation IDs for consistency across @lid/@s.whatsapp.net formats
      let conversationId: string
      if (newSessionRequested.has(chatId)) {
        // Generate a unique conversation ID for this new session
        conversationId = `whatsapp_${chatId}_${Date.now()}`
        newSessionRequested.delete(chatId)
        activeConversations.set(chatId, conversationId)
        saveActiveConversations() // Persist new conversation ID to disk
        console.error(`[MCP-WhatsApp] Starting new session for ${chatId}: ${conversationId}`)
      } else if (activeConversations.has(chatId)) {
        // Use existing active conversation ID (preserves timestamped IDs from /new)
        conversationId = activeConversations.get(chatId)!
        console.error(`[MCP-WhatsApp] Continuing session for ${chatId}: ${conversationId}`)
      } else {
        // First message from this chat - use static ID and store it
        conversationId = `whatsapp_${chatId}`
        activeConversations.set(chatId, conversationId)
        saveActiveConversations() // Persist new conversation ID to disk
        console.error(`[MCP-WhatsApp] Starting default session for ${chatId}: ${conversationId}`)
      }

      // Build message content - use array format if there's an image, otherwise string
      let messageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>

      // Simplified prompt - the MCP server handles output automatically
      const textContent = `[WhatsApp message from ${message.fromName || message.from}]: ${messageText}

Note: This is a WhatsApp message. Respond naturally - your response will be automatically sent back.`

      // If there's an image, create a multimodal message
      if (message.mediaType === "image" && message.mediaBuffer) {
        // Format as OpenAI-compatible content array with image
        const base64Image = message.mediaBuffer.toString("base64")
        const mimeType = message.mediaMimetype || "image/jpeg"
        messageContent = [
          {
            type: "text",
            text: textContent,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ]
        console.error(`[MCP-WhatsApp] Forwarding image message (${message.mediaBuffer!.length} bytes)`)
      } else {
        messageContent = textContent
      }

      // Send typing indicator immediately so user knows we're processing
      try {
        await whatsapp.sendTypingIndicator(replyTarget)
        console.error(`[MCP-WhatsApp] Sent typing indicator to ${replyTarget}`)
      } catch (error) {
        console.error(`[MCP-WhatsApp] Failed to send typing indicator:`, error)
        // Continue even if typing indicator fails
      }

      console.error(`[MCP-WhatsApp] Forwarding message to callback URL: ${config.callbackUrl}`)
      console.error(`[MCP-WhatsApp] Using conversation_id: ${conversationId}`)

      const response = await fetch(config.callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.callbackApiKey}`,
        },
        body: JSON.stringify({
          model: "default",
          messages: [
            {
              role: "user",
              content: messageContent,
            },
          ],
          conversation_id: conversationId,
          stream: false,
        }),
      })

      console.error(`[MCP-WhatsApp] Callback response received. autoReply=${config.autoReply}, responseOk=${response.ok}`)
      if (response.ok && config.autoReply) {
        // Parse response - support both OpenAI-style (choices[0].message.content) and simple (content) formats
        const data = (await response.json()) as {
          content?: string
          choices?: Array<{ message?: { content?: string } }>
        }
        // Try OpenAI format first, then fall back to simple format
        const replyContent = data.choices?.[0]?.message?.content || data.content
        if (replyContent) {
          console.error(`[MCP-WhatsApp] autoReply: Sending message to ${replyTarget} (${replyContent.length} chars)`)
          await whatsapp.sendMessage({
            to: replyTarget,
            text: replyContent,
          })
        }
      }
    } catch (error) {
      console.error("[MCP-WhatsApp] Error forwarding message to callback:", error)
    }
  }
}

// Handle incoming messages - delegates to serial queue processing
whatsapp.on("message", async (message: WhatsAppMessage) => {
  const rawChatId = message.chatId || message.from
  const chatId = normalizeChatId(rawChatId) // Normalize for consistent key lookups
  const messageText = message.text || ""

  // Debug log for /new command detection - show character codes for debugging
  const trimmed = messageText.trim()
  const lower = trimmed.toLowerCase()
  const charCodes = [...trimmed].map(c => c.charCodeAt(0)).join(',')
  console.error(`[MCP-WhatsApp] === MESSAGE RECEIVED ===`)
  console.error(`[MCP-WhatsApp] Raw text: "${messageText}"`)
  console.error(`[MCP-WhatsApp] Trimmed: "${trimmed}" (length: ${trimmed.length})`)
  console.error(`[MCP-WhatsApp] Lower: "${lower}"`)
  console.error(`[MCP-WhatsApp] Char codes: [${charCodes}]`)
  console.error(`[MCP-WhatsApp] Expected: "/new" (char codes: [47,110,101,119])`)
  console.error(`[MCP-WhatsApp] Match check: "${lower}" === "/new" ? ${lower === "/new"}`)
  console.error(`[MCP-WhatsApp] Chat ID: ${rawChatId} (normalized: ${chatId})`)

  if (await maybeHandleWhatsAppOperatorCommand(message)) {
    return
  }

  // Handle /new command - start a new session on next message
  // Also check for common variations
  const isNewCommand = lower === "/new" || lower === "\\new" || lower === "/new\n" || trimmed === "/new"
  console.error(`[MCP-WhatsApp] isNewCommand: ${isNewCommand}`)

  if (isNewCommand) {
    newSessionRequested.add(chatId)
    console.error(`[MCP-WhatsApp] /new command received from ${chatId} - next message will start a new session`)

    // Send confirmation to the user (use rawChatId for WhatsApp API)
    try {
      await whatsapp.sendMessage({
        to: rawChatId,
        text: "✅ New session requested. Your next message will start a fresh conversation.",
      })
    } catch (error) {
      console.error("[MCP-WhatsApp] Failed to send /new confirmation:", error)
    }

    // Don't forward /new command to the agent
    return
  }

  // Only log message content if logging is enabled to avoid accidental leakage
  if (config.logMessages) {
    console.error(`[MCP-WhatsApp] New message from ${message.fromName || message.from}: ${messageText.substring(0, 50)}...`)
  } else {
    const mediaInfo = message.mediaType ? ` [${message.mediaType}]` : ""
    console.error(`[MCP-WhatsApp] New message from ${message.fromName || message.from}${mediaInfo}`)
  }

  // Queue the message for serial processing
  // This ensures messages from the same chat are processed one at a time,
  // preventing race conditions that cause message ordering issues in the UI
  queueMessage(message)
})

// Handle connection updates
whatsapp.on("connectionUpdate", (status) => {
  console.error(`[MCP-WhatsApp] Connection status: ${status.connected ? "connected" : "disconnected"}`)
  if (status.phoneNumber) {
    console.error(`[MCP-WhatsApp] Logged in as: ${status.userName || "Unknown"} (${status.phoneNumber})`)
  }
  if (status.lastError) {
    console.error(`[MCP-WhatsApp] Last error: ${status.lastError}`)
  }
})

// Handle QR code
whatsapp.on("qr", (qr) => {
  console.error("[MCP-WhatsApp] QR code available - scan with WhatsApp to authenticate")
})

// Define tool schemas
const tools = [
  {
    name: "whatsapp_send_message",
    description:
      "Send a WhatsApp message to a phone number or chat. The recipient should be a phone number in international format (e.g., 14155551234) without the + sign.",
    inputSchema: {
      type: "object" as const,
      properties: {
        to: {
          type: "string",
          description: "Recipient phone number in international format (e.g., 14155551234) or chat JID",
        },
        text: {
          type: "string",
          description: "Message text to send. Long messages will be automatically chunked.",
        },
      },
      required: ["to", "text"],
    },
  },
  {
    name: "whatsapp_get_messages",
    description:
      "Get recent messages from a specific chat. Returns the last N messages from the chat history.",
    inputSchema: {
      type: "object" as const,
      properties: {
        chat_id: {
          type: "string",
          description: "Chat ID (phone number or group JID) to get messages from",
        },
        limit: {
          type: "number",
          description: "Maximum number of messages to return (default: 20, max: 50)",
        },
      },
      required: ["chat_id"],
    },
  },
  {
    name: "whatsapp_list_chats",
    description:
      "List all available WhatsApp chats with their last message and timestamp. Useful for seeing who has messaged recently.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of chats to return (default: 20)",
        },
      },
      required: [],
    },
  },
  {
    name: "whatsapp_get_pending_messages",
    description:
      "Get messages that have arrived since the last check. Returns and clears the pending message queue. Use this to check for new incoming messages.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "whatsapp_get_status",
    description:
      "Get the current WhatsApp connection status including whether connected, phone number, and any errors.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "whatsapp_connect",
    description:
      "Connect to WhatsApp. If not authenticated, this will generate a QR code that needs to be scanned with the WhatsApp mobile app.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "whatsapp_disconnect",
    description: "Disconnect from WhatsApp without logging out. Credentials are preserved for reconnection.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "whatsapp_logout",
    description:
      "Logout from WhatsApp and clear all credentials. You will need to scan the QR code again to reconnect.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "whatsapp_send_typing",
    description:
      "Send a typing indicator to a WhatsApp chat. This shows the 'typing...' status to the recipient. Call this immediately when you receive a message to let the user know you're processing their request. The typing indicator will automatically stop when you send a message.",
    inputSchema: {
      type: "object" as const,
      properties: {
        to: {
          type: "string",
          description: "Recipient phone number in international format (e.g., 14155551234) or chat JID",
        },
      },
      required: ["to"],
    },
  },
]

// Create MCP server
const server = new Server(
  {
    name: "whatsapp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "whatsapp_send_message": {
        const { to, text } = args as { to: string; text: string }
        if (!to || !text) {
          return {
            content: [{ type: "text", text: "Error: 'to' and 'text' are required" }],
            isError: true,
          }
        }

        console.error(`[MCP-WhatsApp] TOOL whatsapp_send_message: Sending to ${to} (${text.length} chars)`)
        const result = await whatsapp.sendMessage({ to, text })
        if (result.success) {
          return {
            content: [
              {
                type: "text",
                text: `Message sent successfully to ${to}. Message ID: ${result.messageId || "unknown"}`,
              },
            ],
          }
        } else {
          return {
            content: [{ type: "text", text: `Failed to send message: ${result.error}` }],
            isError: true,
          }
        }
      }

      case "whatsapp_get_messages": {
        const { chat_id, limit = 20 } = args as { chat_id: string; limit?: number }
        if (!chat_id) {
          return {
            content: [{ type: "text", text: "Error: 'chat_id' is required" }],
            isError: true,
          }
        }

        // Normalize chat ID and search both @s.whatsapp.net and @lid formats
        // Some DMs may be keyed/stored under @lid chat IDs
        let messages: WhatsAppMessage[] = []
        const numericId = chat_id.replace(/[^0-9]/g, "")

        if (chat_id.includes("@")) {
          // Already has a suffix, use as-is
          messages = whatsapp.getMessages(chat_id, Math.min(limit, 50))
        } else {
          // Try @s.whatsapp.net first (standard phone number format)
          const phoneJid = `${numericId}@s.whatsapp.net`
          messages = whatsapp.getMessages(phoneJid, Math.min(limit, 50))

          // If no messages found, try @lid format (WhatsApp Linked ID)
          if (messages.length === 0) {
            const lidJid = `${numericId}@lid`
            messages = whatsapp.getMessages(lidJid, Math.min(limit, 50))
          }
        }

        if (messages.length === 0) {
          return {
            content: [{ type: "text", text: `No messages found for chat ${chat_id}` }],
          }
        }

        const formatted = messages.map((m) => ({
          from: m.fromName || m.from,
          text: m.text,
          timestamp: new Date(m.timestamp).toISOString(),
          isGroup: m.isGroup,
        }))

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        }
      }

      case "whatsapp_list_chats": {
        const { limit = 20 } = args as { limit?: number }
        const chats = await whatsapp.getChats()
        const limitedChats = chats.slice(0, limit)

        if (limitedChats.length === 0) {
          return {
            content: [{ type: "text", text: "No chats found. You may need to receive some messages first." }],
          }
        }

        const formatted = limitedChats.map((c) => ({
          id: c.id,
          name: c.name,
          isGroup: c.isGroup,
          lastMessage: c.lastMessage?.substring(0, 100),
          lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toISOString() : null,
        }))

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        }
      }

      case "whatsapp_get_pending_messages": {
        const messages = [...pendingMessages]
        pendingMessages.length = 0 // Clear the queue

        if (messages.length === 0) {
          return {
            content: [{ type: "text", text: "No pending messages" }],
          }
        }

        // Build response - include image data inline as base64 when available
        const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = []

        const formatted = messages.map((m) => {
          const msgInfo: Record<string, unknown> = {
            from: m.from,
            fromName: m.fromName,
            text: m.text,
            timestamp: new Date(m.timestamp).toISOString(),
            isGroup: m.isGroup,
            chatId: m.chatId,
          }

          // Add media info if present
          if (m.mediaType) {
            msgInfo.mediaType = m.mediaType
            if (m.mediaBuffer) {
              msgInfo.hasMedia = true
              msgInfo.mediaSize = m.mediaBuffer.length
            }
          }

          return msgInfo
        })

        // Add text content with message info
        contentParts.push({
          type: "text",
          text: JSON.stringify(formatted, null, 2),
        })

        // Add image content parts for messages with images
        for (const m of messages) {
          if (m.mediaType === "image" && m.mediaBuffer) {
            const base64Image = m.mediaBuffer.toString("base64")
            const mimeType = m.mediaMimetype || "image/jpeg"
            contentParts.push({
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            })
          }
        }

        // If we have images, return as content array; otherwise just text
        if (contentParts.length > 1) {
          // For MCP image content, we need to return raw base64 data (no data: URL prefix)
          // and use the actual mimeType from the message
          const mcpContent: Array<{ type: string; text?: string; data?: string; mimeType?: string }> = []

          for (const part of contentParts) {
            if (part.type === "text") {
              mcpContent.push({ type: "text", text: part.text || "" })
            } else if (part.type === "image_url" && part.image_url) {
              // Extract raw base64 data without the data: URL prefix
              // The URL is in format: data:${mimeType};base64,${base64Data}
              const dataUrl = part.image_url.url
              const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
              if (base64Match) {
                const actualMimeType = base64Match[1]
                const rawBase64 = base64Match[2]
                mcpContent.push({ type: "image", data: rawBase64, mimeType: actualMimeType })
              }
            }
          }

          return { content: mcpContent }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        }
      }

      case "whatsapp_get_status": {
        const status = whatsapp.getStatus()
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  connected: status.connected,
                  phoneNumber: status.phoneNumber,
                  userName: status.userName,
                  hasQrCode: !!status.qrCode,
                  qrCode: status.qrCode, // Include actual QR code data for UI display
                  lastError: status.lastError,
                  hasCredentials: whatsapp.hasCredentials(),
                },
                null,
                2
              ),
            },
          ],
        }
      }

      case "whatsapp_connect": {
        const currentStatus = whatsapp.getStatus()
        if (currentStatus.connected) {
          return {
            content: [
              {
                type: "text",
                text: `Already connected as ${currentStatus.userName} (${currentStatus.phoneNumber})`,
              },
            ],
          }
        }

        await whatsapp.connect()

        // Wait a bit for connection or QR code
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const newStatus = whatsapp.getStatus()
        if (newStatus.connected) {
          return {
            content: [
              {
                type: "text",
                text: `Connected successfully as ${newStatus.userName} (${newStatus.phoneNumber})`,
              },
            ],
          }
        } else if (newStatus.qrCode) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "qr_required",
                  qrCode: newStatus.qrCode,
                  message: "QR code generated. Scan with your WhatsApp mobile app to authenticate.",
                }),
              },
            ],
          }
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Connecting... Current status: ${newStatus.lastError || "waiting"}`,
              },
            ],
          }
        }
      }

      case "whatsapp_disconnect": {
        await whatsapp.disconnect()
        return {
          content: [{ type: "text", text: "Disconnected from WhatsApp. Credentials preserved." }],
        }
      }

      case "whatsapp_logout": {
        await whatsapp.logout()
        return {
          content: [
            {
              type: "text",
              text: "Logged out from WhatsApp. Credentials cleared. You will need to scan QR code again.",
            },
          ],
        }
      }

      case "whatsapp_send_typing": {
        const { to } = args as { to: string }
        if (!to) {
          return {
            content: [{ type: "text", text: "Error: 'to' is required" }],
            isError: true,
          }
        }

        const result = await whatsapp.sendTypingIndicator(to)
        if (result.success) {
          return {
            content: [
              {
                type: "text",
                text: `Typing indicator sent to ${to}. The recipient will see "typing..." until you send a message.`,
              },
            ],
          }
        } else {
          return {
            content: [{ type: "text", text: `Failed to send typing indicator: ${result.error}` }],
            isError: true,
          }
        }
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[MCP-WhatsApp] Tool error (${name}):`, errorMessage)
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    }
  }
})

// Main entry point
async function main() {
  console.error("[MCP-WhatsApp] Starting WhatsApp MCP Server...")
  console.error(`[MCP-WhatsApp] Auth directory: ${config.authDir}`)

  if (config.allowFrom && config.allowFrom.length > 0) {
    console.error(`[MCP-WhatsApp] Allowlist: ${config.allowFrom.join(", ")}`)
  } else {
    console.error("[MCP-WhatsApp] No allowlist configured - all messages will be accepted")
  }

  if (config.operatorAllowFrom && config.operatorAllowFrom.length > 0) {
    console.error(`[MCP-WhatsApp] Operator allowlist: ${config.operatorAllowFrom.join(", ")}`)
  } else {
    console.error("[MCP-WhatsApp] No operator allowlist configured - /ops follows the normal allowlist")
  }

  if (config.callbackUrl) {
    console.error(`[MCP-WhatsApp] Callback URL: ${config.callbackUrl}`)
    console.error(`[MCP-WhatsApp] Auto-reply: ${config.autoReply}`)
  }

  // Auto-connect if credentials exist
  if (whatsapp.hasCredentials()) {
    console.error("[MCP-WhatsApp] Found existing credentials, connecting...")
    try {
      await whatsapp.connect()
    } catch (error) {
      console.error("[MCP-WhatsApp] Auto-connect failed:", error)
    }
  } else {
    console.error("[MCP-WhatsApp] No credentials found. Use whatsapp_connect tool to authenticate.")
  }

  // Start MCP server
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("[MCP-WhatsApp] MCP Server started successfully")
}

main().catch((error) => {
  console.error("[MCP-WhatsApp] Fatal error:", error)
  process.exit(1)
})
