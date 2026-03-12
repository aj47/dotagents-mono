import type { Client, Message } from "discord.js"
import { configStore } from "./config"
import { logApp } from "./debug"
import { agentProfileService } from "./agent-profile-service"
import { runAgent } from "./remote-server"
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
  botId?: string
  botUsername?: string
  lastError?: string
  lastEventAt?: number
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
    return {
      ...this.status,
      enabled: !!cfg.discordEnabled,
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
    const token = cfg.discordBotToken?.trim()
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

    const profileId = cfg.discordDefaultProfileId?.trim()
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