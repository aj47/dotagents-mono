import { afterEach, describe, expect, it, vi } from "vitest"
import type { Config } from "../shared/types"
import { generateTTS } from "./tts-service"

vi.mock("./tts-llm-preprocessing", () => ({
  preprocessTextForTTSWithLLM: async (text: string) => text,
}))

const originalFetch = globalThis.fetch

function arrayBufferFromBytes(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("tts-service", () => {
  it("dispatches OpenAI TTS generation through the shared provider implementation", async () => {
    const calls: Array<{ url: string; body: unknown; headers: HeadersInit | undefined }> = []
    globalThis.fetch = (async (url, init) => {
      calls.push({
        url: String(url),
        body: JSON.parse(String(init?.body)),
        headers: init?.headers,
      })
      return {
        ok: true,
        statusText: "OK",
        text: async () => "",
        arrayBuffer: async () => arrayBufferFromBytes([9, 8, 7]),
        json: async () => ({}),
      } as Response
    }) as typeof fetch

    const result = await generateTTS(
      { text: "Hello", providerId: "openai", voice: "nova", speed: 1.2 },
      {
        openaiApiKey: "key",
        openaiBaseUrl: "https://api.example/v1",
        openaiTtsResponseFormat: "aac",
        ttsPreprocessingEnabled: false,
      } as Config,
    )

    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual({
      url: "https://api.example/v1/audio/speech",
      headers: {
        Authorization: "Bearer key",
        "Content-Type": "application/json",
      },
      body: {
        model: "gpt-4o-mini-tts",
        input: "Hello",
        voice: "nova",
        speed: 1.2,
        response_format: "aac",
      },
    })
    expect(Array.from(new Uint8Array(result.audio))).toEqual([9, 8, 7])
    expect(result.mimeType).toBe("audio/aac")
    expect(result.processedText).toBe("Hello")
    expect(result.provider).toBe("openai")
  })
})
