import { describe, expect, it } from "vitest"

import {
  APP_SHELL_BREAKPOINTS,
  APP_SHELL_AGENT_ACTION_LABELS,
  APP_SHELL_AGENT_DELETE_PRESENTATION,
  APP_SHELL_AGENT_EDITOR_PRESENTATION,
  APP_SHELL_AGENT_LIST_PRESENTATION,
  APP_SHELL_AGENT_PROFILE_FEEDBACK_PRESENTATION,
  APP_SHELL_BUNDLE_ACTION_LABELS,
  APP_SHELL_BUNDLE_IMPORT_PRESENTATION,
  APP_SHELL_DIMENSIONS,
  APP_SHELL_EDITOR_PRESENTATION,
  APP_SHELL_HEADER_ACTIONS,
  APP_SHELL_KNOWLEDGE_NOTE_ACTION_LABELS,
  APP_SHELL_KNOWLEDGE_NOTE_DELETE_PRESENTATION,
  APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION,
  APP_SHELL_LOOP_ACTION_LABELS,
  APP_SHELL_LOOP_DELETE_PRESENTATION,
  APP_SHELL_LOOP_EDITOR_PRESENTATION,
  APP_SHELL_LOOP_FEEDBACK_PRESENTATION,
  APP_SHELL_LOOP_LIST_PRESENTATION,
  APP_SHELL_MCP_SERVER_ACTION_LABELS,
  APP_SHELL_MCP_SERVER_DELETE_PRESENTATION,
  APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION,
  APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION,
  APP_SHELL_MODEL_PRESET_PRESENTATION,
  APP_SHELL_MOBILE_DESKTOP_SHELL_HEADERLESS_ROUTES,
  APP_SHELL_MOBILE_ROUTE_TITLES,
  APP_SHELL_MOBILE_SETTINGS_SECTIONS,
  APP_SHELL_MOBILE_SETTINGS_SECTION_IDS,
  APP_SHELL_PRIMARY_NAV_ITEMS,
  APP_SHELL_PROVIDER_SETUP_PRESENTATION,
  APP_SHELL_SESSION_START_PRESENTATION,
  APP_SHELL_SESSION_START_SURFACE_PRESENTATION,
  APP_SHELL_SETTINGS_FEEDBACK_LABELS,
  APP_SHELL_SKILL_ACTION_LABELS,
  APP_SHELL_SKILL_DELETE_PRESENTATION,
  APP_SHELL_SKILL_EDITOR_PRESENTATION,
  APP_SHELL_SKILL_FEEDBACK_PRESENTATION,
  formatAppShellKnowledgeNoteDeleteConfirmMessage,
  formatAppShellKnowledgeNoteBulkActionLabel,
  formatAppShellKnowledgeNoteDeleteCountLabel,
  formatAppShellBundleComponentSummary,
  formatAppShellBundleConflictCount,
  formatAppShellBundleCreatedDateLabel,
  formatAppShellBundleExportStatus,
  formatAppShellBundleExportedFromLabel,
  formatAppShellBundleImportCompleteMessage,
  formatAppShellBundleImportStatus,
  formatAppShellBundleImportSuccessToast,
  formatAppShellBundleItemCount,
  formatAppShellBundlePreviewStatus,
  formatAppShellSkillBulkActionLabel,
  formatAppShellSkillDeleteSelectedConfirmMessage,
  formatAppShellSkillCount,
  formatAppShellSkillExportedStatus,
  formatAppShellSkillFolderImportStatus,
  formatAppShellSkillGitHubImportedStatus,
  formatAppShellSkillGitHubImportCompleteMessage,
  formatAppShellSkillGitHubImportStatus,
  formatAppShellSkillImportedStatus,
  formatAppShellSkillImportedSuccessMessage,
  formatAppShellSkillImportCompleteMessage,
  formatAppShellSkillImportSummary,
  formatAppShellSkillPartialDeleteMessage,
  formatAppShellLoopLastRunLabel,
  formatAppShellLoopNextRunLabel,
  formatAppShellLoopBulkStartedStatus,
  formatAppShellLoopBulkStoppedStatus,
  formatAppShellLoopExportedStatus,
  formatAppShellLoopImportCompleteMessage,
  formatAppShellLoopImportedStatus,
  formatAppShellLoopRunningMessage,
  formatAppShellLoopStartedStatus,
  formatAppShellLoopStoppedStatus,
  formatAppShellLoopTriggerUnavailableMessage,
  getAppShellAgentActionLabel,
  getAppShellAgentDeleteAccessibilityLabel,
  getAppShellAgentDeleteConfirmMessage,
  getAppShellAgentListBadges,
  getAppShellAgentListConnectionType,
  getAppShellAgentListDescription,
  getAppShellAgentListDisplayName,
  getAppShellAgentListInitial,
  getAppShellAgentListMetadata,
  getAppShellAgentRescanAccessibilityLabel,
  getAppShellAgentRescanActionLabel,
  formatAppShellAgentProfileImportSuccessMessage,
  getAppShellBundleActionLabel,
  getAppShellBundleExportActionLabel,
  getAppShellBundleExportJsonAccessibilityLabel,
  getAppShellBundleImportActionLabel,
  getAppShellBundleImportJsonAccessibilityLabel,
  getAppShellBundlePreviewActionLabel,
  getAppShellBundlePreviewJsonAccessibilityLabel,
  getAppShellBundleComponentLabel,
  getAppShellEditorActionLabel,
  getAppShellEditorTitle,
  APP_SHELL_PRODUCT_LABEL,
  getAppShellGlobalTtsToggleLabel,
  getAppShellHeaderActionDisplayLabel,
  getAppShellHeaderActionHint,
  getAppShellHeaderActionLabel,
  getAppShellHeaderActionMobileIconColors,
  getAppShellHeaderActionMobileIconState,
  getAppShellKnowledgeNoteActionLabel,
  getAppShellKnowledgeNoteDeleteAccessibilityLabel,
  getAppShellKnowledgeNoteDeleteAllAccessibilityLabel,
  getAppShellKnowledgeNoteDeleteConfirmTitle,
  getAppShellKnowledgeNoteDeleteSelectedAccessibilityLabel,
  getAppShellKnowledgeNoteSelectionAccessibilityLabel,
  getAppShellKnowledgeNoteSelectionLabel,
  getAppShellLoopActionLabel,
  getAppShellLoopDeleteConfirmMessage,
  getAppShellLoopDeleteAccessibilityLabel,
  getAppShellLoopExportActionLabel,
  getAppShellLoopExportMarkdownAccessibilityLabel,
  getAppShellLoopImportMarkdownAccessibilityLabel,
  getAppShellLoopRunNowAccessibilityLabel,
  getAppShellLoopStartActionLabel,
  getAppShellLoopStartAllAccessibilityLabel,
  getAppShellLoopStartAllActionLabel,
  getAppShellLoopStartScheduleAccessibilityLabel,
  getAppShellLoopStopActionLabel,
  getAppShellLoopStopAllAccessibilityLabel,
  getAppShellLoopStopAllActionLabel,
  getAppShellLoopStopScheduleAccessibilityLabel,
  getAppShellLoopToggleAccessibilityLabel,
  getAppShellLoopFeatureLabels,
  getAppShellLoopStatusLabel,
  getAppShellMcpServerActionLabel,
  getAppShellMcpServerCreateAccessibilityLabel,
  getAppShellMcpServerDeleteConfirmMessage,
  getAppShellMcpServerEditorSaveActionLabel,
  getAppShellMcpServerEditorTitle,
  getAppShellMcpServerExportActionLabel,
  getAppShellMcpServerExportJsonAccessibilityLabel,
  getAppShellMcpServerImportActionLabel,
  getAppShellMcpServerImportJsonAccessibilityLabel,
  getAppShellMcpServerImportServersAccessibilityLabel,
  getAppShellMcpServerItemActionAccessibilityLabel,
  getAppShellMcpServerRevokeOAuthActionLabel,
  getAppShellMcpServerSaveAccessibilityLabel,
  getAppShellMcpServerStartOAuthActionLabel,
  formatAppShellMcpServerClearLogsFailedMessage,
  formatAppShellMcpServerConnectedStatus,
  formatAppShellMcpServerConnectFailedMessage,
  formatAppShellMcpServerConnectionTestFailedMessage,
  formatAppShellMcpServerCount,
  formatAppShellMcpServerExampleAddedStatus,
  formatAppShellMcpServerExportConfigFailedMessage,
  formatAppShellMcpServerExportStatus,
  formatAppShellMcpServerImportCompleteMessage,
  formatAppShellMcpServerImportConfigFailedMessage,
  formatAppShellMcpServerImportStatus,
  formatAppShellMcpServerInvalidJsonMessage,
  formatAppShellMcpServerLogsClearedStatus,
  formatAppShellMcpServerRestartedStatus,
  formatAppShellMcpServerRestartFailedMessage,
  formatAppShellMcpServerRevokeAuthenticationFailedMessage,
  formatAppShellMcpServerSetupRequiredMessage,
  formatAppShellMcpServerSkippedReservedName,
  formatAppShellMcpServerStartedStatus,
  formatAppShellMcpServerStartFailedMessage,
  formatAppShellMcpServerStartOAuthFailedMessage,
  formatAppShellMcpServerStoppedStatus,
  formatAppShellMcpServerStopFailedMessage,
  formatAppShellMcpSourceToolsPartialToggleStatus,
  formatAppShellMcpSourceToolsToggleErrorMessage,
  formatAppShellMcpSourceToolsToggleStatus,
  formatAppShellMcpToolToggleErrorMessage,
  formatAppShellMcpToolToggleFailedMessage,
  formatAppShellMcpToolToggleStatus,
  formatAppShellMcpToolsPartialToggleStatus,
  formatAppShellMcpToolsToggleErrorMessage,
  formatAppShellMcpToolsToggleStatus,
  formatAppShellModelPresetCount,
  getAppShellModelPresetDeleteConfirmMessage,
  getAppShellModelPresetEditorDescription,
  getAppShellModelPresetEditorTitle,
  getAppShellChatGptWebConnectionLabel,
  getAppShellDesktopSettingsNavItemIdForMobileSection,
  getAppShellMobileSettingsSectionIdsForDesktopNavItem,
  getAppShellMobileSettingsInitialExpandedState,
  getAppShellMobileSettingsSectionTitle,
  getAppShellPrimaryNavItemLabel,
  getAppShellProviderModelSelectionMovedDescription,
  getAppShellSessionStartCopyState,
  getAppShellSessionStartDesktopSurfaceState,
  getAppShellSidebarToggleLabel,
  getAppShellSkillActionLabel,
  getAppShellSkillDeleteConfirmMessage,
  getAppShellSkillDeleteConfirmTitle,
  getAppShellSkillExportMarkdownAccessibilityLabel,
  getAppShellSkillImportGitHubAccessibilityLabel,
  getAppShellSkillImportMarkdownAccessibilityLabel,
  getAppShellSkillItemActionAccessibilityLabel,
  getAppShellSkillSelectionAccessibilityLabel,
  getAppShellSkillSelectionLabel,
  getDesktopPrimaryNavItemId,
  getDesktopSettingsActiveNavItemId,
  getDesktopSettingsNavItems,
  getMobilePrimaryNavItemId,
  isAppShellMobileSettingsSectionId,
  resolveAppShellLayout,
  shouldHideMobileStackHeaderForDesktopShell,
  shouldUseCompactAppShell,
} from "./app-shell"
import { SIDEBAR_DIMENSIONS } from "./sidebar-persistence"

describe("app shell", () => {
  it("uses one shared breakpoint for compact and desktop shells", () => {
    expect(resolveAppShellLayout(APP_SHELL_BREAKPOINTS.compactMaxWidth)).toBe(
      "compact",
    )
    expect(resolveAppShellLayout(APP_SHELL_BREAKPOINTS.desktopMinWidth)).toBe(
      "desktop",
    )
    expect(shouldUseCompactAppShell(430)).toBe(true)
    expect(shouldUseCompactAppShell(1024)).toBe(false)
  })

  it("keeps shell dimensions aligned with the desktop sidebar defaults", () => {
    expect(APP_SHELL_PRODUCT_LABEL).toBe("DotAgents")
    expect(APP_SHELL_SETTINGS_FEEDBACK_LABELS.error).toBe("Error")
    expect(APP_SHELL_DIMENSIONS.desktopRailWidth).toBe(
      SIDEBAR_DIMENSIONS.width.default,
    )
    expect(APP_SHELL_DIMENSIONS.desktopSettingsNavWidth).toBe(220)
    expect(APP_SHELL_DIMENSIONS.desktopContentMaxWidth).toBe(920)
    expect(APP_SHELL_DIMENSIONS.compactPrimaryNavHeight).toBe(49)
  })

  it("keeps primary navigation platform mappings in one shared list", () => {
    expect(APP_SHELL_PRIMARY_NAV_ITEMS.map((item) => item.id)).toEqual([
      "sessions",
      "agents",
      "knowledge",
      "settings",
    ])
    expect(APP_SHELL_PRIMARY_NAV_ITEMS[0].desktopPath).toBe("/")
    expect(APP_SHELL_PRIMARY_NAV_ITEMS[0].mobileRouteName).toBe("Sessions")
    expect(
      APP_SHELL_PRIMARY_NAV_ITEMS.find((item) => item.id === "agents")
        ?.mobileRouteParams,
    ).toEqual({ initialSection: "agents" })
    expect(
      APP_SHELL_PRIMARY_NAV_ITEMS.find((item) => item.id === "knowledge")
        ?.mobileRouteParams,
    ).toEqual({ initialSection: "knowledgeNotes" })
    expect(getAppShellPrimaryNavItemLabel("sessions")).toBe("Chats")
    expect(getAppShellPrimaryNavItemLabel("settings")).toBe("Settings")
  })

  it("shares compact header action labels across shells", () => {
    expect(APP_SHELL_HEADER_ACTIONS.newChat.displayLabel).toBe("+ New Chat")
    expect(getAppShellHeaderActionDisplayLabel("startTextSession")).toBe(
      "Start with Text",
    )
    expect(getAppShellHeaderActionDisplayLabel("startVoiceSession")).toBe(
      "Start with Voice",
    )
    expect(getAppShellHeaderActionLabel("savedConversations")).toBe(
      "Saved conversations",
    )
    expect(getAppShellHeaderActionDisplayLabel("closeSettings")).toBe("Close")
    expect(getAppShellHeaderActionHint("openSplitView")).toBe(
      "Opens two chats at once for comparison",
    )
    expect(APP_SHELL_HEADER_ACTIONS.openSplitView.mobileIcon).toMatchObject({
      name: "git-compare-outline",
      size: 18,
      colorToken: "foreground",
    })
    expect(APP_SHELL_HEADER_ACTIONS.openSettings.mobileIcon).toMatchObject({
      name: "settings-outline",
      size: 20,
      colorToken: "foreground",
    })
    expect(getAppShellHeaderActionMobileIconState("openSplitView")).toBe(
      APP_SHELL_HEADER_ACTIONS.openSplitView.mobileIcon,
    )
    expect(getAppShellHeaderActionMobileIconState("openSettings")).toBe(
      APP_SHELL_HEADER_ACTIONS.openSettings.mobileIcon,
    )
    expect(
      getAppShellHeaderActionMobileIconColors(
        {
          foreground: "#123456",
        },
        "openSplitView",
      ),
    ).toEqual({
      color: "#123456",
    })
    expect(getAppShellGlobalTtsToggleLabel(true)).toBe("Disable global TTS")
    expect(getAppShellGlobalTtsToggleLabel(false)).toBe("Enable global TTS")
    expect(getAppShellSidebarToggleLabel(true)).toBe("Expand sidebar")
    expect(getAppShellSidebarToggleLabel(false)).toBe("Collapse sidebar")
    expect(APP_SHELL_SESSION_START_PRESENTATION.emptyTitle).toBe(
      "No Active Sessions",
    )
    expect(APP_SHELL_SESSION_START_PRESENTATION.agentSelectorLabel).toBe(
      "Agent",
    )
    expect(APP_SHELL_SESSION_START_PRESENTATION.recordingActionLabel).toBe(
      "Recording...",
    )
    expect(APP_SHELL_SESSION_START_PRESENTATION.keybindLabels.text).toBe(
      "Text:",
    )
    expect(getAppShellSessionStartCopyState()).toBe(
      APP_SHELL_SESSION_START_PRESENTATION,
    )
    expect(getAppShellSessionStartDesktopSurfaceState()).toBe(
      APP_SHELL_SESSION_START_SURFACE_PRESENTATION.desktop,
    )
    expect(
      APP_SHELL_SESSION_START_SURFACE_PRESENTATION.desktop.empty,
    ).toMatchObject({
      containerClassName:
        "flex w-full flex-col items-center px-5 py-6 text-center sm:px-6",
      titleClassName: "mb-1.5 text-lg font-semibold",
      actionsClassName: "flex flex-wrap gap-2 items-center justify-center",
      keybindRowClassName:
        "flex flex-wrap items-center justify-center gap-2.5 text-xs text-muted-foreground",
    })
    expect(
      APP_SHELL_SESSION_START_SURFACE_PRESENTATION.desktop.expanded,
    ).toMatchObject({
      containerClassName: "flex items-center gap-2 p-3 bg-card border-b",
      textAreaClassName: "min-h-[60px] max-h-[120px] flex-1 resize-none",
      actionButtonClassName: "h-8",
    })
    expect(
      APP_SHELL_SESSION_START_SURFACE_PRESENTATION.desktop.idle,
    ).toMatchObject({
      containerClassName:
        "flex items-center justify-between gap-3 p-3 bg-card border-b",
      actionButtonClassName: "gap-2",
      descriptionClassName: "text-sm text-muted-foreground",
    })
  })

  it("only hides mobile stack headers for top-level desktop shell routes", () => {
    expect(APP_SHELL_MOBILE_DESKTOP_SHELL_HEADERLESS_ROUTES).toEqual([
      "Sessions",
      "Settings",
    ])
    expect(shouldHideMobileStackHeaderForDesktopShell("Sessions")).toBe(true)
    expect(shouldHideMobileStackHeaderForDesktopShell("Settings")).toBe(true)
    expect(shouldHideMobileStackHeaderForDesktopShell("Chat")).toBe(false)
    expect(shouldHideMobileStackHeaderForDesktopShell("AgentEdit")).toBe(false)
  })

  it("shares editor titles and action labels across app shells", () => {
    expect(APP_SHELL_EDITOR_PRESENTATION.agent.createTitle).toBe("Create Agent")
    expect(getAppShellEditorTitle("agent", true)).toBe("Edit Agent")
    expect(getAppShellEditorTitle("knowledgeNote", false)).toBe("Create Note")
    expect(getAppShellEditorActionLabel("agent", true)).toBe("Save Changes")
    expect(getAppShellEditorActionLabel("loop", false)).toBe("Create Loop")
    expect(getAppShellEditorActionLabel("skill", true)).toBe("Save Skill")
  })

  it("shares skill management labels across app shells", () => {
    expect(APP_SHELL_SKILL_ACTION_LABELS.importFromGitHub).toBe(
      "Import from GitHub",
    )
    expect(APP_SHELL_SKILL_EDITOR_PRESENTATION.createDescription).toBe(
      "Create a skill with specialized instructions for the agent.",
    )
    expect(APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.name.placeholder).toBe(
      "Code review expert",
    )
    expect(APP_SHELL_SKILL_EDITOR_PRESENTATION.fields.instructions.helper).toBe(
      "Skill files are saved by the desktop server under .agents/skills.",
    )
    expect(getAppShellSkillActionLabel("exporting")).toBe("Exporting...")
    expect(getAppShellSkillActionLabel("importSkillFromGitHubTitle")).toBe(
      "Import Skill from GitHub",
    )
    expect(formatAppShellSkillBulkActionLabel("exportBundle", 3)).toBe(
      "Export Bundle (3)",
    )
    expect(formatAppShellSkillBulkActionLabel("deleteSelected", 0)).toBe(
      "Delete Selected",
    )
    expect(getAppShellSkillSelectionLabel(true)).toBe("Selected")
    expect(
      getAppShellSkillSelectionAccessibilityLabel("Code Review", true),
    ).toBe("Deselect skill Code Review")
    expect(
      getAppShellSkillItemActionAccessibilityLabel("actions", "Code Review"),
    ).toBe("Actions for Code Review")
    expect(
      getAppShellSkillItemActionAccessibilityLabel("edit", "Code Review"),
    ).toBe("Edit skill Code Review")
    expect(
      getAppShellSkillExportMarkdownAccessibilityLabel("Code Review"),
    ).toBe("Export skill Code Review as Markdown")
    expect(getAppShellSkillImportMarkdownAccessibilityLabel()).toBe(
      "Import skill Markdown",
    )
    expect(getAppShellSkillImportGitHubAccessibilityLabel()).toBe(
      "Import skill from GitHub",
    )
    expect(APP_SHELL_SKILL_DELETE_PRESENTATION.singleTitle).toBe("Delete Skill")
    expect(getAppShellSkillDeleteConfirmTitle()).toBe("Delete Skill")
    expect(getAppShellSkillDeleteConfirmTitle(true)).toBe(
      "Delete Selected Skills",
    )
    expect(getAppShellSkillDeleteConfirmMessage("Code Review")).toBe(
      'Are you sure you want to delete the skill "Code Review"?',
    )
    expect(formatAppShellSkillDeleteSelectedConfirmMessage(2)).toBe(
      "Are you sure you want to delete 2 selected skills?",
    )
    expect(formatAppShellSkillPartialDeleteMessage(1, 3)).toBe(
      "Deleted 1 of 3 selected skills.",
    )
    expect(APP_SHELL_SKILL_FEEDBACK_PRESENTATION.importFailedTitle).toBe(
      "Import Failed",
    )
    expect(formatAppShellSkillCount(1)).toBe("1 skill")
    expect(formatAppShellSkillCount(2)).toBe("2 skills")
    expect(formatAppShellSkillImportedStatus("Code Review")).toBe(
      'Imported skill "Code Review"',
    )
    expect(formatAppShellSkillImportCompleteMessage("Code Review")).toBe(
      'Imported "Code Review".',
    )
    expect(formatAppShellSkillImportedSuccessMessage("Code Review")).toBe(
      'Skill "Code Review" imported successfully',
    )
    expect(formatAppShellSkillExportedStatus("Code Review")).toBe(
      'Exported skill "Code Review"',
    )
    expect(formatAppShellSkillGitHubImportedStatus(2)).toBe(
      "Imported 2 skills from GitHub",
    )
    expect(formatAppShellSkillGitHubImportCompleteMessage(1)).toBe(
      "Imported 1 skill from GitHub.",
    )
    expect(formatAppShellSkillImportSummary(2, 1, 1)).toBe(
      "Imported 2 skills, 1 already imported, 1 failed",
    )
    expect(formatAppShellSkillFolderImportStatus(2)).toBe(
      "Imported 2 skills from folder",
    )
    expect(formatAppShellSkillGitHubImportStatus(1, ["Code Review"])).toBe(
      "Imported 1 skill from GitHub: Code Review",
    )
  })

  it("shares knowledge note management labels across app shells", () => {
    expect(APP_SHELL_KNOWLEDGE_NOTE_ACTION_LABELS.searchPlaceholder).toBe(
      "Search notes",
    )
    expect(APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.loadingLabel).toBe(
      "Loading note...",
    )
    expect(
      APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.context.helper,
    ).toContain("Context controls retrieval behavior.")
    expect(
      APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.summary.helper,
    ).toBe("Canonical files live at .agents/knowledge/<slug>/<slug>.md.")
    expect(getAppShellKnowledgeNoteActionLabel("deleteAllNotes")).toBe(
      "Delete All Notes",
    )
    expect(
      formatAppShellKnowledgeNoteBulkActionLabel("deleteSelected", 2),
    ).toBe("Delete Selected (2)")
    expect(formatAppShellKnowledgeNoteDeleteCountLabel(1)).toBe("Delete 1 Note")
    expect(formatAppShellKnowledgeNoteDeleteCountLabel(4)).toBe(
      "Delete 4 Notes",
    )
    expect(getAppShellKnowledgeNoteSelectionLabel(false)).toBe("Select")
    expect(
      getAppShellKnowledgeNoteSelectionAccessibilityLabel("Release Plan", true),
    ).toBe("Deselect note Release Plan")
    expect(
      getAppShellKnowledgeNoteDeleteAccessibilityLabel("Release Plan"),
    ).toBe("Delete note Release Plan")
    expect(getAppShellKnowledgeNoteDeleteSelectedAccessibilityLabel(2)).toBe(
      "Delete 2 selected knowledge notes",
    )
    expect(getAppShellKnowledgeNoteDeleteAllAccessibilityLabel()).toBe(
      "Delete all knowledge notes",
    )
    expect(APP_SHELL_KNOWLEDGE_NOTE_DELETE_PRESENTATION.allTitle).toBe(
      "Delete All Notes",
    )
    expect(getAppShellKnowledgeNoteDeleteConfirmTitle("single")).toBe(
      "Delete Note",
    )
    expect(getAppShellKnowledgeNoteDeleteConfirmTitle("selected")).toBe(
      "Delete Selected Notes",
    )
    expect(formatAppShellKnowledgeNoteDeleteConfirmMessage("single")).toBe(
      "Are you sure you want to delete this note? This action cannot be undone.",
    )
    expect(formatAppShellKnowledgeNoteDeleteConfirmMessage("selected", 2)).toBe(
      "Are you sure you want to delete 2 selected notes? This action cannot be undone.",
    )
    expect(formatAppShellKnowledgeNoteDeleteConfirmMessage("all", 4)).toBe(
      "Are you sure you want to delete ALL 4 notes? This action cannot be undone.",
    )
  })

  it("shares repeat task action labels across app shells", () => {
    expect(APP_SHELL_LOOP_ACTION_LABELS.runNow).toBe("Run now")
    expect(APP_SHELL_LOOP_EDITOR_PRESENTATION.loadingLabel).toBe(
      "Loading loop...",
    )
    expect(APP_SHELL_LOOP_EDITOR_PRESENTATION.scheduleModes.continuous).toBe(
      "Continuous",
    )
    expect(
      APP_SHELL_LOOP_EDITOR_PRESENTATION.switches.speakOnTrigger.helper,
    ).toContain("desktop TTS")
    expect(getAppShellLoopActionLabel("addTask")).toBe("Add Task")
    expect(getAppShellLoopStartAllActionLabel(false)).toBe("Start All")
    expect(getAppShellLoopStartAllActionLabel(true)).toBe("Starting All...")
    expect(getAppShellLoopStopAllActionLabel(false)).toBe("Stop All")
    expect(getAppShellLoopStopAllActionLabel(true)).toBe("Stopping All...")
    expect(getAppShellLoopStartActionLabel(false)).toBe("Start")
    expect(getAppShellLoopStartActionLabel(true)).toBe("Starting...")
    expect(getAppShellLoopStopActionLabel(false)).toBe("Stop")
    expect(getAppShellLoopStopActionLabel(true)).toBe("Stopping...")
    expect(getAppShellLoopExportActionLabel(false)).toBe("Export")
    expect(getAppShellLoopExportActionLabel(true)).toBe("Exporting...")
    expect(getAppShellLoopToggleAccessibilityLabel("Daily Summary", true)).toBe(
      "Disable Daily Summary",
    )
    expect(getAppShellLoopRunNowAccessibilityLabel("Daily Summary")).toBe(
      "Run Daily Summary loop now",
    )
    expect(getAppShellLoopStartAllAccessibilityLabel()).toBe(
      "Start all loop schedules",
    )
    expect(getAppShellLoopStopAllAccessibilityLabel()).toBe(
      "Stop all loop schedules",
    )
    expect(
      getAppShellLoopStartScheduleAccessibilityLabel("Daily Summary"),
    ).toBe("Start Daily Summary loop schedule")
    expect(getAppShellLoopStopScheduleAccessibilityLabel("Daily Summary")).toBe(
      "Stop Daily Summary loop schedule",
    )
    expect(
      getAppShellLoopExportMarkdownAccessibilityLabel("Daily Summary"),
    ).toBe("Export Daily Summary loop as Markdown")
    expect(getAppShellLoopDeleteAccessibilityLabel("Daily Summary")).toBe(
      "Delete Daily Summary loop",
    )
    expect(getAppShellLoopImportMarkdownAccessibilityLabel()).toBe(
      "Import loop Markdown",
    )
    expect(APP_SHELL_LOOP_DELETE_PRESENTATION.title).toBe("Delete Task")
    expect(getAppShellLoopDeleteConfirmMessage()).toBe(
      "Are you sure you want to delete this repeat task?",
    )
    expect(getAppShellLoopDeleteConfirmMessage("Daily Summary")).toBe(
      'Are you sure you want to delete "Daily Summary"?',
    )
    expect(APP_SHELL_LOOP_FEEDBACK_PRESENTATION.save.created).toBe(
      "Task created",
    )
    expect(APP_SHELL_LOOP_FEEDBACK_PRESENTATION.runtime.triggerFailed).toBe(
      "Failed to trigger task",
    )
    expect(formatAppShellLoopImportedStatus("Daily Summary")).toBe(
      'Imported task "Daily Summary"',
    )
    expect(formatAppShellLoopImportCompleteMessage("Daily Summary")).toBe(
      'Imported task "Daily Summary".',
    )
    expect(formatAppShellLoopExportedStatus("Daily Summary")).toBe(
      'Exported task "Daily Summary"',
    )
    expect(formatAppShellLoopStartedStatus("Daily Summary")).toBe(
      'Started task "Daily Summary"',
    )
    expect(formatAppShellLoopStoppedStatus("Daily Summary")).toBe(
      'Stopped task "Daily Summary"',
    )
    expect(formatAppShellLoopBulkStartedStatus(1)).toBe("Started 1 task")
    expect(formatAppShellLoopBulkStartedStatus(2)).toBe("Started 2 tasks")
    expect(formatAppShellLoopBulkStoppedStatus(2)).toBe("Stopped 2 tasks")
    expect(formatAppShellLoopRunningMessage("Daily Summary")).toBe(
      'Running "Daily Summary"...',
    )
    expect(formatAppShellLoopTriggerUnavailableMessage("Daily Summary")).toBe(
      'Could not trigger "Daily Summary" right now',
    )
    expect(APP_SHELL_LOOP_LIST_PRESENTATION.emptyTitle).toBe(
      "No repeat tasks configured.",
    )
    expect(getAppShellLoopStatusLabel({ isRunning: true })).toBe("Running")
    expect(getAppShellLoopStatusLabel({ enabled: false })).toBe("Disabled")
    expect(getAppShellLoopStatusLabel({ enabled: true })).toBeNull()
    expect(
      getAppShellLoopFeatureLabels({
        runOnStartup: true,
        speakOnTrigger: true,
        continueInSession: true,
      }),
    ).toEqual([
      "Runs on startup",
      "Speaks on trigger",
      "Continues in same session",
    ])
    expect(formatAppShellLoopNextRunLabel("May 11, 2026")).toBe(
      "Next run: May 11, 2026",
    )
    expect(formatAppShellLoopLastRunLabel("Never")).toBe("Last run: Never")
  })

  it("shares bundle and agent management labels across app shells", () => {
    expect(APP_SHELL_BUNDLE_ACTION_LABELS.export).toBe("Export")
    expect(APP_SHELL_BUNDLE_ACTION_LABELS.importBundle).toBe("Import Bundle")
    expect(getAppShellBundleActionLabel("exportForHub")).toBe("Export for Hub")
    expect(getAppShellBundleImportActionLabel(false)).toBe("Import Bundle")
    expect(getAppShellBundleImportActionLabel(true)).toBe("Importing...")
    expect(getAppShellBundleExportActionLabel(false)).toBe("Export Bundle")
    expect(getAppShellBundleExportActionLabel(true)).toBe("Exporting...")
    expect(getAppShellBundlePreviewActionLabel(false)).toBe("Preview")
    expect(getAppShellBundlePreviewActionLabel(true)).toBe("Previewing...")
    expect(getAppShellBundleImportJsonAccessibilityLabel()).toBe(
      "Import DotAgents bundle JSON",
    )
    expect(getAppShellBundleExportJsonAccessibilityLabel()).toBe(
      "Export DotAgents bundle JSON",
    )
    expect(getAppShellBundlePreviewJsonAccessibilityLabel()).toBe(
      "Preview DotAgents bundle JSON",
    )
    expect(APP_SHELL_BUNDLE_IMPORT_PRESENTATION.title).toBe("Import Bundle")
    expect(APP_SHELL_BUNDLE_IMPORT_PRESENTATION.exportTitle).toBe(
      "Export DotAgents Bundle",
    )
    expect(APP_SHELL_BUNDLE_IMPORT_PRESENTATION.fields.componentsToImport).toBe(
      "Components to import",
    )
    expect(getAppShellBundleComponentLabel("agentProfiles")).toBe("Agents")
    expect(getAppShellBundleComponentLabel("agentProfiles", "detailed")).toBe(
      "Agent Profiles",
    )
    expect(formatAppShellBundleItemCount(1)).toBe("1 item")
    expect(formatAppShellBundleItemCount(2)).toBe("2 items")
    expect(formatAppShellBundleConflictCount(1)).toBe("1 conflict")
    expect(formatAppShellBundleConflictCount(2)).toBe("2 conflicts")
    expect(formatAppShellBundleComponentSummary(2, 1)).toBe(
      "2 items, 1 conflict",
    )
    expect(formatAppShellBundleCreatedDateLabel("5/11/2026")).toBe(
      "Created: 5/11/2026",
    )
    expect(formatAppShellBundleExportedFromLabel("desktop")).toBe(
      "Exported from desktop",
    )
    expect(formatAppShellBundleExportStatus(2)).toBe(
      "Exported bundle with 2 items",
    )
    expect(formatAppShellBundlePreviewStatus(1)).toBe(
      "Previewed bundle with 1 item",
    )
    expect(formatAppShellBundleImportStatus(3)).toBe("Imported 3 bundle items")
    expect(formatAppShellBundleImportCompleteMessage(3)).toBe(
      "Imported 3 items from the bundle.",
    )
    expect(formatAppShellBundleImportSuccessToast(1)).toBe(
      "Successfully imported 1 item",
    )
    expect(APP_SHELL_AGENT_ACTION_LABELS.addAgent).toBe("Add Agent")
    expect(APP_SHELL_AGENT_EDITOR_PRESENTATION.description).toBe(
      "Configure agent identity, behavior, model, and capabilities.",
    )
    expect(APP_SHELL_AGENT_EDITOR_PRESENTATION.avatar.label).toBe("Avatar")
    expect(APP_SHELL_AGENT_EDITOR_PRESENTATION.avatar.uploadActionLabel).toBe(
      "Upload photo",
    )
    expect(APP_SHELL_AGENT_EDITOR_PRESENTATION.avatar.unavailableTitle).toBe(
      "Photo unavailable",
    )
    expect(
      APP_SHELL_AGENT_EDITOR_PRESENTATION.validation.displayNameRequired,
    ).toBe("Display name is required")
    expect(
      APP_SHELL_AGENT_EDITOR_PRESENTATION.errors.loadMcpServersFailed,
    ).toBe("Failed to load MCP servers")
    expect(
      APP_SHELL_AGENT_EDITOR_PRESENTATION.fields.displayName.placeholder,
    ).toBe("My Agent")
    expect(APP_SHELL_AGENT_EDITOR_PRESENTATION.fields.command.placeholder).toBe(
      "e.g., claude-code-acp",
    )
    expect(
      APP_SHELL_AGENT_EDITOR_PRESENTATION.externalSetup.verifyActionLabel,
    ).toBe("Verify Setup")
    expect(getAppShellAgentActionLabel("delete")).toBe("Delete")
    expect(getAppShellAgentRescanActionLabel(false)).toBe("Rescan Files")
    expect(getAppShellAgentRescanActionLabel(true)).toBe("Rescanning...")
    expect(getAppShellAgentDeleteAccessibilityLabel("Researcher")).toBe(
      "Delete agent Researcher",
    )
    expect(APP_SHELL_AGENT_DELETE_PRESENTATION.cannotDeleteTitle).toBe(
      "Cannot Delete",
    )
    expect(getAppShellAgentDeleteConfirmMessage()).toBe(
      "Are you sure you want to delete this agent?",
    )
    expect(getAppShellAgentDeleteConfirmMessage("Researcher")).toBe(
      'Are you sure you want to delete "Researcher"?',
    )
    expect(getAppShellAgentRescanAccessibilityLabel()).toBe(
      "Rescan agent files",
    )
    expect(APP_SHELL_AGENT_PROFILE_FEEDBACK_PRESENTATION.exportTitle).toBe(
      "Export Profile",
    )
    expect(formatAppShellAgentProfileImportSuccessMessage("main")).toBe(
      'Profile "main" imported successfully',
    )
    expect(APP_SHELL_AGENT_LIST_PRESENTATION.emptyTitle).toBe("No agents yet.")
    expect(
      getAppShellAgentListDescription({
        guidelines: "Use TypeScript and keep responses concise.",
      }),
    ).toBe("Use TypeScript and keep responses concise.")
    expect(getAppShellAgentListDisplayName({ name: "researcher" })).toBe(
      "researcher",
    )
    expect(getAppShellAgentListInitial({ displayName: "Researcher" })).toBe("R")
    expect(
      getAppShellAgentListConnectionType({ connection: { type: "acpx" } }),
    ).toBe("acpx")
    expect(
      getAppShellAgentListMetadata({
        connectionType: "internal",
        role: "chat-agent",
      }),
    ).toBe("internal • chat-agent")
    expect(
      getAppShellAgentListBadges({
        isBuiltIn: true,
        isDefault: true,
        enabled: false,
      }),
    ).toEqual(["Built-in", "Default", "Disabled"])
    expect(
      getAppShellAgentListBadges({
        systemPrompt: "Custom instructions",
      }),
    ).toEqual(["Custom prompt"])
  })

  it("shares MCP server management labels across app shells", () => {
    expect(APP_SHELL_MCP_SERVER_ACTION_LABELS.addServer).toBe("Add Server")
    expect(APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION.description).toBe(
      "Add or configure an MCP server.",
    )
    expect(
      APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION.fields.transport.helper,
    ).toBe("Choose how to connect to the MCP server.")
    expect(
      APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION.transports.streamableHttp,
    ).toBe("Streamable HTTP")
    expect(getAppShellMcpServerActionLabel("deleteServer")).toBe(
      "Delete server",
    )
    expect(getAppShellMcpServerEditorTitle("create")).toBe("Add Server")
    expect(getAppShellMcpServerEditorTitle("edit")).toBe("Edit Server")
    expect(getAppShellMcpServerEditorTitle("replace")).toBe(
      "Replace MCP Server",
    )
    expect(getAppShellMcpServerEditorSaveActionLabel("create", false)).toBe(
      "Add Server",
    )
    expect(getAppShellMcpServerEditorSaveActionLabel("edit", false)).toBe(
      "Update Server",
    )
    expect(getAppShellMcpServerEditorSaveActionLabel("replace", false)).toBe(
      "Replace Server",
    )
    expect(getAppShellMcpServerEditorSaveActionLabel("replace", true)).toBe(
      "Saving...",
    )
    expect(getAppShellMcpServerImportActionLabel(false)).toBe("Import JSON")
    expect(getAppShellMcpServerImportActionLabel(true)).toBe("Importing...")
    expect(getAppShellMcpServerExportActionLabel(false)).toBe("Export JSON")
    expect(getAppShellMcpServerExportActionLabel(true)).toBe("Exporting...")
    expect(getAppShellMcpServerStartOAuthActionLabel(false)).toBe("Start OAuth")
    expect(getAppShellMcpServerStartOAuthActionLabel(true)).toBe("Starting...")
    expect(getAppShellMcpServerRevokeOAuthActionLabel(false)).toBe(
      "Revoke OAuth",
    )
    expect(getAppShellMcpServerRevokeOAuthActionLabel(true)).toBe("Revoking...")
    expect(
      getAppShellMcpServerItemActionAccessibilityLabel("actions", "github"),
    ).toBe("Actions for github server")
    expect(
      getAppShellMcpServerItemActionAccessibilityLabel("replace", "github"),
    ).toBe("Replace MCP server github config")
    expect(
      getAppShellMcpServerItemActionAccessibilityLabel("delete", "github"),
    ).toBe("Delete MCP server github")
    expect(APP_SHELL_MCP_SERVER_DELETE_PRESENTATION.title).toBe(
      "Delete MCP Server",
    )
    expect(getAppShellMcpServerDeleteConfirmMessage("github")).toBe(
      'Delete "github" from the connected desktop MCP config?',
    )
    expect(
      getAppShellMcpServerItemActionAccessibilityLabel(
        "toggleDetails",
        "github",
      ),
    ).toBe("Toggle github server details")
    expect(getAppShellMcpServerImportJsonAccessibilityLabel()).toBe(
      "Import MCP server JSON",
    )
    expect(getAppShellMcpServerExportJsonAccessibilityLabel()).toBe(
      "Export MCP server JSON",
    )
    expect(getAppShellMcpServerCreateAccessibilityLabel()).toBe(
      "Create MCP server",
    )
    expect(getAppShellMcpServerSaveAccessibilityLabel()).toBe("Save MCP server")
    expect(getAppShellMcpServerImportServersAccessibilityLabel()).toBe(
      "Import MCP servers",
    )
    expect(
      APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.importExport.exportWarning,
    ).toContain("MCP config exports can include tokens")
    expect(
      APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION.runtime.enableServerMissing,
    ).toBe("Failed to enable server: Server not found")
    expect(formatAppShellMcpServerCount(1)).toBe("1 MCP server")
    expect(formatAppShellMcpServerCount(2)).toBe("2 MCP servers")
    expect(formatAppShellMcpServerImportStatus(2)).toBe(
      "Imported 2 MCP servers",
    )
    expect(formatAppShellMcpServerImportCompleteMessage(1, ["runtime"])).toBe(
      "Imported 1 MCP server. Skipped reserved names: runtime.",
    )
    expect(formatAppShellMcpServerExportStatus(3)).toBe(
      "Exported 3 MCP servers",
    )
    expect(formatAppShellMcpServerSkippedReservedName("runtime")).toBe(
      "Skipped importing reserved server name: runtime",
    )
    expect(formatAppShellMcpServerConnectedStatus("github")).toBe(
      "Server github connected successfully",
    )
    expect(formatAppShellMcpServerStartedStatus("github")).toBe(
      "Server github started successfully",
    )
    expect(formatAppShellMcpServerStoppedStatus("github")).toBe(
      "Server github stopped successfully",
    )
    expect(formatAppShellMcpServerRestartedStatus("github")).toBe(
      "Server github restarted successfully",
    )
    expect(formatAppShellMcpServerExampleAddedStatus("github", true)).toBe(
      "Added github OAuth server configuration",
    )
    expect(formatAppShellMcpServerSetupRequiredMessage("Add a token")).toBe(
      "Setup required: Add a token",
    )
    expect(formatAppShellMcpServerLogsClearedStatus("github")).toBe(
      "Logs cleared for github",
    )
    expect(formatAppShellMcpServerConnectFailedMessage("boom")).toBe(
      "Failed to connect server: boom",
    )
    expect(formatAppShellMcpServerRestartFailedMessage("boom")).toBe(
      "Failed to restart server: boom",
    )
    expect(formatAppShellMcpServerStopFailedMessage("boom")).toBe(
      "Failed to stop server: boom",
    )
    expect(formatAppShellMcpServerStartFailedMessage("boom")).toBe(
      "Failed to start server: boom",
    )
    expect(formatAppShellMcpServerClearLogsFailedMessage("boom")).toBe(
      "Failed to clear logs: boom",
    )
    expect(formatAppShellMcpServerConnectionTestFailedMessage("boom")).toBe(
      "Connection test failed: boom",
    )
    expect(formatAppShellMcpServerImportConfigFailedMessage("boom")).toBe(
      "Failed to import config: boom",
    )
    expect(formatAppShellMcpServerExportConfigFailedMessage("boom")).toBe(
      "Failed to export config: boom",
    )
    expect(formatAppShellMcpServerInvalidJsonMessage("boom")).toBe(
      "Invalid JSON: boom",
    )
    expect(
      formatAppShellMcpServerRevokeAuthenticationFailedMessage("boom"),
    ).toBe("Failed to revoke authentication: boom")
    expect(formatAppShellMcpServerStartOAuthFailedMessage("boom")).toBe(
      "Failed to start OAuth flow: boom",
    )
    expect(formatAppShellMcpToolToggleStatus("search", true)).toBe(
      "Tool search enabled",
    )
    expect(formatAppShellMcpToolToggleFailedMessage("search", false)).toBe(
      "Failed to disable tool search",
    )
    expect(formatAppShellMcpToolToggleErrorMessage("boom")).toBe(
      "Error toggling tool: boom",
    )
    expect(formatAppShellMcpSourceToolsToggleStatus(2, "github", true)).toBe(
      "All 2 tools for github enabled",
    )
    expect(
      formatAppShellMcpSourceToolsPartialToggleStatus(1, 2, "github", false, 1),
    ).toBe("1/2 tools disabled for github (1 failed)")
    expect(
      formatAppShellMcpSourceToolsToggleErrorMessage("github", "boom"),
    ).toBe("Error toggling tools for github: boom")
    expect(formatAppShellMcpToolsToggleStatus(2, false)).toBe(
      "All 2 tools disabled",
    )
    expect(formatAppShellMcpToolsPartialToggleStatus(1, 2, true, 1)).toBe(
      "1/2 tools enabled (1 failed)",
    )
    expect(formatAppShellMcpToolsToggleErrorMessage("boom")).toBe(
      "Error toggling tools: boom",
    )
  })

  it("shares model preset editor labels across app shells", () => {
    expect(APP_SHELL_MODEL_PRESET_PRESENTATION.manager.title).toBe(
      "OpenAI-Compatible Preset",
    )
    expect(APP_SHELL_MODEL_PRESET_PRESENTATION.fields.name.label).toBe(
      "Preset Name",
    )
    expect(APP_SHELL_MODEL_PRESET_PRESENTATION.fields.baseUrl.label).toBe(
      "API Base URL",
    )
    expect(getAppShellModelPresetEditorTitle("create")).toBe(
      "Create New Preset",
    )
    expect(getAppShellModelPresetEditorTitle("edit", true)).toBe(
      "Configure Preset",
    )
    expect(getAppShellModelPresetEditorDescription(false)).toBe(
      "Update the preset settings and model preferences.",
    )
    expect(getAppShellModelPresetDeleteConfirmMessage("OpenRouter")).toBe(
      'Are you sure you want to delete "OpenRouter"?',
    )
    expect(formatAppShellModelPresetCount(2)).toBe("2 presets available")
  })

  it("shares provider setup labels across app shells", () => {
    expect(APP_SHELL_PROVIDER_SETUP_PRESENTATION.pageTitle).toBe(
      "Provider Setup",
    )
    expect(APP_SHELL_PROVIDER_SETUP_PRESENTATION.baseUrlLabel).toBe(
      "API Base URL",
    )
    expect(
      APP_SHELL_PROVIDER_SETUP_PRESENTATION.configuredSecretPlaceholder,
    ).toBe("Configured")
    expect(getAppShellProviderModelSelectionMovedDescription("Groq")).toBe(
      "Groq model selection now lives on the Models page.",
    )
    expect(getAppShellChatGptWebConnectionLabel(false)).toBe("Not connected")
    expect(getAppShellChatGptWebConnectionLabel(true, "aj@example.com")).toBe(
      "Connected as aj@example.com",
    )
    expect(
      APP_SHELL_PROVIDER_SETUP_PRESENTATION.chatGptWeb.copyCallbackActionLabel,
    ).toBe("Copy Callback URL")
  })

  it("exposes shared mobile route titles and settings section ids", () => {
    expect(APP_SHELL_MOBILE_ROUTE_TITLES.Sessions).toBe("Chats")
    expect(APP_SHELL_MOBILE_ROUTE_TITLES.Settings).toBe("DotAgents")
    expect(
      APP_SHELL_MOBILE_SETTINGS_SECTIONS.map((section) => section.id),
    ).toEqual(APP_SHELL_MOBILE_SETTINGS_SECTION_IDS)
    expect(APP_SHELL_MOBILE_SETTINGS_SECTION_IDS).toContain("agents")
    expect(APP_SHELL_MOBILE_SETTINGS_SECTION_IDS).toContain("knowledgeNotes")
    expect(isAppShellMobileSettingsSectionId("agents")).toBe(true)
    expect(isAppShellMobileSettingsSectionId("unknown")).toBe(false)
  })

  it("shares mobile settings section titles and default expanded state", () => {
    const initialExpandedState = getAppShellMobileSettingsInitialExpandedState()

    expect(getAppShellMobileSettingsSectionTitle("profileModel")).toBe(
      "Profile & Model",
    )
    expect(getAppShellMobileSettingsSectionTitle("mcpServers")).toBe(
      "MCP Servers",
    )
    expect(initialExpandedState.profileModel).toBe(true)
    expect(initialExpandedState.mcpServers).toBe(true)
    expect(initialExpandedState.providerSelection).toBe(false)
    expect(initialExpandedState.agentLoops).toBe(false)
  })

  it("links desktop settings nav items to mobile settings sections where possible", () => {
    const itemById = new Map(
      getDesktopSettingsNavItems({
        whatsappEnabled: true,
        discordEnabled: true,
      }).map((item) => [item.id, item]),
    )

    expect(itemById.get("agents")?.mobileSectionId).toBe("agents")
    expect(itemById.get("knowledge")?.mobileSectionId).toBe("knowledgeNotes")
    expect(itemById.get("capabilities")?.mobileSectionId).toBe("mcpServers")
    expect(itemById.get("repeatTasks")?.mobileSectionId).toBe("agentLoops")
    expect(
      getAppShellMobileSettingsSectionIdsForDesktopNavItem("providers"),
    ).toEqual([
      "providerSelection",
      "providerSetup",
      "speechToText",
      "textToSpeech",
    ])
    expect(
      getAppShellMobileSettingsSectionIdsForDesktopNavItem("capabilities"),
    ).toEqual(["agentSettings", "toolExecution", "mcpServers", "skills"])
    expect(
      getAppShellDesktopSettingsNavItemIdForMobileSection("agentLoops"),
    ).toBe("repeatTasks")
    expect(
      getAppShellDesktopSettingsNavItemIdForMobileSection("providerSetup"),
    ).toBe("providers")
  })

  it("resolves desktop primary nav state from paths", () => {
    expect(getDesktopPrimaryNavItemId("/")).toBe("sessions")
    expect(getDesktopPrimaryNavItemId("/history")).toBe("sessions")
    expect(getDesktopPrimaryNavItemId("/settings/agents")).toBe("agents")
    expect(getDesktopPrimaryNavItemId("/knowledge")).toBe("knowledge")
    expect(getDesktopPrimaryNavItemId("/settings/models")).toBe("settings")
  })

  it("resolves desktop settings nav state from canonical and legacy paths", () => {
    expect(getDesktopSettingsActiveNavItemId("/settings")).toBe("general")
    expect(getDesktopSettingsActiveNavItemId("/settings/general")).toBe(
      "general",
    )
    expect(getDesktopSettingsActiveNavItemId("/settings/mcp-tools")).toBe(
      "capabilities",
    )
    expect(getDesktopSettingsActiveNavItemId("/settings/loops")).toBe(
      "repeatTasks",
    )
    expect(getDesktopSettingsActiveNavItemId("/knowledge")).toBe("knowledge")
  })

  it("filters feature-gated desktop settings items", () => {
    expect(
      getDesktopSettingsNavItems({
        whatsappEnabled: false,
        discordEnabled: true,
      }).map((item) => item.id),
    ).toContain("discord")
    expect(
      getDesktopSettingsNavItems({
        whatsappEnabled: false,
        discordEnabled: true,
      }).map((item) => item.id),
    ).not.toContain("whatsapp")
  })

  it("resolves mobile route names into the same primary nav ids", () => {
    expect(getMobilePrimaryNavItemId("Sessions")).toBe("sessions")
    expect(getMobilePrimaryNavItemId("Chat")).toBe("sessions")
    expect(getMobilePrimaryNavItemId("AgentEdit")).toBe("agents")
    expect(getMobilePrimaryNavItemId("KnowledgeNoteEdit")).toBe("knowledge")
    expect(getMobilePrimaryNavItemId("Settings")).toBe("settings")
  })
})
