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
      groupId: "general",
      itemHref: "/settings",
    })
    expect(getSettingsNavigationState("/settings/knowledge")).toEqual({
      groupId: "general",
      itemHref: "/settings/knowledge",
    })
    expect(getSettingsNavigationState("/settings/models")).toEqual({
      groupId: "intelligence",
      itemHref: "/settings/models",
    })
    expect(getSettingsNavigationState("/settings/providers")).toEqual({
      groupId: "intelligence",
      itemHref: "/settings/providers",
    })
    expect(getSettingsNavigationState("/settings/agents")).toEqual({
      groupId: "agents",
      itemHref: "/settings/agents",
    })
    expect(getSettingsNavigationState("/settings/capabilities")).toEqual({
      groupId: "agents",
      itemHref: "/settings/capabilities",
    })
    expect(getSettingsNavigationState("/settings/whatsapp")).toEqual({
      groupId: "integrations",
      itemHref: "/settings/whatsapp",
    })
  })

  it("keeps legacy settings routes attached to the consolidated settings nav", () => {
    expect(normalizeSettingsPath("/settings/general")).toBe("/settings")
    expect(normalizeSettingsPath("/settings/remote-server")).toBe("/settings")
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
      disabledGroups.find((group) => group.id === "integrations")?.items ?? []

    expect(disabledIntegrationItems.map((item) => item.href)).toEqual([
      "/settings/whatsapp",
    ])

    const enabledGroups = getVisibleSettingsNavGroups({ discordEnabled: true })
    const enabledIntegrationItems =
      enabledGroups.find((group) => group.id === "integrations")?.items ?? []

    expect(enabledIntegrationItems.map((item) => item.href)).toEqual([
      "/settings/whatsapp",
      "/settings/discord",
    ])

    const activeDiscordGroups = getVisibleSettingsNavGroups({
      discordEnabled: false,
      activeItemHref: "/settings/discord",
    })
    const activeDiscordItems =
      activeDiscordGroups.find((group) => group.id === "integrations")?.items ??
      []

    expect(activeDiscordItems.map((item) => item.href)).toContain(
      "/settings/discord",
    )
  })
})
