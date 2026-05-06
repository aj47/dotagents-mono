import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Config } from "./types"

const mockWriteAgentsLayerFromConfig = vi.fn()
const mockSafeReadJsonFileSync = vi.fn((_filePath?: string) => ({}))
const mockSafeWriteJsonFileSync = vi.fn()

vi.mock("./agents-files/modular-config", async () => {
  const actual = await vi.importActual("./agents-files/modular-config") as Record<string, unknown>
  return {
    ...actual,
    findAgentsDirUpward: vi.fn(() => null),
    loadMergedAgentsConfig: vi.fn(() => ({ merged: {}, hasAnyAgentsFiles: false })),
    writeAgentsLayerFromConfig: mockWriteAgentsLayerFromConfig,
  }
})

vi.mock("./agents-files/safe-file", async () => {
  const actual = await vi.importActual("./agents-files/safe-file") as Record<string, unknown>
  return {
    ...actual,
    safeReadJsonFileSync: mockSafeReadJsonFileSync,
    safeWriteJsonFileSync: mockSafeWriteJsonFileSync,
  }
})

// Mock PathResolver so config module can resolve paths
vi.mock("./service-container", async () => {
  const actual = await vi.importActual("./service-container") as Record<string, unknown>
  const { ServiceContainer, ServiceTokens } = actual as {
    ServiceContainer: new () => { register: (token: string, instance: unknown) => void; resolve: <T>(token: string) => T; has: (token: string) => boolean; tryResolve: <T>(token: string) => T | undefined }
    ServiceTokens: Record<string, string>
  }
  const testContainer = new ServiceContainer()
  testContainer.register(ServiceTokens.PathResolver, {
    getUserDataPath: () => "/tmp/dotagents-test",
    getConfigPath: () => "/tmp/dotagents-test",
    getAppDataPath: () => "/tmp",
    getTempPath: () => "/tmp",
    getHomePath: () => "/tmp/home",
    getDesktopPath: () => "/tmp/home/Desktop",
    getDownloadsPath: () => "/tmp/home/Downloads",
    getLogsPath: () => "/tmp/logs",
  })
  return {
    ...actual,
    container: testContainer,
  }
})

describe("config persistence", () => {
  beforeEach(() => {
    process.env.APP_ID = "dotagents-test"
    vi.clearAllMocks()
    mockWriteAgentsLayerFromConfig.mockReset()
    mockSafeReadJsonFileSync.mockReset()
    mockSafeReadJsonFileSync.mockReturnValue({})
    mockSafeWriteJsonFileSync.mockReset()
  })

  it("uses shared text-to-speech defaults for generated config", async () => {
    const { ConfigStore } = await import("./config")
    const {
      DEFAULT_SUPERTONIC_TTS_LANGUAGE,
      DEFAULT_SUPERTONIC_TTS_STEPS,
      getTextToSpeechModelDefault,
      getTextToSpeechSpeedDefault,
      getTextToSpeechVoiceDefault,
    } = await import("@dotagents/shared/text-to-speech-settings")

    const config = new ConfigStore().get()

    expect(config.openaiTtsModel).toBe(getTextToSpeechModelDefault("openai"))
    expect(config.openaiTtsVoice).toBe(getTextToSpeechVoiceDefault("openai"))
    expect(config.openaiTtsSpeed).toBe(getTextToSpeechSpeedDefault("openai"))
    expect(config.groqTtsModel).toBe(getTextToSpeechModelDefault("groq"))
    expect(config.groqTtsVoice).toBe(getTextToSpeechVoiceDefault("groq"))
    expect(config.geminiTtsModel).toBe(getTextToSpeechModelDefault("gemini"))
    expect(config.geminiTtsVoice).toBe(getTextToSpeechVoiceDefault("gemini"))
    expect(config.supertonicVoice).toBe(getTextToSpeechVoiceDefault("supertonic"))
    expect(config.supertonicLanguage).toBe(DEFAULT_SUPERTONIC_TTS_LANGUAGE)
    expect(config.supertonicSpeed).toBe(getTextToSpeechSpeedDefault("supertonic"))
    expect(config.supertonicSteps).toBe(DEFAULT_SUPERTONIC_TTS_STEPS)
  })

  it("migrates deprecated Groq Arabic TTS settings to shared defaults", async () => {
    const { ConfigStore } = await import("./config")
    const {
      DEFAULT_GROQ_ARABIC_TTS_VOICE,
      GROQ_ARABIC_TTS_MODEL,
    } = await import("@dotagents/shared/text-to-speech-settings")

    mockSafeReadJsonFileSync.mockImplementation((filePath) => (
      String(filePath).endsWith("config.json")
        ? { groqTtsModel: "playai-tts-arabic", groqTtsVoice: "troy" }
        : {}
    ))

    const config = new ConfigStore().get()

    expect(config.groqTtsModel).toBe(GROQ_ARABIC_TTS_MODEL)
    expect(config.groqTtsVoice).toBe(DEFAULT_GROQ_ARABIC_TTS_VOICE)
  })

  it("falls back to the legacy config file when writing .agents files fails", async () => {
    mockWriteAgentsLayerFromConfig.mockImplementation(() => {
      throw new Error("EACCES: permission denied")
    })

    const { persistConfigToDisk } = await import("./config")

    const result = persistConfigToDisk({ launchAtLogin: true } as Config)

    expect(result).toEqual({
      savedToAgentsLayer: false,
      savedToLegacyConfig: true,
    })
    expect(mockSafeWriteJsonFileSync).toHaveBeenCalled()
  })

  it("throws when every persistence target fails", async () => {
    mockWriteAgentsLayerFromConfig.mockImplementation(() => {
      throw new Error("EACCES: permission denied")
    })
    mockSafeWriteJsonFileSync.mockImplementation(() => {
      throw new Error("ENOSPC: no space left on device")
    })

    const { persistConfigToDisk } = await import("./config")

    expect(() => persistConfigToDisk({ launchAtLogin: true } as Config)).toThrow(
      /Failed to save settings to disk/,
    )
  })

  it("succeeds when both persistence targets work", async () => {
    const { persistConfigToDisk } = await import("./config")

    const result = persistConfigToDisk({ launchAtLogin: true } as Config)

    expect(result).toEqual({
      savedToAgentsLayer: true,
      savedToLegacyConfig: true,
    })
    expect(mockWriteAgentsLayerFromConfig).toHaveBeenCalled()
    expect(mockSafeWriteJsonFileSync).toHaveBeenCalled()
  })
})
