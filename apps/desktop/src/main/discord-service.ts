import type { Client, Message } from "discord.js"
import { configStore } from "./config"
import { logApp } from "./debug"
import { agentProfileService } from "./agent-profile-service"
import { runAgent } from "./remote-server"
import {
  getDiscordResolvedDefaultProfileId,
  getDiscordResolvedToken,
} from "./discord-config"
import {
  getDiscordConversationId,
  getDiscordMessageRejectionReason,
  splitDiscordMessageContent,
} from "./discord-utils"

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
    | "restart-server"
    | "restart-app"
  label: string
  method?: OperatorCommandMethod
  path?: string
  query?: Record<string, string>
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

  if (allowUserIds.length === 0 && allowGuildIds.length === 0 && allowChannelIds.length === 0) {
    return null
  }

  if (allowUserIds.length > 0 && !allowUserIds.includes(message.author.id)) {
    return "user is not in the Discord operator allowlist"
  }

  if (allowGuildIds.length > 0 && (!message.guildId || !allowGuildIds.includes(message.guildId))) {
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
  if (first === "health" && parts.length === 1) {
    return { key: "health", label: "/ops health", method: "GET", path: "health" }
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
    const response = await fetch(url, {
      method: command.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000),
    })
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

class DiscordService {
  private client: Client | null = null
  private status: DiscordStatus = {
    available: true,
    enabled: false,
    connected: false,
    connecting: false,
  }
  private logs: DiscordLogEntry[] = []
  private readonly maxLogs = 200
  private startPromise: Promise<{ success: boolean; error?: string }> | null = null
  private readonly processingChains = new Map<string, Promise<void>>()

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
    const profile = defaultProfile.profileId
      ? agentProfileService.getById(defaultProfile.profileId)
      : undefined

    return {
      ...this.status,
      enabled: !!cfg.discordEnabled,
      tokenConfigured: !!token.token,
      tokenSource: token.source,
      defaultProfileId: defaultProfile.profileId,
      defaultProfileName: profile?.displayName,
      defaultProfileSource: defaultProfile.source,
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
    const token = getDiscordResolvedToken(cfg).token
    if (!cfg.discordEnabled) {
      const error = "Discord integration is disabled"
      this.setStatus({ enabled: false, connected: false, connecting: false, lastError: error })
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
    this.setStatus({ enabled: true, connecting: true, connected: false, lastError: undefined })

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

      client.once("ready", () => {
        this.setStatus({
          connected: true,
          connecting: false,
          botId: client.user?.id,
          botUsername: client.user?.username,
          lastError: undefined,
        })
        this.addLog("info", `Connected as ${client.user?.username || "unknown bot"}`)
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
        void this.handleMessage(message)
      })

      await client.login(token)
      this.client = client
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.setStatus({ connected: false, connecting: false, lastError: message })
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
    const rejectionReason = getDiscordMessageRejectionReason({
      authorId: message.author.id,
      channelId: message.channel.id,
      guildId: message.guildId,
      isDirectMessage,
      mentioned: message.mentions.users.has(this.client.user.id),
      requireMention: cfg.discordRequireMention ?? true,
      dmEnabled: cfg.discordDmEnabled ?? true,
      allowUserIds: cfg.discordAllowUserIds,
      allowGuildIds: cfg.discordAllowGuildIds,
      allowChannelIds: cfg.discordAllowChannelIds,
    })

    if (rejectionReason) {
      this.addLog("info", `Ignored Discord message from ${message.author.id}: ${rejectionReason}`)
      return
    }

    const prompt = this.stripBotMention(message.content).trim()
    if (!prompt) {
      this.addLog("info", `Ignored Discord message from ${message.author.id}: empty prompt after mention stripping`)
      return
    }

    if (await this.maybeHandleOperatorCommand(message, prompt)) {
      return
    }

    const profileId = getDiscordResolvedDefaultProfileId(cfg).profileId
    if (!profileId) {
      await this.sendChunks(message, "Discord integration is enabled, but no default agent profile is configured yet.")
      this.addLog("warn", "Rejected Discord message because no default profile is configured")
      return
    }

    const profile = agentProfileService.getById(profileId)
    if (!profile) {
      await this.sendChunks(message, "The configured Discord default profile could not be found. Please update Discord settings.")
      this.addLog("warn", `Rejected Discord message because profile ${profileId} was not found`)
      return
    }

    const conversationId = getDiscordConversationId({
      channelId: message.channel.isThread() ? (message.channel.parentId || message.channel.id) : message.channel.id,
      guildId: message.guildId,
      threadId: message.channel.isThread() ? message.channel.id : undefined,
      isDirectMessage,
    })

    const processingChain = (this.processingChains.get(conversationId) || Promise.resolve())
      .catch(() => undefined)
      .then(async () => {
        const shouldLogMessages = cfg.discordLogMessages ?? false
        const promptSummary = shouldLogMessages ? `: ${prompt}` : ` (${prompt.length} chars)`
        this.addLog("info", `Processing Discord message for ${conversationId}${promptSummary}`)

        try {
          const result = await runAgent({
            prompt,
            conversationId,
            profileId,
          })
          const responseText = result.content?.trim() || "Done."
          await this.sendChunks(message, responseText)
          this.addLog("info", `Replied to Discord conversation ${conversationId}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          this.addLog("error", `Discord reply failed for ${conversationId}: ${errorMessage}`)
          await this.sendChunks(message, `I hit an error while processing that message: ${errorMessage}`)
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
    const botId = this.client?.user?.id
    if (!botId) return content.trim()
    return content.replace(new RegExp(`<@!?${botId}>`, "g"), " ").replace(/\s+/g, " ").trim()
  }

  private async sendChunks(message: Message<boolean>, content: string) {
    const chunks = splitDiscordMessageContent(content)
    if (chunks.length === 0) return
    if (!("send" in message.channel) || typeof message.channel.send !== "function") return
    for (const chunk of chunks) {
      await message.channel.send({ content: chunk })
    }
  }
}

export const discordService = new DiscordService()