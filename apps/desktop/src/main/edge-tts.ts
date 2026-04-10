import { randomUUID } from "node:crypto"
import { createRequire } from "node:module"
import type { Config } from "../shared/types"

const localRequire = createRequire(import.meta.url)
const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
const CHROMIUM_FULL_VERSION = "143.0.3650.75"
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".", 1)[0]
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`
const WSS_HEADERS = {
  Pragma: "no-cache",
  "Cache-Control": "no-cache",
  Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
  "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "en-US,en;q=0.9",
}
const WINDOWS_EPOCH_OFFSET_SECONDS = 11_644_473_600
const DEFAULT_EDGE_TTS_VOICE = "en-US-AriaNeural"
const NO_AUDIO_ERROR_MESSAGE = "Edge TTS connection closed before audio was received"

export type TTSGenerationResult = {
  audio: ArrayBuffer
  mimeType: string
}

type EdgeTTSConfig = Pick<Config, "edgeTtsModel" | "edgeTtsVoice" | "edgeTtsRate">
type EdgeTTSInput = { voice?: string; model?: string; speed?: number }
type EdgeTTSMessageData = string | Uint8Array | ArrayBuffer | Blob | Uint8Array[]

export interface WebSocketLike {
  onopen: (() => void) | null
  onmessage: ((event: { data: EdgeTTSMessageData }) => void) | null
  onerror: ((event?: unknown) => void) | null
  onclose: (() => void) | null
  send(data: string): void
  close(): void
}

type WebSocketOptions = {
  headers?: Record<string, string>
  perMessageDeflate?: boolean
}

type UnexpectedResponseLike = {
  statusCode?: number
  statusMessage?: string
  on?: (event: string, listener: (chunk: Buffer | string) => void) => void
}

type WebSocketNodeLike = WebSocketLike & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void
}

export type WebSocketLikeConstructor = new (url: string, options?: WebSocketOptions) => WebSocketNodeLike

export function resolveWebSocketConstructor(
  globalWebSocket: WebSocketLikeConstructor | null | undefined = globalThis.WebSocket as unknown as WebSocketLikeConstructor | undefined,
  loadWebSocketModule: () => unknown = () => localRequire("ws"),
): WebSocketLikeConstructor {
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      return getConstructorFromModule(loadWebSocketModule())
    } catch {
      if (globalWebSocket) return globalWebSocket
      throw new Error("Edge TTS requires a WebSocket implementation in the Electron main process")
    }
  }

  if (globalWebSocket) return globalWebSocket

  return getConstructorFromModule(loadWebSocketModule())
}

function getConstructorFromModule(moduleValue: unknown): WebSocketLikeConstructor {
  const loaded = moduleValue as
    | WebSocketLikeConstructor
    | { WebSocket?: WebSocketLikeConstructor; default?: WebSocketLikeConstructor }

  const fallback = typeof loaded === "function"
    ? loaded
    : loaded.WebSocket || loaded.default

  if (!fallback) {
    throw new Error("Edge TTS requires a WebSocket implementation in the Electron main process")
  }

  return fallback
}

export async function generateEdgeTTS(
  text: string,
  input: EdgeTTSInput,
  config: EdgeTTSConfig,
  WebSocketCtor: WebSocketLikeConstructor = resolveWebSocketConstructor(),
): Promise<TTSGenerationResult> {
  // Model is kept for consistency with other providers/settings UI.
  // The underlying edge-tts package currently uses one cloud backend.
  const _model = input.model || config.edgeTtsModel || "edge-tts"
  const voice = input.voice || config.edgeTtsVoice || DEFAULT_EDGE_TTS_VOICE
  const speed = input.speed || config.edgeTtsRate || 1.0
  const clampedSpeed = Math.min(2.0, Math.max(0.5, speed))
  const ratePercent = Math.round((clampedSpeed - 1) * 100)
  const rate = `${ratePercent >= 0 ? "+" : ""}${ratePercent}%`

  try {
    return await synthesizeEdgeTTS(text, voice, rate, WebSocketCtor)
  } catch (error) {
    if (voice !== DEFAULT_EDGE_TTS_VOICE && isNoAudioError(error)) {
      return synthesizeEdgeTTS(text, DEFAULT_EDGE_TTS_VOICE, rate, WebSocketCtor)
    }
    throw error
  }
}

async function synthesizeEdgeTTS(
  text: string,
  voice: string,
  rate: string,
  WebSocketCtor: WebSocketLikeConstructor,
): Promise<TTSGenerationResult> {
  const connectionId = randomUUID().replace(/-/g, "")
  const requestId = randomUUID().replace(/-/g, "")
  const timestamp = dateToString()
  const secMsGec = generateSecMsGec()
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectionId}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`

  const audioChunks: Uint8Array[] = []

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocketCtor(wsUrl, {
      headers: { ...WSS_HEADERS, Cookie: `muid=${randomUUID().replace(/-/g, "").toUpperCase()};` },
      perMessageDeflate: true,
    })
    let settled = false

    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      callback()
    }

    const cleanup = () => {
      ws.onopen = null
      ws.onmessage = null
      ws.onerror = null
      ws.onclose = null
    }

    ws.on?.("unexpected-response", (_request: unknown, response: unknown) => {
      const res = response as UnexpectedResponseLike
      const statusText = [res.statusCode, res.statusMessage].filter(Boolean).join(" ") || "unknown status"
      finish(() => {
        cleanup()
        reject(new Error(`Edge TTS websocket handshake failed: ${statusText}`))
      })
    })

    ws.onopen = () => {
      const speechConfig = [
        `X-Timestamp:${timestamp}`,
        "Content-Type:application/json; charset=utf-8",
        "Path:speech.config",
        "",
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: "false",
                  wordBoundaryEnabled: "false",
                },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3",
              },
            },
          },
        }),
      ].join("\r\n")

      const ssml = [
        `<speak version='1.0' xml:lang='en-US'>`,
        `<voice name='${escapeXml(voice)}'>`,
        `<prosody rate='${escapeXml(rate)}'>${escapeXml(text)}</prosody>`,
        "</voice>",
        "</speak>",
      ].join("")

      const ssmlRequest = [
        `X-RequestId:${requestId}`,
        "Content-Type:application/ssml+xml",
        `X-Timestamp:${timestamp}Z`,
        "Path:ssml",
        "",
        ssml,
      ].join("\r\n")

      ws.send(speechConfig)
      ws.send(ssmlRequest)
    }

    ws.onmessage = async (event) => {
      try {
        const data = await normalizeMessageData(event.data)
        if (typeof data === "string") {
          const { headers } = parseTextMessage(data)
          if (headers.Path === "turn.end") {
            finish(() => {
              cleanup()
              try { ws.close() } catch { /* noop */ }
              resolve()
            })
          }
          return
        }

        const { headers, audioData } = parseBinaryMessage(data)
        if (headers.Path !== "audio") return

        const contentType = headers["Content-Type"]
        if (!contentType) {
          if (audioData.length === 0) return
          throw new Error("Edge TTS returned audio bytes without a Content-Type header")
        }
        if (contentType !== "audio/mpeg") {
          throw new Error(`Edge TTS returned unexpected audio content type: ${contentType}`)
        }
        if (audioData.length === 0) {
          throw new Error("Edge TTS returned an empty audio chunk")
        }
        audioChunks.push(audioData)
      } catch (error) {
        finish(() => {
          cleanup()
          try { ws.close() } catch { /* noop */ }
          reject(error)
        })
      }
    }

    ws.onerror = (event) => {
      finish(() => {
        cleanup()
        reject(new Error(getWebSocketErrorMessage(event)))
      })
    }

    ws.onclose = () => {
      finish(() => {
        cleanup()
        if (audioChunks.length === 0) {
          reject(new Error(NO_AUDIO_ERROR_MESSAGE))
          return
        }
        resolve()
      })
    }
  })

  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const merged = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of audioChunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  return {
    audio: merged.buffer,
    mimeType: "audio/mpeg",
  }
}

function isNoAudioError(error: unknown): boolean {
  return error instanceof Error && error.message === NO_AUDIO_ERROR_MESSAGE
}

async function normalizeMessageData(data: EdgeTTSMessageData): Promise<string | Uint8Array> {
  if (typeof data === "string") return data
  if (data instanceof Uint8Array) return new Uint8Array(data)
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return new Uint8Array(await data.arrayBuffer())
  }
  if (Array.isArray(data)) {
    const totalLength = data.reduce((sum, chunk) => sum + chunk.length, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of data) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    return merged
  }
  throw new Error("Unsupported Edge TTS websocket payload type")
}

function parseTextMessage(message: string): { headers: Record<string, string>; body: string } {
  const headerBoundaryIndex = message.indexOf("\r\n\r\n")
  if (headerBoundaryIndex < 0) {
    return { headers: {}, body: message }
  }

  const headerText = message.slice(0, headerBoundaryIndex)
  const body = message.slice(headerBoundaryIndex + 4)
  return { headers: parseHeaderText(headerText), body }
}

function parseBinaryMessage(data: Uint8Array): { headers: Record<string, string>; audioData: Uint8Array } {
  if (data.length < 2) {
    throw new Error("Edge TTS returned an incomplete binary frame")
  }

  const headerLength = (data[0] << 8) | data[1]
  const headerEnd = headerLength + 2
  if (headerEnd > data.length) {
    throw new Error("Edge TTS returned a binary frame with an invalid header length")
  }

  const headerText = new TextDecoder().decode(data.subarray(2, headerEnd))
  return {
    headers: parseHeaderText(headerText),
    audioData: data.subarray(headerEnd),
  }
}

function parseHeaderText(headerText: string): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const line of headerText.split("\r\n")) {
    if (!line) continue
    const separatorIndex = line.indexOf(":")
    if (separatorIndex < 0) continue
    const key = line.slice(0, separatorIndex)
    const value = line.slice(separatorIndex + 1).trim()
    headers[key] = value
  }
  return headers
}

function getWebSocketErrorMessage(event: unknown): string {
  const candidate = event as { error?: Error; message?: string }
  if (candidate?.error?.message) {
    return `Edge TTS websocket connection failed: ${candidate.error.message}`
  }
  if (candidate?.message) {
    return `Edge TTS websocket connection failed: ${candidate.message}`
  }
  return "Edge TTS websocket connection failed"
}

function generateSecMsGec(nowMs: number = Date.now()): string {
  let ticks = nowMs / 1000
  ticks += WINDOWS_EPOCH_OFFSET_SECONDS
  ticks -= ticks % 300
  ticks *= 1e9 / 100
  return createHashHex(`${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`)
}

function createHashHex(value: string): string {
  return localRequire("node:crypto").createHash("sha256").update(value, "ascii").digest("hex").toUpperCase()
}

function dateToString(date: Date = new Date()): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${days[date.getUTCDay()]} ${months[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, "0")} ${date.getUTCFullYear()} ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}:${String(date.getUTCSeconds()).padStart(2, "0")} GMT+0000 (Coordinated Universal Time)`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;")
}