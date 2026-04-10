import { describe, expect, it } from "vitest"
import {
  generateEdgeTTS,
  resolveWebSocketConstructor,
  type WebSocketLike,
  type WebSocketLikeConstructor,
} from "./edge-tts"

function buildAudioFrame(audioBytes: number[]): Uint8Array {
  const header = Buffer.from("X-RequestId:test\r\nContent-Type:audio/mpeg\r\nPath:audio\r\n", "utf8")
  const headerLength = Buffer.alloc(2)
  headerLength.writeUInt16BE(header.length, 0)
  return new Uint8Array(Buffer.concat([headerLength, header, Buffer.from(audioBytes)]))
}

function buildTurnEndFrame(): string {
  return "X-RequestId:test\r\nPath:turn.end\r\n\r\n{}"
}

describe("edge-tts", () => {
  it("falls back to a Node-compatible ws constructor when WebSocket is missing", () => {
    class FakeWebSocket implements WebSocketLike {
      onopen: (() => void) | null = null
      onmessage: ((event: { data: string | Uint8Array | ArrayBuffer | Blob | Uint8Array[] }) => void) | null = null
      onerror: ((event?: unknown) => void) | null = null
      onclose: (() => void) | null = null
      send() {}
      close() {}
    }

    const resolved = resolveWebSocketConstructor(null, () => ({ WebSocket: FakeWebSocket as WebSocketLikeConstructor }))

    expect(resolved).toBe(FakeWebSocket)
  })

  it("handles Node-style binary websocket payloads and returns merged mp3 audio", async () => {
    class FakeWebSocket implements WebSocketLike {
      static instances: FakeWebSocket[] = []

      onopen: (() => void) | null = null
      onmessage: ((event: { data: string | Uint8Array | ArrayBuffer | Blob | Uint8Array[] }) => void) | null = null
      onerror: ((event?: unknown) => void) | null = null
      onclose: (() => void) | null = null
      sent: string[] = []
      options?: { headers?: Record<string, string>; perMessageDeflate?: boolean }

      constructor(public url: string, options?: { headers?: Record<string, string>; perMessageDeflate?: boolean }) {
        this.options = options
        FakeWebSocket.instances.push(this)
        queueMicrotask(() => this.onopen?.())
      }

      send(data: string) {
        this.sent.push(data)
        if (this.sent.length === 2) {
          queueMicrotask(() => this.onmessage?.({ data: buildAudioFrame([1, 2]) }))
          queueMicrotask(() => this.onmessage?.({ data: [buildAudioFrame([3, 4])] }))
          queueMicrotask(() => this.onmessage?.({ data: buildTurnEndFrame() }))
        }
      }

      close() {}
    }

    const result = await generateEdgeTTS(
      "Hello <world>",
      { voice: "en-US-JennyNeural", speed: 1.1 },
      {},
      FakeWebSocket as unknown as WebSocketLikeConstructor,
    )

    const instance = FakeWebSocket.instances[0]

    expect(instance.url).toContain("wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1")
    expect(instance.url).toContain("Sec-MS-GEC=")
    expect(instance.url).toContain("Sec-MS-GEC-Version=")
    expect(instance.options?.headers?.Origin).toBe("chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold")
    expect(instance.options?.headers?.Cookie).toContain("muid=")
    expect(instance.sent).toHaveLength(2)
    expect(instance.sent[1]).toContain("<voice name='en-US-JennyNeural'>")
    expect(instance.sent[1]).toContain("<prosody rate='+10%'>Hello &lt;world&gt;</prosody>")
    expect(Array.from(new Uint8Array(result.audio))).toEqual([1, 2, 3, 4])
    expect(result.mimeType).toBe("audio/mpeg")
  })

  it("retries with the default voice when a selected voice closes before audio", async () => {
    class FakeWebSocket implements WebSocketLike {
      static instances: FakeWebSocket[] = []

      onopen: (() => void) | null = null
      onmessage: ((event: { data: string | Uint8Array | ArrayBuffer | Blob | Uint8Array[] }) => void) | null = null
      onerror: ((event?: unknown) => void) | null = null
      onclose: (() => void) | null = null
      sent: string[] = []

      constructor() {
        FakeWebSocket.instances.push(this)
        queueMicrotask(() => this.onopen?.())
      }

      send(data: string) {
        this.sent.push(data)
        if (this.sent.length !== 2) return

        if (FakeWebSocket.instances.length === 1) {
          queueMicrotask(() => this.onclose?.())
          return
        }

        queueMicrotask(() => this.onmessage?.({ data: buildAudioFrame([5, 6]) }))
        queueMicrotask(() => this.onmessage?.({ data: buildTurnEndFrame() }))
      }

      close() {}
    }

    const result = await generateEdgeTTS(
      "Hello",
      { voice: "en-US-DavisNeural" },
      {},
      FakeWebSocket as unknown as WebSocketLikeConstructor,
    )

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(FakeWebSocket.instances[0].sent[1]).toContain("<voice name='en-US-DavisNeural'>")
    expect(FakeWebSocket.instances[1].sent[1]).toContain("<voice name='en-US-AriaNeural'>")
    expect(Array.from(new Uint8Array(result.audio))).toEqual([5, 6])
  })
})