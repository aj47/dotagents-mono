export type SettingsNavGroupId =
  | "app"
  | "intelligence"
  | "voice"
  | "agents"
  | "automation"
  | "connect"
  | "advanced"

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
    id: "app",
    label: "App",
    icon: "i-mingcute-settings-3-line",
    items: [
      {
        id: "general",
        label: "General",
        href: "/settings#general",
        icon: "i-mingcute-settings-3-line",
        groupId: "app",
      },
      {
        id: "shortcuts",
        label: "Shortcuts",
        href: "/settings#shortcuts",
        icon: "i-mingcute-keyboard-line",
        groupId: "app",
      },
      {
        id: "panel",
        label: "Floating Panel",
        href: "/settings#panel-position",
        icon: "i-mingcute-layout-6-line",
        groupId: "app",
      },
      {
        id: "knowledge",
        label: "Knowledge",
        href: "/settings/knowledge",
        icon: "i-mingcute-book-2-line",
        groupId: "app",
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
        href: "/settings/models#agent-models",
        icon: "i-mingcute-brain-line",
        groupId: "intelligence",
      },
      {
        id: "job-providers",
        label: "Job Routing",
        href: "/settings/models#job-providers",
        icon: "i-mingcute-tool-line",
        groupId: "intelligence",
      },
      {
        id: "transcript-processing",
        label: "Cleanup",
        href: "/settings/models#transcript-processing",
        icon: "i-mingcute-file-text-line",
        groupId: "intelligence",
      },
      {
        id: "speech-voice-models",
        label: "Speech & Voice",
        href: "/settings/models#speech-voice-models",
        icon: "i-mingcute-mic-line",
        groupId: "intelligence",
      },
      {
        id: "provider-setup",
        label: "Provider Setup",
        href: "/settings/models#provider-setup",
        icon: "i-mingcute-key-2-line",
        groupId: "intelligence",
      },
    ],
  },
  {
    id: "voice",
    label: "Voice",
    icon: "i-mingcute-mic-line",
    items: [
      {
        id: "audio-devices",
        label: "Audio Devices",
        href: "/settings#audio-devices",
        icon: "i-mingcute-volume-line",
        groupId: "voice",
      },
      {
        id: "speech-to-text",
        label: "Speech-to-Text",
        href: "/settings#speech-to-text",
        icon: "i-mingcute-mic-line",
        groupId: "voice",
      },
      {
        id: "text-to-speech",
        label: "Text to Speech",
        href: "/settings#text-to-speech",
        icon: "i-mingcute-volume-line",
        groupId: "voice",
      },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    icon: "i-mingcute-group-line",
    items: [
      {
        id: "agent-settings",
        label: "Agent Settings",
        href: "/settings#agent-settings",
        icon: "i-mingcute-robot-2-line",
        groupId: "agents",
      },
      {
        id: "agent-library",
        label: "Agent Library",
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
    id: "automation",
    label: "Automation",
    icon: "i-mingcute-repeat-line",
    items: [
      {
        id: "repeat-tasks",
        label: "Repeat Tasks",
        href: "/settings/repeat-tasks",
        icon: "i-mingcute-repeat-line",
        groupId: "automation",
      },
    ],
  },
  {
    id: "connect",
    label: "Connect",
    icon: "i-mingcute-message-4-line",
    items: [
      {
        id: "remote-server",
        label: "Remote Server",
        href: "/settings#remote-server",
        icon: "i-mingcute-qr-code-line",
        groupId: "connect",
      },
      {
        id: "cloudflare-tunnel",
        label: "Cloudflare Tunnel",
        href: "/settings#cloudflare-tunnel",
        icon: "i-mingcute-cloud-line",
        groupId: "connect",
      },
      {
        id: "whatsapp-integration",
        label: "WhatsApp Integration",
        href: "/settings#whatsapp-integration",
        icon: "i-mingcute-message-4-line",
        groupId: "connect",
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        href: "/settings/whatsapp",
        icon: "i-mingcute-message-4-line",
        groupId: "connect",
      },
      {
        id: "discord-integration",
        label: "Discord Integration",
        href: "/settings#discord-integration",
        icon: "i-mingcute-discord-line",
        groupId: "connect",
        requires: "discord",
      },
      {
        id: "discord",
        label: "Discord",
        href: "/settings/discord",
        icon: "i-mingcute-discord-line",
        groupId: "connect",
        requires: "discord",
      },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: "i-mingcute-settings-6-line",
    items: [
      {
        id: "modular-config",
        label: "Modular Config",
        href: "/settings#modular-config",
        icon: "i-mingcute-folder-open-line",
        groupId: "advanced",
      },
      {
        id: "observability",
        label: "Observability",
        href: "/settings#observability",
        icon: "i-mingcute-pulse-line",
        groupId: "advanced",
      },
      {
        id: "about",
        label: "About",
        href: "/settings#about",
        icon: "i-mingcute-information-line",
        groupId: "advanced",
      },
    ],
  },
]

const SETTINGS_ROUTE_ALIASES: Record<string, string> = {
  "/settings/general": "/settings",
  "/settings/langfuse": "/settings#observability",
  "/settings/remote-server": "/settings#remote-server",
  "/settings/providers": "/settings/models#provider-setup",
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

function splitSettingsLocation(pathname: string): {
  path: string
  hash: string
} {
  const [withoutHash, hash = ""] = pathname.split("#", 2)
  return {
    path: withoutHash.split("?", 1)[0] || "/",
    hash: hash ? `#${hash}` : "",
  }
}

function pathnameOnly(pathname: string): string {
  return splitSettingsLocation(pathname).path
}

export function isConsolidatedSettingsRoute(pathname: string): boolean {
  const path = pathnameOnly(pathname)
  if (path !== "/settings" && !path.startsWith("/settings/")) return false
  return !SETTINGS_NAV_EXCLUDED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

export function normalizeSettingsPath(pathname: string): string {
  const { path, hash } = splitSettingsLocation(pathname)
  const aliasTarget = SETTINGS_ROUTE_ALIASES[path]
  if (!aliasTarget) return `${path}${hash}`

  const aliasLocation = splitSettingsLocation(aliasTarget)
  return `${aliasLocation.path}${hash || aliasLocation.hash}`
}

export function getSettingsNavigationState(
  pathname: string,
): SettingsNavigationState {
  const normalizedPath = normalizeSettingsPath(pathname)
  const normalizedRoutePath = pathnameOnly(normalizedPath)

  for (const group of SETTINGS_NAV_GROUPS) {
    for (const item of group.items) {
      const itemLocation = splitSettingsLocation(item.href)
      const isItemRoute = item.href.includes("#")
        ? normalizedPath === item.href ||
          (!splitSettingsLocation(normalizedPath).hash &&
            normalizedRoutePath === itemLocation.path)
        : item.href === "/settings"
          ? normalizedRoutePath === item.href
          : normalizedRoutePath === item.href ||
            normalizedRoutePath.startsWith(`${item.href}/`)
      if (isItemRoute) {
        return {
          groupId: group.id,
          itemHref: item.href,
        }
      }
    }
  }

  return {
    groupId: "app",
    itemHref: "/settings#general",
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
