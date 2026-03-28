import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Config } from "../shared/types"

const kittenSynthesizeMock = vi.fn()
const supertonicSynthesizeMock = vi.fn()
const diagnosticsLogErrorMock = vi.fn()
const configStoreGetMock = vi.fn(() => ({}))
const preprocessTextForTTSWithLLMMock = vi.fn()

vi.mock("./config", () => ({
  configStore: {
    get: configStoreGetMock,
  },
}))

vi.mock("./diagnostics", () => ({
  diagnosticsService: {
    logError: diagnosticsLogErrorMock,
  },
}))

vi.mock("./tts-llm-preprocessing", () => ({
  preprocessTextForTTSWithLLM: preprocessTextForTTSWithLLMMock,
}))

vi.mock("./kitten-tts", () => ({
  synthesize: kittenSynthesizeMock,
}))

vi.mock("./supertonic-tts", () => ({
  synthesize: supertonicSynthesizeMock,
}))

const speechManagementModule = import("./speech-management")

function createConfig(overrides: Partial<Config> = {}): Config {
  return {
    ttsEnabled: true,
    ttsPreprocessingEnabled: false,
    ttsProviderId: "kitten",
    kittenVoiceId: 5,
    supertonicVoice: "tara",
    supertonicLanguage: "en",
    supertonicSpeed: 1.1,
    supertonicSteps: 7,
    ...overrides,
  } as Config
}

describe("speech management", () => {
  beforeEach(() => {
    kittenSynthesizeMock.mockReset()
    supertonicSynthesizeMock.mockReset()
    diagnosticsLogErrorMock.mockReset()
    configStoreGetMock.mockReset()
    preprocessTextForTTSWithLLMMock.mockReset()
    configStoreGetMock.mockReturnValue(createConfig())
  })

  it("routes shared speech generation through the configured TTS provider defaults", async () => {
    kittenSynthesizeMock.mockResolvedValue({
      samples: new Float32Array([0, 0.25, -0.25]),
      sampleRate: 24000,
    })

    const { generateManagedSpeech } = await speechManagementModule
    const result = await generateManagedSpeech(
      { text: "Hello world" },
      createConfig(),
    )

    expect(result.provider).toBe("kitten")
    expect(result.processedText).toBe("Hello world")
    expect(result.mimeType).toBe("audio/wav")
    expect(result.audio.byteLength).toBeGreaterThan(44)
    expect(kittenSynthesizeMock).toHaveBeenCalledWith("Hello world", 5, undefined)
  })

  it("rejects shared speech generation when TTS is disabled", async () => {
    const { generateManagedSpeech } = await speechManagementModule

    await expect(
      generateManagedSpeech({ text: "Muted" }, createConfig({ ttsEnabled: false })),
    ).rejects.toThrow("Text-to-Speech is not enabled")
  })

  it("shares Kitten preview synthesis with configured desktop defaults", async () => {
    kittenSynthesizeMock.mockResolvedValue({
      samples: new Float32Array([0, 0.5]),
      sampleRate: 22050,
    })

    const { synthesizeManagedKittenSpeech } = await speechManagementModule
    const result = await synthesizeManagedKittenSpeech(
      { text: "Preview" },
      createConfig({ kittenVoiceId: 12 }),
    )

    expect(result.mimeType).toBe("audio/wav")
    expect(result.sampleRate).toBe(22050)
    expect(kittenSynthesizeMock).toHaveBeenCalledWith("Preview", 12, undefined)
  })

  it("shares Supertonic preview synthesis with configured desktop defaults", async () => {
    supertonicSynthesizeMock.mockResolvedValue({
      samples: new Float32Array([0, 0.5]),
      sampleRate: 32000,
    })

    const { synthesizeManagedSupertonicSpeech } = await speechManagementModule
    const result = await synthesizeManagedSupertonicSpeech(
      { text: "Preview" },
      createConfig({
        supertonicVoice: "nova",
        supertonicLanguage: "fr",
        supertonicSpeed: 0.9,
        supertonicSteps: 4,
      }),
    )

    expect(result.mimeType).toBe("audio/wav")
    expect(result.sampleRate).toBe(32000)
    expect(supertonicSynthesizeMock).toHaveBeenCalledWith(
      "Preview",
      "nova",
      "fr",
      0.9,
      4,
    )
  })

  it("logs shared TTS failures once before surfacing them", async () => {
    const ttsError = new Error("local synth failed")
    kittenSynthesizeMock.mockRejectedValue(ttsError)

    const { generateManagedSpeech } = await speechManagementModule

    await expect(
      generateManagedSpeech({ text: "Hello world" }, createConfig()),
    ).rejects.toThrow("local synth failed")
    expect(diagnosticsLogErrorMock).toHaveBeenCalledWith(
      "tts",
      "TTS generation failed",
      ttsError,
    )
  })
})
