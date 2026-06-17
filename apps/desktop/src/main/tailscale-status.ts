import { execFileSync } from "node:child_process"

export type TailscalePairingStatus = {
  available: boolean
  running: boolean
  hostName?: string
  dnsName?: string
  ipv4?: string
  baseUrl?: string
  error?: string
}

type TailscaleStatusJson = {
  BackendState?: string
  TailscaleIPs?: unknown
  Self?: {
    HostName?: unknown
    DNSName?: unknown
    TailscaleIPs?: unknown
  }
  CurrentTailnet?: {
    MagicDNSEnabled?: unknown
  }
}

function normalizeDnsName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const normalized = value.trim().replace(/\.$/, "")
  return normalized || undefined
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : []
}

function getTailscaleIpv4(values: string[]): string | undefined {
  return values.find((value) => /^100\.(?:\d{1,3}\.){2}\d{1,3}$/.test(value))
}

export function parseTailscaleStatusJson(raw: string, port: number): TailscalePairingStatus {
  let parsed: TailscaleStatusJson
  try {
    parsed = JSON.parse(raw) as TailscaleStatusJson
  } catch {
    return {
      available: true,
      running: false,
      error: "Tailscale returned invalid status JSON",
    }
  }

  if (parsed.BackendState !== "Running") {
    return {
      available: true,
      running: false,
      error: parsed.BackendState
        ? `Tailscale is ${parsed.BackendState.toLowerCase()}`
        : "Tailscale is not running",
    }
  }

  const selfIps = getStringArray(parsed.Self?.TailscaleIPs)
  const topLevelIps = getStringArray(parsed.TailscaleIPs)
  const ipv4 = getTailscaleIpv4([...selfIps, ...topLevelIps])
  const dnsName = parsed.CurrentTailnet?.MagicDNSEnabled === true
    ? normalizeDnsName(parsed.Self?.DNSName)
    : undefined
  const hostName = typeof parsed.Self?.HostName === "string" ? parsed.Self.HostName : undefined
  if (!ipv4) {
    return {
      available: true,
      running: true,
      hostName,
      dnsName,
      ipv4,
      error: "Tailscale is running, but no usable IPv4 address was found",
    }
  }

  return {
    available: true,
    running: true,
    hostName,
    dnsName,
    ipv4,
    baseUrl: `http://${ipv4}:${port}/v1`,
  }
}

let cachedStatus: { port: number; expiresAt: number; value: TailscalePairingStatus } | undefined

export function getTailscalePairingStatus(port: number): TailscalePairingStatus {
  const now = Date.now()
  if (cachedStatus && cachedStatus.port === port && cachedStatus.expiresAt > now) {
    return cachedStatus.value
  }

  let value: TailscalePairingStatus
  try {
    const output = execFileSync("tailscale", ["status", "--json"], {
      encoding: "utf8",
      timeout: 1200,
      stdio: ["ignore", "pipe", "pipe"],
    })
    value = parseTailscaleStatusJson(output, port)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    value = {
      available: false,
      running: false,
      error: message.includes("ENOENT") ? "Tailscale CLI is not installed" : "Unable to read Tailscale status",
    }
  }

  cachedStatus = {
    port,
    expiresAt: now + 5000,
    value,
  }
  return value
}
