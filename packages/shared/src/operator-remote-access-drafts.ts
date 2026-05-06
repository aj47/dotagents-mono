import type { Settings } from "./api-types"
import { formatConfigListInput } from "./config-list-input"
import {
  DEFAULT_REMOTE_SERVER_CORS_ORIGINS,
  DEFAULT_REMOTE_SERVER_PORT,
} from "./remote-pairing"

export type OperatorRemoteAccessDrafts = {
  remoteServerPort: string
  remoteServerCorsOrigins: string
  remoteServerOperatorAllowDeviceIds: string
  cloudflareTunnelId: string
  cloudflareTunnelName: string
  cloudflareTunnelHostname: string
  cloudflareTunnelCredentialsPath: string
  whatsappOperatorAllowFrom: string
  discordOperatorAllowUserIds: string
  discordOperatorAllowGuildIds: string
  discordOperatorAllowChannelIds: string
  discordOperatorAllowRoleIds: string
}

export function buildOperatorRemoteAccessDrafts(settings: Settings | null): OperatorRemoteAccessDrafts {
  return {
    remoteServerPort: String(settings?.remoteServerPort ?? DEFAULT_REMOTE_SERVER_PORT),
    remoteServerCorsOrigins: formatConfigListInput(settings?.remoteServerCorsOrigins ?? DEFAULT_REMOTE_SERVER_CORS_ORIGINS),
    remoteServerOperatorAllowDeviceIds: formatConfigListInput(settings?.remoteServerOperatorAllowDeviceIds),
    cloudflareTunnelId: settings?.cloudflareTunnelId ?? "",
    cloudflareTunnelName: settings?.cloudflareTunnelName ?? "",
    cloudflareTunnelHostname: settings?.cloudflareTunnelHostname ?? "",
    cloudflareTunnelCredentialsPath: settings?.cloudflareTunnelCredentialsPath ?? "",
    whatsappOperatorAllowFrom: formatConfigListInput(settings?.whatsappOperatorAllowFrom),
    discordOperatorAllowUserIds: formatConfigListInput(settings?.discordOperatorAllowUserIds),
    discordOperatorAllowGuildIds: formatConfigListInput(settings?.discordOperatorAllowGuildIds),
    discordOperatorAllowChannelIds: formatConfigListInput(settings?.discordOperatorAllowChannelIds),
    discordOperatorAllowRoleIds: formatConfigListInput(settings?.discordOperatorAllowRoleIds),
  }
}
