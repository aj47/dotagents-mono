import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  hideDock: vi.fn(),
  initializeSharedRuntimeServices: vi.fn(),
  registerSharedMainProcessInfrastructure: vi.fn(),
  startRemoteServerForced: vi.fn(),
  stopRemoteServer: vi.fn(),
  stopAllLoops: vi.fn(),
  acpShutdown: vi.fn(),
  mcpCleanup: vi.fn(),
  setHeadlessMode: vi.fn(),
  logApp: vi.fn(),
}))

vi.mock("electron", () => ({
  app: {
    dock: {
      hide: mocks.hideDock,
    },
  },
}))

vi.mock("./app-runtime", () => ({
  initializeSharedRuntimeServices: mocks.initializeSharedRuntimeServices,
  registerSharedMainProcessInfrastructure:
    mocks.registerSharedMainProcessInfrastructure,
}))

vi.mock("./remote-server", () => ({
  startRemoteServerForced: mocks.startRemoteServerForced,
  stopRemoteServer: mocks.stopRemoteServer,
}))

vi.mock("./loop-service", () => ({
  loopService: {
    stopAllLoops: mocks.stopAllLoops,
  },
}))

vi.mock("./acp-service", () => ({
  acpService: {
    shutdown: mocks.acpShutdown,
  },
}))

vi.mock("./mcp-service", () => ({
  mcpService: {
    cleanup: mocks.mcpCleanup,
  },
}))

vi.mock("./state", () => ({
  setHeadlessMode: mocks.setHeadlessMode,
}))

vi.mock("./debug", () => ({
  logApp: mocks.logApp,
}))

describe("headless-runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    mocks.initializeSharedRuntimeServices.mockResolvedValue(undefined)
    mocks.startRemoteServerForced.mockResolvedValue({ running: true })
    mocks.stopRemoteServer.mockResolvedValue(undefined)
    mocks.acpShutdown.mockResolvedValue(undefined)
    mocks.mcpCleanup.mockResolvedValue(undefined)
  })

  it("starts the shared runtime and forces the remote server bind for non-GUI modes", async () => {
    const { startSharedHeadlessRuntime } = await import("./headless-runtime")

    await startSharedHeadlessRuntime({
      label: "qr-runtime",
      shutdownLabel: "QR Mode",
    })

    expect(mocks.setHeadlessMode).toHaveBeenCalledWith(true)
    expect(mocks.registerSharedMainProcessInfrastructure).toHaveBeenCalledTimes(1)
    expect(mocks.initializeSharedRuntimeServices).toHaveBeenCalledWith({
      label: "qr-runtime",
      mcpStrategy: "await",
      acpStrategy: "await",
    })
    expect(mocks.startRemoteServerForced).toHaveBeenCalledWith({
      bindAddressOverride: "0.0.0.0",
    })
  })

  it("cleans up shared services exactly once during graceful shutdown", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined as never) as typeof process.exit)
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const { startSharedHeadlessRuntime } = await import("./headless-runtime")

    const { gracefulShutdown } = await startSharedHeadlessRuntime({
      label: "headless-runtime",
      shutdownLabel: "Headless",
    })

    await gracefulShutdown(0)
    await gracefulShutdown(1)

    expect(mocks.stopAllLoops).toHaveBeenCalledTimes(1)
    expect(mocks.acpShutdown).toHaveBeenCalledTimes(1)
    expect(mocks.mcpCleanup).toHaveBeenCalledTimes(1)
    expect(mocks.stopRemoteServer).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(0)
    expect(consoleSpy).toHaveBeenCalledWith("\n[Headless] Shutting down...")
  })

  it("surfaces remote server startup failures", async () => {
    mocks.startRemoteServerForced.mockResolvedValue({
      running: false,
      error: "bind failed",
    })
    const { startSharedHeadlessRuntime } = await import("./headless-runtime")

    await expect(
      startSharedHeadlessRuntime({
        label: "headless-runtime",
        shutdownLabel: "Headless",
      }),
    ).rejects.toThrow("bind failed")
  })
})
