import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  configGet: vi.fn(),
  checkCloudflaredInstalled: vi.fn(),
  startCloudflareTunnel: vi.fn(),
  startNamedCloudflareTunnel: vi.fn(),
  logApp: vi.fn(),
}))

vi.mock("./config", () => ({
  configStore: {
    get: mocks.configGet,
  },
}))

vi.mock("./cloudflare-tunnel", () => ({
  checkCloudflaredInstalled: mocks.checkCloudflaredInstalled,
  startCloudflareTunnel: mocks.startCloudflareTunnel,
  startNamedCloudflareTunnel: mocks.startNamedCloudflareTunnel,
}))

vi.mock("./debug", () => ({
  logApp: mocks.logApp,
}))

describe("cloudflare-runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    mocks.configGet.mockReturnValue({
      cloudflareTunnelAutoStart: false,
      cloudflareTunnelMode: "quick",
    })
    mocks.checkCloudflaredInstalled.mockResolvedValue(true)
    mocks.startCloudflareTunnel.mockResolvedValue({
      success: true,
      url: "https://quick.example.com",
    })
    mocks.startNamedCloudflareTunnel.mockResolvedValue({
      success: true,
      url: "https://named.example.com",
    })
  })

  it("skips auto activation when tunnel auto-start is disabled", async () => {
    const { startConfiguredCloudflareTunnel } =
      await import("./cloudflare-runtime")

    await expect(
      startConfiguredCloudflareTunnel({
        activation: "auto",
        logLabel: "desktop-runtime",
      }),
    ).resolves.toEqual({
      started: false,
      reason: "disabled",
    })

    expect(mocks.checkCloudflaredInstalled).not.toHaveBeenCalled()
    expect(mocks.startCloudflareTunnel).not.toHaveBeenCalled()
    expect(mocks.startNamedCloudflareTunnel).not.toHaveBeenCalled()
  })

  it("starts the configured named tunnel for auto activation", async () => {
    mocks.configGet.mockReturnValue({
      cloudflareTunnelAutoStart: true,
      cloudflareTunnelMode: "named",
      cloudflareTunnelId: "tunnel-id",
      cloudflareTunnelHostname: "example.com",
      cloudflareTunnelCredentialsPath: "/tmp/tunnel.json",
    })

    const { startConfiguredCloudflareTunnel } =
      await import("./cloudflare-runtime")

    await expect(
      startConfiguredCloudflareTunnel({
        activation: "auto",
        logLabel: "desktop-runtime",
      }),
    ).resolves.toEqual({
      started: true,
      url: "https://named.example.com",
    })

    expect(mocks.startNamedCloudflareTunnel).toHaveBeenCalledWith({
      tunnelId: "tunnel-id",
      hostname: "example.com",
      credentialsPath: "/tmp/tunnel.json",
    })
    expect(mocks.startCloudflareTunnel).not.toHaveBeenCalled()
  })

  it("falls back to a quick tunnel for forced activation when named startup fails", async () => {
    mocks.configGet.mockReturnValue({
      cloudflareTunnelAutoStart: false,
      cloudflareTunnelMode: "named",
      cloudflareTunnelId: "tunnel-id",
      cloudflareTunnelHostname: "example.com",
    })
    mocks.startNamedCloudflareTunnel.mockResolvedValue({
      success: false,
      error: "named failed",
    })

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})
    const { startConfiguredCloudflareTunnel } =
      await import("./cloudflare-runtime")

    await expect(
      startConfiguredCloudflareTunnel({
        activation: "force",
        logLabel: "qr-runtime",
        consoleLabel: "QR Mode",
      }),
    ).resolves.toEqual({
      started: true,
      url: "https://quick.example.com",
    })

    expect(mocks.startNamedCloudflareTunnel).toHaveBeenCalledTimes(1)
    expect(mocks.startCloudflareTunnel).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[QR Mode] Named tunnel failed: named failed",
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "[QR Mode] Falling back to quick tunnel...",
    )
  })
})
