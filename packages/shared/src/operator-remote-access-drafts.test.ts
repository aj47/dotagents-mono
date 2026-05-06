import { describe, expect, it } from "vitest"

import { buildOperatorRemoteAccessDrafts } from "./operator-remote-access-drafts"
import type { Settings } from "./api-types"

describe("operator remote access drafts", () => {
  it("builds default remote access drafts without settings", () => {
    expect(buildOperatorRemoteAccessDrafts(null)).toEqual({
      remoteServerPort: "3210",
      remoteServerCorsOrigins: "*",
      remoteServerOperatorAllowDeviceIds: "",
      cloudflareTunnelId: "",
      cloudflareTunnelName: "",
      cloudflareTunnelHostname: "",
      cloudflareTunnelCredentialsPath: "",
      whatsappOperatorAllowFrom: "",
      discordOperatorAllowUserIds: "",
      discordOperatorAllowGuildIds: "",
      discordOperatorAllowChannelIds: "",
      discordOperatorAllowRoleIds: "",
    })
  })

  it("builds text drafts from persisted remote access settings", () => {
    const settings = {
      remoteServerPort: 4545,
      remoteServerCorsOrigins: ["https://app.example", "https://admin.example"],
      remoteServerOperatorAllowDeviceIds: ["device-1", "device-2"],
      cloudflareTunnelId: "tunnel-id",
      cloudflareTunnelName: "ops",
      cloudflareTunnelHostname: "ops.example.com",
      cloudflareTunnelCredentialsPath: "/tmp/creds.json",
      whatsappOperatorAllowFrom: ["+15550001000"],
      discordOperatorAllowUserIds: ["user-1"],
      discordOperatorAllowGuildIds: ["guild-1"],
      discordOperatorAllowChannelIds: ["channel-1"],
      discordOperatorAllowRoleIds: ["role-1"],
    } as Settings

    expect(buildOperatorRemoteAccessDrafts(settings)).toEqual({
      remoteServerPort: "4545",
      remoteServerCorsOrigins: "https://app.example, https://admin.example",
      remoteServerOperatorAllowDeviceIds: "device-1, device-2",
      cloudflareTunnelId: "tunnel-id",
      cloudflareTunnelName: "ops",
      cloudflareTunnelHostname: "ops.example.com",
      cloudflareTunnelCredentialsPath: "/tmp/creds.json",
      whatsappOperatorAllowFrom: "+15550001000",
      discordOperatorAllowUserIds: "user-1",
      discordOperatorAllowGuildIds: "guild-1",
      discordOperatorAllowChannelIds: "channel-1",
      discordOperatorAllowRoleIds: "role-1",
    })
  })
})
