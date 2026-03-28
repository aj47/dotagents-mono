import { beforeEach, describe, expect, it, vi } from "vitest"

const getServerStatusMock = vi.fn()
const executeToolCallMock = vi.fn()

vi.mock("./mcp-service", () => ({
  WHATSAPP_SERVER_NAME: "whatsapp",
  mcpService: {
    getServerStatus: getServerStatusMock,
    executeToolCall: executeToolCallMock,
  },
}))

const whatsappManagementModule = import("./whatsapp-management")

describe("whatsapp management", () => {
  beforeEach(() => {
    getServerStatusMock.mockReset()
    executeToolCallMock.mockReset()
    getServerStatusMock.mockReturnValue({
      whatsapp: {
        connected: true,
        toolCount: 4,
      },
    })
  })

  it("returns an unavailable status when the WhatsApp MCP server is not running", async () => {
    getServerStatusMock.mockReturnValue({})

    const { getManagedWhatsappStatus } = await whatsappManagementModule

    await expect(getManagedWhatsappStatus()).resolves.toEqual({
      available: false,
      connected: false,
      error: "WhatsApp server is not running",
    })
    expect(executeToolCallMock).not.toHaveBeenCalled()
  })

  it("parses structured status payloads through one helper", async () => {
    executeToolCallMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            connected: true,
            phoneNumber: "+14155551234",
            userName: "CLI Agent",
            hasCredentials: true,
          }),
        },
      ],
    })

    const { getManagedWhatsappStatus } = await whatsappManagementModule

    await expect(getManagedWhatsappStatus()).resolves.toEqual({
      available: true,
      connected: true,
      phoneNumber: "+14155551234",
      userName: "CLI Agent",
      hasQrCode: undefined,
      qrCode: undefined,
      hasCredentials: true,
      lastError: undefined,
      error: undefined,
      message: undefined,
    })
    expect(executeToolCallMock).toHaveBeenCalledWith(
      { name: "whatsapp_get_status", arguments: {} },
      undefined,
      true,
    )
  })

  it("parses QR-based connect responses for shared desktop and CLI handling", async () => {
    executeToolCallMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "qr_required",
            qrCode: "qr-payload",
          }),
        },
      ],
    })

    const { connectManagedWhatsapp } = await whatsappManagementModule

    await expect(connectManagedWhatsapp()).resolves.toEqual({
      success: true,
      status: "qr_required",
      qrCode: "qr-payload",
    })
    expect(executeToolCallMock).toHaveBeenCalledWith(
      { name: "whatsapp_connect", arguments: {} },
      undefined,
      true,
    )
  })

  it("shares disconnect and logout error handling through one helper", async () => {
    executeToolCallMock.mockResolvedValue({
      content: [{ type: "text", text: "tool failed" }],
      isError: true,
    })

    const { disconnectManagedWhatsapp, logoutManagedWhatsapp } =
      await whatsappManagementModule

    await expect(disconnectManagedWhatsapp()).resolves.toEqual({
      success: false,
      error: "tool failed",
    })
    await expect(logoutManagedWhatsapp()).resolves.toEqual({
      success: false,
      error: "tool failed",
    })
    expect(executeToolCallMock).toHaveBeenNthCalledWith(
      1,
      { name: "whatsapp_disconnect", arguments: {} },
      undefined,
      true,
    )
    expect(executeToolCallMock).toHaveBeenNthCalledWith(
      2,
      { name: "whatsapp_logout", arguments: {} },
      undefined,
      true,
    )
  })
})
