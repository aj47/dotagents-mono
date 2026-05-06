import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getConversationImageAssetPath: vi.fn(
    (conversationId: string, fileName: string) => `/images/${conversationId}/${fileName}`,
  ),
  getConversationVideoAssetPath: vi.fn(
    (conversationId: string, fileName: string) => `/videos/${conversationId}/${fileName}`,
  ),
  registerFileProtocol: vi.fn(),
  registerSchemesAsPrivileged: vi.fn(),
}))

vi.mock("electron", () => ({
  protocol: {
    registerFileProtocol: mocks.registerFileProtocol,
    registerSchemesAsPrivileged: mocks.registerSchemesAsPrivileged,
  },
}))

vi.mock("./config", () => ({
  recordingsFolder: "/tmp/recordings",
}))

vi.mock("./conversation-image-assets", () => ({
  getConversationImageAssetPath: mocks.getConversationImageAssetPath,
}))

vi.mock("./conversation-video-assets", () => ({
  getConversationVideoAssetPath: mocks.getConversationVideoAssetPath,
}))

describe("serve protocol", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns FILE_NOT_FOUND for malformed conversation image asset paths", async () => {
    const { registerServeProtocol } = await import("./serve")
    registerServeProtocol()

    const handler = mocks.registerFileProtocol.mock.calls[0][1]
    const callback = vi.fn()

    handler({ url: "assets://conversation-image/%E0%A4%A/file.png" }, callback)

    expect(callback).toHaveBeenCalledWith({ error: -6 })
    expect(mocks.getConversationImageAssetPath).not.toHaveBeenCalled()
  })

  it("resolves conversation image asset paths", async () => {
    const { registerServeProtocol } = await import("./serve")
    registerServeProtocol()

    const handler = mocks.registerFileProtocol.mock.calls[0][1]
    const callback = vi.fn()

    handler({ url: "assets://conversation-image/conv%201/abcdef1234567890.png" }, callback)

    expect(mocks.getConversationImageAssetPath).toHaveBeenCalledWith("conv 1", "abcdef1234567890.png")
    expect(callback).toHaveBeenCalledWith({ path: "/images/conv 1/abcdef1234567890.png" })
  })

  it("resolves conversation video asset paths", async () => {
    const { registerServeProtocol } = await import("./serve")
    registerServeProtocol()

    const handler = mocks.registerFileProtocol.mock.calls[0][1]
    const callback = vi.fn()

    handler({ url: "assets://conversation-video/conv_1/abcdef1234567890.mp4" }, callback)

    expect(callback).toHaveBeenCalledWith({ path: "/videos/conv_1/abcdef1234567890.mp4" })
  })
})
