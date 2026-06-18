import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Config, PushNotificationToken } from "../shared/types"

const mockConfig = vi.hoisted(() => ({
  current: {} as Config,
  saveCalls: [] as Config[],
}))

const mockConfigStore = vi.hoisted(() => ({
  get: vi.fn(() => mockConfig.current),
  save: vi.fn((next: Config) => {
    mockConfig.current = next
    mockConfig.saveCalls.push(next)
  }),
}))

const mockDiagnostics = vi.hoisted(() => ({
  logInfo: vi.fn(),
  logWarning: vi.fn(),
  logError: vi.fn(),
}))

vi.mock("./config", () => ({
  configStore: mockConfigStore,
}))

vi.mock("./diagnostics", () => ({
  diagnosticsService: mockDiagnostics,
}))

function token(input: Partial<PushNotificationToken> & Pick<PushNotificationToken, "token" | "platform">): PushNotificationToken {
  return {
    type: "expo",
    registeredAt: 1,
    ...input,
  }
}

function expoResponse(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

describe("push notification service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    mockConfig.current = {}
    mockConfig.saveCalls = []
  })

  it("skips delivery when no mobile tokens are registered", async () => {
    const { sendPushNotification } = await import("./push-notification-service")
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const result = await sendPushNotification({ title: "DotAgents", body: "Done" })

    expect(result).toEqual({ success: true, sent: 0, failed: 0, errors: [] })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockConfigStore.save).not.toHaveBeenCalled()
  })

  it("sends compact Expo payloads and increments badge counts", async () => {
    mockConfig.current = {
      pushNotificationTokens: [
        token({ token: "ExponentPushToken[a]", platform: "android", badgeCount: 4 }),
      ],
    } as Config
    const fetchMock = vi.fn().mockResolvedValue(expoResponse([{ status: "ok", id: "ticket-1" }]))
    vi.stubGlobal("fetch", fetchMock)

    const { sendMessageNotification } = await import("./push-notification-service")
    await sendMessageNotification(
      "conv_1",
      "Daily brief with a very long pasted prompt",
      "  Agent   completed.  ",
      "session_1",
    )

    expect(mockConfig.current.pushNotificationTokens?.[0]?.badgeCount).toBe(5)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const request = fetchMock.mock.calls[0]?.[1]
    const payload = JSON.parse(String(request.body))
    expect(payload).toEqual([
      {
        to: "ExponentPushToken[a]",
        title: "DotAgents",
        body: "Agent completed.",
        data: {
          type: "message",
          conversationId: "conv_1",
          conversationTitle: "Daily brief with a very long p...",
          sessionId: "session_1",
        },
        badge: 5,
        sound: "default",
        channelId: "default",
        priority: "high",
      },
    ])
  })

  it("removes Expo tokens reported as unregistered without dropping fresh config entries", async () => {
    mockConfig.current = {
      pushNotificationTokens: [
        token({ token: "ExponentPushToken[old]", platform: "android" }),
        token({ token: "ExponentPushToken[good]", platform: "ios" }),
      ],
    } as Config
    const fetchMock = vi.fn().mockResolvedValue(expoResponse([
      { status: "error", message: "gone", details: { error: "DeviceNotRegistered" } },
      { status: "ok", id: "ticket-2" },
    ]))
    vi.stubGlobal("fetch", fetchMock)

    const { sendPushNotification } = await import("./push-notification-service")
    const result = await sendPushNotification({ title: "DotAgents", body: "Done" })

    expect(result.success).toBe(false)
    expect(result.sent).toBe(1)
    expect(result.failed).toBe(1)
    expect(mockConfig.current.pushNotificationTokens?.map((entry) => entry.token)).toEqual([
      "ExponentPushToken[good]",
    ])
    expect(mockConfigStore.save).toHaveBeenCalledTimes(2)
  })

  it("clears badge counts for the matching token only", async () => {
    mockConfig.current = {
      pushNotificationTokens: [
        token({ token: "ExponentPushToken[a]", platform: "android", badgeCount: 7 }),
        token({ token: "ExponentPushToken[b]", platform: "ios", badgeCount: 3 }),
      ],
    } as Config

    const { clearBadgeCount } = await import("./push-notification-service")
    clearBadgeCount("ExponentPushToken[a]")

    expect(mockConfig.current.pushNotificationTokens?.map((entry) => entry.badgeCount)).toEqual([0, 3])
  })
})
