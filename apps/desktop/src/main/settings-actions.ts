import {
  getSettingsAction,
  updateSettingsAction,
  type SettingsActionOptions,
} from "@dotagents/shared/settings-api-client"
import {
  getMaskedRemoteServerApiKey,
} from "@dotagents/shared/remote-pairing"
import { getEnabledAcpxAgentProfiles } from "@dotagents/shared/agent-profile-queries"
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
import { applyDesktopShellSettings } from "./desktop-shell-settings"
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

async function applyDiscordLifecycleAction(discordLifecycleAction: ReturnType<typeof getDiscordLifecycleAction>): Promise<void> {
  if (discordLifecycleAction === "start") {
    await discordService.start()
  } else if (discordLifecycleAction === "restart") {
    await discordService.restart()
  } else if (discordLifecycleAction === "stop") {
    await discordService.stop()
  }
}

const settingsActionOptions: SettingsActionOptions<Config> = {
  config: {
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  },
  diagnostics: diagnosticsService,
  getMaskedRemoteServerApiKey: (config) => getMaskedRemoteServerApiKey(config.remoteServerApiKey),
  getMaskedDiscordBotToken,
  getDiscordDefaultProfileId: (config) => getDiscordResolvedDefaultProfileId(config).profileId ?? "",
  getAcpxAgents: () => getEnabledAcpxAgentProfiles(agentProfileService.getAll())
    .map(p => ({ name: p.name, displayName: p.displayName })),
  getDiscordLifecycleAction,
  applyDiscordLifecycleAction,
  applyWhatsappToggle: handleWhatsAppToggle,
  applyDesktopShellSettings,
}

export function getSettings(providerSecretMask: string): SettingsActionResult {
  return getSettingsAction(providerSecretMask, settingsActionOptions)
}

export async function updateSettings(
  body: unknown,
  masks: SettingsUpdateMasks,
): Promise<SettingsActionResult> {
  return updateSettingsAction(body, masks, settingsActionOptions)
}
