import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, RefreshCw, Trash2, XCircle } from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import { Control, ControlGroup } from "@renderer/components/ui/control"
import { Input } from "@renderer/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/select"
import { Switch } from "@renderer/components/ui/switch"
import { Textarea } from "@renderer/components/ui/textarea"
import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/query-client"
import { tipcClient } from "@renderer/lib/tipc-client"
import { formatConfigListInput, parseConfigListInput } from "@dotagents/shared/config-list-input"
import {
  DEFAULT_DISCORD_ENABLED,
  DEFAULT_DISCORD_DM_ENABLED,
  DEFAULT_DISCORD_LOG_MESSAGES,
  DEFAULT_DISCORD_REQUIRE_MENTION,
} from "@dotagents/shared/discord-config"
import type { AgentProfile, Config } from "@shared/types"

interface DiscordStatus {
  available: boolean
  enabled: boolean
  connected: boolean
  connecting: boolean
  botId?: string
  botUsername?: string
  lastError?: string
}

interface DiscordLogEntry {
  id: string
  level: "info" | "warn" | "error"
  message: string
  timestamp: number
}

export function Component() {
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const cfg = configQuery.data as Config | undefined
  const cfgRef = useRef<Config | undefined>(cfg)

  const [status, setStatus] = useState<DiscordStatus | null>(null)
  const [logs, setLogs] = useState<DiscordLogEntry[]>([])
  const [profiles, setProfiles] = useState<AgentProfile[]>([])
  const [statusError, setStatusError] = useState<string | null>(null)
  const [botTokenDraft, setBotTokenDraft] = useState("")
  const [userAllowlistDraft, setUserAllowlistDraft] = useState("")
  const [guildAllowlistDraft, setGuildAllowlistDraft] = useState("")
  const [channelAllowlistDraft, setChannelAllowlistDraft] = useState("")

  useEffect(() => {
    cfgRef.current = cfg
  }, [cfg])

  useEffect(() => {
    setBotTokenDraft(cfg?.discordBotToken || "")
    setUserAllowlistDraft(formatConfigListInput(cfg?.discordAllowUserIds, { separator: "newline" }))
    setGuildAllowlistDraft(formatConfigListInput(cfg?.discordAllowGuildIds, { separator: "newline" }))
    setChannelAllowlistDraft(formatConfigListInput(cfg?.discordAllowChannelIds, { separator: "newline" }))
  }, [cfg?.discordBotToken, cfg?.discordAllowUserIds, cfg?.discordAllowGuildIds, cfg?.discordAllowChannelIds])

  // Pure: returns the merged config without touching `cfgRef.current`. The
  // ref is only advanced AFTER the save mutation actually succeeds, so an
  // in-flight or failed save can never make `cfgRef.current` look like a
  // pending change is already persisted. Without this, `handleConnect()`
  // could compare a pasted token against the optimistic ref value, skip
  // `saveConfigAsync`, and call `discordConnect()` while the main process
  // still had the old `discordBotToken`.
  const mergeConfig = useCallback((partial: Partial<Config>) => {
    if (!cfgRef.current) return null
    return { ...cfgRef.current, ...partial }
  }, [])

  const saveConfig = useCallback((partial: Partial<Config>) => {
    const nextConfig = mergeConfig(partial)
    if (!nextConfig) return
    saveConfigMutation.mutate(
      { config: nextConfig },
      {
        onSuccess: () => {
          cfgRef.current = nextConfig
        },
      },
    )
  }, [mergeConfig, saveConfigMutation])

  const saveConfigAsync = useCallback(async (partial: Partial<Config>) => {
    const nextConfig = mergeConfig(partial)
    if (!nextConfig) return
    await saveConfigMutation.mutateAsync({ config: nextConfig })
    // Only advance the ref after the mutation resolves successfully. If the
    // mutation throws, the await above re-throws and we never reach here.
    cfgRef.current = nextConfig
  }, [mergeConfig, saveConfigMutation])

  const fetchStatus = useCallback(async () => {
    try {
      const [nextStatus, nextLogs, nextProfiles] = await Promise.all([
        tipcClient.discordGetStatus(),
        tipcClient.discordGetLogs(),
        tipcClient.getAgentProfiles(),
      ])
      setStatus(nextStatus as DiscordStatus)
      setLogs((nextLogs as DiscordLogEntry[]).slice().reverse())
      setProfiles((nextProfiles as AgentProfile[]).filter((profile) => profile.enabled !== false && (profile.role === "chat-agent" || profile.role === "user-profile" || profile.isUserProfile)))
      setStatusError(null)
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : String(error))
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
    const interval = setInterval(() => {
      void fetchStatus()
    }, 4000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleConnect = useCallback(async () => {
    setStatusError(null)
    const trimmedToken = botTokenDraft.trim()

    if (trimmedToken !== (cfgRef.current?.discordBotToken || "")) {
      try {
        await saveConfigAsync({ discordBotToken: trimmedToken })
      } catch (error) {
        setStatusError(error instanceof Error ? error.message : String(error))
        await fetchStatus()
        return
      }
    }

    const result = await tipcClient.discordConnect()
    if (!result.success) {
      setStatusError(result.error || "Failed to connect Discord")
    }
    await fetchStatus()
  }, [botTokenDraft, fetchStatus, saveConfigAsync])

  const handleDisconnect = useCallback(async () => {
    setStatusError(null)
    const result = await tipcClient.discordDisconnect()
    if (!result.success) {
      setStatusError(result.error || "Failed to disconnect Discord")
    }
    await fetchStatus()
  }, [fetchStatus])

  if (!cfg) return null

  const enabled = cfg.discordEnabled ?? DEFAULT_DISCORD_ENABLED
  const unavailable = status?.available === false
  const statusMessage = statusError || status?.lastError

  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-6 py-4">
      <div className="grid gap-4">
        <ControlGroup
          title="Discord Integration"
          endDescription={(
            <div className="break-words whitespace-normal">
              Connect a Discord bot so DMs, mentions, and threads can talk to a selected DotAgents profile.
            </div>
          )}
        >
          <Control label="Enable Discord" className="px-3">
            <Switch
              checked={enabled}
              onCheckedChange={(value) => saveConfig({ discordEnabled: value })}
            />
          </Control>
        </ControlGroup>

        <ControlGroup title="Connection">
          <Control label="Bot token" className="px-3">
            <Input
              type="password"
              value={botTokenDraft}
              placeholder="Paste your Discord bot token"
              onChange={(event) => setBotTokenDraft(event.target.value)}
              onBlur={() => saveConfig({ discordBotToken: botTokenDraft.trim() })}
            />
          </Control>

          <div className="px-3 py-1 text-sm text-muted-foreground">
            Discord needs the bot token plus the Message Content intent enabled in the Discord developer portal.
          </div>

          <div className="px-3 pb-3">
            <div className="mb-3 flex items-center gap-2 text-sm">
              {unavailable ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">Discord support unavailable</span>
                </>
              ) : status?.connected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">
                    Connected as {status.botUsername || "unknown bot"}{status.botId ? ` (${status.botId})` : ""}
                  </span>
                </>
              ) : status?.connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span>Connecting…</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Not connected</span>
                </>
              )}
            </div>

            {statusMessage && (
              <div className="mb-3 flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>{statusMessage}</div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleConnect()} disabled={!enabled || unavailable}>Connect</Button>
              <Button variant="outline" onClick={() => void handleDisconnect()} disabled={!enabled || unavailable}>Disconnect</Button>
              <Button variant="ghost" size="icon" onClick={() => void fetchStatus()} aria-label="Refresh Discord status">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ControlGroup>

        <ControlGroup title="Routing & Access">
          <Control label="Default profile" className="px-3">
            <Select
              value={cfg.discordDefaultProfileId || "__none__"}
              onValueChange={(value) => saveConfig({ discordDefaultProfileId: value === "__none__" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No profile selected</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>{profile.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Control>

          <Control label="Allow direct messages" className="px-3">
            <Switch
              checked={cfg.discordDmEnabled ?? DEFAULT_DISCORD_DM_ENABLED}
              onCheckedChange={(value) => saveConfig({ discordDmEnabled: value })}
            />
          </Control>

          <Control label="Require mention in servers" className="px-3">
            <Switch
              checked={cfg.discordRequireMention ?? DEFAULT_DISCORD_REQUIRE_MENTION}
              onCheckedChange={(value) => saveConfig({ discordRequireMention: value })}
            />
          </Control>

          <div className="mx-3 rounded-md border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-xs text-muted-foreground">
            💡 <span className="font-medium">You usually don't need to fill these in.</span> The Discord
            bot's <span className="font-medium">application owner</span> (or Team members, for
            Team‑owned apps) is automatically trusted — no IDs required. To grant a friend read‑only
            access, DM the bot <code className="rounded bg-muted px-1">/dm allow @user</code> — it uses
            Discord's native user picker. Any user can also run{" "}
            <code className="rounded bg-muted px-1">/whoami</code> in Discord to see their own ID if
            you prefer to paste it here manually. Mutating commands like{" "}
            <code className="rounded bg-muted px-1">/dm allow</code> remain restricted to the
            application owner.
          </div>

          <Control label="Allowed user IDs" className="px-3">
            <Textarea
              rows={3}
              value={userAllowlistDraft}
              placeholder="One Discord user ID per line"
              onChange={(event) => setUserAllowlistDraft(event.target.value)}
              onBlur={() => saveConfig({ discordAllowUserIds: parseConfigListInput(userAllowlistDraft) })}
            />
          </Control>

          <Control label="Allowed server IDs" className="px-3">
            <Textarea
              rows={3}
              value={guildAllowlistDraft}
              placeholder="One Discord server ID per line"
              onChange={(event) => setGuildAllowlistDraft(event.target.value)}
              onBlur={() => saveConfig({ discordAllowGuildIds: parseConfigListInput(guildAllowlistDraft) })}
            />
          </Control>

          <Control label="Allowed channel IDs" className="px-3">
            <Textarea
              rows={3}
              value={channelAllowlistDraft}
              placeholder="One Discord channel or thread ID per line"
              onChange={(event) => setChannelAllowlistDraft(event.target.value)}
              onBlur={() => saveConfig({ discordAllowChannelIds: parseConfigListInput(channelAllowlistDraft) })}
            />
          </Control>

          <Control label="Log message content" className="px-3">
            <Switch
              checked={cfg.discordLogMessages ?? DEFAULT_DISCORD_LOG_MESSAGES}
              onCheckedChange={(value) => saveConfig({ discordLogMessages: value })}
            />
          </Control>
        </ControlGroup>

        <ControlGroup title="Recent Logs">
          <div className="flex items-center justify-between px-3 pt-2">
            <div className="text-sm text-muted-foreground">Most recent Discord events and errors.</div>
            <Button variant="ghost" size="sm" onClick={() => void tipcClient.discordClearLogs().then(() => fetchStatus())}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear logs
            </Button>
          </div>

          <div className="space-y-2 px-3 pb-3">
            {logs.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No Discord logs yet.</div>
            ) : logs.map((entry) => (
              <div key={entry.id} className="rounded-md border p-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="font-medium uppercase text-muted-foreground">{entry.level}</span>
                  <span className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <div className="break-words whitespace-pre-wrap">{entry.message}</div>
              </div>
            ))}
          </div>
        </ControlGroup>
      </div>
    </div>
  )
}
