import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  hideDock: vi.fn(),
  initializeSharedRuntimeServices: vi.fn(),
  registerSharedMainProcessInfrastructure: vi.fn(),
  shutdownSharedRuntimeServices: vi.fn(),
  startSharedRemoteAccessRuntime: vi.fn(),
  setHeadlessMode: vi.fn(),
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
  shutdownSharedRuntimeServices: mocks.shutdownSharedRuntimeServices,
}))

vi.mock("./remote-access-runtime", () => ({
  startSharedRemoteAccessRuntime: mocks.startSharedRemoteAccessRuntime,
}))

vi.mock("./state", () => ({
  setHeadlessMode: mocks.setHeadlessMode,
}))

describe("headless-runtime", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    mocks.initializeSharedRuntimeServices.mockResolvedValue(undefined)
    mocks.shutdownSharedRuntimeServices.mockResolvedValue(undefined)
    mocks.startSharedRemoteAccessRuntime.mockResolvedValue({
      remoteServerStarted: true,
      cloudflareTunnelStarted: false,
    })
  })

  it("starts the shared remote access runtime with the forced headless bind", async () => {
    const { startSharedHeadlessRuntime } = await import("./headless-runtime")

    await startSharedHeadlessRuntime({
      label: "qr-runtime",
      shutdownLabel: "QR Mode",
    })

    expect(mocks.setHeadlessMode).toHaveBeenCalledWith(true)
    expect(mocks.registerSharedMainProcessInfrastructure).toHaveBeenCalledTimes(
      1,
    )
    expect(mocks.initializeSharedRuntimeServices).toHaveBeenCalledWith({
      label: "qr-runtime",
      mcpStrategy: "await",
      acpStrategy: "await",
    })
    expect(mocks.startSharedRemoteAccessRuntime).toHaveBeenCalledWith({
      label: "qr-runtime",
      remoteServerStrategy: "forced",
      remoteServerBindAddress: "0.0.0.0",
      requireRemoteServer: true,
      cloudflareTunnelActivation: "disabled",
      cloudflareConsoleLabel: "QR Mode",
    })
  })

  it("returns the shared remote access tunnel URL for non-GUI modes", async () => {
    mocks.startSharedRemoteAccessRuntime.mockResolvedValue({
      remoteServerStarted: true,
      cloudflareTunnelStarted: true,
      cloudflareTunnelUrl: "https://quick.example.com",
    })
    const { startSharedHeadlessRuntime } = await import("./headless-runtime")

    const result = await startSharedHeadlessRuntime({
      label: "qr-runtime",
      shutdownLabel: "QR Mode",
      cloudflareTunnelActivation: "force",
      cloudflareConsoleLabel: "QR Mode",
    })

    expect(mocks.startSharedRemoteAccessRuntime).toHaveBeenCalledWith({
      label: "qr-runtime",
      remoteServerStrategy: "forced",
      remoteServerBindAddress: "0.0.0.0",
      requireRemoteServer: true,
      cloudflareTunnelActivation: "force",
      cloudflareConsoleLabel: "QR Mode",
    })
    expect(result.cloudflareTunnelUrl).toBe("https://quick.example.com")
  })

  it("registers shared non-GUI signal handlers by default before running mode-specific startup", async () => {
    const processOnSpy = vi
      .spyOn(process, "on")
      .mockImplementation((() => process) as typeof process.on)
    const onStarted = vi.fn().mockResolvedValue(undefined)
    const { launchSharedHeadlessMode } = await import("./headless-runtime")

    await launchSharedHeadlessMode({
      label: "qr-runtime",
      shutdownLabel: "QR Mode",
      onStarted,
    })

    expect(processOnSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function))
    expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function))
    expect(onStarted).toHaveBeenCalledWith(
      expect.objectContaining({
        gracefulShutdown: expect.any(Function),
      }),
    )
  })

  it("allows callers to narrow shared non-GUI signal ownership", async () => {
    const processOnSpy = vi
      .spyOn(process, "on")
      .mockImplementation((() => process) as typeof process.on)
    const { launchSharedHeadlessMode } = await import("./headless-runtime")

    await launchSharedHeadlessMode({
      label: "headless-runtime",
      shutdownLabel: "Headless",
      terminationSignals: ["SIGTERM"],
      onStarted: vi.fn().mockResolvedValue(undefined),
    })

    expect(processOnSpy).toHaveBeenCalledTimes(1)
    expect(processOnSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function))
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

    expect(mocks.shutdownSharedRuntimeServices).toHaveBeenCalledTimes(1)
    expect(mocks.shutdownSharedRuntimeServices).toHaveBeenCalledWith({
      label: "headless-runtime",
      stopRemoteServer: true,
    })
    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(0)
    expect(consoleSpy).toHaveBeenCalledWith("\n[Headless] Shutting down...")
  })

  it("shuts down the shared runtime when mode-specific startup fails after bootstrap", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined as never) as typeof process.exit)
    const processOnSpy = vi
      .spyOn(process, "on")
      .mockImplementation((() => process) as typeof process.on)
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    vi.spyOn(console, "log").mockImplementation(() => {})
    const { launchSharedHeadlessMode } = await import("./headless-runtime")

    await launchSharedHeadlessMode({
      label: "headless-runtime",
      shutdownLabel: "Headless",
      terminationSignals: [],
      onStarted: async () => {
        throw new Error("cli startup failed")
      },
    })

    expect(processOnSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Headless] Failed to initialize:",
      "cli startup failed",
    )
    expect(mocks.shutdownSharedRuntimeServices).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it("surfaces shared remote access startup failures", async () => {
    mocks.startSharedRemoteAccessRuntime.mockRejectedValue(
      new Error("bind failed"),
    )
    const { startSharedHeadlessRuntime } = await import("./headless-runtime")

    await expect(
      startSharedHeadlessRuntime({
        label: "headless-runtime",
        shutdownLabel: "Headless",
      }),
    ).rejects.toThrow("bind failed")
  })
})
