import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCloudflareTunnelStatus: vi.fn(),
  startConfiguredCloudflareTunnel: vi.fn(),
  stopCloudflareTunnel: vi.fn(),
  logApp: vi.fn(),
  getRemoteServerStatus: vi.fn(),
  restartRemoteServer: vi.fn(),
  startRemoteServer: vi.fn(),
  startRemoteServerForced: vi.fn(),
  stopRemoteServer: vi.fn(),
}))

vi.mock("./cloudflare-tunnel", () => ({
  getCloudflareTunnelStatus: mocks.getCloudflareTunnelStatus,
  stopCloudflareTunnel: mocks.stopCloudflareTunnel,
}))

vi.mock("./cloudflare-runtime", () => ({
  startConfiguredCloudflareTunnel: mocks.startConfiguredCloudflareTunnel,
}))

vi.mock("./debug", () => ({
  logApp: mocks.logApp,
}))

vi.mock("./remote-server", () => ({
  getRemoteServerStatus: mocks.getRemoteServerStatus,
  restartRemoteServer: mocks.restartRemoteServer,
  startRemoteServer: mocks.startRemoteServer,
  startRemoteServerForced: mocks.startRemoteServerForced,
  stopRemoteServer: mocks.stopRemoteServer,
}))

describe("remote-access-runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    mocks.startConfiguredCloudflareTunnel.mockResolvedValue({ started: false })
    mocks.stopCloudflareTunnel.mockResolvedValue(undefined)
    mocks.startRemoteServer.mockResolvedValue({
      running: true,
      bind: "127.0.0.1",
      port: 3210,
    })
    mocks.startRemoteServerForced.mockResolvedValue({
      running: true,
      bind: "0.0.0.0",
      port: 3210,
    })
    mocks.getCloudflareTunnelStatus.mockReturnValue({
      running: false,
      starting: false,
      url: null,
      error: null,
      mode: null,
    })
    mocks.getRemoteServerStatus.mockReturnValue({
      running: false,
      url: undefined,
      connectableUrl: undefined,
      bind: "127.0.0.1",
      port: 3210,
      lastError: null,
    })
    mocks.restartRemoteServer.mockResolvedValue({
      running: true,
      bind: "127.0.0.1",
      port: 3210,
    })
    mocks.stopRemoteServer.mockResolvedValue(undefined)
  })

  it("starts desktop remote access through the config-driven remote server path", async () => {
    const { startSharedRemoteAccessRuntime } = await import(
      "./remote-access-runtime"
    )

    await expect(
      startSharedRemoteAccessRuntime({
        label: "desktop-runtime",
        remoteServerStrategy: "config",
        cloudflareTunnelActivation: "auto",
      }),
    ).resolves.toEqual({
      remoteServerStarted: true,
      remoteServerBind: "127.0.0.1",
      remoteServerPort: 3210,
      cloudflareTunnelStarted: false,
      cloudflareTunnelUrl: undefined,
    })

    expect(mocks.startRemoteServer).toHaveBeenCalledTimes(1)
    expect(mocks.startRemoteServerForced).not.toHaveBeenCalled()
    expect(mocks.startConfiguredCloudflareTunnel).toHaveBeenCalledWith({
      activation: "auto",
      logLabel: "desktop-runtime",
      consoleLabel: undefined,
    })
  })

  it("starts forced headless remote access with the requested bind override", async () => {
    mocks.startConfiguredCloudflareTunnel.mockResolvedValue({
      started: true,
      url: "https://quick.example.com",
    })
    const { startSharedRemoteAccessRuntime } = await import(
      "./remote-access-runtime"
    )

    await expect(
      startSharedRemoteAccessRuntime({
        label: "qr-runtime",
        remoteServerStrategy: "forced",
        remoteServerBindAddress: "0.0.0.0",
        requireRemoteServer: true,
        cloudflareTunnelActivation: "force",
        cloudflareConsoleLabel: "QR Mode",
      }),
    ).resolves.toEqual({
      remoteServerStarted: true,
      remoteServerBind: "0.0.0.0",
      remoteServerPort: 3210,
      cloudflareTunnelStarted: true,
      cloudflareTunnelUrl: "https://quick.example.com",
    })

    expect(mocks.startRemoteServerForced).toHaveBeenCalledWith({
      bindAddressOverride: "0.0.0.0",
    })
    expect(mocks.startConfiguredCloudflareTunnel).toHaveBeenCalledWith({
      activation: "force",
      logLabel: "qr-runtime",
      consoleLabel: "QR Mode",
    })
  })

  it("returns a non-throwing disabled result when config-driven remote access is unavailable", async () => {
    mocks.startRemoteServer.mockResolvedValue({ running: false })
    const { startSharedRemoteAccessRuntime } = await import(
      "./remote-access-runtime"
    )

    await expect(
      startSharedRemoteAccessRuntime({
        label: "desktop-runtime",
        remoteServerStrategy: "config",
        cloudflareTunnelActivation: "auto",
      }),
    ).resolves.toEqual({
      remoteServerStarted: false,
      cloudflareTunnelStarted: false,
      error: undefined,
    })

    expect(mocks.startConfiguredCloudflareTunnel).not.toHaveBeenCalled()
  })

  it("throws when required remote access cannot start", async () => {
    mocks.startRemoteServerForced.mockResolvedValue({
      running: false,
      error: "bind failed",
    })
    const { startSharedRemoteAccessRuntime } = await import(
      "./remote-access-runtime"
    )

    await expect(
      startSharedRemoteAccessRuntime({
        label: "headless-runtime",
        remoteServerStrategy: "forced",
        requireRemoteServer: true,
      }),
    ).rejects.toThrow("bind failed")
  })

  it("reuses the shared config-driven bootstrap when remote access is newly enabled", async () => {
    const { syncConfiguredRemoteAccess } = await import("./remote-access-runtime")

    await syncConfiguredRemoteAccess({
      label: "desktop-runtime",
      previousConfig: {
        remoteServerEnabled: false,
      },
      nextConfig: {
        remoteServerEnabled: true,
        cloudflareTunnelAutoStart: true,
      },
    })

    expect(mocks.startRemoteServer).toHaveBeenCalledTimes(1)
    expect(mocks.startConfiguredCloudflareTunnel).toHaveBeenCalledWith({
      activation: "auto",
      logLabel: "desktop-runtime",
      consoleLabel: undefined,
    })
    expect(mocks.stopRemoteServer).not.toHaveBeenCalled()
  })

  it("restarts the server and tunnel when config changes require reconciliation", async () => {
    mocks.getRemoteServerStatus.mockReturnValue({
      running: true,
      url: "http://127.0.0.1:3210/v1",
      connectableUrl: "http://192.168.1.5:3210/v1",
      bind: "127.0.0.1",
      port: 3210,
      lastError: null,
    })
    mocks.getCloudflareTunnelStatus.mockReturnValue({
      running: true,
      starting: false,
      url: "https://old.trycloudflare.com",
      error: null,
      mode: "quick",
    })
    mocks.startConfiguredCloudflareTunnel.mockResolvedValue({
      started: true,
      url: "https://new.trycloudflare.com",
    })

    const { syncConfiguredRemoteAccess } = await import("./remote-access-runtime")

    await syncConfiguredRemoteAccess({
      label: "desktop-runtime",
      previousConfig: {
        remoteServerEnabled: true,
        remoteServerPort: 3210,
        remoteServerCorsOrigins: ["*"],
        cloudflareTunnelAutoStart: true,
        cloudflareTunnelMode: "quick",
      },
      nextConfig: {
        remoteServerEnabled: true,
        remoteServerPort: 4321,
        remoteServerCorsOrigins: ["http://localhost:3000"],
        cloudflareTunnelAutoStart: true,
        cloudflareTunnelMode: "named",
        cloudflareTunnelId: "tunnel-id",
        cloudflareTunnelHostname: "agents.example.com",
      },
    })

    expect(mocks.restartRemoteServer).toHaveBeenCalledTimes(1)
    expect(mocks.stopCloudflareTunnel).toHaveBeenCalledTimes(1)
    expect(mocks.startConfiguredCloudflareTunnel).toHaveBeenCalledWith({
      activation: "auto",
      logLabel: "desktop-runtime",
      consoleLabel: undefined,
    })
  })

  it("stops both the server and tunnel when config disables remote access", async () => {
    mocks.getCloudflareTunnelStatus.mockReturnValue({
      running: true,
      starting: false,
      url: "https://old.trycloudflare.com",
      error: null,
      mode: "quick",
    })

    const { syncConfiguredRemoteAccess } = await import("./remote-access-runtime")

    await syncConfiguredRemoteAccess({
      label: "desktop-runtime",
      previousConfig: {
        remoteServerEnabled: true,
        cloudflareTunnelAutoStart: true,
      },
      nextConfig: {
        remoteServerEnabled: false,
        cloudflareTunnelAutoStart: false,
      },
    })

    expect(mocks.stopCloudflareTunnel).toHaveBeenCalledTimes(1)
    expect(mocks.stopRemoteServer).toHaveBeenCalledTimes(1)
    expect(mocks.restartRemoteServer).not.toHaveBeenCalled()
  })
})
