import { beforeEach, describe, expect, it, vi } from "vitest"

const fetchAvailableModelsMock = vi.fn()
const fetchModelsForPresetMock = vi.fn()
const fetchModelsDevDataMock = vi.fn()
const findBestModelMatchMock = vi.fn()
const getModelFromModelsDevByProviderIdMock = vi.fn()
const refreshModelsDevCacheMock = vi.fn()

vi.mock("./models-service", () => ({
  fetchAvailableModels: fetchAvailableModelsMock,
  fetchModelsForPreset: fetchModelsForPresetMock,
}))

vi.mock("./models-dev-service", () => ({
  fetchModelsDevData: fetchModelsDevDataMock,
  findBestModelMatch: findBestModelMatchMock,
  getModelFromModelsDevByProviderId: getModelFromModelsDevByProviderIdMock,
  refreshModelsDevCache: refreshModelsDevCacheMock,
}))

const modelManagementModule = import("./model-management")

describe("model management", () => {
  beforeEach(() => {
    fetchAvailableModelsMock.mockReset()
    fetchModelsForPresetMock.mockReset()
    fetchModelsDevDataMock.mockReset()
    findBestModelMatchMock.mockReset()
    getModelFromModelsDevByProviderIdMock.mockReset()
    refreshModelsDevCacheMock.mockReset()
  })

  it("validates provider IDs before fetching shared provider model catalogs", async () => {
    const { getManagedAvailableModels } = await modelManagementModule

    fetchAvailableModelsMock.mockResolvedValue([
      { id: "gpt-5", name: "GPT-5" },
    ])

    await expect(getManagedAvailableModels("openai")).resolves.toEqual([
      { id: "gpt-5", name: "GPT-5" },
    ])
    expect(fetchAvailableModelsMock).toHaveBeenCalledWith("openai")

    await expect(getManagedAvailableModels("anthropic")).rejects.toThrow(
      "Invalid provider: anthropic. Valid providers: openai, groq, gemini",
    )
    expect(fetchAvailableModelsMock).toHaveBeenCalledTimes(1)
  })

  it("forwards preset-scoped model fetches through one helper", async () => {
    const { getManagedPresetModels } = await modelManagementModule

    fetchModelsForPresetMock.mockResolvedValue([
      { id: "custom-model", name: "Custom Model" },
    ])

    await expect(
      getManagedPresetModels("https://models.example.com/v1", "secret"),
    ).resolves.toEqual([{ id: "custom-model", name: "Custom Model" }])
    expect(fetchModelsForPresetMock).toHaveBeenCalledWith(
      "https://models.example.com/v1",
      "secret",
    )
  })

  it("uses provider-specific and fuzzy models.dev lookups through one helper", async () => {
    const { getManagedModelInfo } = await modelManagementModule

    getModelFromModelsDevByProviderIdMock.mockReturnValueOnce({
      id: "gpt-5",
      name: "GPT-5",
    })
    findBestModelMatchMock.mockReturnValueOnce({
      providerId: "openrouter",
      matchType: "fuzzy",
      score: 0.99,
      model: {
        id: "claude-sonnet-4",
        name: "Claude Sonnet 4",
      },
    })

    expect(getManagedModelInfo("gpt-5", "openai")).toEqual({
      id: "gpt-5",
      name: "GPT-5",
    })
    expect(getModelFromModelsDevByProviderIdMock).toHaveBeenCalledWith(
      "gpt-5",
      "openai",
    )

    expect(getManagedModelInfo("claude-sonnet-4")).toEqual({
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    })
    expect(findBestModelMatchMock).toHaveBeenCalledWith("claude-sonnet-4")
  })

  it("shares models.dev cache reads and refreshes through one helper", async () => {
    const {
      getManagedModelsDevData,
      refreshManagedModelsDevData,
    } = await modelManagementModule

    fetchModelsDevDataMock.mockResolvedValue({
      openai: {
        id: "openai",
        name: "OpenAI",
        models: { "gpt-5": { id: "gpt-5", name: "GPT-5" } },
      },
    })

    await expect(getManagedModelsDevData()).resolves.toEqual({
      openai: {
        id: "openai",
        name: "OpenAI",
        models: { "gpt-5": { id: "gpt-5", name: "GPT-5" } },
      },
    })

    await expect(refreshManagedModelsDevData()).resolves.toEqual({
      success: true,
    })
    expect(refreshModelsDevCacheMock).toHaveBeenCalledTimes(1)
  })
})
