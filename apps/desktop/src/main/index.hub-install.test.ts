import { afterEach, describe, expect, it, vi } from "vitest"

const originalArgv = [...process.argv]

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

async function loadIndexForHubInstall(argv: string[]) {
  vi.resetModules()
  process.argv = argv

  const handlers = new Map<string, Function[]>()
  const createMainWindow = vi.fn()
  const createPanelWindow = vi.fn()
  const createSetupWindow = vi.fn()
  const showMainWindow = vi.fn()
  const findHubBundleInstallBundleUrl = vi.fn((candidates: readonly string[]) => {
    const deepLink = candidates.find((candidate) => typeof candidate === "string" && candidate.startsWith("dotagents://install?bundle="))
    return deepLink
      ? "https://hub.dotagentsprotocol.com/bundles/featured-agent.dotagents"
      : null
  })
  const downloadHubBundleToTempFile = vi.fn(async () => "/tmp/downloaded-featured-agent.dotagents")
  const findHubBundleHandoffFilePath = vi.fn((candidates: readonly string[]) =>
    candidates.find(
      (candidate) =>
        typeof candidate === "string"
        && candidate.endsWith(".dotagents")
        && !candidate.startsWith("dotagents://"),
    ) ?? null,
  )

  vi.doMock("electron", () => ({
    app: {
      commandLine: { appendSwitch: vi.fn() },
      whenReady: vi.fn(() => Promise.resolve()),
      on: vi.fn((event: string, handler: Function) => {
        handlers.set(event, [...(handlers.get(event) ?? []), handler])
      }),
      isReady: vi.fn(() => true),
      setLoginItemSettings: vi.fn(),
      setActivationPolicy: vi.fn(),
      getPath: vi.fn(() => "/tmp"),
      getAppPath: vi.fn(() => "/tmp/app"),
      isPackaged: false,
      dock: { show: vi.fn(), hide: vi.fn(), isVisible: vi.fn(() => true) },
      quit: vi.fn(),
    },
    Menu: { setApplicationMenu: vi.fn() },
  }))
  vi.doMock("@electron-toolkit/utils", () => ({
    electronApp: { setAppUserModelId: vi.fn() },
    optimizer: { watchWindowShortcuts: vi.fn() },
  }))
  vi.doMock("@egoist/tipc/main", () => ({ registerIpcMain: vi.fn() }))
  vi.doMock("./window", () => ({
    createMainWindow,
    createPanelWindow,
    createSetupWindow,
    makePanelWindowClosable: vi.fn(),
    setAppQuitting: vi.fn(),
    showMainWindow,
    WINDOWS: new Map(),
  }))
  vi.doMock("./keyboard", () => ({ listenToKeyboardEvents: vi.fn() }))
  vi.doMock("./tipc", () => ({ router: {}, runAgentLoopSession: vi.fn() }))
  vi.doMock("./serve", () => ({ registerServeProtocol: vi.fn(), registerServeSchema: vi.fn() }))
  vi.doMock("./menu", () => ({ createAppMenu: vi.fn(() => null) }))
  vi.doMock("./tray", () => ({ initTray: vi.fn() }))
  vi.doMock("./utils", () => ({ isAccessibilityGranted: vi.fn(() => true) }))
  vi.doMock("./mcp-service", () => ({ mcpService: { initialize: vi.fn(() => Promise.resolve()), cleanup: vi.fn(() => Promise.resolve()) } }))
  vi.doMock("./debug", () => ({ initDebugFlags: vi.fn(), logApp: vi.fn() }))
  vi.doMock("./oauth-deeplink-handler", () => ({ initializeDeepLinkHandling: vi.fn() }))
  vi.doMock("./diagnostics", () => ({ diagnosticsService: { logError: vi.fn() } }))
  vi.doMock("./config", () => ({
    configStore: {
      get: vi.fn(() => ({
        onboardingCompleted: true,
        modelPresets: [],
        currentModelPresetId: undefined,
        hideDockIcon: false,
        launchAtLogin: false,
        remoteServerEnabled: false,
        cloudflareTunnelAutoStart: false,
      })),
    },
  }))
  vi.doMock("./remote-server", () => ({
    startRemoteServer: vi.fn(() => Promise.resolve({ running: false })),
    printQRCodeToTerminal: vi.fn(),
    startRemoteServerForced: vi.fn(() => Promise.resolve({ running: false })),
    stopRemoteServer: vi.fn(() => Promise.resolve()),
  }))
  vi.doMock("./acp-service", () => ({ acpService: { initialize: vi.fn(() => Promise.resolve()), shutdown: vi.fn(() => Promise.resolve()) } }))
  vi.doMock("./agent-profile-service", () => ({ agentProfileService: { syncAgentProfilesToACPRegistry: vi.fn() } }))
  vi.doMock("./skills-service", () => ({
    initializeBundledSkills: vi.fn(() => ({ copied: [], skipped: [] })),
    skillsService: {},
    startSkillsFolderWatcher: vi.fn(),
  }))
  vi.doMock("./cloudflare-tunnel", () => ({
    startCloudflareTunnel: vi.fn(),
    startNamedCloudflareTunnel: vi.fn(),
    checkCloudflaredInstalled: vi.fn(() => Promise.resolve(false)),
  }))
  vi.doMock("./models-dev-service", () => ({ initModelsDevService: vi.fn() }))
  vi.doMock("./loop-service", () => ({ loopService: { startAllLoops: vi.fn(), stopAllLoops: vi.fn() } }))
  vi.doMock("./state", () => ({ setHeadlessMode: vi.fn() }))
  vi.doMock("./bundle-service", () => ({ findHubBundleHandoffFilePath }))
  vi.doMock("./hub-install", () => ({
    findHubBundleInstallBundleUrl,
    downloadHubBundleToTempFile,
  }))
  vi.doMock("./updater", () => ({ init: vi.fn() }))
  vi.doMock("./app-switcher", () => ({ ensureAppSwitcherPresence: vi.fn() }))
  vi.doMock("./core-wiring", () => ({
    finalizeProgressEmitterWiring: vi.fn(),
    wireLoopRunner: vi.fn(),
    wireACPBackgroundNotifierRunner: vi.fn(),
    setSystemPromptAdditionsFn: vi.fn(),
  }))

  await import("./index")
  await flushPromises()

  return {
    handlers,
    createMainWindow,
    showMainWindow,
    downloadHubBundleToTempFile,
  }
}

afterEach(() => {
  process.argv = [...originalArgv]
  vi.restoreAllMocks()
  vi.resetModules()
})

describe("Hub install handoff routing", () => {
  it("opens settings/agents with installBundle when launched with a .dotagents argv path", async () => {
    const bundlePath = "/tmp/from-startup.dotagents"
    const { createMainWindow } = await loadIndexForHubInstall(["electron", bundlePath])

    expect(createMainWindow).toHaveBeenCalledWith({
      url: `/settings/agents?installBundle=${encodeURIComponent(bundlePath)}`,
    })
  })

  it("downloads startup Hub install deep links before opening settings/agents", async () => {
    const deepLink =
      "dotagents://install?bundle=https%3A%2F%2Fhub.dotagentsprotocol.com%2Fbundles%2Ffeatured-agent.dotagents"
    const { createMainWindow, downloadHubBundleToTempFile } = await loadIndexForHubInstall(["electron", deepLink])

    expect(downloadHubBundleToTempFile).toHaveBeenCalledWith(
      "https://hub.dotagentsprotocol.com/bundles/featured-agent.dotagents",
    )
    expect(createMainWindow).toHaveBeenCalledWith({
      url: `/settings/agents?installBundle=${encodeURIComponent("/tmp/downloaded-featured-agent.dotagents")}`,
    })
  })

  it("routes open-file and second-instance bundle handoffs into showMainWindow", async () => {
    const bundlePath = "/tmp/from-handoff.dotagents"
    const { handlers, showMainWindow } = await loadIndexForHubInstall(["electron"])

    showMainWindow.mockClear()
    const openFileHandler = handlers.get("open-file")?.[0] as ((event: { preventDefault: () => void }, filePath: string) => void)
    const secondInstanceHandler = handlers.get("second-instance")?.[0] as ((event: unknown, commandLine: string[]) => void)

    const event = { preventDefault: vi.fn() }
    openFileHandler(event, bundlePath)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(showMainWindow).toHaveBeenCalledWith(`/settings/agents?installBundle=${encodeURIComponent(bundlePath)}`)

    showMainWindow.mockClear()
    secondInstanceHandler({}, ["DotAgents", bundlePath])
    expect(showMainWindow).toHaveBeenCalledWith(`/settings/agents?installBundle=${encodeURIComponent(bundlePath)}`)
  })

  it("downloads Hub install deep links received via open-url and routes them into showMainWindow", async () => {
    const deepLink =
      "dotagents://install?bundle=https%3A%2F%2Fhub.dotagentsprotocol.com%2Fbundles%2Ffeatured-agent.dotagents"
    const { handlers, showMainWindow, downloadHubBundleToTempFile } = await loadIndexForHubInstall(["electron"])

    showMainWindow.mockClear()
    const openUrlHandler = handlers.get("open-url")?.[0] as ((event: { preventDefault: () => void }, url: string) => void)

    const event = { preventDefault: vi.fn() }
    openUrlHandler(event, deepLink)
    await flushPromises()

    expect(event.preventDefault).toHaveBeenCalled()
    expect(downloadHubBundleToTempFile).toHaveBeenCalledWith(
      "https://hub.dotagentsprotocol.com/bundles/featured-agent.dotagents",
    )
    expect(showMainWindow).toHaveBeenCalledWith(
      `/settings/agents?installBundle=${encodeURIComponent("/tmp/downloaded-featured-agent.dotagents")}`,
    )
  })
})