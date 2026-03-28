import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  registerIpcMain: vi.fn(),
  registerServeProtocol: vi.fn(),
  mcpInitialize: vi.fn(),
  mcpCleanup: vi.fn(),
  startAllLoops: vi.fn(),
  stopAllLoops: vi.fn(),
  acpInitialize: vi.fn(),
  acpShutdown: vi.fn(),
  syncAgentProfilesToACPRegistry: vi.fn(),
  initializeBundledSkills: vi.fn(),
  startSkillsFolderWatcher: vi.fn(),
  initModelsDevService: vi.fn(),
  stopRemoteServer: vi.fn(),
  logApp: vi.fn(),
  router: { name: "router" },
}))

vi.mock("@egoist/tipc/main", () => ({
  registerIpcMain: mocks.registerIpcMain,
}))

vi.mock("./serve", () => ({
  registerServeProtocol: mocks.registerServeProtocol,
}))

vi.mock("./mcp-service", () => ({
  mcpService: {
    initialize: mocks.mcpInitialize,
    cleanup: mocks.mcpCleanup,
  },
}))

vi.mock("./loop-service", () => ({
  loopService: {
    startAllLoops: mocks.startAllLoops,
    stopAllLoops: mocks.stopAllLoops,
  },
}))

vi.mock("./acp-service", () => ({
  acpService: {
    initialize: mocks.acpInitialize,
    shutdown: mocks.acpShutdown,
  },
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    syncAgentProfilesToACPRegistry: mocks.syncAgentProfilesToACPRegistry,
  },
}))

vi.mock("./skills-service", () => ({
  initializeBundledSkills: mocks.initializeBundledSkills,
  startSkillsFolderWatcher: mocks.startSkillsFolderWatcher,
}))

vi.mock("./models-dev-service", () => ({
  initModelsDevService: mocks.initModelsDevService,
}))

vi.mock("./remote-server", () => ({
  stopRemoteServer: mocks.stopRemoteServer,
}))

vi.mock("./debug", () => ({
  logApp: mocks.logApp,
}))

vi.mock("./tipc", () => ({
  router: mocks.router,
}))

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

describe("app-runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.mcpInitialize.mockResolvedValue(undefined)
    mocks.mcpCleanup.mockResolvedValue(undefined)
    mocks.stopAllLoops.mockImplementation(() => {})
    mocks.acpInitialize.mockResolvedValue(undefined)
    mocks.acpShutdown.mockResolvedValue(undefined)
    mocks.initializeBundledSkills.mockReturnValue({
      copied: ["bundled-skill"],
      skipped: [],
      errors: [],
    })
    mocks.stopRemoteServer.mockResolvedValue(undefined)
  })

  it("registers shared main-process infrastructure once", async () => {
    const { registerSharedMainProcessInfrastructure } =
      await import("./app-runtime")

    registerSharedMainProcessInfrastructure()

    expect(mocks.registerIpcMain).toHaveBeenCalledWith(mocks.router)
    expect(mocks.registerServeProtocol).toHaveBeenCalledTimes(1)
  })

  it("awaits shared services for headless startup", async () => {
    const { initializeSharedRuntimeServices } = await import("./app-runtime")

    await initializeSharedRuntimeServices({
      label: "headless-runtime",
      mcpStrategy: "await",
      acpStrategy: "await",
    })

    expect(mocks.mcpInitialize).toHaveBeenCalledTimes(1)
    expect(mocks.startAllLoops).toHaveBeenCalledTimes(1)
    expect(mocks.acpInitialize).toHaveBeenCalledTimes(1)
    expect(mocks.syncAgentProfilesToACPRegistry).toHaveBeenCalledTimes(1)
    expect(mocks.initializeBundledSkills).toHaveBeenCalledTimes(1)
    expect(mocks.startSkillsFolderWatcher).toHaveBeenCalledTimes(1)
    expect(mocks.initModelsDevService).toHaveBeenCalledTimes(1)
  })

  it("keeps desktop startup non-blocking while shared background services finish later", async () => {
    let resolveMcp: (() => void) | undefined
    let resolveAcp: (() => void) | undefined
    mocks.mcpInitialize.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveMcp = resolve
      }),
    )
    mocks.acpInitialize.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveAcp = resolve
      }),
    )

    const { initializeSharedRuntimeServices } = await import("./app-runtime")

    await initializeSharedRuntimeServices({
      label: "desktop-runtime",
      mcpStrategy: "background",
      acpStrategy: "background",
    })

    expect(mocks.mcpInitialize).toHaveBeenCalledTimes(1)
    expect(mocks.acpInitialize).toHaveBeenCalledTimes(1)
    expect(mocks.startAllLoops).toHaveBeenCalledTimes(1)
    expect(mocks.initializeBundledSkills).toHaveBeenCalledTimes(1)
    expect(mocks.startSkillsFolderWatcher).toHaveBeenCalledTimes(1)
    expect(mocks.initModelsDevService).toHaveBeenCalledTimes(1)
    expect(mocks.syncAgentProfilesToACPRegistry).not.toHaveBeenCalled()

    resolveMcp?.()
    resolveAcp?.()
    await flushPromises()

    expect(mocks.syncAgentProfilesToACPRegistry).toHaveBeenCalledTimes(1)
  })

  it("shares runtime teardown across GUI and headless shutdown paths", async () => {
    const keyboardCleanup = vi.fn().mockResolvedValue(undefined)
    const { shutdownSharedRuntimeServices } = await import("./app-runtime")

    await shutdownSharedRuntimeServices({
      label: "desktop-runtime",
      cleanupTimeoutMs: 5000,
      keyboardCleanup,
      stopRemoteServer: true,
    })

    expect(mocks.stopAllLoops).toHaveBeenCalledTimes(1)
    expect(mocks.acpShutdown).toHaveBeenCalledTimes(1)
    expect(mocks.mcpCleanup).toHaveBeenCalledTimes(1)
    expect(mocks.stopRemoteServer).toHaveBeenCalledTimes(1)
    expect(keyboardCleanup).toHaveBeenCalledTimes(1)
  })
})
