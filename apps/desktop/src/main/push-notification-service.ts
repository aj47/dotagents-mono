/**
 * Push Notification Service for Desktop App
 * Sends push notifications to registered mobile clients via Expo Push Notification Service.
 */

import {
  buildMessagePushNotificationPayload,
  buildPushNotificationDispatchPlan,
  type ExpoPushMessage,
  type ExpoPushTicket,
  type PushNotificationPayload,
  summarizeExpoPushTickets,
} from "@dotagents/shared/push-notifications"
import type { PushNotificationToken } from "@dotagents/shared/push-notifications"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

/**
 * Send push notification to all registered mobile clients
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: string[]
}> {
  const cfg = configStore.get()
  const tokens = cfg.pushNotificationTokens || []

  if (tokens.length === 0) {
    diagnosticsService.logInfo("push-service", "No push tokens registered, skipping notification")
    return { success: true, sent: 0, failed: 0, errors: [] }
  }

  const dispatchPlan = buildPushNotificationDispatchPlan(tokens, payload)
  const updatedTokens = dispatchPlan.updatedTokens

  // Save updated badge counts
  configStore.save({ ...cfg, pushNotificationTokens: updatedTokens })
  const messages: ExpoPushMessage[] = dispatchPlan.messages

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      const errorText = await response.text()
      diagnosticsService.logError("push-service", `Expo push failed: ${response.status} ${errorText}`)
      return { success: false, sent: 0, failed: tokens.length, errors: [errorText] }
    }

    const result = await response.json() as { data: ExpoPushTicket[] }
    const tickets = result.data || []
    const ticketSummary = summarizeExpoPushTickets(tickets, tokens)

    // Clean up invalid tokens
    if (ticketSummary.invalidTokens.length > 0) {
      // Fetch fresh config to avoid overwriting concurrent token changes
      const freshCfg = configStore.get()
      // Filter fresh config tokens (not updatedTokens) to preserve any newly-added tokens
      const cleanedTokens = (freshCfg.pushNotificationTokens || []).filter(
        (t: PushNotificationToken) => !ticketSummary.invalidTokens.includes(t.token)
      )
      configStore.save({ ...freshCfg, pushNotificationTokens: cleanedTokens })
      diagnosticsService.logInfo("push-service", `Removed ${ticketSummary.invalidTokens.length} invalid push tokens`)
    }

    diagnosticsService.logInfo("push-service", `Push notification sent: ${ticketSummary.sent} success, ${ticketSummary.failed} failed`)

    return {
      success: ticketSummary.failed === 0,
      sent: ticketSummary.sent,
      failed: ticketSummary.failed,
      errors: ticketSummary.errors,
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    diagnosticsService.logError("push-service", `Failed to send push notification: ${errorMsg}`)
    return { success: false, sent: 0, failed: tokens.length, errors: [errorMsg] }
  }
}

/**
 * Send notification for a new message in a conversation
 */
export async function sendMessageNotification(
  conversationId: string,
  conversationTitle: string,
  messagePreview: string
): Promise<void> {
  await sendPushNotification(buildMessagePushNotificationPayload({
    conversationId,
    conversationTitle,
    messagePreview,
  }))
}

/**
 * Check if push notifications are enabled (any tokens registered)
 */
export function isPushEnabled(): boolean {
  const cfg = configStore.get()
  const tokens = cfg.pushNotificationTokens || []
  return tokens.length > 0
}

/**
 * Clear badge count for a specific token (called when mobile app opens)
 */
export function clearBadgeCount(tokenValue: string): void {
  const cfg = configStore.get()
  const tokens = cfg.pushNotificationTokens || []

  const updatedTokens = tokens.map((token: PushNotificationToken) =>
    token.token === tokenValue
      ? { ...token, badgeCount: 0 }
      : token
  )

  configStore.save({ ...cfg, pushNotificationTokens: updatedTokens })
  diagnosticsService.logInfo("push-service", `Badge count cleared for token: ${tokenValue.substring(0, 20)}...`)
}
