export type SettingsNavGroupId =
  | "general"
  | "intelligence"
  | "agents"
  | "integrations"

export type SettingsNavIntegrationGate = "discord"

export interface SettingsNavItem {
  id: string
  label: string
  href: string
  icon: string
  groupId: SettingsNavGroupId
  requires?: SettingsNavIntegrationGate
}

export interface SettingsNavGroup {
  id: SettingsNavGroupId
  label: string
  icon: string
  items: readonly SettingsNavItem[]
}

export interface SettingsNavigationState {
  groupId: SettingsNavGroupId
  itemHref: string
}

export interface SettingsNavVisibility {
  discordEnabled?: boolean
  activeItemHref?: string
}

export const SETTINGS_NAV_GROUPS: readonly SettingsNavGroup[] = [
  {
    id: "general",
    label: "General",
    icon: "i-mingcute-settings-3-line",
    items: [
      {
        id: "general",
        label: "General",
        href: "/settings",
        icon: "i-mingcute-settings-3-line",
        groupId: "general",
      },
      {
        id: "knowledge",
        label: "Knowledge",
        href: "/settings/knowledge",
        icon: "i-mingcute-book-2-line",
        groupId: "general",
      },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: "i-mingcute-brain-line",
    items: [
      {
        id: "models",
        label: "Models",
        href: "/settings/models",
        icon: "i-mingcute-brain-line",
        groupId: "intelligence",
      },
      {
        id: "providers",
        label: "Providers",
        href: "/settings/providers",
        icon: "i-mingcute-tool-line",
        groupId: "intelligence",
      },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    icon: "i-mingcute-group-line",
    items: [
      {
        id: "agents",
        label: "Agents",
        href: "/settings/agents",
        icon: "i-mingcute-group-line",
        groupId: "agents",
      },
      {
        id: "capabilities",
        label: "Capabilities",
        href: "/settings/capabilities",
        icon: "i-mingcute-tool-line",
        groupId: "agents",
      },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: "i-mingcute-message-4-line",
    items: [
      {
        id: "whatsapp",
        label: "WhatsApp",
        href: "/settings/whatsapp",
        icon: "i-mingcute-message-4-line",
        groupId: "integrations",
      },
      {
        id: "discord",
        label: "Discord",
        href: "/settings/discord",
        icon: "i-mingcute-discord-line",
        groupId: "integrations",
        requires: "discord",
      },
    ],
  },
]

const SETTINGS_ROUTE_ALIASES: Record<string, string> = {
  "/settings/general": "/settings",
  "/settings/langfuse": "/settings",
  "/settings/remote-server": "/settings",
  "/settings/mcp-tools": "/settings/capabilities",
  "/settings/skills": "/settings/capabilities",
  "/settings/agent-personas": "/settings/agents",
  "/settings/external-agents": "/settings/agents",
  "/settings/agent-profiles": "/settings/agents",
}

const SETTINGS_NAV_EXCLUDED_PREFIXES = [
  "/settings/repeat-tasks",
  "/settings/loops",
] as const

function pathnameOnly(pathname: string): string {
  return pathname.split(/[?#]/, 1)[0] || "/"
}

export function isConsolidatedSettingsRoute(pathname: string): boolean {
  const path = pathnameOnly(pathname)
  if (path !== "/settings" && !path.startsWith("/settings/")) return false
  return !SETTINGS_NAV_EXCLUDED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

export function normalizeSettingsPath(pathname: string): string {
  const path = pathnameOnly(pathname)
  return SETTINGS_ROUTE_ALIASES[path] ?? path
}

export function getSettingsNavigationState(
  pathname: string,
): SettingsNavigationState {
  const normalizedPath = normalizeSettingsPath(pathname)

  for (const group of SETTINGS_NAV_GROUPS) {
    for (const item of group.items) {
      const isItemRoute =
        item.href === "/settings"
          ? normalizedPath === item.href
          : normalizedPath === item.href ||
            normalizedPath.startsWith(`${item.href}/`)
      if (isItemRoute) {
        return {
          groupId: group.id,
          itemHref: item.href,
        }
      }
    }
  }

  return {
    groupId: "general",
    itemHref: "/settings",
  }
}

export function getVisibleSettingsNavGroups({
  discordEnabled = false,
  activeItemHref,
}: SettingsNavVisibility = {}): SettingsNavGroup[] {
  return SETTINGS_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.requires === "discord") {
        return discordEnabled || activeItemHref === item.href
      }
      return true
    }),
  })).filter((group) => group.items.length > 0)
}
