import type { IncomingMessage, Server as HttpServer } from "http"
import { createRequire } from "module"
import type { Duplex } from "stream"
import type WebSocketType = require("ws")

const require = createRequire(import.meta.url)
const WebSocket = require("ws") as typeof WebSocketType

type RealtimeProxyConfig = {
  openaiApiKey?: string
  openaiBaseUrl?: string
}

type RealtimeProxyLogger = {
  info?: (message: string, details?: unknown) => void
  warning?: (message: string, details?: unknown) => void
  error?: (message: string, details?: unknown) => void
}

type RegisterRealtimeProxyOptions = {
  server: HttpServer
  getConfig: () => RealtimeProxyConfig
  getRemoteServerApiKey: () => string
  logger?: RealtimeProxyLogger
}

type PendingMessage = {
  data: WebSocketType.Data
  isBinary: boolean
}

const DEFAULT_REALTIME_MODEL = "gpt-realtime-mini"
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1"
const MAX_PENDING_MESSAGES = 64
const MAX_PENDING_BYTES = 1024 * 1024

export function buildOpenAIRealtimeWebSocketUrl(baseUrl: string | undefined, model: string): string {
  const trimmed = resolveOpenAIRealtimeBaseUrl(baseUrl).replace(/\/+$/, "")
  const withoutV1 = trimmed.endsWith("/v1") ? trimmed.slice(0, -3) : trimmed
  const wsBase = withoutV1
    .replace(/^https:/i, "wss:")
    .replace(/^http:/i, "ws:")

  if (!/^wss?:\/\//i.test(wsBase)) {
    throw new Error("OpenAI base URL must start with http:// or https://")
  }

  return `${wsBase}/v1/realtime?model=${encodeURIComponent(sanitizeRealtimeModel(model))}`
}

export function resolveOpenAIRealtimeBaseUrl(baseUrl: string | undefined): string {
  const trimmed = (baseUrl || "").trim()
  if (!trimmed) return DEFAULT_OPENAI_BASE_URL

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.toLowerCase()
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "openrouter.ai" || host === "api.example.com") {
      return DEFAULT_OPENAI_BASE_URL
    }
  } catch {
    return trimmed
  }

  return trimmed
}

export function sanitizeRealtimeModel(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_REALTIME_MODEL
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_REALTIME_MODEL
  return trimmed.slice(0, 120)
}

export function registerRealtimeProxy(options: RegisterRealtimeProxyOptions): () => void {
  const wss = new WebSocket.Server({ noServer: true })
  const clients = new Set<WebSocketType>()

  const onUpgrade = (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const parsedUrl = new URL(request.url || "/", "http://dotagents.local")
    if (parsedUrl.pathname !== "/v1/realtime") return

    const expectedToken = options.getRemoteServerApiKey()
    const auth = request.headers.authorization?.toString() || ""
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
    if (!token || !expectedToken || token !== expectedToken) {
      rejectUpgrade(socket, 401, "Unauthorized")
      return
    }

    const config = options.getConfig()
    if (!config.openaiApiKey) {
      rejectUpgrade(socket, 502, "OpenAI API key is required for Realtime")
      return
    }

    const model = sanitizeRealtimeModel(parsedUrl.searchParams.get("model"))
    wss.handleUpgrade(request, socket, head, (client) => {
      clients.add(client)
      client.once("close", () => clients.delete(client))
      proxyRealtimeConnection(client, config, model, options.logger)
    })
  }

  options.server.on("upgrade", onUpgrade)

  return () => {
    options.server.off("upgrade", onUpgrade)
    for (const client of clients) {
      try { client.close(1001, "Realtime proxy shutting down") } catch {}
    }
    try { wss.close() } catch {}
  }
}

function proxyRealtimeConnection(
  client: WebSocketType,
  config: RealtimeProxyConfig,
  model: string,
  logger?: RealtimeProxyLogger,
): void {
  let upstream: WebSocketType
  try {
    const url = buildOpenAIRealtimeWebSocketUrl(config.openaiBaseUrl, model)
    logger?.info?.("Opening OpenAI Realtime proxy connection", { model, usingDefaultRealtimeBaseUrl: resolveOpenAIRealtimeBaseUrl(config.openaiBaseUrl) !== (config.openaiBaseUrl || "").trim() })
    upstream = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      perMessageDeflate: false,
    })
  } catch (error) {
    logger?.error?.("Failed to initialize OpenAI Realtime proxy", error)
    closeSocket(client, 1011, "Realtime proxy initialization failed")
    return
  }

  const pending: PendingMessage[] = []
  let pendingBytes = 0
  let upstreamErrorReason = ""

  upstream.on("open", () => {
    for (const message of pending.splice(0)) {
      upstream.send(message.data, { binary: message.isBinary })
    }
    pendingBytes = 0
  })

  client.on("message", (data, isBinary) => {
    if (upstream.readyState === WebSocket.OPEN) {
      upstream.send(data, { binary: isBinary })
      return
    }

    if (upstream.readyState !== WebSocket.CONNECTING) return
    const size = getWebSocketDataSize(data)
    if (pending.length >= MAX_PENDING_MESSAGES || pendingBytes + size > MAX_PENDING_BYTES) {
      closeSocket(client, 1009, "Realtime proxy buffer exceeded")
      closeSocket(upstream, 1009, "Realtime proxy buffer exceeded")
      return
    }
    pending.push({ data, isBinary })
    pendingBytes += size
  })

  upstream.on("message", (data, isBinary) => {
    upstreamErrorReason = extractRealtimeErrorReason(data) || upstreamErrorReason
    if (client.readyState === WebSocket.OPEN) {
      client.send(data, { binary: isBinary })
    }
  })

  upstream.on("unexpected-response", (_request, response) => {
    upstreamErrorReason = `Realtime upstream rejected request (${response.statusCode || "unknown"})`
    let body = ""
    response.on("data", (chunk) => {
      body += chunk.toString()
    })
    response.on("end", () => {
      upstreamErrorReason = extractRealtimeErrorReason(body) || upstreamErrorReason
      closeSocket(client, 1011, upstreamErrorReason)
    })
  })

  upstream.on("error", (error) => {
    logger?.error?.("OpenAI Realtime upstream error", error)
    closeSocket(client, 1011, upstreamErrorReason || "Realtime upstream error")
  })

  client.on("error", (error) => {
    logger?.warning?.("Mobile Realtime client socket error", error)
  })

  client.on("close", (code, reason) => {
    closeSocket(upstream, normalizeCloseCode(code), reason.toString() || "Mobile Realtime client closed")
  })

  upstream.on("close", (code, reason) => {
    closeSocket(client, normalizeCloseCode(code), reason.toString() || upstreamErrorReason || "Realtime upstream closed")
  })
}

export function extractRealtimeErrorReason(data: WebSocketType.Data): string {
  if (typeof data !== "string" && !Buffer.isBuffer(data)) return ""
  try {
    const event = JSON.parse(typeof data === "string" ? data : data.toString("utf8"))
    if (event?.type !== "error" && !event?.error) return ""
    return String(event?.error?.message || event?.message || "Realtime API error.").slice(0, 120)
  } catch {
    return ""
  }
}

function rejectUpgrade(socket: Duplex, statusCode: number, message: string): void {
  const body = JSON.stringify({ error: message })
  socket.write(`HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`)
  socket.destroy()
}

function closeSocket(socket: WebSocketType, code: number, reason: string): void {
  if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) return
  try { socket.close(code, reason.slice(0, 120)) } catch {}
}

function normalizeCloseCode(code: number): number {
  if (code === 1005 || code === 1006 || code === 1015 || code < 1000 || code > 4999) return 1011
  return code
}

function getWebSocketDataSize(data: WebSocketType.Data): number {
  if (typeof data === "string") return Buffer.byteLength(data)
  if (Buffer.isBuffer(data)) return data.byteLength
  if (Array.isArray(data)) return data.reduce((sum, item) => sum + item.byteLength, 0)
  if (data instanceof ArrayBuffer) return data.byteLength
  return (data as ArrayBufferView).byteLength ?? 0
}