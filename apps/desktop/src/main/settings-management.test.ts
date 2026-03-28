import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Config } from "../shared/types"

let currentConfig: Config = {}

const saveMock = vi.fn((nextConfig: Config) => {
  currentConfig = nextConfig
})
const reloadMock = vi.fn()
const getAllMock = vi.fn()
const getExternalAgentsMock = vi.fn()
const syncConfiguredRemoteAccessMock = vi.fn()
const restartServerMock = vi.fn(async () => undefined)
const stopServerMock = vi.fn(async () => undefined)
const clearModelsCacheMock = vi.fn()
const reinitializeLangfuseMock = vi.fn()
const cleanupInvalidMcpServerReferencesInLayersMock = vi.fn(() => ({
  updatedProfileIds: [],
}))
const getAgentsLayerPathsMock = vi.fn((agentsDir: string) => ({ agentsDir }))

const appMock = {
  setLoginItemSettings: vi.fn(),
  setActivationPolicy: vi.fn(),
  dock: {
    hide: vi.fn(),
    show: vi.fn(),
  },
}

vi.mock("electron", () => ({
  app: appMock,
}))

vi.mock("./config", () => ({
  configStore: {
    get: vi.fn(() => currentConfig),
    save: saveMock,
  },
  globalAgentsFolder: "/tmp/global-agents",
  resolveWorkspaceAgentsFolder: vi.fn(() => "/tmp/workspace-agents"),
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getAll: getAllMock,
    getExternalAgents: getExternalAgentsMock,
    reload: reloadMock,
  },
}))

vi.mock("./remote-access-runtime", () => ({
  syncConfiguredRemoteAccess: syncConfiguredRemoteAccessMock,
}))

vi.mock("./mcp-service", () => ({
  WHATSAPP_SERVER_NAME: "whatsapp",
  getInternalWhatsAppServerPath: vi.fn(() => "/internal/whatsapp.js"),
  mcpService: {
    restartServer: restartServerMock,
    stopServer: stopServerMock,
  },
}))

vi.mock("./models-service", () => ({
  clearModelsCache: clearModelsCacheMock,
}))

vi.mock("./langfuse-service", () => ({
  reinitializeLangfuse: reinitializeLangfuseMock,
}))

vi.mock("./agent-profile-mcp-cleanup", () => ({
  cleanupInvalidMcpServerReferencesInLayers:
    cleanupInvalidMcpServerReferencesInLayersMock,
}))

vi.mock("./agents-files/modular-config", () => ({
  getAgentsLayerPaths: getAgentsLayerPathsMock,
}))

const settingsManagementModule = import("./settings-management")

describe("settings management", () => {
  beforeEach(() => {
    currentConfig = {}
    saveMock.mockClear()
    reloadMock.mockClear()
    getAllMock.mockReset()
    getExternalAgentsMock.mockReset()
    syncConfiguredRemoteAccessMock.mockReset()
    restartServerMock.mockReset()
    stopServerMock.mockReset()
    clearModelsCacheMock.mockReset()
    reinitializeLangfuseMock.mockReset()
    cleanupInvalidMcpServerReferencesInLayersMock.mockClear()
    getAgentsLayerPathsMock.mockClear()
    appMock.setLoginItemSettings.mockClear()
    appMock.setActivationPolicy.mockClear()
    appMock.dock.hide.mockClear()
    appMock.dock.show.mockClear()
    Reflect.deleteProperty(process.env, "IS_MAC")
  })

  it("builds a normalized shared settings snapshot with masked secrets and shared ACP options", async () => {
    const { getManagedSettingsSnapshot } = await settingsManagementModule

    currentConfig = {
      mcpToolsProviderId: "groq",
      mcpToolsGroqModel: "qwen-qwq-32b",
      currentModelPresetId: "ops",
      modelPresets: [
        {
          id: "ops",
          name: "Ops",
          baseUrl: "https://models.example.com",
          apiKeyEnvVar: "OPS_API_KEY",
        },
      ] as any,
      predefinedPrompts: [
        {
          id: "prompt-1",
          name: "Triage",
          content: "Summarize the issue",
          createdAt: 1,
          updatedAt: 2,
        },
      ],
      sttProviderId: "groq",
      groqSttModel: "whisper-large-v3",
      ttsProviderId: "openai",
      openaiTtsModel: "gpt-4o-mini-tts",
      openaiTtsVoice: "shimmer",
      openaiTtsSpeed: 1.5,
      mainAgentMode: "acp",
      mainAgentName: "legacy-stdio",
      remoteServerEnabled: true,
      remoteServerPort: 4545,
      remoteServerBindAddress: "0.0.0.0",
      remoteServerApiKey: "super-secret",
      remoteServerLogLevel: "debug",
      remoteServerCorsOrigins: ["http://localhost:8081"],
      remoteServerAutoShowPanel: true,
      remoteServerTerminalQrEnabled: true,
      langfuseSecretKey: "langfuse-secret",
      pinnedSessionIds: ["conversation-1"],
      archivedSessionIds: ["conversation-2"],
    }

    getAllMock.mockReturnValue([
      {
        id: "planner",
        name: "planner",
        displayName: "Planner",
        enabled: true,
        connection: { type: "acp" },
      },
    ])
    getExternalAgentsMock.mockReturnValue([
      {
        name: "legacy-stdio",
        displayName: "Legacy Stdio",
        enabled: true,
        connection: { type: "stdio" },
      },
    ])

    expect(getManagedSettingsSnapshot()).toEqual(
      expect.objectContaining({
        mcpToolsProviderId: "groq",
        mcpToolsGroqModel: "qwen-qwq-32b",
        currentModelPresetId: "ops",
        openaiTtsModel: "gpt-4o-mini-tts",
        openaiTtsVoice: "shimmer",
        openaiTtsSpeed: 1.5,
        groqSttModel: "whisper-large-v3",
        mainAgentMode: "acp",
        mainAgentName: "legacy-stdio",
        remoteServerEnabled: true,
        remoteServerPort: 4545,
        remoteServerBindAddress: "0.0.0.0",
        remoteServerApiKey: "••••••••",
        remoteServerLogLevel: "debug",
        remoteServerCorsOrigins: ["http://localhost:8081"],
        remoteServerAutoShowPanel: true,
        remoteServerTerminalQrEnabled: true,
        langfuseSecretKey: "••••••••",
        pinnedSessionIds: ["conversation-1"],
        archivedSessionIds: ["conversation-2"],
        acpAgents: [
          { name: "planner", displayName: "Planner" },
          { name: "legacy-stdio", displayName: "Legacy Stdio" },
        ],
      }),
    )
  })

  it("filters and normalizes shared settings updates through one helper", async () => {
    const { getManagedSettingsUpdates } = await settingsManagementModule

    currentConfig = {
      modelPresets: [
        {
          id: "valid-preset",
          name: "Valid",
          baseUrl: "https://valid.example.com",
          apiKeyEnvVar: "VALID_API_KEY",
        },
      ] as any,
    }

    expect(
      getManagedSettingsUpdates({
        mcpMaxIterations: 7.9,
        currentModelPresetId: "valid-preset",
        invalidPresetId: "ignored",
        remoteServerEnabled: true,
        remoteServerPort: 4545.8,
        remoteServerBindAddress: "0.0.0.0",
        remoteServerApiKey: "••••••••",
        remoteServerLogLevel: "debug",
        remoteServerCorsOrigins: ["http://localhost:8081", 42],
        pinnedSessionIds: ["conversation-1", 42],
        archivedSessionIds: ["conversation-2", null],
        langfuseSecretKey: "••••••••",
        whatsappAllowFrom: ["15551234567", 100],
        ttsProviderId: "supertonic",
        notARealField: true,
      }),
    ).toEqual({
      mcpMaxIterations: 7,
      currentModelPresetId: "valid-preset",
      remoteServerEnabled: true,
      remoteServerPort: 4545,
      remoteServerBindAddress: "0.0.0.0",
      remoteServerLogLevel: "debug",
      remoteServerCorsOrigins: ["http://localhost:8081"],
      pinnedSessionIds: ["conversation-1"],
      archivedSessionIds: ["conversation-2"],
      whatsappAllowFrom: ["15551234567"],
      ttsProviderId: "supertonic",
    })
  })

  it("persists config changes through the shared side-effect path", async () => {
    const { saveManagedConfig } = await settingsManagementModule

    currentConfig = {
      openaiBaseUrl: "https://old-openai.example.com",
      langfuseEnabled: false,
      langfuseSecretKey: "",
      whatsappEnabled: false,
      remoteServerEnabled: false,
      remoteServerApiKey: "old-api-key",
      remoteServerPort: 3001,
      mcpConfig: { mcpServers: {} },
      launchAtLogin: false,
      hideDockIcon: false,
    }

    process.env.IS_MAC = true as any

    const result = await saveManagedConfig(
      {
        openaiBaseUrl: "https://new-openai.example.com",
        langfuseEnabled: true,
        langfuseSecretKey: "new-secret",
        whatsappEnabled: true,
        whatsappAutoReply: true,
        whatsappAllowFrom: ["15551234567"],
        remoteServerEnabled: true,
        remoteServerApiKey: "new-api-key",
        launchAtLogin: true,
        hideDockIcon: true,
      },
      { remoteAccessLabel: "settings-test" },
    )

    expect(result.updatedKeys).toEqual([
      "openaiBaseUrl",
      "langfuseEnabled",
      "langfuseSecretKey",
      "whatsappEnabled",
      "whatsappAutoReply",
      "whatsappAllowFrom",
      "remoteServerEnabled",
      "remoteServerApiKey",
      "launchAtLogin",
      "hideDockIcon",
    ])
    expect(clearModelsCacheMock).toHaveBeenCalledTimes(1)
    expect(reinitializeLangfuseMock).toHaveBeenCalledTimes(1)
    expect(syncConfiguredRemoteAccessMock).toHaveBeenCalledWith({
      label: "settings-test",
      previousConfig: expect.objectContaining({
        remoteServerEnabled: false,
        remoteServerApiKey: "old-api-key",
      }),
      nextConfig: expect.objectContaining({
        remoteServerEnabled: true,
        remoteServerApiKey: "new-api-key",
      }),
    })
    expect(restartServerMock).toHaveBeenCalledWith("whatsapp")
    expect(stopServerMock).not.toHaveBeenCalled()
    expect(currentConfig.mcpConfig?.mcpServers?.whatsapp).toEqual({
      command: "node",
      args: ["/internal/whatsapp.js"],
      transport: "stdio",
    })
    expect(appMock.setActivationPolicy).toHaveBeenCalledWith("accessory")
    expect(appMock.dock.hide).toHaveBeenCalledTimes(1)

    if (process.platform !== "linux") {
      expect(appMock.setLoginItemSettings).toHaveBeenCalledWith({
        openAtLogin: true,
        openAsHidden: true,
      })
    }
  })
})
