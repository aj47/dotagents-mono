import { useCallback, useMemo } from "react"
import {
  Control,
  ControlGroup,
  ControlLabel,
} from "@renderer/components/ui/control"
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
import {
  useConfigQuery,
  useSaveConfigMutation,
} from "@renderer/lib/query-client"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { tipcClient } from "@renderer/lib/tipc-client"
import type { Config } from "@shared/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { QRCodeSVG } from "qrcode.react"
import { EyeOff, ExternalLink, RotateCcw } from "lucide-react"

/**
 * Mask a URL for streamer mode - masks all alphanumeric content (including the protocol)
 * while preserving URL structure characters (://, ., /, :)
 */
function maskUrl(url: string): string {
  if (!url) return "https://***.***.***.***:****/v1"
  // Replace the sensitive parts with asterisks while preserving structure
  return url.replace(/([a-zA-Z0-9-]+)/g, (match) =>
    "*".repeat(Math.min(match.length, 8)),
  )
}

function normalizeHostForComparison(host: string): string {
  const normalized = host.trim().toLowerCase()
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    return normalized.slice(1, -1)
  }
  return normalized
}

function isWildcardMobileHost(host: string): boolean {
  const normalizedHost = normalizeHostForComparison(host)
  return normalizedHost === "0.0.0.0" || normalizedHost === "::"
}

function isLoopbackMobileHost(host: string): boolean {
  const normalizedHost = normalizeHostForComparison(host)
  return (
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "localhost" ||
    normalizedHost === "::1"
  )
}

function isUnconnectableMobileHost(host: string): boolean {
  return isWildcardMobileHost(host) || isLoopbackMobileHost(host)
}

function formatHostForHttpUrl(host: string): string {
  const normalizedHost = host.trim()
  if (
    normalizedHost.includes(":") &&
    !normalizedHost.startsWith("[") &&
    !normalizedHost.endsWith("]")
  ) {
    return `[${normalizedHost}]`
  }
  return normalizedHost
}

function generateRemoteServerApiKey(): string {
  const bytes = new Uint8Array(32)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

interface RemoteServerSettingsGroupsProps {
  collapsible?: boolean
  defaultCollapsed?: boolean
  forceOpen?: boolean
  id?: string
}

export function RemoteServerSettingsGroups({
  collapsible = false,
  defaultCollapsed = false,
  forceOpen,
  id,
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
    enabled:
      cfg?.remoteServerEnabled &&
      cfg?.cloudflareTunnelMode === "named" &&
      (cloudflaredLoggedInQuery.data ?? false),
  })

  const tunnelStatusQuery = useQuery({
    queryKey: ["cloudflare-tunnel-status"],
    queryFn: () => tipcClient.getCloudflareTunnelStatus(),
    refetchInterval: 2000, // Poll every 2 seconds when tunnel is active
    enabled: cfg?.remoteServerEnabled ?? false,
  })

  const remoteServerStatusQuery = useQuery({
    queryKey: ["remote-server-status"],
    queryFn: () => tipcClient.getRemoteServerStatus(),
    refetchInterval: 2000,
    enabled: cfg?.remoteServerEnabled ?? false,
  })

  const remoteServerPairingApiKeyQuery = useQuery({
    queryKey: [
      "remote-server-pairing-api-key",
      cfg?.remoteServerApiKey,
      cfg?.streamerModeEnabled,
    ],
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
    mutationFn: (params: {
      tunnelId: string
      hostname: string
      credentialsPath?: string
    }) => tipcClient.startNamedCloudflareTunnel(params),
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
  const tunnelList: Array<{ id: string; name: string; created_at: string }> =
    tunnelListQuery.data?.tunnels ?? []
  const tunnelMode = cfg?.cloudflareTunnelMode ?? "quick"

  const bindOptions: Array<{ label: string; value: string }> = useMemo(() => {
    const options = [
      { label: "Localhost (127.0.0.1)", value: "127.0.0.1" },
      { label: "All Interfaces (0.0.0.0)", value: "0.0.0.0" },
    ]
    const tailscaleIpv4 = remoteServerStatus?.tailscale?.ipv4
    if (tailscaleIpv4) {
      options.push({
        label: `Tailscale (${tailscaleIpv4})`,
        value: tailscaleIpv4,
      })
    }
    return options
  }, [remoteServerStatus?.tailscale?.ipv4])

  if (!cfg) return null

  const enabled = cfg.remoteServerEnabled ?? false
  const streamerMode = cfg.streamerModeEnabled ?? false
  const remoteServerPairingApiKey =
    typeof remoteServerPairingApiKeyQuery.data === "string"
      ? remoteServerPairingApiKeyQuery.data
      : ""
  const hasRemoteServerApiKey = remoteServerPairingApiKey.length > 0
  const hasConfiguredRemoteServerApiKey =
    (cfg.remoteServerApiKey ?? "").trim().length > 0
  const shouldShowPairingSurface = streamerMode
    ? hasConfiguredRemoteServerApiKey
    : hasRemoteServerApiKey
  const configuredBindAddress = cfg.remoteServerBindAddress || "127.0.0.1"
  const configuredPort = cfg.remoteServerPort ?? 3210
  const isRemoteServerRunning =
    enabled && (remoteServerStatus?.running ?? false)

  const fallbackBaseUrl =
    !isUnconnectableMobileHost(configuredBindAddress) && configuredPort
      ? `http://${formatHostForHttpUrl(configuredBindAddress)}:${configuredPort}/v1`
      : undefined

  const liveConnectableUrl = isRemoteServerRunning
    ? remoteServerStatus?.connectableUrl
    : undefined
  const baseUrl = liveConnectableUrl ?? fallbackBaseUrl
  const localServerBaseUrl =
    baseUrl ??
    `http://${formatHostForHttpUrl(configuredBindAddress)}:${configuredPort}/v1`
  const tailscaleStatus = remoteServerStatus?.tailscale
  const easyPairingUrl = isRemoteServerRunning
    ? remoteServerStatus?.easyPairingUrl
    : undefined
  const easyPairingSource =
    remoteServerStatus?.easyPairingSource === "tailscale"
      ? "Tailscale"
      : remoteServerStatus?.easyPairingSource === "lan"
        ? "LAN"
        : tunnelStatus?.running && tunnelStatus.url
          ? "Cloudflare"
          : undefined
  const easyPairingBaseUrl =
    easyPairingUrl ??
    (tunnelStatus?.running && tunnelStatus.url
      ? `${tunnelStatus.url}/v1`
      : undefined)
  const easyPairingDeepLink =
    easyPairingBaseUrl && remoteServerPairingApiKey
      ? `dotagents://config?baseUrl=${encodeURIComponent(easyPairingBaseUrl)}&apiKey=${encodeURIComponent(remoteServerPairingApiKey)}`
      : undefined
  const isUsingTailscaleBind =
    !!tailscaleStatus?.ipv4 && configuredBindAddress === tailscaleStatus.ipv4
  const canUseTailscale =
    enabled && !!tailscaleStatus?.running && !!tailscaleStatus.ipv4
  const easyPairingStatusText = !enabled
    ? "Enable the remote server to pair mobile."
    : tailscaleStatus?.baseUrl
      ? isUsingTailscaleBind
        ? "Tailscale is active and the server is bound to your tailnet address."
        : "Tailscale is active. Bind to the Tailscale address for private mobile access."
      : tailscaleStatus?.error
        ? tailscaleStatus.error
        : easyPairingBaseUrl
          ? "Using the LAN-reachable URL for mobile pairing."
          : "No mobile-reachable URL is available yet."
  const shouldShowConnectabilityWarning =
    isRemoteServerRunning &&
    isUnconnectableMobileHost(configuredBindAddress) &&
    !liveConnectableUrl
  const showConnectableUrlResolutionWarning =
    shouldShowConnectabilityWarning &&
    isWildcardMobileHost(configuredBindAddress)
  const showLoopbackBindWarning =
    shouldShowConnectabilityWarning &&
    isLoopbackMobileHost(configuredBindAddress)

  return (
    <div id={id} className="grid gap-4">
      <ControlGroup
        id="remote-server"
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        forceOpen={forceOpen}
        title={
          <ControlLabel
            label="Remote Server"
            tooltip="Expose DotAgents as an OpenAI-compatible /v1 endpoint for the DotAgents Mobile app and other clients."
          />
        }
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
            <div className="px-3 py-3">
              <div className="mb-2">
                <ControlLabel
                  label="Easy Mobile Pairing"
                  tooltip="Scan one QR code with the DotAgents mobile app to connect."
                />
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-[144px_minmax(0,1fr)]">
                <div className="flex min-w-0 justify-start">
                  {streamerMode ? (
                    <div className="bg-muted/50 flex h-36 w-36 shrink-0 flex-col items-center justify-center rounded-lg p-3">
                      <EyeOff className="text-muted-foreground mb-2 h-7 w-7" />
                      <span className="text-muted-foreground text-center text-xs">
                        QR hidden
                        <br />
                        Streamer Mode
                      </span>
                    </div>
                  ) : easyPairingDeepLink ? (
                    <div className="shrink-0 rounded-lg bg-white p-2">
                      <QRCodeSVG
                        value={easyPairingDeepLink}
                        size={128}
                        level="M"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted/50 text-muted-foreground flex h-36 w-36 shrink-0 items-center justify-center rounded-lg p-3 text-center text-xs">
                      Pairing URL unavailable
                    </div>
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="text-sm font-medium">
                    {easyPairingSource
                      ? `${easyPairingSource} pairing`
                      : "Mobile pairing"}
                  </div>
                  <div className="text-muted-foreground break-all text-xs">
                    {streamerMode && easyPairingBaseUrl
                      ? maskUrl(easyPairingBaseUrl)
                      : (easyPairingBaseUrl ?? "No pairing URL available")}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {streamerMode
                      ? "QR code and link hidden in Streamer Mode"
                      : easyPairingStatusText}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!canUseTailscale || isUsingTailscaleBind}
                      title={
                        !canUseTailscale
                          ? "Tailscale is unavailable"
                          : isUsingTailscaleBind
                            ? "Already using Tailscale"
                            : undefined
                      }
                      onClick={() => {
                        if (!tailscaleStatus?.ipv4) return
                        saveConfig({
                          remoteServerBindAddress: tailscaleStatus.ipv4,
                        })
                      }}
                    >
                      {isUsingTailscaleBind
                        ? "Using Tailscale"
                        : "Use Tailscale"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={streamerMode || !easyPairingDeepLink}
                      title={
                        streamerMode
                          ? "Disabled in Streamer Mode"
                          : !easyPairingDeepLink
                            ? "Pairing link unavailable"
                            : undefined
                      }
                      onClick={() => {
                        if (streamerMode || !easyPairingDeepLink) return
                        void copyTextToClipboard(easyPairingDeepLink).catch(
                          (err) => {
                            console.error(
                              "Failed to copy easy pairing deep link",
                              err,
                            )
                          },
                        )
                      }}
                    >
                      {streamerMode ? (
                        <>
                          <EyeOff className="mr-1 h-3.5 w-3.5" />
                          Hidden
                        </>
                      ) : (
                        "Copy Link"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={streamerMode || !easyPairingBaseUrl}
                      title={
                        streamerMode
                          ? "Disabled in Streamer Mode"
                          : !easyPairingBaseUrl
                            ? "Pairing URL unavailable"
                            : "Print QR code to terminal"
                      }
                      onClick={() => {
                        if (streamerMode || !easyPairingBaseUrl) return
                        tipcClient.printRemoteServerQRCode({
                          url: easyPairingBaseUrl,
                        })
                      }}
                    >
                      Print QR
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Control
              label={
                <ControlLabel
                  label="Auto-Show Panel"
                  tooltip="Automatically show the floating panel when receiving messages from remote clients"
                />
              }
              className="px-3"
            >
              <Switch
                checked={cfg.remoteServerAutoShowPanel ?? false}
                onCheckedChange={(value) => {
                  saveConfig({ remoteServerAutoShowPanel: value })
                }}
              />
            </Control>

            <Control
              label={
                <ControlLabel
                  label="Terminal QR Code"
                  tooltip="Print QR code to terminal on server start (auto-enabled in headless environments)"
                />
              }
              className="px-3"
            >
              <Switch
                checked={cfg.remoteServerTerminalQrEnabled ?? false}
                onCheckedChange={(value) => {
                  saveConfig({ remoteServerTerminalQrEnabled: value })
                }}
              />
            </Control>

            <Control
              label={
                <ControlLabel label="Port" tooltip="HTTP port to listen on" />
              }
              className="px-3"
            >
              <Input
                type="number"
                min={1}
                max={65535}
                value={cfg.remoteServerPort ?? 3210}
                onChange={(e) =>
                  saveConfig({
                    remoteServerPort: parseInt(
                      e.currentTarget.value || "3210",
                      10,
                    ),
                  })
                }
                className="w-36"
              />
            </Control>

            <Control
              label={
                <ControlLabel
                  label="Bind Address"
                  tooltip="127.0.0.1 for local-only access; 0.0.0.0 to allow LAN access (requires API key)"
                />
              }
              className="px-3"
            >
              <Select
                value={(cfg.remoteServerBindAddress as any) || "127.0.0.1"}
                onValueChange={(value: any) =>
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
                  Warning: Exposes the server on your local network. Keep your
                  API key secure.
                </div>
              )}
            </Control>

            <Control
              label={
                <ControlLabel
                  label="API Key"
                  tooltip="Bearer token required in Authorization header"
                />
              }
              className="px-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="password"
                  value={cfg.remoteServerApiKey ? "••••••••" : ""}
                  readOnly
                  className="w-full min-w-0 max-w-full sm:w-[360px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={streamerMode || !hasRemoteServerApiKey}
                  title={
                    streamerMode
                      ? "Disabled in Streamer Mode"
                      : !hasRemoteServerApiKey
                        ? "API key unavailable"
                        : undefined
                  }
                  onClick={() => {
                    if (!remoteServerPairingApiKey || streamerMode) return
                    void copyTextToClipboard(remoteServerPairingApiKey).catch(
                      (err) => {
                        console.error(
                          "Failed to copy remote server API key",
                          err,
                        )
                      },
                    )
                  }}
                >
                  {streamerMode ? (
                    <>
                      <EyeOff className="mr-1 h-3.5 w-3.5" />
                      Hidden
                    </>
                  ) : (
                    "Copy"
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await saveConfigAsync({
                      remoteServerApiKey: generateRemoteServerApiKey(),
                    })
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
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <EyeOff className="h-3 w-3" />
                  Copy disabled in Streamer Mode
                </div>
              )}
            </Control>

            <Control
              label={
                <ControlLabel
                  label="Log Level"
                  tooltip="Fastify logger level"
                />
              }
              className="px-3"
            >
              <Select
                value={(cfg.remoteServerLogLevel as any) || "info"}
                onValueChange={(value: any) =>
                  saveConfig({ remoteServerLogLevel: value })
                }
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">error</SelectItem>
                  <SelectItem value="info">info</SelectItem>
                  <SelectItem value="debug">debug</SelectItem>
                </SelectContent>
              </Select>
            </Control>

            <Control
              label={
                <ControlLabel
                  label="CORS Origins"
                  tooltip="Allowed origins for CORS requests. Use * for all origins (development), or specify comma-separated URLs like http://localhost:8081"
                />
              }
              className="px-3"
            >
              <Input
                type="text"
                value={(cfg.remoteServerCorsOrigins || ["*"]).join(", ")}
                onChange={(e) => {
                  const origins = e.currentTarget.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                  saveConfig({
                    remoteServerCorsOrigins:
                      origins.length > 0 ? origins : ["*"],
                  })
                }}
                placeholder="* or http://localhost:8081, http://example.com"
                className="w-full"
              />
            </Control>

            {(baseUrl ||
              showConnectableUrlResolutionWarning ||
              showLoopbackBindWarning) && (
              <>
                <Control label="Base URL" className="px-3">
                  {baseUrl ? (
                    <div className="text-muted-foreground select-text break-all text-sm">
                      {streamerMode ? maskUrl(baseUrl) : baseUrl}
                    </div>
                  ) : (
                    <div className="break-words text-sm text-amber-700 dark:text-amber-300">
                      Unable to resolve a LAN-reachable URL for the current bind
                      address.
                    </div>
                  )}
                  {streamerMode && baseUrl && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <EyeOff className="h-3 w-3" />
                      URL masked in Streamer Mode
                    </div>
                  )}
                  {showConnectableUrlResolutionWarning && (
                    <div className="mt-1 break-words text-xs text-amber-600 dark:text-amber-400">
                      The server is running, but no LAN-reachable address was
                      detected for wildcard bind (0.0.0.0/::). Connect to a
                      local network or use a specific LAN IP/host to enable
                      mobile pairing.
                    </div>
                  )}
                  {showLoopbackBindWarning && (
                    <div className="mt-1 break-words text-xs text-amber-600 dark:text-amber-400">
                      The server is running on loopback ({configuredBindAddress}
                      ), which is only reachable from this computer. Use 0.0.0.0
                      or a LAN IP to enable mobile pairing.
                    </div>
                  )}
                </Control>

                {shouldShowPairingSurface && (
                  <Control
                    label={
                      <ControlLabel
                        label="Local Server QR Code"
                        tooltip="Scan this QR code with the DotAgents mobile app to connect to the local remote server"
                      />
                    }
                    className="px-3"
                  >
                    <div className="flex flex-col items-start gap-3">
                      {streamerMode ? (
                        <div
                          className="bg-muted/50 flex flex-col items-center justify-center rounded-lg p-3"
                          style={{ width: 160, height: 160 }}
                        >
                          <EyeOff className="text-muted-foreground mb-2 h-8 w-8" />
                          <span className="text-muted-foreground text-center text-xs">
                            QR hidden
                            <br />
                            Streamer Mode
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-white p-3">
                          <QRCodeSVG
                            value={`dotagents://config?baseUrl=${encodeURIComponent(localServerBaseUrl)}&apiKey=${encodeURIComponent(remoteServerPairingApiKey)}`}
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
                          title={
                            streamerMode
                              ? "Disabled in Streamer Mode"
                              : !hasRemoteServerApiKey
                                ? "API key unavailable"
                                : undefined
                          }
                          onClick={() => {
                            if (streamerMode || !remoteServerPairingApiKey)
                              return
                            const deepLink = `dotagents://config?baseUrl=${encodeURIComponent(localServerBaseUrl)}&apiKey=${encodeURIComponent(remoteServerPairingApiKey)}`
                            void copyTextToClipboard(deepLink).catch((err) => {
                              console.error("Failed to copy deep link", err)
                            })
                          }}
                        >
                          {streamerMode ? (
                            <>
                              <EyeOff className="mr-1 h-3.5 w-3.5" />
                              Hidden
                            </>
                          ) : (
                            "Copy Deep Link"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={streamerMode}
                          title={
                            streamerMode
                              ? "Disabled in Streamer Mode"
                              : "Print QR code to terminal (useful for SSH/headless access)"
                          }
                          onClick={() => {
                            if (streamerMode) return
                            tipcClient.printRemoteServerQRCode()
                          }}
                        >
                          Print to Terminal
                        </Button>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {streamerMode
                          ? "QR code and deep link hidden in Streamer Mode"
                          : "Scan with the DotAgents mobile app to auto-configure the local server connection."}
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
          id="cloudflare-tunnel"
          collapsible={collapsible}
          defaultCollapsed={defaultCollapsed}
          forceOpen={forceOpen}
          title={
            <ControlLabel
              label="Cloudflare Tunnel"
              tooltip="Optional internet access for the remote server. Quick tunnels use random URLs; named tunnels keep a persistent URL."
            />
          }
        >
          {!isCloudflaredInstalled ? (
            <div className="px-3 py-2">
              <div className="mb-2 text-sm text-amber-600 dark:text-amber-400">
                cloudflared is not installed. Please install it to use
                Cloudflare Tunnel.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/",
                    "_blank",
                  )
                }
              >
                Download cloudflared
              </Button>
            </div>
          ) : (
            <>
              <Control
                label={
                  <ControlLabel
                    label="Tunnel Mode"
                    tooltip="Quick tunnels are easy but have random URLs. Named tunnels require setup but have persistent URLs."
                  />
                }
                className="px-3"
              >
                <Select
                  value={tunnelMode}
                  onValueChange={(value: "quick" | "named") => {
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
                    <SelectItem value="quick">
                      Quick Tunnel (Random URL)
                    </SelectItem>
                    <SelectItem value="named">
                      Named Tunnel (Persistent)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Control>

              <Control
                label={
                  <ControlLabel
                    label="Auto-Start Tunnel"
                    tooltip="Automatically start the Cloudflare Tunnel when the application launches (requires Remote Server to be enabled)"
                  />
                }
                className="px-3"
              >
                <Switch
                  checked={cfg?.cloudflareTunnelAutoStart ?? false}
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
                      <div className="mb-2 text-sm text-amber-600 dark:text-amber-400">
                        You need to authenticate with Cloudflare first. Run{" "}
                        <code className="bg-muted rounded px-1">
                          cloudflared tunnel login
                        </code>{" "}
                        in your terminal.
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            "https://developers.cloudflare.com/load-balancing/private-network/public-to-tunnel/#1-configure-a-cloudflare-tunnel-with-an-assigned-virtual-network",
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        Setup Guide
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Control
                        label={
                          <ControlLabel
                            label="Tunnel ID"
                            tooltip="The UUID of your named tunnel. Find it with 'cloudflared tunnel list'"
                          />
                        }
                        className="px-3"
                      >
                        <div className="flex flex-col gap-2">
                          <Input
                            type="text"
                            value={cfg?.cloudflareTunnelId ?? ""}
                            onChange={(e) =>
                              saveConfig({
                                cloudflareTunnelId: e.currentTarget.value,
                              })
                            }
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className="w-full min-w-0 max-w-full font-mono text-xs sm:w-[360px]"
                          />
                          {tunnelList.length > 0 && (
                            <div className="text-muted-foreground text-xs">
                              Available tunnels:{" "}
                              {tunnelList
                                .map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    className="hover:text-foreground ml-1 cursor-pointer underline"
                                    onClick={() =>
                                      saveConfig({
                                        cloudflareTunnelId: t.id,
                                        cloudflareTunnelName: t.name,
                                      })
                                    }
                                  >
                                    {t.name}
                                  </button>
                                ))
                                .reduce<React.ReactNode[]>(
                                  (acc, el, i) =>
                                    i === 0 ? [el] : [...acc, ", ", el],
                                  [],
                                )}
                            </div>
                          )}
                        </div>
                      </Control>

                      <Control
                        label={
                          <ControlLabel
                            label="Hostname"
                            tooltip="The public hostname for your tunnel (e.g., myapp.example.com). Must be configured in Cloudflare DNS."
                          />
                        }
                        className="px-3"
                      >
                        <Input
                          type="text"
                          value={cfg?.cloudflareTunnelHostname ?? ""}
                          onChange={(e) =>
                            saveConfig({
                              cloudflareTunnelHostname: e.currentTarget.value,
                            })
                          }
                          placeholder="myapp.example.com"
                          className="w-full min-w-0 max-w-full sm:w-[300px]"
                        />
                      </Control>

                      <Control
                        label={
                          <ControlLabel
                            label="Credentials Path"
                            tooltip="Path to credentials JSON file. Leave empty to use default (~/.cloudflared/<tunnel-id>.json)"
                          />
                        }
                        className="px-3"
                      >
                        <Input
                          type="text"
                          value={cfg?.cloudflareTunnelCredentialsPath ?? ""}
                          onChange={(e) =>
                            saveConfig({
                              cloudflareTunnelCredentialsPath:
                                e.currentTarget.value,
                            })
                          }
                          placeholder="~/.cloudflared/<tunnel-id>.json (default)"
                          className="w-full min-w-0 max-w-full font-mono text-xs sm:w-[360px]"
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
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">
                        Starting...
                      </span>
                    </>
                  ) : tunnelStatus?.running ? (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Connected{" "}
                        {tunnelStatus.mode === "named" ? "(Named)" : "(Quick)"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                      <span className="text-muted-foreground text-sm">
                        Not running
                      </span>
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
                          if (
                            !cfg?.cloudflareTunnelId ||
                            !cfg?.cloudflareTunnelHostname
                          ) {
                            return // Validation handled in UI
                          }
                          startNamedTunnelMutation.mutate({
                            tunnelId: cfg.cloudflareTunnelId,
                            hostname: cfg.cloudflareTunnelHostname,
                            credentialsPath:
                              cfg.cloudflareTunnelCredentialsPath || undefined,
                          })
                        } else {
                          startTunnelMutation.mutate()
                        }
                      }}
                      disabled={
                        startTunnelMutation.isPending ||
                        startNamedTunnelMutation.isPending ||
                        (tunnelMode === "named" &&
                          (!cfg?.cloudflareTunnelId ||
                            !cfg?.cloudflareTunnelHostname))
                      }
                    >
                      {startTunnelMutation.isPending ||
                      startNamedTunnelMutation.isPending
                        ? "Starting..."
                        : "Start Tunnel"}
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => stopTunnelMutation.mutate()}
                      disabled={
                        stopTunnelMutation.isPending || tunnelStatus?.starting
                      }
                    >
                      {stopTunnelMutation.isPending
                        ? "Stopping..."
                        : "Stop Tunnel"}
                    </Button>
                  )}
                  {tunnelMode === "named" && !cfg?.cloudflareTunnelId && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Enter Tunnel ID to start
                    </span>
                  )}
                  {tunnelMode === "named" &&
                    cfg?.cloudflareTunnelId &&
                    !cfg?.cloudflareTunnelHostname && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Enter Hostname to start
                      </span>
                    )}
                </div>
              </Control>

              <Control
                label={
                  <ControlLabel
                    label="Reset Pairing"
                    tooltip="Regenerates the remote server API key and clears the current Cloudflare tunnel URL/config. Start the tunnel again to get a fresh URL."
                  />
                }
                className="px-3"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    saveConfigMutation.isPending ||
                    stopTunnelMutation.isPending ||
                    startTunnelMutation.isPending ||
                    startNamedTunnelMutation.isPending
                  }
                  onClick={async () => {
                    if (tunnelStatus?.running || tunnelStatus?.starting) {
                      await stopTunnelMutation.mutateAsync()
                    }
                    await saveConfigAsync({
                      remoteServerApiKey: generateRemoteServerApiKey(),
                      cloudflareTunnelAutoStart: false,
                      cloudflareTunnelId: "",
                      cloudflareTunnelName: "",
                      cloudflareTunnelCredentialsPath: "",
                      cloudflareTunnelHostname: "",
                    })
                    await Promise.all([
                      configQuery.refetch(),
                      remoteServerPairingApiKeyQuery.refetch(),
                      queryClient.invalidateQueries({
                        queryKey: ["cloudflare-tunnel-status"],
                      }),
                      queryClient.invalidateQueries({
                        queryKey: ["remote-server-status"],
                      }),
                    ])
                  }}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reset Key + URL
                </Button>
                <div className="text-muted-foreground mt-1 text-xs">
                  Existing mobile deep links will stop working after reset.
                </div>
              </Control>

              {tunnelStatus?.url && tunnelStatus?.running && (
                <>
                  <Control
                    label={
                      <ControlLabel
                        label="Public URL"
                        tooltip="Use this URL to access your remote server from anywhere"
                      />
                    }
                    className="px-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type={streamerMode ? "password" : "text"}
                        value={
                          streamerMode
                            ? "••••••••••••••••••••"
                            : `${tunnelStatus.url}/v1`
                        }
                        readOnly
                        className="w-full min-w-0 max-w-full font-mono text-xs sm:w-[360px]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={streamerMode}
                        title={
                          streamerMode ? "Disabled in Streamer Mode" : undefined
                        }
                        onClick={() => {
                          if (streamerMode) return
                          void copyTextToClipboard(
                            `${tunnelStatus.url}/v1`,
                          ).catch((err) => {
                            console.error("Failed to copy tunnel URL", err)
                          })
                        }}
                      >
                        {streamerMode ? (
                          <>
                            <EyeOff className="mr-1 h-3.5 w-3.5" />
                            Hidden
                          </>
                        ) : (
                          "Copy"
                        )}
                      </Button>
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {streamerMode ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <EyeOff className="h-3 w-3" />
                          URL hidden in Streamer Mode
                        </span>
                      ) : tunnelStatus.mode === "named" ? (
                        "This URL is persistent and will remain the same across restarts."
                      ) : (
                        "This URL is temporary and will change when you restart the tunnel."
                      )}
                    </div>
                  </Control>

                  {shouldShowPairingSurface && (
                    <Control
                      label={
                        <ControlLabel
                          label="Mobile App QR Code"
                          tooltip="Scan this QR code with the DotAgents mobile app to connect"
                        />
                      }
                      className="px-3"
                    >
                      <div className="flex flex-col items-start gap-3">
                        {streamerMode ? (
                          <div
                            className="bg-muted/50 flex flex-col items-center justify-center rounded-lg p-3"
                            style={{ width: 160, height: 160 }}
                          >
                            <EyeOff className="text-muted-foreground mb-2 h-8 w-8" />
                            <span className="text-muted-foreground text-center text-xs">
                              QR hidden
                              <br />
                              Streamer Mode
                            </span>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-white p-3">
                            <QRCodeSVG
                              value={`dotagents://config?baseUrl=${encodeURIComponent(`${tunnelStatus.url}/v1`)}&apiKey=${encodeURIComponent(remoteServerPairingApiKey)}`}
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
                            title={
                              streamerMode
                                ? "Disabled in Streamer Mode"
                                : !hasRemoteServerApiKey
                                  ? "API key unavailable"
                                  : undefined
                            }
                            onClick={() => {
                              if (streamerMode || !remoteServerPairingApiKey)
                                return
                              const deepLink = `dotagents://config?baseUrl=${encodeURIComponent(`${tunnelStatus.url}/v1`)}&apiKey=${encodeURIComponent(remoteServerPairingApiKey)}`
                              void copyTextToClipboard(deepLink).catch(
                                (err) => {
                                  console.error(
                                    "Failed to copy tunnel deep link",
                                    err,
                                  )
                                },
                              )
                            }}
                          >
                            {streamerMode ? (
                              <>
                                <EyeOff className="mr-1 h-3.5 w-3.5" />
                                Hidden
                              </>
                            ) : (
                              "Copy Deep Link"
                            )}
                          </Button>
                        </div>
                        <div className="text-muted-foreground text-xs">
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
    </div>
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
