import {
  clearPushBadgeAction,
  getPushStatusAction,
  registerPushTokenAction,
  unregisterPushTokenAction,
  type PushTokenRecord,
} from "@dotagents/shared/push-notifications"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { clearBadgeCount } from "./push-notification-service"

export type PushActionResult = MobileApiActionResult

const pushActionOptions = {
  tokenStore: {
    getPushNotificationTokens: () => configStore.get().pushNotificationTokens ?? [],
    savePushNotificationTokens: (tokens: PushTokenRecord[]) => {
      const cfg = configStore.get()
      configStore.save({ ...cfg, pushNotificationTokens: tokens })
    },
  },
  diagnostics: diagnosticsService,
  badgeService: {
    clearBadgeCount,
  },
}

export function registerPushToken(body: unknown): PushActionResult {
  return registerPushTokenAction(body, pushActionOptions)
}

export function unregisterPushToken(body: unknown): PushActionResult {
  return unregisterPushTokenAction(body, pushActionOptions)
}

export function getPushStatus(): PushActionResult {
  return getPushStatusAction(pushActionOptions)
}

export function clearPushBadge(body: unknown): PushActionResult {
  return clearPushBadgeAction(body, pushActionOptions)
}
