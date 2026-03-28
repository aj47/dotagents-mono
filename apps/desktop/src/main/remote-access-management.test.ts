import { beforeEach, describe, expect, it, vi } from "vitest"

const getConfigMock = vi.fn()
const checkCloudflaredInstalledMock = vi.fn()
const checkCloudflaredLoggedInMock = vi.fn()
const getCloudflareTunnelStatusMock = vi.fn()
const listCloudflareTunnelsMock = vi.fn()
const startCloudflareTunnelMock = vi.fn()
const startNamedCloudflareTunnelMock = vi.fn()
const stopCloudflareTunnelMock = vi.fn()
const getRemoteServerStatusMock = vi.fn()
const printQRCodeToTerminalMock = vi.fn()

vi.mock("./config", () => ({
  configStore: {
    get: getConfigMock,
  },
}))

vi.mock("./cloudflare-tunnel", () => ({
  checkCloudflaredInstalled: checkCloudflaredInstalledMock,
  checkCloudflaredLoggedIn: checkCloudflaredLoggedInMock,
  getCloudflareTunnelStatus: getCloudflareTunnelStatusMock,
  listCloudflareTunnels: listCloudflareTunnelsMock,
  startCloudflareTunnel: startCloudflareTunnelMock,
  startNamedCloudflareTunnel: startNamedCloudflareTunnelMock,
  stopCloudflareTunnel: stopCloudflareTunnelMock,
}))

vi.mock("./remote-server", () => ({
  getRemoteServerStatus: getRemoteServerStatusMock,
  printQRCodeToTerminal: printQRCodeToTerminalMock,
}))

const remoteAccessManagementModule = import("./remote-access-management")

describe("remote access management", () => {
  beforeEach(() => {
    getConfigMock.mockReset()
    checkCloudflaredInstalledMock.mockReset()
    checkCloudflaredLoggedInMock.mockReset()
    getCloudflareTunnelStatusMock.mockReset()
    listCloudflareTunnelsMock.mockReset()
    startCloudflareTunnelMock.mockReset()
    startNamedCloudflareTunnelMock.mockReset()
    stopCloudflareTunnelMock.mockReset()
    getRemoteServerStatusMock.mockReset()
    printQRCodeToTerminalMock.mockReset()

    getConfigMock.mockReturnValue({
      cloudflareTunnelMode: "quick",
    })
  })

  it("routes remote server status and QR printing through shared helpers", async () => {
    getRemoteServerStatusMock.mockReturnValue({
      running: true,
      bind: "0.0.0.0",
      port: 3210,
      url: "http://0.0.0.0:3210/v1",
      connectableUrl: "http://192.168.1.8:3210/v1",
      lastError: undefined,
    })
    printQRCodeToTerminalMock.mockResolvedValue(true)

    const {
      getManagedRemoteServerStatus,
      printManagedRemoteServerQrCode,
    } = await remoteAccessManagementModule

    expect(getManagedRemoteServerStatus()).toEqual({
      running: true,
      bind: "0.0.0.0",
      port: 3210,
      url: "http://0.0.0.0:3210/v1",
      connectableUrl: "http://192.168.1.8:3210/v1",
      lastError: undefined,
    })
    await expect(
      printManagedRemoteServerQrCode("https://example.trycloudflare.com"),
    ).resolves.toBe(true)
    expect(printQRCodeToTerminalMock).toHaveBeenCalledWith(
      "https://example.trycloudflare.com",
    )
  })

  it("surfaces Cloudflare install/login/status and tunnel listing through one module", async () => {
    checkCloudflaredInstalledMock.mockResolvedValue(true)
    checkCloudflaredLoggedInMock.mockResolvedValue(true)
    getCloudflareTunnelStatusMock.mockReturnValue({
      running: true,
      starting: false,
      url: "https://example.trycloudflare.com",
      error: null,
      mode: "quick",
    })
    listCloudflareTunnelsMock.mockResolvedValue({
      success: true,
      tunnels: [{ id: "tunnel-1", name: "primary", created_at: "today" }],
    })

    const {
      checkManagedCloudflaredInstalled,
      checkManagedCloudflaredLoggedIn,
      getManagedCloudflareTunnelStatus,
      listManagedCloudflareTunnels,
    } = await remoteAccessManagementModule

    await expect(checkManagedCloudflaredInstalled()).resolves.toBe(true)
    await expect(checkManagedCloudflaredLoggedIn()).resolves.toBe(true)
    expect(getManagedCloudflareTunnelStatus()).toEqual({
      running: true,
      starting: false,
      url: "https://example.trycloudflare.com",
      error: null,
      mode: "quick",
    })
    await expect(listManagedCloudflareTunnels()).resolves.toEqual({
      success: true,
      tunnels: [{ id: "tunnel-1", name: "primary", created_at: "today" }],
    })
  })

  it("starts quick tunnels through the shared helper when config is not named", async () => {
    startCloudflareTunnelMock.mockResolvedValue({
      success: true,
      url: "https://quick.trycloudflare.com",
    })

    const { startManagedConfiguredCloudflareTunnel } =
      await remoteAccessManagementModule

    await expect(startManagedConfiguredCloudflareTunnel()).resolves.toEqual({
      success: true,
      url: "https://quick.trycloudflare.com",
    })
    expect(startCloudflareTunnelMock).toHaveBeenCalledTimes(1)
    expect(startNamedCloudflareTunnelMock).not.toHaveBeenCalled()
  })

  it("starts named tunnels through the shared helper when config requires them", async () => {
    getConfigMock.mockReturnValue({
      cloudflareTunnelMode: "named",
      cloudflareTunnelId: "tunnel-1",
      cloudflareTunnelHostname: "dotagents.example.com",
      cloudflareTunnelCredentialsPath: "~/cloudflare/tunnel.json",
    })
    startNamedCloudflareTunnelMock.mockResolvedValue({
      success: true,
      url: "https://dotagents.example.com",
    })

    const { startManagedConfiguredCloudflareTunnel } =
      await remoteAccessManagementModule

    await expect(startManagedConfiguredCloudflareTunnel()).resolves.toEqual({
      success: true,
      url: "https://dotagents.example.com",
    })
    expect(startNamedCloudflareTunnelMock).toHaveBeenCalledWith({
      tunnelId: "tunnel-1",
      hostname: "dotagents.example.com",
      credentialsPath: "~/cloudflare/tunnel.json",
    })
    expect(startCloudflareTunnelMock).not.toHaveBeenCalled()
  })

  it("returns a clear validation error when named tunnel config is incomplete", async () => {
    getConfigMock.mockReturnValue({
      cloudflareTunnelMode: "named",
      cloudflareTunnelId: "tunnel-1",
      cloudflareTunnelHostname: "",
    })

    const { startManagedConfiguredCloudflareTunnel } =
      await remoteAccessManagementModule

    await expect(startManagedConfiguredCloudflareTunnel()).resolves.toEqual({
      success: false,
      error:
        "Named Cloudflare tunnel requires both cloudflareTunnelId and cloudflareTunnelHostname in settings.",
    })
    expect(startNamedCloudflareTunnelMock).not.toHaveBeenCalled()
    expect(startCloudflareTunnelMock).not.toHaveBeenCalled()
  })

  it("stops the active Cloudflare tunnel through one helper", async () => {
    stopCloudflareTunnelMock.mockResolvedValue(undefined)

    const { stopManagedCloudflareTunnel } = await remoteAccessManagementModule

    await expect(stopManagedCloudflareTunnel()).resolves.toBeUndefined()
    expect(stopCloudflareTunnelMock).toHaveBeenCalledTimes(1)
  })
})
