import type { PredefinedPromptSummary } from "./api-types"
import {
  createButtonAccessibilityLabel,
  createTextInputAccessibilityLabel,
} from "./accessibility-utils"
import { hexToRgba, typography } from "./colors"

export type PredefinedPromptDraft = {
  name: string
  content: string
}

export type PredefinedPromptIdGenerator = (now: number) => string

export const PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION = "Use this skill as a reusable prompt."
export const PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION = "Run this task now."

export type PromptLibraryPromptLike = {
  content: string
}

export type PromptLibrarySkillLike = {
  id?: string
  name: string
  description?: string | null
  instructions?: string | null
}

export type PromptLibraryTaskLike = {
  id?: string
  name?: string
  prompt?: string | null
}

export type PromptLibraryCommandItemType = "prompt" | "skill" | "loop"
export type PromptLibraryShortcutSource =
  | PromptLibraryCommandItemType
  | "saved-prompt"
  | "command"
  | "task"
  | "action"
export type PromptLibraryLauncherShortcutSource = Extract<
  PromptLibraryShortcutSource,
  "saved-prompt" | "command" | "skill" | "task" | "action"
>
export type PromptLibraryShortcutActionIcon = "edit" | "delete"

export const PROMPT_LIBRARY_PRESENTATION = {
  triggerTitle: "Predefined prompts",
  triggerAccessibilityLabel: "Open predefined prompts",
  search: {
    placeholder: "Search prompts, skills, tasks...",
    accessibilityLabel: "Search prompts, skills, and tasks",
  },
  sections: {
    prompts: "Predefined Prompts",
    skills: "Skills",
    tasks: "Tasks",
  },
  empty: {
    noSavedPrompts: "No saved prompts yet",
    noMatchingPrompts: "No matching prompts",
    noSkills: "No skills available",
    noMatchingSkills: "No matching skills",
    noTasks: "No tasks available",
    noMatchingTasks: "No matching tasks",
    mobileLibrary:
      "No prompts, skills, or tasks available from your connected desktop app.",
  },
  actions: {
    addNewPrompt: "Add new prompt",
    addPrompt: "Add Prompt",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    saveChanges: "Save Changes",
    saving: "Saving...",
  },
  editor: {
    addTitle: "Add New Prompt",
    editTitle: "Edit Prompt",
    closeAccessibilityLabel: "Close prompt editor",
    description: "Save a frequently used prompt for quick access.",
    nameLabel: "Name",
    namePlaceholder: "e.g., Code Review Request",
    contentLabel: "Prompt Content",
    contentPlaceholder: "Enter your prompt text...",
  },
  mobile: {
    addPromptTitle: "+ Add Prompt",
    addPromptDescription:
      "Create a predefined prompt and save it back to desktop.",
    addPromptHint: "Create a predefined prompt and save it to desktop.",
    insertItemHint: "Inserts this desktop library item into the composer.",
    taskHint: "Runs this desktop task now.",
    taskDescriptionFallback: "Run this desktop task now.",
    loadingLibraryLabel: "Loading desktop library...",
  },
  feedback: {
    successTitle: "Success",
    errorTitle: "Error",
    deletePromptTitle: "Delete Prompt",
    taskStartedTitle: "Task started",
    promptSaved: "Prompt saved to your desktop prompt library.",
    promptUpdated: "Prompt updated in your desktop prompt library.",
    promptSaveFailed: "Failed to save prompt.",
    promptDeleteFailed: "Failed to delete prompt.",
    taskRunFailed: "Failed to run task.",
    taskTriggerFailed: "Failed to trigger task",
  },
  sourceLabels: {
    action: "action",
    command: "command",
    loop: "task",
    prompt: "prompt",
    "saved-prompt": "prompt",
    skill: "skill",
    task: "task",
  },
} as const

export const PROMPT_LIBRARY_SURFACE_PRESENTATION = {
  desktop: {
    triggerBaseClassName: "shrink-0",
    triggerButtonClassNameBySize: {
      default: "h-9 w-9",
      sm: "h-7 w-7",
      icon: "h-8 w-8",
      "sm-icon": "h-6 w-6",
      "md-icon": "h-7 w-7",
    },
    triggerIconClassNameBySize: {
      default: "h-4 w-4 shrink-0",
      sm: "h-3.5 w-3.5 shrink-0",
      icon: "h-4 w-4 shrink-0",
      "sm-icon": "h-3.5 w-3.5 shrink-0",
      "md-icon": "h-3.5 w-3.5 shrink-0",
    },
    sectionLabelClassName: "px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
    menuContentClassName: "w-[min(26rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] max-h-[min(32rem,calc(100vh-2rem))] overflow-y-auto",
    entryClassName: "flex min-w-0 items-start gap-2.5 py-2 cursor-pointer",
    entryTextClassName: "min-w-0 flex-1 space-y-0.5",
    entryTitleClassName: "truncate font-medium",
    secondaryTextClassName: "line-clamp-2 text-xs leading-4 text-muted-foreground [overflow-wrap:anywhere]",
    searchContainerClassName: "sticky top-0 z-10 border-b bg-popover p-2",
    searchWrapperClassName: "h-8",
    searchInputClassName: "text-xs",
    searchIconClassName: "h-3.5 w-3.5 shrink-0 text-muted-foreground",
    emptyStateClassName: "px-2 py-3 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]",
    itemActionsClassName: "mt-0.5 flex shrink-0 items-center gap-1 self-start",
    itemActionIconClassName: "h-3.5 w-3.5",
    destructiveActionClassName: "text-destructive hover:text-destructive",
    addItemClassName: "cursor-pointer",
    addItemIconClassName: "mr-2 h-4 w-4 shrink-0",
    sourceIconClassName: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
    dialogContentClassName: "sm:max-w-md",
    dialogBodyClassName: "space-y-4 py-4",
    dialogFieldClassName: "space-y-2",
    dialogTextareaClassName: "min-h-[120px] resize-y",
  },
  mobile: {
    quickStartCard: {
      marginHorizontal: "sm",
      marginTop: "md",
      padding: "md",
      borderRadius: "lg",
      borderWidth: 1,
      borderColorToken: "border",
      backgroundColorToken: "card",
      gap: "sm",
    },
    emptyText: {
      colorToken: "mutedForeground",
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      textAlign: "center",
      paddingVertical: "md",
    },
    shortcutGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: "sm",
    },
    shortcutCard: {
      accessibilityRole: "button",
      minHeight: 84,
      minWidth: "47%",
      flexGrow: 1,
      flexBasis: "47%",
      paddingHorizontal: "sm",
      paddingVertical: "sm",
      borderRadius: "md",
      borderWidth: 1,
      borderColorToken: "border",
      backgroundColorToken: "background",
      justifyContent: "center",
      gap: "xs",
      disabledOpacity: 0.5,
      pressedOpacity: 0.88,
      pressedScale: 0.99,
    },
    addShortcutCard: {
      borderStyle: "dashed",
      borderColorToken: "primary",
      backgroundColor: "transparent",
      alignItems: "center",
      titleColorToken: "primary",
      titleTextAlign: "center",
    },
    addShortcutIcon: {
      name: "add-circle-outline",
      size: 18,
      colorToken: "primary",
      marginBottom: 2,
    },
    shortcutSourcePill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: "xs",
      paddingHorizontal: "xs",
      paddingVertical: 2,
      borderRadius: "sm",
      backgroundColorToken: "muted",
      backgroundAlpha: 0.45,
    },
    shortcutSourceIcon: {
      commandName: "terminal-outline",
      promptName: "bookmark-outline",
      savedPromptName: "bookmark-outline",
      skillName: "sparkles-outline",
      taskName: "time-outline",
      loopName: "time-outline",
      actionName: "add",
      size: 10,
      colorToken: "mutedForeground",
      actionColorToken: "primary",
    },
    shortcutSourceLabel: {
      colorToken: "mutedForeground",
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0,
      numberOfLines: 1,
      textTransform: "uppercase",
    },
    shortcutTitle: {
      colorToken: "foreground",
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      fontWeight: "600",
      numberOfLines: 2,
    },
    shortcutDescription: {
      colorToken: "mutedForeground",
      fontSize: typography.caption.fontSize,
      marginTop: 3,
      lineHeight: 15,
      numberOfLines: 2,
    },
    shortcutActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: "xs",
      marginTop: "xs",
    },
    shortcutActionButton: {
      accessibilityRole: "button",
      minHeight: 32,
      paddingHorizontal: "sm",
      paddingVertical: 5,
      borderRadius: "sm",
      borderWidth: 1,
      borderColorToken: "border",
      backgroundColorToken: "card",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "xs",
      pressedOpacity: 0.78,
    },
    shortcutActionIcon: {
      editName: "create-outline",
      deleteName: "trash-outline",
      size: 13,
      colorToken: "primary",
      destructiveColorToken: "destructive",
    },
    shortcutActionText: {
      colorToken: "primary",
      destructiveColorToken: "destructive",
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      fontWeight: "600",
    },
    editorModal: {
      modal: {
        transparent: true,
        animationType: "slide",
      },
      keyboardAvoidingView: {
        flex: 1,
        behaviorByPlatform: {
          ios: "padding",
          default: undefined,
        },
      },
      overlay: {
        flex: 1,
        backgroundColor: "#000000",
        backgroundAlpha: 0.5,
        justifyContent: "center",
        padding: "lg",
      },
      content: {
        borderRadius: "xl",
        padding: "lg",
        borderWidth: 1,
        backgroundColorToken: "background",
        borderColorToken: "border",
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "sm",
        marginBottom: "md",
      },
      title: {
        colorToken: "foreground",
        flex: 1,
        fontSize: typography.h2.fontSize,
        lineHeight: typography.h2.lineHeight,
        fontWeight: typography.h2.fontWeight,
        marginBottom: 0,
      },
      closeButton: {
        accessibilityRole: "button",
        width: 32,
        height: 32,
        borderRadius: "md",
        alignItems: "center",
        justifyContent: "center",
        pressedOpacity: 0.72,
      },
      closeIcon: {
        name: "close",
        size: 20,
        colorToken: "mutedForeground",
      },
      label: {
        colorToken: "foreground",
        fontSize: typography.caption.fontSize,
        lineHeight: typography.caption.lineHeight,
        fontWeight: "600",
        marginBottom: "xs",
      },
      input: {
        colorToken: "foreground",
        placeholderColorToken: "mutedForeground",
        borderWidth: 1,
        borderColorToken: "input",
        borderRadius: "lg",
        paddingHorizontal: "md",
        paddingVerticalByPlatform: {
          ios: 10,
          android: 8,
          default: 10,
        },
        backgroundColorToken: "background",
        fontSize: typography.body.fontSize,
        marginBottom: "md",
      },
      multilineInput: {
        multiline: true,
        textAlignVertical: "top",
        height: 120,
        paddingTop: "sm",
        paddingBottom: "sm",
      },
      actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: "sm",
        marginTop: "sm",
      },
      cancelButton: {
        accessibilityRole: "button",
        paddingHorizontal: "md",
        paddingVertical: "sm",
        borderRadius: "md",
        textColorToken: "mutedForeground",
        pressedOpacity: 0.78,
      },
      saveButton: {
        accessibilityRole: "button",
        paddingHorizontal: "lg",
        paddingVertical: "sm",
        borderRadius: "md",
        minWidth: 100,
        backgroundColorToken: "primary",
        textColorToken: "primaryForeground",
        alignItems: "center",
        pressedOpacity: 0.78,
        disabledOpacity: 0.5,
      },
      actionText: {
        fontWeight: "600",
      },
    },
  },
} as const

export interface PromptLibraryEditorMobileCloseIconState {
  name: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.closeIcon.name
  size: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.closeIcon.size
  colorToken: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.closeIcon.colorToken
}

export interface PromptLibraryMobileShortcutActionIconState {
  action: PromptLibraryShortcutActionIcon
  name:
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionIcon.editName
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionIcon.deleteName
  size: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionIcon.size
  colorToken:
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionIcon.colorToken
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionIcon.destructiveColorToken
}

export interface PromptLibraryMobileAddShortcutIconState {
  name: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutIcon.name
  size: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutIcon.size
  colorToken: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutIcon.colorToken
}

export interface PromptLibraryMobileShortcutSourceIconState {
  source: PromptLibraryShortcutSource
  name:
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.commandName
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.promptName
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.savedPromptName
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.skillName
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.taskName
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.loopName
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.actionName
  size: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.size
  colorToken:
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.colorToken
    | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon.actionColorToken
}

export type PromptLibraryMobileLauncherShortcutSourceIconStates = Readonly<
  Record<PromptLibraryLauncherShortcutSource, PromptLibraryMobileShortcutSourceIconState>
>

export type PromptLibraryMobileIconColorToken =
  | PromptLibraryEditorMobileCloseIconState["colorToken"]
  | PromptLibraryMobileAddShortcutIconState["colorToken"]
  | PromptLibraryMobileShortcutActionIconState["colorToken"]
  | PromptLibraryMobileShortcutSourceIconState["colorToken"]

export type PromptLibraryMobileIconColorPalette =
  Readonly<Record<PromptLibraryMobileIconColorToken, string>>

export interface PromptLibraryMobileIconState {
  colorToken: PromptLibraryMobileIconColorToken
}

export interface PromptLibraryMobileIconColors {
  color: string
}

export type PromptLibraryMobileLauncherShortcutSourceIconColors = Readonly<
  Record<PromptLibraryLauncherShortcutSource, PromptLibraryMobileIconColors>
>

export interface PromptLibraryEditorMobileChromeState {
  closeIcon: PromptLibraryEditorMobileCloseIconState
  closeIconColors: PromptLibraryMobileIconColors
}

export interface PromptLibraryEditorMobileCopyState {
  closeAccessibilityLabel: string
  nameLabel: string
  nameAccessibilityLabel: string
  namePlaceholder: string
  contentLabel: string
  contentAccessibilityLabel: string
  contentPlaceholder: string
  cancelLabel: string
  cancelAccessibilityLabel: string
}

export interface PromptLibraryEditorActionAccessibilityState {
  disabled: true
}

export interface PromptLibraryEditorDismissActionState {
  isDisabled: boolean
  accessibilityState?: PromptLibraryEditorActionAccessibilityState
}

export interface PromptLibraryEditorSaveActionState extends PromptLibraryEditorDismissActionState {
  label: string
  accessibilityLabel: string
}

export interface PromptLibraryMobileShortcutChromeState {
  addIcon: PromptLibraryMobileAddShortcutIconState
  addIconColors: PromptLibraryMobileIconColors
  editIcon: PromptLibraryMobileShortcutActionIconState
  editIconColors: PromptLibraryMobileIconColors
  deleteIcon: PromptLibraryMobileShortcutActionIconState
  deleteIconColors: PromptLibraryMobileIconColors
  sourceIcons: PromptLibraryMobileLauncherShortcutSourceIconStates
  sourceIconColors: PromptLibraryMobileLauncherShortcutSourceIconColors
}

export type PromptLibraryMobileSurfaceColorToken =
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.quickStartCard.borderColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.quickStartCard.backgroundColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.emptyText.colorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard.borderColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard.backgroundColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutCard.borderColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutCard.titleColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourcePill.backgroundColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceLabel.colorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutTitle.colorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutDescription.colorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionButton.borderColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionButton.backgroundColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionText.colorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionText.destructiveColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.content.backgroundColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.content.borderColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.title.colorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.label.colorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.input.colorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.input.placeholderColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.input.borderColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.input.backgroundColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.cancelButton.textColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.saveButton.backgroundColorToken
  | typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.saveButton.textColorToken

export type PromptLibraryMobileSurfaceColorPalette =
  Readonly<Record<PromptLibraryMobileSurfaceColorToken, string>>

export interface PromptLibraryMobileSurfaceColors {
  quickStartCard: {
    borderColor: string
    backgroundColor: string
  }
  emptyText: {
    color: string
  }
  shortcutCard: {
    borderColor: string
    backgroundColor: string
  }
  addShortcutCard: {
    borderColor: string
    backgroundColor: string
    titleColor: string
  }
  shortcutSourcePill: {
    backgroundColor: string
  }
  shortcutSourceLabel: {
    color: string
  }
  shortcutTitle: {
    color: string
  }
  shortcutDescription: {
    color: string
  }
  shortcutActionButton: {
    borderColor: string
    backgroundColor: string
  }
  shortcutActionText: {
    color: string
    destructiveColor: string
  }
  editorModal: {
    overlay: {
      backgroundColor: string
    }
    content: {
      backgroundColor: string
      borderColor: string
    }
    title: {
      color: string
    }
    label: {
      color: string
    }
    input: {
      color: string
      placeholderColor: string
      borderColor: string
      backgroundColor: string
    }
    cancelButtonText: {
      color: string
    }
    saveButton: {
      backgroundColor: string
    }
    saveButtonText: {
      color: string
    }
  }
}

export type PromptLibraryMobileSurfaceState = typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile

export interface PromptLibraryMobileSurfaceRenderStateInput {
  colors: PromptLibraryMobileSurfaceColorPalette
}

export interface PromptLibraryMobileSurfaceRenderState {
  surface: PromptLibraryMobileSurfaceState
  colors: PromptLibraryMobileSurfaceColors
}

export type PromptLibraryEditorMobileSurfaceState = PromptLibraryMobileSurfaceState["editorModal"]

export type PromptLibraryMobileShortcutSurfaceState = Pick<
  PromptLibraryMobileSurfaceState,
  "shortcutCard" | "shortcutActionButton" | "shortcutSourceLabel" | "shortcutTitle" | "shortcutDescription"
>

export type PromptLibraryEditorMobileSurfaceColors = PromptLibraryMobileSurfaceColors["editorModal"]

export interface PromptLibraryMobileShortcutCopyState {
  loadingLabel: string
  emptyLabel: string
  editLabel: string
  deleteLabel: string
}

export interface PromptLibraryMobileShortcutRenderState {
  surface: PromptLibraryMobileShortcutSurfaceState
  chrome: PromptLibraryMobileShortcutChromeState
  copy: PromptLibraryMobileShortcutCopyState
}

type PromptLibraryEditorModalBehaviorByPlatform =
  typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.keyboardAvoidingView.behaviorByPlatform

export type PromptLibraryEditorMobileKeyboardAvoidingBehavior =
  PromptLibraryEditorModalBehaviorByPlatform[keyof PromptLibraryEditorModalBehaviorByPlatform]

type PromptLibraryEditorInputPaddingVerticalByPlatform =
  typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.input.paddingVerticalByPlatform

export type PromptLibraryEditorMobileInputPaddingVertical =
  PromptLibraryEditorInputPaddingVerticalByPlatform[keyof PromptLibraryEditorInputPaddingVerticalByPlatform]

export interface PromptLibraryEditorMobileRenderState {
  surface: PromptLibraryEditorMobileSurfaceState
  colors: PromptLibraryEditorMobileSurfaceColors
  chrome: PromptLibraryEditorMobileChromeState
  copy: PromptLibraryEditorMobileCopyState
  keyboardAvoidingBehavior: PromptLibraryEditorMobileKeyboardAvoidingBehavior
}

export function getPromptLibraryMobileSurfaceState(): typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile {
  return PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile
}

export function getPromptLibraryEditorMobileSurfaceState(): PromptLibraryEditorMobileSurfaceState {
  return PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal
}

export function getPromptLibraryMobileShortcutSurfaceState(): PromptLibraryMobileShortcutSurfaceState {
  const surface = PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile
  return {
    shortcutCard: surface.shortcutCard,
    shortcutActionButton: surface.shortcutActionButton,
    shortcutSourceLabel: surface.shortcutSourceLabel,
    shortcutTitle: surface.shortcutTitle,
    shortcutDescription: surface.shortcutDescription,
  }
}

export function getPromptLibraryEditorMobileCopyState(): PromptLibraryEditorMobileCopyState {
  return {
    closeAccessibilityLabel: PROMPT_LIBRARY_PRESENTATION.editor.closeAccessibilityLabel,
    nameLabel: PROMPT_LIBRARY_PRESENTATION.editor.nameLabel,
    nameAccessibilityLabel: createTextInputAccessibilityLabel(
      PROMPT_LIBRARY_PRESENTATION.editor.nameLabel,
    ),
    namePlaceholder: PROMPT_LIBRARY_PRESENTATION.editor.namePlaceholder,
    contentLabel: PROMPT_LIBRARY_PRESENTATION.editor.contentLabel,
    contentAccessibilityLabel: createTextInputAccessibilityLabel(
      PROMPT_LIBRARY_PRESENTATION.editor.contentLabel,
    ),
    contentPlaceholder: PROMPT_LIBRARY_PRESENTATION.editor.contentPlaceholder,
    cancelLabel: PROMPT_LIBRARY_PRESENTATION.actions.cancel,
    cancelAccessibilityLabel: createButtonAccessibilityLabel(
      PROMPT_LIBRARY_PRESENTATION.actions.cancel,
    ),
  }
}

export function getPromptLibraryMobileShortcutCopyState(): PromptLibraryMobileShortcutCopyState {
  return {
    loadingLabel: PROMPT_LIBRARY_PRESENTATION.mobile.loadingLibraryLabel,
    emptyLabel: PROMPT_LIBRARY_PRESENTATION.empty.mobileLibrary,
    editLabel: PROMPT_LIBRARY_PRESENTATION.actions.edit,
    deleteLabel: PROMPT_LIBRARY_PRESENTATION.actions.delete,
  }
}

export function getPromptLibraryEditorModalKeyboardAvoidingBehavior(
  platform: string | null | undefined,
): PromptLibraryEditorMobileKeyboardAvoidingBehavior {
  const behavior = PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.keyboardAvoidingView.behaviorByPlatform
  return platform === "ios" ? behavior.ios : behavior.default
}

export function getPromptLibraryEditorInputPaddingVertical(
  platform: string | null | undefined,
): PromptLibraryEditorMobileInputPaddingVertical {
  const padding = PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.input.paddingVerticalByPlatform
  if (platform === "ios") return padding.ios
  if (platform === "android") return padding.android
  return padding.default
}

export function getPromptLibraryDesktopSurfaceState(): typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.desktop {
  return PROMPT_LIBRARY_SURFACE_PRESENTATION.desktop
}

export function getPromptLibraryCopyState(): typeof PROMPT_LIBRARY_PRESENTATION {
  return PROMPT_LIBRARY_PRESENTATION
}

export function getPromptLibraryMobileCopyState(): typeof PROMPT_LIBRARY_PRESENTATION.mobile {
  return PROMPT_LIBRARY_PRESENTATION.mobile
}

export function getPromptLibraryMobileEmptyLibraryLabel(): string {
  return PROMPT_LIBRARY_PRESENTATION.empty.mobileLibrary
}

export function getPromptLibraryEditorMobileCloseIconState(): PromptLibraryEditorMobileCloseIconState {
  const closeIcon = PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.editorModal.closeIcon
  return {
    name: closeIcon.name,
    size: closeIcon.size,
    colorToken: closeIcon.colorToken,
  }
}

export function getPromptLibraryMobileShortcutActionIconState(
  action: PromptLibraryShortcutActionIcon,
): PromptLibraryMobileShortcutActionIconState {
  const icon = PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionIcon
  return {
    action,
    name: action === "delete" ? icon.deleteName : icon.editName,
    size: icon.size,
    colorToken: action === "delete" ? icon.destructiveColorToken : icon.colorToken,
  }
}

export function getPromptLibraryMobileAddShortcutIconState(): PromptLibraryMobileAddShortcutIconState {
  const icon = PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.addShortcutIcon
  return {
    name: icon.name,
    size: icon.size,
    colorToken: icon.colorToken,
  }
}

export function getPromptLibraryMobileShortcutSourceIconState(
  source: PromptLibraryShortcutSource,
): PromptLibraryMobileShortcutSourceIconState {
  const icon = PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutSourceIcon
  const nameBySource = {
    action: icon.actionName,
    command: icon.commandName,
    loop: icon.loopName,
    prompt: icon.promptName,
    "saved-prompt": icon.savedPromptName,
    skill: icon.skillName,
    task: icon.taskName,
  } as const satisfies Record<PromptLibraryShortcutSource, PromptLibraryMobileShortcutSourceIconState["name"]>

  return {
    source,
    name: nameBySource[source],
    size: icon.size,
    colorToken: source === "action" ? icon.actionColorToken : icon.colorToken,
  }
}

export function getPromptLibraryMobileLauncherShortcutSourceIconStates(): PromptLibraryMobileLauncherShortcutSourceIconStates {
  return {
    action: getPromptLibraryMobileShortcutSourceIconState("action"),
    command: getPromptLibraryMobileShortcutSourceIconState("command"),
    "saved-prompt": getPromptLibraryMobileShortcutSourceIconState("saved-prompt"),
    skill: getPromptLibraryMobileShortcutSourceIconState("skill"),
    task: getPromptLibraryMobileShortcutSourceIconState("task"),
  }
}

export function getPromptLibraryMobileIconColors(
  icon: PromptLibraryMobileIconState,
  colors: PromptLibraryMobileIconColorPalette,
): PromptLibraryMobileIconColors {
  return {
    color: colors[icon.colorToken],
  }
}

export function getPromptLibraryMobileLauncherShortcutSourceIconColors(
  colors: PromptLibraryMobileIconColorPalette,
): PromptLibraryMobileLauncherShortcutSourceIconColors {
  const icons = getPromptLibraryMobileLauncherShortcutSourceIconStates()
  return {
    action: getPromptLibraryMobileIconColors(icons.action, colors),
    command: getPromptLibraryMobileIconColors(icons.command, colors),
    "saved-prompt": getPromptLibraryMobileIconColors(icons["saved-prompt"], colors),
    skill: getPromptLibraryMobileIconColors(icons.skill, colors),
    task: getPromptLibraryMobileIconColors(icons.task, colors),
  }
}

export function getPromptLibraryEditorMobileChromeState(
  colors: PromptLibraryMobileIconColorPalette,
): PromptLibraryEditorMobileChromeState {
  const closeIcon = getPromptLibraryEditorMobileCloseIconState()

  return {
    closeIcon,
    closeIconColors: getPromptLibraryMobileIconColors(closeIcon, colors),
  }
}

export function getPromptLibraryEditorMobileRenderState({
  colors,
  platform,
}: {
  colors: PromptLibraryMobileSurfaceColorPalette
  platform?: string | null
}): PromptLibraryEditorMobileRenderState {
  return {
    surface: getPromptLibraryEditorMobileSurfaceState(),
    colors: getPromptLibraryMobileSurfaceColors(colors).editorModal,
    chrome: getPromptLibraryEditorMobileChromeState(colors),
    copy: getPromptLibraryEditorMobileCopyState(),
    keyboardAvoidingBehavior: getPromptLibraryEditorModalKeyboardAvoidingBehavior(platform),
  }
}

export function getPromptLibraryMobileShortcutChromeState(
  colors: PromptLibraryMobileIconColorPalette,
): PromptLibraryMobileShortcutChromeState {
  const addIcon = getPromptLibraryMobileAddShortcutIconState()
  const editIcon = getPromptLibraryMobileShortcutActionIconState("edit")
  const deleteIcon = getPromptLibraryMobileShortcutActionIconState("delete")

  return {
    addIcon,
    addIconColors: getPromptLibraryMobileIconColors(addIcon, colors),
    editIcon,
    editIconColors: getPromptLibraryMobileIconColors(editIcon, colors),
    deleteIcon,
    deleteIconColors: getPromptLibraryMobileIconColors(deleteIcon, colors),
    sourceIcons: getPromptLibraryMobileLauncherShortcutSourceIconStates(),
    sourceIconColors: getPromptLibraryMobileLauncherShortcutSourceIconColors(colors),
  }
}

export function getPromptLibraryMobileShortcutRenderState(
  colors: PromptLibraryMobileIconColorPalette,
): PromptLibraryMobileShortcutRenderState {
  return {
    surface: getPromptLibraryMobileShortcutSurfaceState(),
    chrome: getPromptLibraryMobileShortcutChromeState(colors),
    copy: getPromptLibraryMobileShortcutCopyState(),
  }
}

export function getPromptLibraryMobileSurfaceColors(
  colors: PromptLibraryMobileSurfaceColorPalette,
): PromptLibraryMobileSurfaceColors {
  const surface = PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile
  const editorModal = surface.editorModal
  return {
    quickStartCard: {
      borderColor: colors[surface.quickStartCard.borderColorToken],
      backgroundColor: colors[surface.quickStartCard.backgroundColorToken],
    },
    emptyText: {
      color: colors[surface.emptyText.colorToken],
    },
    shortcutCard: {
      borderColor: colors[surface.shortcutCard.borderColorToken],
      backgroundColor: colors[surface.shortcutCard.backgroundColorToken],
    },
    addShortcutCard: {
      borderColor: colors[surface.addShortcutCard.borderColorToken],
      backgroundColor: surface.addShortcutCard.backgroundColor,
      titleColor: colors[surface.addShortcutCard.titleColorToken],
    },
    shortcutSourcePill: {
      backgroundColor: hexToRgba(
        colors[surface.shortcutSourcePill.backgroundColorToken],
        surface.shortcutSourcePill.backgroundAlpha,
      ),
    },
    shortcutSourceLabel: {
      color: colors[surface.shortcutSourceLabel.colorToken],
    },
    shortcutTitle: {
      color: colors[surface.shortcutTitle.colorToken],
    },
    shortcutDescription: {
      color: colors[surface.shortcutDescription.colorToken],
    },
    shortcutActionButton: {
      borderColor: colors[surface.shortcutActionButton.borderColorToken],
      backgroundColor: colors[surface.shortcutActionButton.backgroundColorToken],
    },
    shortcutActionText: {
      color: colors[surface.shortcutActionText.colorToken],
      destructiveColor: colors[surface.shortcutActionText.destructiveColorToken],
    },
    editorModal: {
      overlay: {
        backgroundColor: hexToRgba(editorModal.overlay.backgroundColor, editorModal.overlay.backgroundAlpha),
      },
      content: {
        backgroundColor: colors[editorModal.content.backgroundColorToken],
        borderColor: colors[editorModal.content.borderColorToken],
      },
      title: {
        color: colors[editorModal.title.colorToken],
      },
      label: {
        color: colors[editorModal.label.colorToken],
      },
      input: {
        color: colors[editorModal.input.colorToken],
        placeholderColor: colors[editorModal.input.placeholderColorToken],
        borderColor: colors[editorModal.input.borderColorToken],
        backgroundColor: colors[editorModal.input.backgroundColorToken],
      },
      cancelButtonText: {
        color: colors[editorModal.cancelButton.textColorToken],
      },
      saveButton: {
        backgroundColor: colors[editorModal.saveButton.backgroundColorToken],
      },
      saveButtonText: {
        color: colors[editorModal.saveButton.textColorToken],
      },
    },
  }
}

export function getPromptLibraryMobileSurfaceRenderState({
  colors,
}: PromptLibraryMobileSurfaceRenderStateInput): PromptLibraryMobileSurfaceRenderState {
  return {
    surface: getPromptLibraryMobileSurfaceState(),
    colors: getPromptLibraryMobileSurfaceColors(colors),
  }
}

export function getPromptLibraryEditorTitle(isEditing: boolean): string {
  return isEditing
    ? PROMPT_LIBRARY_PRESENTATION.editor.editTitle
    : PROMPT_LIBRARY_PRESENTATION.editor.addTitle
}

export function getPromptLibraryEditorSaveActionLabel(
  isEditing: boolean,
  isSaving = false,
): string {
  if (isSaving) return PROMPT_LIBRARY_PRESENTATION.actions.saving
  return isEditing
    ? PROMPT_LIBRARY_PRESENTATION.actions.saveChanges
    : PROMPT_LIBRARY_PRESENTATION.actions.addPrompt
}

export function getPromptLibraryEditorSaveActionAccessibilityLabel(
  isEditing: boolean,
  isSaving = false,
): string {
  return createButtonAccessibilityLabel(
    getPromptLibraryEditorSaveActionLabel(isEditing, isSaving),
  )
}

export function getPromptLibraryEditorDismissActionState(
  isSaving = false,
): PromptLibraryEditorDismissActionState {
  return {
    isDisabled: isSaving,
    accessibilityState: isSaving ? { disabled: true } : undefined,
  }
}

export function getPromptLibraryEditorSaveActionState(
  draft: PredefinedPromptDraft,
  isEditing: boolean,
  isSaving = false,
): PromptLibraryEditorSaveActionState {
  const isDisabled = isPromptLibraryEditorSaveDisabled(draft, isSaving)
  return {
    isDisabled,
    label: getPromptLibraryEditorSaveActionLabel(isEditing, isSaving),
    accessibilityLabel: getPromptLibraryEditorSaveActionAccessibilityLabel(isEditing, isSaving),
    accessibilityState: isDisabled ? { disabled: true } : undefined,
  }
}

export function getPromptLibrarySaveSuccessMessage(isEditing: boolean): string {
  return isEditing
    ? PROMPT_LIBRARY_PRESENTATION.feedback.promptUpdated
    : PROMPT_LIBRARY_PRESENTATION.feedback.promptSaved
}

export function getPromptLibraryEmptyPromptLabel(hasPrompts: boolean): string {
  return hasPrompts
    ? PROMPT_LIBRARY_PRESENTATION.empty.noMatchingPrompts
    : PROMPT_LIBRARY_PRESENTATION.empty.noSavedPrompts
}

export function getPromptLibraryEmptySkillLabel(hasSkills: boolean): string {
  return hasSkills
    ? PROMPT_LIBRARY_PRESENTATION.empty.noMatchingSkills
    : PROMPT_LIBRARY_PRESENTATION.empty.noSkills
}

export function getPromptLibraryEmptyTaskLabel(hasTasks: boolean): string {
  return hasTasks
    ? PROMPT_LIBRARY_PRESENTATION.empty.noMatchingTasks
    : PROMPT_LIBRARY_PRESENTATION.empty.noTasks
}

export function getPromptLibraryEditPromptAccessibilityLabel(
  promptName: string,
): string {
  return `Edit predefined prompt ${promptName}`
}

export function getPromptLibraryDeletePromptAccessibilityLabel(
  promptName: string,
): string {
  return `Delete predefined prompt ${promptName}`
}

export function getPromptLibraryShortcutAccessibilityLabel(
  source: PromptLibraryShortcutSource,
  title: string,
  action?: "add-prompt",
): string {
  if (action === "add-prompt") return PROMPT_LIBRARY_PRESENTATION.actions.addNewPrompt
  if (source === "task" || source === "loop") return `Run task ${title}`
  return `Insert ${PROMPT_LIBRARY_PRESENTATION.sourceLabels[source]} ${title}`
}

export function getPromptLibraryShortcutSourceLabel(
  source: PromptLibraryShortcutSource,
): string {
  return PROMPT_LIBRARY_PRESENTATION.sourceLabels[source]
}

export function getPromptLibraryShortcutAccessibilityHint(
  source: PromptLibraryShortcutSource,
  action?: "add-prompt",
): string {
  if (action === "add-prompt") return PROMPT_LIBRARY_PRESENTATION.mobile.addPromptHint
  if (source === "task" || source === "loop") return PROMPT_LIBRARY_PRESENTATION.mobile.taskHint
  return PROMPT_LIBRARY_PRESENTATION.mobile.insertItemHint
}

export function formatPromptLibraryDeletePromptWebConfirmMessage(
  promptName: string,
): string {
  return `Delete prompt "${promptName}"?`
}

export function formatPromptLibraryDeletePromptConfirmMessage(
  promptName: string,
): string {
  return `Delete "${promptName}" from your desktop prompt library?`
}

export function formatPromptLibraryTaskUnavailableMessage(
  taskName: string,
): string {
  return `Could not trigger "${taskName}" right now`
}

export function formatPromptLibraryTaskRunningToast(taskName: string): string {
  return `Running "${taskName}"...`
}

export function formatPromptLibraryTaskStartedMessage(taskName: string): string {
  return `Running "${taskName}" on desktop.`
}

export interface PromptLibraryCommandItem {
  id: string
  name: string
  description: string
  content?: string
  type: PromptLibraryCommandItemType
}

export type PromptLibraryShortcutAction = "add-prompt"

export interface PromptLibraryShortcutItem<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> {
  id: string
  title: string
  content: string
  description?: string
  source: PromptLibraryLauncherShortcutSource
  action?: PromptLibraryShortcutAction
  prompt?: TPrompt
  task?: TTask
}

export type PromptLibraryShortcutPressIntent<
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> =
  | { kind: "add-prompt" }
  | { kind: "run-task"; task: TTask }
  | { kind: "insert-content"; content: string }

export interface PromptLibraryShortcutInteractionItem {
  source: PromptLibraryLauncherShortcutSource
  action?: PromptLibraryShortcutAction
  task?: { id: string }
}

export interface PromptLibraryShortcutInteractionState {
  isAddPrompt: boolean
  isRunning: boolean
  isDisabled: boolean
  accessibilityState?: { disabled: true }
}

export interface PromptLibraryMobileShortcutPromptActionRenderState {
  icon: PromptLibraryMobileShortcutActionIconState
  iconColors: PromptLibraryMobileIconColors
  label: string
  accessibilityRole: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutActionButton.accessibilityRole
  accessibilityLabel: string
}

export interface PromptLibraryMobileShortcutPromptActionsRenderState {
  edit: PromptLibraryMobileShortcutPromptActionRenderState
  delete: PromptLibraryMobileShortcutPromptActionRenderState
}

export interface PromptLibraryMobileShortcutAddActionRenderState {
  icon: PromptLibraryMobileAddShortcutIconState
  iconColors: PromptLibraryMobileIconColors
}

export interface PromptLibraryMobileShortcutEmptyRenderState {
  label: string
}

export interface PromptLibraryMobileShortcutItemRenderState {
  interaction: PromptLibraryShortcutInteractionState
  sourceIcon: PromptLibraryMobileShortcutSourceIconState
  sourceIconColors: PromptLibraryMobileIconColors
  sourceLabel: string
  accessibilityRole: typeof PROMPT_LIBRARY_SURFACE_PRESENTATION.mobile.shortcutCard.accessibilityRole
  accessibilityLabel: string
  accessibilityHint: string
  addAction?: PromptLibraryMobileShortcutAddActionRenderState
  promptActions?: PromptLibraryMobileShortcutPromptActionsRenderState
}

export type SlashCommandInputState =
  | { mode: "inactive"; query: "" }
  | { mode: "active"; query: string }
  | { mode: "complete"; query: string }

export type PromptLibrarySearchText = string | null | undefined

export type PromptLibrarySearchTextGetter<TItem> = (
  item: TItem,
) => PromptLibrarySearchText | PromptLibrarySearchText[]

export function isSlashCommandPromptName(name: string): boolean {
  return /^\/\S+/.test(name.trim())
}

export function isSlashCommandPrompt(prompt: Pick<PredefinedPromptSummary, "name">): boolean {
  return isSlashCommandPromptName(prompt.name)
}

export function resolveSlashCommandInputState(text: string): SlashCommandInputState {
  if (!text.startsWith("/")) {
    return { mode: "inactive", query: "" }
  }

  const query = text.slice(1)
  if (query.includes(" ") || query.includes("\n")) {
    return { mode: "complete", query }
  }

  return { mode: "active", query }
}

export function getPromptLibraryPromptContent(prompt: PromptLibraryPromptLike): string {
  return prompt.content
}

export function getPromptLibraryPromptDescription(prompt: PromptLibraryPromptLike, maxLength?: number): string {
  const content = getPromptLibraryPromptContent(prompt)
  return typeof maxLength === "number" ? content.slice(0, maxLength) : content
}

export function getPromptLibrarySkillDescription(skill: PromptLibrarySkillLike): string {
  return skill.description?.trim() || PREDEFINED_PROMPT_SKILL_FALLBACK_DESCRIPTION
}

export function getPromptLibrarySkillContent(skill: PromptLibrarySkillLike): string {
  const instructions = skill.instructions?.trim()
  if (instructions) return instructions

  const description = skill.description?.trim()
  return `Use the "${skill.name}" skill for this request.${description ? `\n\n${description}` : ""}`
}

export function getPromptLibraryTaskContent(task: PromptLibraryTaskLike): string {
  return task.prompt?.trim() || ""
}

export function getPromptLibraryTaskDescription(
  task: PromptLibraryTaskLike,
  fallbackDescription: string = PREDEFINED_PROMPT_TASK_FALLBACK_DESCRIPTION,
): string {
  return getPromptLibraryTaskContent(task) || fallbackDescription
}

function promptLibrarySearchTextMatches(value: PromptLibrarySearchText, normalizedQuery: string): boolean {
  return typeof value === "string" && value.toLowerCase().includes(normalizedQuery)
}

export function filterPromptLibraryItemsByQuery<TItem>(
  items: readonly TItem[],
  searchQuery: string,
  getSearchText: PromptLibrarySearchTextGetter<TItem>,
): TItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  if (!normalizedQuery) return [...items]

  return items.filter((item) => {
    const searchText = getSearchText(item)
    const values = Array.isArray(searchText) ? searchText : [searchText]
    return values.some((value) => promptLibrarySearchTextMatches(value, normalizedQuery))
  })
}

export interface BuildPromptLibraryCommandItemsOptions<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string } = PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string } = PromptLibraryTaskLike & { id: string; name: string },
> {
  prompts?: readonly TPrompt[]
  skills?: readonly TSkill[]
  tasks?: readonly TTask[]
  promptDescriptionMaxLength?: number
  getTaskDescription?: (task: TTask) => string
}

export interface BuildPromptLibraryShortcutItemsOptions<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string } = PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string } = PromptLibraryTaskLike & { id: string; name: string },
> {
  prompts?: readonly TPrompt[]
  skills?: readonly TSkill[]
  tasks?: readonly TTask[]
  canAddPrompt?: boolean
  addPromptTitle?: string
  addPromptDescription?: string
  taskDescriptionFallback?: string
}

export function buildPromptLibraryCommandItems<
  TPrompt extends PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>(
  options: BuildPromptLibraryCommandItemsOptions<TPrompt, TSkill, TTask>,
): PromptLibraryCommandItem[] {
  const promptDescriptionMaxLength = options.promptDescriptionMaxLength ?? 80
  const prompts = (options.prompts ?? []).map((prompt) => ({
    id: prompt.id,
    name: prompt.name,
    description: getPromptLibraryPromptDescription(prompt, promptDescriptionMaxLength),
    content: getPromptLibraryPromptContent(prompt),
    type: "prompt" as const,
  }))
  const skills = (options.skills ?? []).map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: getPromptLibrarySkillDescription(skill),
    content: getPromptLibrarySkillContent(skill),
    type: "skill" as const,
  }))
  const tasks = (options.tasks ?? []).map((task) => ({
    id: task.id,
    name: task.name,
    description: options.getTaskDescription?.(task) ?? getPromptLibraryTaskDescription(task),
    type: "loop" as const,
  }))

  return [...prompts, ...skills, ...tasks]
}

export function filterPromptLibraryCommandItems(
  items: readonly PromptLibraryCommandItem[],
  searchQuery: string,
): PromptLibraryCommandItem[] {
  return filterPromptLibraryItemsByQuery(items, searchQuery, (item) => [
    item.name,
    item.description,
  ])
}

export function buildPromptLibraryShortcutItems<
  TPrompt extends PredefinedPromptSummary,
  TSkill extends PromptLibrarySkillLike & { id: string },
  TTask extends PromptLibraryTaskLike & { id: string; name: string },
>(
  options: BuildPromptLibraryShortcutItemsOptions<TPrompt, TSkill, TTask>,
): PromptLibraryShortcutItem<TPrompt, TTask>[] {
  const prompts = (options.prompts ?? []).map((prompt) => ({
    id: prompt.id,
    title: prompt.name,
    content: getPromptLibraryPromptContent(prompt),
    description: getPromptLibraryPromptDescription(prompt),
    source: isSlashCommandPrompt(prompt) ? "command" as const : "saved-prompt" as const,
    prompt,
  }))

  const skills = (options.skills ?? []).map((skill) => ({
    id: `skill-${skill.id}`,
    title: skill.name,
    content: getPromptLibrarySkillContent(skill),
    description: skill.description || skill.instructions || getPromptLibrarySkillDescription(skill),
    source: "skill" as const,
  }))

  const tasks = (options.tasks ?? []).map((task) => ({
    id: `task-${task.id}`,
    title: task.name,
    content: getPromptLibraryTaskContent(task),
    description: getPromptLibraryTaskDescription(task, options.taskDescriptionFallback),
    source: "task" as const,
    task,
  }))

  const addPromptItem: PromptLibraryShortcutItem<TPrompt, TTask>[] = options.canAddPrompt ? [{
    id: "action-add-prompt",
    title: options.addPromptTitle ?? PROMPT_LIBRARY_PRESENTATION.mobile.addPromptTitle,
    content: "",
    description: options.addPromptDescription ?? PROMPT_LIBRARY_PRESENTATION.mobile.addPromptDescription,
    source: "action",
    action: "add-prompt",
  }] : []

  return [
    ...prompts,
    ...skills,
    ...tasks,
    ...addPromptItem,
  ]
}

export function getPromptLibraryShortcutPressIntent<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>(
  item: PromptLibraryShortcutItem<TPrompt, TTask>,
): PromptLibraryShortcutPressIntent<TTask> {
  if (item.action === "add-prompt") return { kind: "add-prompt" }
  if (item.source === "task" && item.task) return { kind: "run-task", task: item.task }
  return { kind: "insert-content", content: item.content }
}

export function getPromptLibraryShortcutInteractionState(
  item: PromptLibraryShortcutInteractionItem,
  runningTaskId?: string | null,
): PromptLibraryShortcutInteractionState {
  const isAddPrompt = item.action === "add-prompt"
  const isRunning =
    item.source === "task" &&
    typeof runningTaskId === "string" &&
    runningTaskId.length > 0 &&
    item.task?.id === runningTaskId

  return {
    isAddPrompt,
    isRunning,
    isDisabled: isRunning,
    accessibilityState: isRunning ? { disabled: true } : undefined,
  }
}

export function getPromptLibraryMobileShortcutPromptActionsRenderState(
  title: string,
  shortcutRenderState: PromptLibraryMobileShortcutRenderState,
): PromptLibraryMobileShortcutPromptActionsRenderState {
  return {
    edit: {
      icon: shortcutRenderState.chrome.editIcon,
      iconColors: shortcutRenderState.chrome.editIconColors,
      label: shortcutRenderState.copy.editLabel,
      accessibilityRole: shortcutRenderState.surface.shortcutActionButton.accessibilityRole,
      accessibilityLabel: getPromptLibraryEditPromptAccessibilityLabel(title),
    },
    delete: {
      icon: shortcutRenderState.chrome.deleteIcon,
      iconColors: shortcutRenderState.chrome.deleteIconColors,
      label: shortcutRenderState.copy.deleteLabel,
      accessibilityRole: shortcutRenderState.surface.shortcutActionButton.accessibilityRole,
      accessibilityLabel: getPromptLibraryDeletePromptAccessibilityLabel(title),
    },
  }
}

export function getPromptLibraryMobileShortcutEmptyRenderState(
  shortcutRenderState: PromptLibraryMobileShortcutRenderState,
  isLoading: boolean,
): PromptLibraryMobileShortcutEmptyRenderState {
  return {
    label: isLoading ? shortcutRenderState.copy.loadingLabel : shortcutRenderState.copy.emptyLabel,
  }
}

export function getPromptLibraryMobileShortcutItemRenderState<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>(
  item: PromptLibraryShortcutItem<TPrompt, TTask>,
  shortcutRenderState: PromptLibraryMobileShortcutRenderState,
  runningTaskId?: string | null,
): PromptLibraryMobileShortcutItemRenderState {
  const interaction = getPromptLibraryShortcutInteractionState(item, runningTaskId)

  return {
    interaction,
    sourceIcon: shortcutRenderState.chrome.sourceIcons[item.source],
    sourceIconColors: shortcutRenderState.chrome.sourceIconColors[item.source],
    sourceLabel: getPromptLibraryShortcutSourceLabel(item.source),
    accessibilityRole: shortcutRenderState.surface.shortcutCard.accessibilityRole,
    accessibilityLabel: createButtonAccessibilityLabel(
      getPromptLibraryShortcutAccessibilityLabel(item.source, item.title, item.action),
    ),
    accessibilityHint: getPromptLibraryShortcutAccessibilityHint(item.source, item.action),
    ...(interaction.isAddPrompt
      ? {
          addAction: {
            icon: shortcutRenderState.chrome.addIcon,
            iconColors: shortcutRenderState.chrome.addIconColors,
          },
        }
      : {}),
    ...(item.prompt
      ? { promptActions: getPromptLibraryMobileShortcutPromptActionsRenderState(item.title, shortcutRenderState) }
      : {}),
  }
}

export function createPredefinedPromptId(now: number, random: () => number = Math.random): string {
  return `prompt-${now}-${random().toString(36).slice(2, 11)}`
}

export function isPromptLibraryEditorSaveDisabled(
  draft: PredefinedPromptDraft,
  isSaving = false,
): boolean {
  return !draft.name.trim() || !draft.content.trim() || isSaving
}

export function createPredefinedPromptRecord(
  draft: PredefinedPromptDraft,
  now: number = Date.now(),
  createId: PredefinedPromptIdGenerator = createPredefinedPromptId,
): PredefinedPromptSummary {
  return {
    id: createId(now),
    name: draft.name.trim(),
    content: draft.content.trim(),
    createdAt: now,
    updatedAt: now,
  }
}

export function updatePredefinedPromptRecord(
  prompt: PredefinedPromptSummary,
  draft: PredefinedPromptDraft,
  now: number = Date.now(),
): PredefinedPromptSummary {
  return {
    ...prompt,
    name: draft.name.trim(),
    content: draft.content.trim(),
    updatedAt: now,
  }
}

export function updatePredefinedPromptList(
  prompts: readonly PredefinedPromptSummary[],
  promptId: string,
  draft: PredefinedPromptDraft,
  now: number = Date.now(),
): PredefinedPromptSummary[] {
  return prompts.map((prompt) =>
    prompt.id === promptId
      ? updatePredefinedPromptRecord(prompt, draft, now)
      : prompt
  )
}

export function deletePredefinedPromptFromList(
  prompts: readonly PredefinedPromptSummary[],
  promptId: string,
): PredefinedPromptSummary[] {
  return prompts.filter((prompt) => prompt.id !== promptId)
}

export function sortPredefinedPromptsByUpdatedAt(
  prompts: readonly PredefinedPromptSummary[],
): PredefinedPromptSummary[] {
  return [...prompts].sort((a, b) => b.updatedAt - a.updatedAt)
}
