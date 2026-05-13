import { createExpandCollapseAccessibilityLabel } from "./accessibility-utils"
import { hexToRgba } from "./colors"

export type ToolExecutionDisplayState = "idle" | "pending" | "success" | "error"
export type ToolExecutionCallDisplayState = Exclude<ToolExecutionDisplayState, "idle">
export type ToolExecutionResolvedDisplayState = Extract<ToolExecutionDisplayState, "success" | "error">
export type ToolExecutionStatusIconState = Exclude<ToolExecutionDisplayState, "pending">
export type ToolExecutionStatusColorToken = "info" | "success" | "destructive" | "mutedForeground"
export type ToolExecutionSurfaceColorToken = ToolExecutionStatusColorToken | "primary" | "foreground" | "muted"
export type ToolExecutionStatusColorPalette = Readonly<Record<ToolExecutionStatusColorToken, string>>
export type ToolExecutionSurfaceColorPalette = Readonly<Record<ToolExecutionSurfaceColorToken, string>>
export type ToolExecutionCopyKind = "input" | "output" | "error"
export type ToolExecutionDetailDesktopPayloadTone = "neutral" | "success" | "error" | "approval"

export interface ToolExecutionCompactMobileToolIconState {
  name: typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toolIcon.name
  size: number
  opacity: number
}

export interface ToolExecutionCompactMobileStatusIconState {
  state: ToolExecutionStatusIconState
  name:
    | typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.idleName
    | typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.successName
    | typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.errorName
  size: number
  opacity: number
}

export interface ToolExecutionCompactMobilePendingSpinnerState {
  size: number
  opacity: number
}

export interface ToolExecutionCompactMobileToggleIconState {
  name: typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon.name
  size: number
  colorToken: typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon.colorToken
  opacity: number
}

export interface ToolExecutionCompactMobileStatusColors {
  color: string
  toolIconColor: string
  pendingSpinnerColor: string
  statusIconColor: string
}

export interface ToolExecutionCompactMobileToggleIconColors {
  color: string
}

export interface ToolExecutionCompactMobileColoredIconState {
  name:
    | ToolExecutionCompactMobileToolIconState["name"]
    | ToolExecutionCompactMobileStatusIconState["name"]
    | ToolExecutionCompactMobileToggleIconState["name"]
  size: number
  color: string
}

export interface ToolExecutionCompactMobileSpinnerRenderState {
  shouldRender: boolean
  size: number
  color: string
}

export type ToolExecutionStatusMobileColorMap = Record<ToolExecutionDisplayState, string>

export interface ToolExecutionCompactMobileStatusIconRenderState extends ToolExecutionCompactMobileColoredIconState {
  shouldRender: boolean
  state: ToolExecutionStatusIconState
}

export interface ToolExecutionCompactMobileRenderStateInput {
  state: ToolExecutionCallDisplayState
  preview: string
  colors: ToolExecutionStatusColorPalette
}

export interface ToolExecutionCompactMobileRenderState {
  state: ToolExecutionCallDisplayState
  copy: (typeof TOOL_EXECUTION_STATUS_PRESENTATION)[ToolExecutionCallDisplayState]
  surface: typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile
  preview: string
  accessibilityLabel: string
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  name: {
    numberOfLines: typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.name.numberOfLines
    ellipsizeMode: typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.name.ellipsizeMode
  }
  toolIcon: ToolExecutionCompactMobileColoredIconState
  statusIndicator: {
    spinner: ToolExecutionCompactMobileSpinnerRenderState
    icon: ToolExecutionCompactMobileStatusIconRenderState
  }
  toggleIcon: ToolExecutionCompactMobileColoredIconState
}

export interface ToolExecutionCompactMobileStyleRenderStateInput {
  colors: ToolExecutionStatusColorPalette
}

export interface ToolExecutionCompactMobileStyleRenderState {
  surface: typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile
  statusColors: ToolExecutionStatusMobileColorMap
}

export type ToolExecutionDetailMobileToggleIconPlacement = "header" | "collapse"

export interface ToolExecutionDetailMobileToggleIconStateInput {
  isExpanded?: boolean
  placement?: ToolExecutionDetailMobileToggleIconPlacement
}

export interface ToolExecutionDetailMobileToggleIconState {
  isExpanded: boolean
  placement: ToolExecutionDetailMobileToggleIconPlacement
  name:
    | typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.collapsedName
    | typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.expandedName
    | typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.collapseName
  size: number
  colorToken: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.colorToken
  opacity: number
}

export interface ToolExecutionDetailMobileCopyIconState {
  name: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon.name
  size: number
  colorToken: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon.colorToken
  opacity: number
}

export interface ToolExecutionDetailMobileBadgeIconState {
  state: ToolExecutionResolvedDisplayState
  name:
    | typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.successName
    | typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.errorName
  size: number
  opacity: number
}

export interface ToolExecutionDetailMobilePendingSpinnerState {
  size: number
  colorToken: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingSpinner.colorToken
}

export interface ToolExecutionDetailMobileToggleIconColors {
  color: string
}

export interface ToolExecutionDetailMobilePendingSpinnerColors {
  color: string
}

export interface ToolExecutionDetailMobilePendingResultRenderStateInput {
  colors: ToolExecutionStatusColorPalette
}

export interface ToolExecutionDetailMobilePendingResultRenderState {
  label: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.pendingResultLabel
  accessibilityRole: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingRow.accessibilityRole
  accessibilityLabel: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.pendingResponseAccessibilityLabel
  spinner: {
    size: ToolExecutionDetailMobilePendingSpinnerState["size"]
    color: string
  }
}

export interface ToolExecutionDetailMobileEmptyStateRenderState {
  label: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.noToolCallsLabel
  accessibilityRole: "text"
  accessibilityLabel: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.noToolCallsLabel
}

export interface ToolExecutionResultOnlyFallbackRenderState {
  label: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.toolResultFallbackLabel
}

export interface ToolExecutionDetailCopyFailureAlertState {
  title: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.copyFailedTitle
  fallbackMessage: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.copyFailedMessage
}

export interface ToolExecutionDetailMobileSectionHeaderRenderStateInput {
  kind: ToolExecutionCopyKind
  payload?: ToolExecutionStructuredPayloadValue | null
}

export interface ToolExecutionDetailMobileSectionHeaderRenderState {
  kind: ToolExecutionCopyKind
  label: string
  payloadTypeLabel: string | null
}

export interface ToolExecutionDetailMobilePayloadPreviewState {
  numberOfLines: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.payloadPreview.maxLines
}

export interface ToolExecutionDetailMobilePayloadPreviewColors {
  backgroundColor: string
  color: string
}

export interface ToolExecutionDetailMobileCopyButtonColors {
  backgroundColor: string
  textColor: string
  iconColor: string
}

export interface ToolExecutionDetailMobileBadgeColors {
  backgroundColor: string
  color: string
  iconColor: string
}

export interface ToolExecutionDetailMobileColoredIconState {
  name:
    | ToolExecutionDetailMobileToggleIconState["name"]
    | ToolExecutionDetailMobileBadgeIconState["name"]
    | ToolExecutionDetailMobileCopyIconState["name"]
  size: number
  color: string
}

export interface ToolExecutionDetailMobileCopyButtonRenderStateInput {
  kind: ToolExecutionCopyKind
  toolName: string
  colors: ToolExecutionStatusColorPalette
}

export interface ToolExecutionDetailMobileCopyButtonRenderState {
  kind: ToolExecutionCopyKind
  label: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.copyLabel
  accessibilityRole: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButton.accessibilityRole
  accessibilityLabel: string
  colors: ToolExecutionDetailMobileCopyButtonColors
  icon: ToolExecutionDetailMobileColoredIconState
}

export interface ToolExecutionDetailMobileHeaderRenderStateInput {
  toolName: string
  isExpanded: boolean
  resultState: ToolExecutionResolvedDisplayState
  colors: ToolExecutionStatusColorPalette
}

export interface ToolExecutionDetailMobileHeaderRenderState {
  isExpanded: boolean
  accessibilityRole: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.header.accessibilityRole
  accessibilityLabel: string
  accessibilityHint: string
  accessibilityState: {
    expanded: boolean
  }
  ariaExpanded: boolean
  toggleLabel: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.collapseLabel | typeof TOOL_EXECUTION_DETAIL_PRESENTATION.detailsLabel
  toggleIcon: ToolExecutionDetailMobileColoredIconState
  resultBadge: {
    state: ToolExecutionResolvedDisplayState
    label: (typeof TOOL_EXECUTION_STATUS_PRESENTATION)[ToolExecutionResolvedDisplayState]["label"]
    accessibilityRole: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badge.accessibilityRole
    accessibilityLabel: string
    isSuccess: boolean
    isError: boolean
    colors: ToolExecutionDetailMobileBadgeColors
    icon: ToolExecutionDetailMobileColoredIconState
  }
}

export interface ToolExecutionDetailMobileExpandControlRenderState {
  isExpanded: false
  accessibilityRole: "button"
  accessibilityLabel: string
  accessibilityHint: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.expandExecutionHint
  accessibilityState: {
    expanded: false
  }
  ariaExpanded: false
}

export type ToolExecutionDetailMobileCollapseControlPlacement = "top" | "bottom"

export interface ToolExecutionDetailMobileCollapseControlRenderStateInput {
  placement?: ToolExecutionDetailMobileCollapseControlPlacement
  toolCallCount?: number
  colors: ToolExecutionStatusColorPalette
}

export interface ToolExecutionDetailMobileCollapseControlRenderState {
  placement: ToolExecutionDetailMobileCollapseControlPlacement
  accessibilityRole: "button"
  accessibilityLabel: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.collapseExecutionAccessibilityLabel
  accessibilityHint: typeof TOOL_EXECUTION_DETAIL_PRESENTATION.collapseExecutionHint
  label: string
  icon: ToolExecutionDetailMobileColoredIconState
}

export interface ToolExecutionDetailMobileErrorColors {
  backgroundColor: string
  color: string
}

export interface ToolExecutionDetailMobileContentColors {
  section: {
    borderBottomColor: string
  }
  toolName: {
    color: string
  }
  expandHintText: {
    color: string
  }
  sectionLabel: {
    color: string
  }
  payloadType: {
    color: string
  }
  codeBlock: {
    color: string
    backgroundColor: string
  }
  pendingText: {
    color: string
  }
  characterCount: {
    color: string
  }
}

export interface ToolExecutionDetailMobileCardColors {
  borderLeftColor: string
  backgroundColor: string
}

export interface ToolExecutionDetailMobileStyleColors {
  payloadPreview: ToolExecutionDetailMobilePayloadPreviewColors
  copyButton: ToolExecutionDetailMobileCopyButtonColors
  badge: Record<ToolExecutionResolvedDisplayState, ToolExecutionDetailMobileBadgeColors>
  error: ToolExecutionDetailMobileErrorColors
  content: ToolExecutionDetailMobileContentColors
  byState: Record<ToolExecutionDisplayState, ToolExecutionDetailMobileCardColors>
}

export interface ToolExecutionDetailMobileStyleRenderStateInput {
  colors: ToolExecutionSurfaceColorPalette
}

export interface ToolExecutionDetailMobileStyleRenderState {
  surface: typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile
  payloadPreview: ToolExecutionDetailMobilePayloadPreviewState
  colors: ToolExecutionDetailMobileStyleColors
}

export interface ToolExecutionDisplayResultLike {
  success?: boolean
}

export interface ToolExecutionDetailResultLike extends ToolExecutionDisplayResultLike {
  content?: string | null
  error?: string | null
}

export interface ToolExecutionSummaryDisplayState {
  state: ToolExecutionDisplayState
  hasResults: boolean
  allSuccess: boolean
  hasErrors: boolean
  isPending: boolean
}

export interface ToolExecutionDetailArgumentsState {
  hasArguments: boolean
  content: string
  preview: string
  payload: ToolExecutionStructuredPayloadValue | null
}

export interface ToolExecutionDetailResultState {
  hasResult: boolean
  isPending: boolean
  content: string
  payload: ToolExecutionStructuredPayloadValue | null
  state: ToolExecutionResolvedDisplayState
  characterCountLabel: string
  error: string | null
}

export const TOOL_EXECUTION_STATUS_PRESENTATION = {
  idle: {
    label: "Tool",
    compactLabel: "Tool",
  },
  pending: {
    label: "Waiting",
    compactLabel: "...",
  },
  success: {
    label: "Success",
    compactLabel: "OK",
  },
  error: {
    label: "Error",
    compactLabel: "ERR",
  },
} as const satisfies Record<ToolExecutionDisplayState, {
  label: string
  compactLabel: string
}>

export type ToolExecutionCountKind = "tool_call" | "tool_result" | "tool_activity"

export const TOOL_EXECUTION_DETAIL_PRESENTATION = {
  inputLabel: "Input",
  outputLabel: "Output",
  errorDetailsLabel: "Error details",
  noContentReturnedLabel: "No content returned",
  noToolCallsLabel: "No tool calls",
  toolResultFallbackLabel: "Tool result",
  copyLabel: "Copy",
  copyGlyph: "⧉",
  copyInputLabel: "Copy input",
  copyOutputLabel: "Copy output",
  copyErrorLabel: "Copy error details",
  copyFailedTitle: "Copy Failed",
  copyFailedMessage: "Could not copy this tool payload.",
  collapseLabel: "Collapse",
  detailsLabel: "Details",
  pendingResultLabel: "Waiting...",
  pendingResponseAccessibilityLabel: "Waiting for response",
  characterCountLabel: "chars",
  expandExecutionAccessibilityName: "tool execution details",
  expandExecutionHint: "Expands this tool execution summary",
  collapseExecutionAccessibilityLabel: "Collapse tool execution details",
  collapseExecutionHint: "Collapse back to compact view",
  toolDetailsAccessibilitySuffix: "tool details",
  expandDetailsHint: "Expand to show full input and output",
  collapseDetailsHint: "Collapse tool details",
} as const

export const TOOL_EXECUTION_COMPACT_PRESENTATION = {
  desktop: {
    statusTextClassNames: {
      idle: "text-sky-700 dark:text-sky-300",
      pending: "text-blue-600 dark:text-blue-400",
      success: "text-green-600 dark:text-green-400",
      error: "text-red-600 dark:text-red-400",
    },
    previewListClassName: "space-y-0.5 text-xs",
    previewButtonClassName: "flex w-full min-w-0 appearance-none items-center gap-1.5 overflow-hidden whitespace-nowrap rounded border-0 bg-transparent px-1 py-0.5 text-left text-[11px] cursor-pointer transition-colors hover:bg-muted/30",
    previewNameClassName: "min-w-0 flex-1 truncate whitespace-nowrap font-mono font-medium",
    previewStatusIconContainerClassName: "shrink-0 text-[10px] opacity-60",
    previewStatusIconClassName: "h-2.5 w-2.5",
    previewPendingIconClassName: "h-2.5 w-2.5 animate-spin",
    previewToggleIconClassName: "h-2.5 w-2.5 opacity-40 flex-shrink-0 transition-transform",
    rowClassName: "px-1 py-0.5",
    tileRowClassName: "px-1.5 py-0.5",
    detailListClassName: "mt-1 ml-3 space-y-1 border-l border-border/50 pl-2",
    detailItemClassName: "text-[10px] space-y-1",
    detailSectionLabelClassName: "min-w-0 font-medium opacity-70",
    detailResultStatusClassName: "min-w-0 flex-1 font-medium",
    detailCharacterCountClassName: "shrink-0 whitespace-nowrap opacity-50 text-[10px]",
    pendingResponseClassName: "text-[10px] opacity-60 italic py-1 flex items-center gap-1",
    pendingResponseIconClassName: "h-2.5 w-2.5 animate-spin",
  },
  mobile: {
    container: {
      paddingVertical: 1,
      paddingHorizontal: 2,
      borderRadius: "sm",
      gap: 1,
    },
    line: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 1,
      overflow: "hidden",
    },
    pressedOpacity: 0.7,
    iconCell: {
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    toolIcon: {
      name: "construct-outline",
      size: 11,
      width: 14,
      opacity: 0.82,
    },
    statusIcon: {
      idleName: "ellipse-outline",
      successName: "checkmark-circle-outline",
      errorName: "close-circle-outline",
      size: 11,
      width: 14,
      opacity: 0.9,
    },
    pendingSpinner: {
      size: 10,
      width: 14,
    },
    toggleIcon: {
      name: "chevron-forward",
      size: 11,
      width: 12,
      colorToken: "mutedForeground",
      opacity: 0.5,
    },
    name: {
      numberOfLines: 1,
      ellipsizeMode: "tail",
      fontSize: 10,
      fontWeight: "500",
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      flexShrink: 1,
      minWidth: 0,
    },
    status: {
      fontSize: 9,
      fontWeight: "700",
      minWidth: 22,
      textAlign: "right",
    },
    statusColorTokens: {
      idle: "mutedForeground",
      pending: "info",
      success: "success",
      error: "destructive",
    },
  },
} as const satisfies {
  desktop: {
    statusTextClassNames: Record<ToolExecutionDisplayState, string>
    previewListClassName: string
    previewButtonClassName: string
    previewNameClassName: string
    previewStatusIconContainerClassName: string
    previewStatusIconClassName: string
    previewPendingIconClassName: string
    previewToggleIconClassName: string
    rowClassName: string
    tileRowClassName: string
    detailListClassName: string
    detailItemClassName: string
    detailSectionLabelClassName: string
    detailResultStatusClassName: string
    detailCharacterCountClassName: string
    pendingResponseClassName: string
    pendingResponseIconClassName: string
  }
  mobile: {
    container: {
      paddingVertical: number
      paddingHorizontal: number
      borderRadius: "sm" | "md" | "lg" | "xl"
      gap: number
    }
    line: {
      flexDirection: "row"
      alignItems: "center"
      gap: number
      paddingVertical: number
      overflow: "hidden" | "visible" | "scroll"
    }
    pressedOpacity: number
    iconCell: {
      alignItems: "center"
      justifyContent: "center"
      flexShrink: number
    }
    toolIcon: {
      name: string
      size: number
      width: number
      opacity: number
    }
    statusIcon: {
      idleName: string
      successName: string
      errorName: string
      size: number
      width: number
      opacity: number
    }
    pendingSpinner: {
      size: number
      width: number
    }
    toggleIcon: {
      name: string
      size: number
      width: number
      colorToken: ToolExecutionStatusColorToken
      opacity: number
    }
    name: {
      numberOfLines: number
      ellipsizeMode: "head" | "middle" | "tail" | "clip"
      fontSize: number
      fontWeight: string
      fontFamilyByPlatform: {
        ios: string
        default: string
      }
      flexShrink: number
      minWidth: number
    }
    status: {
      fontSize: number
      fontWeight: string
      minWidth: number
      textAlign: "left" | "right" | "center"
    }
    statusColorTokens: Record<ToolExecutionDisplayState, ToolExecutionStatusColorToken>
  }
}

export const TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION = {
  desktop: {
    detailListClassName: "mt-1 ml-3 space-y-1 border-l border-border/50 pl-2",
    tileDetailListClassName: "mb-1 ml-3 mt-0.5 space-y-1 border-l border-border/50 pl-2 text-[10px]",
    detailHeaderClassName: "flex flex-wrap items-center justify-between gap-1.5",
    messageExtrasContainerClassName: "mt-2 space-y-2 text-left",
    messageExtrasSectionClassName: "space-y-2",
    messageExtrasHeadingClassName: "text-xs font-semibold opacity-70",
    messageExtrasSectionLabelClassName: "mb-1 text-xs font-medium opacity-70",
    messageExtrasErrorLabelClassName: "text-xs font-medium text-destructive mb-1",
    toolCallCardClassName: "rounded-lg border border-border/30 bg-muted/20 p-2 text-xs",
    toolCallHeaderClassName: "mb-1 flex flex-wrap items-center gap-2",
    toolCallNameClassName: "min-w-0 flex-1 truncate font-mono font-semibold text-primary",
    compactBadgeClassName: "shrink-0 whitespace-nowrap text-xs",
    resultHeaderClassName: "mb-1 flex flex-wrap items-center gap-2",
    resultStatusClassName: "flex min-w-0 flex-1 items-center gap-1 font-semibold",
    resultStatusIconClassName: "h-3 w-3",
    resultMetaClassName: "ml-auto flex shrink-0 flex-wrap items-center gap-2",
    resultCharacterCountClassName: "whitespace-nowrap font-mono text-[10px] opacity-60",
    resultBodyClassName: "space-y-2",
    emptyBlockClassName: "rounded p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px] bg-muted/40",
    errorBlockClassName: "rounded p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px] bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-300",
    resultOutputBlockClassName: "rounded bg-muted/30 p-2 text-xs whitespace-pre-wrap break-words overflow-x-auto overflow-y-auto max-w-full max-h-80 scrollbar-thin",
    resultErrorBlockClassName: "rounded bg-destructive/10 p-2 text-xs whitespace-pre-wrap break-words overflow-x-auto overflow-y-auto max-w-full max-h-60 scrollbar-thin",
    toolCallPayloadMaxHeightClassName: "max-h-80",
    resultCardBaseClassName: "rounded-lg border p-2 text-xs",
    resultCardStatusClassNames: {
      success: "border-green-200/50 bg-green-50/30 text-green-800 dark:border-green-700/50 dark:bg-green-950/40 dark:text-green-200",
      error: "border-red-200/50 bg-red-50/30 text-red-800 dark:border-red-700/50 dark:bg-red-950/40 dark:text-red-200",
    },
    structuredPayloadFallbackBaseClassName: "overflow-hidden rounded",
    structuredPayloadFallbackToneClassNames: {
      neutral: "bg-muted/40 text-foreground",
      success: "bg-green-50/50 text-foreground dark:bg-green-950/30",
      error: "bg-red-50/50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
      approval: "bg-amber-100/70 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
    },
    structuredPayloadEntryListClassName: "space-y-1.5",
    structuredPayloadEntryBaseClassName: "overflow-hidden rounded-md border",
    structuredPayloadEntryToneClassNames: {
      neutral: "border-border/40 bg-background/40 dark:bg-muted/20",
      success: "border-green-200/70 bg-green-50/50 dark:border-green-900/60 dark:bg-green-950/30",
      error: "border-red-200/70 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/30",
      approval: "border-amber-200/70 bg-amber-100/30 dark:border-amber-800/60 dark:bg-amber-900/15",
    },
    structuredPayloadEntryHeaderClassName: "flex items-center justify-between gap-2 border-b px-2 py-1",
    structuredPayloadEntryHeaderBorderClassNames: {
      neutral: "border-border/30",
      success: "border-green-200/60 dark:border-green-900/50",
      error: "border-red-200/60 dark:border-red-900/50",
      approval: "border-amber-200/60 dark:border-amber-800/50",
    },
    structuredPayloadEntryTextClassNames: {
      neutral: "text-foreground",
      success: "text-foreground",
      error: "text-red-700 dark:text-red-300",
      approval: "text-amber-950 dark:text-amber-100",
    },
    structuredPayloadEntryKeyClassName: "min-w-0 truncate font-mono text-[10px] font-semibold",
    structuredPayloadEntryTypeClassName: "shrink-0 text-[9px] uppercase tracking-wide opacity-50",
    structuredPayloadTreeEmptyClassName: "px-2 py-1.5 font-mono text-[10px] leading-relaxed break-words",
    structuredPayloadTreeContainerClassName: "max-w-full overflow-x-auto overflow-y-auto border-t px-2 py-1.5 scrollbar-thin",
    structuredPayloadTreeListClassName: "space-y-1",
    structuredPayloadTreeEntryClassName: "flex min-w-0 items-start gap-2 rounded border border-border/30 bg-background/30 px-2 py-1",
    structuredPayloadTreeEntryLabelClassName: "w-20 shrink-0 truncate font-mono text-[9px] leading-5 opacity-60",
    structuredPayloadTreeEntryValueClassName: "min-w-0 flex-1",
    structuredPayloadDetailsClassName: "group",
    structuredPayloadSummaryClassName: "flex cursor-pointer list-none items-center gap-1.5 font-mono text-[10px] leading-relaxed [&::-webkit-details-marker]:hidden",
    structuredPayloadNestedSpacingClassName: "py-0.5",
    structuredPayloadDefaultSpacingClassName: "px-2 py-1.5",
    structuredPayloadToggleIconClassName: "h-2.5 w-2.5 shrink-0 opacity-50 transition-transform group-open:rotate-90",
    structuredPayloadSummaryTextClassName: "min-w-0 flex-1 truncate",
    structuredPayloadLineCountClassName: "shrink-0 text-[9px] uppercase tracking-wide opacity-50",
    structuredPayloadExpandedBlockClassName: "max-w-full overflow-x-auto overflow-y-auto border-t p-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words scrollbar-thin",
    structuredPayloadInlineClassName: "font-mono text-[10px] leading-relaxed break-words",
    structuredPayloadBlockClassName: "max-w-full overflow-x-auto overflow-y-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words scrollbar-thin",
    structuredPayloadBlockDefaultSpacingClassName: "p-2",
    compactPayloadMaxHeightClassName: "max-h-52",
    copyButtonClassName: "h-5 shrink-0 px-1.5 text-[10px]",
    copyIconClassName: "h-2 w-2 mr-0.5",
  },
  mobile: {
    expandedContainer: {
      position: "relative",
    },
    collapseButton: {
      topMarginBottom: 4,
      bottomMarginTop: 4,
    },
    toggleIcon: {
      collapsedName: "chevron-forward",
      expandedName: "chevron-down",
      collapseName: "chevron-up",
      size: 12,
      colorToken: "mutedForeground",
      opacity: 0.72,
    },
    card: {
      marginTop: 2,
      borderRadius: "sm",
      borderLeftWidth: 1.5,
      borderAlpha: 0.5,
      backgroundAlpha: 0.02,
      overflow: "hidden",
      statusColorTokens: {
        idle: "mutedForeground",
        pending: "info",
        success: "success",
        error: "destructive",
      },
    },
    section: {
      marginBottom: "xs",
      paddingBottom: "xs",
      borderBottomWidth: 0.5,
      borderColorToken: "mutedForeground",
      borderBottomAlpha: 0.15,
    },
    blockSection: {
      paddingHorizontal: "xs",
      paddingVertical: 2,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: "xs",
      marginBottom: "xs",
      minHeight: 44,
      accessibilityRole: "button",
      pressedOpacity: 0.7,
    },
    toolName: {
      fontSize: 10,
      fontWeight: "600",
      colorToken: "primary",
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      flex: 1,
    },
    expandHint: {
      flexDirection: "row",
      alignItems: "center",
      fontSize: 9,
      fontWeight: "500",
      colorToken: "mutedForeground",
      gap: 2,
    },
    sectionLabel: {
      fontSize: 8,
      fontWeight: "600",
      colorToken: "mutedForeground",
      marginBottom: 2,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    scroll: {
      collapsedMaxHeight: 80,
      expandedMaxHeight: 400,
      borderRadius: "sm",
      overflow: "hidden",
    },
    codeBlock: {
      fontSize: 8,
      foregroundColorToken: "foreground",
      backgroundColorToken: "muted",
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      padding: 3,
      borderRadius: "sm",
    },
    pendingText: {
      fontSize: 9,
      colorToken: "mutedForeground",
      fontStyle: "italic",
      textAlign: "center",
      paddingVertical: 2,
    },
    pendingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 4,
      accessibilityRole: "text",
    },
    pendingSpinner: {
      size: 10,
      colorToken: "info",
    },
    result: {
      itemMarginBottom: 2,
      headerMarginBottom: 1,
      errorSectionMarginTop: 1,
    },
    resultHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 2,
    },
    resultHeaderMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      flexShrink: 1,
      minWidth: 0,
    },
    characterCount: {
      fontSize: 8,
      colorToken: "mutedForeground",
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      opacity: 0.6,
    },
    payloadMeta: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
      gap: 4,
      marginBottom: 2,
    },
    detailHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 2,
      marginBottom: 2,
    },
    payloadPreview: {
      fontSize: 8,
      lineHeight: 11,
      maxLines: 2,
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: "sm",
      backgroundColorToken: "mutedForeground",
      backgroundAlpha: 0.04,
      textColorToken: "mutedForeground",
    },
    payloadType: {
      fontSize: 8,
      fontWeight: "600",
      colorToken: "mutedForeground",
      opacity: 0.55,
    },
    badge: {
      fontSize: 9,
      fontWeight: "600",
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: "sm",
      backgroundAlpha: 0.12,
      statusColorTokens: {
        success: "success",
        error: "destructive",
      },
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      accessibilityRole: "text",
    },
    badgeIcon: {
      size: 11,
      opacity: 0.9,
    },
    error: {
      labelFontSize: 8,
      labelFontWeight: "500",
      colorToken: "destructive",
      backgroundColorToken: "destructive",
      labelMarginBottom: 1,
      backgroundAlpha: 0.06,
    },
    copyButton: {
      minHeight: 24,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: "sm",
      gap: 2,
      backgroundColorToken: "mutedForeground",
      backgroundAlpha: 0.08,
      pressedOpacity: 0.7,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      accessibilityRole: "button",
    },
    copyButtonIcon: {
      name: "copy-outline",
      size: 10,
      colorToken: "mutedForeground",
      opacity: 0.78,
    },
    copyButtonText: {
      fontSize: 8,
      fontWeight: "600",
      colorToken: "mutedForeground",
    },
  },
} as const satisfies {
  desktop: {
    detailListClassName: string
    tileDetailListClassName: string
    detailHeaderClassName: string
    messageExtrasContainerClassName: string
    messageExtrasSectionClassName: string
    messageExtrasHeadingClassName: string
    messageExtrasSectionLabelClassName: string
    messageExtrasErrorLabelClassName: string
    toolCallCardClassName: string
    toolCallHeaderClassName: string
    toolCallNameClassName: string
    compactBadgeClassName: string
    resultHeaderClassName: string
    resultStatusClassName: string
    resultStatusIconClassName: string
    resultMetaClassName: string
    resultCharacterCountClassName: string
    resultBodyClassName: string
    emptyBlockClassName: string
    errorBlockClassName: string
    resultOutputBlockClassName: string
    resultErrorBlockClassName: string
    toolCallPayloadMaxHeightClassName: string
    resultCardBaseClassName: string
    resultCardStatusClassNames: Record<ToolExecutionResolvedDisplayState, string>
    structuredPayloadFallbackBaseClassName: string
    structuredPayloadFallbackToneClassNames: Record<ToolExecutionDetailDesktopPayloadTone, string>
    structuredPayloadEntryListClassName: string
    structuredPayloadEntryBaseClassName: string
    structuredPayloadEntryToneClassNames: Record<ToolExecutionDetailDesktopPayloadTone, string>
    structuredPayloadEntryHeaderClassName: string
    structuredPayloadEntryHeaderBorderClassNames: Record<ToolExecutionDetailDesktopPayloadTone, string>
    structuredPayloadEntryTextClassNames: Record<ToolExecutionDetailDesktopPayloadTone, string>
    structuredPayloadEntryKeyClassName: string
    structuredPayloadEntryTypeClassName: string
    structuredPayloadTreeEmptyClassName: string
    structuredPayloadTreeContainerClassName: string
    structuredPayloadTreeListClassName: string
    structuredPayloadTreeEntryClassName: string
    structuredPayloadTreeEntryLabelClassName: string
    structuredPayloadTreeEntryValueClassName: string
    structuredPayloadDetailsClassName: string
    structuredPayloadSummaryClassName: string
    structuredPayloadNestedSpacingClassName: string
    structuredPayloadDefaultSpacingClassName: string
    structuredPayloadToggleIconClassName: string
    structuredPayloadSummaryTextClassName: string
    structuredPayloadLineCountClassName: string
    structuredPayloadExpandedBlockClassName: string
    structuredPayloadInlineClassName: string
    structuredPayloadBlockClassName: string
    structuredPayloadBlockDefaultSpacingClassName: string
    compactPayloadMaxHeightClassName: string
    copyButtonClassName: string
    copyIconClassName: string
  }
  mobile: {
    expandedContainer: {
      position: "relative"
    }
    collapseButton: {
      topMarginBottom: number
      bottomMarginTop: number
    }
    toggleIcon: {
      collapsedName: string
      expandedName: string
      collapseName: string
      size: number
      colorToken: ToolExecutionStatusColorToken
      opacity: number
    }
    card: {
      marginTop: number
      borderRadius: "sm" | "md" | "lg" | "xl"
      borderLeftWidth: number
      borderAlpha: number
      backgroundAlpha: number
      overflow: "hidden" | "visible" | "scroll"
      statusColorTokens: Record<ToolExecutionDisplayState, ToolExecutionStatusColorToken>
    }
    section: {
      marginBottom: "xs" | "sm" | "md" | "lg"
      paddingBottom: "xs" | "sm" | "md" | "lg"
      borderBottomWidth: number
      borderColorToken: ToolExecutionSurfaceColorToken
      borderBottomAlpha: number
    }
    blockSection: {
      paddingHorizontal: "xs" | "sm" | "md" | "lg"
      paddingVertical: number
    }
    header: {
      flexDirection: "row"
      alignItems: "center"
      justifyContent: "space-between"
      paddingVertical: "xs" | "sm" | "md" | "lg"
      marginBottom: "xs" | "sm" | "md" | "lg"
      minHeight: number
      accessibilityRole: "button"
      pressedOpacity: number
    }
    toolName: {
      fontSize: number
      fontWeight: string
      colorToken: ToolExecutionSurfaceColorToken
      fontFamilyByPlatform: {
        ios: string
        default: string
      }
      flex: number
    }
    expandHint: {
      flexDirection: "row"
      alignItems: "center"
      fontSize: number
      fontWeight: string
      colorToken: ToolExecutionSurfaceColorToken
      gap: number
    }
    sectionLabel: {
      fontSize: number
      fontWeight: string
      colorToken: ToolExecutionSurfaceColorToken
      marginBottom: number
      textTransform: "uppercase"
      letterSpacing: number
    }
    scroll: {
      collapsedMaxHeight: number
      expandedMaxHeight: number
      borderRadius: "sm" | "md" | "lg" | "xl"
      overflow: "hidden" | "visible" | "scroll"
    }
    codeBlock: {
      fontSize: number
      foregroundColorToken: ToolExecutionSurfaceColorToken
      backgroundColorToken: ToolExecutionSurfaceColorToken
      fontFamilyByPlatform: {
        ios: string
        default: string
      }
      padding: number
      borderRadius: "sm" | "md" | "lg" | "xl"
    }
    pendingText: {
      fontSize: number
      colorToken: ToolExecutionSurfaceColorToken
      fontStyle: "normal" | "italic"
      textAlign: "left" | "center" | "right"
      paddingVertical: number
    }
    pendingRow: {
      flexDirection: "row"
      alignItems: "center"
      justifyContent: "center"
      gap: number
      paddingVertical: number
      accessibilityRole: "text"
    }
    pendingSpinner: {
      size: number
      colorToken: ToolExecutionStatusColorToken
    }
    result: {
      itemMarginBottom: number
      headerMarginBottom: number
      errorSectionMarginTop: number
    }
    resultHeader: {
      flexDirection: "row"
      alignItems: "center"
      justifyContent: "space-between"
      gap: number
    }
    resultHeaderMeta: {
      flexDirection: "row"
      alignItems: "center"
      gap: number
      flexShrink: number
      minWidth: number
    }
    characterCount: {
      fontSize: number
      colorToken: ToolExecutionSurfaceColorToken
      fontFamilyByPlatform: {
        ios: string
        default: string
      }
      opacity: number
    }
    payloadMeta: {
      flexDirection: "row"
      alignItems: "center"
      minWidth: number
      gap: number
      marginBottom: number
    }
    detailHeaderRow: {
      flexDirection: "row"
      alignItems: "center"
      justifyContent: "space-between"
      gap: number
      marginBottom: number
    }
    payloadPreview: {
      fontSize: number
      lineHeight: number
      maxLines: number
      fontFamilyByPlatform: {
        ios: string
        default: string
      }
      paddingHorizontal: number
      paddingVertical: number
      borderRadius: "sm" | "md" | "lg" | "xl"
      backgroundColorToken: ToolExecutionSurfaceColorToken
      backgroundAlpha: number
      textColorToken: ToolExecutionSurfaceColorToken
    }
    payloadType: {
      fontSize: number
      fontWeight: string
      colorToken: ToolExecutionSurfaceColorToken
      opacity: number
    }
    badge: {
      fontSize: number
      fontWeight: string
      paddingHorizontal: number
      paddingVertical: number
      borderRadius: "sm" | "md" | "lg" | "xl"
      backgroundAlpha: number
      statusColorTokens: Record<Extract<ToolExecutionDisplayState, "success" | "error">, ToolExecutionStatusColorToken>
      flexDirection: "row"
      alignItems: "center"
      gap: number
      accessibilityRole: "text"
    }
    badgeIcon: {
      size: number
      opacity: number
    }
    error: {
      labelFontSize: number
      labelFontWeight: string
      colorToken: ToolExecutionSurfaceColorToken
      backgroundColorToken: ToolExecutionSurfaceColorToken
      labelMarginBottom: number
      backgroundAlpha: number
    }
    copyButton: {
      minHeight: number
      paddingHorizontal: number
      paddingVertical: number
      borderRadius: "sm" | "md" | "lg" | "xl"
      gap: number
      backgroundColorToken: ToolExecutionSurfaceColorToken
      backgroundAlpha: number
      pressedOpacity: number
      flexDirection: "row"
      alignItems: "center"
      justifyContent: "center"
      flexShrink: number
      accessibilityRole: "button"
    }
    copyButtonIcon: {
      name: string
      size: number
      colorToken: ToolExecutionStatusColorToken
      opacity: number
    }
    copyButtonText: {
      fontSize: number
      fontWeight: string
      colorToken: ToolExecutionSurfaceColorToken
    }
  }
}

export const TOOL_EXECUTION_STRUCTURED_PAYLOAD_LINE_THRESHOLD = 2

export interface ToolExecutionStructuredPayloadValue {
  value: unknown
  expandedText: string
  compactText: string
  lineCount: number
  isStructured: boolean
  isBlock: boolean
  isCollapsible: boolean
}

export interface ToolExecutionStructuredPayloadChildEntry {
  key: string
  label: string
  value: unknown
}

const TOOL_EXECUTION_COUNT_LABELS = {
  tool_call: {
    singular: "tool call",
    plural: "tool calls",
    heading: "Tool Calls",
  },
  tool_result: {
    singular: "tool result",
    plural: "tool results",
    heading: "Tool Results",
  },
  tool_activity: {
    singular: "tool activity",
    plural: "tool activities",
    heading: "Tool Activity",
  },
} as const satisfies Record<ToolExecutionCountKind, {
  singular: string
  plural: string
  heading: string
}>

export function countToolExecutionPayloadLines(text: string): number {
  return text.split(/\r?\n/).length
}

export function toSingleLineToolExecutionPayloadPreview(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

export function parseToolExecutionJsonStringPayload(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

export function stringifyToolExecutionStructuredPayload(value: unknown, space?: number): string {
  if (typeof value === "string") return value
  if (value === undefined) return "undefined"
  try {
    const formatted = JSON.stringify(value, null, space)
    return formatted ?? String(value)
  } catch {
    return String(value)
  }
}

export function formatToolExecutionStructuredPayloadValue(
  value: unknown,
  fallbackText?: string,
): ToolExecutionStructuredPayloadValue {
  const normalizedValue = typeof value === "string"
    ? parseToolExecutionJsonStringPayload(value)
    : value
  const expandedText = fallbackText ?? stringifyToolExecutionStructuredPayload(normalizedValue, 2)
  const compactText =
    toSingleLineToolExecutionPayloadPreview(stringifyToolExecutionStructuredPayload(normalizedValue)) ||
    toSingleLineToolExecutionPayloadPreview(expandedText)
  const lineCount = countToolExecutionPayloadLines(expandedText)
  const isStructured = normalizedValue !== null && typeof normalizedValue === "object"

  return {
    value: normalizedValue,
    expandedText,
    compactText,
    lineCount,
    isStructured,
    isBlock: isStructured || expandedText.includes("\n") || expandedText.length > 96,
    isCollapsible: lineCount > TOOL_EXECUTION_STRUCTURED_PAYLOAD_LINE_THRESHOLD,
  }
}

export function getToolExecutionPayloadValueType(value: unknown): string {
  if (Array.isArray(value)) return `array · ${value.length}`
  if (value === null) return "null"
  return typeof value
}

function getToolExecutionDetailSectionLabel(kind: ToolExecutionCopyKind): string {
  switch (kind) {
    case "input":
      return TOOL_EXECUTION_DETAIL_PRESENTATION.inputLabel
    case "output":
      return TOOL_EXECUTION_DETAIL_PRESENTATION.outputLabel
    case "error":
      return TOOL_EXECUTION_DETAIL_PRESENTATION.errorDetailsLabel
  }
}

export function getToolExecutionDetailMobileSectionHeaderRenderState(
  input: ToolExecutionDetailMobileSectionHeaderRenderStateInput,
): ToolExecutionDetailMobileSectionHeaderRenderState {
  return {
    kind: input.kind,
    label: formatToolExecutionSectionLabel(getToolExecutionDetailSectionLabel(input.kind)),
    payloadTypeLabel: input.payload ? getToolExecutionPayloadValueType(input.payload.value) : null,
  }
}

export function getToolExecutionStructuredPayloadChildEntries(
  value: unknown,
): ToolExecutionStructuredPayloadChildEntry[] {
  if (Array.isArray(value)) {
    return value.map((entry, index) => ({ key: String(index), label: `[${index}]`, value: entry }))
  }
  if (!value || typeof value !== "object") return []
  return Object.entries(value as Record<string, unknown>).map(([key, entry]) => ({ key, label: key, value: entry }))
}

export function getToolExecutionDisplayState(
  results: Array<ToolExecutionDisplayResultLike | null | undefined>,
): ToolExecutionDisplayState {
  if (results.length === 0) return "idle"
  if (results.some((result) => !result)) return "pending"
  if (results.some((result) => result?.success === false)) return "error"
  if (results.every((result) => result?.success === true)) return "success"
  return "idle"
}

export function getToolExecutionSummaryDisplayState(
  results: Array<ToolExecutionDisplayResultLike | null | undefined>,
): ToolExecutionSummaryDisplayState {
  const state = getToolExecutionDisplayState(results)
  const hasResults = results.some((result) => !!result)

  return {
    state,
    hasResults,
    allSuccess: hasResults && state === "success",
    hasErrors: state === "error",
    isPending: state === "pending",
  }
}

function getToolExecutionArgumentsRecord(args: unknown): Record<string, unknown> | null {
  const normalizedArgs = typeof args === "string"
    ? parseToolExecutionJsonStringPayload(args)
    : args

  if (!normalizedArgs || typeof normalizedArgs !== "object" || Array.isArray(normalizedArgs)) {
    return null
  }

  return normalizedArgs as Record<string, unknown>
}

function truncateToolExecutionArgumentsPreviewValue(value: string, maxLength: number): string {
  const cleaned = toSingleLineToolExecutionPayloadPreview(value)
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength - 3)}...`
}

export function formatToolExecutionArgumentsPreview(args: unknown): string {
  const normalizedArgs = getToolExecutionArgumentsRecord(args)
  if (!normalizedArgs) return ""

  const entries = Object.entries(normalizedArgs)
  if (entries.length === 0) return ""

  const preview = entries.slice(0, 3).map(([key, value]) => {
    let displayValue: string
    if (typeof value === "string") {
      displayValue = truncateToolExecutionArgumentsPreviewValue(value, 30)
    } else if (value && typeof value === "object") {
      displayValue = Array.isArray(value) ? `[${value.length} items]` : "{...}"
    } else if (value === null) {
      displayValue = "null"
    } else {
      displayValue = String(value)
    }
    return `${key}: ${displayValue}`
  }).join(", ")

  if (entries.length > 3) {
    return `${preview} (+${entries.length - 3} more)`
  }

  return preview
}

export function getToolExecutionDetailArgumentsState(args: unknown): ToolExecutionDetailArgumentsState {
  if (!args) {
    return {
      hasArguments: false,
      content: "",
      preview: "",
      payload: null,
    }
  }

  const payload = formatToolExecutionStructuredPayloadValue(args)

  return {
    hasArguments: true,
    content: payload.expandedText,
    preview: formatToolExecutionArgumentsPreview(args),
    payload,
  }
}

export function getToolExecutionDetailResultState(
  result: ToolExecutionDetailResultLike | null | undefined,
  noContentReturnedLabel: string = TOOL_EXECUTION_DETAIL_PRESENTATION.noContentReturnedLabel,
): ToolExecutionDetailResultState {
  const hasResult = !!result
  const content = result
    ? result.content || noContentReturnedLabel
    : ""
  const payload = result
    ? formatToolExecutionStructuredPayloadValue(result.content, content)
    : null
  const state = result ? getResolvedToolExecutionDisplayState(result) : "error"

  return {
    hasResult,
    isPending: !result,
    content,
    payload,
    state,
    characterCountLabel: result ? formatToolExecutionCharacterCount(result.content ?? "") : "",
    error: result?.error ?? null,
  }
}

export function getResolvedToolExecutionDisplayState(result: ToolExecutionDisplayResultLike): ToolExecutionResolvedDisplayState {
  return result.success === true ? "success" : "error"
}

export function getToolExecutionCallDisplayState(
  result: ToolExecutionDisplayResultLike | null | undefined,
): ToolExecutionCallDisplayState {
  if (!result) return "pending"
  return getResolvedToolExecutionDisplayState(result)
}

export function getToolExecutionStatusDesktopClassName(state: ToolExecutionDisplayState): string {
  return TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.statusTextClassNames[state]
}

export function getToolExecutionStatusMobileColor(
  state: ToolExecutionDisplayState,
  colors: ToolExecutionStatusColorPalette,
): string {
  return colors[TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusColorTokens[state]]
}

export function getToolExecutionStatusMobileColorMap(
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionStatusMobileColorMap {
  return {
    idle: getToolExecutionStatusMobileColor("idle", colors),
    pending: getToolExecutionStatusMobileColor("pending", colors),
    success: getToolExecutionStatusMobileColor("success", colors),
    error: getToolExecutionStatusMobileColor("error", colors),
  }
}

export function getToolExecutionCompactMobileStatusColors(
  state: ToolExecutionDisplayState,
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionCompactMobileStatusColors {
  const color = getToolExecutionStatusMobileColor(state, colors)
  const toolIcon = getToolExecutionCompactMobileToolIconState()
  const pendingSpinner = getToolExecutionCompactMobilePendingSpinnerState()
  const statusIcon = getToolExecutionCompactMobileStatusIconState(state === "pending" ? "idle" : state)

  return {
    color,
    toolIconColor: hexToRgba(color, toolIcon.opacity),
    pendingSpinnerColor: hexToRgba(color, pendingSpinner.opacity),
    statusIconColor: hexToRgba(color, statusIcon.opacity),
  }
}

export function getToolExecutionStatusCopyState(): typeof TOOL_EXECUTION_STATUS_PRESENTATION {
  return TOOL_EXECUTION_STATUS_PRESENTATION
}

export function getToolExecutionDetailCopyState(): typeof TOOL_EXECUTION_DETAIL_PRESENTATION {
  return TOOL_EXECUTION_DETAIL_PRESENTATION
}

export function getToolExecutionCompactMobileSurfaceState(): typeof TOOL_EXECUTION_COMPACT_PRESENTATION.mobile {
  return TOOL_EXECUTION_COMPACT_PRESENTATION.mobile
}

export function getToolExecutionCompactMobileStyleRenderState({
  colors,
}: ToolExecutionCompactMobileStyleRenderStateInput): ToolExecutionCompactMobileStyleRenderState {
  return {
    surface: getToolExecutionCompactMobileSurfaceState(),
    statusColors: getToolExecutionStatusMobileColorMap(colors),
  }
}

export function getToolExecutionCompactDesktopSurfaceState(): typeof TOOL_EXECUTION_COMPACT_PRESENTATION.desktop {
  return TOOL_EXECUTION_COMPACT_PRESENTATION.desktop
}

export function getToolExecutionDetailDesktopSurfaceState(): typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop {
  return TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop
}

export function getToolExecutionDetailMobileSurfaceState(): typeof TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile {
  return TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile
}

export function getToolExecutionCompactMobileToolIconState(): ToolExecutionCompactMobileToolIconState {
  const toolIcon = TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toolIcon

  return {
    name: toolIcon.name,
    size: toolIcon.size,
    opacity: toolIcon.opacity,
  }
}

export function getToolExecutionStatusMobileIconName(state: ToolExecutionStatusIconState) {
  const statusIcon = TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon

  if (state === "success") return statusIcon.successName
  if (state === "error") return statusIcon.errorName
  return statusIcon.idleName
}

export function getToolExecutionCompactMobileStatusIconState(
  state: ToolExecutionStatusIconState,
): ToolExecutionCompactMobileStatusIconState {
  const statusIcon = TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon

  return {
    state,
    name: getToolExecutionStatusMobileIconName(state),
    size: statusIcon.size,
    opacity: statusIcon.opacity,
  }
}

export function getToolExecutionCompactMobilePendingSpinnerState(): ToolExecutionCompactMobilePendingSpinnerState {
  return {
    size: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.pendingSpinner.size,
    opacity: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.opacity,
  }
}

export function getToolExecutionCompactMobileToggleIconState(): ToolExecutionCompactMobileToggleIconState {
  const toggleIcon = TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon

  return {
    name: toggleIcon.name,
    size: toggleIcon.size,
    colorToken: toggleIcon.colorToken,
    opacity: toggleIcon.opacity,
  }
}

export function getToolExecutionCompactMobileToggleIconColors(
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionCompactMobileToggleIconColors {
  const icon = getToolExecutionCompactMobileToggleIconState()

  return {
    color: hexToRgba(colors[icon.colorToken], icon.opacity),
  }
}

export function getToolExecutionCompactMobileRenderState(
  input: ToolExecutionCompactMobileRenderStateInput,
): ToolExecutionCompactMobileRenderState {
  const surface = getToolExecutionCompactMobileSurfaceState()
  const copy = TOOL_EXECUTION_STATUS_PRESENTATION[input.state]
  const statusColors = getToolExecutionCompactMobileStatusColors(input.state, input.colors)
  const toggleIconColors = getToolExecutionCompactMobileToggleIconColors(input.colors)
  const toolIcon = getToolExecutionCompactMobileToolIconState()
  const statusIcon = getToolExecutionCompactMobileStatusIconState(input.state === "pending" ? "idle" : input.state)
  const pendingSpinner = getToolExecutionCompactMobilePendingSpinnerState()
  const toggleIcon = getToolExecutionCompactMobileToggleIconState()
  const isPending = input.state === "pending"

  return {
    state: input.state,
    copy,
    surface,
    preview: input.preview,
    accessibilityLabel: formatToolExecutionCompactAccessibilityLabel(copy.label, input.preview),
    isPending,
    isSuccess: input.state === "success",
    isError: input.state === "error",
    name: {
      numberOfLines: surface.name.numberOfLines,
      ellipsizeMode: surface.name.ellipsizeMode,
    },
    toolIcon: {
      name: toolIcon.name,
      size: toolIcon.size,
      color: statusColors.toolIconColor,
    },
    statusIndicator: {
      spinner: {
        shouldRender: isPending,
        size: pendingSpinner.size,
        color: statusColors.pendingSpinnerColor,
      },
      icon: {
        shouldRender: !isPending,
        state: statusIcon.state,
        name: statusIcon.name,
        size: statusIcon.size,
        color: statusColors.statusIconColor,
      },
    },
    toggleIcon: {
      name: toggleIcon.name,
      size: toggleIcon.size,
      color: toggleIconColors.color,
    },
  }
}

export function getToolExecutionDetailMobileToggleIconState(
  input: ToolExecutionDetailMobileToggleIconStateInput = {},
): ToolExecutionDetailMobileToggleIconState {
  const toggleIcon = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon
  const placement = input.placement ?? "header"
  const isExpanded = input.isExpanded ?? placement === "collapse"

  return {
    isExpanded,
    placement,
    name: placement === "collapse"
      ? toggleIcon.collapseName
      : isExpanded
        ? toggleIcon.expandedName
        : toggleIcon.collapsedName,
    size: toggleIcon.size,
    colorToken: toggleIcon.colorToken,
    opacity: toggleIcon.opacity,
  }
}

export function getToolExecutionDetailMobileCopyIconState(): ToolExecutionDetailMobileCopyIconState {
  const copyIcon = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon

  return {
    name: copyIcon.name,
    size: copyIcon.size,
    colorToken: copyIcon.colorToken,
    opacity: copyIcon.opacity,
  }
}

export function getToolExecutionDetailMobileBadgeIconState(
  state: ToolExecutionResolvedDisplayState,
): ToolExecutionDetailMobileBadgeIconState {
  const badgeIcon = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badgeIcon
  const statusIcon = TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon

  return {
    state,
    name: state === "success" ? statusIcon.successName : statusIcon.errorName,
    size: badgeIcon.size,
    opacity: badgeIcon.opacity,
  }
}

export function getToolExecutionDetailMobilePendingSpinnerState(): ToolExecutionDetailMobilePendingSpinnerState {
  const pendingSpinner = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingSpinner

  return {
    size: pendingSpinner.size,
    colorToken: pendingSpinner.colorToken,
  }
}

export function getToolExecutionDetailMobileToggleIconColors(
  input: ToolExecutionDetailMobileToggleIconStateInput,
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionDetailMobileToggleIconColors {
  const icon = getToolExecutionDetailMobileToggleIconState(input)

  return {
    color: hexToRgba(colors[icon.colorToken], icon.opacity),
  }
}

export function getToolExecutionDetailMobilePendingSpinnerColors(
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionDetailMobilePendingSpinnerColors {
  const spinner = getToolExecutionDetailMobilePendingSpinnerState()

  return {
    color: colors[spinner.colorToken],
  }
}

export function getToolExecutionDetailMobilePendingResultRenderState(
  input: ToolExecutionDetailMobilePendingResultRenderStateInput,
): ToolExecutionDetailMobilePendingResultRenderState {
  const spinner = getToolExecutionDetailMobilePendingSpinnerState()
  const spinnerColors = getToolExecutionDetailMobilePendingSpinnerColors(input.colors)

  return {
    label: TOOL_EXECUTION_DETAIL_PRESENTATION.pendingResultLabel,
    accessibilityRole: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingRow.accessibilityRole,
    accessibilityLabel: TOOL_EXECUTION_DETAIL_PRESENTATION.pendingResponseAccessibilityLabel,
    spinner: {
      size: spinner.size,
      color: spinnerColors.color,
    },
  }
}

export function getToolExecutionDetailMobileEmptyStateRenderState(): ToolExecutionDetailMobileEmptyStateRenderState {
  return {
    label: TOOL_EXECUTION_DETAIL_PRESENTATION.noToolCallsLabel,
    accessibilityRole: "text",
    accessibilityLabel: TOOL_EXECUTION_DETAIL_PRESENTATION.noToolCallsLabel,
  }
}

export function getToolExecutionResultOnlyFallbackRenderState(): ToolExecutionResultOnlyFallbackRenderState {
  return {
    label: TOOL_EXECUTION_DETAIL_PRESENTATION.toolResultFallbackLabel,
  }
}

export function getToolExecutionDetailCopyFailureAlertState(): ToolExecutionDetailCopyFailureAlertState {
  return {
    title: TOOL_EXECUTION_DETAIL_PRESENTATION.copyFailedTitle,
    fallbackMessage: TOOL_EXECUTION_DETAIL_PRESENTATION.copyFailedMessage,
  }
}

export function getToolExecutionDetailMobileHeaderRenderState(
  input: ToolExecutionDetailMobileHeaderRenderStateInput,
): ToolExecutionDetailMobileHeaderRenderState {
  const toggleIcon = getToolExecutionDetailMobileToggleIconState({ isExpanded: input.isExpanded })
  const toggleIconColors = getToolExecutionDetailMobileToggleIconColors({ isExpanded: input.isExpanded }, input.colors)
  const resultBadgeIcon = getToolExecutionDetailMobileBadgeIconState(input.resultState)
  const resultBadgeColors = getToolExecutionDetailMobileBadgeColors(input.resultState, input.colors)
  const resultCopy = TOOL_EXECUTION_STATUS_PRESENTATION[input.resultState]

  return {
    isExpanded: input.isExpanded,
    accessibilityRole: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.header.accessibilityRole,
    accessibilityLabel: createExpandCollapseAccessibilityLabel(
      formatToolExecutionDetailsAccessibilityName(input.toolName),
      input.isExpanded,
    ),
    accessibilityHint: input.isExpanded
      ? TOOL_EXECUTION_DETAIL_PRESENTATION.collapseDetailsHint
      : TOOL_EXECUTION_DETAIL_PRESENTATION.expandDetailsHint,
    accessibilityState: { expanded: input.isExpanded },
    ariaExpanded: input.isExpanded,
    toggleLabel: input.isExpanded
      ? TOOL_EXECUTION_DETAIL_PRESENTATION.collapseLabel
      : TOOL_EXECUTION_DETAIL_PRESENTATION.detailsLabel,
    toggleIcon: {
      name: toggleIcon.name,
      size: toggleIcon.size,
      color: toggleIconColors.color,
    },
    resultBadge: {
      state: input.resultState,
      label: resultCopy.label,
      accessibilityRole: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badge.accessibilityRole,
      accessibilityLabel: resultCopy.label,
      isSuccess: input.resultState === "success",
      isError: input.resultState === "error",
      colors: resultBadgeColors,
      icon: {
        name: resultBadgeIcon.name,
        size: resultBadgeIcon.size,
        color: resultBadgeColors.iconColor,
      },
    },
  }
}

export function getToolExecutionDetailMobileExpandControlRenderState(): ToolExecutionDetailMobileExpandControlRenderState {
  return {
    isExpanded: false,
    accessibilityRole: "button",
    accessibilityLabel: createExpandCollapseAccessibilityLabel(
      TOOL_EXECUTION_DETAIL_PRESENTATION.expandExecutionAccessibilityName,
      false,
    ),
    accessibilityHint: TOOL_EXECUTION_DETAIL_PRESENTATION.expandExecutionHint,
    accessibilityState: { expanded: false },
    ariaExpanded: false,
  }
}

export function getToolExecutionDetailMobileCollapseControlRenderState(
  input: ToolExecutionDetailMobileCollapseControlRenderStateInput,
): ToolExecutionDetailMobileCollapseControlRenderState {
  const placement = input.placement ?? "bottom"
  const icon = getToolExecutionDetailMobileToggleIconState({ placement: "collapse" })
  const iconColors = getToolExecutionDetailMobileToggleIconColors({ placement: "collapse" }, input.colors)
  const shouldShowCount = placement === "top" && typeof input.toolCallCount === "number"

  return {
    placement,
    accessibilityRole: "button",
    accessibilityLabel: TOOL_EXECUTION_DETAIL_PRESENTATION.collapseExecutionAccessibilityLabel,
    accessibilityHint: TOOL_EXECUTION_DETAIL_PRESENTATION.collapseExecutionHint,
    label: shouldShowCount
      ? `${TOOL_EXECUTION_DETAIL_PRESENTATION.collapseLabel} ${formatToolExecutionCount("tool_call", input.toolCallCount ?? 0)}`
      : TOOL_EXECUTION_DETAIL_PRESENTATION.collapseLabel,
    icon: {
      name: icon.name,
      size: icon.size,
      color: iconColors.color,
    },
  }
}

export function getToolExecutionDetailMobilePayloadPreviewState(): ToolExecutionDetailMobilePayloadPreviewState {
  return {
    numberOfLines: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.payloadPreview.maxLines,
  }
}

export function getToolExecutionDetailMobilePayloadPreviewColors(
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionDetailMobilePayloadPreviewColors {
  const payloadPreview = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.payloadPreview

  return {
    backgroundColor: hexToRgba(colors[payloadPreview.backgroundColorToken], payloadPreview.backgroundAlpha),
    color: colors[payloadPreview.textColorToken],
  }
}

export function getToolExecutionDetailMobileCopyButtonColors(
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionDetailMobileCopyButtonColors {
  const copyButton = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButton
  const copyButtonText = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonText
  const copyButtonIcon = getToolExecutionDetailMobileCopyIconState()

  return {
    backgroundColor: hexToRgba(colors[copyButton.backgroundColorToken], copyButton.backgroundAlpha),
    textColor: colors[copyButtonText.colorToken],
    iconColor: hexToRgba(colors[copyButtonIcon.colorToken], copyButtonIcon.opacity),
  }
}

export function getToolExecutionDetailMobileCopyButtonRenderState(
  input: ToolExecutionDetailMobileCopyButtonRenderStateInput,
): ToolExecutionDetailMobileCopyButtonRenderState {
  const icon = getToolExecutionDetailMobileCopyIconState()
  const colors = getToolExecutionDetailMobileCopyButtonColors(input.colors)

  return {
    kind: input.kind,
    label: TOOL_EXECUTION_DETAIL_PRESENTATION.copyLabel,
    accessibilityRole: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButton.accessibilityRole,
    accessibilityLabel: getToolExecutionCopyAccessibilityLabel(input.kind, input.toolName),
    colors,
    icon: {
      name: icon.name,
      size: icon.size,
      color: colors.iconColor,
    },
  }
}

export function getToolExecutionDetailMobileBadgeColors(
  state: ToolExecutionResolvedDisplayState,
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionDetailMobileBadgeColors {
  const badge = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badge
  const badgeIcon = getToolExecutionDetailMobileBadgeIconState(state)
  const color = colors[badge.statusColorTokens[state]]

  return {
    backgroundColor: hexToRgba(color, badge.backgroundAlpha),
    color,
    iconColor: hexToRgba(color, badgeIcon.opacity),
  }
}

export function getToolExecutionDetailMobileErrorColors(
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionDetailMobileErrorColors {
  const error = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.error

  return {
    backgroundColor: hexToRgba(colors[error.backgroundColorToken], error.backgroundAlpha),
    color: colors[error.colorToken],
  }
}

export function getToolExecutionDetailMobileContentColors(
  colors: ToolExecutionSurfaceColorPalette,
): ToolExecutionDetailMobileContentColors {
  const surface = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile

  return {
    section: {
      borderBottomColor: hexToRgba(colors[surface.section.borderColorToken], surface.section.borderBottomAlpha),
    },
    toolName: {
      color: colors[surface.toolName.colorToken],
    },
    expandHintText: {
      color: colors[surface.expandHint.colorToken],
    },
    sectionLabel: {
      color: colors[surface.sectionLabel.colorToken],
    },
    payloadType: {
      color: colors[surface.payloadType.colorToken],
    },
    codeBlock: {
      color: colors[surface.codeBlock.foregroundColorToken],
      backgroundColor: colors[surface.codeBlock.backgroundColorToken],
    },
    pendingText: {
      color: colors[surface.pendingText.colorToken],
    },
    characterCount: {
      color: colors[surface.characterCount.colorToken],
    },
  }
}

export function getToolExecutionDetailMobileColors(
  state: ToolExecutionDisplayState,
  colors: ToolExecutionStatusColorPalette,
): ToolExecutionDetailMobileCardColors {
  const card = TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.card
  const color = colors[card.statusColorTokens[state]]
  return {
    borderLeftColor: hexToRgba(color, card.borderAlpha),
    backgroundColor: hexToRgba(color, card.backgroundAlpha),
  }
}

export function getToolExecutionDetailMobileStyleColors(
  colors: ToolExecutionSurfaceColorPalette,
): ToolExecutionDetailMobileStyleColors {
  return {
    payloadPreview: getToolExecutionDetailMobilePayloadPreviewColors(colors),
    copyButton: getToolExecutionDetailMobileCopyButtonColors(colors),
    badge: {
      success: getToolExecutionDetailMobileBadgeColors("success", colors),
      error: getToolExecutionDetailMobileBadgeColors("error", colors),
    },
    error: getToolExecutionDetailMobileErrorColors(colors),
    content: getToolExecutionDetailMobileContentColors(colors),
    byState: {
      idle: getToolExecutionDetailMobileColors("idle", colors),
      pending: getToolExecutionDetailMobileColors("pending", colors),
      success: getToolExecutionDetailMobileColors("success", colors),
      error: getToolExecutionDetailMobileColors("error", colors),
    },
  }
}

export function getToolExecutionDetailMobileStyleRenderState({
  colors,
}: ToolExecutionDetailMobileStyleRenderStateInput): ToolExecutionDetailMobileStyleRenderState {
  return {
    surface: getToolExecutionDetailMobileSurfaceState(),
    payloadPreview: getToolExecutionDetailMobilePayloadPreviewState(),
    colors: getToolExecutionDetailMobileStyleColors(colors),
  }
}

export function formatToolExecutionCount(kind: ToolExecutionCountKind, count: number): string {
  const label = TOOL_EXECUTION_COUNT_LABELS[kind]
  return `${count} ${count === 1 ? label.singular : label.plural}`
}

export function formatToolExecutionCompactAccessibilityLabel(statusLabel: string, preview: string): string {
  const normalizedStatusLabel = statusLabel.trim()
  const normalizedPreview = preview.trim()

  if (!normalizedStatusLabel) return normalizedPreview
  if (!normalizedPreview) return normalizedStatusLabel
  return `${normalizedStatusLabel}: ${normalizedPreview}`
}

export function getToolExecutionCopyAccessibilityLabel(
  kind: ToolExecutionCopyKind,
  toolName: string,
): string {
  const label = kind === "input"
    ? TOOL_EXECUTION_DETAIL_PRESENTATION.copyInputLabel
    : kind === "output"
      ? TOOL_EXECUTION_DETAIL_PRESENTATION.copyOutputLabel
      : TOOL_EXECUTION_DETAIL_PRESENTATION.copyErrorLabel
  return `${label} for ${toolName}`
}

export function formatToolExecutionHeading(kind: ToolExecutionCountKind, count: number): string {
  const label = TOOL_EXECUTION_COUNT_LABELS[kind]
  return `${label.heading} (${count})`
}

export function formatIndexedToolExecutionLabel(kind: "tool" | "result", index: number): string {
  return `${kind === "tool" ? "Tool" : "Result"} ${index + 1}`
}

export function formatToolExecutionCharacterCount(value: string | number | null | undefined): string {
  const count = typeof value === "number"
    ? Number.isFinite(value)
      ? Math.max(0, Math.trunc(value))
      : 0
    : value?.length ?? 0
  return `${count.toLocaleString()} ${TOOL_EXECUTION_DETAIL_PRESENTATION.characterCountLabel}`
}

export function formatToolExecutionDetailsAccessibilityName(toolName: string | null | undefined): string {
  const normalizedName = toolName?.trim()
  return normalizedName
    ? `${normalizedName} ${TOOL_EXECUTION_DETAIL_PRESENTATION.toolDetailsAccessibilitySuffix}`
    : TOOL_EXECUTION_DETAIL_PRESENTATION.toolDetailsAccessibilitySuffix
}

export function formatToolExecutionSectionLabel(label: string): string {
  const normalizedLabel = label.trim()
  return normalizedLabel ? `${normalizedLabel}:` : ""
}

export function formatToolExecutionDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

export function formatToolExecutionTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens >= 10000 ? 0 : 1)}k`
  }
  return `${tokens}`
}

export function truncateToolExecutionSubagentId(id: string): string {
  if (id.length > 12 && id.includes("-")) {
    const shortId = id.split("-")[0].slice(0, 7)
    return `agent:${shortId}`
  }
  if (id.length <= 12) {
    return id
  }
  return `${id.slice(0, 10)}...`
}
