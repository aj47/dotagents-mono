import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  startConfiguredCloudflareTunnel: vi.fn(),
  logApp: vi.fn(),
  startRemoteServer: vi.fn(),
  startRemoteServerForced: vi.fn(),
}))

vi.mock("./cloudflare-runtime", () => ({
  startConfiguredCloudflareTunnel: mocks.startConfiguredCloudflareTunnel,
}))

vi.mock("./debug", () => ({
  logApp: mocks.logApp,
}))

vi.mock("./remote-server", () => ({
  startRemoteServer: mocks.startRemoteServer,
  startRemoteServerForced: mocks.startRemoteServerForced,
}))

describe("remote-access-runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    mocks.startConfiguredCloudflareTunnel.mockResolvedValue({ started: false })
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
})
