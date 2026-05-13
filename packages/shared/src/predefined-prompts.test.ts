import { describe, expect, it } from "vitest"

import {
  PROMPT_LIBRARY_PRESENTATION,
  PROMPT_LIBRARY_SURFACE_PRESENTATION,
  buildPromptLibraryCommandItems,
  buildPromptLibraryShortcutItems,
  createPredefinedPromptId,
  createPredefinedPromptRecord,
  deletePredefinedPromptFromList,
  filterPromptLibraryCommandItems,
  filterPromptLibraryItemsByQuery,
  formatPromptLibraryDeletePromptConfirmMessage,
  formatPromptLibraryDeletePromptWebConfirmMessage,
  formatPromptLibraryTaskRunningToast,
  formatPromptLibraryTaskStartedMessage,
  formatPromptLibraryTaskUnavailableMessage,
  getPromptLibraryCopyState,
  getPromptLibraryDeletePromptAccessibilityLabel,
  getPromptLibraryDesktopSurfaceState,
  getPromptLibraryEditPromptAccessibilityLabel,
  getPromptLibraryEditorModalKeyboardAvoidingBehavior,
  getPromptLibraryEditorMobileChromeState,
  getPromptLibraryEditorMobileCloseIconState,
  getPromptLibraryEditorMobileCopyState,
  getPromptLibraryEditorMobileRenderState,
  getPromptLibraryEditorMobileSurfaceState,
  getPromptLibraryEditorSaveActionLabel,
  getPromptLibraryEditorTitle,
  getPromptLibraryEmptyPromptLabel,
  getPromptLibraryEmptySkillLabel,
  getPromptLibraryEmptyTaskLabel,
  getPromptLibraryMobileAddShortcutIconState,
  getPromptLibraryMobileCopyState,
  getPromptLibraryMobileEmptyLibraryLabel,
  getPromptLibraryMobileIconColors,
  getPromptLibraryMobileLauncherShortcutSourceIconColors,
  getPromptLibraryMobileLauncherShortcutSourceIconStates,
  getPromptLibraryMobileShortcutChromeState,
  getPromptLibraryMobileShortcutActionIconState,
  getPromptLibraryMobileShortcutCopyState,
  getPromptLibraryMobileShortcutItemRenderState,
  getPromptLibraryMobileShortcutPromptActionsRenderState,
  getPromptLibraryMobileShortcutRenderState,
  getPromptLibraryMobileShortcutSurfaceState,
  getPromptLibraryMobileShortcutSourceIconState,
  getPromptLibraryMobileSurfaceColors,
  getPromptLibraryMobileSurfaceState,
  getPromptLibraryPromptContent,
  getPromptLibraryPromptDescription,
  getPromptLibrarySaveSuccessMessage,
  getPromptLibrarySkillContent,
  getPromptLibrarySkillDescription,
  getPromptLibraryShortcutAccessibilityHint,
  getPromptLibraryShortcutAccessibilityLabel,
  getPromptLibraryShortcutInteractionState,
  getPromptLibraryShortcutPressIntent,
  getPromptLibraryShortcutSourceLabel,
  getPromptLibraryTaskContent,
  getPromptLibraryTaskDescription,
  isPromptLibraryEditorSaveDisabled,
  isSlashCommandPrompt,
  isSlashCommandPromptName,
  resolveSlashCommandInputState,
  PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION,
  PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION,
  sortPredefinedPromptsByUpdatedAt,
  updatePredefinedPromptList,
  updatePredefinedPromptRecord,
} from "./predefined-prompts"

describe("predefined prompt helpers", () => {
  it("shares prompt-library presentation across desktop and mobile shells", () => {
    expect(PROMPT_LIBRARY_PRESENTATION.triggerAccessibilityLabel).toBe("Open predefined prompts")
    expect(PROMPT_LIBRARY_PRESENTATION.search.placeholder).toBe("Search prompts, skills, tasks...")
    expect(PROMPT_LIBRARY_PRESENTATION.editor.namePlaceholder).toBe("e.g., Code Review Request")
    expect(PROMPT_LIBRARY_PRESENTATION.editor.closeAccessibilityLabel).toBe("Close prompt editor")
    expect(PROMPT_LIBRARY_PRESENTATION.mobile.loadingLibraryLabel).toBe("Loading desktop library...")
    expect(getPromptLibraryCopyState()).toBe(PROMPT_LIBRARY_PRESENTATION)
    expect(getPromptLibraryMobileCopyState()).toBe(PROMPT_LIBRARY_PRESENTATION.mobile)
    expect(getPromptLibraryMobileEmptyLibraryLabel()).toBe(PROMPT_LIBRARY_PRESENTATION.empty.mobileLibrary)
    expect(getPromptLibraryMobileShortcutCopyState()).toEqual({
      loadingLabel: PROMPT_LIBRARY_PRESENTATION.mobile.loadingLibraryLabel,
      emptyLabel: PROMPT_LIBRARY_PRESENTATION.empty.mobileLibrary,
      editLabel: PROMPT_LIBRARY_PRESENTATION.actions.edit,
      deleteLabel: PROMPT_LIBRARY_PRESENTATION.actions.delete,
    })
    expect(getPromptLibraryEditorTitle(false)).toBe("Add New Prompt")
    expect(getPromptLibraryEditorTitle(true)).toBe("Edit Prompt")
    expect(getPromptLibraryEditorSaveActionLabel(false)).toBe("Add Prompt")
    expect(getPromptLibraryEditorSaveActionLabel(true)).toBe("Save Changes")
    expect(getPromptLibraryEditorSaveActionLabel(true, true)).toBe("Saving...")
    expect(isPromptLibraryEditorSaveDisabled({ name: "", content: "Ship it" })).toBe(true)
    expect(isPromptLibraryEditorSaveDisabled({ name: "Review", content: "   " })).toBe(true)
    expect(isPromptLibraryEditorSaveDisabled({ name: "Review", content: "Ship it" })).toBe(false)
    expect(isPromptLibraryEditorSaveDisabled({ name: "Review", content: "Ship it" }, true)).toBe(true)
    expect(getPromptLibrarySaveSuccessMessage(false)).toBe("Prompt saved to your desktop prompt library.")
    expect(getPromptLibrarySaveSuccessMessage(true)).toBe("Prompt updated in your desktop prompt library.")
    expect(getPromptLibraryEmptyPromptLabel(false)).toBe("No saved prompts yet")
    expect(getPromptLibraryEmptyPromptLabel(true)).toBe("No matching prompts")
    expect(getPromptLibraryEmptySkillLabel(false)).toBe("No skills available")
    expect(getPromptLibraryEmptySkillLabel(true)).toBe("No matching skills")
    expect(getPromptLibraryEmptyTaskLabel(false)).toBe("No tasks available")
    expect(getPromptLibraryEmptyTaskLabel(true)).toBe("No matching tasks")
    expect(getPromptLibraryEditPromptAccessibilityLabel("Review")).toBe("Edit predefined prompt Review")
    expect(getPromptLibraryDeletePromptAccessibilityLabel("Review")).toBe("Delete predefined prompt Review")
    expect(getPromptLibraryShortcutAccessibilityLabel("action", "+ Add Prompt", "add-prompt")).toBe("Add new prompt")
    expect(getPromptLibraryShortcutAccessibilityLabel("task", "Daily")).toBe("Run task Daily")
    expect(getPromptLibraryShortcutAccessibilityLabel("saved-prompt", "Review")).toBe("Insert prompt Review")
    expect(getPromptLibraryShortcutSourceLabel("command")).toBe("command")
    expect(getPromptLibraryShortcutSourceLabel("skill")).toBe("skill")
    expect(getPromptLibraryShortcutSourceLabel("task")).toBe("task")
    expect(getPromptLibraryShortcutAccessibilityHint("action", "add-prompt")).toBe(
      "Create a predefined prompt and save it to desktop.",
    )
    expect(getPromptLibraryShortcutAccessibilityHint("task")).toBe("Runs this desktop task now.")
    expect(getPromptLibraryShortcutInteractionState({ source: "action", action: "add-prompt" })).toEqual({
      isAddPrompt: true,
      isRunning: false,
      isDisabled: false,
      accessibilityState: undefined,
    })
    expect(getPromptLibraryShortcutInteractionState({ source: "task", task: { id: "daily" } }, "daily")).toEqual({
      isAddPrompt: false,
      isRunning: true,
      isDisabled: true,
      accessibilityState: { disabled: true },
    })
    expect(getPromptLibraryShortcutInteractionState({ source: "task", task: { id: "daily" } }, "weekly")).toEqual({
      isAddPrompt: false,
      isRunning: false,
      isDisabled: false,
      accessibilityState: undefined,
    })
    expect(formatPromptLibraryDeletePromptWebConfirmMessage("Review")).toBe('Delete prompt "Review"?')
    expect(formatPromptLibraryDeletePromptConfirmMessage("Review")).toBe(
      'Delete "Review" from your desktop prompt library?',
    )
    expect(formatPromptLibraryTaskUnavailableMessage("Daily")).toBe('Could not trigger "Daily" right now')
    expect(formatPromptLibraryTaskRunningToast("Daily")).toBe('Running "Daily"...')
    expect(formatPromptLibraryTaskStartedMessage("Daily")).toBe('Running "Daily" on desktop.')
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.desktop.menuContentClassName).toContain("w-[min(26rem")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.desktop.triggerButtonClassNameBySize["sm-icon"]).toBe("h-6 w-6")
    expect(getPromptLibraryDesktopSurfaceState()).toBe(PROMPT_LIBRARY_SURFACE_PRESENTATION.desktop)
    expect(getPromptLibraryMobileSurfaceState()).toBe(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.quickStartCard.borderRadius).toBe("lg")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.quickStartCard.backgroundColorToken).toBe("card")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutGrid.flexDirection).toBe("row")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutGrid.flexWrap).toBe("wrap")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard.minHeight).toBe(84)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard.flexGrow).toBe(1)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard.borderColorToken).toBe("border")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard.backgroundColorToken).toBe("background")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard.justifyContent).toBe("center")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard.accessibilityRole).toBe("button")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutCard.alignItems).toBe("center")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutCard.titleColorToken).toBe("primary")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutCard.titleTextAlign).toBe("center")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutIcon.name).toBe("add-circle-outline")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutIcon.marginBottom).toBe(2)
    expect(getPromptLibraryMobileAddShortcutIconState()).toEqual({
      name: "add-circle-outline",
      size: 18,
      colorToken: "primary",
    })
    expect(getPromptLibraryMobileIconColors(getPromptLibraryMobileAddShortcutIconState(), {
      destructive: "#dc2626",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    })).toEqual({
      color: "#2563eb",
    })
    expect(getPromptLibraryMobileSurfaceColors({
      background: "#f8fafc",
      border: "#cbd5e1",
      card: "#ffffff",
      destructive: "#dc2626",
      foreground: "#0f172a",
      muted: "#e2e8f0",
      mutedForeground: "#64748b",
      primary: "#2563eb",
      primaryForeground: "#ffffff",
    })).toEqual({
      quickStartCard: {
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
      },
      emptyText: {
        color: "#64748b",
      },
      shortcutCard: {
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
      },
      addShortcutCard: {
        borderColor: "#2563eb",
        backgroundColor: "transparent",
        titleColor: "#2563eb",
      },
      shortcutSourcePill: {
        backgroundColor: "rgba(226, 232, 240, 0.45)",
      },
      shortcutSourceLabel: {
        color: "#64748b",
      },
      shortcutTitle: {
        color: "#0f172a",
      },
      shortcutDescription: {
        color: "#64748b",
      },
      shortcutActionButton: {
        borderColor: "#cbd5e1",
        backgroundColor: "#ffffff",
      },
      shortcutActionText: {
        color: "#2563eb",
        destructiveColor: "#dc2626",
      },
      editorModal: {
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        content: {
          backgroundColor: "#f8fafc",
          borderColor: "#cbd5e1",
        },
        title: {
          color: "#0f172a",
        },
        label: {
          color: "#0f172a",
        },
        input: {
          color: "#0f172a",
          placeholderColor: "#64748b",
        },
        cancelButtonText: {
          color: "#64748b",
        },
        saveButton: {
          backgroundColor: "#2563eb",
        },
        saveButtonText: {
          color: "#ffffff",
        },
      },
    })
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourcePill.alignSelf).toBe("flex-start")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourcePill.flexDirection).toBe("row")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourcePill.alignItems).toBe("center")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourcePill.backgroundColorToken).toBe("muted")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.skillName).toBe("sparkles-outline")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.taskName).toBe("time-outline")
    expect(getPromptLibraryMobileShortcutSourceIconState("command")).toEqual({
      source: "command",
      name: "terminal-outline",
      size: 10,
      colorToken: "mutedForeground",
    })
    expect(getPromptLibraryMobileShortcutSourceIconState("saved-prompt")).toEqual({
      source: "saved-prompt",
      name: "bookmark-outline",
      size: 10,
      colorToken: "mutedForeground",
    })
    expect(getPromptLibraryMobileShortcutSourceIconState("skill")).toEqual({
      source: "skill",
      name: "sparkles-outline",
      size: 10,
      colorToken: "mutedForeground",
    })
    expect(getPromptLibraryMobileShortcutSourceIconState("task")).toEqual({
      source: "task",
      name: "time-outline",
      size: 10,
      colorToken: "mutedForeground",
    })
    expect(getPromptLibraryMobileLauncherShortcutSourceIconStates()).toEqual({
      action: {
        source: "action",
        name: "add",
        size: 10,
        colorToken: "primary",
      },
      command: {
        source: "command",
        name: "terminal-outline",
        size: 10,
        colorToken: "mutedForeground",
      },
      "saved-prompt": {
        source: "saved-prompt",
        name: "bookmark-outline",
        size: 10,
        colorToken: "mutedForeground",
      },
      skill: {
        source: "skill",
        name: "sparkles-outline",
        size: 10,
        colorToken: "mutedForeground",
      },
      task: {
        source: "task",
        name: "time-outline",
        size: 10,
        colorToken: "mutedForeground",
      },
    })
    expect(getPromptLibraryMobileIconColors(getPromptLibraryMobileShortcutSourceIconState("command"), {
      destructive: "#dc2626",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    })).toEqual({
      color: "#64748b",
    })
    expect(getPromptLibraryMobileLauncherShortcutSourceIconColors({
      destructive: "#dc2626",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    })).toEqual({
      action: { color: "#2563eb" },
      command: { color: "#64748b" },
      "saved-prompt": { color: "#64748b" },
      skill: { color: "#64748b" },
      task: { color: "#64748b" },
    })
    expect(getPromptLibraryMobileShortcutChromeState({
      destructive: "#dc2626",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    })).toEqual({
      addIcon: {
        name: "add-circle-outline",
        size: 18,
        colorToken: "primary",
      },
      addIconColors: { color: "#2563eb" },
      editIcon: {
        action: "edit",
        name: "create-outline",
        size: 13,
        colorToken: "primary",
      },
      editIconColors: { color: "#2563eb" },
      deleteIcon: {
        action: "delete",
        name: "trash-outline",
        size: 13,
        colorToken: "destructive",
      },
      deleteIconColors: { color: "#dc2626" },
      sourceIcons: getPromptLibraryMobileLauncherShortcutSourceIconStates(),
      sourceIconColors: getPromptLibraryMobileLauncherShortcutSourceIconColors({
        destructive: "#dc2626",
        mutedForeground: "#64748b",
        primary: "#2563eb",
      }),
    })
    expect(getPromptLibraryMobileShortcutRenderState({
      destructive: "#dc2626",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    })).toEqual({
      surface: getPromptLibraryMobileShortcutSurfaceState(),
      chrome: getPromptLibraryMobileShortcutChromeState({
        destructive: "#dc2626",
        mutedForeground: "#64748b",
        primary: "#2563eb",
      }),
      copy: getPromptLibraryMobileShortcutCopyState(),
    })
    const shortcutRenderState = getPromptLibraryMobileShortcutRenderState({
      destructive: "#dc2626",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    })
    expect(getPromptLibraryMobileShortcutPromptActionsRenderState("Review", shortcutRenderState)).toEqual({
      edit: {
        icon: shortcutRenderState.chrome.editIcon,
        iconColors: shortcutRenderState.chrome.editIconColors,
        label: PROMPT_LIBRARY_PRESENTATION.actions.edit,
        accessibilityLabel: "Edit predefined prompt Review",
      },
      delete: {
        icon: shortcutRenderState.chrome.deleteIcon,
        iconColors: shortcutRenderState.chrome.deleteIconColors,
        label: PROMPT_LIBRARY_PRESENTATION.actions.delete,
        accessibilityLabel: "Delete predefined prompt Review",
      },
    })
    expect(getPromptLibraryMobileShortcutItemRenderState({
      id: "task-daily",
      title: "Daily",
      content: "",
      source: "task",
      task: { id: "daily", name: "Daily" },
    }, shortcutRenderState, "daily")).toEqual({
      interaction: {
        isAddPrompt: false,
        isRunning: true,
        isDisabled: true,
        accessibilityState: { disabled: true },
      },
      sourceIcon: shortcutRenderState.chrome.sourceIcons.task,
      sourceIconColors: shortcutRenderState.chrome.sourceIconColors.task,
      sourceLabel: "task",
      accessibilityLabel: "Run task Daily",
      accessibilityHint: "Runs this desktop task now.",
    })
    expect(getPromptLibraryMobileShortcutItemRenderState({
      id: "prompt-1",
      title: "Review",
      content: "Review this diff.",
      source: "saved-prompt",
      prompt: {
        id: "prompt-1",
        name: "Review",
        content: "Review this diff.",
        createdAt: 1,
        updatedAt: 1,
      },
    }, shortcutRenderState)).toEqual({
      interaction: {
        isAddPrompt: false,
        isRunning: false,
        isDisabled: false,
        accessibilityState: undefined,
      },
      sourceIcon: shortcutRenderState.chrome.sourceIcons["saved-prompt"],
      sourceIconColors: shortcutRenderState.chrome.sourceIconColors["saved-prompt"],
      sourceLabel: "prompt",
      accessibilityLabel: "Insert prompt Review",
      accessibilityHint: "Inserts this desktop library item into the composer.",
      promptActions: getPromptLibraryMobileShortcutPromptActionsRenderState("Review", shortcutRenderState),
    })
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceLabel.textTransform).toBe("uppercase")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceLabel.numberOfLines).toBe(1)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutTitle.numberOfLines).toBe(2)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutDescription.colorToken).toBe("mutedForeground")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActions.flexDirection).toBe("row")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActions.flexWrap).toBe("wrap")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionButton.justifyContent).toBe("center")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionButton.flexDirection).toBe("row")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionButton.alignItems).toBe("center")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionButton.accessibilityRole).toBe("button")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionButton.pressedOpacity).toBe(0.78)
    expect(getPromptLibraryMobileShortcutSurfaceState()).toEqual({
      shortcutCard: PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard,
      shortcutActionButton: PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionButton,
      shortcutSourceLabel: PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceLabel,
      shortcutTitle: PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutTitle,
      shortcutDescription: PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutDescription,
    })
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionIcon.editName).toBe("create-outline")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionIcon.deleteName).toBe("trash-outline")
    expect(getPromptLibraryMobileShortcutActionIconState("edit")).toEqual({
      action: "edit",
      name: "create-outline",
      size: 13,
      colorToken: "primary",
    })
    expect(getPromptLibraryMobileShortcutActionIconState("delete")).toEqual({
      action: "delete",
      name: "trash-outline",
      size: 13,
      colorToken: "destructive",
    })
    expect(getPromptLibraryMobileIconColors(getPromptLibraryMobileShortcutActionIconState("delete"), {
      destructive: "#dc2626",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    })).toEqual({
      color: "#dc2626",
    })
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionText.destructiveColorToken).toBe("destructive")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.modal.transparent).toBe(true)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.modal.animationType).toBe("slide")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.keyboardAvoidingView.flex).toBe(1)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.keyboardAvoidingView.behaviorByPlatform.ios).toBe("padding")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.keyboardAvoidingView.behaviorByPlatform.default).toBeUndefined()
    expect(getPromptLibraryEditorMobileSurfaceState()).toBe(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal)
    expect(getPromptLibraryEditorMobileCopyState()).toEqual({
      closeAccessibilityLabel: "Close prompt editor",
      nameLabel: "Name",
      namePlaceholder: "e.g., Code Review Request",
      contentLabel: "Prompt Content",
      contentPlaceholder: "Enter your prompt text...",
      cancelLabel: "Cancel",
    })
    expect(getPromptLibraryEditorModalKeyboardAvoidingBehavior("ios")).toBe("padding")
    expect(getPromptLibraryEditorModalKeyboardAvoidingBehavior("android")).toBeUndefined()
    expect(getPromptLibraryEditorModalKeyboardAvoidingBehavior("web")).toBeUndefined()
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.overlay.flex).toBe(1)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.overlay.backgroundColor).toBe("#000000")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.overlay.backgroundAlpha).toBe(0.5)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.content.borderRadius).toBe("xl")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.content.backgroundColorToken).toBe("background")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.header.flexDirection).toBe("row")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.header.justifyContent).toBe("space-between")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.title.flex).toBe(1)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.closeButton.width).toBe(32)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.closeButton.alignItems).toBe("center")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.closeButton.accessibilityRole).toBe("button")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.closeButton.pressedOpacity).toBe(0.72)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.closeIcon.name).toBe("close")
    expect(getPromptLibraryEditorMobileCloseIconState()).toEqual({
      name: "close",
      size: 20,
      colorToken: "mutedForeground",
    })
    expect(getPromptLibraryMobileIconColors(getPromptLibraryEditorMobileCloseIconState(), {
      destructive: "#dc2626",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    })).toEqual({
      color: "#64748b",
    })
    expect(getPromptLibraryEditorMobileChromeState({
      destructive: "#dc2626",
      mutedForeground: "#64748b",
      primary: "#2563eb",
    })).toEqual({
      closeIcon: {
        name: "close",
        size: 20,
        colorToken: "mutedForeground",
      },
      closeIconColors: {
        color: "#64748b",
      },
    })
    expect(getPromptLibraryEditorMobileRenderState({
      colors: {
        background: "#f8fafc",
        border: "#cbd5e1",
        card: "#ffffff",
        destructive: "#dc2626",
        foreground: "#0f172a",
        muted: "#e2e8f0",
        mutedForeground: "#64748b",
        primary: "#2563eb",
        primaryForeground: "#ffffff",
      },
      platform: "ios",
    })).toEqual({
      surface: getPromptLibraryEditorMobileSurfaceState(),
      colors: getPromptLibraryMobileSurfaceColors({
        background: "#f8fafc",
        border: "#cbd5e1",
        card: "#ffffff",
        destructive: "#dc2626",
        foreground: "#0f172a",
        muted: "#e2e8f0",
        mutedForeground: "#64748b",
        primary: "#2563eb",
        primaryForeground: "#ffffff",
      }).editorModal,
      chrome: getPromptLibraryEditorMobileChromeState({
        destructive: "#dc2626",
        mutedForeground: "#64748b",
        primary: "#2563eb",
      }),
      copy: getPromptLibraryEditorMobileCopyState(),
      keyboardAvoidingBehavior: "padding",
    })
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.input.placeholderColorToken).toBe("mutedForeground")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.multilineInput.multiline).toBe(true)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.multilineInput.textAlignVertical).toBe("top")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.multilineInput.height).toBe(120)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.actions.flexDirection).toBe("row")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.cancelButton.accessibilityRole).toBe("button")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.cancelButton.pressedOpacity).toBe(0.78)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.saveButton.accessibilityRole).toBe("button")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.saveButton.alignItems).toBe("center")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.saveButton.textColorToken).toBe("primaryForeground")
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.saveButton.pressedOpacity).toBe(0.78)
    expect(PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.saveButton.disabledOpacity).toBe(0.5)
  })

  it("classifies slash command prompt names", () => {
    expect(PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION).toBe("Use this skill as a reusable prompt.")
    expect(PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION).toBe("Run this task now.")
    expect(isSlashCommandPromptName("/standup")).toBe(true)
    expect(isSlashCommandPromptName(" /standup ")).toBe(true)
    expect(isSlashCommandPromptName("/")).toBe(false)
    expect(isSlashCommandPromptName("standup")).toBe(false)
    expect(isSlashCommandPrompt({ name: "/ship" })).toBe(true)
  })

  it("resolves slash command input state", () => {
    expect(resolveSlashCommandInputState("hello")).toEqual({ mode: "inactive", query: "" })
    expect(resolveSlashCommandInputState("/")).toEqual({ mode: "active", query: "" })
    expect(resolveSlashCommandInputState("/review")).toEqual({ mode: "active", query: "review" })
    expect(resolveSlashCommandInputState("/review this")).toEqual({ mode: "complete", query: "review this" })
    expect(resolveSlashCommandInputState("/review\nbody")).toEqual({ mode: "complete", query: "review\nbody" })
  })

  it("builds shared prompt-library prompt labels and content", () => {
    const prompt = { content: "Review the latest implementation notes." }
    expect(getPromptLibraryPromptContent(prompt)).toBe("Review the latest implementation notes.")
    expect(getPromptLibraryPromptDescription(prompt)).toBe("Review the latest implementation notes.")
    expect(getPromptLibraryPromptDescription(prompt, 11)).toBe("Review the ")
  })

  it("builds shared prompt-library skill labels and content", () => {
    expect(getPromptLibrarySkillDescription({
      name: "Research",
      description: "  Find sources  ",
    })).toBe("Find sources")
    expect(getPromptLibrarySkillDescription({ name: "Research" })).toBe(PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION)
    expect(getPromptLibrarySkillContent({
      name: "Research",
      instructions: "  Use citations.  ",
      description: "Find sources",
    })).toBe("Use citations.")
    expect(getPromptLibrarySkillContent({
      name: "Research",
      description: "Find sources",
    })).toBe('Use the "Research" skill for this request.\n\nFind sources')
    expect(getPromptLibrarySkillContent({ name: "Research" })).toBe('Use the "Research" skill for this request.')
  })

  it("builds shared prompt-library task labels and content", () => {
    expect(getPromptLibraryTaskContent({ prompt: "  Review open PRs  " })).toBe("Review open PRs")
    expect(getPromptLibraryTaskContent({ prompt: "  " })).toBe("")
    expect(getPromptLibraryTaskDescription({ prompt: "  Review open PRs  " })).toBe("Review open PRs")
    expect(getPromptLibraryTaskDescription({ prompt: "" })).toBe(PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION)
    expect(getPromptLibraryTaskDescription({ prompt: "" }, "Run this desktop task now.")).toBe("Run this desktop task now.")
  })

  it("filters prompt-library items by normalized searchable fields", () => {
    const items = [
      { name: "Review", description: "Inspect a diff", prompt: "Check regressions" },
      { name: "Ship", description: null, prompt: "Prepare release notes" },
      { name: "Research", description: "Find citations", prompt: "" },
    ]

    expect(filterPromptLibraryItemsByQuery(items, "", (item) => [item.name, item.description, item.prompt])).toEqual(items)
    expect(filterPromptLibraryItemsByQuery(items, " RELEASE ", (item) => [item.name, item.description, item.prompt])).toEqual([
      items[1],
    ])
    expect(filterPromptLibraryItemsByQuery(items, "citation", (item) => [item.name, item.description, item.prompt])).toEqual([
      items[2],
    ])
  })

  it("builds and filters shared command menu items for prompts, skills, and tasks", () => {
    const items = buildPromptLibraryCommandItems({
      prompts: [{
        id: "prompt-1",
        name: "/review",
        content: "Review this diff for regressions.",
        createdAt: 1,
        updatedAt: 1,
      }],
      skills: [{
        id: "skill-1",
        name: "Research",
        description: "Find citations",
      }],
      tasks: [{
        id: "task-1",
        name: "Ship notes",
        prompt: "Draft release notes",
      }],
      getTaskDescription: (task) => `Run ${task.name}`,
    })

    expect(items).toEqual([
      {
        id: "prompt-1",
        name: "/review",
        description: "Review this diff for regressions.",
        content: "Review this diff for regressions.",
        type: "prompt",
      },
      {
        id: "skill-1",
        name: "Research",
        description: "Find citations",
        content: 'Use the "Research" skill for this request.\n\nFind citations',
        type: "skill",
      },
      {
        id: "task-1",
        name: "Ship notes",
        description: "Run Ship notes",
        type: "loop",
      },
    ])
    expect(filterPromptLibraryCommandItems(items, "citation").map((item) => item.id)).toEqual(["skill-1"])
    expect(filterPromptLibraryCommandItems(items, "ship").map((item) => item.id)).toEqual(["task-1"])
  })

  it("builds shared mobile shortcut launchers for prompts, skills, tasks, and add-prompt", () => {
    const prompt = {
      id: "prompt-1",
      name: "/review",
      content: "Review this diff for regressions.",
      createdAt: 1,
      updatedAt: 1,
    }
    const task = {
      id: "task-1",
      name: "Ship notes",
      prompt: "",
    }

    const items = buildPromptLibraryShortcutItems({
      prompts: [prompt],
      skills: [{
        id: "skill-1",
        name: "Research",
        instructions: "Find citations before answering.",
      }],
      tasks: [task],
      canAddPrompt: true,
      addPromptTitle: "+ Add Prompt",
      addPromptDescription: "Save a reusable prompt.",
      taskDescriptionFallback: "Run this desktop task now.",
    })

    expect(items).toEqual([
      {
        id: "prompt-1",
        title: "/review",
        content: "Review this diff for regressions.",
        description: "Review this diff for regressions.",
        source: "command",
        prompt,
      },
      {
        id: "skill-skill-1",
        title: "Research",
        content: "Find citations before answering.",
        description: "Find citations before answering.",
        source: "skill",
      },
      {
        id: "task-task-1",
        title: "Ship notes",
        content: "",
        description: "Run this desktop task now.",
        source: "task",
        task,
      },
      {
        id: "action-add-prompt",
        title: "+ Add Prompt",
        content: "",
        description: "Save a reusable prompt.",
        source: "action",
        action: "add-prompt",
      },
    ])
    expect(getPromptLibraryShortcutPressIntent(items[0])).toEqual({
      kind: "insert-content",
      content: "Review this diff for regressions.",
    })
    expect(getPromptLibraryShortcutPressIntent(items[1])).toEqual({
      kind: "insert-content",
      content: "Find citations before answering.",
    })
    expect(getPromptLibraryShortcutPressIntent(items[2])).toEqual({
      kind: "run-task",
      task,
    })
    expect(getPromptLibraryShortcutPressIntent(items[3])).toEqual({
      kind: "add-prompt",
    })
  })

  it("creates stable prompt ids and trimmed records", () => {
    expect(createPredefinedPromptId(123, () => 0.5)).toBe("prompt-123-i")
    expect(createPredefinedPromptRecord(
      { name: "  Standup  ", content: "  Share updates  " },
      123,
      (now) => `prompt-${now}`,
    )).toEqual({
      id: "prompt-123",
      name: "Standup",
      content: "Share updates",
      createdAt: 123,
      updatedAt: 123,
    })
  })

  it("updates and deletes prompt records without changing unrelated entries", () => {
    const prompts = [
      { id: "old", name: "Old", content: "Old content", createdAt: 1, updatedAt: 1 },
      { id: "keep", name: "Keep", content: "Keep content", createdAt: 2, updatedAt: 2 },
    ]

    expect(updatePredefinedPromptRecord(prompts[0], { name: " New ", content: " Body " }, 10)).toEqual({
      id: "old",
      name: "New",
      content: "Body",
      createdAt: 1,
      updatedAt: 10,
    })
    expect(updatePredefinedPromptList(prompts, "old", { name: " New ", content: " Body " }, 10)).toEqual([
      { id: "old", name: "New", content: "Body", createdAt: 1, updatedAt: 10 },
      prompts[1],
    ])
    expect(deletePredefinedPromptFromList(prompts, "old")).toEqual([prompts[1]])
  })

  it("sorts prompts by most recently updated first", () => {
    const prompts = [
      { id: "old", name: "Old", content: "Old", createdAt: 1, updatedAt: 1 },
      { id: "new", name: "New", content: "New", createdAt: 2, updatedAt: 5 },
    ]

    expect(sortPredefinedPromptsByUpdatedAt(prompts).map((prompt) => prompt.id)).toEqual(["new", "old"])
    expect(prompts.map((prompt) => prompt.id)).toEqual(["old", "new"])
  })
})
