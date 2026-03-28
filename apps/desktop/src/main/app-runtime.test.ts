import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  registerIpcMain: vi.fn(),
  registerServeProtocol: vi.fn(),
  mcpInitialize: vi.fn(),
  startAllLoops: vi.fn(),
  acpInitialize: vi.fn(),
  syncAgentProfilesToACPRegistry: vi.fn(),
  initializeBundledSkills: vi.fn(),
  startSkillsFolderWatcher: vi.fn(),
  initModelsDevService: vi.fn(),
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
  },
}))

vi.mock("./loop-service", () => ({
  loopService: {
    startAllLoops: mocks.startAllLoops,
  },
}))

vi.mock("./acp-service", () => ({
  acpService: {
    initialize: mocks.acpInitialize,
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
    mocks.acpInitialize.mockResolvedValue(undefined)
    mocks.initializeBundledSkills.mockReturnValue({
      copied: ["bundled-skill"],
      skipped: [],
      errors: [],
    })
  })

  it("registers shared main-process infrastructure once", async () => {
    const { registerSharedMainProcessInfrastructure } = await import("./app-runtime")

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
})
