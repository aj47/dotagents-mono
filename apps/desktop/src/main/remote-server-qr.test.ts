import { describe, expect, it, vi } from "vitest"

vi.mock("./diagnostics", () => ({
  diagnosticsService: {
    logInfo: vi.fn(),
    logError: vi.fn(),
  },
}))

import { printSharedRemoteServerQrCode } from "./remote-server-qr"

const baseConfig = {
  remoteServerApiKey: "test-api-key",
  remoteServerBindAddress: "0.0.0.0",
  remoteServerPort: 3210,
  remoteServerTerminalQrEnabled: false,
  streamerModeEnabled: false,
} as const

describe("remote-server-qr", () => {
  it("skips manual QR printing when the remote server is unavailable", async () => {
    const printTerminalQrCode = vi.fn()
    const resolveConnectableBaseUrl = vi.fn()

    const result = await printSharedRemoteServerQrCode({
      mode: "manual",
      config: baseConfig,
      serverRunning: false,
      resolveConnectableBaseUrl,
      printTerminalQrCode,
    })

    expect(result).toEqual({
      printed: false,
      skippedReason: "server-unavailable",
    })
    expect(resolveConnectableBaseUrl).not.toHaveBeenCalled()
    expect(printTerminalQrCode).not.toHaveBeenCalled()
  })

  it("skips auto QR printing when terminal output is not enabled for non-headless startup", async () => {
    const printTerminalQrCode = vi.fn()
    const resolveConnectableBaseUrl = vi.fn()

    const result = await printSharedRemoteServerQrCode({
      mode: "auto",
      config: baseConfig,
      serverRunning: true,
      isHeadlessEnvironment: false,
      resolveConnectableBaseUrl,
      printTerminalQrCode,
    })

    expect(result).toEqual({
      printed: false,
      skippedReason: "disabled",
    })
    expect(resolveConnectableBaseUrl).not.toHaveBeenCalled()
    expect(printTerminalQrCode).not.toHaveBeenCalled()
  })

  it("shares the same resolved LAN URL for auto QR printing in headless mode", async () => {
    const printTerminalQrCode = vi.fn().mockResolvedValue(true)
    const resolveConnectableBaseUrl = vi
      .fn()
      .mockReturnValue("http://192.168.1.20:3210/v1")

    const result = await printSharedRemoteServerQrCode({
      mode: "auto",
      config: baseConfig,
      serverRunning: true,
      isHeadlessEnvironment: true,
      resolveConnectableBaseUrl,
      printTerminalQrCode,
    })

    expect(resolveConnectableBaseUrl).toHaveBeenCalledWith("0.0.0.0", 3210)
    expect(printTerminalQrCode).toHaveBeenCalledWith(
      "http://192.168.1.20:3210/v1",
      "test-api-key",
    )
    expect(result).toEqual({
      printed: true,
      serverUrl: "http://192.168.1.20:3210/v1",
    })
  })

  it("normalizes manual override URLs before printing", async () => {
    const printTerminalQrCode = vi.fn().mockResolvedValue(true)
    const resolveConnectableBaseUrl = vi.fn()

    const result = await printSharedRemoteServerQrCode({
      mode: "manual",
      config: baseConfig,
      serverRunning: true,
      urlOverride: "https://quick.example.com",
      resolveConnectableBaseUrl,
      printTerminalQrCode,
    })

    expect(resolveConnectableBaseUrl).not.toHaveBeenCalled()
    expect(printTerminalQrCode).toHaveBeenCalledWith(
      "https://quick.example.com/v1",
      "test-api-key",
    )
    expect(result).toEqual({
      printed: true,
      serverUrl: "https://quick.example.com/v1",
    })
  })

  it("suppresses QR printing when streamer mode is enabled", async () => {
    const printTerminalQrCode = vi.fn()
    const resolveConnectableBaseUrl = vi.fn()

    const result = await printSharedRemoteServerQrCode({
      mode: "manual",
      config: {
        ...baseConfig,
        streamerModeEnabled: true,
      },
      serverRunning: true,
      resolveConnectableBaseUrl,
      printTerminalQrCode,
    })

    expect(result).toEqual({
      printed: false,
      skippedReason: "streamer-mode",
    })
    expect(resolveConnectableBaseUrl).not.toHaveBeenCalled()
    expect(printTerminalQrCode).not.toHaveBeenCalled()
  })
})
