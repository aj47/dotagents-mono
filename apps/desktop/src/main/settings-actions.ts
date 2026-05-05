import type { RemoteServerLifecycleAction } from "@dotagents/shared/remote-pairing"
import {
  buildSettingsResponse,
  buildSettingsSensitiveNoValidUpdateAuditContext,
  buildSettingsSensitiveUpdateAuditContext,
  buildSettingsSensitiveUpdateFailureAuditContext,
  buildSettingsUpdatePatch,
  buildSettingsUpdateResponse,
  getSettingsUpdateRequestRecord,
} from "@dotagents/shared/settings-api-client"
import {
  getMaskedRemoteServerApiKey,
  getRemoteServerLifecycleAction,
} from "@dotagents/shared/remote-pairing"
import {
  getSensitiveOperatorSettingsKeys,
} from "@dotagents/shared/operator-actions"
import type {
  MobileApiActionResult,
  RemoteServerRouteAuditContext,
} from "@dotagents/shared/remote-server-route-contracts"
import type { Config } from "../shared/types"
import { agentProfileService } from "./agent-profile-service"
import { configStore } from "./config"
import {
  getDiscordLifecycleAction,
  getDiscordResolvedDefaultProfileId,
  getMaskedDiscordBotToken,
} from "./discord-config"
import { diagnosticsService } from "./diagnostics"
import { discordService } from "./discord-service"
import { handleWhatsAppToggle } from "./mcp-service"

export type SettingsAuditContext = RemoteServerRouteAuditContext

export type SettingsActionResult = MobileApiActionResult

export type SettingsUpdateMasks = {
  providerSecretMask: string
  remoteServerSecretMask: string
  discordSecretMask: string
  langfuseSecretMask: string
}

function ok(
  body: unknown,
  options: Pick<SettingsActionResult, "auditContext" | "remoteServerLifecycleAction"> = {},
): SettingsActionResult {
  return {
    statusCode: 200,
    body,
    ...options,
  }
}

function error(statusCode: number, message: string, auditContext?: SettingsAuditContext): SettingsActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(auditContext ? { auditContext } : {}),
  }
}

export function getSettings(providerSecretMask: string): SettingsActionResult {
  try {
    const cfg = configStore.get()
    return ok(buildSettingsResponse(cfg, {
      providerSecretMask,
      remoteServerApiKey: getMaskedRemoteServerApiKey(cfg.remoteServerApiKey),
      discordBotToken: getMaskedDiscordBotToken(cfg),
      discordDefaultProfileId: getDiscordResolvedDefaultProfileId(cfg).profileId ?? "",
      acpxAgents: agentProfileService.getAll()
        .filter(p => p.connection.type === 'acpx' && p.enabled !== false)
        .map(p => ({ name: p.name, displayName: p.displayName })),
    }))
  } catch (caughtError) {
    diagnosticsService.logError("settings-actions", "Failed to get settings", caughtError)
    return error(500, "Failed to get settings")
  }
}

async function applyDiscordLifecycleAction(discordLifecycleAction: ReturnType<typeof getDiscordLifecycleAction>): Promise<void> {
  if (discordLifecycleAction === "start") {
    await discordService.start()
  } else if (discordLifecycleAction === "restart") {
    await discordService.restart()
  } else if (discordLifecycleAction === "stop") {
    await discordService.stop()
  }
}

export async function updateSettings(
  body: unknown,
  masks: SettingsUpdateMasks,
): Promise<SettingsActionResult> {
  let attemptedSensitiveSettingsKeys: string[] = []

  try {
    const requestBody = getSettingsUpdateRequestRecord(body)
    attemptedSensitiveSettingsKeys = getSensitiveOperatorSettingsKeys(requestBody)
    const cfg = configStore.get()
    const updates = buildSettingsUpdatePatch(requestBody, cfg, masks) as Partial<Config>

    if (Object.keys(updates).length === 0) {
      return error(
        400,
        "No valid settings to update",
        attemptedSensitiveSettingsKeys.length > 0
          ? buildSettingsSensitiveNoValidUpdateAuditContext(attemptedSensitiveSettingsKeys)
          : undefined,
      )
    }

    const nextConfig = { ...cfg, ...updates }
    const remoteServerLifecycleAction = getRemoteServerLifecycleAction(cfg, nextConfig)
    const sensitiveUpdatedKeys = getSensitiveOperatorSettingsKeys(updates)
    configStore.save(nextConfig)
    diagnosticsService.logInfo("settings-actions", `Updated settings: ${Object.keys(updates).join(", ")}`)

    const discordLifecycleAction = getDiscordLifecycleAction(cfg, nextConfig)
    await applyDiscordLifecycleAction(discordLifecycleAction)

    if (updates.whatsappEnabled !== undefined) {
      try {
        const prevEnabled = cfg.whatsappEnabled ?? false
        await handleWhatsAppToggle(prevEnabled, updates.whatsappEnabled)
      } catch (_caughtError) {
        // lifecycle is best-effort
      }
    }

    return ok(buildSettingsUpdateResponse(updates), {
      remoteServerLifecycleAction,
      auditContext: sensitiveUpdatedKeys.length > 0
        ? buildSettingsSensitiveUpdateAuditContext(sensitiveUpdatedKeys, {
          remoteServerLifecycleAction,
          discordLifecycleAction,
        })
        : undefined,
    })
  } catch (caughtError: any) {
    diagnosticsService.logError("settings-actions", "Failed to update settings", caughtError)
    return error(
      500,
      caughtError?.message || "Failed to update settings",
      attemptedSensitiveSettingsKeys.length > 0
        ? buildSettingsSensitiveUpdateFailureAuditContext(attemptedSensitiveSettingsKeys)
        : undefined,
    )
  }
}
