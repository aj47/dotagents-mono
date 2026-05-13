import { describe, expect, it } from "vitest"

import {
  formatToolExecutionCharacterCount,
  formatToolExecutionArgumentsPreview,
  formatToolExecutionCompactAccessibilityLabel,
  formatToolExecutionDetailsAccessibilityName,
  formatToolExecutionSectionLabel,
  formatToolExecutionStructuredPayloadValue,
  formatIndexedToolExecutionLabel,
  getToolExecutionDetailArgumentsState,
  getToolExecutionDetailMobileColors,
  getToolExecutionDetailMobileBadgeIconState,
  getToolExecutionDetailMobileBadgeColors,
  getToolExecutionDetailMobileCopyButtonRenderState,
  getToolExecutionDetailCopyFailureAlertState,
  getToolExecutionDetailMobileCollapseControlRenderState,
  getToolExecutionDetailMobileCopyButtonColors,
  getToolExecutionDetailMobileCopyIconState,
  getToolExecutionDetailMobileContentColors,
  getToolExecutionDetailMobileErrorColors,
  getToolExecutionDetailMobileEmptyStateRenderState,
  getToolExecutionDetailMobileExpandControlRenderState,
  getToolExecutionDetailMobileHeaderRenderState,
  getToolExecutionDetailMobilePayloadPreviewColors,
  getToolExecutionDetailMobilePayloadPreviewState,
  getToolExecutionDetailMobilePendingResultRenderState,
  getToolExecutionDetailMobilePendingSpinnerColors,
  getToolExecutionDetailMobilePendingSpinnerState,
  getToolExecutionDetailMobileSectionHeaderRenderState,
  getToolExecutionDetailMobileToggleIconColors,
  getToolExecutionDetailMobileToggleIconState,
  getToolExecutionPayloadValueType,
  getToolExecutionDetailResultState,
  getResolvedToolExecutionDisplayState,
  getToolExecutionStructuredPayloadChildEntries,
  formatToolExecutionCount,
  getToolExecutionCopyAccessibilityLabel,
  getToolExecutionCallDisplayState,
  getToolExecutionCompactDesktopSurfaceState,
  getToolExecutionCompactMobileRenderState,
  getToolExecutionCompactMobileStatusColors,
  getToolExecutionCompactMobilePendingSpinnerState,
  getToolExecutionCompactMobileStatusIconState,
  getToolExecutionCompactMobileSurfaceState,
  getToolExecutionCompactMobileToggleIconColors,
  getToolExecutionCompactMobileToggleIconState,
  getToolExecutionCompactMobileToolIconState,
  getToolExecutionDetailCopyState,
  getToolExecutionResultOnlyFallbackRenderState,
  getToolExecutionStatusDesktopClassName,
  getToolExecutionStatusMobileColor,
  getToolExecutionStatusCopyState,
  getToolExecutionDisplayState,
  getToolExecutionSummaryDisplayState,
  getToolExecutionStatusMobileIconName,
  getToolExecutionDetailDesktopSurfaceState,
  getToolExecutionDetailMobileSurfaceState,
  formatToolExecutionDuration,
  formatToolExecutionHeading,
  formatToolExecutionTokens,
  TOOL_EXECUTION_COMPACT_PRESENTATION,
  TOOL_EXECUTION_DETAIL_PRESENTATION,
  TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION,
  TOOL_EXECUTION_STATUS_PRESENTATION,
  truncateToolExecutionSubagentId,
} from "./tool-execution-display"

describe("tool execution display", () => {
  it("formats short, second-scale, and minute-scale durations", () => {
    expect(formatToolExecutionDuration(150)).toBe("150ms")
    expect(formatToolExecutionDuration(3062)).toBe("3.1s")
    expect(formatToolExecutionDuration(65000)).toBe("1m 5s")
    expect(formatToolExecutionDuration(120000)).toBe("2m")
  })

  it("formats token counts compactly", () => {
    expect(formatToolExecutionTokens(500)).toBe("500")
    expect(formatToolExecutionTokens(1700)).toBe("1.7k")
    expect(formatToolExecutionTokens(17000)).toBe("17k")
    expect(formatToolExecutionTokens(1500000)).toBe("1.5M")
  })

  it("derives shared compact status from tool results", () => {
    expect(getToolExecutionDisplayState([])).toBe("idle")
    expect(getToolExecutionDisplayState([undefined])).toBe("pending")
    expect(getToolExecutionDisplayState([{ success: true }])).toBe("success")
    expect(getToolExecutionDisplayState([{ success: true }, { success: false }])).toBe("error")
    expect(getToolExecutionSummaryDisplayState([])).toEqual({
      state: "idle",
      hasResults: false,
      allSuccess: false,
      hasErrors: false,
      isPending: false,
    })
    expect(getToolExecutionSummaryDisplayState([undefined])).toEqual({
      state: "pending",
      hasResults: false,
      allSuccess: false,
      hasErrors: false,
      isPending: true,
    })
    expect(getToolExecutionSummaryDisplayState([{ success: true }, { success: true }])).toMatchObject({
      state: "success",
      hasResults: true,
      allSuccess: true,
      hasErrors: false,
      isPending: false,
    })
    expect(getToolExecutionSummaryDisplayState([{ success: true }, { success: false }])).toMatchObject({
      state: "error",
      hasResults: true,
      allSuccess: false,
      hasErrors: true,
      isPending: false,
    })
    expect(getToolExecutionDetailArgumentsState(undefined)).toEqual({
      hasArguments: false,
      content: "",
      preview: "",
      payload: null,
    })
    expect(getToolExecutionDetailArgumentsState("")).toEqual({
      hasArguments: false,
      content: "",
      preview: "",
      payload: null,
    })
    expect(getToolExecutionDetailArgumentsState({ path: "/test" })).toMatchObject({
      hasArguments: true,
      content: '{\n  "path": "/test"\n}',
      preview: "path: /test",
      payload: {
        compactText: '{"path":"/test"}',
        expandedText: '{\n  "path": "/test"\n}',
      },
    })
    expect(getToolExecutionDetailArgumentsState('{"count":2}')).toMatchObject({
      hasArguments: true,
      content: '{\n  "count": 2\n}',
      preview: "count: 2",
      payload: {
        compactText: '{"count":2}',
      },
    })
    expect(formatToolExecutionArgumentsPreview(null)).toBe("")
    expect(formatToolExecutionArgumentsPreview("string")).toBe("")
    expect(formatToolExecutionArgumentsPreview({ content: "a".repeat(50) })).toBe("content: aaaaaaaaaaaaaaaaaaaaaaaaaaa...")
    expect(formatToolExecutionArgumentsPreview({ command: "python3 - <<'PY'\nprint('hello')\nPY" })).toBe("command: python3 - <<'PY' print('hel...")
    expect(formatToolExecutionArgumentsPreview({ a: "1", b: "2", c: "3", d: "4" })).toBe("a: 1, b: 2, c: 3 (+1 more)")
    expect(getToolExecutionDetailResultState(undefined)).toMatchObject({
      hasResult: false,
      isPending: true,
      content: "",
      payload: null,
      state: "error",
      characterCountLabel: "",
      error: null,
    })
    expect(getToolExecutionDetailResultState({ success: true, content: "" }, "No output")).toMatchObject({
      hasResult: true,
      isPending: false,
      content: "No output",
      state: "success",
      characterCountLabel: "0 chars",
      error: null,
    })
    expect(getToolExecutionDetailResultState({ success: false, content: "bad", error: "failed" })).toMatchObject({
      hasResult: true,
      isPending: false,
      content: "bad",
      state: "error",
      characterCountLabel: "3 chars",
      error: "failed",
    })
    expect(getToolExecutionDetailResultState({ success: true, content: "ok" }).payload).toMatchObject({
      compactText: "ok",
      expandedText: "ok",
    })
    expect(getResolvedToolExecutionDisplayState({ success: true })).toBe("success")
    expect(getResolvedToolExecutionDisplayState({ success: false })).toBe("error")
    expect(getResolvedToolExecutionDisplayState({})).toBe("error")
    expect(getToolExecutionCallDisplayState(undefined)).toBe("pending")
    expect(getToolExecutionCallDisplayState(null)).toBe("pending")
    expect(getToolExecutionCallDisplayState({ success: true })).toBe("success")
    expect(getToolExecutionCallDisplayState({ success: false })).toBe("error")
    expect(TOOL_EXECUTION_STATUS_PRESENTATION.success.compactLabel).toBe("OK")
    expect(TOOL_EXECUTION_STATUS_PRESENTATION.error.compactLabel).toBe("ERR")
    expect(getToolExecutionStatusCopyState()).toBe(TOOL_EXECUTION_STATUS_PRESENTATION)
  })

  it("formats shared tool detail labels and counts", () => {
    expect(formatToolExecutionCount("tool_call", 1)).toBe("1 tool call")
    expect(formatToolExecutionCount("tool_call", 2)).toBe("2 tool calls")
    expect(formatToolExecutionHeading("tool_result", 3)).toBe("Tool Results (3)")
    expect(formatIndexedToolExecutionLabel("tool", 0)).toBe("Tool 1")
    expect(formatIndexedToolExecutionLabel("result", 1)).toBe("Result 2")
    expect(TOOL_EXECUTION_DETAIL_PRESENTATION.inputLabel).toBe("Input")
    expect(TOOL_EXECUTION_DETAIL_PRESENTATION.outputLabel).toBe("Output")
    expect(TOOL_EXECUTION_DETAIL_PRESENTATION.toolResultFallbackLabel).toBe("Tool result")
    expect(TOOL_EXECUTION_DETAIL_PRESENTATION.copyLabel).toBe("Copy")
    expect(TOOL_EXECUTION_DETAIL_PRESENTATION.copyGlyph).toBe("⧉")
    expect(getToolExecutionCopyAccessibilityLabel("input", "read_file")).toBe("Copy input for read_file")
    expect(getToolExecutionCopyAccessibilityLabel("output", "read_file")).toBe("Copy output for read_file")
    expect(getToolExecutionCopyAccessibilityLabel("error", "read_file")).toBe("Copy error details for read_file")
    expect(TOOL_EXECUTION_DETAIL_PRESENTATION.pendingResponseAccessibilityLabel).toBe("Waiting for response")
    expect(TOOL_EXECUTION_DETAIL_PRESENTATION.expandExecutionAccessibilityName).toBe("tool execution details")
    expect(TOOL_EXECUTION_DETAIL_PRESENTATION.expandExecutionHint).toBe("Expands this tool execution summary")
    expect(TOOL_EXECUTION_DETAIL_PRESENTATION.toolDetailsAccessibilitySuffix).toBe("tool details")
    expect(formatToolExecutionCharacterCount("hello")).toBe("5 chars")
    expect(formatToolExecutionCharacterCount(1200)).toBe("1,200 chars")
    expect(formatToolExecutionCharacterCount(undefined)).toBe("0 chars")
    expect(formatToolExecutionDetailsAccessibilityName("read_file")).toBe("read_file tool details")
    expect(formatToolExecutionDetailsAccessibilityName(" ")).toBe("tool details")
    expect(formatToolExecutionCompactAccessibilityLabel("Success", "read_file")).toBe("Success: read_file")
    expect(formatToolExecutionCompactAccessibilityLabel("Waiting", "")).toBe("Waiting")
    expect(formatToolExecutionCompactAccessibilityLabel("", "read_file")).toBe("read_file")
    expect(formatToolExecutionSectionLabel(TOOL_EXECUTION_DETAIL_PRESENTATION.inputLabel)).toBe("Input:")
    expect(formatToolExecutionSectionLabel(" ")).toBe("")
    expect(getToolExecutionDetailCopyState()).toBe(TOOL_EXECUTION_DETAIL_PRESENTATION)
  })

  it("shares compact tool execution row presentation across app surfaces", () => {
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.previewButtonClassName).toContain("w-full min-w-0")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.previewButtonClassName).toContain("appearance-none")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.previewListClassName).toContain("space-y-0.5")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.previewNameClassName).toContain("truncate")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.previewStatusIconContainerClassName).toContain("shrink-0")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.previewStatusIconClassName).toBe("h-2.5 w-2.5")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.previewPendingIconClassName).toContain("animate-spin")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.previewToggleIconClassName).toContain("transition-transform")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.rowClassName).toBe("px-1 py-0.5")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.tileRowClassName).toBe("px-1.5 py-0.5")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.detailItemClassName).toContain("text-[10px]")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.detailSectionLabelClassName).toContain("opacity-70")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.detailResultStatusClassName).toContain("flex-1")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.detailCharacterCountClassName).toContain("whitespace-nowrap")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.pendingResponseClassName).toContain("italic")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop.pendingResponseIconClassName).toContain("animate-spin")
    expect(getToolExecutionCompactDesktopSurfaceState()).toBe(TOOL_EXECUTION_COMPACT_PRESENTATION.desktop)
    expect(getToolExecutionCompactMobileSurfaceState()).toBe(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile)
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.line).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
    })
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.iconCell).toMatchObject({
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    })
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.status.minWidth).toBe(22)
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.status.textAlign).toBe("right")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toolIcon).toMatchObject({
      name: "construct-outline",
      size: 11,
      width: 14,
    })
    expect(getToolExecutionCompactMobileToolIconState()).toEqual({
      name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toolIcon.name,
      size: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toolIcon.size,
      opacity: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toolIcon.opacity,
    })
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon).toMatchObject({
      successName: "checkmark-circle-outline",
      errorName: "close-circle-outline",
      size: 11,
    })
    expect(getToolExecutionCompactMobileStatusIconState("success")).toEqual({
      state: "success",
      name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.successName,
      size: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.size,
      opacity: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.opacity,
    })
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.pendingSpinner).toMatchObject({
      size: 10,
      width: 14,
    })
    expect(getToolExecutionCompactMobilePendingSpinnerState()).toEqual({
      size: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.pendingSpinner.size,
      opacity: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.opacity,
    })
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon).toMatchObject({
      name: "chevron-forward",
      colorToken: "mutedForeground",
    })
    expect(getToolExecutionCompactMobileToggleIconState()).toEqual({
      name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon.name,
      size: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon.size,
      colorToken: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon.colorToken,
      opacity: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon.opacity,
    })
    expect(getToolExecutionCompactMobileToggleIconColors({
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      color: "rgba(115, 115, 115, 0.5)",
    })
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.name.numberOfLines).toBe(1)
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.name.ellipsizeMode).toBe("tail")
    expect(TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.name.fontFamilyByPlatform.ios).toBe("Menlo")
    expect(getToolExecutionStatusDesktopClassName("pending")).toBe("text-blue-600 dark:text-blue-400")
    expect(getToolExecutionStatusDesktopClassName("error")).toBe("text-red-600 dark:text-red-400")
    expect(getToolExecutionStatusMobileColor("success", {
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toBe("#22c55e")
    expect(getToolExecutionCompactMobileStatusColors("success", {
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      color: "#22c55e",
      toolIconColor: "rgba(34, 197, 94, 0.82)",
      pendingSpinnerColor: "rgba(34, 197, 94, 0.9)",
      statusIconColor: "rgba(34, 197, 94, 0.9)",
    })
    expect(getToolExecutionCompactMobileRenderState({
      state: "pending",
      preview: "read_file",
      colors: {
        info: "#3b82f6",
        success: "#22c55e",
        destructive: "#ef4444",
        mutedForeground: "#737373",
      },
    })).toMatchObject({
      state: "pending",
      copy: TOOL_EXECUTION_STATUS_PRESENTATION.pending,
      surface: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile,
      preview: "read_file",
      accessibilityLabel: "Waiting: read_file",
      isPending: true,
      isSuccess: false,
      isError: false,
      name: {
        numberOfLines: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.name.numberOfLines,
        ellipsizeMode: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.name.ellipsizeMode,
      },
      toolIcon: {
        name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toolIcon.name,
        size: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toolIcon.size,
        color: "rgba(59, 130, 246, 0.82)",
      },
      statusIndicator: {
        spinner: {
          shouldRender: true,
          size: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.pendingSpinner.size,
          color: "rgba(59, 130, 246, 0.9)",
        },
        icon: {
          shouldRender: false,
          state: "idle",
          name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.idleName,
          size: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.size,
          color: "rgba(59, 130, 246, 0.9)",
        },
      },
      toggleIcon: {
        name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon.name,
        size: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.toggleIcon.size,
        color: "rgba(115, 115, 115, 0.5)",
      },
    })
    expect(getToolExecutionCompactMobileRenderState({
      state: "success",
      preview: "write_file",
      colors: {
        info: "#3b82f6",
        success: "#22c55e",
        destructive: "#ef4444",
        mutedForeground: "#737373",
      },
    })).toMatchObject({
      state: "success",
      copy: TOOL_EXECUTION_STATUS_PRESENTATION.success,
      accessibilityLabel: "Success: write_file",
      isPending: false,
      isSuccess: true,
      isError: false,
      statusIndicator: {
        spinner: {
          shouldRender: false,
        },
        icon: {
          shouldRender: true,
          state: "success",
          name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.successName,
          color: "rgba(34, 197, 94, 0.9)",
        },
      },
    })
    expect(getToolExecutionStatusMobileIconName("idle")).toBe("ellipse-outline")
    expect(getToolExecutionStatusMobileIconName("success")).toBe("checkmark-circle-outline")
    expect(getToolExecutionStatusMobileIconName("error")).toBe("close-circle-outline")
  })

  it("shares expanded tool execution detail surface presentation across app surfaces", () => {
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.detailListClassName).toContain("border-l")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.tileDetailListClassName).toContain("text-[10px]")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.messageExtrasContainerClassName).toContain("text-left")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.messageExtrasSectionClassName).toBe("space-y-2")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.messageExtrasHeadingClassName).toContain("font-semibold")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.messageExtrasSectionLabelClassName).toContain("opacity-70")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.messageExtrasErrorLabelClassName).toContain("text-destructive")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.toolCallCardClassName).toContain("bg-muted/20")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.toolCallHeaderClassName).toContain("flex-wrap")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.toolCallNameClassName).toContain("font-mono")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.compactBadgeClassName).toContain("whitespace-nowrap")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultHeaderClassName).toContain("gap-2")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultStatusClassName).toContain("items-center")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultStatusIconClassName).toBe("h-3 w-3")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultMetaClassName).toContain("ml-auto")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultCharacterCountClassName).toContain("font-mono")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultBodyClassName).toBe("space-y-2")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.errorBlockClassName).toContain("max-h-32")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultOutputBlockClassName).toContain("max-h-80")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultErrorBlockClassName).toContain("max-h-60")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.toolCallPayloadMaxHeightClassName).toBe("max-h-80")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultCardBaseClassName).toContain("rounded-lg")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultCardStatusClassNames.success).toContain("green")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.resultCardStatusClassNames.error).toContain("red")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadFallbackBaseClassName).toBe("overflow-hidden rounded")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadFallbackToneClassNames.approval).toContain("amber")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadEntryListClassName).toBe("space-y-1.5")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadEntryBaseClassName).toContain("rounded-md")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadEntryToneClassNames.neutral).toContain("border-border")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadEntryHeaderClassName).toContain("border-b")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadEntryHeaderBorderClassNames.error).toContain("red")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadEntryTextClassNames.approval).toContain("amber")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadEntryKeyClassName).toContain("font-mono")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadEntryTypeClassName).toContain("uppercase")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadTreeEmptyClassName).toContain("font-mono")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadTreeContainerClassName).toContain("scrollbar-thin")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadTreeListClassName).toBe("space-y-1")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadTreeEntryClassName).toContain("bg-background/30")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadTreeEntryLabelClassName).toContain("w-20")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadTreeEntryValueClassName).toContain("flex-1")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadDetailsClassName).toBe("group")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadSummaryClassName).toContain("cursor-pointer")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadNestedSpacingClassName).toBe("py-0.5")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadDefaultSpacingClassName).toBe("px-2 py-1.5")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadToggleIconClassName).toContain("group-open:rotate-90")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadSummaryTextClassName).toContain("truncate")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadLineCountClassName).toContain("uppercase")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadExpandedBlockClassName).toContain("border-t")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadInlineClassName).toContain("leading-relaxed")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadBlockClassName).toContain("whitespace-pre-wrap")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.structuredPayloadBlockDefaultSpacingClassName).toBe("p-2")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.compactPayloadMaxHeightClassName).toBe("max-h-52")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.copyButtonClassName).toContain("h-5")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop.copyIconClassName).toContain("h-2")
    expect(getToolExecutionDetailDesktopSurfaceState()).toBe(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.desktop)
    expect(getToolExecutionDetailMobileSurfaceState()).toBe(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile)
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.card.borderLeftWidth).toBe(1.5)
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.card.statusColorTokens.error).toBe("destructive")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.expandedContainer.position).toBe("relative")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.collapseButton.topMarginBottom).toBe(4)
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.collapseButton.bottomMarginTop).toBe(4)
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.section.borderColorToken).toBe("mutedForeground")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toolName.colorToken).toBe("primary")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toolName.fontFamilyByPlatform.default).toBe("monospace")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.header).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.expandHint).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      colorToken: "mutedForeground",
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon).toMatchObject({
      collapsedName: "chevron-forward",
      expandedName: "chevron-down",
      collapseName: "chevron-up",
      size: 12,
      colorToken: "mutedForeground",
    })
    expect(getToolExecutionDetailMobileToggleIconState({ isExpanded: false })).toEqual({
      isExpanded: false,
      placement: "header",
      name: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.collapsedName,
      size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.size,
      colorToken: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.colorToken,
      opacity: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.opacity,
    })
    expect(getToolExecutionDetailMobileToggleIconState({ isExpanded: true })).toEqual({
      isExpanded: true,
      placement: "header",
      name: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.expandedName,
      size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.size,
      colorToken: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.colorToken,
      opacity: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.opacity,
    })
    expect(getToolExecutionDetailMobileToggleIconState({ placement: "collapse" })).toEqual({
      isExpanded: true,
      placement: "collapse",
      name: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.collapseName,
      size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.size,
      colorToken: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.colorToken,
      opacity: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.opacity,
    })
    expect(getToolExecutionDetailMobileToggleIconColors({ isExpanded: true }, {
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      color: "rgba(115, 115, 115, 0.72)",
    })
    expect(getToolExecutionDetailMobileToggleIconColors({ placement: "collapse" }, {
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      color: "rgba(115, 115, 115, 0.72)",
    })
    expect(getToolExecutionDetailMobileHeaderRenderState({
      toolName: "read_file",
      isExpanded: false,
      resultState: "success",
      colors: {
        info: "#3b82f6",
        success: "#22c55e",
        destructive: "#ef4444",
        mutedForeground: "#737373",
      },
    })).toMatchObject({
      isExpanded: false,
      accessibilityRole: "button",
      accessibilityLabel: "Expand read_file tool details",
      accessibilityHint: TOOL_EXECUTION_DETAIL_PRESENTATION.expandDetailsHint,
      toggleLabel: TOOL_EXECUTION_DETAIL_PRESENTATION.detailsLabel,
      toggleIcon: {
        name: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.collapsedName,
        size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.size,
        color: "rgba(115, 115, 115, 0.72)",
      },
      resultBadge: {
        state: "success",
        label: TOOL_EXECUTION_STATUS_PRESENTATION.success.label,
        accessibilityRole: "text",
        accessibilityLabel: TOOL_EXECUTION_STATUS_PRESENTATION.success.label,
        isSuccess: true,
        isError: false,
        colors: {
          backgroundColor: "rgba(34, 197, 94, 0.12)",
          color: "#22c55e",
          iconColor: "rgba(34, 197, 94, 0.9)",
        },
        icon: {
          name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.successName,
          size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badgeIcon.size,
          color: "rgba(34, 197, 94, 0.9)",
        },
      },
    })
    expect(getToolExecutionDetailMobileHeaderRenderState({
      toolName: "write_file",
      isExpanded: true,
      resultState: "error",
      colors: {
        info: "#3b82f6",
        success: "#22c55e",
        destructive: "#ef4444",
        mutedForeground: "#737373",
      },
    })).toMatchObject({
      isExpanded: true,
      accessibilityLabel: "Collapse write_file tool details",
      accessibilityHint: TOOL_EXECUTION_DETAIL_PRESENTATION.collapseDetailsHint,
      accessibilityState: { expanded: true },
      ariaExpanded: true,
      toggleLabel: TOOL_EXECUTION_DETAIL_PRESENTATION.collapseLabel,
      toggleIcon: {
        name: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.expandedName,
      },
      resultBadge: {
        state: "error",
        label: TOOL_EXECUTION_STATUS_PRESENTATION.error.label,
        accessibilityLabel: TOOL_EXECUTION_STATUS_PRESENTATION.error.label,
        isSuccess: false,
        isError: true,
        colors: {
          backgroundColor: "rgba(239, 68, 68, 0.12)",
          color: "#ef4444",
          iconColor: "rgba(239, 68, 68, 0.9)",
        },
        icon: {
          name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.errorName,
          color: "rgba(239, 68, 68, 0.9)",
        },
      },
    })
    expect(getToolExecutionDetailMobileExpandControlRenderState()).toEqual({
      isExpanded: false,
      accessibilityRole: "button",
      accessibilityLabel: "Expand tool execution details",
      accessibilityHint: TOOL_EXECUTION_DETAIL_PRESENTATION.expandExecutionHint,
      accessibilityState: { expanded: false },
      ariaExpanded: false,
    })
    expect(getToolExecutionDetailMobileCollapseControlRenderState({
      placement: "top",
      toolCallCount: 2,
      colors: {
        info: "#3b82f6",
        success: "#22c55e",
        destructive: "#ef4444",
        mutedForeground: "#737373",
      },
    })).toEqual({
      placement: "top",
      accessibilityRole: "button",
      accessibilityLabel: TOOL_EXECUTION_DETAIL_PRESENTATION.collapseExecutionAccessibilityLabel,
      accessibilityHint: TOOL_EXECUTION_DETAIL_PRESENTATION.collapseExecutionHint,
      label: "Collapse 2 tool calls",
      icon: {
        name: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.collapseName,
        size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.size,
        color: "rgba(115, 115, 115, 0.72)",
      },
    })
    expect(getToolExecutionDetailMobileCollapseControlRenderState({
      colors: {
        info: "#3b82f6",
        success: "#22c55e",
        destructive: "#ef4444",
        mutedForeground: "#737373",
      },
    })).toEqual({
      placement: "bottom",
      accessibilityRole: "button",
      accessibilityLabel: TOOL_EXECUTION_DETAIL_PRESENTATION.collapseExecutionAccessibilityLabel,
      accessibilityHint: TOOL_EXECUTION_DETAIL_PRESENTATION.collapseExecutionHint,
      label: TOOL_EXECUTION_DETAIL_PRESENTATION.collapseLabel,
      icon: {
        name: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.collapseName,
        size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.toggleIcon.size,
        color: "rgba(115, 115, 115, 0.72)",
      },
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.scroll.expandedMaxHeight).toBe(400)
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.sectionLabel).toMatchObject({
      colorToken: "mutedForeground",
      textTransform: "uppercase",
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.codeBlock).toMatchObject({
      foregroundColorToken: "foreground",
      backgroundColorToken: "muted",
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingText).toMatchObject({
      colorToken: "mutedForeground",
      fontStyle: "italic",
      textAlign: "center",
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingRow).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingSpinner).toMatchObject({
      size: 10,
      colorToken: "info",
    })
    expect(getToolExecutionDetailMobilePendingSpinnerState()).toEqual({
      size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingSpinner.size,
      colorToken: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingSpinner.colorToken,
    })
    expect(getToolExecutionDetailMobilePendingSpinnerColors({
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      color: "#3b82f6",
    })
    expect(getToolExecutionDetailMobilePendingResultRenderState({
      colors: {
        info: "#3b82f6",
        success: "#22c55e",
        destructive: "#ef4444",
        mutedForeground: "#737373",
      },
    })).toEqual({
      label: TOOL_EXECUTION_DETAIL_PRESENTATION.pendingResultLabel,
      accessibilityRole: "text",
      accessibilityLabel: TOOL_EXECUTION_DETAIL_PRESENTATION.pendingResponseAccessibilityLabel,
      spinner: {
        size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingSpinner.size,
        color: "#3b82f6",
      },
    })
    expect(getToolExecutionDetailMobileEmptyStateRenderState()).toEqual({
      label: TOOL_EXECUTION_DETAIL_PRESENTATION.noToolCallsLabel,
      accessibilityRole: "text",
      accessibilityLabel: TOOL_EXECUTION_DETAIL_PRESENTATION.noToolCallsLabel,
    })
    expect(getToolExecutionResultOnlyFallbackRenderState()).toEqual({
      label: TOOL_EXECUTION_DETAIL_PRESENTATION.toolResultFallbackLabel,
    })
    expect(getToolExecutionDetailCopyFailureAlertState()).toEqual({
      title: TOOL_EXECUTION_DETAIL_PRESENTATION.copyFailedTitle,
      fallbackMessage: TOOL_EXECUTION_DETAIL_PRESENTATION.copyFailedMessage,
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.characterCount.colorToken).toBe("mutedForeground")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.characterCount.fontFamilyByPlatform.ios).toBe("Menlo")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.detailHeaderRow).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.payloadMeta).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.payloadPreview).toMatchObject({
      maxLines: 2,
      fontFamilyByPlatform: {
        ios: "Menlo",
        default: "monospace",
      },
      backgroundColorToken: "mutedForeground",
      textColorToken: "mutedForeground",
    })
    expect(getToolExecutionDetailMobilePayloadPreviewState()).toEqual({
      numberOfLines: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.payloadPreview.maxLines,
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.resultHeader).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.resultHeaderMeta).toMatchObject({
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 1,
      minWidth: 0,
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.payloadType).toMatchObject({
      colorToken: "mutedForeground",
      opacity: 0.55,
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badge).toMatchObject({
      statusColorTokens: {
        success: "success",
        error: "destructive",
      },
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badgeIcon).toMatchObject({
      size: 11,
      opacity: 0.9,
    })
    expect(getToolExecutionDetailMobileBadgeIconState("error")).toEqual({
      state: "error",
      name: TOOL_EXECUTION_COMPACT_PRESENTATION.mobile.statusIcon.errorName,
      size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badgeIcon.size,
      opacity: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badgeIcon.opacity,
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.error).toMatchObject({
      colorToken: "destructive",
      backgroundColorToken: "destructive",
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButton.minHeight).toBe(24)
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.header.accessibilityRole).toBe("button")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.pendingRow.accessibilityRole).toBe("text")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.badge.accessibilityRole).toBe("text")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButton.accessibilityRole).toBe("button")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButton.backgroundColorToken).toBe("mutedForeground")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButton.flexDirection).toBe("row")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButton.flexShrink).toBe(0)
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon).toMatchObject({
      name: "copy-outline",
      size: 10,
      colorToken: "mutedForeground",
    })
    expect(getToolExecutionDetailMobileCopyIconState()).toEqual({
      name: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon.name,
      size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon.size,
      colorToken: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon.colorToken,
      opacity: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon.opacity,
    })
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonText.fontWeight).toBe("600")
    expect(TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonText.colorToken).toBe("mutedForeground")
    expect(getToolExecutionDetailMobilePayloadPreviewColors({
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      backgroundColor: "rgba(115, 115, 115, 0.04)",
      color: "#737373",
    })
    expect(getToolExecutionDetailMobileCopyButtonColors({
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      backgroundColor: "rgba(115, 115, 115, 0.08)",
      textColor: "#737373",
      iconColor: "rgba(115, 115, 115, 0.78)",
    })
    expect(getToolExecutionDetailMobileCopyButtonRenderState({
      kind: "output",
      toolName: "read_file",
      colors: {
        info: "#3b82f6",
        success: "#22c55e",
        destructive: "#ef4444",
        mutedForeground: "#737373",
      },
    })).toEqual({
      kind: "output",
      label: TOOL_EXECUTION_DETAIL_PRESENTATION.copyLabel,
      accessibilityRole: "button",
      accessibilityLabel: "Copy output for read_file",
      colors: {
        backgroundColor: "rgba(115, 115, 115, 0.08)",
        textColor: "#737373",
        iconColor: "rgba(115, 115, 115, 0.78)",
      },
      icon: {
        name: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon.name,
        size: TOOL_EXECUTION_DETAIL_SURFACE_PRESENTATION.mobile.copyButtonIcon.size,
        color: "rgba(115, 115, 115, 0.78)",
      },
    })
    expect(getToolExecutionDetailMobileBadgeColors("success", {
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      backgroundColor: "rgba(34, 197, 94, 0.12)",
      color: "#22c55e",
      iconColor: "rgba(34, 197, 94, 0.9)",
    })
    expect(getToolExecutionDetailMobileErrorColors({
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      backgroundColor: "rgba(239, 68, 68, 0.06)",
      color: "#ef4444",
    })
    expect(getToolExecutionDetailMobileContentColors({
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
      primary: "#2563eb",
      foreground: "#171717",
      muted: "#e5e5e5",
    })).toEqual({
      section: {
        borderBottomColor: "rgba(115, 115, 115, 0.15)",
      },
      toolName: {
        color: "#2563eb",
      },
      expandHintText: {
        color: "#737373",
      },
      sectionLabel: {
        color: "#737373",
      },
      payloadType: {
        color: "#737373",
      },
      codeBlock: {
        color: "#171717",
        backgroundColor: "#e5e5e5",
      },
      pendingText: {
        color: "#737373",
      },
      characterCount: {
        color: "#737373",
      },
    })
    expect(getToolExecutionDetailMobileColors("pending", {
      info: "#3b82f6",
      success: "#22c55e",
      destructive: "#ef4444",
      mutedForeground: "#737373",
    })).toEqual({
      borderLeftColor: "rgba(59, 130, 246, 0.5)",
      backgroundColor: "rgba(59, 130, 246, 0.02)",
    })
  })

  it("formats structured payload values for desktop and mobile tool details", () => {
    const objectPayload = formatToolExecutionStructuredPayloadValue({ path: "src/app.ts", limit: 2 })
    expect(objectPayload.isStructured).toBe(true)
    expect(objectPayload.compactText).toBe('{"path":"src/app.ts","limit":2}')
    expect(objectPayload.expandedText).toContain('"path": "src/app.ts"')
    expect(getToolExecutionPayloadValueType(objectPayload.value)).toBe("object")
    expect(getToolExecutionDetailMobileSectionHeaderRenderState({
      kind: "input",
      payload: objectPayload,
    })).toEqual({
      kind: "input",
      label: "Input:",
      payloadTypeLabel: "object",
    })

    const parsedJsonPayload = formatToolExecutionStructuredPayloadValue('{"items":[1,2]}')
    expect(parsedJsonPayload.isStructured).toBe(true)
    expect(getToolExecutionPayloadValueType(parsedJsonPayload.value)).toBe("object")
    expect(getToolExecutionDetailMobileSectionHeaderRenderState({
      kind: "output",
      payload: parsedJsonPayload,
    })).toEqual({
      kind: "output",
      label: "Output:",
      payloadTypeLabel: "object",
    })
    expect(getToolExecutionDetailMobileSectionHeaderRenderState({
      kind: "error",
    })).toEqual({
      kind: "error",
      label: "Error details:",
      payloadTypeLabel: null,
    })
    expect(getToolExecutionStructuredPayloadChildEntries(parsedJsonPayload.value)).toEqual([
      { key: "items", label: "items", value: [1, 2] },
    ])

    const longPayload = formatToolExecutionStructuredPayloadValue("one\ntwo\nthree")
    expect(longPayload.lineCount).toBe(3)
    expect(longPayload.isCollapsible).toBe(true)
    expect(longPayload.compactText).toBe("one two three")

    expect(getToolExecutionPayloadValueType([1, 2, 3])).toBe("array · 3")
    expect(getToolExecutionStructuredPayloadChildEntries(["a", "b"])).toEqual([
      { key: "0", label: "[0]", value: "a" },
      { key: "1", label: "[1]", value: "b" },
    ])
  })

  it("truncates long subagent identifiers for compact display", () => {
    expect(truncateToolExecutionSubagentId("a6a4f4d8-1234-5678-abcd-ef1234567890")).toBe("agent:a6a4f4d")
    expect(truncateToolExecutionSubagentId("agent-1")).toBe("agent-1")
    expect(truncateToolExecutionSubagentId("longsubagentidentifier")).toBe("longsubage...")
  })
})
