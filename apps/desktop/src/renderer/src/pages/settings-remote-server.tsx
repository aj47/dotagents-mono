import { useCallback, useMemo } from "react"
import { Control, ControlGroup, ControlLabel } from "@renderer/components/ui/control"
import { Switch } from "@renderer/components/ui/switch"
import { Input } from "@renderer/components/ui/input"
import { Button } from "@renderer/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/query-client"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { tipcClient } from "@renderer/lib/tipc-client"
import type { Config } from "@shared/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { QRCodeSVG } from "qrcode.react"
import { EyeOff, ExternalLink } from "lucide-react"
import {
  buildDotAgentsConfigDeepLink,
  buildRemoteServerBaseUrl,
  DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START,
  CLOUDFLARE_TUNNEL_MODE_OPTIONS,
  DEFAULT_CLOUDFLARE_TUNNEL_MODE,
  DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL,
  DEFAULT_REMOTE_SERVER_CORS_ORIGINS,
  DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
  DEFAULT_REMOTE_SERVER_ENABLED,
  DEFAULT_REMOTE_SERVER_PORT,
  DEFAULT_REMOTE_SERVER_LOG_LEVEL,
  DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED,
  isLoopbackRemoteHost,
  isUnconnectableRemoteHostForMobilePairing,
  isWildcardRemoteHost,
  REMOTE_SERVER_PORT_MAX,
  REMOTE_SERVER_PORT_MIN,
  REMOTE_SERVER_BIND_ADDRESS_OPTIONS,
  REMOTE_SERVER_LOG_LEVEL_OPTIONS,
  type CloudflareTunnelMode,
  type RemoteServerBindAddress,
  type RemoteServerLogLevel,
} from "@dotagents/shared/remote-pairing"

/**
 * Mask a URL for streamer mode - masks all alphanumeric content (including the protocol)
 * while preserving URL structure characters (://, ., /, :)
 */
function maskUrl(url: string): string {
  if (!url) return "https://***.***.***.***:****/v1"
  // Replace the sensitive parts with asterisks while preserving structure
  return url.replace(/([a-zA-Z0-9-]+)/g, (match) => "*".repeat(Math.min(match.length, 8)))
}

interface RemoteServerSettingsGroupsProps {
  collapsible?: boolean
  defaultCollapsed?: boolean
  forceOpen?: boolean
}

export function RemoteServerSettingsGroups({
  collapsible = false,
  defaultCollapsed = false,
  forceOpen,
}: RemoteServerSettingsGroupsProps = {}) {
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const queryClient = useQueryClient()

  const cfg = configQuery.data as Config | undefined

  const saveConfig = useCallback(
    (partial: Partial<Config>) => {
      if (!cfg) return
      saveConfigMutation.mutate({ config: { ...cfg, ...partial } })
    },
    [cfg, saveConfigMutation],
  )

  const saveConfigAsync = useCallback(
    async (partial: Partial<Config>) => {
      if (!cfg) return
      await saveConfigMutation.mutateAsync({ config: { ...cfg, ...partial } })
    },
    [cfg, saveConfigMutation],
  )

  // Cloudflare Tunnel queries and mutations
  const cloudflaredInstalledQuery = useQuery({
    queryKey: ["cloudflared-installed"],
    queryFn: () => tipcClient.checkCloudflaredInstalled(),
    staleTime: 60000, // Check once per minute
  })

  const cloudflaredLoggedInQuery = useQuery({
    queryKey: ["cloudflared-logged-in"],
    queryFn: () => tipcClient.checkCloudflaredLoggedIn(),
    staleTime: 60000, // Check once per minute
    enabled: cfg?.remoteServerEnabled && cfg?.cloudflareTunnelMode === "named",
  })

  const tunnelListQuery = useQuery({
    queryKey: ["cloudflare-tunnel-list"],
    queryFn: () => tipcClient.listCloudflareTunnels(),
    staleTime: 60000, // Refresh once per minute
    enabled: cfg?.remoteServerEnabled && cfg?.cloudflareTunnelMode === "named" && (cloudflaredLoggedInQuery.data ?? false),
  })

  const tunnelStatusQuery = useQuery({
    queryKey: ["cloudflare-tunnel-status"],
    queryFn: () => tipcClient.getCloudflareTunnelStatus(),
    refetchInterval: 2000, // Poll every 2 seconds when tunnel is active
    enabled: cfg?.remoteServerEnabled ?? DEFAULT_REMOTE_SERVER_ENABLED,
  })

  const remoteServerStatusQuery = useQuery({
    queryKey: ["remote-server-status"],
    queryFn: () => tipcClient.getRemoteServerStatus(),
    refetchInterval: 2000,
    enabled: cfg?.remoteServerEnabled ?? DEFAULT_REMOTE_SERVER_ENABLED,
  })

  const remoteServerPairingApiKeyQuery = useQuery({
    queryKey: ["remote-server-pairing-api-key", cfg?.remoteServerApiKey, cfg?.streamerModeEnabled],
    queryFn: () => tipcClient.getRemoteServerPairingApiKey(),
    enabled: !!cfg?.remoteServerApiKey && !(cfg?.streamerModeEnabled ?? false),
  })

  const startTunnelMutation = useMutation({
    mutationFn: () => tipcClient.startCloudflareTunnel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloudflare-tunnel-status"] })
    },
  })

  const startNamedTunnelMutation = useMutation({
    mutationFn: (params: { tunnelId: string; hostname: string; credentialsPath?: string }) =>
      tipcClient.startNamedCloudflareTunnel(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloudflare-tunnel-status"] })
    },
  })

  const stopTunnelMutation = useMutation({
    mutationFn: () => tipcClient.stopCloudflareTunnel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloudflare-tunnel-status"] })
    },
  })

  const tunnelStatus = tunnelStatusQuery.data
  const remoteServerStatus = remoteServerStatusQuery.data
  const isCloudflaredInstalled = cloudflaredInstalledQuery.data ?? false
  const isCloudflaredLoggedIn = cloudflaredLoggedInQuery.data ?? false
  const tunnelList: Array<{ id: string; name: string; created_at: string }> = tunnelListQuery.data?.tunnels ?? []
  const tunnelMode = cfg?.cloudflareTunnelMode ?? DEFAULT_CLOUDFLARE_TUNNEL_MODE

  const bindOptions: Array<{ label: string; value: RemoteServerBindAddress }> = useMemo(
    () => REMOTE_SERVER_BIND_ADDRESS_OPTIONS.map((value) => ({
      label: value === DEFAULT_REMOTE_SERVER_BIND_ADDRESS ? `Localhost (${value})` : `All Interfaces (${value})`,
      value,
    })),
    [],
  )

  if (!cfg) return null

  const enabled = cfg.remoteServerEnabled ?? DEFAULT_REMOTE_SERVER_ENABLED
  const streamerMode = cfg.streamerModeEnabled ?? false
  const remoteServerPairingApiKey = typeof remoteServerPairingApiKeyQuery.data === "string"
    ? remoteServerPairingApiKeyQuery.data
    : ""
  const hasRemoteServerApiKey = remoteServerPairingApiKey.length > 0
  const hasConfiguredRemoteServerApiKey = (cfg.remoteServerApiKey ?? "").trim().length > 0
  const shouldShowPairingSurface = streamerMode ? hasConfiguredRemoteServerApiKey : hasRemoteServerApiKey
  const configuredBindAddress = cfg.remoteServerBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS
  const isRemoteServerRunning = enabled && (remoteServerStatus?.running ?? false)

  const fallbackBaseUrl = !isUnconnectableRemoteHostForMobilePairing(configuredBindAddress) &&
    cfg.remoteServerPort
      ? buildRemoteServerBaseUrl(configuredBindAddress, cfg.remoteServerPort)
      : undefined

  const liveConnectableUrl = isRemoteServerRunning
    ? remoteServerStatus?.connectableUrl
    : undefined
  const baseUrl = liveConnectableUrl ?? fallbackBaseUrl
  const pairingDeepLink = baseUrl
    ? buildDotAgentsConfigDeepLink({ baseUrl, apiKey: remoteServerPairingApiKey })
    : ""
  const shouldShowConnectabilityWarning =
    isRemoteServerRunning &&
    isUnconnectableRemoteHostForMobilePairing(configuredBindAddress) &&
    !liveConnectableUrl
  const showConnectableUrlResolutionWarning =
    shouldShowConnectabilityWarning && isWildcardRemoteHost(configuredBindAddress)
  const showLoopbackBindWarning =
    shouldShowConnectabilityWarning && isLoopbackRemoteHost(configuredBindAddress)

  return (
    <>
        <ControlGroup
          collapsible={collapsible}
          defaultCollapsed={defaultCollapsed}
          forceOpen={forceOpen}
          title="Remote Server"
          endDescription={(
            <div className="break-words whitespace-normal">
              Expose DotAgents as an OpenAI-compatible <span className="font-mono">/v1</span>{" "}
              endpoint for the{" "}
              <a
                href="https://github.com/aj47/DotAgentsMobile"
                target="_blank"
                rel="noreferrer noopener"
                className="underline"
              >
                DotAgents Mobile app
              </a>{" "}
              and other clients.
            </div>
          )}
        >
          <Control label="Enable Remote Server" className="px-3">
            <Switch
              checked={enabled}
              onCheckedChange={(value) => {
                saveConfig({ remoteServerEnabled: value })
              }}
            />
          </Control>

          {enabled && (
            <>
              <Control label={<ControlLabel label="Auto-Show Panel" tooltip="Automatically show the floating panel when receiving messages from remote clients" />} className="px-3">
                <Switch
                  checked={cfg.remoteServerAutoShowPanel ?? DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL}
                  onCheckedChange={(value) => {
                    saveConfig({ remoteServerAutoShowPanel: value })
                  }}
                />
              </Control>

              <Control label={<ControlLabel label="Terminal QR Code" tooltip="Print QR code to terminal on server start (auto-enabled in headless environments)" />} className="px-3">
                <Switch
                  checked={cfg.remoteServerTerminalQrEnabled ?? DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED}
                  onCheckedChange={(value) => {
                    saveConfig({ remoteServerTerminalQrEnabled: value })
                  }}
                />
              </Control>

              <Control label={<ControlLabel label="Port" tooltip="HTTP port to listen on" />} className="px-3">
                <Input
                  type="number"
                  min={REMOTE_SERVER_PORT_MIN}
                  max={REMOTE_SERVER_PORT_MAX}
                  value={cfg.remoteServerPort ?? DEFAULT_REMOTE_SERVER_PORT}
                  onChange={(e) =>
                    saveConfig({ remoteServerPort: parseInt(e.currentTarget.value || String(DEFAULT_REMOTE_SERVER_PORT), 10) })
                  }
                  className="w-36"
                />
              </Control>

              <Control label={<ControlLabel label="Bind Address" tooltip="127.0.0.1 for local-only access; 0.0.0.0 to allow LAN access (requires API key)" />} className="px-3">
                <Select
                  value={cfg.remoteServerBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS}
                  onValueChange={(value: RemoteServerBindAddress) =>
                    saveConfig({ remoteServerBindAddress: value })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bindOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cfg.remoteServerBindAddress === "0.0.0.0" && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Warning: Exposes the server on your local network. Keep your API key secure.
                  </div>
                )}
              </Control>

              <Control label={<ControlLabel label="API Key" tooltip="Bearer token required in Authorization header" />} className="px-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input type="password" value={cfg.remoteServerApiKey ? "••••••••" : ""} readOnly className="w-full sm:w-[360px] max-w-full min-w-0" />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={streamerMode || !hasRemoteServerApiKey}
                    title={streamerMode ? "Disabled in Streamer Mode" : !hasRemoteServerApiKey ? "API key unavailable" : undefined}
                    onClick={() => {
                      if (!remoteServerPairingApiKey || streamerMode) return
                      void copyTextToClipboard(remoteServerPairingApiKey).catch((err) => {
                        console.error("Failed to copy remote server API key", err)
                      })
                    }}
                  >
                    {streamerMode ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Hidden</> : "Copy"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      // Generate a new 32-byte API key (hex)
                      const bytes = new Uint8Array(32)
                      window.crypto.getRandomValues(bytes)
                      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
                      await saveConfigAsync({ remoteServerApiKey: hex })
                      await Promise.all([
                        configQuery.refetch(),
                        remoteServerPairingApiKeyQuery.refetch(),
                      ])
                    }}
                  >
                    Regenerate
                  </Button>
                </div>
                {streamerMode && (
                  <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Copy disabled in Streamer Mode
                  </div>
                )}
              </Control>

              <Control label={<ControlLabel label="Log Level" tooltip="Fastify logger level" />} className="px-3">
                <Select
                  value={cfg.remoteServerLogLevel || DEFAULT_REMOTE_SERVER_LOG_LEVEL}
                  onValueChange={(value: RemoteServerLogLevel) => saveConfig({ remoteServerLogLevel: value })}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMOTE_SERVER_LOG_LEVEL_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Control>

              <Control label={<ControlLabel label="CORS Origins" tooltip="Allowed origins for CORS requests. Use * for all origins (development), or specify comma-separated URLs like http://localhost:8081" />} className="px-3">
                <Input
                  type="text"
                  value={(cfg.remoteServerCorsOrigins || DEFAULT_REMOTE_SERVER_CORS_ORIGINS).join(", ")}
                  onChange={(e) => {
                    const origins = e.currentTarget.value
                      .split(",")
                      .map(s => s.trim())
                      .filter(Boolean)
                    saveConfig({ remoteServerCorsOrigins: origins.length > 0 ? origins : [...DEFAULT_REMOTE_SERVER_CORS_ORIGINS] })
                  }}
                  placeholder="* or http://localhost:8081, http://example.com"
                  className="w-full"
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Use * for development or specify allowed origins separated by commas
                </div>
              </Control>

              {(baseUrl || showConnectableUrlResolutionWarning || showLoopbackBindWarning) && (
                <>
                  <Control label="Base URL" className="px-3">
                    {baseUrl ? (
                      <div className="text-sm text-muted-foreground select-text break-all">
                        {streamerMode ? maskUrl(baseUrl) : baseUrl}
                      </div>
                    ) : (
                      <div className="text-sm text-amber-700 dark:text-amber-300 break-words">
                        Unable to resolve a LAN-reachable URL for the current bind address.
                      </div>
                    )}
                    {streamerMode && baseUrl && (
                      <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        URL masked in Streamer Mode
                      </div>
                    )}
                    {showConnectableUrlResolutionWarning && (
                      <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 break-words">
                        The server is running, but no LAN-reachable address was detected for wildcard bind (0.0.0.0/::). Connect to a local network or use a specific LAN IP/host to enable mobile pairing.
                      </div>
                    )}
                    {showLoopbackBindWarning && (
                      <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 break-words">
                        The server is running on loopback ({configuredBindAddress}), which is only reachable from this computer. Use 0.0.0.0 or a LAN IP to enable mobile pairing.
                      </div>
                    )}
                  </Control>

                  {baseUrl && shouldShowPairingSurface && (
                    <Control label={<ControlLabel label="Mobile App QR Code" tooltip="Scan this QR code with the DotAgents mobile app to connect (local network only)" />} className="px-3">
                      <div className="flex flex-col items-start gap-3">
                        {streamerMode ? (
                          <div className="p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center" style={{ width: 160, height: 160 }}>
                            <EyeOff className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground text-center">QR hidden<br />Streamer Mode</span>
                          </div>
                        ) : (
                          <div className="p-3 bg-white rounded-lg">
                            <QRCodeSVG
                              value={pairingDeepLink}
                              size={160}
                              level="M"
                            />
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={streamerMode || !hasRemoteServerApiKey}
                            title={streamerMode ? "Disabled in Streamer Mode" : !hasRemoteServerApiKey ? "API key unavailable" : undefined}
                            onClick={() => {
                              if (streamerMode || !remoteServerPairingApiKey) return
                              void copyTextToClipboard(pairingDeepLink).catch((err) => {
                                console.error("Failed to copy deep link", err)
                              })
                            }}
                          >
                            {streamerMode ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Hidden</> : "Copy Deep Link"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={streamerMode}
                            title={streamerMode ? "Disabled in Streamer Mode" : "Print QR code to terminal (useful for SSH/headless access)"}
                            onClick={() => {
                              if (streamerMode) return
                              tipcClient.printRemoteServerQRCode()
                            }}
                          >
                            Print to Terminal
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {streamerMode
                            ? "QR code and deep link hidden in Streamer Mode"
                            : "Scan with the DotAgents mobile app to auto-configure. Works on local network only. Use 'Print to Terminal' for SSH/headless access. For internet access, use Cloudflare Tunnel below."}
                        </div>
                      </div>
                    </Control>
                  )}
                </>
              )}
            </>
          )}
        </ControlGroup>

        {/* Cloudflare Tunnel Section - only show when remote server is enabled */}
        {enabled && (
          <ControlGroup
            collapsible={collapsible}
            defaultCollapsed={defaultCollapsed}
            forceOpen={forceOpen}
            title="Cloudflare Tunnel"
            endDescription={(
              <div className="break-words whitespace-normal">
                Optional internet access for the remote server. Quick tunnels use random
                URLs; named tunnels keep a{" "}
                <a
                  href="https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline"
                >
                  persistent URL
                </a>.
              </div>
            )}
          >
            {!isCloudflaredInstalled ? (
              <div className="px-3 py-2">
                <div className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                  cloudflared is not installed. Please install it to use Cloudflare Tunnel.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/", "_blank")}
                >
                  Download cloudflared
                </Button>
              </div>
            ) : (
              <>
                <Control label={<ControlLabel label="Tunnel Mode" tooltip="Quick tunnels are easy but have random URLs. Named tunnels require setup but have persistent URLs." />} className="px-3">
                  <Select
                    value={tunnelMode}
                    onValueChange={(value: CloudflareTunnelMode) => {
                      // Stop any running tunnel when switching modes
                      if (tunnelStatus?.running) {
                        stopTunnelMutation.mutate()
                      }
                      saveConfig({ cloudflareTunnelMode: value })
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLOUDFLARE_TUNNEL_MODE_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value === DEFAULT_CLOUDFLARE_TUNNEL_MODE ? "Quick Tunnel (Random URL)" : "Named Tunnel (Persistent)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Control>

                <Control label={<ControlLabel label="Auto-Start Tunnel" tooltip="Automatically start the Cloudflare Tunnel when the application launches (requires Remote Server to be enabled)" />} className="px-3">
                  <Switch
                    checked={cfg?.cloudflareTunnelAutoStart ?? DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START}
                    onCheckedChange={(value) => {
                      saveConfig({ cloudflareTunnelAutoStart: value })
                    }}
                  />
                </Control>

                {/* Named Tunnel Configuration */}
                {tunnelMode === "named" && (
                  <>
                    {!isCloudflaredLoggedIn ? (
                      <div className="px-3 py-2">
                        <div className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                          You need to authenticate with Cloudflare first. Run <code className="bg-muted px-1 rounded">cloudflared tunnel login</code> in your terminal.
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open("https://developers.cloudflare.com/load-balancing/private-network/public-to-tunnel/#1-configure-a-cloudflare-tunnel-with-an-assigned-virtual-network", "_blank")}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Setup Guide
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Control label={<ControlLabel label="Tunnel ID" tooltip="The UUID of your named tunnel. Find it with 'cloudflared tunnel list'" />} className="px-3">
                          <div className="flex flex-col gap-2">
                            <Input
                              type="text"
                              value={cfg?.cloudflareTunnelId ?? ""}
                              onChange={(e) => saveConfig({ cloudflareTunnelId: e.currentTarget.value })}
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                              className="w-full sm:w-[360px] max-w-full min-w-0 font-mono text-xs"
                            />
                            {tunnelList.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Available tunnels: {tunnelList.map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    className="underline cursor-pointer ml-1 hover:text-foreground"
                                    onClick={() => saveConfig({
                                      cloudflareTunnelId: t.id,
                                      cloudflareTunnelName: t.name,
                                    })}
                                  >
                                    {t.name}
                                  </button>
                                )).reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ", ", el]), [])}
                              </div>
                            )}
                          </div>
                        </Control>

                        <Control label={<ControlLabel label="Hostname" tooltip="The public hostname for your tunnel (e.g., myapp.example.com). Must be configured in Cloudflare DNS." />} className="px-3">
                          <Input
                            type="text"
                            value={cfg?.cloudflareTunnelHostname ?? ""}
                            onChange={(e) => saveConfig({ cloudflareTunnelHostname: e.currentTarget.value })}
                            placeholder="myapp.example.com"
                            className="w-full sm:w-[300px] max-w-full min-w-0"
                          />
                        </Control>

                        <Control label={<ControlLabel label="Credentials Path" tooltip="Path to credentials JSON file. Leave empty to use default (~/.cloudflared/<tunnel-id>.json)" />} className="px-3">
                          <Input
                            type="text"
                            value={cfg?.cloudflareTunnelCredentialsPath ?? ""}
                            onChange={(e) => saveConfig({ cloudflareTunnelCredentialsPath: e.currentTarget.value })}
                            placeholder="~/.cloudflared/<tunnel-id>.json (default)"
                            className="w-full sm:w-[360px] max-w-full min-w-0 font-mono text-xs"
                          />
                        </Control>
                      </>
                    )}
                  </>
                )}

                <Control label="Tunnel Status" className="px-3">
                  <div className="flex items-center gap-2">
                    {tunnelStatus?.starting ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">Starting...</span>
                      </>
                    ) : tunnelStatus?.running ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Connected {tunnelStatus.mode === "named" ? "(Named)" : "(Quick)"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-sm text-muted-foreground">Not running</span>
                      </>
                    )}
                  </div>
                </Control>

                <Control label="Actions" className="px-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {!tunnelStatus?.running && !tunnelStatus?.starting ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          if (tunnelMode === "named") {
                            if (!cfg?.cloudflareTunnelId || !cfg?.cloudflareTunnelHostname) {
                              return // Validation handled in UI
                            }
                            startNamedTunnelMutation.mutate({
                              tunnelId: cfg.cloudflareTunnelId,
                              hostname: cfg.cloudflareTunnelHostname,
                              credentialsPath: cfg.cloudflareTunnelCredentialsPath || undefined,
                            })
                          } else {
                            startTunnelMutation.mutate()
                          }
                        }}
                        disabled={
                          startTunnelMutation.isPending ||
                          startNamedTunnelMutation.isPending ||
                          (tunnelMode === "named" && (!cfg?.cloudflareTunnelId || !cfg?.cloudflareTunnelHostname))
                        }
                      >
                        {startTunnelMutation.isPending || startNamedTunnelMutation.isPending
                          ? "Starting..."
                          : "Start Tunnel"}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => stopTunnelMutation.mutate()}
                        disabled={stopTunnelMutation.isPending || tunnelStatus?.starting}
                      >
                        {stopTunnelMutation.isPending ? "Stopping..." : "Stop Tunnel"}
                      </Button>
                    )}
                    {tunnelMode === "named" && !cfg?.cloudflareTunnelId && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Enter Tunnel ID to start
                      </span>
                    )}
                    {tunnelMode === "named" && cfg?.cloudflareTunnelId && !cfg?.cloudflareTunnelHostname && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Enter Hostname to start
                      </span>
                    )}
                  </div>
                </Control>

                {tunnelStatus?.url && tunnelStatus?.running && (
                  <>
                    <Control label={<ControlLabel label="Public URL" tooltip="Use this URL to access your remote server from anywhere" />} className="px-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type={streamerMode ? "password" : "text"}
                          value={streamerMode ? "••••••••••••••••••••" : `${tunnelStatus.url}/v1`}
                          readOnly
                          className="w-full sm:w-[360px] max-w-full min-w-0 font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={streamerMode}
                          title={streamerMode ? "Disabled in Streamer Mode" : undefined}
                          onClick={() => {
                            if (streamerMode) return
                            void copyTextToClipboard(`${tunnelStatus.url}/v1`).catch((err) => {
                              console.error("Failed to copy tunnel URL", err)
                            })
                          }}
                        >
                          {streamerMode ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Hidden</> : "Copy"}
                        </Button>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {streamerMode
                          ? <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><EyeOff className="h-3 w-3" />URL hidden in Streamer Mode</span>
                          : tunnelStatus.mode === "named"
                            ? "This URL is persistent and will remain the same across restarts."
                            : "This URL is temporary and will change when you restart the tunnel."}
                      </div>
                    </Control>

                    {shouldShowPairingSurface && (
                      <Control label={<ControlLabel label="Mobile App QR Code" tooltip="Scan this QR code with the DotAgents mobile app to connect" />} className="px-3">
                        <div className="flex flex-col items-start gap-3">
                          {streamerMode ? (
                            <div className="p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center" style={{ width: 160, height: 160 }}>
                              <EyeOff className="h-8 w-8 text-muted-foreground mb-2" />
                              <span className="text-xs text-muted-foreground text-center">QR hidden<br />Streamer Mode</span>
                            </div>
                          ) : (
                            <div className="p-3 bg-white rounded-lg">
                              <QRCodeSVG
                                value={buildDotAgentsConfigDeepLink({ baseUrl: `${tunnelStatus.url}/v1`, apiKey: remoteServerPairingApiKey })}
                                size={160}
                                level="M"
                              />
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={streamerMode || !hasRemoteServerApiKey}
                              title={streamerMode ? "Disabled in Streamer Mode" : !hasRemoteServerApiKey ? "API key unavailable" : undefined}
                              onClick={() => {
                                if (streamerMode || !remoteServerPairingApiKey) return
                                void copyTextToClipboard(buildDotAgentsConfigDeepLink({ baseUrl: `${tunnelStatus.url}/v1`, apiKey: remoteServerPairingApiKey })).catch((err) => {
                                  console.error("Failed to copy tunnel deep link", err)
                                })
                              }}
                            >
                              {streamerMode ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Hidden</> : "Copy Deep Link"}
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {streamerMode
                              ? "QR code and deep link hidden in Streamer Mode"
                              : "Scan with the DotAgents mobile app to auto-configure the connection."}
                          </div>
                        </div>
                      </Control>
                    )}
                  </>
                )}

                {tunnelStatus?.error && (
                  <div className="px-3 py-2">
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Error: {tunnelStatus.error}
                    </div>
                  </div>
                )}
              </>
            )}
          </ControlGroup>
        )}
    </>
  )
}

export function Component() {
  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
      <div className="grid gap-4">
        <RemoteServerSettingsGroups />
      </div>
    </div>
  )
}
