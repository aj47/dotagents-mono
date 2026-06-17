import { describe, expect, it } from "vitest"

import {
  getSettingsNavigationState,
  getVisibleSettingsNavGroups,
  isConsolidatedSettingsRoute,
  normalizeSettingsPath,
} from "./settings-navigation"

describe("settings navigation", () => {
  it("maps consolidated settings routes to their internal group and subsection", () => {
    expect(getSettingsNavigationState("/settings")).toEqual({
      groupId: "app",
      itemHref: "/settings#general",
    })
    expect(getSettingsNavigationState("/settings#shortcuts")).toEqual({
      groupId: "app",
      itemHref: "/settings#shortcuts",
    })
    expect(getSettingsNavigationState("/settings/knowledge")).toEqual({
      groupId: "app",
      itemHref: "/settings/knowledge",
    })
    expect(getSettingsNavigationState("/settings/models")).toEqual({
      groupId: "intelligence",
      itemHref: "/settings/models#agent-models",
    })
    expect(
      getSettingsNavigationState("/settings/models#provider-setup"),
    ).toEqual({
      groupId: "intelligence",
      itemHref: "/settings/models#provider-setup",
    })
    expect(getSettingsNavigationState("/settings/agents")).toEqual({
      groupId: "agents",
      itemHref: "/settings/agents",
    })
    expect(getSettingsNavigationState("/settings#agent-settings")).toEqual({
      groupId: "agents",
      itemHref: "/settings#agent-settings",
    })
    expect(getSettingsNavigationState("/settings/capabilities")).toEqual({
      groupId: "agents",
      itemHref: "/settings/capabilities",
    })
    expect(getSettingsNavigationState("/settings/whatsapp")).toEqual({
      groupId: "connect",
      itemHref: "/settings/whatsapp",
    })
    expect(getSettingsNavigationState("/settings/remote-server")).toEqual({
      groupId: "connect",
      itemHref: "/settings#remote-server",
    })
  })

  it("keeps legacy settings routes attached to the consolidated settings nav", () => {
    expect(normalizeSettingsPath("/settings/general")).toBe("/settings")
    expect(normalizeSettingsPath("/settings/remote-server")).toBe(
      "/settings#remote-server",
    )
    expect(normalizeSettingsPath("/settings/langfuse")).toBe(
      "/settings#observability",
    )
    expect(normalizeSettingsPath("/settings/providers")).toBe(
      "/settings/models#provider-setup",
    )
    expect(normalizeSettingsPath("/settings/mcp-tools")).toBe(
      "/settings/capabilities",
    )
    expect(normalizeSettingsPath("/settings/skills")).toBe(
      "/settings/capabilities",
    )
    expect(normalizeSettingsPath("/settings/agent-personas")).toBe(
      "/settings/agents",
    )
  })

  it("excludes repeat tasks from the consolidated settings sidebar target", () => {
    expect(isConsolidatedSettingsRoute("/settings/models")).toBe(true)
    expect(isConsolidatedSettingsRoute("/settings/knowledge")).toBe(true)
    expect(isConsolidatedSettingsRoute("/settings/repeat-tasks")).toBe(false)
    expect(isConsolidatedSettingsRoute("/settings/loops")).toBe(false)
  })

  it("shows WhatsApp by default and gates Discord unless it is enabled or active", () => {
    const disabledGroups = getVisibleSettingsNavGroups({
      discordEnabled: false,
    })
    const disabledIntegrationItems =
      disabledGroups.find((group) => group.id === "connect")?.items ?? []

    expect(disabledIntegrationItems.map((item) => item.href)).toEqual([
      "/settings#remote-server",
      "/settings#cloudflare-tunnel",
      "/settings#whatsapp-integration",
      "/settings/whatsapp",
    ])

    const enabledGroups = getVisibleSettingsNavGroups({ discordEnabled: true })
    const enabledIntegrationItems =
      enabledGroups.find((group) => group.id === "connect")?.items ?? []

    expect(enabledIntegrationItems.map((item) => item.href)).toEqual([
      "/settings#remote-server",
      "/settings#cloudflare-tunnel",
      "/settings#whatsapp-integration",
      "/settings/whatsapp",
      "/settings#discord-integration",
      "/settings/discord",
    ])

    const activeDiscordGroups = getVisibleSettingsNavGroups({
      discordEnabled: false,
      activeItemHref: "/settings/discord",
    })
    const activeDiscordItems =
      activeDiscordGroups.find((group) => group.id === "connect")?.items ?? []

    expect(activeDiscordItems.map((item) => item.href)).toContain(
      "/settings/discord",
    )
  })

  it("shows repeat tasks as a separate automation group in the settings sidebar", () => {
    const groups = getVisibleSettingsNavGroups()
    const automationItems =
      groups.find((group) => group.id === "automation")?.items ?? []

    expect(automationItems.map((item) => item.href)).toEqual([
      "/settings/repeat-tasks",
    ])
  })

  it("exposes main settings page groups as sidebar anchors", () => {
    const groups = getVisibleSettingsNavGroups()

    expect(
      groups
        .find((group) => group.id === "app")
        ?.items.map((item) => item.href),
    ).toEqual([
      "/settings#general",
      "/settings#shortcuts",
      "/settings#panel-position",
      "/settings/knowledge",
    ])
    expect(
      groups
        .find((group) => group.id === "voice")
        ?.items.map((item) => item.href),
    ).toEqual([
      "/settings#audio-devices",
      "/settings#speech-to-text",
      "/settings#text-to-speech",
    ])
    expect(
      groups
        .find((group) => group.id === "connect")
        ?.items.map((item) => item.href),
    ).toEqual([
      "/settings#remote-server",
      "/settings#cloudflare-tunnel",
      "/settings#whatsapp-integration",
      "/settings/whatsapp",
    ])
    expect(
      groups
        .find((group) => group.id === "advanced")
        ?.items.map((item) => item.href),
    ).toEqual([
      "/settings#modular-config",
      "/settings#observability",
      "/settings#about",
    ])
  })

  it("consolidates model and provider setup into one intelligence page", () => {
    const groups = getVisibleSettingsNavGroups()

    expect(
      groups
        .find((group) => group.id === "intelligence")
        ?.items.map((item) => item.href),
    ).toEqual([
      "/settings/models#agent-models",
      "/settings/models#job-providers",
      "/settings/models#transcript-processing",
      "/settings/models#speech-voice-models",
      "/settings/models#provider-setup",
    ])
  })
})
