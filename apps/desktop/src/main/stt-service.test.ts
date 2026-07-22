import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Config } from "../shared/types"

const parakeetMocks = vi.hoisted(() => ({
  initializeRecognizer: vi.fn(async () => undefined),
  isModelReady: vi.fn(() => true),
  transcribe: vi.fn(async () => "local transcript"),
}))

vi.mock("./parakeet-stt", () => parakeetMocks)
vi.mock("./llm", () => ({ postProcessTranscript: vi.fn(async (text: string) => text) }))
vi.mock("./debug", () => ({ logLLM: vi.fn() }))

import { transcribeAudioWithConfiguredProvider } from "./stt-service"

function config(overrides: Partial<Config>): Config {
  return {
    transcriptPostProcessingEnabled: false,
    ...overrides,
  } as Config
}

describe("transcribeAudioWithConfiguredProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    parakeetMocks.initializeRecognizer.mockClear()
    parakeetMocks.isModelReady.mockReturnValue(true)
    parakeetMocks.transcribe.mockClear()
  })

  it.each([
    ["openai", "openaiApiKey", "https://api.openai.test/v1", "openaiBaseUrl"],
    ["groq", "groqApiKey", "https://api.groq.test/openai/v1", "groqBaseUrl"],
  ] as const)("wraps Mentra PCM as WAV for %s", async (provider, apiKeyField, baseUrl, baseUrlField) => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const form = init?.body as FormData
      const file = form.get("file") as File
      expect(file.type).toBe("audio/wav")
      expect(file.name).toBe("mentra-glasses.wav")
      expect(Buffer.from(await file.arrayBuffer()).toString("ascii", 0, 4)).toBe("RIFF")
      return new Response(JSON.stringify({ text: `${provider} transcript` }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await transcribeAudioWithConfiguredProvider({
      audio: Buffer.from([0, 0, 255, 127]),
      encoding: "pcm_s16le",
    }, config({
      sttProviderId: provider,
      [apiKeyField]: "secret",
      [baseUrlField]: baseUrl,
    }))

    expect(result.provider).toBe(provider)
    expect(result.text).toBe(`${provider} transcript`)
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/audio/transcriptions`, expect.any(Object))
    vi.unstubAllGlobals()
  })

  it("routes decoded PCM to the local Parakeet recognizer", async () => {
    const result = await transcribeAudioWithConfiguredProvider({
      audio: Buffer.from([0, 0, 255, 127]),
      encoding: "pcm_s16le",
    }, config({ sttProviderId: "parakeet", parakeetNumThreads: 4 }))

    expect(parakeetMocks.initializeRecognizer).toHaveBeenCalledWith(4)
    expect(parakeetMocks.transcribe).toHaveBeenCalledWith(expect.any(ArrayBuffer), 16_000)
    expect(result).toEqual({ text: "local transcript", provider: "parakeet" })
  })

  it("rejects compressed mobile recordings for Parakeet", async () => {
    await expect(transcribeAudioWithConfiguredProvider({
      audio: Buffer.from([1, 2]),
      encoding: "encoded",
    }, config({ sttProviderId: "parakeet" }))).rejects.toThrow("decoded 16 kHz mono PCM")
  })
})
