export const DEFAULT_REMOTE_SERVER_BIND_ADDRESS = "127.0.0.1" as const
export const REMOTE_SERVER_LAN_BIND_ADDRESS = "0.0.0.0" as const
export const DEFAULT_REMOTE_SERVER_PORT = 3210 as const

export function normalizeRemoteServerHostForComparison(host: string): string {
  const normalized = host.trim().toLowerCase()
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    return normalized.slice(1, -1)
  }
  return normalized
}

export function isWildcardRemoteServerHost(host: string): boolean {
  const normalizedHost = normalizeRemoteServerHostForComparison(host)
  return (
    normalizedHost === REMOTE_SERVER_LAN_BIND_ADDRESS || normalizedHost === "::"
  )
}

export function isLoopbackRemoteServerHost(host: string): boolean {
  const normalizedHost = normalizeRemoteServerHostForComparison(host)
  return (
    normalizedHost === DEFAULT_REMOTE_SERVER_BIND_ADDRESS ||
    normalizedHost === "localhost" ||
    normalizedHost === "::1"
  )
}

export function isConnectableRemoteServerIpv6Address(host: string): boolean {
  const normalizedHost = normalizeRemoteServerHostForComparison(host)

  // Zone-scoped addresses (for example `fe80::1%en0`) are not reliable in QR/deep-link URLs.
  if (normalizedHost.includes("%")) {
    return false
  }

  if (
    normalizedHost === "::" ||
    normalizedHost === "::1" ||
    /^fe[89ab]/.test(normalizedHost) ||
    normalizedHost.startsWith("ff")
  ) {
    return false
  }

  return true
}

export function isUnconnectableRemoteServerHostForMobilePairing(
  host: string,
): boolean {
  return isWildcardRemoteServerHost(host) || isLoopbackRemoteServerHost(host)
}

export function formatRemoteServerHostForHttpUrl(host: string): string {
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

export function buildRemoteServerBaseUrl(host: string, port: number): string {
  return `http://${formatRemoteServerHostForHttpUrl(host)}:${port}/v1`
}

export interface ResolveRemoteServerPairingPreviewOptions {
  configuredBindAddress?: string | null
  port?: number | null
  running: boolean
  connectableUrl?: string
}

export interface RemoteServerPairingPreview {
  configuredBindAddress: string
  port: number
  baseUrl?: string
  shouldShowConnectabilityWarning: boolean
  showConnectableUrlResolutionWarning: boolean
  showLoopbackBindWarning: boolean
}

export function resolveRemoteServerPairingPreview(
  options: ResolveRemoteServerPairingPreviewOptions,
): RemoteServerPairingPreview {
  const configuredBindAddress =
    options.configuredBindAddress || DEFAULT_REMOTE_SERVER_BIND_ADDRESS
  const port = options.port || DEFAULT_REMOTE_SERVER_PORT
  const liveConnectableUrl = options.running
    ? options.connectableUrl
    : undefined
  const baseUrl =
    liveConnectableUrl ??
    (!isUnconnectableRemoteServerHostForMobilePairing(configuredBindAddress)
      ? buildRemoteServerBaseUrl(configuredBindAddress, port)
      : undefined)
  const shouldShowConnectabilityWarning =
    options.running &&
    isUnconnectableRemoteServerHostForMobilePairing(configuredBindAddress) &&
    !liveConnectableUrl

  return {
    configuredBindAddress,
    port,
    baseUrl,
    shouldShowConnectabilityWarning,
    showConnectableUrlResolutionWarning:
      shouldShowConnectabilityWarning &&
      isWildcardRemoteServerHost(configuredBindAddress),
    showLoopbackBindWarning:
      shouldShowConnectabilityWarning &&
      isLoopbackRemoteServerHost(configuredBindAddress),
  }
}
