import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./config', () => ({
  configStore: {
    get: vi.fn().mockReturnValue({ pushNotificationTokens: [] }),
    save: vi.fn(),
  },
}))

vi.mock('./diagnostics', () => ({
  diagnosticsService: {
    logInfo: vi.fn(),
    logError: vi.fn(),
  },
}))

describe('push-notification-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('isPushEnabled returns false when no tokens registered', async () => {
    const { configStore } = await import('./config')
    vi.mocked(configStore.get).mockReturnValue({ pushNotificationTokens: [] })

    const { isPushEnabled } = await import('./push-notification-service')
    expect(isPushEnabled()).toBe(false)
  })

  it('isPushEnabled returns true when tokens exist', async () => {
    const { configStore } = await import('./config')
    vi.mocked(configStore.get).mockReturnValue({
      pushNotificationTokens: [{ token: 'test-token', type: 'expo', platform: 'ios', registeredAt: Date.now() }],
    })

    const { isPushEnabled } = await import('./push-notification-service')
    expect(isPushEnabled()).toBe(true)
  })

  it('clearBadgeCount updates token badge count to 0', async () => {
    const { configStore } = await import('./config')
    const tokens = [
      { token: 'token-1', type: 'expo', platform: 'ios', registeredAt: Date.now(), badgeCount: 5 },
      { token: 'token-2', type: 'expo', platform: 'android', registeredAt: Date.now(), badgeCount: 3 },
    ]
    vi.mocked(configStore.get).mockReturnValue({ pushNotificationTokens: tokens })

    const { clearBadgeCount } = await import('./push-notification-service')
    clearBadgeCount('token-1')

    expect(configStore.save).toHaveBeenCalledWith(expect.objectContaining({
      pushNotificationTokens: expect.arrayContaining([
        expect.objectContaining({ token: 'token-1', badgeCount: 0 }),
        expect.objectContaining({ token: 'token-2', badgeCount: 3 }),
      ]),
    }))
  })

  it('sendPushNotification returns success with zero tokens', async () => {
    const { configStore } = await import('./config')
    vi.mocked(configStore.get).mockReturnValue({ pushNotificationTokens: [] })

    const { sendPushNotification } = await import('./push-notification-service')
    const result = await sendPushNotification({ title: 'Test', body: 'Test body' })

    expect(result.success).toBe(true)
    expect(result.sent).toBe(0)
    expect(result.failed).toBe(0)
  })
})
