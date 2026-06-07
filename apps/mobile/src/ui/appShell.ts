export const APP_SHELL_PRODUCT_LABEL = 'DotAgents';

export const APP_SHELL_BREAKPOINTS = {
  desktopMinWidth: 768,
} as const;

export const APP_SHELL_DIMENSIONS = {
  desktopRailWidth: 176,
  desktopSettingsNavWidth: 220,
  desktopContentMaxWidth: 920,
  compactPrimaryNavHeight: 49,
  desktopNavItemMinHeight: 34,
  desktopRailHorizontalPadding: 10,
  desktopRailVerticalPadding: 12,
} as const;

export type AppShellLayout = 'compact' | 'desktop';

export function resolveAppShellLayout(width: number): AppShellLayout {
  const normalizedWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
  return normalizedWidth >= APP_SHELL_BREAKPOINTS.desktopMinWidth ? 'desktop' : 'compact';
}

export type AppShellPrimaryNavItemId = 'sessions' | 'agents' | 'knowledge' | 'goals' | 'decisions' | 'settings';

export type AppShellMobileSettingsSectionId =
  | 'providerSelection'
  | 'providerSetup'
  | 'profileModel'
  | 'bundles'
  | 'streamerMode'
  | 'speechToText'
  | 'textToSpeech'
  | 'agentSettings'
  | 'toolExecution'
  | 'mcpServers'
  | 'whatsapp'
  | 'discord'
  | 'langfuse'
  | 'skills'
  | 'knowledgeNotes'
  | 'agents'
  | 'agentLoops';

export type AppShellMobileSettingsSection = {
  id: AppShellMobileSettingsSectionId;
  title: string;
  defaultExpanded: boolean;
};

export const APP_SHELL_MOBILE_SETTINGS_SECTIONS: AppShellMobileSettingsSection[] = [
  { id: 'providerSelection', title: 'Provider Selection', defaultExpanded: false },
  { id: 'providerSetup', title: 'Provider Setup', defaultExpanded: false },
  { id: 'profileModel', title: 'Profile & Model', defaultExpanded: true },
  { id: 'bundles', title: 'Bundles', defaultExpanded: false },
  { id: 'streamerMode', title: 'Streamer Mode', defaultExpanded: false },
  { id: 'speechToText', title: 'Speech-to-Text', defaultExpanded: false },
  { id: 'textToSpeech', title: 'Text-to-Speech', defaultExpanded: true },
  { id: 'agentSettings', title: 'Agent Settings', defaultExpanded: false },
  { id: 'toolExecution', title: 'Tool Execution', defaultExpanded: false },
  { id: 'mcpServers', title: 'MCP Servers', defaultExpanded: true },
  { id: 'whatsapp', title: 'WhatsApp', defaultExpanded: false },
  { id: 'discord', title: 'Discord', defaultExpanded: false },
  { id: 'langfuse', title: 'Langfuse', defaultExpanded: false },
  { id: 'skills', title: 'Skills', defaultExpanded: false },
  { id: 'knowledgeNotes', title: 'Knowledge Notes', defaultExpanded: false },
  { id: 'agents', title: 'Agents', defaultExpanded: false },
  { id: 'agentLoops', title: 'Agent Loops', defaultExpanded: false },
];

export const APP_SHELL_MOBILE_SETTINGS_SECTION_IDS = APP_SHELL_MOBILE_SETTINGS_SECTIONS.map(
  (section) => section.id,
);

export function isAppShellMobileSettingsSectionId(
  value: unknown,
): value is AppShellMobileSettingsSectionId {
  return (
    typeof value === 'string' &&
    APP_SHELL_MOBILE_SETTINGS_SECTION_IDS.includes(value as AppShellMobileSettingsSectionId)
  );
}

export function getAppShellMobileSettingsInitialExpandedState(): Record<AppShellMobileSettingsSectionId, boolean> {
  return Object.fromEntries(
    APP_SHELL_MOBILE_SETTINGS_SECTIONS.map((section) => [section.id, section.defaultExpanded]),
  ) as Record<AppShellMobileSettingsSectionId, boolean>;
}

export type AppShellPrimaryNavItem = {
  id: AppShellPrimaryNavItemId;
  label: string;
  mobileRouteName: string;
  mobileRouteParams?: {
    initialSection?: AppShellMobileSettingsSectionId;
  };
};

export const APP_SHELL_PRIMARY_NAV_ITEMS: AppShellPrimaryNavItem[] = [
  { id: 'sessions', label: 'Chats', mobileRouteName: 'Sessions' },
  {
    id: 'agents',
    label: 'Agents',
    mobileRouteName: 'Settings',
    mobileRouteParams: { initialSection: 'agents' },
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    mobileRouteName: 'Settings',
    mobileRouteParams: { initialSection: 'knowledgeNotes' },
  },
  { id: 'goals', label: 'Goals', mobileRouteName: 'Goals' },
  { id: 'decisions', label: 'Decisions', mobileRouteName: 'Decisions' },
  { id: 'settings', label: 'Settings', mobileRouteName: 'Settings' },
];

export const APP_SHELL_HEADER_ACTIONS = {
  closeSettings: {
    label: 'Close settings',
    displayLabel: 'Close',
  },
} as const;

export const APP_SHELL_MOBILE_ROUTE_TITLES = {
  Settings: 'DotAgents',
  ConnectionSettings: 'Connection',
  Operations: 'Operations',
  Sessions: 'Chats',
  Chat: 'Chat',
  AgentEdit: 'Agent',
  KnowledgeNoteEdit: 'Note',
  LoopEdit: 'Loop',
  SkillEdit: 'Skill',
  Goals: 'Goals',
  GoalEdit: 'Goal',
  Decisions: 'Decisions',
} as const;

const APP_SHELL_MOBILE_DESKTOP_SHELL_HEADERLESS_ROUTES = ['Sessions', 'Settings', 'Goals', 'Decisions'] as const;

export function shouldHideMobileStackHeaderForDesktopShell(routeName: string): boolean {
  return APP_SHELL_MOBILE_DESKTOP_SHELL_HEADERLESS_ROUTES.includes(
    routeName as (typeof APP_SHELL_MOBILE_DESKTOP_SHELL_HEADERLESS_ROUTES)[number],
  );
}

export function getMobilePrimaryNavItemId(routeName: string): AppShellPrimaryNavItemId {
  if (routeName === 'Sessions' || routeName === 'Chat') return 'sessions';
  if (routeName === 'Goals' || routeName === 'GoalEdit') return 'goals';
  if (routeName === 'Decisions') return 'decisions';
  if (routeName === 'Settings') return 'settings';
  return 'sessions';
}

export type AppShellSettingsNavItemId =
  | 'general'
  | 'models'
  | 'providers'
  | 'knowledge'
  | 'agents'
  | 'capabilities'
  | 'whatsapp'
  | 'discord'
  | 'repeatTasks';

export type AppShellSettingsFeature = 'whatsapp' | 'discord';

export type AppShellSettingsNavItem = {
  id: AppShellSettingsNavItemId;
  label: string;
  mobileSectionId?: AppShellMobileSettingsSectionId;
  feature?: AppShellSettingsFeature;
};

const APP_SHELL_SETTINGS_NAV_ITEMS: AppShellSettingsNavItem[] = [
  { id: 'general', label: 'General' },
  { id: 'models', label: 'Models', mobileSectionId: 'profileModel' },
  { id: 'providers', label: 'Providers', mobileSectionId: 'providerSelection' },
  { id: 'knowledge', label: 'Knowledge', mobileSectionId: 'knowledgeNotes' },
  { id: 'agents', label: 'Agents', mobileSectionId: 'agents' },
  { id: 'capabilities', label: 'Capabilities', mobileSectionId: 'mcpServers' },
  { id: 'whatsapp', label: 'WhatsApp', mobileSectionId: 'whatsapp', feature: 'whatsapp' },
  { id: 'discord', label: 'Discord', mobileSectionId: 'discord', feature: 'discord' },
  { id: 'repeatTasks', label: 'Repeat Tasks', mobileSectionId: 'agentLoops' },
];

const APP_SHELL_DESKTOP_SETTINGS_MOBILE_SECTION_IDS: Record<
  AppShellSettingsNavItemId,
  AppShellMobileSettingsSectionId[]
> = {
  general: ['bundles', 'streamerMode', 'langfuse'],
  models: ['profileModel'],
  providers: ['providerSelection', 'providerSetup', 'speechToText', 'textToSpeech'],
  knowledge: ['knowledgeNotes'],
  agents: ['agents'],
  capabilities: ['agentSettings', 'toolExecution', 'mcpServers', 'skills'],
  whatsapp: ['whatsapp'],
  discord: ['discord'],
  repeatTasks: ['agentLoops'],
};

export function getAppShellMobileSettingsSectionIdsForDesktopNavItem(
  id: AppShellSettingsNavItemId,
): AppShellMobileSettingsSectionId[] {
  return APP_SHELL_DESKTOP_SETTINGS_MOBILE_SECTION_IDS[id];
}

export function getAppShellDesktopSettingsNavItemIdForMobileSection(
  sectionId: AppShellMobileSettingsSectionId,
): AppShellSettingsNavItemId {
  return (
    APP_SHELL_SETTINGS_NAV_ITEMS.find((item) =>
      APP_SHELL_DESKTOP_SETTINGS_MOBILE_SECTION_IDS[item.id].includes(sectionId),
    )?.id ?? 'general'
  );
}

export function getDesktopSettingsNavItems(features: {
  whatsappEnabled: boolean;
  discordEnabled: boolean;
}): AppShellSettingsNavItem[] {
  return APP_SHELL_SETTINGS_NAV_ITEMS.filter((item) => {
    if (item.feature === 'whatsapp') return features.whatsappEnabled;
    if (item.feature === 'discord') return features.discordEnabled;
    return true;
  });
}

export type AppShellEditorKind = 'agent' | 'knowledgeNote' | 'loop' | 'skill';

const APP_SHELL_EDITOR_TITLES: Record<AppShellEditorKind, { createTitle: string; editTitle: string }> = {
  agent: { createTitle: 'Create Agent', editTitle: 'Edit Agent' },
  knowledgeNote: { createTitle: 'Create Note', editTitle: 'Edit Note' },
  loop: { createTitle: 'Create Loop', editTitle: 'Edit Loop' },
  skill: { createTitle: 'Create Skill', editTitle: 'Edit Skill' },
};

export function getAppShellEditorTitle(kind: AppShellEditorKind, isEditing: boolean): string {
  const title = APP_SHELL_EDITOR_TITLES[kind];
  return isEditing ? title.editTitle : title.createTitle;
}
