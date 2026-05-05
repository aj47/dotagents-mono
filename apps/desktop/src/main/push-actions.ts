import {
  buildPushBadgeClearResponse,
  buildPushRegistrationResponse,
  buildPushStatusResponse,
  buildPushUnregistrationResponse,
  parsePushTokenBody,
  parsePushTokenRegistrationBody,
  removePushTokenRegistration,
  upsertPushTokenRegistration,
} from "@dotagents/shared/push-notifications"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { clearBadgeCount } from "./push-notification-service"

export type PushActionResult = MobileApiActionResult

function ok(body: unknown): PushActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function error(statusCode: number, message: string): PushActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export function registerPushToken(body: unknown): PushActionResult {
  try {
    const parsedRequest = parsePushTokenRegistrationBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const cfg = configStore.get()
    const existingTokens = cfg.pushNotificationTokens || []
    const registrationResult = upsertPushTokenRegistration(existingTokens, parsedRequest.registration, Date.now())

    if (registrationResult.updatedExisting) {
      diagnosticsService.logInfo("push-actions", `Updated push notification token for ${parsedRequest.registration.platform}`)
    } else {
      diagnosticsService.logInfo("push-actions", `Registered new push notification token for ${parsedRequest.registration.platform}`)
    }

    configStore.save({ ...cfg, pushNotificationTokens: registrationResult.tokens })

    return ok(buildPushRegistrationResponse(
      registrationResult.tokens.length,
      registrationResult.updatedExisting,
    ))
  } catch (caughtError: any) {
    diagnosticsService.logError("push-actions", "Failed to register push token", caughtError)
    return error(500, caughtError?.message || "Failed to register push token")
  }
}

export function unregisterPushToken(body: unknown): PushActionResult {
  try {
    const parsedRequest = parsePushTokenBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const cfg = configStore.get()
    const existingTokens = cfg.pushNotificationTokens || []
    const unregisterResult = removePushTokenRegistration(existingTokens, parsedRequest.token)

    if (unregisterResult.removed) {
      configStore.save({ ...cfg, pushNotificationTokens: unregisterResult.tokens })
      diagnosticsService.logInfo("push-actions", "Unregistered push notification token")
    }

    return ok(buildPushUnregistrationResponse(
      unregisterResult.tokens.length,
      unregisterResult.removed,
    ))
  } catch (caughtError: any) {
    diagnosticsService.logError("push-actions", "Failed to unregister push token", caughtError)
    return error(500, caughtError?.message || "Failed to unregister push token")
  }
}

export function getPushStatus(): PushActionResult {
  try {
    const cfg = configStore.get()
    const tokens = cfg.pushNotificationTokens || []

    return ok(buildPushStatusResponse(tokens))
  } catch (caughtError: any) {
    diagnosticsService.logError("push-actions", "Failed to get push status", caughtError)
    return error(500, caughtError?.message || "Failed to get push status")
  }
}

export function clearPushBadge(body: unknown): PushActionResult {
  try {
    const parsedRequest = parsePushTokenBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    clearBadgeCount(parsedRequest.token)

    return ok(buildPushBadgeClearResponse())
  } catch (caughtError: any) {
    diagnosticsService.logError("push-actions", "Failed to clear badge count", caughtError)
    return error(500, caughtError?.message || "Failed to clear badge count")
  }
}
