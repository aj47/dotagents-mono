import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getConversationImageAssetPath: vi.fn(
    (conversationId: string, fileName: string) => `/images/${conversationId}/${fileName}`,
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
  CONVERSATION_IMAGE_ASSET_HOST: "conversation-image",
  getConversationImageAssetPath: mocks.getConversationImageAssetPath,
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
})