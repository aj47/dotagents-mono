import { SIDEBAR_DIMENSIONS } from "./sidebar-persistence"
import type { BundleComponentKey } from "./bundle-api"

export const APP_SHELL_PRODUCT_LABEL = "DotAgents"

export const APP_SHELL_SETTINGS_FEEDBACK_LABELS = {
  cannotDelete: "Cannot Delete",
  error: "Error",
  partialDelete: "Partial Delete",
  saved: "Saved",
  success: "Success",
} as const

export const APP_SHELL_BREAKPOINTS = {
  compactMaxWidth: 767,
  desktopMinWidth: 768,
  splitPaneSideBySideMinWidth: 960,
} as const

export const APP_SHELL_DIMENSIONS = {
  desktopRailWidth: SIDEBAR_DIMENSIONS.width.default,
  desktopSettingsNavWidth: 220,
  desktopContentMaxWidth: 920,
  compactPrimaryNavHeight: 49,
  desktopNavItemMinHeight: 34,
  desktopRailHorizontalPadding: 10,
  desktopRailVerticalPadding: 12,
} as const

export type AppShellLayout = "compact" | "desktop"

export function resolveAppShellLayout(width: number): AppShellLayout {
  const normalizedWidth = Number.isFinite(width) ? Math.max(0, width) : 0
  return normalizedWidth >= APP_SHELL_BREAKPOINTS.desktopMinWidth
    ? "desktop"
    : "compact"
}

export function shouldUseCompactAppShell(width: number): boolean {
  return resolveAppShellLayout(width) === "compact"
}

export type AppShellPrimaryNavItemId =
  | "sessions"
  | "agents"
  | "knowledge"
  | "settings"

export type AppShellMobileSettingsSectionId =
  | "providerSelection"
  | "providerSetup"
  | "profileModel"
  | "bundles"
  | "streamerMode"
  | "speechToText"
  | "textToSpeech"
  | "agentSettings"
  | "toolExecution"
  | "mcpServers"
  | "whatsapp"
  | "discord"
  | "langfuse"
  | "skills"
  | "knowledgeNotes"
  | "agents"
  | "agentLoops"

export type AppShellMobileSettingsSection = {
  id: AppShellMobileSettingsSectionId
  title: string
  defaultExpanded: boolean
}

export const APP_SHELL_MOBILE_SETTINGS_SECTIONS: AppShellMobileSettingsSection[] =
  [
    {
      id: "providerSelection",
      title: "Provider Selection",
      defaultExpanded: false,
    },
    { id: "providerSetup", title: "Provider Setup", defaultExpanded: false },
    { id: "profileModel", title: "Profile & Model", defaultExpanded: true },
    { id: "bundles", title: "Bundles", defaultExpanded: false },
    { id: "streamerMode", title: "Streamer Mode", defaultExpanded: false },
    { id: "speechToText", title: "Speech-to-Text", defaultExpanded: false },
    { id: "textToSpeech", title: "Text-to-Speech", defaultExpanded: true },
    { id: "agentSettings", title: "Agent Settings", defaultExpanded: false },
    { id: "toolExecution", title: "Tool Execution", defaultExpanded: false },
    { id: "mcpServers", title: "MCP Servers", defaultExpanded: true },
    { id: "whatsapp", title: "WhatsApp", defaultExpanded: false },
    { id: "discord", title: "Discord", defaultExpanded: false },
    { id: "langfuse", title: "Langfuse", defaultExpanded: false },
    { id: "skills", title: "Skills", defaultExpanded: false },
    { id: "knowledgeNotes", title: "Knowledge Notes", defaultExpanded: false },
    { id: "agents", title: "Agents", defaultExpanded: false },
    { id: "agentLoops", title: "Agent Loops", defaultExpanded: false },
  ]

export const APP_SHELL_MOBILE_SETTINGS_SECTION_IDS: AppShellMobileSettingsSectionId[] =
  APP_SHELL_MOBILE_SETTINGS_SECTIONS.map((section) => section.id)

export function isAppShellMobileSettingsSectionId(
  value: unknown,
): value is AppShellMobileSettingsSectionId {
  return (
    typeof value === "string" &&
    APP_SHELL_MOBILE_SETTINGS_SECTION_IDS.includes(
      value as AppShellMobileSettingsSectionId,
    )
  )
}

export function getAppShellMobileSettingsSectionTitle(
  id: AppShellMobileSettingsSectionId,
): string {
  return (
    APP_SHELL_MOBILE_SETTINGS_SECTIONS.find((section) => section.id === id)
      ?.title ?? id
  )
}

export function getAppShellMobileSettingsInitialExpandedState(): Record<
  AppShellMobileSettingsSectionId,
  boolean
> {
  return Object.fromEntries(
    APP_SHELL_MOBILE_SETTINGS_SECTIONS.map((section) => [
      section.id,
      section.defaultExpanded,
    ]),
  ) as Record<AppShellMobileSettingsSectionId, boolean>
}

export type AppShellPrimaryNavItem = {
  id: AppShellPrimaryNavItemId
  label: string
  desktopPath: string
  mobileRouteName: string
  mobileRouteParams?: {
    initialSection?: AppShellMobileSettingsSectionId
  }
}

export const APP_SHELL_PRIMARY_NAV_ITEMS: AppShellPrimaryNavItem[] = [
  {
    id: "sessions",
    label: "Chats",
    desktopPath: "/",
    mobileRouteName: "Sessions",
  },
  {
    id: "agents",
    label: "Agents",
    desktopPath: "/settings/agents?view=list",
    mobileRouteName: "Settings",
    mobileRouteParams: { initialSection: "agents" },
  },
  {
    id: "knowledge",
    label: "Knowledge",
    desktopPath: "/knowledge",
    mobileRouteName: "Settings",
    mobileRouteParams: { initialSection: "knowledgeNotes" },
  },
  {
    id: "settings",
    label: "Settings",
    desktopPath: "/settings",
    mobileRouteName: "Settings",
  },
]

export function getAppShellPrimaryNavItem(
  id: AppShellPrimaryNavItemId,
): AppShellPrimaryNavItem {
  return (
    APP_SHELL_PRIMARY_NAV_ITEMS.find((item) => item.id === id) ??
    APP_SHELL_PRIMARY_NAV_ITEMS[0]
  )
}

export function getAppShellPrimaryNavItemLabel(
  id: AppShellPrimaryNavItemId,
): string {
  return getAppShellPrimaryNavItem(id).label
}

export const APP_SHELL_HEADER_ACTIONS = {
  savedConversations: {
    label: "Saved conversations",
  },
  startTextSession: {
    label: "Start with text",
    displayLabel: "Start with Text",
  },
  startVoiceSession: {
    label: "Start with voice",
    displayLabel: "Start with Voice",
  },
  newChat: {
    label: "New chat",
    displayLabel: "+ New Chat",
    hint: "Creates and opens a new chat.",
  },
  openSplitView: {
    label: "Open split view",
    hint: "Opens two chats at once for comparison",
  },
  openSettings: {
    label: "Open settings",
    hint: "Opens app settings.",
  },
  closeSettings: {
    label: "Close settings",
    displayLabel: "Close",
  },
  emergencyStopAll: {
    label: "Emergency stop all agent sessions",
  },
} as const

export const APP_SHELL_SESSION_START_PRESENTATION = {
  emptyTitle: "No Active Sessions",
  emptyDescription:
    "Start a new agent session using text or voice input. Your sessions will appear here as tiles.",
  agentSelectorLabel: "Agent",
  idleDescription: "Start a new agent session",
  newTextActionLabel: "New Text",
  voiceActionLabel: "Voice",
  textInputPlaceholder:
    "Type your message... (Enter to send, Shift+Enter for new line, Esc to cancel)",
  keybindLabels: {
    text: "Text:",
    voice: "Voice:",
    dictation: "Dictation:",
  },
} as const

export type AppShellHeaderActionId = keyof typeof APP_SHELL_HEADER_ACTIONS

type AppShellHeaderActionPresentation = {
  label: string
  displayLabel?: string
  hint?: string
}

export function getAppShellHeaderActionLabel(
  id: AppShellHeaderActionId,
): string {
  return APP_SHELL_HEADER_ACTIONS[id].label
}

export function getAppShellHeaderActionDisplayLabel(
  id: AppShellHeaderActionId,
): string {
  const action = APP_SHELL_HEADER_ACTIONS[
    id
  ] as AppShellHeaderActionPresentation
  return action.displayLabel ?? action.label
}

export function getAppShellHeaderActionHint(
  id: AppShellHeaderActionId,
): string | undefined {
  const action = APP_SHELL_HEADER_ACTIONS[
    id
  ] as AppShellHeaderActionPresentation
  return action.hint
}

export function getAppShellGlobalTtsToggleLabel(isEnabled: boolean): string {
  return isEnabled ? "Disable global TTS" : "Enable global TTS"
}

export function getAppShellSidebarToggleLabel(isCollapsed: boolean): string {
  return isCollapsed ? "Expand sidebar" : "Collapse sidebar"
}

export type AppShellSettingsNavItemId =
  | "general"
  | "models"
  | "providers"
  | "knowledge"
  | "agents"
  | "capabilities"
  | "whatsapp"
  | "discord"
  | "repeatTasks"

export type AppShellSettingsFeature = "whatsapp" | "discord"

export type AppShellSettingsNavItem = {
  id: AppShellSettingsNavItemId
  label: string
  desktopPath: string
  mobileSectionId?: AppShellMobileSettingsSectionId
  feature?: AppShellSettingsFeature
}

export const APP_SHELL_SETTINGS_NAV_ITEMS: AppShellSettingsNavItem[] = [
  { id: "general", label: "General", desktopPath: "/settings" },
  {
    id: "models",
    label: "Models",
    desktopPath: "/settings/models",
    mobileSectionId: "profileModel",
  },
  {
    id: "providers",
    label: "Providers",
    desktopPath: "/settings/providers",
    mobileSectionId: "providerSelection",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    desktopPath: "/knowledge",
    mobileSectionId: "knowledgeNotes",
  },
  {
    id: "agents",
    label: "Agents",
    desktopPath: "/settings/agents",
    mobileSectionId: "agents",
  },
  {
    id: "capabilities",
    label: "Capabilities",
    desktopPath: "/settings/capabilities",
    mobileSectionId: "mcpServers",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    desktopPath: "/settings/whatsapp",
    mobileSectionId: "whatsapp",
    feature: "whatsapp",
  },
  {
    id: "discord",
    label: "Discord",
    desktopPath: "/settings/discord",
    mobileSectionId: "discord",
    feature: "discord",
  },
  {
    id: "repeatTasks",
    label: "Repeat Tasks",
    desktopPath: "/settings/repeat-tasks",
    mobileSectionId: "agentLoops",
  },
]

export const APP_SHELL_DESKTOP_SETTINGS_MOBILE_SECTION_IDS: Record<
  AppShellSettingsNavItemId,
  AppShellMobileSettingsSectionId[]
> = {
  general: ["bundles", "streamerMode", "langfuse"],
  models: ["profileModel"],
  providers: [
    "providerSelection",
    "providerSetup",
    "speechToText",
    "textToSpeech",
  ],
  knowledge: ["knowledgeNotes"],
  agents: ["agents"],
  capabilities: ["agentSettings", "toolExecution", "mcpServers", "skills"],
  whatsapp: ["whatsapp"],
  discord: ["discord"],
  repeatTasks: ["agentLoops"],
} as const

export function getAppShellMobileSettingsSectionIdsForDesktopNavItem(
  id: AppShellSettingsNavItemId,
): AppShellMobileSettingsSectionId[] {
  return APP_SHELL_DESKTOP_SETTINGS_MOBILE_SECTION_IDS[id]
}

export function getAppShellDesktopSettingsNavItemIdForMobileSection(
  sectionId: AppShellMobileSettingsSectionId,
): AppShellSettingsNavItemId {
  return (
    APP_SHELL_SETTINGS_NAV_ITEMS.find((item) =>
      APP_SHELL_DESKTOP_SETTINGS_MOBILE_SECTION_IDS[item.id].includes(
        sectionId,
      ),
    )?.id ?? "general"
  )
}

export const APP_SHELL_MOBILE_ROUTE_TITLES = {
  Settings: "DotAgents",
  ConnectionSettings: "Connection",
  Operations: "Operations",
  Sessions: "Chats",
  SplitChat: "Split View",
  Chat: "Chat",
  AgentEdit: "Agent",
  KnowledgeNoteEdit: "Note",
  LoopEdit: "Loop",
  SkillEdit: "Skill",
} as const

export type AppShellMobileRouteName = keyof typeof APP_SHELL_MOBILE_ROUTE_TITLES

export const APP_SHELL_MOBILE_DESKTOP_SHELL_HEADERLESS_ROUTES = [
  "Sessions",
  "Settings",
] as const

export function shouldHideMobileStackHeaderForDesktopShell(
  routeName: string,
): boolean {
  return APP_SHELL_MOBILE_DESKTOP_SHELL_HEADERLESS_ROUTES.includes(
    routeName as (typeof APP_SHELL_MOBILE_DESKTOP_SHELL_HEADERLESS_ROUTES)[number],
  )
}

export type AppShellEditorKind = "agent" | "knowledgeNote" | "loop" | "skill"

export type AppShellEditorPresentation = {
  createTitle: string
  editTitle: string
  createActionLabel: string
  saveActionLabel: string
}

export const APP_SHELL_EDITOR_PRESENTATION: Record<
  AppShellEditorKind,
  AppShellEditorPresentation
> = {
  agent: {
    createTitle: "Create Agent",
    editTitle: "Edit Agent",
    createActionLabel: "Create Agent",
    saveActionLabel: "Save Changes",
  },
  knowledgeNote: {
    createTitle: "Create Note",
    editTitle: "Edit Note",
    createActionLabel: "Create Note",
    saveActionLabel: "Save Note",
  },
  loop: {
    createTitle: "Create Loop",
    editTitle: "Edit Loop",
    createActionLabel: "Create Loop",
    saveActionLabel: "Save Loop",
  },
  skill: {
    createTitle: "Create Skill",
    editTitle: "Edit Skill",
    createActionLabel: "Create Skill",
    saveActionLabel: "Save Skill",
  },
}

export const APP_SHELL_SKILL_ACTION_LABELS = {
  actions: "Actions",
  bulkImportFromFolder: "Bulk Import from Folder",
  cancel: "Cancel",
  delete: "Delete",
  deleteSelected: "Delete Selected",
  deselect: "Deselect",
  deselectAll: "Deselect All",
  edit: "Edit",
  export: "Export",
  exporting: "Exporting...",
  exportBundle: "Export Bundle",
  import: "Import",
  importing: "Importing...",
  importBundle: "Import Bundle",
  importFromGitHub: "Import from GitHub",
  importSkill: "Import Skill",
  importSkillFolder: "Import Skill Folder",
  importSkillFromGitHubTitle: "Import Skill from GitHub",
  importSkillMarkdownFile: "Import SKILL.md File",
  openFolder: "Open Folder",
  revealFile: "Reveal File",
  scanFolder: "Scan Folder",
  select: "Select",
  selected: "Selected",
  selectAll: "Select All",
  workspaceFolder: "Workspace",
} as const

export const APP_SHELL_SKILL_EDITOR_PRESENTATION = {
  createDescription: "Create a skill with specialized instructions for the agent.",
  editDescription: "Update the skill name, description, and instructions.",
  loadingLabel: "Loading skill...",
  unavailableLoadSaveError:
    "Configure Base URL and API key to load and save skills",
  unavailableSaveError:
    "Configure Base URL and API key in Settings before saving this skill",
  unavailableSaveHelper:
    "Configure Base URL and API key in Settings to save skill changes.",
  pending: {
    creatingLabel: "Creating...",
    savingLabel: "Saving...",
  },
  validation: {
    nameRequired: "Skill name is required",
    instructionsRequired: "Skill instructions are required",
    nameAndInstructionsRequired: "Name and instructions are required",
  },
  errors: {
    loadFailed: "Failed to load skill",
    saveFailed: "Failed to save skill",
  },
  fields: {
    id: {
      label: "Skill ID",
      helper: "Skill IDs are fixed after creation.",
    },
    name: {
      label: "Name",
      requiredLabel: "Name *",
      placeholder: "Code review expert",
    },
    description: {
      label: "Description",
      placeholder: "Brief description of what this skill does",
    },
    instructions: {
      label: "Instructions",
      requiredLabel: "Instructions *",
      placeholder: "Enter the instructions for this skill in markdown format...",
      helper: "Skill files are saved by the desktop server under .agents/skills.",
    },
  },
} as const

export type AppShellSkillActionLabelId =
  keyof typeof APP_SHELL_SKILL_ACTION_LABELS

export type AppShellSkillBulkActionLabelId =
  | "deleteSelected"
  | "exportBundle"

export type AppShellSkillItemActionLabelId =
  | "actions"
  | "delete"
  | "edit"
  | "export"
  | "revealFile"

export function getAppShellSkillActionLabel(
  id: AppShellSkillActionLabelId,
): string {
  return APP_SHELL_SKILL_ACTION_LABELS[id]
}

export function formatAppShellSkillBulkActionLabel(
  id: AppShellSkillBulkActionLabelId,
  count: number,
): string {
  const label = getAppShellSkillActionLabel(id)
  return count > 0 ? `${label} (${count})` : label
}

export function getAppShellSkillSelectionLabel(isSelected: boolean): string {
  return getAppShellSkillActionLabel(isSelected ? "selected" : "select")
}

export function getAppShellSkillSelectionAccessibilityLabel(
  skillName: string,
  isSelected: boolean,
): string {
  return `${getAppShellSkillActionLabel(isSelected ? "deselect" : "select")} skill ${skillName}`
}

export function getAppShellSkillItemActionAccessibilityLabel(
  action: AppShellSkillItemActionLabelId,
  skillName: string,
): string {
  if (action === "actions") return `Actions for ${skillName}`
  if (action === "revealFile") return `Reveal file for skill ${skillName}`
  return `${getAppShellSkillActionLabel(action)} skill ${skillName}`
}

export function getAppShellSkillExportMarkdownAccessibilityLabel(
  skillName: string,
): string {
  return `Export skill ${skillName} as Markdown`
}

export function getAppShellSkillImportMarkdownAccessibilityLabel(): string {
  return "Import skill Markdown"
}

export function getAppShellSkillImportGitHubAccessibilityLabel(): string {
  return "Import skill from GitHub"
}

export const APP_SHELL_SKILL_DELETE_PRESENTATION = {
  singleTitle: "Delete Skill",
  selectedTitle: "Delete Selected Skills",
  deleteFailed: "Failed to delete skill",
  deleteSelectedFailed: "Failed to delete selected skills",
} as const

export const APP_SHELL_SKILL_FEEDBACK_PRESENTATION = {
  importCompleteTitle: "Import Complete",
  importFailedTitle: "Import Failed",
  exportFailedTitle: "Export Failed",
  created: "Skill created successfully",
  updated: "Skill updated successfully",
  deleted: "Skill deleted successfully",
  exported: "Skill exported successfully",
  createFailed: "Failed to create skill",
  updateFailed: "Failed to update skill",
  autoRefreshFailed: "Failed to auto-refresh skills",
  importFailed: "Failed to import skill",
  importFolderFailed: "Failed to import skill folder",
  importSkillsFailed: "Failed to import skills",
  importGitHubFailed: "Failed to import GitHub skill",
  exportFailed: "Failed to export skill",
  updateAccessFailed: "Failed to update skill access",
  revealFileFailed: "Failed to reveal skill file",
  openFolderFailed: "Failed to open skills folder",
  openWorkspaceFolderFailed: "Failed to open workspace skills folder",
  scanFolderFailed: "Failed to scan skills folder",
  noSkillFoldersFound: "No skill folders found",
  noNewSkillsFound: "No new skills found in folder",
  noSkillsImported: "No skills imported",
  noSkillsFoundInRepository: "No skills found in repository",
  gitHubRepositoryRequired:
    "Please enter a GitHub repository (e.g., owner/repo)",
} as const

export function getAppShellSkillDeleteConfirmTitle(selected = false): string {
  return selected
    ? APP_SHELL_SKILL_DELETE_PRESENTATION.selectedTitle
    : APP_SHELL_SKILL_DELETE_PRESENTATION.singleTitle
}

export function getAppShellSkillDeleteConfirmMessage(skillName: string): string {
  return `Are you sure you want to delete the skill "${skillName}"?`
}

export function formatAppShellSkillDeleteSelectedConfirmMessage(
  count: number,
): string {
  return `Are you sure you want to delete ${count} selected skill${count === 1 ? "" : "s"}?`
}

export function formatAppShellSkillPartialDeleteMessage(
  deletedCount: number,
  selectedCount: number,
): string {
  return `Deleted ${deletedCount} of ${selectedCount} selected skills.`
}

export function formatAppShellSkillCount(count: number): string {
  return `${count} skill${count === 1 ? "" : "s"}`
}

export function formatAppShellSkillImportedStatus(skillName: string): string {
  return `Imported skill "${skillName}"`
}

export function formatAppShellSkillImportCompleteMessage(
  skillName: string,
): string {
  return `Imported "${skillName}".`
}

export function formatAppShellSkillImportedSuccessMessage(
  skillName: string,
): string {
  return `Skill "${skillName}" imported successfully`
}

export function formatAppShellSkillExportedStatus(skillName: string): string {
  return `Exported skill "${skillName}"`
}

export function formatAppShellSkillGitHubImportedStatus(count: number): string {
  return `Imported ${formatAppShellSkillCount(count)} from GitHub`
}

export function formatAppShellSkillGitHubImportCompleteMessage(
  count: number,
): string {
  return `${formatAppShellSkillGitHubImportedStatus(count)}.`
}

export function formatAppShellSkillImportSummary(
  importedCount: number,
  skippedCount: number,
  failedCount: number,
): string {
  const messages: string[] = []
  if (importedCount > 0) {
    messages.push(`Imported ${formatAppShellSkillCount(importedCount)}`)
  }
  if (skippedCount > 0) {
    messages.push(`${skippedCount} already imported`)
  }
  if (failedCount > 0) {
    messages.push(`${failedCount} failed`)
  }
  return messages.join(", ")
}

export function formatAppShellSkillFolderImportStatus(count: number): string {
  return `Imported ${formatAppShellSkillCount(count)} from folder`
}

export function formatAppShellSkillGitHubImportStatus(
  count: number,
  skillNames: readonly string[],
): string {
  const names = skillNames.length > 0 ? `: ${skillNames.join(", ")}` : ""
  return `${formatAppShellSkillGitHubImportedStatus(count)}${names}`
}

export const APP_SHELL_KNOWLEDGE_NOTE_ACTION_LABELS = {
  delete: "Delete",
  deleteAll: "Delete All",
  deleteAllNotes: "Delete All Notes",
  deleteSelected: "Delete Selected",
  deselect: "Deselect",
  searchAccessibilityLabel: "Search knowledge notes",
  searchPlaceholder: "Search notes",
  select: "Select",
  selected: "Selected",
} as const

export const APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION = {
  editDescription: "Update canonical note fields for this knowledge note.",
  loadingLabel: "Loading note...",
  unavailableLoadSaveError:
    "Configure Base URL and API key to load and save notes",
  unavailableSaveError:
    "Configure Base URL and API key in Settings before saving this note",
  unavailableSaveHelper:
    "Configure Base URL and API key in Settings to save note changes.",
  validation: {
    titleAndBodyRequired: "Title and body are required",
  },
  errors: {
    loadFailed: "Failed to load note",
    saveFailed: "Failed to save note",
  },
  context: {
    label: "Context",
    helper:
      "Context controls retrieval behavior. Use auto only when the note should be considered for automatic runtime loading.",
  },
  fields: {
    noteId: {
      label: "Note ID",
      placeholder: "optional-custom-note-id",
      createHelper: "Optional. Leave blank to derive an ID from the title.",
      editHelper: "Note IDs are fixed after creation.",
    },
    title: {
      label: "Title",
      requiredLabel: "Note title *",
      placeholder: "Project architecture",
    },
    summary: {
      label: "Summary",
      placeholder: "Short note summary",
      helper:
        "Canonical files live at .agents/knowledge/<slug>/<slug>.md.",
    },
    body: {
      label: "Body",
      requiredLabel: "Body *",
      placeholder: "Detailed knowledge note body",
    },
    tags: {
      label: "Tags",
      placeholder: "project, preference, follow-up",
    },
    references: {
      label: "References",
      placeholder: "docs/architecture.md, https://example.com/design",
    },
  },
} as const

export type AppShellKnowledgeNoteActionLabelId =
  keyof typeof APP_SHELL_KNOWLEDGE_NOTE_ACTION_LABELS

export type AppShellKnowledgeNoteBulkActionLabelId = "deleteSelected"

export function getAppShellKnowledgeNoteActionLabel(
  id: AppShellKnowledgeNoteActionLabelId,
): string {
  return APP_SHELL_KNOWLEDGE_NOTE_ACTION_LABELS[id]
}

export function formatAppShellKnowledgeNoteBulkActionLabel(
  id: AppShellKnowledgeNoteBulkActionLabelId,
  count: number,
): string {
  const label = getAppShellKnowledgeNoteActionLabel(id)
  return count > 0 ? `${label} (${count})` : label
}

export function formatAppShellKnowledgeNoteDeleteCountLabel(
  count: number,
): string {
  return `Delete ${count} Note${count === 1 ? "" : "s"}`
}

export function getAppShellKnowledgeNoteSelectionLabel(
  isSelected: boolean,
): string {
  return getAppShellKnowledgeNoteActionLabel(isSelected ? "selected" : "select")
}

export function getAppShellKnowledgeNoteSelectionAccessibilityLabel(
  title: string,
  isSelected: boolean,
): string {
  return `${getAppShellKnowledgeNoteActionLabel(isSelected ? "deselect" : "select")} note ${title}`
}

export function getAppShellKnowledgeNoteDeleteAccessibilityLabel(
  title: string,
): string {
  return `Delete note ${title}`
}

export function getAppShellKnowledgeNoteDeleteSelectedAccessibilityLabel(
  count: number,
): string {
  return `Delete ${count} selected knowledge note${count === 1 ? "" : "s"}`
}

export function getAppShellKnowledgeNoteDeleteAllAccessibilityLabel(): string {
  return "Delete all knowledge notes"
}

export const APP_SHELL_KNOWLEDGE_NOTE_DELETE_PRESENTATION = {
  singleTitle: "Delete Note",
  selectedTitle: "Delete Selected Notes",
  allTitle: "Delete All Notes",
  deleteFailed: "Failed to delete note",
  deleteSelectedFailed: "Failed to delete selected notes",
  deleteAllFailed: "Failed to delete all notes",
} as const

export type AppShellKnowledgeNoteDeleteTarget = "single" | "selected" | "all"

export function getAppShellKnowledgeNoteDeleteConfirmTitle(
  target: AppShellKnowledgeNoteDeleteTarget,
): string {
  if (target === "selected") {
    return APP_SHELL_KNOWLEDGE_NOTE_DELETE_PRESENTATION.selectedTitle
  }
  if (target === "all") {
    return APP_SHELL_KNOWLEDGE_NOTE_DELETE_PRESENTATION.allTitle
  }
  return APP_SHELL_KNOWLEDGE_NOTE_DELETE_PRESENTATION.singleTitle
}

export function formatAppShellKnowledgeNoteDeleteConfirmMessage(
  target: AppShellKnowledgeNoteDeleteTarget,
  count = 0,
): string {
  if (target === "selected") {
    return `Are you sure you want to delete ${count} selected note${count === 1 ? "" : "s"}? This action cannot be undone.`
  }
  if (target === "all") {
    return count > 0
      ? `Are you sure you want to delete ALL ${count} notes? This action cannot be undone.`
      : "Delete every knowledge note on desktop? This action cannot be undone."
  }
  return "Are you sure you want to delete this note? This action cannot be undone."
}

export const APP_SHELL_BUNDLE_ACTION_LABELS = {
  cancel: "Cancel",
  close: "Close",
  export: "Export",
  exportBundle: "Export Bundle",
  exporting: "Exporting...",
  exportForHub: "Export for Hub",
  import: "Import",
  importing: "Importing...",
  importBundle: "Import Bundle",
  installHubBundle: "Install Hub Bundle",
  preview: "Preview",
  previewing: "Previewing...",
} as const

export type AppShellBundleActionLabelId =
  keyof typeof APP_SHELL_BUNDLE_ACTION_LABELS

export function getAppShellBundleActionLabel(
  id: AppShellBundleActionLabelId,
): string {
  return APP_SHELL_BUNDLE_ACTION_LABELS[id]
}

export function getAppShellBundleImportActionLabel(
  isPending: boolean,
): string {
  return getAppShellBundleActionLabel(isPending ? "importing" : "importBundle")
}

export function getAppShellBundleExportActionLabel(
  isPending: boolean,
): string {
  return getAppShellBundleActionLabel(isPending ? "exporting" : "exportBundle")
}

export function getAppShellBundlePreviewActionLabel(
  isPending: boolean,
): string {
  return getAppShellBundleActionLabel(isPending ? "previewing" : "preview")
}

export function getAppShellBundleImportJsonAccessibilityLabel(): string {
  return "Import DotAgents bundle JSON"
}

export function getAppShellBundleExportJsonAccessibilityLabel(): string {
  return "Export DotAgents bundle JSON"
}

export function getAppShellBundlePreviewJsonAccessibilityLabel(): string {
  return "Preview DotAgents bundle JSON"
}

export const APP_SHELL_BUNDLE_IMPORT_PRESENTATION = {
  defaultBundleName: "DotAgents Bundle",
  title: "Import Bundle",
  description: "Preview and import a .dotagents bundle file.",
  exportTitle: "Export DotAgents Bundle",
  exportDescription:
    "Bundles can include agents, MCP servers, skills, tasks, and knowledge notes. Share only with places you trust.",
  fields: {
    bundleJson: {
      placeholder:
        '{"manifest":{"version":1,"name":"Bundle"},"agentProfiles":[]}',
    },
    components: "Components",
    componentsToImport: "Components to import",
    conflicts: {
      label: "Handle conflicts",
      helper: "Some items already exist in your configuration.",
    },
    created: "Created",
    exportedFrom: "Exported from",
    notPreviewed: "Not previewed",
  },
  componentLabels: {
    compact: {
      agentProfiles: "Agents",
      mcpServers: "MCP servers",
      skills: "Skills",
      repeatTasks: "Tasks",
      knowledgeNotes: "Knowledge",
    },
    detailed: {
      agentProfiles: "Agent Profiles",
      mcpServers: "MCP Servers",
      skills: "Skills",
      repeatTasks: "Repeat Tasks",
      knowledgeNotes: "Knowledge notes",
    },
  } satisfies Record<string, Record<BundleComponentKey, string>>,
  validation: {
    invalidJson: "Bundle JSON is invalid",
    noComponentsSelected: "Select at least one bundle component to import",
  },
  alerts: {
    exportFailedTitle: "Export Failed",
    previewFailedTitle: "Preview Failed",
    importFailedTitle: "Import Failed",
    importCompleteTitle: "Import Complete",
  },
  errors: {
    exportFailed: "Failed to export bundle",
    previewFailed: "Failed to preview bundle",
    importFailed: "Import failed",
    importBundleFailed: "Failed to import bundle",
  },
} as const

export type AppShellBundleComponentLabelVariant =
  keyof typeof APP_SHELL_BUNDLE_IMPORT_PRESENTATION.componentLabels

export function getAppShellBundleComponentLabel(
  key: BundleComponentKey,
  variant: AppShellBundleComponentLabelVariant = "compact",
): string {
  return APP_SHELL_BUNDLE_IMPORT_PRESENTATION.componentLabels[variant][key]
}

export function formatAppShellBundleItemCount(count: number): string {
  return `${count} item${count === 1 ? "" : "s"}`
}

export function formatAppShellBundleConflictCount(count: number): string {
  return `${count} conflict${count === 1 ? "" : "s"}`
}

export function formatAppShellBundleComponentSummary(
  itemCount: number,
  conflictCount: number,
): string {
  const itemSummary = formatAppShellBundleItemCount(itemCount)
  return conflictCount > 0
    ? `${itemSummary}, ${formatAppShellBundleConflictCount(conflictCount)}`
    : itemSummary
}

export function formatAppShellBundleCreatedDateLabel(dateLabel: string): string {
  return `${APP_SHELL_BUNDLE_IMPORT_PRESENTATION.fields.created}: ${dateLabel}`
}

export function formatAppShellBundleExportedFromLabel(source: string): string {
  return `${APP_SHELL_BUNDLE_IMPORT_PRESENTATION.fields.exportedFrom} ${source}`
}

export function formatAppShellBundleExportStatus(count: number): string {
  return `Exported bundle with ${formatAppShellBundleItemCount(count)}`
}

export function formatAppShellBundlePreviewStatus(count: number): string {
  return `Previewed bundle with ${formatAppShellBundleItemCount(count)}`
}

export function formatAppShellBundleImportStatus(count: number): string {
  return `Imported ${count} bundle item${count === 1 ? "" : "s"}`
}

export function formatAppShellBundleImportCompleteMessage(count: number): string {
  return `Imported ${formatAppShellBundleItemCount(count)} from the bundle.`
}

export function formatAppShellBundleImportSuccessToast(count: number): string {
  return `Successfully imported ${formatAppShellBundleItemCount(count)}`
}

export const APP_SHELL_AGENT_ACTION_LABELS = {
  addAgent: "Add Agent",
  cancel: "Cancel",
  delete: "Delete",
  rescanFiles: "Rescan Files",
  rescanning: "Rescanning...",
  save: "Save",
} as const

export type AppShellAgentActionLabelId =
  keyof typeof APP_SHELL_AGENT_ACTION_LABELS

export function getAppShellAgentActionLabel(
  id: AppShellAgentActionLabelId,
): string {
  return APP_SHELL_AGENT_ACTION_LABELS[id]
}

export function getAppShellAgentRescanActionLabel(
  isPending: boolean,
): string {
  return getAppShellAgentActionLabel(isPending ? "rescanning" : "rescanFiles")
}

export function getAppShellAgentDeleteAccessibilityLabel(
  agentName: string,
): string {
  return `Delete agent ${agentName}`
}

export function getAppShellAgentRescanAccessibilityLabel(): string {
  return "Rescan agent files"
}

export const APP_SHELL_MODEL_PRESET_PRESENTATION = {
  manager: {
    title: "OpenAI-Compatible Preset",
    selectPlaceholder: "Select a preset",
    noUrlLabel: "No URL set",
    builtInBadge: "Built-in",
    keySetBadge: "Key set",
    missingKeyBadge: "No key",
  },
  picker: {
    title: "Select Preset",
    closeAccessibilityLabel: "Close preset picker",
  },
  actions: {
    configure: "Configure",
    edit: "Edit",
    newPreset: "New Preset",
    deletePreset: "Delete Preset",
    delete: "Delete",
    cancel: "Cancel",
    close: "Close",
    create: "Create Preset",
    save: "Save Changes",
    saving: "Saving...",
  },
  editor: {
    createTitle: "Create New Preset",
    configureTitle: "Configure Preset",
    editTitle: "Edit Preset",
    createDescription:
      "Create a custom preset with its own API key, base URL, and model preferences.",
    configureDescription:
      "Set the API key and model preferences for this built-in preset.",
    editDescription: "Update the preset settings and model preferences.",
    deleteConfirmTitle: "Delete Preset",
    closeAccessibilityLabel: "Close preset editor",
    createAccessibilityLabel: "Create preset",
  },
  fields: {
    name: {
      label: "Preset Name",
      placeholder: "e.g., My OpenRouter",
    },
    baseUrl: {
      label: "API Base URL",
      placeholder: "https://api.example.com/v1",
    },
    apiKey: {
      label: "API Key",
      placeholder: "sk-...",
      configuredPlaceholder: "Configured",
    },
    agentModel: {
      label: "Agent Model",
      placeholder: "Select model for agent mode",
      textPlaceholder: "gpt-4.1-mini",
    },
    transcriptProcessingModel: {
      label: "Transcript Processing Model",
      compactLabel: "Transcript Model",
      placeholder: "Select model for transcript processing",
      textPlaceholder: "gpt-4.1-mini",
    },
  },
  modelPreferences: {
    createTitle: "Model Preferences (Optional)",
    editTitle: "Model Preferences",
    createDescription:
      "Set default models that will be selected when switching to this preset.",
    editDescription:
      "Optionally set default models for this preset. When switching to this preset, these models will be selected automatically.",
  },
  validation: {
    nameRequired: "Preset name is required",
    baseUrlRequired: "Base URL is required",
  },
  toasts: {
    created: "Preset created successfully",
    updated: "Preset updated successfully",
    deleted: "Preset deleted",
    switchedPrefix: "Switched to preset",
    cannotDeleteBuiltIn: "Cannot delete built-in presets",
    saveFailure: "Failed to save preset",
    deleteFailure: "Failed to delete preset",
  },
} as const

export type AppShellModelPresetEditorMode = "create" | "edit"

export function getAppShellModelPresetEditorTitle(
  mode: AppShellModelPresetEditorMode,
  isBuiltIn = false,
): string {
  if (mode === "create") return APP_SHELL_MODEL_PRESET_PRESENTATION.editor.createTitle
  return isBuiltIn
    ? APP_SHELL_MODEL_PRESET_PRESENTATION.editor.configureTitle
    : APP_SHELL_MODEL_PRESET_PRESENTATION.editor.editTitle
}

export function getAppShellModelPresetEditorDescription(isBuiltIn: boolean): string {
  return isBuiltIn
    ? APP_SHELL_MODEL_PRESET_PRESENTATION.editor.configureDescription
    : APP_SHELL_MODEL_PRESET_PRESENTATION.editor.editDescription
}

export function getAppShellModelPresetDeleteConfirmMessage(presetName: string): string {
  return `Are you sure you want to delete "${presetName}"?`
}

export function formatAppShellModelPresetCount(count: number): string {
  return `${count} preset${count !== 1 ? "s" : ""} available`
}

export const APP_SHELL_PROVIDER_SETUP_PRESENTATION = {
  pageTitle: "Provider Setup",
  pageDescription:
    "Use this page for API keys, base URLs, local engine downloads, and quick provider diagnostics. All model and voice selection now lives on the Models page.",
  baseUrlLabel: "API Base URL",
  configuredSecretPlaceholder: "Configured",
  inactiveDescription: "Not selected above. You can still configure it here.",
  openAiCompatibleInactiveDescription:
    "OpenAI-compatible presets are selected from the Models page.",
  openAiCompatibleManagedDescription:
    "OpenAI-compatible presets, agent models, and transcript cleanup models are now managed on the Models page.",
  acpMode: {
    titlePrefix: "ACP Main Agent",
    fallbackAgentLabel: "Not selected",
    description:
      "ACP mode handles chat submissions through the selected agent. Provider setup below still applies to API-backed tools, voice, and local engines.",
  },
  chatGptWeb: {
    oauthTitle: "Desktop OAuth",
    connectedLabel: "Connected",
    notConnectedLabel: "Not connected",
    providerFallbackLabel: "OpenAI Codex",
    fallbackDescription: "Uses your ChatGPT Codex subscription via OAuth.",
    planPrefix: "Plan",
    accountIdLabel: "Account ID",
    callbackUrlLabel: "Callback URL",
    connectActionLabel: "Connect",
    reauthActionLabel: "Re-auth",
    disconnectActionLabel: "Disconnect",
    connectingActionLabel: "Connecting...",
    disconnectingActionLabel: "Disconnecting...",
    workingActionLabel: "Working...",
    copyCallbackActionLabel: "Copy Callback URL",
    connectAccessibilityLabel: "Connect ChatGPT Web OAuth",
    disconnectAccessibilityLabel: "Disconnect ChatGPT Web OAuth",
    disconnectConfirmTitle: "Disconnect ChatGPT Web",
    disconnectConfirmMessage:
      "Disconnect the desktop OpenAI Codex OAuth session?",
    activeCallbackHelper:
      "Browser sign-in should return to `http://localhost:1455/auth/callback`. Use Copy Callback URL if you need to inspect or paste the callback target.",
    inactiveCallbackHelper:
      "Browser sign-in should return to `http://localhost:1455/auth/callback`. This provider now talks to the Codex responses transport, not the legacy conversation endpoint.",
  },
} as const

export function getAppShellProviderModelSelectionMovedDescription(
  providerLabel: string,
): string {
  return `${providerLabel} model selection now lives on the Models page.`
}

export function getAppShellChatGptWebConnectionLabel(
  authenticated: boolean,
  email?: string | null,
): string {
  if (!authenticated) {
    return APP_SHELL_PROVIDER_SETUP_PRESENTATION.chatGptWeb.notConnectedLabel
  }

  return email
    ? `${APP_SHELL_PROVIDER_SETUP_PRESENTATION.chatGptWeb.connectedLabel} as ${email}`
    : APP_SHELL_PROVIDER_SETUP_PRESENTATION.chatGptWeb.connectedLabel
}

export const APP_SHELL_AGENT_EDITOR_PRESENTATION = {
  description: "Configure agent identity, behavior, model, and capabilities.",
  loadingLabel: "Loading agent...",
  builtInWarning: "Built-in agents have limited editing options",
  avatar: {
    label: "Avatar",
    uploadActionLabel: "Upload photo",
    removeActionLabel: "Remove photo",
    chooseAccessibilityLabel: "Choose agent photo",
    removeAccessibilityLabel: "Remove agent photo",
    unavailableTitle: "Photo unavailable",
    tooLargeTitle: "Photo too large",
    missingDataError: "Could not read the selected photo.",
    selectionFailed: "Could not select a photo.",
  },
  quickSetup: {
    title: "Quick Setup",
    description: "Start with a preset, or configure manually below.",
  },
  fields: {
    displayName: {
      label: "Name",
      placeholder: "My Agent",
    },
    description: {
      label: "Description",
      placeholder: "What this agent does...",
      helper:
        "Shown only in the UI. Not visible to the agent. Use Guidelines for instructions.",
    },
    guidelines: {
      label: "Guidelines",
      placeholder:
        "e.g. You are an expert in React. Always check types before writing code...",
      helper:
        "Additional instructions for this agent. These are appended to the core tool-calling system prompt.",
    },
    systemPrompt: {
      label: "Base System Prompt (Advanced)",
      placeholder: "You are a helpful assistant...",
      helper:
        "Not recommended to change. A custom base prompt replaces core tool-calling instructions and blocks future default prompt updates. Leave empty to use the default.",
      resetActionLabel: "Reset to Default",
    },
    connectionType: {
      label: "Connection Type",
      helper:
        "Choose how DotAgents should reach this agent. The setup fields below change based on this choice.",
    },
    command: {
      label: "Command",
      placeholder: "e.g., claude-code-acp",
    },
    args: {
      label: "Arguments (space-separated)",
      placeholder: "e.g., --acp",
    },
    cwd: {
      label: "Working Directory (optional)",
      placeholder: "e.g., /path/to/project or leave empty",
    },
    baseUrl: {
      label: "Base URL",
      placeholder: "e.g., http://localhost:8000",
    },
    enabled: {
      label: "Enabled",
    },
    autoSpawn: {
      label: "Auto-spawn on startup",
    },
  },
  externalSetup: {
    fallbackTitle: "External Agent Setup",
    presetBadge: "Preset",
    fallbackDescription:
      "Verify that DotAgents can resolve your command and working directory before saving.",
    openDocsActionLabel: "Open docs",
    installLabel: "Install",
    authLabel: "Auth",
    workingDirectoryLabel: "Working Directory",
    verifyActionLabel: "Verify Setup",
    verifyAccessibilityLabel: "Verify external agent setup",
    verificationPassed: "Verification passed",
    verificationNeedsAttention: "Verification needs attention",
    resolvedCommandLabel: "Resolved command",
    configuredCommandLabel: "Configured command",
    defaultVerifyDescription:
      "Checks the command path and working directory before you save.",
  },
  model: {
    sectionTitle: "Model",
    providerLabel: "LLM Provider",
    providerDescription:
      "Choose which LLM provider and model this agent uses. Leave unset to use global defaults.",
    agentModelLabel: "Agent Model",
    agentModelPlaceholder: "Select model for this agent",
    globalDefaultLabel: "Use global default",
    globalDefaultHelper: "Global default",
  },
  capabilities: {
    sectionTitle: "Capabilities",
    generalTitle: "General",
    skillsTitle: "Skills",
    propertiesTitle: "Properties",
    enableAllLabel: "Enable All",
    disableAllLabel: "Disable All",
    allLabel: "All",
    noneLabel: "None",
    loadingSkillsLabel: "Loading skills...",
    noSkillsLabel: "No skills available.",
  },
  validation: {
    displayNameRequired: "Display name is required",
  },
  errors: {
    loadFailed: "Failed to load agent",
    saveFailed: "Failed to save agent",
    loadSkillsFailed: "Failed to load skills",
    loadMcpServersFailed: "Failed to load MCP servers",
    verifySetupFailed: "Failed to verify setup",
  },
} as const

export type AppShellAgentListProfile = {
  displayName?: string
  name?: string
  description?: string
  guidelines?: string
  systemPrompt?: string | null
  connection?: {
    type?: string
  }
  connectionType?: string
  role?: string
  isBuiltIn?: boolean
  isDefault?: boolean
  enabled?: boolean
}

export const APP_SHELL_AGENT_LIST_PRESENTATION = {
  emptyTitle: "No agents yet.",
  emptyDescription: "Create one with Add Agent or import an existing bundle.",
  fallbackDescription: "No description provided.",
  fallbackRole: "agent",
  fallbackInitial: "A",
  badges: {
    builtIn: "Built-in",
    default: "Default",
    disabled: "Disabled",
    customPrompt: "Custom prompt",
  },
} as const

export function getAppShellAgentListDisplayName(
  profile: AppShellAgentListProfile,
): string {
  return profile.displayName || profile.name || "Agent"
}

export function getAppShellAgentListInitial(
  profile: AppShellAgentListProfile,
): string {
  return (
    getAppShellAgentListDisplayName(profile).trim().slice(0, 1) ||
    APP_SHELL_AGENT_LIST_PRESENTATION.fallbackInitial
  ).toUpperCase()
}

export function getAppShellAgentListDescription(
  profile: AppShellAgentListProfile,
): string {
  return (
    profile.description ||
    profile.guidelines?.slice(0, 100) ||
    APP_SHELL_AGENT_LIST_PRESENTATION.fallbackDescription
  )
}

export function getAppShellAgentListConnectionType(
  profile: AppShellAgentListProfile,
): string {
  return profile.connectionType || profile.connection?.type || "internal"
}

export function getAppShellAgentListMetadata(
  profile: AppShellAgentListProfile,
): string {
  return `${getAppShellAgentListConnectionType(profile)} • ${profile.role || APP_SHELL_AGENT_LIST_PRESENTATION.fallbackRole}`
}

export function getAppShellAgentListBadges(
  profile: AppShellAgentListProfile,
): string[] {
  const badges: string[] = []
  if (profile.isBuiltIn) badges.push(APP_SHELL_AGENT_LIST_PRESENTATION.badges.builtIn)
  if (profile.isDefault) badges.push(APP_SHELL_AGENT_LIST_PRESENTATION.badges.default)
  if (profile.enabled === false) {
    badges.push(APP_SHELL_AGENT_LIST_PRESENTATION.badges.disabled)
  }
  if (profile.systemPrompt?.trim()) {
    badges.push(APP_SHELL_AGENT_LIST_PRESENTATION.badges.customPrompt)
  }
  return badges
}

export const APP_SHELL_AGENT_DELETE_PRESENTATION = {
  title: "Delete Agent",
  cannotDeleteTitle: "Cannot Delete",
  builtInCannotDelete: "Built-in agents cannot be deleted",
  deleteFailed: "Failed to delete agent profile",
} as const

export const APP_SHELL_AGENT_PROFILE_FEEDBACK_PRESENTATION = {
  exportTitle: "Export Profile",
  exportFailedTitle: "Export Failed",
  importSuccessTitle: "Success",
  importFailedTitle: "Import Failed",
  exportFailed: "Failed to export profile",
  importFailed: "Failed to import profile",
  toggleFailed: "Failed to toggle agent profile",
  rescanFailed: "Failed to rescan agent files",
} as const

export function formatAppShellAgentProfileImportSuccessMessage(
  profileName: string,
): string {
  return `Profile "${profileName}" imported successfully`
}

export function getAppShellAgentDeleteConfirmMessage(
  agentName?: string,
): string {
  return agentName
    ? `Are you sure you want to delete "${agentName}"?`
    : "Are you sure you want to delete this agent?"
}

export const APP_SHELL_MCP_SERVER_ACTION_LABELS = {
  actions: "Actions",
  addServer: "Add Server",
  cancel: "Cancel",
  close: "Close",
  delete: "Delete",
  deleteServer: "Delete server",
  editServer: "Edit server",
  export: "Export",
  exporting: "Exporting...",
  exportJson: "Export JSON",
  import: "Import",
  importing: "Importing...",
  importJson: "Import JSON",
  importServers: "Import MCP Servers",
  replace: "Replace",
  replaceServer: "Replace Server",
  restartServer: "Restart server",
  revokeOAuth: "Revoke OAuth",
  revokingOAuth: "Revoking...",
  save: "Save",
  saving: "Saving...",
  startOAuth: "Start OAuth",
  startingOAuth: "Starting...",
  startServer: "Start server",
  stopServer: "Stop server",
  updateServer: "Update Server",
} as const

export const APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION = {
  description: "Add or configure an MCP server.",
  tabs: {
    manual: "Manual",
    file: "From File",
    paste: "Paste JSON",
    examples: "Examples",
  },
  fields: {
    name: {
      label: "Server Name",
      placeholder: "filesystem",
    },
    transport: {
      label: "Transport Type",
      placeholder: "Select transport type",
      helper: "Choose how to connect to the MCP server.",
    },
    command: {
      label: "Command",
      placeholder: "npx -y @modelcontextprotocol/server-filesystem",
      helper: "Full command with arguments separated by spaces.",
    },
    args: {
      label: "Arguments",
      placeholder: "-y\n@modelcontextprotocol/server-filesystem",
    },
    url: {
      label: "Server URL",
      websocketPlaceholder: "wss://example.com/mcp",
      streamableHttpPlaceholder: "https://example.com/mcp",
      websocketHelper:
        "WebSocket URL, for example ws://localhost:8080 or wss://example.com/mcp.",
      streamableHttpHelper:
        "HTTP URL for streamable HTTP transport, for example http://localhost:8080/mcp.",
    },
    headers: {
      label: "Custom HTTP Headers",
      compactLabel: "Headers",
      placeholder:
        "Authorization=Bearer token\nUser-Agent=DotAgents\nContent-Type=application/json",
      helper:
        "One per line in Header-Name=value format. Included in HTTP requests to the server.",
    },
    env: {
      label: "Environment Variables",
      compactLabel: "Environment",
      placeholder: "API_KEY=value",
      helper: "One per line in KEY=value format.",
    },
    timeout: {
      label: "Timeout (ms)",
      compactLabel: "Timeout",
      placeholder: "60000",
    },
    disabled: {
      label: "Disabled",
    },
    oauth: {
      label: "OAuth",
      scopeLabel: "OAuth Scope",
      scopePlaceholder: "user",
      clientIdLabel: "OAuth Client ID",
      clientIdPlaceholder: "Auto-registered",
      discoveryLabel: "Metadata Discovery",
      dynamicRegistrationLabel: "Dynamic Registration",
    },
  },
  transports: {
    stdio: "Local Command (stdio)",
    websocket: "WebSocket",
    streamableHttp: "Streamable HTTP",
  },
  validation: {
    nameRequired: "Server name is required",
    commandRequired: "Command is required for stdio transport",
    urlRequired: "URL is required for remote transport",
    invalidUrl: "Invalid URL format",
    reservedNameSuffix: "is reserved and cannot be used",
  },
  oauth: {
    newServerName: "New Server",
    saveBeforeAuth: "Please save the server configuration first",
    startSuccess:
      "OAuth authentication started. Please complete the flow in your browser.",
    revokeSuccess: "OAuth tokens revoked successfully",
    startFailurePrefix: "Failed to start OAuth flow",
    revokeFailurePrefix: "Failed to revoke OAuth tokens",
  },
  import: {
    fileTitle: "Import from JSON file",
    pasteTitle: "Import Configuration",
    standardExamplesTitle: "Standard MCP Servers",
    oauthExamplesTitle: "OAuth-Enabled MCP Servers",
  },
} as const

export type AppShellMcpServerActionLabelId =
  keyof typeof APP_SHELL_MCP_SERVER_ACTION_LABELS

export type AppShellMcpServerEditorMode = "create" | "edit" | "replace"

export type AppShellMcpServerItemActionLabelId =
  | "actions"
  | "delete"
  | "replace"
  | "revokeOAuth"
  | "startOAuth"
  | "toggleDetails"

export function getAppShellMcpServerActionLabel(
  id: AppShellMcpServerActionLabelId,
): string {
  return APP_SHELL_MCP_SERVER_ACTION_LABELS[id]
}

export function getAppShellMcpServerEditorTitle(
  mode: AppShellMcpServerEditorMode,
): string {
  if (mode === "edit") return "Edit Server"
  if (mode === "replace") return "Replace MCP Server"
  return "Add Server"
}

export function getAppShellMcpServerEditorSaveActionLabel(
  mode: AppShellMcpServerEditorMode,
  isPending: boolean,
): string {
  if (isPending) return getAppShellMcpServerActionLabel("saving")
  if (mode === "edit") return getAppShellMcpServerActionLabel("updateServer")
  if (mode === "replace") return getAppShellMcpServerActionLabel("replaceServer")
  return getAppShellMcpServerActionLabel("addServer")
}

export function getAppShellMcpServerImportActionLabel(
  isPending: boolean,
): string {
  return getAppShellMcpServerActionLabel(isPending ? "importing" : "importJson")
}

export function getAppShellMcpServerExportActionLabel(
  isPending: boolean,
): string {
  return getAppShellMcpServerActionLabel(isPending ? "exporting" : "exportJson")
}

export function getAppShellMcpServerStartOAuthActionLabel(
  isPending: boolean,
): string {
  return getAppShellMcpServerActionLabel(
    isPending ? "startingOAuth" : "startOAuth",
  )
}

export function getAppShellMcpServerRevokeOAuthActionLabel(
  isPending: boolean,
): string {
  return getAppShellMcpServerActionLabel(
    isPending ? "revokingOAuth" : "revokeOAuth",
  )
}

export function getAppShellMcpServerItemActionAccessibilityLabel(
  action: AppShellMcpServerItemActionLabelId,
  serverName: string,
): string {
  if (action === "actions") return `Actions for ${serverName} server`
  if (action === "replace") return `Replace MCP server ${serverName} config`
  if (action === "revokeOAuth") return `Revoke OAuth for MCP server ${serverName}`
  if (action === "startOAuth") return `Start OAuth for MCP server ${serverName}`
  if (action === "toggleDetails") return `Toggle ${serverName} server details`
  return `Delete MCP server ${serverName}`
}

export const APP_SHELL_MCP_SERVER_DELETE_PRESENTATION = {
  title: "Delete MCP Server",
  deleteFailed: "Failed to delete MCP server",
} as const

export function getAppShellMcpServerDeleteConfirmMessage(
  serverName: string,
): string {
  return `Delete "${serverName}" from the connected desktop MCP config?`
}

export function getAppShellMcpServerImportJsonAccessibilityLabel(): string {
  return "Import MCP server JSON"
}

export function getAppShellMcpServerExportJsonAccessibilityLabel(): string {
  return "Export MCP server JSON"
}

export function getAppShellMcpServerCreateAccessibilityLabel(): string {
  return "Create MCP server"
}

export function getAppShellMcpServerSaveAccessibilityLabel(): string {
  return "Save MCP server"
}

export function getAppShellMcpServerImportServersAccessibilityLabel(): string {
  return "Import MCP servers"
}

export const APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION = {
  saved: "Saved",
  importExport: {
    importCompleteTitle: "Import Complete",
    importFailedTitle: "Import Failed",
    exportTitle: "Export MCP Servers",
    exportFailedTitle: "Export Failed",
    exportWarning:
      "MCP config exports can include tokens, headers, and environment variables. Share only with places you trust.",
    exportSuccess: "MCP configuration exported successfully",
    jsonInvalid: "MCP server JSON is invalid",
    noImportableServers:
      "No servers to import - all server names were reserved",
    importFailed: "Failed to import MCP servers",
    exportFailed: "Failed to export MCP servers",
    saveFailed: "Failed to save MCP server",
    importConfigFailedPrefix: "Failed to import config",
    exportConfigFailedPrefix: "Failed to export config",
    invalidJsonPrefix: "Invalid JSON",
  },
  runtime: {
    enableServerMissing: "Failed to enable server: Server not found",
    disableServerMissing: "Failed to disable server: Server not found",
    connectFailedPrefix: "Failed to connect server",
    restartFailedPrefix: "Failed to restart server",
    stopFailedPrefix: "Failed to stop server",
    startFailedPrefix: "Failed to start server",
    clearLogsFailedPrefix: "Failed to clear logs",
    connectionTestSuccess: "Connection test successful",
    connectionTestFailedPrefix: "Connection test failed",
    revokeAuthenticationFailedPrefix: "Failed to revoke authentication",
    startOAuthFailedPrefix: "Failed to start OAuth flow",
    toggleToolErrorPrefix: "Error toggling tool",
    toggleToolsErrorPrefix: "Error toggling tools",
  },
  oauth: {
    started: "OAuth authentication started",
    completed: "OAuth authentication completed",
    revoked: "OAuth authentication revoked",
  },
  examples: {
    setupRequiredPrefix: "Setup required",
  },
} as const

function appendAppShellMcpFeedbackDetail(prefix: string, detail?: string): string {
  return detail ? `${prefix}: ${detail}` : prefix
}

export function formatAppShellMcpServerCount(count: number): string {
  return `${count} MCP server${count === 1 ? "" : "s"}`
}

export function formatAppShellMcpServerImportStatus(count: number): string {
  return `Imported ${formatAppShellMcpServerCount(count)}`
}

export function formatAppShellMcpServerImportCompleteMessage(
  count: number,
  skippedReservedNames: string[] = [],
): string {
  const skippedLabel =
    skippedReservedNames.length > 0
      ? ` Skipped reserved names: ${skippedReservedNames.join(", ")}.`
      : ""
  return `${formatAppShellMcpServerImportStatus(count)}.${skippedLabel}`
}

export function formatAppShellMcpServerExportStatus(count: number): string {
  return `Exported ${formatAppShellMcpServerCount(count)}`
}

export function formatAppShellMcpServerSkippedReservedName(
  serverName: string,
): string {
  return `Skipped importing reserved server name: ${serverName}`
}

export function formatAppShellMcpServerConnectedStatus(
  serverName: string,
): string {
  return `Server ${serverName} connected successfully`
}

export function formatAppShellMcpServerStartedStatus(
  serverName: string,
): string {
  return `Server ${serverName} started successfully`
}

export function formatAppShellMcpServerStoppedStatus(
  serverName: string,
): string {
  return `Server ${serverName} stopped successfully`
}

export function formatAppShellMcpServerRestartedStatus(
  serverName: string,
): string {
  return `Server ${serverName} restarted successfully`
}

export function formatAppShellMcpServerExampleAddedStatus(
  serverName: string,
  oauth = false,
): string {
  return `Added ${serverName}${oauth ? " OAuth" : ""} server configuration`
}

export function formatAppShellMcpServerSetupRequiredMessage(
  instruction: string,
): string {
  return `${APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.examples.setupRequiredPrefix}: ${instruction}`
}

export function formatAppShellMcpServerReservedNameHiddenMessage(
  serverName: string,
): string {
  return `Server "${serverName}" uses a reserved name and has been hidden. Please rename or remove it from your MCP configuration.`
}

export function formatAppShellMcpServerLogsClearedStatus(
  serverName: string,
): string {
  return `Logs cleared for ${serverName}`
}

export function formatAppShellMcpServerConnectFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.connectFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpServerRestartFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.restartFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpServerStopFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.stopFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpServerStartFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.startFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpServerClearLogsFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.clearLogsFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpServerConnectionTestFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime
      .connectionTestFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpServerImportConfigFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.importExport.importConfigFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpServerExportConfigFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.importExport.exportConfigFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpServerInvalidJsonMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.importExport.invalidJsonPrefix,
    detail,
  )
}

export function formatAppShellMcpServerRevokeAuthenticationFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime
      .revokeAuthenticationFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpServerStartOAuthFailedMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.startOAuthFailedPrefix,
    detail,
  )
}

export function formatAppShellMcpToolToggleStatus(
  toolName: string,
  enabled: boolean,
): string {
  return `Tool ${toolName} ${enabled ? "enabled" : "disabled"}`
}

export function formatAppShellMcpToolToggleFailedMessage(
  toolName: string,
  enabled: boolean,
): string {
  return `Failed to ${enabled ? "enable" : "disable"} tool ${toolName}`
}

export function formatAppShellMcpToolToggleErrorMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.toggleToolErrorPrefix,
    detail,
  )
}

export function formatAppShellMcpSourceToolsToggleStatus(
  toolCount: number,
  sourceLabel: string,
  enabled: boolean,
): string {
  return `All ${toolCount} tools for ${sourceLabel} ${enabled ? "enabled" : "disabled"}`
}

export function formatAppShellMcpSourceToolsPartialToggleStatus(
  successfulCount: number,
  totalCount: number,
  sourceLabel: string,
  enabled: boolean,
  failedCount: number,
): string {
  return `${successfulCount}/${totalCount} tools ${enabled ? "enabled" : "disabled"} for ${sourceLabel} (${failedCount} failed)`
}

export function formatAppShellMcpSourceToolsToggleErrorMessage(
  sourceLabel: string,
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    `${APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.toggleToolsErrorPrefix} for ${sourceLabel}`,
    detail,
  )
}

export function formatAppShellMcpToolsToggleStatus(
  toolCount: number,
  enabled: boolean,
): string {
  return `All ${toolCount} tools ${enabled ? "enabled" : "disabled"}`
}

export function formatAppShellMcpToolsPartialToggleStatus(
  successfulCount: number,
  totalCount: number,
  enabled: boolean,
  failedCount: number,
): string {
  return `${successfulCount}/${totalCount} tools ${enabled ? "enabled" : "disabled"} (${failedCount} failed)`
}

export function formatAppShellMcpToolsToggleErrorMessage(
  detail?: string,
): string {
  return appendAppShellMcpFeedbackDetail(
    APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.toggleToolsErrorPrefix,
    detail,
  )
}

export const APP_SHELL_LOOP_ACTION_LABELS = {
  addTask: "Add Task",
  cancel: "Cancel",
  delete: "Delete",
  deleteTask: "Delete task",
  editTask: "Edit task",
  export: "Export",
  exporting: "Exporting...",
  file: "File",
  import: "Import",
  importing: "Importing...",
  importLoop: "Import Loop",
  runNow: "Run now",
  save: "Save",
  start: "Start",
  starting: "Starting...",
  startAll: "Start All",
  startingAll: "Starting All...",
  stop: "Stop",
  stopping: "Stopping...",
  stopAll: "Stop All",
  stoppingAll: "Stopping All...",
} as const

export const APP_SHELL_LOOP_EDITOR_PRESENTATION = {
  description: "Set the prompt, schedule, and startup behavior.",
  loadingLabel: "Loading loop...",
  unavailableLoadSaveError:
    "Configure Base URL and API key to load and save loops",
  unavailableSaveError: "Configure Base URL and API key in Settings before saving",
  unavailableSaveHelper:
    "Configure Base URL and API key in Settings to save changes.",
  errors: {
    loadProfilesFailed: "Failed to load agent profiles",
    loadSessionsFailed: "Failed to load sessions",
    loadFailed: "Failed to load loop",
    notFound: "Loop not found",
    saveFailed: "Failed to save loop",
  },
  fields: {
    name: {
      label: "Name",
      requiredLabel: "Name *",
      placeholder: "Daily review",
    },
    prompt: {
      label: "Prompt",
      requiredLabel: "Prompt *",
      placeholder: "Summarize the latest updates and notify me",
    },
    schedule: {
      label: "Schedule",
    },
    interval: {
      label: "Interval (minutes)",
      requiredLabel: "Interval (minutes) *",
      placeholder: "60",
      unitLabel: "minutes",
    },
    times: {
      label: "Time(s) (HH:MM, local)",
      placeholder: "09:00",
      helper: "Local time, 24-hour format.",
    },
    daysOfWeek: {
      label: "Days of week",
    },
    maxIterations: {
      label: "Max iterations (optional)",
      placeholder: "Uses desktop default",
    },
    agentProfile: {
      label: "Agent Profile (optional)",
      helper:
        "Choose a dedicated agent for this loop, or leave it on the default agent.",
    },
    continueFromSession: {
      label: "Continue from session",
    },
  },
  scheduleModes: {
    interval: "Interval",
    continuous: "Continuous",
    daily: "Daily",
    weekly: "Weekly",
  },
  schedule: {
    continuousHelper:
      "Starts the next run as soon as the previous run finishes. Only one run of this task executes at a time.",
  },
  switches: {
    enabled: {
      label: "Enabled",
    },
    runOnStartup: {
      label: "Run on startup",
      helper: "Runs once when the desktop repeat task service starts.",
    },
    speakOnTrigger: {
      label: "Speak on trigger",
      helper:
        "Unsnoozes the completed task session so desktop TTS can play the result.",
    },
    continueInSession: {
      label: "Continue in same session",
      helper:
        "Appends future runs to the last task session when it can be revived.",
    },
  },
  sessionPicker: {
    autoLabel: "Auto",
    autoDesktopLabel: "Auto - most recent run of this task",
    autoAccessibilityLabel: "Auto select this loop most recent session",
    autoSelectedHint:
      "Currently selected. Future runs use this task most recent session.",
    autoUnselectedHint: "Clears the pinned session for this loop.",
    autoHelper: "Uses this task's most recent session when it can be revived.",
    desktopHelper:
      "When left on Auto, this task appends to whichever session it last created. Pick a specific session to resume it on the next run. If the selected session can no longer be revived, this task falls back to a new session and tracks that one instead.",
    loadingLabel: "Loading sessions...",
    emptyLabel:
      "No active or recent desktop sessions found. Auto still tracks the next session this loop creates.",
  },
  agentProfile: {
    defaultLabel: "No dedicated agent",
    defaultAccessibilityLabel: "Use the default agent for this loop",
    defaultSelectedHint:
      "Currently selected. The loop runs with the default active agent.",
    defaultUnselectedHint:
      "Leaves this loop on the default active agent instead of a dedicated profile.",
    defaultHelper: "Uses the default active agent when this loop runs.",
    emptyLabel:
      "No saved agent profiles yet. This loop will use the default agent until you create one.",
    loadingLabel: "Loading profiles...",
  },
  actions: {
    addTime: "Add time",
    removeTime: "Remove time",
  },
} as const

export type AppShellLoopActionLabelId = keyof typeof APP_SHELL_LOOP_ACTION_LABELS

export function getAppShellLoopActionLabel(
  id: AppShellLoopActionLabelId,
): string {
  return APP_SHELL_LOOP_ACTION_LABELS[id]
}

export function getAppShellLoopStartAllActionLabel(isPending: boolean): string {
  return getAppShellLoopActionLabel(isPending ? "startingAll" : "startAll")
}

export function getAppShellLoopStopAllActionLabel(isPending: boolean): string {
  return getAppShellLoopActionLabel(isPending ? "stoppingAll" : "stopAll")
}

export function getAppShellLoopStartActionLabel(isPending: boolean): string {
  return getAppShellLoopActionLabel(isPending ? "starting" : "start")
}

export function getAppShellLoopStopActionLabel(isPending: boolean): string {
  return getAppShellLoopActionLabel(isPending ? "stopping" : "stop")
}

export function getAppShellLoopExportActionLabel(isPending: boolean): string {
  return getAppShellLoopActionLabel(isPending ? "exporting" : "export")
}

export function getAppShellLoopToggleAccessibilityLabel(
  loopName: string,
  isEnabled: boolean,
): string {
  return `${isEnabled ? "Disable" : "Enable"} ${loopName}`
}

export function getAppShellLoopRunNowAccessibilityLabel(
  loopName: string,
): string {
  return `Run ${loopName} loop now`
}

export function getAppShellLoopStartAllAccessibilityLabel(): string {
  return "Start all loop schedules"
}

export function getAppShellLoopStopAllAccessibilityLabel(): string {
  return "Stop all loop schedules"
}

export function getAppShellLoopStartScheduleAccessibilityLabel(
  loopName: string,
): string {
  return `Start ${loopName} loop schedule`
}

export function getAppShellLoopStopScheduleAccessibilityLabel(
  loopName: string,
): string {
  return `Stop ${loopName} loop schedule`
}

export function getAppShellLoopExportMarkdownAccessibilityLabel(
  loopName: string,
): string {
  return `Export ${loopName} loop as Markdown`
}

export function getAppShellLoopDeleteAccessibilityLabel(
  loopName: string,
): string {
  return `Delete ${loopName} loop`
}

export function getAppShellLoopImportMarkdownAccessibilityLabel(): string {
  return "Import loop Markdown"
}

export const APP_SHELL_LOOP_DELETE_PRESENTATION = {
  title: "Delete Task",
  deleted: "Task deleted",
  deleteFailed: "Failed to delete task",
} as const

export function getAppShellLoopDeleteConfirmMessage(loopName?: string): string {
  return loopName
    ? `Are you sure you want to delete "${loopName}"?`
    : "Are you sure you want to delete this repeat task?"
}

export const APP_SHELL_LOOP_FEEDBACK_PRESENTATION = {
  titles: {
    success: "Success",
    error: "Error",
    importComplete: "Import Complete",
    importFailed: "Import Failed",
    exportFailed: "Export Failed",
  },
  save: {
    created: "Task created",
    updated: "Task updated",
    saveFailed: "Failed to save task",
    updateFailed: "Failed to update task",
    enabled: "Task enabled",
    disabled: "Task disabled",
  },
  importExport: {
    importFailed: "Failed to import task",
    exportFailed: "Failed to export task",
  },
  runtime: {
    triggerFailed: "Failed to trigger task",
    startFailed: "Failed to start task",
    stopFailed: "Failed to stop task",
    startAllFailed: "Failed to start all tasks",
    stopAllFailed: "Failed to stop all tasks",
    revealFailed: "Failed to reveal task file",
  },
} as const

export function formatAppShellLoopImportedStatus(loopName: string): string {
  return `Imported task "${loopName}"`
}

export function formatAppShellLoopImportCompleteMessage(loopName: string): string {
  return `${formatAppShellLoopImportedStatus(loopName)}.`
}

export function formatAppShellLoopExportedStatus(loopName: string): string {
  return `Exported task "${loopName}"`
}

export function formatAppShellLoopStartedStatus(loopName: string): string {
  return `Started task "${loopName}"`
}

export function formatAppShellLoopStoppedStatus(loopName: string): string {
  return `Stopped task "${loopName}"`
}

export function formatAppShellLoopBulkStartedStatus(count: number): string {
  return `Started ${count} task${count === 1 ? "" : "s"}`
}

export function formatAppShellLoopBulkStoppedStatus(count: number): string {
  return `Stopped ${count} task${count === 1 ? "" : "s"}`
}

export function formatAppShellLoopRunningMessage(loopName: string): string {
  return `Running "${loopName}"...`
}

export function formatAppShellLoopTriggerUnavailableMessage(loopName: string): string {
  return `Could not trigger "${loopName}" right now`
}

export const APP_SHELL_LOOP_LIST_PRESENTATION = {
  emptyTitle: "No repeat tasks configured.",
  emptyDescription: "Create one with Add Task or import an existing task.",
  status: {
    running: "Running",
    disabled: "Disabled",
  },
  features: {
    runOnStartup: "Runs on startup",
    speakOnTrigger: "Speaks on trigger",
    continueInSession: "Continues in same session",
  },
} as const

export type AppShellLoopListProfile = {
  enabled?: boolean
  runOnStartup?: boolean
  speakOnTrigger?: boolean
  continueInSession?: boolean
}

export function getAppShellLoopStatusLabel(options: {
  enabled?: boolean
  isRunning?: boolean
}): string | null {
  if (options.isRunning) return APP_SHELL_LOOP_LIST_PRESENTATION.status.running
  if (options.enabled === false) {
    return APP_SHELL_LOOP_LIST_PRESENTATION.status.disabled
  }
  return null
}

export function getAppShellLoopFeatureLabels(
  loop: AppShellLoopListProfile,
): string[] {
  const labels: string[] = []
  if (loop.runOnStartup) {
    labels.push(APP_SHELL_LOOP_LIST_PRESENTATION.features.runOnStartup)
  }
  if (loop.speakOnTrigger) {
    labels.push(APP_SHELL_LOOP_LIST_PRESENTATION.features.speakOnTrigger)
  }
  if (loop.continueInSession) {
    labels.push(APP_SHELL_LOOP_LIST_PRESENTATION.features.continueInSession)
  }
  return labels
}

export function formatAppShellLoopNextRunLabel(timestampLabel: string): string {
  return `Next run: ${timestampLabel}`
}

export function formatAppShellLoopLastRunLabel(timestampLabel: string): string {
  return `Last run: ${timestampLabel}`
}

export function getAppShellEditorTitle(
  kind: AppShellEditorKind,
  isEditing: boolean,
): string {
  const presentation = APP_SHELL_EDITOR_PRESENTATION[kind]
  return isEditing ? presentation.editTitle : presentation.createTitle
}

export function getAppShellEditorActionLabel(
  kind: AppShellEditorKind,
  isEditing: boolean,
): string {
  const presentation = APP_SHELL_EDITOR_PRESENTATION[kind]
  return isEditing
    ? presentation.saveActionLabel
    : presentation.createActionLabel
}

export function getDesktopSettingsNavItems(features: {
  whatsappEnabled: boolean
  discordEnabled: boolean
}): AppShellSettingsNavItem[] {
  return APP_SHELL_SETTINGS_NAV_ITEMS.filter((item) => {
    if (item.feature === "whatsapp") return features.whatsappEnabled
    if (item.feature === "discord") return features.discordEnabled
    return true
  })
}

export function getDesktopPrimaryNavItemId(
  pathname: string,
): AppShellPrimaryNavItemId {
  if (pathname === "/knowledge" || pathname.startsWith("/knowledge/")) {
    return "knowledge"
  }
  if (
    pathname === "/settings/agents" ||
    pathname.startsWith("/settings/agents/")
  ) {
    return "agents"
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return "settings"
  }
  return "sessions"
}

export function getDesktopSettingsActiveNavItemId(
  pathname: string,
): AppShellSettingsNavItemId | null {
  if (pathname === "/settings/general") return "general"
  if (pathname === "/settings/mcp-tools") return "capabilities"
  if (pathname === "/settings/skills") return "capabilities"
  if (pathname === "/settings/remote-server") return "general"
  if (pathname === "/settings/loops") return "repeatTasks"
  if (pathname === "/knowledge" || pathname.startsWith("/knowledge/")) {
    return "knowledge"
  }
  if (pathname === "/settings") return "general"
  if (pathname === "/settings/models") return "models"
  if (pathname === "/settings/providers") return "providers"
  if (pathname === "/settings/capabilities") return "capabilities"
  if (pathname === "/settings/whatsapp") return "whatsapp"
  if (pathname === "/settings/discord") return "discord"
  if (
    pathname === "/settings/agents" ||
    pathname.startsWith("/settings/agents/")
  ) {
    return "agents"
  }
  if (pathname === "/settings/repeat-tasks") return "repeatTasks"
  return null
}

export function getMobilePrimaryNavItemId(
  routeName?: string | null,
): AppShellPrimaryNavItemId {
  if (routeName === "AgentEdit") return "agents"
  if (routeName === "KnowledgeNoteEdit") return "knowledge"
  if (routeName === "Settings") return "settings"
  return "sessions"
}
