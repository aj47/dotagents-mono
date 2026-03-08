import React, { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { useParams, useOutletContext } from "react-router-dom"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { useAgentStore } from "@renderer/stores"
import {
  SessionGrid,
  SessionTileWrapper,
  calculateTileHeight,
  calculateTileWidth,
  getResizableTileWidthBounds,
  getResponsiveStackedLayoutWidthShortfall,
  getSingleViewLayoutRestoreHeight,
  getSingleViewLayoutRestoreWidth,
  isResponsiveStackedTileLayout,
  shouldUseSparseWideGridHeight,
  shouldLockTileWidth,
  type SessionGridMeasurements,
  type TileLayoutMode,
} from "@renderer/components/session-grid"
import { SIDEBAR_DIMENSIONS } from "@renderer/hooks/use-sidebar"
import { clearPersistedSize } from "@renderer/hooks/use-resizable"
import { AgentProgress } from "@renderer/components/agent-progress"
import {
  MessageCircle,
  Mic,
  Plus,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  LayoutGrid,
  Maximize2,
  Grid2x2,
  Keyboard,
  Clock,
  Loader2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  EyeOff,
  PanelLeftClose,
} from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import { cn } from "@renderer/lib/utils"
import type { AgentProfile, AgentProgressUpdate } from "@shared/types"
import { toast } from "sonner"

import { applySelectedAgentToNextSession as applySelectedAgentForNextSession } from "@renderer/lib/apply-selected-agent"
import { logUI } from "@renderer/lib/debug"
import { PredefinedPromptsMenu } from "@renderer/components/predefined-prompts-menu"
import {
  AgentSelector,
  useSelectedAgentId,
} from "@renderer/components/agent-selector"
import { useConfigQuery } from "@renderer/lib/query-client"
import { useConversationHistoryQuery } from "@renderer/lib/queries"
import {
  getMcpToolsShortcutDisplay,
  getTextInputShortcutDisplay,
  getDictationShortcutDisplay,
} from "@shared/key-utils"
import dayjs from "dayjs"

interface LayoutContext {
  onOpenPastSessionsDialog: () => void
  sidebarWidth: number
  collapseSidebar: () => void
}

function formatTimestamp(timestamp: number): string {
  const now = dayjs()
  const date = dayjs(timestamp)
  const diffHours = Math.max(0, now.diff(date, "hour"))

  if (diffHours < 24) {
    const diffSeconds = Math.max(0, now.diff(date, "second"))
    const diffMinutes = Math.max(0, now.diff(date, "minute"))
    if (diffSeconds < 60) return `${diffSeconds}s`
    if (diffMinutes < 60) return `${diffMinutes}m`
    return `${diffHours}h`
  }
  if (diffHours < 168) return date.format("ddd h:mm A")
  return date.format("MMM D")
}

const RECENT_SESSIONS_LIMIT = 8
const PENDING_CONTINUATION_TIMEOUT_MS = 20_000
const RECENT_REORDER_VISUAL_CUE_DURATION_MS = 1_600
const RECENT_SINGLE_VIEW_RETURN_VISUAL_CUE_DURATION_MS = 1_800
const RECENT_SINGLE_VIEW_RESTORE_ADJUSTMENT_CUE_DURATION_MS = 2_400
const RECENT_WIDTH_LOCK_HINT_DURATION_MS = 2_400

const TILE_LAYOUT_OPTIONS = [
  {
    mode: "1x2",
    label: "Compare",
    title: "Compare sessions side by side",
    Icon: LayoutGrid,
  },
  {
    mode: "2x2",
    label: "Grid",
    title: "Show sessions in a 2×2 grid",
    Icon: Grid2x2,
  },
  {
    mode: "1x1",
    label: "Single",
    title: "Show one session at a time",
    Icon: Maximize2,
  },
] as const satisfies ReadonlyArray<{
  mode: TileLayoutMode
  label: string
  title: string
  Icon: typeof LayoutGrid
}>

const LAYOUT_LABELS: Record<TileLayoutMode, string> = {
  "1x2": "Compare view",
  "2x2": "Grid view",
  "1x1": "Single view",
}

const LAYOUT_DESCRIPTIONS: Record<TileLayoutMode, string> = {
  "1x2": "Side by side",
  "2x2": "More at once",
  "1x1": "One at a time",
}

function getSingleViewReturnAnnouncement(
  layoutMode: TileLayoutMode,
  sessionLabel: string,
): string {
  const layoutLabel =
    layoutMode === "1x1" ? "tiled layout" : LAYOUT_LABELS[layoutMode]

  return `Returned to ${layoutLabel}. Kept ${sessionLabel} visible.`
}

const RESPONSIVE_STACKED_LAYOUT_DESCRIPTION = "Stacked to fit"
const RESPONSIVE_STACKED_LAYOUT_SHORT_LABEL = "Stacked"
const TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION =
  "Expanded for one visible session"
const TEMPORARY_SINGLE_VISIBLE_LAYOUT_SHORT_LABEL = "One visible"
const SPARSE_WIDE_GRID_LAYOUT_DESCRIPTION =
  "Expanded for two visible sessions"
const SPARSE_WIDE_GRID_LAYOUT_SHORT_LABEL = "Two visible"
const COMPACT_SESSION_HEADER_WIDTH = 760
const TIGHT_SESSION_HEADER_WIDTH = 620
const NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER = 96
const TILE_LAYOUT_MODE_STORAGE_KEY = "dotagents-sessions-tile-layout-mode"
const PREVIOUS_TILE_LAYOUT_MODE_STORAGE_KEY =
  "dotagents-sessions-previous-layout-mode"
const DEFAULT_TILE_LAYOUT_MODE: TileLayoutMode = "1x2"

type RestorableTileLayoutMode = Exclude<TileLayoutMode, "1x1">
const DEFAULT_RESTORABLE_TILE_LAYOUT_MODE: RestorableTileLayoutMode = "1x2"
type LayoutPressureAnnouncementState = "stable" | "near" | "stacked"
type SingleViewRestoreAdjustment = "width" | "height" | "size"

function getSingleViewRestoreAdjustment(
  rememberedWidth: number | null,
  restoredWidth: number | null,
  rememberedHeight: number | null,
  restoredHeight: number | null,
): SingleViewRestoreAdjustment | null {
  const discardedWidth = rememberedWidth !== null && restoredWidth === null
  const discardedHeight = rememberedHeight !== null && restoredHeight === null

  if (discardedWidth && discardedHeight) return "size"
  if (discardedWidth) return "width"
  if (discardedHeight) return "height"

  return null
}

function getSingleViewRestoreAdjustmentAnnouncement(
  layoutMode: RestorableTileLayoutMode,
  adjustment: SingleViewRestoreAdjustment,
): string {
  const adjustedDimension =
    adjustment === "size"
      ? "tile size"
      : adjustment === "width"
        ? "tile width"
        : "tile height"

  return `Used the current ${adjustedDimension} because the saved Single view ${adjustedDimension} no longer fit ${LAYOUT_LABELS[layoutMode]}.`
}

function getSingleViewRestoreAdjustmentHint(
  layoutMode: RestorableTileLayoutMode,
  adjustment: SingleViewRestoreAdjustment,
  compact: boolean,
  veryCompact: boolean,
): { label: string; badgeLabel: string | null; title: string } {
  const label = veryCompact
    ? "Fit"
    : compact
      ? "Fit layout"
      : layoutMode === "1x2"
        ? "Fit Compare"
        : "Fit Grid"
  const badgeLabel = veryCompact
    ? null
    : adjustment === "size"
      ? "Tile size"
      : adjustment === "width"
        ? "Width"
        : "Height"

  return {
    label,
    badgeLabel,
    title:
      `Returned to ${LAYOUT_LABELS[layoutMode]} using the current ` +
      `${adjustment === "size" ? "tile size" : adjustment === "width" ? "tile width" : "tile height"} ` +
      `because the saved Single view ${adjustment === "size" ? "size" : adjustment} no longer fit this tiled layout.`,
  }
}

type PanelMode = "normal" | "agent" | "textInput"
type PanelSize = { width: number; height: number }
type PanelLayoutPressureState = PanelSize & {
  isVisible: boolean
  minWidth: number
  mode: PanelMode
}

const isPanelMode = (value: unknown): value is PanelMode =>
  value === "normal" || value === "agent" || value === "textInput"

const isPanelSize = (value: unknown): value is PanelSize =>
  !!value &&
  typeof value === "object" &&
  "width" in value &&
  "height" in value &&
  typeof (value as { width: unknown }).width === "number" &&
  typeof (value as { height: unknown }).height === "number"

const isPanelLayoutPressureState = (
  value: unknown,
): value is PanelLayoutPressureState =>
  !!value &&
  typeof value === "object" &&
  "isVisible" in value &&
  typeof (value as { isVisible: unknown }).isVisible === "boolean" &&
  "minWidth" in value &&
  typeof (value as { minWidth: unknown }).minWidth === "number" &&
  "mode" in value &&
  isPanelMode((value as { mode: unknown }).mode) &&
  isPanelSize(value)

const STACKED_LAYOUT_RECOVERY_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
    titleWithoutPanelRecovery: string
  }
> = {
  "1x2": {
    fullLabel: "Make room to compare",
    compactLabel: "Make room",
    title:
      "Compare view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to compare side by side again.",
    titleWithoutPanelRecovery:
      "Compare view stacked to fit. Widen the sessions area or narrow the sidebar to compare side by side again.",
  },
  "2x2": {
    fullLabel: "Make room for grid",
    compactLabel: "Make room",
    title:
      "Grid view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to restore multiple columns.",
    titleWithoutPanelRecovery:
      "Grid view stacked to fit. Widen the sessions area or narrow the sidebar to restore multiple columns.",
  },
}

const NEAR_STACKED_LAYOUT_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
    titleWithoutPanelRecovery: string
  }
> = {
  "1x2": {
    fullLabel: "Close to stacking",
    compactLabel: "Tight fit",
    title:
      "Compare view will stack if the sessions area gets a little narrower. Widen the sessions area, narrow the sidebar, or shrink the floating panel to keep sessions side by side.",
    titleWithoutPanelRecovery:
      "Compare view will stack if the sessions area gets a little narrower. Widen the sessions area or narrow the sidebar to keep sessions side by side.",
  },
  "2x2": {
    fullLabel: "Close to stacking",
    compactLabel: "Tight fit",
    title:
      "Grid view will stack if the sessions area gets a little narrower. Widen the sessions area, narrow the sidebar, or shrink the floating panel to keep multiple columns visible.",
    titleWithoutPanelRecovery:
      "Grid view will stack if the sessions area gets a little narrower. Widen the sessions area or narrow the sidebar to keep multiple columns visible.",
  },
}

function getResponsiveWidthLockHintTitle(
  layoutMode: RestorableTileLayoutMode,
): string {
  return layoutMode === "1x2"
    ? "Compare view stacked to fit. Tile width now follows the stacked layout, so drag a tile's bottom edge to resize height or widen the sessions area to resize width again."
    : "Grid view stacked to fit. Tile width now follows the stacked layout, so drag a tile's bottom edge to resize height or widen the sessions area to resize width again."
}

function getLayoutPressureAnnouncement(
  layoutMode: RestorableTileLayoutMode,
  previousState: LayoutPressureAnnouncementState,
  nextState: LayoutPressureAnnouncementState,
): string {
  if (nextState === "stacked") {
    return layoutMode === "1x2"
      ? "Compare view stacked to fit. Tile width now follows the stacked layout."
      : "Grid view stacked to fit. Tile width now follows the stacked layout."
  }

  if (nextState === "near") {
    if (previousState === "stacked") {
      return layoutMode === "1x2"
        ? "Compare view is side by side again, but still close to stacking."
        : "Grid view has multiple columns again, but is still close to stacking."
    }

    return layoutMode === "1x2"
      ? "Compare view is close to stacking. Make room to keep sessions side by side."
      : "Grid view is close to stacking. Make room to keep multiple columns visible."
  }

  return layoutMode === "1x2"
    ? "Compare view has room again for side-by-side sessions."
    : "Grid view has room again for multiple columns."
}

function isTileLayoutMode(value: string | null): value is TileLayoutMode {
  return value === "1x2" || value === "2x2" || value === "1x1"
}

function isRestorableTileLayoutMode(
  value: string | null,
): value is RestorableTileLayoutMode {
  return value === "1x2" || value === "2x2"
}

function loadPersistedTileLayoutPreference(): {
  currentLayoutMode: TileLayoutMode
  previousLayoutMode: RestorableTileLayoutMode
} {
  try {
    const storedCurrentLayoutMode = localStorage.getItem(
      TILE_LAYOUT_MODE_STORAGE_KEY,
    )
    const storedPreviousLayoutMode = localStorage.getItem(
      PREVIOUS_TILE_LAYOUT_MODE_STORAGE_KEY,
    )
    const currentLayoutMode = isTileLayoutMode(storedCurrentLayoutMode)
      ? storedCurrentLayoutMode
      : DEFAULT_TILE_LAYOUT_MODE

    if (isRestorableTileLayoutMode(storedPreviousLayoutMode)) {
      return {
        currentLayoutMode,
        previousLayoutMode: storedPreviousLayoutMode,
      }
    }

    return {
      currentLayoutMode,
      previousLayoutMode:
        currentLayoutMode === "1x1"
          ? DEFAULT_RESTORABLE_TILE_LAYOUT_MODE
          : currentLayoutMode,
    }
  } catch {
    return {
      currentLayoutMode: DEFAULT_TILE_LAYOUT_MODE,
      previousLayoutMode: DEFAULT_RESTORABLE_TILE_LAYOUT_MODE,
    }
  }
}

function persistTileLayoutPreference(
  currentLayoutMode: TileLayoutMode,
  previousLayoutMode: RestorableTileLayoutMode,
): void {
  try {
    localStorage.setItem(TILE_LAYOUT_MODE_STORAGE_KEY, currentLayoutMode)
    localStorage.setItem(
      PREVIOUS_TILE_LAYOUT_MODE_STORAGE_KEY,
      previousLayoutMode,
    )
  } catch {}
}

function getSessionTileLabel(
  sessionId: string,
  progress: AgentProgressUpdate | null | undefined,
): string {
  const title = progress?.conversationTitle?.trim()
  if (title) return title

  const firstUserMessage = progress?.conversationHistory?.find(
    (message) =>
      message.role === "user" &&
      typeof message.content === "string" &&
      message.content.trim().length > 0,
  )
  if (typeof firstUserMessage?.content === "string") {
    return firstUserMessage.content.trim()
  }

  if (sessionId.startsWith("pending-")) {
    return "Continuing session"
  }

  return `Session ${sessionId.slice(0, 8)}`
}

function getFocusLayoutFallbackSessionId(
  focusableSessionIds: string[],
  previousFocusableSessionIds: string[],
  missingFocusedSessionId: string | null,
): string | null {
  if (focusableSessionIds.length === 0) return null
  if (!missingFocusedSessionId) return focusableSessionIds[0] ?? null

  const previousIndex = previousFocusableSessionIds.indexOf(
    missingFocusedSessionId,
  )
  if (previousIndex === -1) return focusableSessionIds[0] ?? null

  return (
    focusableSessionIds[
      Math.min(previousIndex, focusableSessionIds.length - 1)
    ] ??
    focusableSessionIds[0] ??
    null
  )
}

function getDropBeforeInsertIndex(draggedIndex: number, targetIndex: number): number {
  return draggedIndex < targetIndex ? targetIndex - 1 : targetIndex
}

function moveSessionToIndex(
  currentOrder: string[],
  sessionId: string,
  targetIndex: number,
): string[] {
  const currentIndex = currentOrder.indexOf(sessionId)

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= currentOrder.length) {
    return currentOrder
  }

  if (currentIndex === targetIndex) {
    return currentOrder
  }

  const newOrder = [...currentOrder]
  newOrder.splice(currentIndex, 1)
  newOrder.splice(targetIndex, 0, sessionId)
  return newOrder
}

function getSessionReorderNeighborContextLabel(options?: {
  previousSessionLabel?: string | null
  nextSessionLabel?: string | null
  vertical?: boolean
}): string | null {
  const previousSessionLabel = options?.previousSessionLabel?.trim() || null
  const nextSessionLabel = options?.nextSessionLabel?.trim() || null
  const trailingRelation = options?.vertical ? "below" : "after"
  const leadingRelation = options?.vertical ? "above" : "before"

  return previousSessionLabel
    ? nextSessionLabel
      ? `between ${previousSessionLabel} and ${nextSessionLabel}`
      : `${trailingRelation} ${previousSessionLabel}`
    : nextSessionLabel
      ? `${leadingRelation} ${nextSessionLabel}`
      : null
}

function getSessionReorderAnnouncement(
  sessionLabel: string,
  position: number,
  totalSessions: number,
  options?: {
    previousSessionLabel?: string | null
    nextSessionLabel?: string | null
    vertical?: boolean
  },
): string {
  const neighborContext = getSessionReorderNeighborContextLabel(options)

  if (neighborContext) {
    return `Moved ${sessionLabel} to position ${position} of ${totalSessions}, ${neighborContext}.`
  }

  return `Moved ${sessionLabel} to position ${position} of ${totalSessions}.`
}

function getSessionReorderAnnouncementContext(
  orderedSessionIds: string[],
  movedSessionId: string,
  sessionLabelById: ReadonlyMap<string, string>,
): {
  previousSessionLabel: string | null
  nextSessionLabel: string | null
} {
  const movedSessionIndex = orderedSessionIds.indexOf(movedSessionId)

  if (movedSessionIndex === -1) {
    return {
      previousSessionLabel: null,
      nextSessionLabel: null,
    }
  }

  const previousSessionId = orderedSessionIds[movedSessionIndex - 1] ?? null
  const nextSessionId = orderedSessionIds[movedSessionIndex + 1] ?? null

  return {
    previousSessionLabel: previousSessionId
      ? sessionLabelById.get(previousSessionId) ?? null
      : null,
    nextSessionLabel: nextSessionId
      ? sessionLabelById.get(nextSessionId) ?? null
      : null,
  }
}

function getSessionReorderDropTargetIndicatorCopy(
  orderedSessionIds: string[],
  draggedSessionId: string,
  targetIndex: number,
  sessionLabelById: ReadonlyMap<string, string>,
  options?: {
    vertical?: boolean
  },
): {
  contextLabel: string
  title: string
} {
  const draggedIndex = orderedSessionIds.indexOf(draggedSessionId)
  const draggedSessionLabel = sessionLabelById.get(draggedSessionId)?.trim() || "session"

  if (draggedIndex === -1) {
    return {
      contextLabel: "here",
      title: `Move ${draggedSessionLabel} here`,
    }
  }

  const insertionIndex = getDropBeforeInsertIndex(draggedIndex, targetIndex)
  const nextOrder = moveSessionToIndex(
    orderedSessionIds,
    draggedSessionId,
    insertionIndex,
  )
  const neighborContextLabel = getSessionReorderNeighborContextLabel(
    {
      ...getSessionReorderAnnouncementContext(
        nextOrder,
        draggedSessionId,
        sessionLabelById,
      ),
      vertical: options?.vertical,
    },
  )

  if (neighborContextLabel) {
    return {
      contextLabel: neighborContextLabel,
      title: `Move ${draggedSessionLabel} ${neighborContextLabel}`,
    }
  }

  return {
    contextLabel: "here",
    title: `Move ${draggedSessionLabel} here`,
  }
}

const SessionProgressTile = React.memo(function SessionProgressTile({
  sessionId,
  progress,
  index,
  isCollapsed,
  isDraggable,
  draggedTileLabel,
  isFocused,
  isExpanded,
  isDragTarget,
  isDragging,
  dropTargetIndicatorContextLabel,
  dropTargetIndicatorTitle,
  isRecentlyReordered,
  isRecentlyRestoredFromSingleView,
  showTileMaximize,
  onFocusSession,
  onDismissSession,
  onCollapsedChange,
  onMaximizeTile,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onKeyboardReorder,
  canMoveEarlier,
  canMoveLater,
  setSessionRef,
}: {
  sessionId: string
  progress: AgentProgressUpdate
  index: number
  isCollapsed: boolean
  isDraggable: boolean
  draggedTileLabel: string | null
  isFocused: boolean
  isExpanded: boolean
  isDragTarget: boolean
  isDragging: boolean
  dropTargetIndicatorContextLabel?: string | null
  dropTargetIndicatorTitle?: string | null
  isRecentlyReordered: boolean
  isRecentlyRestoredFromSingleView: boolean
  showTileMaximize: boolean
  onFocusSession: (sessionId: string) => Promise<void>
  onDismissSession: (sessionId: string) => Promise<void>
  onCollapsedChange: (sessionId: string, collapsed: boolean) => void
  onMaximizeTile: (sessionId?: string) => void
  onDragStart: (sessionId: string, index: number) => void
  onDragOver: (index: number) => void
  onDragLeave: (index: number) => void
  onDrop: (index: number) => void
  onDragEnd: () => void
  onKeyboardReorder: (
    sessionId: string,
    direction: "earlier" | "later",
  ) => void
  canMoveEarlier: boolean
  canMoveLater: boolean
  setSessionRef: (sessionId: string, el: HTMLDivElement | null) => void
}) {
  const handleFocus = useCallback(() => {
    void onFocusSession(sessionId)
  }, [onFocusSession, sessionId])

  const handleDismiss = useCallback(() => {
    void onDismissSession(sessionId)
  }, [onDismissSession, sessionId])

  const handleCollapsed = useCallback(
    (collapsed: boolean) => {
      onCollapsedChange(sessionId, collapsed)
    },
    [onCollapsedChange, sessionId],
  )

  const handleExpand = useCallback(() => {
    onMaximizeTile(sessionId)
  }, [onMaximizeTile, sessionId])

  const handleKeyboardReorder = useCallback(
    (direction: "earlier" | "later") => {
      onKeyboardReorder(sessionId, direction)
    },
    [onKeyboardReorder, sessionId],
  )

  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      setSessionRef(sessionId, el)
    },
    [sessionId, setSessionRef],
  )
  const tileLabel = getSessionTileLabel(sessionId, progress)

  return (
    <div ref={handleRef}>
      <SessionTileWrapper
        sessionId={sessionId}
        tileLabel={tileLabel}
        draggedTileLabel={draggedTileLabel}
        index={index}
        isCollapsed={isCollapsed}
        isDraggable={isDraggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onKeyboardReorder={handleKeyboardReorder}
        canMoveEarlier={canMoveEarlier}
        canMoveLater={canMoveLater}
        isDragTarget={isDragTarget}
        isDragging={isDragging}
        dropTargetIndicatorContextLabel={dropTargetIndicatorContextLabel}
        dropTargetIndicatorTitle={dropTargetIndicatorTitle}
        isRecentlyReordered={isRecentlyReordered}
        isRecentlyRestoredFromSingleView={isRecentlyRestoredFromSingleView}
      >
        <AgentProgress
          progress={progress}
          variant="tile"
          isFocused={isFocused}
          onFocus={handleFocus}
          onDismiss={handleDismiss}
          isCollapsed={isCollapsed}
          onCollapsedChange={handleCollapsed}
          onExpand={showTileMaximize ? handleExpand : undefined}
          isExpanded={isExpanded}
        />
      </SessionTileWrapper>
    </div>
  )
})

function EmptyState({
  onTextClick,
  onVoiceClick,
  onSelectPrompt,
  onPastSessionClick,
  onOpenPastSessionsDialog,
  textInputShortcut,
  voiceInputShortcut,
  dictationShortcut,
  selectedAgentId,
  onSelectAgent,
}: {
  onTextClick: () => void
  onVoiceClick: () => void
  onSelectPrompt: (content: string) => void
  onPastSessionClick: (conversationId: string) => void
  onOpenPastSessionsDialog: () => void
  textInputShortcut: string
  voiceInputShortcut: string
  dictationShortcut: string
  selectedAgentId: string | null
  onSelectAgent: (id: string | null) => void
}) {
  const conversationHistoryQuery = useConversationHistoryQuery()
  const recentSessions = useMemo(
    () => (conversationHistoryQuery.data ?? []).slice(0, RECENT_SESSIONS_LIMIT),
    [conversationHistoryQuery.data],
  )
  const totalCount = conversationHistoryQuery.data?.length ?? 0

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <MessageCircle className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No Active Sessions</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start a new agent session using text or voice input. Your sessions will
        appear here as tiles.
      </p>
      <div className="flex w-full max-w-lg flex-col items-center gap-4">
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onTextClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Start with Text
          </Button>
          <Button variant="secondary" onClick={onVoiceClick} className="gap-2">
            <Mic className="h-4 w-4" />
            Start with Voice
          </Button>
          <PredefinedPromptsMenu onSelectPrompt={onSelectPrompt} />
        </div>
        {/* Keybind hints - visible on all screens, wraps on narrow */}
        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5 shrink-0" />
            <span>Text:</span>
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-semibold">
              {textInputShortcut}
            </kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Voice:</span>
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-semibold">
              {voiceInputShortcut}
            </kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Dictation:</span>
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-semibold">
              {dictationShortcut}
            </kbd>
          </div>
        </div>
      </div>

      {/* Recent past sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-8 w-full max-w-lg text-left">
          <div className="mb-2 flex items-center justify-between px-1">
            <h4 className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
              <Clock className="h-3.5 w-3.5" />
              Recent Sessions
            </h4>
            {totalCount > RECENT_SESSIONS_LIMIT && (
              <button
                onClick={onOpenPastSessionsDialog}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                View all ({totalCount})
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {recentSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onPastSessionClick(session.id)}
                className="hover:bg-accent/50 group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
              >
                <CheckCircle2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">{session.title}</span>
                <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                  {formatTimestamp(session.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Component() {
  const queryClient = useQueryClient()
  const { id: routeHistoryItemId } = useParams<{ id: string }>()
  const { onOpenPastSessionsDialog, sidebarWidth, collapseSidebar } =
    (useOutletContext<LayoutContext>() ?? {}) as Partial<LayoutContext>
  const agentProgressById = useAgentStore((s) => s.agentProgressById)
  const focusedSessionId = useAgentStore((s) => s.focusedSessionId)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const [selectedAgentId, setSelectedAgentId] = useSelectedAgentId()
  const scrollToSessionId = useAgentStore((s) => s.scrollToSessionId)
  const setScrollToSessionId = useAgentStore((s) => s.setScrollToSessionId)
  // Get config for shortcut displays
  const configQuery = useConfigQuery()
  const textInputShortcut = getTextInputShortcutDisplay(
    configQuery.data?.textInputShortcut,
    configQuery.data?.customTextInputShortcut,
  )
  const voiceInputShortcut = getMcpToolsShortcutDisplay(
    configQuery.data?.mcpToolsShortcut,
    configQuery.data?.customMcpToolsShortcut,
  )
  const dictationShortcut = getDictationShortcutDisplay(
    configQuery.data?.shortcut,
    configQuery.data?.customShortcut,
  )
  const initialTileLayoutPreferenceRef = useRef<ReturnType<
    typeof loadPersistedTileLayoutPreference
  > | null>(null)

  if (!initialTileLayoutPreferenceRef.current) {
    initialTileLayoutPreferenceRef.current = loadPersistedTileLayoutPreference()
  }

  const [sessionOrder, setSessionOrder] = useState<string[]>([])
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null)
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null)
  const [reorderAnnouncement, setReorderAnnouncement] = useState("")
  const [recentlyReorderedSessionId, setRecentlyReorderedSessionId] = useState<string | null>(null)
  const [recentlyRestoredFromSingleViewSessionId, setRecentlyRestoredFromSingleViewSessionId] = useState<string | null>(null)
  const [recentSingleViewRestoreAdjustment, setRecentSingleViewRestoreAdjustment] =
    useState<SingleViewRestoreAdjustment | null>(null)
  const [collapsedSessions, setCollapsedSessions] = useState<
    Record<string, boolean>
  >({})
  const [tileResetKey, setTileResetKey] = useState(0)
  const [tileLayoutMode, setTileLayoutMode] = useState<TileLayoutMode>(
    initialTileLayoutPreferenceRef.current.currentLayoutMode,
  )
  const [sessionGridMeasurements, setSessionGridMeasurements] = useState<
    SessionGridMeasurements
  >({
    containerWidth: 0,
    containerHeight: 0,
    gap: 16,
  })
  const [panelLayoutPressureState, setPanelLayoutPressureState] =
    useState<PanelLayoutPressureState | null>(null)
  const [isShrinkingPanelForLayoutPressure, setIsShrinkingPanelForLayoutPressure] =
    useState(false)
  const [isHidingPanelForLayoutPressure, setIsHidingPanelForLayoutPressure] =
    useState(false)
  const [recentWidthLockHintLayoutMode, setRecentWidthLockHintLayoutMode] =
    useState<RestorableTileLayoutMode | null>(null)
  const [layoutPressureAnnouncement, setLayoutPressureAnnouncement] = useState("")

  const sessionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const pendingSessionScrollRafRef = useRef<number | null>(null)
  const recentReorderVisualCueTimeoutRef = useRef<number | null>(null)
  const recentSingleViewReturnVisualCueTimeoutRef = useRef<number | null>(null)
  const recentSingleViewRestoreAdjustmentTimeoutRef = useRef<number | null>(null)
  const recentWidthLockHintTimeoutRef = useRef<number | null>(null)
  const lastResponsiveStackedLayoutRef = useRef(false)
  const hasObservedResponsiveStackedLayoutRef = useRef(false)
  const lastLayoutPressureAnnouncementStateRef =
    useRef<LayoutPressureAnnouncementState>("stable")
  const hasObservedLayoutPressureAnnouncementRef = useRef(false)
  const setSessionRef = useCallback(
    (sessionId: string, el: HTMLDivElement | null) => {
      sessionRefs.current[sessionId] = el
    },
    [],
  )

  const clearPendingSessionScroll = useCallback(() => {
    if (pendingSessionScrollRafRef.current !== null) {
      cancelAnimationFrame(pendingSessionScrollRafRef.current)
      pendingSessionScrollRafRef.current = null
    }
  }, [])

  const clearRecentReorderVisualCue = useCallback(() => {
    if (recentReorderVisualCueTimeoutRef.current !== null) {
      window.clearTimeout(recentReorderVisualCueTimeoutRef.current)
      recentReorderVisualCueTimeoutRef.current = null
    }
  }, [])

  const showRecentReorderVisualCue = useCallback(
    (sessionId: string) => {
      clearRecentReorderVisualCue()
      setRecentlyReorderedSessionId(sessionId)
      recentReorderVisualCueTimeoutRef.current = window.setTimeout(() => {
        recentReorderVisualCueTimeoutRef.current = null
        setRecentlyReorderedSessionId((currentSessionId) =>
          currentSessionId === sessionId ? null : currentSessionId,
        )
      }, RECENT_REORDER_VISUAL_CUE_DURATION_MS)
    },
    [clearRecentReorderVisualCue],
  )

  const clearRecentSingleViewReturnVisualCue = useCallback(() => {
    if (recentSingleViewReturnVisualCueTimeoutRef.current !== null) {
      window.clearTimeout(recentSingleViewReturnVisualCueTimeoutRef.current)
      recentSingleViewReturnVisualCueTimeoutRef.current = null
    }

    setRecentlyRestoredFromSingleViewSessionId(null)
  }, [])

  const showRecentSingleViewReturnVisualCue = useCallback(
    (sessionId: string) => {
      clearRecentSingleViewReturnVisualCue()
      setRecentlyRestoredFromSingleViewSessionId(sessionId)
      recentSingleViewReturnVisualCueTimeoutRef.current = window.setTimeout(() => {
        recentSingleViewReturnVisualCueTimeoutRef.current = null
        setRecentlyRestoredFromSingleViewSessionId((currentSessionId) =>
          currentSessionId === sessionId ? null : currentSessionId,
        )
      }, RECENT_SINGLE_VIEW_RETURN_VISUAL_CUE_DURATION_MS)
    },
    [clearRecentSingleViewReturnVisualCue],
  )

  const clearRecentSingleViewRestoreAdjustmentCue = useCallback(() => {
    if (recentSingleViewRestoreAdjustmentTimeoutRef.current !== null) {
      window.clearTimeout(recentSingleViewRestoreAdjustmentTimeoutRef.current)
      recentSingleViewRestoreAdjustmentTimeoutRef.current = null
    }

    setRecentSingleViewRestoreAdjustment(null)
  }, [])

  const showRecentSingleViewRestoreAdjustmentCue = useCallback(
    (adjustment: SingleViewRestoreAdjustment) => {
      clearRecentSingleViewRestoreAdjustmentCue()
      setRecentSingleViewRestoreAdjustment(adjustment)
      recentSingleViewRestoreAdjustmentTimeoutRef.current = window.setTimeout(() => {
        recentSingleViewRestoreAdjustmentTimeoutRef.current = null
        setRecentSingleViewRestoreAdjustment((currentAdjustment) =>
          currentAdjustment === adjustment ? null : currentAdjustment,
        )
      }, RECENT_SINGLE_VIEW_RESTORE_ADJUSTMENT_CUE_DURATION_MS)
    },
    [clearRecentSingleViewRestoreAdjustmentCue],
  )

  const clearRecentWidthLockHint = useCallback(() => {
    if (recentWidthLockHintTimeoutRef.current !== null) {
      window.clearTimeout(recentWidthLockHintTimeoutRef.current)
      recentWidthLockHintTimeoutRef.current = null
    }

    setRecentWidthLockHintLayoutMode(null)
  }, [])

  const showRecentWidthLockHint = useCallback(
    (layoutMode: RestorableTileLayoutMode) => {
      if (recentWidthLockHintTimeoutRef.current !== null) {
        window.clearTimeout(recentWidthLockHintTimeoutRef.current)
      }

      setRecentWidthLockHintLayoutMode(layoutMode)
      recentWidthLockHintTimeoutRef.current = window.setTimeout(() => {
        recentWidthLockHintTimeoutRef.current = null
        setRecentWidthLockHintLayoutMode((currentLayoutMode) =>
          currentLayoutMode === layoutMode ? null : currentLayoutMode,
        )
      }, RECENT_WIDTH_LOCK_HINT_DURATION_MS)
    },
    [],
  )

  useEffect(() => () => {
    clearRecentReorderVisualCue()
  }, [clearRecentReorderVisualCue])

  useEffect(() => () => {
    clearRecentSingleViewReturnVisualCue()
  }, [clearRecentSingleViewReturnVisualCue])

  useEffect(() => () => {
    clearRecentSingleViewRestoreAdjustmentCue()
  }, [clearRecentSingleViewRestoreAdjustmentCue])

  useEffect(() => () => {
    clearRecentWidthLockHint()
  }, [clearRecentWidthLockHint])

  const scrollSessionTileIntoView = useCallback(
    (sessionId: string, options?: { clearScrollRequest?: boolean }) => {
      clearPendingSessionScroll()

      let remainingAnimationFrameAttempts = 3

      const runScrollWhenTileIsReady = () => {
        const targetTile = sessionRefs.current[sessionId]

        if (targetTile) {
          pendingSessionScrollRafRef.current = null
          // Snap immediately once the tile is ready.
          // The previous delayed smooth-scroll path could keep a stale request alive
          // long enough to yank the sessions page after the user had already scrolled
          // somewhere else, and the animation itself added extra outer-scroll motion
          // while active tiles were still updating.
          targetTile.scrollIntoView({ behavior: "auto", block: "center" })
          if (options?.clearScrollRequest) {
            setScrollToSessionId(null)
          }
          return
        }

        remainingAnimationFrameAttempts -= 1
        if (remainingAnimationFrameAttempts <= 0) {
          pendingSessionScrollRafRef.current = null
          if (options?.clearScrollRequest) {
            setScrollToSessionId(null)
          }
          return
        }

        pendingSessionScrollRafRef.current = requestAnimationFrame(
          runScrollWhenTileIsReady,
        )
      }

      pendingSessionScrollRafRef.current = requestAnimationFrame(
        runScrollWhenTileIsReady,
      )
    },
    [clearPendingSessionScroll, setScrollToSessionId],
  )

  const handleSessionGridMeasurementsChange = useCallback(
    ({ containerWidth, containerHeight, gap }: SessionGridMeasurements) => {
      setSessionGridMeasurements((previous) => {
        if (
          previous.containerWidth === containerWidth &&
          previous.containerHeight === containerHeight &&
          previous.gap === gap
        ) {
          return previous
        }

        return { containerWidth, containerHeight, gap }
      })
    },
    [],
  )

  const handleCollapsedChange = useCallback(
    (sessionId: string, collapsed: boolean) => {
      setCollapsedSessions((prev) => ({
        ...prev,
        [sessionId]: collapsed,
      }))
    },
    [],
  )

  /**
   * Returns the timestamp of the most recent activity in a session.
   * Used to sort sessions by last modified time on initial load.
   */
  const getLastActivityTimestamp = useCallback(
    (progress: AgentProgressUpdate | null | undefined): number => {
      if (!progress) return 0
      const lastStepTimestamp =
        progress.steps?.length > 0
          ? progress.steps[progress.steps.length - 1].timestamp
          : 0
      const history = progress.conversationHistory
      const lastHistoryTimestamp =
        history && history.length > 0
          ? (history[history.length - 1].timestamp ?? 0)
          : 0
      return Math.max(lastStepTimestamp, lastHistoryTimestamp)
    },
    [],
  )

  // State for pending conversation continuation (user selected a conversation to continue)
  // Declared before allProgressEntries so it can be used in the filter below.
  const [pendingConversationId, setPendingConversationId] = useState<
    string | null
  >(null)
  const [pendingContinuationStartedAt, setPendingContinuationStartedAt] =
    useState<number | null>(null)
  const pendingConversationIdRef = useRef<string | null>(pendingConversationId)
  const pendingContinuationStartedAtRef = useRef<number | null>(
    pendingContinuationStartedAt,
  )

  useEffect(() => {
    pendingConversationIdRef.current = pendingConversationId
  }, [pendingConversationId])

  useEffect(() => {
    pendingContinuationStartedAtRef.current = pendingContinuationStartedAt
  }, [pendingContinuationStartedAt])

  useEffect(() => {
    setPendingContinuationStartedAt(null)
  }, [pendingConversationId])

  // Check if any real (non-pending) active session exists for the pending conversation.
  // Used both to suppress duplicate tiles in the memo AND to auto-dismiss the pending tile.
  const hasRealActiveSessionForPending = pendingConversationId
    ? Array.from(agentProgressById.entries()).some(
        ([sessionId, progress]) =>
          !sessionId.startsWith("pending-") &&
          progress?.conversationId === pendingConversationId &&
          !progress?.isComplete,
      )
    : false

  // Auto-dismiss the pending tile synchronously via derived state:
  // When a real session starts for the pending conversation, clear the pending state
  // so we don't briefly show two tiles for the same conversation.
  useEffect(() => {
    if (hasRealActiveSessionForPending) {
      setPendingConversationId(null)
    }
  }, [hasRealActiveSessionForPending])

  const allProgressEntries = React.useMemo(() => {
    const entries = Array.from(agentProgressById.entries())
      .filter(([_, progress]) => progress !== null)
      // When a pending continuation tile exists for a conversation, hide the
      // completed progress entry for the same conversation to avoid showing
      // duplicate tiles (one pending, one completed) for the same conversation.
      // Also hide new active sessions for the same conversation while pending tile
      // is still visible, to prevent a duplicate loading tile alongside
      // the pending tile that already shows conversation history.
      .filter(([_, progress]) => {
        if (
          pendingConversationId &&
          progress?.conversationId === pendingConversationId
        ) {
          return false
        }
        return true
      })

    if (sessionOrder.length > 0) {
      return entries.sort((a, b) => {
        const aIndex = sessionOrder.indexOf(a[0])
        const bIndex = sessionOrder.indexOf(b[0])
        // New sessions (not in order list) should appear first (at top)
        if (aIndex === -1 && bIndex === -1) {
          // Both are new - sort by last activity (newest first)
          return getLastActivityTimestamp(b[1]) - getLastActivityTimestamp(a[1])
        }
        if (aIndex === -1) return -1 // a is new, put it first
        if (bIndex === -1) return 1 // b is new, put it first
        return aIndex - bIndex
      })
    }

    // Default sort: active sessions first, then by last activity (newest first)
    return entries.sort((a, b) => {
      const aComplete = a[1]?.isComplete ?? false
      const bComplete = b[1]?.isComplete ?? false
      if (aComplete !== bComplete) return aComplete ? 1 : -1
      return getLastActivityTimestamp(b[1]) - getLastActivityTimestamp(a[1])
    })
  }, [
    agentProgressById,
    sessionOrder,
    getLastActivityTimestamp,
    pendingConversationId,
  ])

  const reorderableSessionLabelById = useMemo(
    () =>
      new Map(
        allProgressEntries.map(([sessionId, progress]) => [
          sessionId,
          getSessionTileLabel(sessionId, progress),
        ]),
      ),
    [allProgressEntries],
  )

  // Sync session order when new sessions appear
  useEffect(() => {
    const currentIds = Array.from(agentProgressById.keys())
    const newIds = currentIds.filter((id) => !sessionOrder.includes(id))

    if (newIds.length > 0) {
      const isInitialLoad = sessionOrder.length === 0

      // On initial load, sort sessions by most recently modified first so the
      // freshest sessions appear at the top of the list.
      // When a new session is added during an active view, it still goes to the front.
      const sortedNewIds = isInitialLoad
        ? [...newIds].sort(
            (a, b) =>
              getLastActivityTimestamp(agentProgressById.get(b)) -
              getLastActivityTimestamp(agentProgressById.get(a)),
          )
        : newIds

      // Add (sorted) new sessions to the beginning of the order
      setSessionOrder((prev) => [
        ...sortedNewIds,
        ...prev.filter((id) => currentIds.includes(id)),
      ])
    } else {
      // Remove sessions that no longer exist
      const validOrder = sessionOrder.filter((id) => currentIds.includes(id))
      if (validOrder.length !== sessionOrder.length) {
        setSessionOrder(validOrder)
      }
    }
  }, [agentProgressById, getLastActivityTimestamp])

  // Handle route parameter for deep-linking to specific session
  // When navigating to /:id, focus the active session tile or create a new tile for past sessions
  useEffect(() => {
    if (routeHistoryItemId) {
      // Check if this ID matches an active (non-complete) session - if so, focus it.
      // Completed sessions should reload from disk to ensure fresh data,
      // especially for sessions created remotely (e.g. from mobile) where
      // in-memory progress data may be stale or incomplete.
      const activeSession = Array.from(agentProgressById.entries()).find(
        ([_, progress]) =>
          progress?.conversationId === routeHistoryItemId &&
          !progress?.isComplete,
      )
      if (activeSession) {
        setFocusedSessionId(activeSession[0])
        scrollSessionTileIntoView(activeSession[0])
      } else {
        // It's a past session or completed session - load fresh data from disk
        setPendingConversationId(routeHistoryItemId)
      }
      // Clear the route param from URL without causing a remount
      // Using window.history.replaceState instead of navigate() to avoid clearing local state
      window.history.replaceState(null, "", "/")
    }
  }, [
    routeHistoryItemId,
    agentProgressById,
    scrollSessionTileIntoView,
    setFocusedSessionId,
  ])

  // Handle scroll-to-session requests from sidebar navigation
  useEffect(() => {
    if (!scrollToSessionId) {
      clearPendingSessionScroll()
      return undefined
    }

    scrollSessionTileIntoView(scrollToSessionId, { clearScrollRequest: true })

    return clearPendingSessionScroll
  }, [clearPendingSessionScroll, scrollSessionTileIntoView, scrollToSessionId])

  useEffect(() => clearPendingSessionScroll, [clearPendingSessionScroll])

  // Load the pending conversation data when one is selected
  const pendingConversationQuery = useQuery({
    queryKey: ["conversation", pendingConversationId],
    queryFn: async () => {
      if (!pendingConversationId) return null
      return tipcClient.loadConversation({
        conversationId: pendingConversationId,
      })
    },
    enabled: !!pendingConversationId,
  })

  const isPendingConversationMissing =
    !!pendingConversationId &&
    pendingConversationQuery.isSuccess &&
    pendingConversationQuery.data === null

  // If loading a pending conversation fails (deleted/missing), clear the pending
  // state so we do not keep showing a stuck loading tile.
  useEffect(() => {
    if (!pendingConversationId) return
    if (!pendingConversationQuery.isError && !isPendingConversationMissing)
      return

    if (pendingConversationQuery.isError) {
      console.error(
        "Failed to load pending conversation:",
        pendingConversationQuery.error,
      )
    } else {
      console.error("Pending conversation not found:", pendingConversationId)
    }
    toast.error("Unable to load that past session")
    setPendingContinuationStartedAt(null)
    setPendingConversationId(null)
  }, [
    pendingConversationId,
    pendingConversationQuery.isError,
    pendingConversationQuery.error,
    isPendingConversationMissing,
  ])

  // Create a synthetic AgentProgressUpdate for the pending conversation
  // This allows us to reuse the AgentProgress component with the same UI
  const pendingSessionId = pendingConversationId
    ? `pending-${pendingConversationId}`
    : null
  const pendingProgress: AgentProgressUpdate | null = useMemo(() => {
    if (!pendingConversationId || !pendingConversationQuery.data) return null
    const conv = pendingConversationQuery.data
    const isInitializing = pendingContinuationStartedAt !== null

    return {
      sessionId: `pending-${pendingConversationId}`,
      conversationId: pendingConversationId,
      conversationTitle: conv.title || "Continue Conversation",
      currentIteration: isInitializing ? 1 : 0,
      maxIterations: isInitializing ? Infinity : 10,
      steps: isInitializing
        ? [
            {
              id: `pending-start-${pendingConversationId}`,
              type: "thinking",
              title: "Starting follow-up",
              description: "Waiting for session updates...",
              status: "in_progress",
              timestamp: pendingContinuationStartedAt,
            },
          ]
        : [],
      isComplete: !isInitializing,
      conversationHistory: conv.messages.map((m) => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        toolResults: m.toolResults,
        timestamp: m.timestamp,
      })),
    }
  }, [
    pendingConversationId,
    pendingConversationQuery.data,
    pendingContinuationStartedAt,
  ])

  // Handle continuing a conversation - check for existing active session first
  // If found, focus it; otherwise create a pending tile
  // LLM inference will only happen when user sends an actual message
  const handleContinueConversation = (conversationId: string) => {
    // Check if there's already an active session for this conversationId
    const existingSession = Array.from(agentProgressById.entries()).find(
      ([_, progress]) =>
        progress?.conversationId === conversationId && !progress?.isComplete,
    )
    if (existingSession) {
      // Focus the existing session tile instead of creating a duplicate
      setFocusedSessionId(existingSession[0])
      scrollSessionTileIntoView(existingSession[0])
    } else {
      // No active session exists, create a pending tile
      setPendingContinuationStartedAt(null)
      setPendingConversationId(conversationId)
    }
  }

  // Handle dismissing the pending continuation
  const handleDismissPendingContinuation = () => {
    logUI("[Sessions] Dismissing pending continuation:", {
      pendingConversationId,
    })
    setPendingContinuationStartedAt(null)
    setPendingConversationId(null)
  }

  const applySelectedAgentToNextSession = useCallback(
    async (options?: { silent?: boolean }) => {
      return applySelectedAgentForNextSession({
        selectedAgentId,
        setSelectedAgentId,
        silent: options?.silent,
        onError: (error) => {
          logUI("[Sessions] Failed to apply selected agent", {
            selectedAgentId,
            error,
          })
        },
      })
    },
    [selectedAgentId, setSelectedAgentId],
  )

  // Keep the main-process current profile aligned with the selected agent so all
  // new-session entry points (including conversation follow-ups) use the selector.
  useEffect(() => {
    void applySelectedAgentToNextSession({ silent: true })
  }, [applySelectedAgentToNextSession])

  const handlePendingContinuationStarted = useCallback(() => {
    setPendingContinuationStartedAt((existing) => existing ?? Date.now())
  }, [])

  // Auto-dismiss pending tile when a real session starts for the same conversationId.
  // During initialization, also dismiss when a completed session appears with
  // activity at/after the follow-up start timestamp.
  useEffect(() => {
    if (!pendingConversationId) return

    const hasRealSession = Array.from(agentProgressById.entries()).some(
      ([sessionId, progress]) =>
        !sessionId.startsWith("pending-") &&
        progress?.conversationId === pendingConversationId &&
        (!progress?.isComplete ||
          (pendingContinuationStartedAt !== null &&
            getLastActivityTimestamp(progress) >=
              pendingContinuationStartedAt)),
    )

    if (hasRealSession) {
      // A real session has started for this conversation, dismiss the pending tile
      setPendingContinuationStartedAt(null)
      setPendingConversationId(null)
    }
  }, [
    pendingConversationId,
    pendingContinuationStartedAt,
    agentProgressById,
    getLastActivityTimestamp,
  ])

  // Safety fallback: if initialization does not produce a real session in time,
  // dismiss the pending tile instead of leaving it stuck indefinitely.
  useEffect(() => {
    if (!pendingConversationId || pendingContinuationStartedAt === null)
      return undefined

    const timeoutConversationId = pendingConversationId
    const timeoutStartedAt = pendingContinuationStartedAt
    const timeoutId = window.setTimeout(() => {
      if (
        pendingConversationIdRef.current !== timeoutConversationId ||
        pendingContinuationStartedAtRef.current !== timeoutStartedAt
      ) {
        return
      }

      logUI(
        "[Sessions] Pending continuation timed out waiting for real session",
        {
          pendingConversationId: timeoutConversationId,
          pendingContinuationStartedAt: timeoutStartedAt,
        },
      )
      toast.error("Session startup timed out. Please try again.")
      setPendingContinuationStartedAt(null)
      setPendingConversationId(null)
    }, PENDING_CONTINUATION_TIMEOUT_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [pendingConversationId, pendingContinuationStartedAt])

  // Handle text click - open panel with text input
  const handleTextClick = async () => {
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    await tipcClient.showPanelWindowWithTextInput({})
  }

  // Handle voice start - trigger MCP recording
  const handleVoiceStart = async () => {
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    await tipcClient.showPanelWindow({})
    await tipcClient.triggerMcpRecording({})
  }

  // Handle predefined prompt selection - open panel with text input pre-filled
  const handleSelectPrompt = async (content: string) => {
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    await tipcClient.showPanelWindowWithTextInput({ initialText: content })
  }

  const handleFocusSession = useCallback(
    async (sessionId: string) => {
      setFocusedSessionId(sessionId)
      // Also show the panel window with this session focused
      try {
        await tipcClient.focusAgentSession({ sessionId })
        await tipcClient.setPanelMode({ mode: "agent" })
        await tipcClient.showPanelWindow({})
      } catch (error) {
        console.error("Failed to show panel window:", error)
      }
    },
    [setFocusedSessionId],
  )

  const handleDismissSession = useCallback(
    async (sessionId: string) => {
      const progress = useAgentStore.getState().agentProgressById.get(sessionId)
      logUI("[Sessions] Dismiss/hide session clicked:", {
        sessionId,
        status: progress?.isComplete ? "complete" : "active",
        conversationTitle:
          progress?.conversationHistory?.[0]?.content?.substring(0, 50),
        conversationId: progress?.conversationId,
      })
      await tipcClient.clearAgentSessionProgress({ sessionId })
      queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
    },
    [queryClient],
  )

  // Drag and drop handlers
  const handleDragStart = useCallback((sessionId: string, _index: number) => {
    clearRecentReorderVisualCue()
    clearRecentSingleViewReturnVisualCue()
    setRecentlyReorderedSessionId(null)
    setDraggedSessionId(sessionId)
  }, [clearRecentReorderVisualCue, clearRecentSingleViewReturnVisualCue])

  const handleDragOver = useCallback((targetIndex: number) => {
    setDragTargetIndex(targetIndex)
  }, [])

  const handleDragLeave = useCallback((targetIndex: number) => {
    setDragTargetIndex((currentTargetIndex) =>
      currentTargetIndex === targetIndex ? null : currentTargetIndex,
    )
  }, [])

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (!draggedSessionId) return

      const currentOrder =
        sessionOrder.length > 0 ? sessionOrder : allProgressEntries.map(([id]) => id)
      const draggedIndex = currentOrder.indexOf(draggedSessionId)

      if (draggedIndex === -1) {
        setDragTargetIndex(null)
        return
      }

      const insertionIndex = getDropBeforeInsertIndex(draggedIndex, targetIndex)
      const nextOrder = moveSessionToIndex(currentOrder, draggedSessionId, insertionIndex)

      setSessionOrder(nextOrder)
      if (nextOrder !== currentOrder) {
        const nextPosition = nextOrder.indexOf(draggedSessionId) + 1
        const draggedSessionLabel =
          reorderableSessionLabelById.get(draggedSessionId) ?? "session"
        const reorderAnnouncementContext =
          getSessionReorderAnnouncementContext(
            nextOrder,
            draggedSessionId,
            reorderableSessionLabelById,
          )

        setReorderAnnouncement(
          getSessionReorderAnnouncement(
            draggedSessionLabel,
            nextPosition,
            nextOrder.length,
            {
              ...reorderAnnouncementContext,
              vertical: isResponsiveStackedLayout,
            },
          ),
        )
        showRecentReorderVisualCue(draggedSessionId)
      }
      setDragTargetIndex(null)
    },
    [
      draggedSessionId,
      allProgressEntries,
      reorderableSessionLabelById,
      sessionOrder,
      showRecentReorderVisualCue,
    ],
  )

  const handleTrailingReorderDropZoneDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!draggedSessionId) return

      event.preventDefault()
      event.dataTransfer.dropEffect = "move"
      handleDragOver(allProgressEntries.length)
    },
    [allProgressEntries.length, draggedSessionId, handleDragOver],
  )

  const handleTrailingReorderDropZoneDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!draggedSessionId) return

      const relatedTarget = event.relatedTarget
      if (
        relatedTarget instanceof Node &&
        event.currentTarget.contains(relatedTarget)
      ) {
        return
      }

      handleDragLeave(allProgressEntries.length)
    },
    [allProgressEntries.length, draggedSessionId, handleDragLeave],
  )

  const handleTrailingReorderDropZoneDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!draggedSessionId) return

      event.preventDefault()
      handleDrop(allProgressEntries.length)
    },
    [allProgressEntries.length, draggedSessionId, handleDrop],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedSessionId(null)
    setDragTargetIndex(null)
  }, [])

  const handleKeyboardReorder = useCallback(
    (sessionId: string, direction: "earlier" | "later") => {
      const currentOrder =
        sessionOrder.length > 0 ? sessionOrder : allProgressEntries.map(([id]) => id)
      const currentIndex = currentOrder.indexOf(sessionId)

      if (currentIndex === -1) {
        return
      }

      const targetIndex = direction === "earlier" ? currentIndex - 1 : currentIndex + 1
      const nextOrder = moveSessionToIndex(currentOrder, sessionId, targetIndex)

      setSessionOrder(nextOrder)
      if (nextOrder !== currentOrder) {
        const nextPosition = nextOrder.indexOf(sessionId) + 1
        const movedSessionLabel = reorderableSessionLabelById.get(sessionId) ?? "session"
        const reorderAnnouncementContext =
          getSessionReorderAnnouncementContext(
            nextOrder,
            sessionId,
            reorderableSessionLabelById,
          )

        setReorderAnnouncement(
          getSessionReorderAnnouncement(
            movedSessionLabel,
            nextPosition,
            nextOrder.length,
            {
              ...reorderAnnouncementContext,
              vertical: isResponsiveStackedLayout,
            },
          ),
        )
        showRecentReorderVisualCue(sessionId)
      }
      setDraggedSessionId(null)
      setDragTargetIndex(null)
      scrollSessionTileIntoView(sessionId)
    },
    [
      allProgressEntries,
      reorderableSessionLabelById,
      scrollSessionTileIntoView,
      sessionOrder,
      showRecentReorderVisualCue,
    ],
  )

  const handleClearInactiveSessions = async () => {
    const inactiveSessions = allProgressEntries
      .filter(([_, p]) => p?.isComplete)
      .map(([id]) => id)
    logUI("[Sessions] Clear all inactive sessions clicked:", {
      count: inactiveSessions.length,
      sessionIds: inactiveSessions,
    })
    try {
      await tipcClient.clearInactiveSessions()
      toast.success("Inactive sessions cleared")
    } catch (error) {
      toast.error("Failed to clear inactive sessions")
    }
  }

  // Track previous layout mode so we can restore when exiting maximize
  const previousLayoutModeRef = useRef<RestorableTileLayoutMode>(
    initialTileLayoutPreferenceRef.current.previousLayoutMode,
  )
  const singleViewReturnSessionIdRef = useRef<string | null>(null)
  const singleViewReturnTileWidthRef = useRef<number | null>(null)
  const singleViewReturnTileHeightRef = useRef<number | null>(null)

  const getCurrentVisibleTileWidth = useCallback((): number | null => {
    const visibleTileElements = Object.values(sessionRefs.current) as Array<
      HTMLDivElement | null
    >

    for (const element of visibleTileElements) {
      const measuredWidth = element?.getBoundingClientRect().width ?? 0
      if (measuredWidth > 0) {
        return Math.round(measuredWidth)
      }
    }

    return null
  }, [])

  const getCurrentVisibleTileHeight = useCallback((): number | null => {
    const visibleTileElements = Object.values(sessionRefs.current) as Array<
      HTMLDivElement | null
    >

    for (const element of visibleTileElements) {
      const measuredHeight = element?.getBoundingClientRect().height ?? 0
      if (measuredHeight > 0) {
        return Math.round(measuredHeight)
      }
    }

    return null
  }, [])

  const handleSelectTileLayout = useCallback(
    (nextMode: TileLayoutMode) => {
      if (nextMode === tileLayoutMode) {
        return
      }

      clearRecentSingleViewReturnVisualCue()
      clearRecentSingleViewRestoreAdjustmentCue()

      const currentVisibleTileCount = (
        Object.values(sessionRefs.current) as Array<HTMLDivElement | null>
      ).filter(Boolean).length
      const currentVisibleTileHeight = getCurrentVisibleTileHeight()
      const currentTargetTileHeight = calculateTileHeight(
        sessionGridMeasurements.containerWidth,
        sessionGridMeasurements.containerHeight,
        sessionGridMeasurements.gap,
        tileLayoutMode,
        currentVisibleTileCount,
      )
      const shouldCaptureSingleViewReturnTileWidth =
        nextMode === "1x1" &&
        !shouldLockTileWidth(
          sessionGridMeasurements.containerWidth,
          sessionGridMeasurements.gap,
          tileLayoutMode,
          currentVisibleTileCount,
        )
      const shouldCaptureSingleViewReturnTileHeight =
        nextMode === "1x1" &&
        currentVisibleTileHeight !== null &&
        Math.abs(currentVisibleTileHeight - currentTargetTileHeight) > 1

      const sessionIdToRevealOnRestore =
        tileLayoutMode === "1x1" && nextMode !== "1x1"
          ? singleViewReturnSessionIdRef.current
          : null
      const isLeavingSingleView = tileLayoutMode === "1x1" && nextMode !== "1x1"
      const hasPendingRestoreTile =
        !!pendingProgress ||
        (!!pendingConversationId &&
          !pendingProgress &&
          !pendingConversationQuery.isError &&
          !isPendingConversationMissing)
      const nextVisibleTileCount =
        allProgressEntries.length + (hasPendingRestoreTile ? 1 : 0)
      const nextTargetTileWidth = isLeavingSingleView
        ? calculateTileWidth(
            sessionGridMeasurements.containerWidth,
            sessionGridMeasurements.gap,
            nextMode,
            nextVisibleTileCount,
          )
        : 0
      const nextTargetTileHeight = isLeavingSingleView
        ? calculateTileHeight(
            sessionGridMeasurements.containerWidth,
            sessionGridMeasurements.containerHeight,
            sessionGridMeasurements.gap,
            nextMode,
            nextVisibleTileCount,
          )
        : 0
      const nextIsWidthResizeLocked =
        isLeavingSingleView &&
        shouldLockTileWidth(
          sessionGridMeasurements.containerWidth,
          sessionGridMeasurements.gap,
          nextMode,
          nextVisibleTileCount,
        )
      const nextLayoutMaxWidth = nextIsWidthResizeLocked
        ? nextTargetTileWidth
        : getResizableTileWidthBounds(sessionGridMeasurements.containerWidth)
            .maxWidth
      const restoredWidthFromSingleView = isLeavingSingleView
        ? getSingleViewLayoutRestoreWidth(
            singleViewReturnTileWidthRef.current,
            nextTargetTileWidth,
            nextLayoutMaxWidth,
            nextIsWidthResizeLocked,
          )
        : null
      const restoredHeightFromSingleView = isLeavingSingleView
        ? getSingleViewLayoutRestoreHeight(
            singleViewReturnTileHeightRef.current,
            nextTargetTileHeight,
          )
        : null
      const singleViewRestoreAdjustment = isLeavingSingleView
        ? getSingleViewRestoreAdjustment(
            singleViewReturnTileWidthRef.current,
            restoredWidthFromSingleView,
            singleViewReturnTileHeightRef.current,
            restoredHeightFromSingleView,
          )
        : null

      if (nextMode === "1x1") {
        singleViewReturnTileWidthRef.current =
          shouldCaptureSingleViewReturnTileWidth
            ? getCurrentVisibleTileWidth()
            : null
        singleViewReturnTileHeightRef.current =
          shouldCaptureSingleViewReturnTileHeight
            ? currentVisibleTileHeight
            : null
        previousLayoutModeRef.current =
          tileLayoutMode === "1x1"
            ? previousLayoutModeRef.current
            : tileLayoutMode
      } else {
        previousLayoutModeRef.current = nextMode
      }

      // Entering Single view still resets tile size because that layout is
      // intentionally full-width and full-height. Leaving Single view restores
      // the previous multi-tile width and any captured manual height inside
      // SessionTileWrapper so the tiled layout comes back without another full
      // reset.
      const shouldResetTileSize = nextMode === "1x1"
      if (shouldResetTileSize) {
        clearPersistedSize("session-tile")
        setTileResetKey((prev) => prev + 1)
      }

      persistTileLayoutPreference(nextMode, previousLayoutModeRef.current)
      setTileLayoutMode(nextMode)

      // When users leave Single view after browsing to a different session,
      // keep that same session visible again in the restored multi-tile layout.
      if (sessionIdToRevealOnRestore) {
        scrollSessionTileIntoView(sessionIdToRevealOnRestore)
        showRecentSingleViewReturnVisualCue(sessionIdToRevealOnRestore)
      }

      if (singleViewRestoreAdjustment) {
        showRecentSingleViewRestoreAdjustmentCue(singleViewRestoreAdjustment)
      }
    },
    [
      allProgressEntries,
      clearRecentSingleViewRestoreAdjustmentCue,
      clearRecentSingleViewReturnVisualCue,
      getCurrentVisibleTileHeight,
      getCurrentVisibleTileWidth,
      isPendingConversationMissing,
      pendingConversationId,
      pendingConversationQuery.isError,
      pendingProgress,
      scrollSessionTileIntoView,
      sessionGridMeasurements.containerHeight,
      sessionGridMeasurements.containerWidth,
      sessionGridMeasurements.gap,
      showRecentSingleViewRestoreAdjustmentCue,
      showRecentSingleViewReturnVisualCue,
      tileLayoutMode,
    ],
  )

  const handleMaximizeTile = useCallback(
    (sessionId?: string) => {
      const nextMode =
        tileLayoutMode === "1x1" ? previousLayoutModeRef.current : "1x1"

      handleSelectTileLayout(nextMode)

      if (tileLayoutMode !== "1x1" && sessionId) {
        setFocusedSessionId(sessionId)
      }
    },
    [handleSelectTileLayout, tileLayoutMode, setFocusedSessionId],
  )

  // Count inactive (completed) sessions
  const inactiveSessionCount = useMemo(() => {
    return allProgressEntries.filter(([_, progress]) => progress?.isComplete)
      .length
  }, [allProgressEntries])

  const hasPendingLoadingTile =
    !!pendingConversationId &&
    !pendingProgress &&
    !pendingConversationQuery.isError &&
    !isPendingConversationMissing
  const hasPendingTile = !!pendingProgress || hasPendingLoadingTile
  const totalTileCount = allProgressEntries.length + (hasPendingTile ? 1 : 0)
  const isFocusLayout = tileLayoutMode === "1x1"

  const focusableSessionIds = useMemo(
    () => [
      ...(hasPendingTile && pendingSessionId ? [pendingSessionId] : []),
      ...allProgressEntries.map(([sessionId]) => sessionId),
    ],
    [allProgressEntries, hasPendingTile, pendingSessionId],
  )
  const previousFocusableSessionIdsRef = useRef<string[]>(focusableSessionIds)
  const hasExplicitFocusedSession =
    !!focusedSessionId && focusableSessionIds.includes(focusedSessionId)
  const fallbackFocusedSessionId = useMemo(
    () =>
      getFocusLayoutFallbackSessionId(
        focusableSessionIds,
        previousFocusableSessionIdsRef.current,
        focusedSessionId,
      ),
    [focusableSessionIds, focusedSessionId],
  )

  const maximizedSessionId = useMemo(() => {
    if (!isFocusLayout) return null

    if (hasExplicitFocusedSession) {
      return focusedSessionId
    }

    return fallbackFocusedSessionId
  }, [
    fallbackFocusedSessionId,
    focusedSessionId,
    hasExplicitFocusedSession,
    isFocusLayout,
  ])

  useEffect(() => {
    singleViewReturnSessionIdRef.current = maximizedSessionId
  }, [maximizedSessionId])

  useEffect(() => {
    previousFocusableSessionIdsRef.current = focusableSessionIds
  }, [focusableSessionIds])

  useEffect(() => {
    if (!isFocusLayout) return
    if (hasExplicitFocusedSession) return
    if (focusedSessionId === maximizedSessionId) return

    setFocusedSessionId(maximizedSessionId)
  }, [
    focusedSessionId,
    hasExplicitFocusedSession,
    isFocusLayout,
    maximizedSessionId,
    setFocusedSessionId,
  ])

  const visibleProgressEntries = useMemo(() => {
    if (!isFocusLayout || !maximizedSessionId) {
      return allProgressEntries
    }

    return allProgressEntries.filter(
      ([sessionId]) => sessionId === maximizedSessionId,
    )
  }, [allProgressEntries, isFocusLayout, maximizedSessionId])

  const showPendingProgressTile =
    !!pendingProgress &&
    !!pendingSessionId &&
    (!isFocusLayout || maximizedSessionId === pendingSessionId)
  const showPendingLoadingTile =
    !!pendingSessionId &&
    hasPendingLoadingTile &&
    (!isFocusLayout || maximizedSessionId === pendingSessionId)
  const hasVisiblePendingTile =
    showPendingProgressTile || showPendingLoadingTile
  const visibleTileCount =
    visibleProgressEntries.length + (hasVisiblePendingTile ? 1 : 0)
  const showTileMaximize = !isFocusLayout && visibleTileCount > 1
  const canReorderTiles = !isFocusLayout && allProgressEntries.length > 1
  const focusedLayoutSessionIndex = maximizedSessionId
    ? focusableSessionIds.indexOf(maximizedSessionId)
    : -1
  const focusableSessionCount = focusableSessionIds.length
  const showFocusLayoutHint =
    isFocusLayout && focusableSessionCount > 1 && !!maximizedSessionId
  const canBrowseFocusedSessions =
    showFocusLayoutHint && focusedLayoutSessionIndex >= 0
  const isTemporarySingleVisibleLayout =
    !isFocusLayout && visibleTileCount === 1
  const isResponsiveStackedLayout = isResponsiveStackedTileLayout(
    sessionGridMeasurements.containerWidth,
    sessionGridMeasurements.gap,
    tileLayoutMode,
    visibleTileCount,
  )
  const hasMeasuredSessionGridWidth = sessionGridMeasurements.containerWidth > 0
  const isSparseWideGridLayout =
    !isFocusLayout &&
    visibleTileCount > 1 &&
    hasMeasuredSessionGridWidth &&
    shouldUseSparseWideGridHeight(
      sessionGridMeasurements.containerWidth,
      sessionGridMeasurements.gap,
      tileLayoutMode,
      visibleTileCount,
    )
  const activeLayoutDescription = isTemporarySingleVisibleLayout
    ? TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION
    : isSparseWideGridLayout
      ? SPARSE_WIDE_GRID_LAYOUT_DESCRIPTION
    : isResponsiveStackedLayout
      ? RESPONSIVE_STACKED_LAYOUT_DESCRIPTION
      : LAYOUT_DESCRIPTIONS[tileLayoutMode]
  const activeLayoutCompactDescription = isTemporarySingleVisibleLayout
    ? TEMPORARY_SINGLE_VISIBLE_LAYOUT_SHORT_LABEL
    : isSparseWideGridLayout
      ? SPARSE_WIDE_GRID_LAYOUT_SHORT_LABEL
    : isResponsiveStackedLayout
      ? RESPONSIVE_STACKED_LAYOUT_SHORT_LABEL
      : LAYOUT_DESCRIPTIONS[tileLayoutMode]
  const activeLayoutOption =
    TILE_LAYOUT_OPTIONS.find(({ mode }) => mode === tileLayoutMode) ??
    TILE_LAYOUT_OPTIONS[0]
  const restoreLayoutMode = isFocusLayout ? previousLayoutModeRef.current : null
  const restoreLayoutOption = restoreLayoutMode
    ? (TILE_LAYOUT_OPTIONS.find(({ mode }) => mode === restoreLayoutMode) ??
      TILE_LAYOUT_OPTIONS[0])
    : null
  const focusableSessionLabelById = useMemo(() => {
    const labels = new Map<string, string>()

    if (pendingSessionId) {
      labels.set(
        pendingSessionId,
        getSessionTileLabel(pendingSessionId, pendingProgress),
      )
    }

    for (const [sessionId, progress] of allProgressEntries) {
      labels.set(sessionId, getSessionTileLabel(sessionId, progress))
    }

    return labels
  }, [allProgressEntries, pendingProgress, pendingSessionId])
  const stackedLayoutRecoveryHint =
    isResponsiveStackedLayout && tileLayoutMode !== "1x1"
      ? STACKED_LAYOUT_RECOVERY_HINTS[tileLayoutMode]
      : null
  const isCompactSessionHeader =
    hasMeasuredSessionGridWidth &&
    sessionGridMeasurements.containerWidth < COMPACT_SESSION_HEADER_WIDTH
  const isVeryCompactSessionHeader =
    hasMeasuredSessionGridWidth &&
    sessionGridMeasurements.containerWidth < TIGHT_SESSION_HEADER_WIDTH
  const nearStackedLayoutHint =
    hasMeasuredSessionGridWidth &&
    tileLayoutMode !== "1x1" &&
    visibleTileCount > 1 &&
    !isResponsiveStackedLayout &&
    isResponsiveStackedTileLayout(
      Math.max(
        0,
        sessionGridMeasurements.containerWidth -
          NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER,
      ),
      sessionGridMeasurements.gap,
      tileLayoutMode,
      visibleTileCount,
    )
      ? NEAR_STACKED_LAYOUT_HINTS[tileLayoutMode]
      : null
  const showStackedLayoutRecoveryHint = !!stackedLayoutRecoveryHint
  const showNearStackedLayoutHint = !!nearStackedLayoutHint
  useEffect(() => {
    if (
      tileLayoutMode === "1x1" ||
      visibleTileCount < 2 ||
      sessionGridMeasurements.containerWidth <= 0
    ) {
      lastLayoutPressureAnnouncementStateRef.current = "stable"
      setLayoutPressureAnnouncement("")
      return
    }

    const previousLayoutPressureAnnouncementState =
      lastLayoutPressureAnnouncementStateRef.current
    const nextLayoutPressureAnnouncementState = showStackedLayoutRecoveryHint
      ? "stacked"
      : showNearStackedLayoutHint
        ? "near"
        : "stable"
    lastLayoutPressureAnnouncementStateRef.current =
      nextLayoutPressureAnnouncementState

    if (!hasObservedLayoutPressureAnnouncementRef.current) {
      hasObservedLayoutPressureAnnouncementRef.current = true
      return
    }

    if (previousLayoutPressureAnnouncementState === nextLayoutPressureAnnouncementState) {
      return
    }

    setLayoutPressureAnnouncement(
      getLayoutPressureAnnouncement(
        tileLayoutMode,
        previousLayoutPressureAnnouncementState,
        nextLayoutPressureAnnouncementState,
      ),
    )
  }, [
    sessionGridMeasurements.containerWidth,
    showNearStackedLayoutHint,
    showStackedLayoutRecoveryHint,
    tileLayoutMode,
    visibleTileCount,
  ])
  useEffect(() => {
    if (
      tileLayoutMode === "1x1" ||
      visibleTileCount < 2 ||
      sessionGridMeasurements.containerWidth <= 0
    ) {
      lastResponsiveStackedLayoutRef.current = isResponsiveStackedLayout
      clearRecentWidthLockHint()
      return
    }

    const previousResponsiveStackedLayout =
      lastResponsiveStackedLayoutRef.current
    lastResponsiveStackedLayoutRef.current = isResponsiveStackedLayout

    if (!hasObservedResponsiveStackedLayoutRef.current) {
      hasObservedResponsiveStackedLayoutRef.current = true
      return
    }

    if (isResponsiveStackedLayout && !previousResponsiveStackedLayout) {
      showRecentWidthLockHint(tileLayoutMode)
      return
    }

    if (!isResponsiveStackedLayout && previousResponsiveStackedLayout) {
      clearRecentWidthLockHint()
    }
  }, [
    clearRecentWidthLockHint,
    isResponsiveStackedLayout,
    sessionGridMeasurements.containerWidth,
    showRecentWidthLockHint,
    tileLayoutMode,
    visibleTileCount,
  ])
  const syncPanelLayoutPressureState = useCallback(async () => {
    try {
      const panelStateResponse = await tipcClient.getFloatingPanelLayoutState()
      if (!isPanelLayoutPressureState(panelStateResponse)) {
        throw new Error("Floating panel state unavailable")
      }
      setPanelLayoutPressureState(panelStateResponse)
    } catch (error) {
      console.error(
        "Failed to read floating panel state for tiled-session recovery:",
        error,
      )
      setPanelLayoutPressureState(null)
    }
  }, [])
  const canShrinkPanelForLayoutPressure =
    !!panelLayoutPressureState &&
    panelLayoutPressureState.isVisible &&
    panelLayoutPressureState.width > panelLayoutPressureState.minWidth + 0.5
  const panelWidthGainFromShrinkingForLayoutPressure =
    canShrinkPanelForLayoutPressure && panelLayoutPressureState
      ? Math.max(
          0,
          panelLayoutPressureState.width - panelLayoutPressureState.minWidth,
        )
      : 0
  const sessionGridWidthAfterShrinkingPanelForLayoutPressure =
    sessionGridMeasurements.containerWidth +
    panelWidthGainFromShrinkingForLayoutPressure
  const shouldMentionPanelInLayoutPressureCopy =
    panelLayoutPressureState === null || canShrinkPanelForLayoutPressure
  const showSingleViewRestore = isFocusLayout && !!restoreLayoutOption
  const showDedicatedSingleViewRestoreButton =
    showSingleViewRestore && (!isCompactSessionHeader || isVeryCompactSessionHeader)
  const singleViewRestoreSessionLabel =
    showSingleViewRestore && maximizedSessionId
      ? focusableSessionLabelById.get(maximizedSessionId) ?? null
      : null
  const singleViewRestoreFocusContext = singleViewRestoreSessionLabel
    ? `${singleViewRestoreSessionLabel} as the active tile`
    : "the shown session as the active tile"
  const singleViewRestoreTitle = !showSingleViewRestore || !restoreLayoutOption
    ? null
    : `Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]} (last tiled layout) and keep ${singleViewRestoreFocusContext}`
  const singleViewRestoreLabel =
    !showDedicatedSingleViewRestoreButton || !restoreLayoutOption
    ? null
    : isVeryCompactSessionHeader
      ? "Back"
      : `Back to ${restoreLayoutOption.label}`
  const showCurrentLayoutChip =
    isTemporarySingleVisibleLayout || isSparseWideGridLayout
  const showVeryCompactAdaptiveLayoutLabel =
    showCurrentLayoutChip && isVeryCompactSessionHeader
  const currentLayoutChipLabel = showVeryCompactAdaptiveLayoutLabel
    ? activeLayoutCompactDescription
    : LAYOUT_LABELS[tileLayoutMode]
  const showLayoutDescriptionSuffix = showCurrentLayoutChip && !isCompactSessionHeader
  const showCompactAdaptiveLayoutDescription =
    showCurrentLayoutChip &&
    isCompactSessionHeader &&
    !isVeryCompactSessionHeader
  const stackedLayoutRecoveryLabel = !showStackedLayoutRecoveryHint
    ? null
    : isVeryCompactSessionHeader
      ? "Make room"
      : isCompactSessionHeader
        ? stackedLayoutRecoveryHint.compactLabel
        : stackedLayoutRecoveryHint.fullLabel
  const stackedLayoutRecoveryTitle = !showStackedLayoutRecoveryHint ||
    !stackedLayoutRecoveryHint
    ? null
    : shouldMentionPanelInLayoutPressureCopy
      ? stackedLayoutRecoveryHint.title
      : stackedLayoutRecoveryHint.titleWithoutPanelRecovery
  const stackedLayoutRecoveryWidthGap = showStackedLayoutRecoveryHint
    ? getResponsiveStackedLayoutWidthShortfall(
        sessionGridMeasurements.containerWidth,
        sessionGridMeasurements.gap,
        tileLayoutMode,
        visibleTileCount,
      )
    : 0
  const stackedLayoutRecoveryWidthGapLabel =
    stackedLayoutRecoveryWidthGap > 0 && !isVeryCompactSessionHeader
      ? `Need ${stackedLayoutRecoveryWidthGap}px`
      : null
  const showRecentResponsiveWidthLockHint =
    recentWidthLockHintLayoutMode !== null &&
    tileLayoutMode !== "1x1" &&
    recentWidthLockHintLayoutMode === tileLayoutMode &&
    isResponsiveStackedLayout
  const recentResponsiveWidthLockHintLabel =
    !showRecentResponsiveWidthLockHint
      ? null
      : isCompactSessionHeader
        ? "Width fixed"
        : "Width follows stacked layout"
  const recentResponsiveWidthLockHintActionLabel =
    !showRecentResponsiveWidthLockHint || isVeryCompactSessionHeader
      ? null
      : isCompactSessionHeader
        ? "Bottom edge"
        : "Use bottom edge"
  const recentResponsiveWidthLockHintTitle =
    !showRecentResponsiveWidthLockHint || recentWidthLockHintLayoutMode === null
      ? null
      : getResponsiveWidthLockHintTitle(recentWidthLockHintLayoutMode)
  const nearStackedLayoutHintLabel = !showNearStackedLayoutHint
    ? null
    : isVeryCompactSessionHeader
      ? "Tight"
      : isCompactSessionHeader
        ? nearStackedLayoutHint.compactLabel
        : nearStackedLayoutHint.fullLabel
  const nearStackedLayoutHintTitle = !showNearStackedLayoutHint || !nearStackedLayoutHint
    ? null
    : shouldMentionPanelInLayoutPressureCopy
      ? nearStackedLayoutHint.title
      : nearStackedLayoutHint.titleWithoutPanelRecovery
  const nearStackedLayoutWidthGap = showNearStackedLayoutHint
    ? getResponsiveStackedLayoutWidthShortfall(
        sessionGridMeasurements.containerWidth,
        sessionGridMeasurements.gap,
        tileLayoutMode,
        visibleTileCount,
        NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER,
      )
    : 0
  const nearStackedLayoutWidthGapLabel =
    nearStackedLayoutWidthGap > 0 && !isVeryCompactSessionHeader
      ? `Need ${nearStackedLayoutWidthGap}px`
      : null
  const showShrinkPanelForLayoutPressure =
    (showStackedLayoutRecoveryHint || showNearStackedLayoutHint) &&
    canShrinkPanelForLayoutPressure
  const showHidePanelForStackedLayoutPressure =
    showStackedLayoutRecoveryHint && !!panelLayoutPressureState?.isVisible
  const canResolveStackedLayoutPressureByShrinkingPanel =
    showStackedLayoutRecoveryHint &&
    panelWidthGainFromShrinkingForLayoutPressure > 0 &&
    !isResponsiveStackedTileLayout(
      sessionGridWidthAfterShrinkingPanelForLayoutPressure,
      sessionGridMeasurements.gap,
      tileLayoutMode,
      visibleTileCount,
    )
  const canResolveStackedLayoutPressureByHidingPanel =
    showHidePanelForStackedLayoutPressure &&
    !!panelLayoutPressureState?.isVisible &&
    !isResponsiveStackedTileLayout(
      sessionGridMeasurements.containerWidth + panelLayoutPressureState.width,
      sessionGridMeasurements.gap,
      tileLayoutMode,
      visibleTileCount,
    )
  const canResolveNearStackedLayoutPressureByShrinkingPanel =
    showNearStackedLayoutHint &&
    panelWidthGainFromShrinkingForLayoutPressure > 0 &&
    !isResponsiveStackedTileLayout(
      Math.max(
        0,
        sessionGridWidthAfterShrinkingPanelForLayoutPressure -
          NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER,
      ),
      sessionGridMeasurements.gap,
      tileLayoutMode,
      visibleTileCount,
    )
  const showHidePanelForNearStackedLayoutPressure =
    showNearStackedLayoutHint &&
    !!panelLayoutPressureState?.isVisible &&
    (!canShrinkPanelForLayoutPressure ||
      !canResolveNearStackedLayoutPressureByShrinkingPanel)
  const canResolveNearStackedLayoutPressureByHidingPanel =
    showHidePanelForNearStackedLayoutPressure &&
    !!panelLayoutPressureState?.isVisible &&
    !isResponsiveStackedTileLayout(
      Math.max(
        0,
        sessionGridMeasurements.containerWidth +
          panelLayoutPressureState.width -
          NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER,
      ),
      sessionGridMeasurements.gap,
      tileLayoutMode,
      visibleTileCount,
    )
  const canCollapseSidebarForLayoutPressure =
    !!collapseSidebar &&
    typeof sidebarWidth === "number" &&
    sidebarWidth > SIDEBAR_DIMENSIONS.width.collapsed + 0.5
  const sidebarWidthGainFromCollapsingForLayoutPressure =
    canCollapseSidebarForLayoutPressure && typeof sidebarWidth === "number"
      ? Math.max(0, sidebarWidth - SIDEBAR_DIMENSIONS.width.collapsed)
      : 0
  const sessionGridWidthAfterCollapsingSidebarForLayoutPressure =
    sessionGridMeasurements.containerWidth +
    sidebarWidthGainFromCollapsingForLayoutPressure
  const canResolveStackedLayoutPressureByCollapsingSidebar =
    showStackedLayoutRecoveryHint &&
    sidebarWidthGainFromCollapsingForLayoutPressure > 0 &&
    !isResponsiveStackedTileLayout(
      sessionGridWidthAfterCollapsingSidebarForLayoutPressure,
      sessionGridMeasurements.gap,
      tileLayoutMode,
      visibleTileCount,
    )
  const canResolveNearStackedLayoutPressureByCollapsingSidebar =
    showNearStackedLayoutHint &&
    sidebarWidthGainFromCollapsingForLayoutPressure > 0 &&
    !isResponsiveStackedTileLayout(
      Math.max(
        0,
        sessionGridWidthAfterCollapsingSidebarForLayoutPressure -
          NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER,
      ),
      sessionGridMeasurements.gap,
      tileLayoutMode,
      visibleTileCount,
    )
  const showHidePanelForLayoutPressure =
    showHidePanelForStackedLayoutPressure ||
    showHidePanelForNearStackedLayoutPressure
  const showCollapseSidebarForLayoutPressure =
    canCollapseSidebarForLayoutPressure &&
    (showStackedLayoutRecoveryHint
      ? canResolveStackedLayoutPressureByCollapsingSidebar
      : showNearStackedLayoutHint
        ? canResolveNearStackedLayoutPressureByCollapsingSidebar
        : false)
  const prioritizeShrinkPanelForLayoutPressure =
    showShrinkPanelForLayoutPressure &&
    (showStackedLayoutRecoveryHint
      ? canResolveStackedLayoutPressureByShrinkingPanel
      : showNearStackedLayoutHint
        ? canResolveNearStackedLayoutPressureByShrinkingPanel
        : false)
  const prioritizeCollapseSidebarForLayoutPressure =
    showCollapseSidebarForLayoutPressure && !prioritizeShrinkPanelForLayoutPressure
  const prioritizeHidePanelForLayoutPressure =
    showHidePanelForLayoutPressure &&
    (showStackedLayoutRecoveryHint
      ? showHidePanelForStackedLayoutPressure &&
        canResolveStackedLayoutPressureByHidingPanel &&
        !prioritizeShrinkPanelForLayoutPressure &&
        !prioritizeCollapseSidebarForLayoutPressure
      : showNearStackedLayoutHint
        ? canResolveNearStackedLayoutPressureByHidingPanel &&
          !canResolveNearStackedLayoutPressureByShrinkingPanel &&
          !canResolveNearStackedLayoutPressureByCollapsingSidebar
        : false)
  const hasLessDisruptiveLayoutPressureRecoveryAction =
    prioritizeShrinkPanelForLayoutPressure || prioritizeCollapseSidebarForLayoutPressure
  const showHidePanelForLayoutPressureAction =
    showHidePanelForLayoutPressure &&
    (!hasLessDisruptiveLayoutPressureRecoveryAction || prioritizeHidePanelForLayoutPressure)
  const showPanelAtMinimumWidthLayoutPressureHint =
    showHidePanelForLayoutPressureAction &&
    !!panelLayoutPressureState?.isVisible &&
    !canShrinkPanelForLayoutPressure
  const panelAtMinimumWidthLayoutPressureLabel =
    !showPanelAtMinimumWidthLayoutPressureHint
      ? null
      : isVeryCompactSessionHeader
        ? "Min width"
        : isCompactSessionHeader
          ? "Panel min width"
          : "Panel already at minimum width"
  const panelAtMinimumWidthLayoutPressureTitle =
    !showPanelAtMinimumWidthLayoutPressureHint
      ? null
      : "The floating panel is already at its minimum width, so shrinking it will not free more room for tiled sessions. Hide the panel if you need additional width."
  const showPassivePanelAtMinimumWidthLayoutPressureHint =
    showPanelAtMinimumWidthLayoutPressureHint && isVeryCompactSessionHeader
  const shrinkPanelForLayoutPressureRecoveryWidth =
    showShrinkPanelForLayoutPressure && panelWidthGainFromShrinkingForLayoutPressure > 0
      ? Math.round(panelWidthGainFromShrinkingForLayoutPressure)
      : 0
  const shrinkPanelForLayoutPressureRecoveryLabel =
    shrinkPanelForLayoutPressureRecoveryWidth > 0 && !isVeryCompactSessionHeader
      ? `+${shrinkPanelForLayoutPressureRecoveryWidth}px`
      : null
  const shrinkPanelForLayoutPressureRecoveryDetail =
    shrinkPanelForLayoutPressureRecoveryWidth > 0
      ? ` Frees about ${shrinkPanelForLayoutPressureRecoveryWidth}px of session width.`
      : ""
  const hidePanelForLayoutPressureRecoveryWidth =
    showHidePanelForLayoutPressure && panelLayoutPressureState?.isVisible
      ? Math.round(panelLayoutPressureState.width)
      : 0
  const hidePanelForLayoutPressureRecoveryLabel =
    hidePanelForLayoutPressureRecoveryWidth > 0 && !isVeryCompactSessionHeader
      ? `+${hidePanelForLayoutPressureRecoveryWidth}px`
      : null
  const hidePanelForLayoutPressureRecoveryDetail =
    hidePanelForLayoutPressureRecoveryWidth > 0
      ? ` Frees about ${hidePanelForLayoutPressureRecoveryWidth}px of session width.`
      : ""
  const collapseSidebarForLayoutPressureRecoveryWidth =
    showCollapseSidebarForLayoutPressure &&
    sidebarWidthGainFromCollapsingForLayoutPressure > 0
      ? Math.round(sidebarWidthGainFromCollapsingForLayoutPressure)
      : 0
  const collapseSidebarForLayoutPressureRecoveryLabel =
    collapseSidebarForLayoutPressureRecoveryWidth > 0 && !isVeryCompactSessionHeader
      ? `+${collapseSidebarForLayoutPressureRecoveryWidth}px`
      : null
  const collapseSidebarForLayoutPressureRecoveryDetail =
    collapseSidebarForLayoutPressureRecoveryWidth > 0
      ? ` Frees about ${collapseSidebarForLayoutPressureRecoveryWidth}px of session width.`
      : ""
  const prioritizedLayoutPressureOutcomeLabel =
    isCompactSessionHeader
      ? null
      : showStackedLayoutRecoveryHint
        ? prioritizeShrinkPanelForLayoutPressure ||
          prioritizeCollapseSidebarForLayoutPressure ||
          prioritizeHidePanelForLayoutPressure
          ? tileLayoutMode === "1x2"
            ? "Restores side by side"
            : "Restores columns"
          : null
        : showNearStackedLayoutHint
          ? prioritizeShrinkPanelForLayoutPressure ||
            prioritizeCollapseSidebarForLayoutPressure ||
            prioritizeHidePanelForLayoutPressure
            ? tileLayoutMode === "1x2"
              ? "Keeps side by side"
              : "Keeps columns"
            : null
          : null
  const compactPrioritizedLayoutPressureOutcomeLabel =
    !isVeryCompactSessionHeader
      ? null
      : showStackedLayoutRecoveryHint
        ? "Restore"
        : showNearStackedLayoutHint
          ? "Keep"
          : null
  const layoutPressureOutcomeBadgeLabel =
    prioritizedLayoutPressureOutcomeLabel ??
    compactPrioritizedLayoutPressureOutcomeLabel
  const shrinkPanelForLayoutPressureLabel = !showShrinkPanelForLayoutPressure
    ? null
    : isVeryCompactSessionHeader
      ? "Shrink"
      : "Shrink panel"
  const hidePanelForLayoutPressureLabel = !showHidePanelForLayoutPressureAction
    ? null
    : isVeryCompactSessionHeader
      ? "Hide"
      : "Hide panel"
  const collapseSidebarForLayoutPressureLabel = !showCollapseSidebarForLayoutPressure
    ? null
    : isVeryCompactSessionHeader
      ? "Sidebar"
      : "Collapse sidebar"
  const shouldHidePassiveLayoutPressureHintChipsOnCompactHeader =
    isCompactSessionHeader &&
    (showShrinkPanelForLayoutPressure ||
      showCollapseSidebarForLayoutPressure ||
      showHidePanelForLayoutPressureAction)
  const shouldHidePassiveStackedLayoutRecoveryHint =
    showStackedLayoutRecoveryHint &&
    !isCompactSessionHeader &&
    !!prioritizedLayoutPressureOutcomeLabel &&
    (prioritizeShrinkPanelForLayoutPressure ||
      prioritizeCollapseSidebarForLayoutPressure ||
      prioritizeHidePanelForLayoutPressure)
  const shouldHidePassiveNearStackedLayoutHint =
    showNearStackedLayoutHint &&
    !isCompactSessionHeader &&
    !!prioritizedLayoutPressureOutcomeLabel &&
    (prioritizeShrinkPanelForLayoutPressure ||
      prioritizeCollapseSidebarForLayoutPressure ||
      prioritizeHidePanelForLayoutPressure)
  const showPassiveStackedLayoutRecoveryHint =
    showStackedLayoutRecoveryHint &&
    !shouldHidePassiveLayoutPressureHintChipsOnCompactHeader &&
    !shouldHidePassiveStackedLayoutRecoveryHint
  const showPassiveNearStackedLayoutHint =
    showNearStackedLayoutHint &&
    !shouldHidePassiveLayoutPressureHintChipsOnCompactHeader &&
    !shouldHidePassiveNearStackedLayoutHint
  const inactiveSessionCountLabel =
    inactiveSessionCount === 1
      ? "1 completed session"
      : `${inactiveSessionCount} completed sessions`
  const clearInactiveSessionsButtonLabel =
    inactiveSessionCount <= 0
      ? null
      : isVeryCompactSessionHeader
        ? null
        : isCompactSessionHeader
          ? "Clear"
          : "Clear completed"
  const clearInactiveSessionsTitle =
    inactiveSessionCount <= 0
      ? ""
      : `Clear ${inactiveSessionCountLabel}`
  const shrinkPanelForLayoutPressureTitle =
    (showStackedLayoutRecoveryHint
      ? canResolveStackedLayoutPressureByShrinkingPanel
        ? tileLayoutMode === "1x2"
          ? "Shrink the floating panel width to restore side-by-side tiled sessions."
          : "Shrink the floating panel width to restore multiple tiled columns."
        : "Shrink the floating panel width to restore more room for tiled sessions."
      : showNearStackedLayoutHint
        ? canResolveNearStackedLayoutPressureByShrinkingPanel
          ? "Shrink the floating panel width to keep tiled sessions from stacking."
          : "Shrink the floating panel width to give tiled sessions a bit more room, though hiding it will clear the warning more reliably."
        : "Shrink the floating panel width to give tiled sessions more room.") +
    shrinkPanelForLayoutPressureRecoveryDetail
  const hidePanelForLayoutPressureOnlyRemainingActionDetail =
    showPanelAtMinimumWidthLayoutPressureHint
      ? " The floating panel is already at minimum width, so hiding it is the only remaining panel recovery action."
      : ""
  const hidePanelForLayoutPressureTitle =
    (showStackedLayoutRecoveryHint
      ? canResolveStackedLayoutPressureByHidingPanel
        ? tileLayoutMode === "1x2"
          ? "Hide the floating panel entirely to restore side-by-side tiled sessions."
          : "Hide the floating panel entirely to restore multiple tiled columns."
        : "Hide the floating panel entirely to restore the most room for tiled sessions."
      : showNearStackedLayoutHint
        ? canResolveNearStackedLayoutPressureByHidingPanel
          ? "Hide the floating panel to keep tiled sessions from stacking."
          : "Hide the floating panel to give tiled sessions more room, though the tight-fit warning may remain."
        : "Hide the floating panel to give tiled sessions more room.") +
    hidePanelForLayoutPressureOnlyRemainingActionDetail +
    hidePanelForLayoutPressureRecoveryDetail
  const collapseSidebarForLayoutPressureTitle =
    (showStackedLayoutRecoveryHint
      ? tileLayoutMode === "1x2"
        ? "Collapse the sidebar to restore side-by-side tiled sessions."
        : "Collapse the sidebar to restore multiple tiled columns."
      : showNearStackedLayoutHint
        ? tileLayoutMode === "1x2"
          ? "Collapse the sidebar to keep tiled sessions side by side."
          : "Collapse the sidebar to keep multiple tiled columns visible."
        : "Collapse the sidebar to give tiled sessions more room.") +
    collapseSidebarForLayoutPressureRecoveryDetail
  const secondaryLayoutPressureActionClassName =
    "border-border/60 bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground h-7 border text-[11px]"
  const prioritizedLayoutPressureActionClassName =
    "border-blue-500/35 bg-blue-500/10 text-blue-700 shadow-sm hover:border-blue-500/45 hover:bg-blue-500/15 hover:text-blue-800 h-7 border text-[11px] dark:text-blue-300 dark:hover:text-blue-200"
  const prioritizedLayoutPressureOutcomeClassName =
    "rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-300"
  useEffect(() => {
    if (!showStackedLayoutRecoveryHint && !showNearStackedLayoutHint) {
      return undefined
    }

    void syncPanelLayoutPressureState()

    const handlePanelLayoutPressureSignal = () => {
      void syncPanelLayoutPressureState()
    }
    const unlistenPanelSizeChanged = rendererHandlers.onPanelSizeChanged.listen(
      handlePanelLayoutPressureSignal,
    )
    const unlistenFloatingPanelLayoutStateChanged =
      rendererHandlers.onFloatingPanelLayoutStateChanged.listen(
        handlePanelLayoutPressureSignal,
      )

    return () => {
      unlistenPanelSizeChanged()
      unlistenFloatingPanelLayoutStateChanged()
    }
  }, [
    showNearStackedLayoutHint,
    showStackedLayoutRecoveryHint,
    syncPanelLayoutPressureState,
  ])
  const showReorderHint =
    canReorderTiles &&
    visibleTileCount > 1 &&
    !isResponsiveStackedLayout &&
    !showNearStackedLayoutHint
  const trailingReorderDropTargetIndex = allProgressEntries.length
  const draggedSessionReorderLabel = draggedSessionId
    ? reorderableSessionLabelById.get(draggedSessionId) ?? "session"
    : "session"
  const showGridReorderIdleHint =
    canReorderTiles && !!draggedSessionId && dragTargetIndex === null
  const showGridReorderEndDropZone =
    canReorderTiles && !!draggedSessionId && allProgressEntries.length > 1
  const currentReorderSessionIds =
    sessionOrder.length > 0 ? sessionOrder : allProgressEntries.map(([id]) => id)
  const isGridReorderEndDropTarget =
    showGridReorderEndDropZone &&
    dragTargetIndex === trailingReorderDropTargetIndex
  const gridReorderEndDropZonePreviewCopy = draggedSessionId
    ? getSessionReorderDropTargetIndicatorCopy(
        currentReorderSessionIds,
        draggedSessionId,
        trailingReorderDropTargetIndex,
        reorderableSessionLabelById,
        {
          vertical: isResponsiveStackedLayout,
        },
      )
    : null
  const gridReorderIdleHintLabel = isCompactSessionHeader
    ? "Release to keep order"
    : isResponsiveStackedLayout
      ? "Drag over a tile to reorder · Drag below the last tile to move to bottom · Release to keep order"
      : "Drag over a tile to reorder · Drag below the last tile to move to end · Release to keep order"
  const gridReorderEndDropZoneMoveLabel = draggedSessionId
    ? `Move ${draggedSessionReorderLabel}`
    : null
  const gridReorderEndDropZoneLabel =
    gridReorderEndDropZonePreviewCopy?.contextLabel ??
    (isResponsiveStackedLayout
      ? isCompactSessionHeader
        ? "To bottom"
        : "To bottom of stack"
      : isCompactSessionHeader
        ? "To end"
        : "To end of sessions")
  const gridReorderEndDropZoneTitle =
    gridReorderEndDropZonePreviewCopy?.title ??
    (draggedSessionId
      ? isResponsiveStackedLayout
        ? `Move ${draggedSessionReorderLabel} below all visible sessions`
        : `Move ${draggedSessionReorderLabel} to the end of sessions`
      : isResponsiveStackedLayout
        ? "Drop to move session below all visible sessions"
        : "Drop to move session to the end of sessions")
  const gridReorderEndDropZoneMarkerLabel = isGridReorderEndDropTarget
    ? isResponsiveStackedLayout
      ? isCompactSessionHeader
        ? "Release to bottom"
        : "Release at bottom of stack"
      : isCompactSessionHeader
        ? "Release to end"
        : "Release at last position"
    : isResponsiveStackedLayout
      ? isCompactSessionHeader
        ? "Bottom"
        : "Bottom of stack"
      : isCompactSessionHeader
        ? "End"
        : "Last position"
  const handleRestorePreviousLayout = useCallback(() => {
    if (!isFocusLayout) return

    handleSelectTileLayout(previousLayoutModeRef.current)
  }, [handleSelectTileLayout, isFocusLayout])
  const focusedLayoutSessionLabel = useMemo(() => {
    if (!showFocusLayoutHint || !maximizedSessionId) return null

    return focusableSessionLabelById.get(maximizedSessionId) ?? null
  }, [focusableSessionLabelById, maximizedSessionId, showFocusLayoutHint])
  const focusedLayoutCountLabel =
    focusedLayoutSessionIndex < 0
      ? null
      : isCompactSessionHeader
        ? `${focusedLayoutSessionIndex + 1}/${focusableSessionCount}`
        : `${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}`
  const focusedLayoutNeighborContextLabel = useMemo(() => {
    if (!showFocusLayoutHint || !maximizedSessionId) return null

    return getSessionReorderNeighborContextLabel(
      getSessionReorderAnnouncementContext(
        focusableSessionIds,
        maximizedSessionId,
        focusableSessionLabelById,
      ),
    )
  }, [
    focusableSessionIds,
    focusableSessionLabelById,
    maximizedSessionId,
    showFocusLayoutHint,
  ])
  const focusedLayoutNeighborContextDisplayLabel =
    focusedLayoutNeighborContextLabel
      ? `${focusedLayoutNeighborContextLabel.charAt(0).toUpperCase()}${focusedLayoutNeighborContextLabel.slice(1)}`
      : null
  const recentSingleViewReturnAnnouncementLabel = useMemo(() => {
    if (
      !recentlyRestoredFromSingleViewSessionId ||
      tileLayoutMode === "1x1"
    ) {
      return ""
    }

    const keptVisibleSessionLabel =
      focusableSessionLabelById.get(recentlyRestoredFromSingleViewSessionId) ??
      "the same session"

    const baseAnnouncement = getSingleViewReturnAnnouncement(
      tileLayoutMode,
      keptVisibleSessionLabel,
    )

    if (tileLayoutMode === "1x1" || !recentSingleViewRestoreAdjustment) {
      return baseAnnouncement
    }

    return `${baseAnnouncement} ${getSingleViewRestoreAdjustmentAnnouncement(tileLayoutMode, recentSingleViewRestoreAdjustment)}`
  }, [
    focusableSessionLabelById,
    recentSingleViewRestoreAdjustment,
    recentlyRestoredFromSingleViewSessionId,
    tileLayoutMode,
  ])
  const recentSingleViewRestoreAdjustmentHint =
    recentSingleViewRestoreAdjustment && tileLayoutMode !== "1x1"
      ? getSingleViewRestoreAdjustmentHint(
          tileLayoutMode,
          recentSingleViewRestoreAdjustment,
          isCompactSessionHeader,
          isVeryCompactSessionHeader,
        )
      : null
  const showRecentSingleViewRestoreAdjustmentHint =
    !!recentSingleViewRestoreAdjustmentHint
  const shouldPreferCompactFocusedSessionBrowsePositionLabel =
    isFocusLayout &&
    isCompactSessionHeader &&
    !isVeryCompactSessionHeader &&
    canBrowseFocusedSessions
  const showFocusedSessionLabel =
    !!focusedLayoutSessionLabel &&
    (!isCompactSessionHeader || shouldPreferCompactFocusedSessionBrowsePositionLabel)
  const showBrowsingSessionsLabel =
    !focusedLayoutSessionLabel &&
    (!isCompactSessionHeader || shouldPreferCompactFocusedSessionBrowsePositionLabel)
  const showFocusedLayoutNeighborContext =
    !!focusedLayoutNeighborContextDisplayLabel && !isCompactSessionHeader
  const showLayoutButtonLabels = !isVeryCompactSessionHeader
  const reorderHintTitle =
    "Drag a session tile's reorder handle onto another tile to place it before that session, drag below the last tile to move it to the end, or focus a handle and use arrow keys to move it earlier or later"
  const reorderHintLabel = isVeryCompactSessionHeader
    ? "Move"
    : isCompactSessionHeader
      ? "Reorder"
      : "Drag or use arrows"
  const previousFocusedSessionId =
    canBrowseFocusedSessions && focusedLayoutSessionIndex > 0
      ? focusableSessionIds[focusedLayoutSessionIndex - 1] ?? null
      : null
  const nextFocusedSessionId =
    canBrowseFocusedSessions &&
    focusedLayoutSessionIndex < focusableSessionCount - 1
      ? focusableSessionIds[focusedLayoutSessionIndex + 1] ?? null
      : null
  const previousFocusedSessionLabel = previousFocusedSessionId
    ? focusableSessionLabelById.get(previousFocusedSessionId) ?? null
    : null
  const nextFocusedSessionLabel = nextFocusedSessionId
    ? focusableSessionLabelById.get(nextFocusedSessionId) ?? null
    : null
  const previousFocusedSessionBrowseTitle = previousFocusedSessionLabel
    ? `Show previous session in Single view: ${previousFocusedSessionLabel}`
    : "Already showing the first session in Single view"
  const nextFocusedSessionBrowseTitle = nextFocusedSessionLabel
    ? `Show next session in Single view: ${nextFocusedSessionLabel}`
    : "Already showing the last session in Single view"
  const focusedSessionBrowsePositionLabel =
    focusedLayoutCountLabel &&
    (isVeryCompactSessionHeader || shouldPreferCompactFocusedSessionBrowsePositionLabel)
      ? focusedLayoutCountLabel
      : null
  const showFocusedSessionBrowseLabel =
    canBrowseFocusedSessions &&
    (!!focusedLayoutSessionLabel || !!focusedSessionBrowsePositionLabel) &&
    (!showFocusedSessionLabel || !!focusedSessionBrowsePositionLabel)
  const focusedSessionBrowseLabel = !showFocusedSessionBrowseLabel
    ? null
    : focusedSessionBrowsePositionLabel
      ? focusedSessionBrowsePositionLabel
      : focusedLayoutSessionLabel
  const showFocusedLayoutCountBadge = !!focusedLayoutCountLabel && !focusedSessionBrowsePositionLabel
  const showFocusedLayoutSummaryChip =
    showFocusLayoutHint &&
    (!isVeryCompactSessionHeader ||
      showFocusedLayoutCountBadge ||
      showFocusedSessionLabel ||
      showBrowsingSessionsLabel)
  const showFocusedLayoutModeLabel =
    showFocusedLayoutSummaryChip && isCompactSessionHeader
  const focusedLayoutModeLabel = showFocusedLayoutModeLabel ? "Single" : null
  const hasCompactSessionHeaderMeta =
    showCurrentLayoutChip ||
    showRecentSingleViewRestoreAdjustmentHint ||
    showPassiveStackedLayoutRecoveryHint ||
    showPassiveNearStackedLayoutHint ||
    showRecentResponsiveWidthLockHint ||
    showPassivePanelAtMinimumWidthLayoutPressureHint ||
    showFocusedLayoutSummaryChip ||
    showReorderHint
  const shouldSplitSessionHeaderRows =
    isCompactSessionHeader && hasCompactSessionHeaderMeta

  const handleStepFocusedSession = useCallback(
    (direction: "previous" | "next") => {
      if (!isFocusLayout || !maximizedSessionId) return

      const currentIndex = focusableSessionIds.indexOf(maximizedSessionId)
      if (currentIndex === -1) return

      const nextIndex =
        direction === "previous" ? currentIndex - 1 : currentIndex + 1
      const nextSessionId = focusableSessionIds[nextIndex]
      if (!nextSessionId) return

      setFocusedSessionId(nextSessionId)
    },
    [
      focusableSessionIds,
      isFocusLayout,
      maximizedSessionId,
      setFocusedSessionId,
    ],
  )
  const handleShrinkPanelForLayoutPressure = useCallback(async () => {
    if (isShrinkingPanelForLayoutPressure) return

    setIsShrinkingPanelForLayoutPressure(true)

    try {
      const [panelSizeResponse, panelModeResponse] = await Promise.all([
        tipcClient.getPanelSize(),
        tipcClient.getPanelMode(),
      ])

      if (!isPanelSize(panelSizeResponse)) {
        throw new Error("Panel size unavailable")
      }

      const panelMode: PanelMode = isPanelMode(panelModeResponse)
        ? panelModeResponse
        : "normal"
      const updatedPanelSize = await tipcClient.updatePanelSize({
        width: 0,
        height: panelSizeResponse.height,
        resizeAnchor: "left",
      })
      const finalPanelSize = isPanelSize(updatedPanelSize)
        ? updatedPanelSize
        : panelSizeResponse

      setPanelLayoutPressureState((currentState) =>
        currentState
          ? {
              ...currentState,
              width: finalPanelSize.width,
              height: finalPanelSize.height,
            }
          : currentState,
      )

      await tipcClient.savePanelModeSize({
        mode: panelMode,
        width: finalPanelSize.width,
        height: finalPanelSize.height,
      })
    } catch (error) {
      console.error(
        "Failed to shrink floating panel for tiled sessions:",
        error,
      )
      toast.error("Couldn't shrink the floating panel")
    } finally {
      setIsShrinkingPanelForLayoutPressure(false)
    }
  }, [isShrinkingPanelForLayoutPressure])
  const handleHidePanelForLayoutPressure = useCallback(async () => {
    if (isHidingPanelForLayoutPressure) return

    setIsHidingPanelForLayoutPressure(true)

    try {
      await tipcClient.hidePanelWindow({})
      setPanelLayoutPressureState((currentState) =>
        currentState
          ? {
              ...currentState,
              isVisible: false,
            }
          : currentState,
      )
    } catch (error) {
      console.error(
        "Failed to hide floating panel for tiled sessions:",
        error,
      )
      toast.error("Couldn't hide the floating panel")
    } finally {
      setIsHidingPanelForLayoutPressure(false)
    }
  }, [isHidingPanelForLayoutPressure])

  const shrinkPanelForLayoutPressureButton = showShrinkPanelForLayoutPressure ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleShrinkPanelForLayoutPressure}
      disabled={isShrinkingPanelForLayoutPressure}
      aria-label={shrinkPanelForLayoutPressureTitle}
      title={shrinkPanelForLayoutPressureTitle}
      className={cn(
        prioritizeShrinkPanelForLayoutPressure
          ? prioritizedLayoutPressureActionClassName
          : secondaryLayoutPressureActionClassName,
        shrinkPanelForLayoutPressureLabel ? "gap-1 px-2" : "px-1.5",
      )}
    >
      {isShrinkingPanelForLayoutPressure ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ChevronsLeft className="h-3.5 w-3.5 shrink-0" />
      )}
      {shrinkPanelForLayoutPressureLabel ? (
        <span>{shrinkPanelForLayoutPressureLabel}</span>
      ) : null}
      {prioritizeShrinkPanelForLayoutPressure && layoutPressureOutcomeBadgeLabel ? (
        <span className={prioritizedLayoutPressureOutcomeClassName}>
          {layoutPressureOutcomeBadgeLabel}
        </span>
      ) : shrinkPanelForLayoutPressureRecoveryLabel ? (
        <span className="border-border/60 bg-background/70 text-foreground/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
          {shrinkPanelForLayoutPressureRecoveryLabel}
        </span>
      ) : null}
    </Button>
  ) : null

  const hidePanelForLayoutPressureButton = showHidePanelForLayoutPressureAction ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleHidePanelForLayoutPressure}
      disabled={isHidingPanelForLayoutPressure}
      aria-label={hidePanelForLayoutPressureTitle}
      title={hidePanelForLayoutPressureTitle}
      className={cn(
        prioritizeHidePanelForLayoutPressure
          ? prioritizedLayoutPressureActionClassName
          : secondaryLayoutPressureActionClassName,
        hidePanelForLayoutPressureLabel ? "gap-1 px-2" : "px-1.5",
      )}
    >
      {isHidingPanelForLayoutPressure ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <EyeOff className="h-3.5 w-3.5 shrink-0" />
      )}
      {hidePanelForLayoutPressureLabel ? (
        <span>{hidePanelForLayoutPressureLabel}</span>
      ) : null}
      {prioritizeHidePanelForLayoutPressure && layoutPressureOutcomeBadgeLabel ? (
        <span className={prioritizedLayoutPressureOutcomeClassName}>
          {layoutPressureOutcomeBadgeLabel}
        </span>
      ) : hidePanelForLayoutPressureRecoveryLabel ? (
        <span className="border-border/60 bg-background/70 text-foreground/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
          {hidePanelForLayoutPressureRecoveryLabel}
        </span>
      ) : null}
    </Button>
  ) : null
  const collapseSidebarForLayoutPressureButton =
    showCollapseSidebarForLayoutPressure && collapseSidebar ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={collapseSidebar}
        aria-label={collapseSidebarForLayoutPressureTitle}
        title={collapseSidebarForLayoutPressureTitle}
        className={cn(
          prioritizeCollapseSidebarForLayoutPressure
            ? prioritizedLayoutPressureActionClassName
            : secondaryLayoutPressureActionClassName,
          collapseSidebarForLayoutPressureLabel ? "gap-1 px-2" : "px-1.5",
        )}
      >
        <PanelLeftClose className="h-3.5 w-3.5 shrink-0" />
        {collapseSidebarForLayoutPressureLabel ? (
          <span>{collapseSidebarForLayoutPressureLabel}</span>
        ) : null}
        {prioritizeCollapseSidebarForLayoutPressure && layoutPressureOutcomeBadgeLabel ? (
          <span className={prioritizedLayoutPressureOutcomeClassName}>
            {layoutPressureOutcomeBadgeLabel}
          </span>
        ) : collapseSidebarForLayoutPressureRecoveryLabel ? (
          <span className="border-border/60 bg-background/70 text-foreground/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
            {collapseSidebarForLayoutPressureRecoveryLabel}
          </span>
        ) : null}
      </Button>
    ) : null
  const singleViewRestoreButton =
    showDedicatedSingleViewRestoreButton && restoreLayoutOption ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleRestorePreviousLayout}
        aria-label={singleViewRestoreTitle ?? undefined}
        title={singleViewRestoreTitle ?? undefined}
        className={cn(
          "border-border/60 bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground h-7 border text-[11px]",
          singleViewRestoreLabel
            ? isVeryCompactSessionHeader
              ? "gap-1 px-1.5"
              : "gap-1 px-2"
            : "px-1.5",
        )}
      >
        <restoreLayoutOption.Icon className="h-3.5 w-3.5 shrink-0" />
        {singleViewRestoreLabel ? <span>{singleViewRestoreLabel}</span> : null}
      </Button>
    ) : null
  const sessionTileLayoutButtonGroup = (
    <div
      role="group"
      aria-label="Session tile layout"
      className="border-border/60 bg-background/80 flex items-center gap-0.5 rounded-lg border p-0.5"
    >
      {TILE_LAYOUT_OPTIONS.map(({ mode, label, title, Icon }) => {
        const isSingleViewRestoreTarget =
          isFocusLayout && mode !== "1x1" && restoreLayoutOption?.mode === mode
        const promoteSingleViewRestoreTargetInLayoutGroup =
          isSingleViewRestoreTarget && !showDedicatedSingleViewRestoreButton
        const singleViewLayoutSwitchTitle =
          isFocusLayout && mode !== "1x1"
            ? isSingleViewRestoreTarget
              ? `Return to ${LAYOUT_LABELS[mode]} (last tiled layout) and keep ${singleViewRestoreFocusContext}`
              : `Switch from Single view to ${LAYOUT_LABELS[mode]} and keep ${singleViewRestoreFocusContext}`
            : title
        const showSingleViewRestoreTargetBadge =
          isSingleViewRestoreTarget &&
          showLayoutButtonLabels &&
          (!showDedicatedSingleViewRestoreButton || !isCompactSessionHeader)
        const singleViewRestoreTargetBadgeLabel = !showSingleViewRestoreTargetBadge
          ? null
          : isCompactSessionHeader
            ? "Back"
            : "Back target"

        return (
          <Button
            key={mode}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSelectTileLayout(mode)}
            aria-label={singleViewLayoutSwitchTitle}
            aria-pressed={tileLayoutMode === mode}
            title={
              tileLayoutMode === mode
                ? `Current layout: ${LAYOUT_LABELS[mode]} — ${activeLayoutDescription}`
                : singleViewLayoutSwitchTitle
            }
            className={cn(
              "text-muted-foreground hover:text-foreground h-7 text-[11px]",
              showLayoutButtonLabels ? "gap-1 px-2" : "px-1.5",
              promoteSingleViewRestoreTargetInLayoutGroup
                ? "bg-blue-500/10 text-blue-700 shadow-sm ring-1 ring-inset ring-blue-500/30 hover:bg-blue-500/15 dark:text-blue-300"
                : isSingleViewRestoreTarget &&
                    "bg-background text-foreground/90 shadow-sm ring-1 ring-inset ring-border/60 hover:bg-background",
              tileLayoutMode === mode &&
                "bg-accent text-foreground hover:bg-accent shadow-sm",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {showLayoutButtonLabels ? <span>{label}</span> : null}
            {singleViewRestoreTargetBadgeLabel ? (
              <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-300">
                {singleViewRestoreTargetBadgeLabel}
              </span>
            ) : null}
          </Button>
        )
      })}
    </div>
  )
  const sessionTileModeControls = (
    <div className="flex shrink-0 items-center gap-1">
      {singleViewRestoreButton}
      {sessionTileLayoutButtonGroup}
    </div>
  )
  const layoutPressureActionButtons = [
    {
      button: shrinkPanelForLayoutPressureButton,
      isPrioritized: prioritizeShrinkPanelForLayoutPressure,
      key: "shrink-panel",
    },
    {
      button: collapseSidebarForLayoutPressureButton,
      isPrioritized: prioritizeCollapseSidebarForLayoutPressure,
      key: "collapse-sidebar",
    },
    {
      button: hidePanelForLayoutPressureButton,
      isPrioritized: prioritizeHidePanelForLayoutPressure,
      key: "hide-panel",
    },
  ]
    .filter(
      (
        action,
      ): action is {
        button: React.ReactNode
        isPrioritized: boolean
        key: string
      } => action.button !== null,
    )
    .sort((a, b) => Number(b.isPrioritized) - Number(a.isPrioritized))
    .map(({ button, key }) => <React.Fragment key={key}>{button}</React.Fragment>)
  const compactHeaderLayoutPressureActionButtons =
    isCompactSessionHeader && layoutPressureActionButtons.length > 1
      ? layoutPressureActionButtons.slice(0, 1)
      : layoutPressureActionButtons
  const visibleLayoutPressureActionButtons = compactHeaderLayoutPressureActionButtons
  const shouldDeferLayoutPressureActionsInCompactHeader =
    isCompactSessionHeader && layoutPressureActionButtons.length > 0
  const focusedSessionBrowseControls = canBrowseFocusedSessions ? (
    <div
      role="group"
      aria-label="Browse sessions in single view"
      className="border-border/60 bg-background/80 flex items-center gap-0.5 rounded-md border p-0.5"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleStepFocusedSession("previous")}
        disabled={focusedLayoutSessionIndex <= 0}
        aria-label={previousFocusedSessionBrowseTitle}
        title={previousFocusedSessionBrowseTitle}
        className="text-muted-foreground hover:text-foreground h-7 w-7 px-0 disabled:cursor-default disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      {focusedSessionBrowseLabel ? (
        <span
          className={cn(
            "text-foreground/80 border-border/50 bg-muted/30 block min-w-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
            isVeryCompactSessionHeader ? "tabular-nums" : "max-w-[140px] truncate",
          )}
          title={focusedLayoutSessionLabel}
        >
          {focusedSessionBrowseLabel}
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleStepFocusedSession("next")}
        disabled={focusedLayoutSessionIndex >= focusableSessionCount - 1}
        aria-label={nextFocusedSessionBrowseTitle}
        title={nextFocusedSessionBrowseTitle}
        className="text-muted-foreground hover:text-foreground h-7 w-7 px-0 disabled:cursor-default disabled:opacity-40"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  ) : null

  const hasSessions = allProgressEntries.length > 0 || hasPendingTile

  return (
    <div className="group/tile flex h-full flex-col">
      {/* Header with start buttons - outside the scroll area so its height is excluded
          when SessionGrid measures the parent to size tiles. */}
      {hasSessions && (
        <div className="bg-muted/20 flex-shrink-0 border-b px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <AgentSelector
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
                compact
              />
              <Button size="sm" onClick={handleTextClick} className="gap-1.5">
                <Plus className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Start with Text</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleVoiceStart}
                className="gap-1.5"
              >
                <Mic className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Start with Voice</span>
              </Button>
              <PredefinedPromptsMenu onSelectPrompt={handleSelectPrompt} />
            </div>
            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
              {/* Past sessions button */}
              {onOpenPastSessionsDialog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenPastSessionsDialog}
                  className="text-muted-foreground hover:text-foreground gap-1.5"
                  title="Past Sessions"
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">Past Sessions</span>
                </Button>
              )}
              {inactiveSessionCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearInactiveSessions}
                  className={cn(
                    "text-muted-foreground hover:text-foreground h-7",
                    clearInactiveSessionsButtonLabel ? "gap-1.5 px-2" : "gap-1 px-1.5",
                  )}
                  title={`${clearInactiveSessionsTitle}. Conversations stay in history.`}
                  aria-label={clearInactiveSessionsTitle}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {clearInactiveSessionsButtonLabel ? (
                    <span>{clearInactiveSessionsButtonLabel}</span>
                  ) : null}
                  <span className="border-border/60 bg-background/70 text-foreground/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                    {inactiveSessionCount}
                  </span>
                </Button>
              )}
            </div>
          </div>
          <div
            className={cn(
              "border-border/50 mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2",
              shouldSplitSessionHeaderRows && "gap-y-1.5",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-wrap items-center gap-1",
                shouldSplitSessionHeaderRows && "order-2 basis-full",
              )}
            >
              {showCurrentLayoutChip && (
                <div
                  className="border-border/60 bg-background/70 text-muted-foreground flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]"
                  title={`Current layout: ${LAYOUT_LABELS[tileLayoutMode]} — ${activeLayoutDescription}`}
                >
                  <activeLayoutOption.Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground/90 whitespace-nowrap font-medium">
                    {currentLayoutChipLabel}
                  </span>
                  {showLayoutDescriptionSuffix ? (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="whitespace-nowrap">
                        {activeLayoutDescription}
                      </span>
                    </>
                  ) : showCompactAdaptiveLayoutDescription ? (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="whitespace-nowrap">
                        {activeLayoutCompactDescription}
                      </span>
                    </>
                  ) : null}
                </div>
              )}
              {showPassiveStackedLayoutRecoveryHint &&
                stackedLayoutRecoveryHint &&
                stackedLayoutRecoveryLabel && (
                  <div
                    className={cn(
                      "flex max-w-full items-center gap-1.5 rounded-md border border-dashed border-blue-500/30 bg-blue-500/10 py-1 text-[11px] text-blue-700 dark:text-blue-300",
                      isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                    )}
                    title={stackedLayoutRecoveryTitle ?? stackedLayoutRecoveryHint.title}
                  >
                    <activeLayoutOption.Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {stackedLayoutRecoveryLabel}
                    </span>
                    {stackedLayoutRecoveryWidthGapLabel ? (
                      <span className="rounded-full border border-blue-500/20 bg-background/70 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-blue-700/90 dark:text-blue-200">
                        {stackedLayoutRecoveryWidthGapLabel}
                      </span>
                    ) : null}
                  </div>
                )}
              {showRecentSingleViewRestoreAdjustmentHint &&
                recentSingleViewRestoreAdjustmentHint && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "border-blue-500/20 bg-background/85 flex max-w-full items-center gap-1.5 rounded-md border py-1 text-[11px] text-blue-700/90 shadow-sm dark:text-blue-200",
                      isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                    )}
                    title={recentSingleViewRestoreAdjustmentHint.title}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {recentSingleViewRestoreAdjustmentHint.label}
                    </span>
                    {recentSingleViewRestoreAdjustmentHint.badgeLabel ? (
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700/90 dark:text-blue-200">
                        {recentSingleViewRestoreAdjustmentHint.badgeLabel}
                      </span>
                    ) : null}
                  </div>
                )}
              {showPassiveNearStackedLayoutHint &&
                nearStackedLayoutHint &&
                nearStackedLayoutHintLabel && (
                  <div
                    className={cn(
                      "flex max-w-full items-center gap-1.5 rounded-md border border-dashed border-amber-500/30 bg-amber-500/10 py-1 text-[11px] text-amber-700 dark:text-amber-300",
                      isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                    )}
                    title={nearStackedLayoutHintTitle ?? nearStackedLayoutHint.title}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {nearStackedLayoutHintLabel}
                    </span>
                    {nearStackedLayoutWidthGapLabel ? (
                      <span className="rounded-full border border-amber-500/20 bg-background/70 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-amber-700/90 dark:text-amber-200">
                        {nearStackedLayoutWidthGapLabel}
                      </span>
                    ) : null}
                  </div>
                )}
              {showRecentResponsiveWidthLockHint &&
                recentResponsiveWidthLockHintLabel && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "border-blue-500/20 bg-background/85 flex max-w-full items-center gap-1.5 rounded-md border py-1 text-[11px] text-blue-700/90 shadow-sm dark:text-blue-200",
                      isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                    )}
                    title={recentResponsiveWidthLockHintTitle ?? undefined}
                  >
                    <span className="whitespace-nowrap">
                      {recentResponsiveWidthLockHintLabel}
                    </span>
                    {recentResponsiveWidthLockHintActionLabel ? (
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700/90 dark:text-blue-200">
                        {recentResponsiveWidthLockHintActionLabel}
                      </span>
                    ) : null}
                  </div>
                )}
              {showPassivePanelAtMinimumWidthLayoutPressureHint &&
                panelAtMinimumWidthLayoutPressureLabel && (
                  <div
                    className={cn(
                      "border-border/60 bg-background/80 text-muted-foreground flex max-w-full items-center gap-1.5 rounded-md border py-1 text-[11px]",
                      isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                    )}
                    title={panelAtMinimumWidthLayoutPressureTitle ?? undefined}
                  >
                    <span className="whitespace-nowrap">
                      {panelAtMinimumWidthLayoutPressureLabel}
                    </span>
                  </div>
                )}
              {showFocusedLayoutSummaryChip && (
                <div
                  className="border-border/60 bg-background/80 text-muted-foreground flex min-w-0 max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]"
                  title={
                    focusedLayoutSessionLabel
                      ? focusedLayoutNeighborContextLabel
                        ? `Single view: ${focusedLayoutSessionLabel} (${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}, ${focusedLayoutNeighborContextLabel})`
                        : `Single view: ${focusedLayoutSessionLabel} (${focusedLayoutSessionIndex + 1} of ${focusableSessionCount})`
                      : `Single view: showing session ${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}`
                  }
                >
                  {focusedLayoutModeLabel ? (
                    <>
                      <span className="text-foreground/85 whitespace-nowrap font-medium">
                        {focusedLayoutModeLabel}
                      </span>
                      <span className="text-muted-foreground/50 whitespace-nowrap">
                        ·
                      </span>
                    </>
                  ) : null}
                  {showFocusedLayoutCountBadge ? (
                    <span className="border-border/60 bg-muted/40 text-foreground/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                      {focusedLayoutCountLabel}
                    </span>
                  ) : null}
                  {showFocusedSessionLabel ? (
                    <>
                      <span className="text-muted-foreground/50 whitespace-nowrap">
                        ·
                      </span>
                      <span
                        className="text-muted-foreground/80 max-w-[220px] truncate"
                        title={focusedLayoutSessionLabel}
                      >
                        Showing {focusedLayoutSessionLabel}
                      </span>
                    </>
                  ) : showBrowsingSessionsLabel ? (
                    <span className="text-muted-foreground/80 whitespace-nowrap">
                      Browsing sessions
                    </span>
                  ) : null}
                  {showFocusedLayoutNeighborContext ? (
                    <>
                      <span className="text-muted-foreground/50 whitespace-nowrap">
                        ·
                      </span>
                      <span
                        className="text-muted-foreground/75 max-w-[200px] truncate"
                        title={focusedLayoutNeighborContextDisplayLabel}
                      >
                        {focusedLayoutNeighborContextDisplayLabel}
                      </span>
                    </>
                  ) : null}
                </div>
              )}
              {showReorderHint && (
                <div
                  className={cn(
                    "border-border/60 bg-background/70 text-muted-foreground flex max-w-full items-center gap-1.5 rounded-md border border-dashed py-1 text-[11px]",
                    reorderHintLabel ? "px-2" : "px-1.5",
                  )}
                  title={reorderHintTitle}
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0" />
                  {reorderHintLabel ? (
                    <span className="whitespace-nowrap">
                      {reorderHintLabel}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            <div
              className={cn(
                "ml-auto flex max-w-full flex-wrap items-center justify-end gap-1",
                shouldSplitSessionHeaderRows && "order-1 ml-0 w-full",
              )}
            >
              {shouldDeferLayoutPressureActionsInCompactHeader
                ? null
                : visibleLayoutPressureActionButtons}
              {focusedSessionBrowseControls}
              {sessionTileModeControls}
              {shouldDeferLayoutPressureActionsInCompactHeader
                ? visibleLayoutPressureActionButtons
                : null}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content area - flex-1 min-h-0 so it fills remaining height without overflow */}
      <div className="scrollbar-hide-until-hover min-h-0 flex-1 overflow-y-auto">
        {/* Show empty state when no sessions and no pending */}
        {!hasSessions ? (
          <EmptyState
            onTextClick={handleTextClick}
            onVoiceClick={handleVoiceStart}
            onSelectPrompt={handleSelectPrompt}
            onPastSessionClick={handleContinueConversation}
            onOpenPastSessionsDialog={onOpenPastSessionsDialog ?? (() => {})}
            textInputShortcut={textInputShortcut}
            voiceInputShortcut={voiceInputShortcut}
            dictationShortcut={dictationShortcut}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
          />
        ) : (
          /* Active sessions - grid view */
          <>
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {reorderAnnouncement}
            </div>
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {recentSingleViewReturnAnnouncementLabel}
            </div>
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {layoutPressureAnnouncement}
            </div>
            <SessionGrid
              sessionCount={visibleTileCount}
              resetKey={tileResetKey}
              layoutMode={tileLayoutMode}
              layoutRestoreWidth={singleViewReturnTileWidthRef.current}
              layoutRestoreHeight={singleViewReturnTileHeightRef.current}
              layoutChangeKey={sidebarWidth}
              onMeasurementsChange={handleSessionGridMeasurementsChange}
              overlay={showGridReorderIdleHint ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="pointer-events-none absolute inset-x-4 top-4 z-10 flex justify-center px-2"
                >
                  <div className="border-border/70 bg-background/95 text-muted-foreground flex max-w-full items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-[11px] font-medium shadow-sm backdrop-blur-sm">
                    <GripVertical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="max-w-full text-center leading-none">
                      {gridReorderIdleHintLabel}
                    </span>
                  </div>
                </div>
              ) : null}
            >
            {/* Pending continuation tile first */}
            {showPendingProgressTile && pendingSessionId && pendingProgress && (
              <SessionTileWrapper
                key={pendingSessionId}
                sessionId={pendingSessionId}
                index={0}
                isCollapsed={collapsedSessions[pendingSessionId] ?? false}
                isDraggable={false}
                onDragStart={() => {}}
                onDragOver={() => {}}
                onDrop={() => {}}
                onDragEnd={() => {}}
                isDragTarget={false}
                isDragging={false}
                isRecentlyRestoredFromSingleView={recentlyRestoredFromSingleViewSessionId === pendingSessionId}
              >
                <AgentProgress
                  progress={pendingProgress}
                  variant="tile"
                  isFocused={true}
                  onFocus={() => {}}
                  onDismiss={handleDismissPendingContinuation}
                  onFollowUpSent={handlePendingContinuationStarted}
                  isCollapsed={collapsedSessions[pendingSessionId] ?? false}
                  onCollapsedChange={(collapsed) =>
                    handleCollapsedChange(pendingSessionId, collapsed)
                  }
                  onExpand={
                    showTileMaximize
                      ? () => handleMaximizeTile(pendingSessionId)
                      : undefined
                  }
                  isExpanded={isFocusLayout}
                  isFollowUpInputInitializing={
                    pendingContinuationStartedAt !== null
                  }
                />
              </SessionTileWrapper>
            )}
            {showPendingLoadingTile && pendingSessionId && (
              <SessionTileWrapper
                key={pendingSessionId}
                sessionId={pendingSessionId}
                index={0}
                isCollapsed={false}
                isDraggable={false}
                onDragStart={() => {}}
                onDragOver={() => {}}
                onDragEnd={() => {}}
                isDragTarget={false}
                isDragging={false}
                isRecentlyRestoredFromSingleView={recentlyRestoredFromSingleViewSessionId === pendingSessionId}
              >
                <div className="border-border bg-card flex h-full flex-col rounded-xl border p-4">
                  <div className="border-border/60 flex items-center gap-2 border-b pb-3">
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                    <div className="bg-muted h-4 w-40 animate-pulse rounded" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="bg-muted/70 h-3 w-full animate-pulse rounded" />
                    <div className="bg-muted/70 h-3 w-5/6 animate-pulse rounded" />
                    <div className="bg-muted/70 h-3 w-2/3 animate-pulse rounded" />
                  </div>
                </div>
              </SessionTileWrapper>
            )}
            {/* Regular sessions */}
            {visibleProgressEntries.map(([sessionId, progress], index) => {
              const isCollapsed = collapsedSessions[sessionId] ?? false
              const isDragTarget =
                canReorderTiles &&
                dragTargetIndex === index &&
                draggedSessionId !== sessionId
              const isSessionFocused =
                focusedSessionId === sessionId ||
                (isFocusLayout && maximizedSessionId === sessionId)
              const dropTargetIndicatorCopy =
                isDragTarget && draggedSessionId
                  ? getSessionReorderDropTargetIndicatorCopy(
                      currentReorderSessionIds,
                      draggedSessionId,
                      index,
                      reorderableSessionLabelById,
                      {
                        vertical: isResponsiveStackedLayout,
                      },
                    )
                  : null

              return (
                <SessionProgressTile
                  key={sessionId}
                  sessionId={sessionId}
                  progress={progress}
                  index={index}
                  isCollapsed={isCollapsed}
                  isDraggable={canReorderTiles}
                  draggedTileLabel={draggedSessionId ? draggedSessionReorderLabel : null}
                  isFocused={isSessionFocused}
                  isExpanded={isFocusLayout}
                  isDragTarget={isDragTarget}
                  isDragging={canReorderTiles && draggedSessionId === sessionId}
                  dropTargetIndicatorContextLabel={
                    dropTargetIndicatorCopy?.contextLabel
                  }
                  dropTargetIndicatorTitle={dropTargetIndicatorCopy?.title}
                  isRecentlyReordered={recentlyReorderedSessionId === sessionId}
                  isRecentlyRestoredFromSingleView={recentlyRestoredFromSingleViewSessionId === sessionId}
                  showTileMaximize={showTileMaximize}
                  onFocusSession={handleFocusSession}
                  onDismissSession={handleDismissSession}
                  onCollapsedChange={handleCollapsedChange}
                  onMaximizeTile={handleMaximizeTile}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onKeyboardReorder={handleKeyboardReorder}
                  canMoveEarlier={index > 0}
                  canMoveLater={index < visibleProgressEntries.length - 1}
                  setSessionRef={setSessionRef}
                />
              )
            })}
            {showGridReorderEndDropZone ? (
              <div
                className={cn(
                  "relative flex min-h-[4.75rem] w-full items-center justify-center overflow-visible rounded-xl border border-dashed px-4 pb-3 pt-5 transition-all duration-150",
                  isGridReorderEndDropTarget
                    ? "border-blue-500/80 bg-blue-500/8 text-blue-700 shadow-sm dark:text-blue-200"
                    : "border-border/70 bg-background/70 text-muted-foreground/80",
                )}
                title={gridReorderEndDropZoneTitle}
                onDragOver={handleTrailingReorderDropZoneDragOver}
                onDragLeave={handleTrailingReorderDropZoneDragLeave}
                onDrop={handleTrailingReorderDropZoneDrop}
              >
                <div className="pointer-events-none absolute inset-x-4 top-0 flex -translate-y-1/2 items-center justify-center">
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] shadow-sm transition-colors duration-150",
                      isGridReorderEndDropTarget
                        ? "border-blue-500/50 bg-blue-500/12 text-blue-700 dark:text-blue-200"
                        : "border-border/70 bg-background/95 text-muted-foreground/80",
                    )}
                  >
                    <ArrowDownToLine className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="whitespace-nowrap">
                      {gridReorderEndDropZoneMarkerLabel}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "pointer-events-none absolute left-5 right-5 top-0 h-px -translate-y-1/2 transition-colors duration-150",
                    isGridReorderEndDropTarget
                      ? "bg-blue-500/60"
                      : "bg-border/70",
                  )}
                />
                <div className="flex max-w-full min-w-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium leading-none">
                  {gridReorderEndDropZoneMoveLabel ? (
                    <span className="max-w-full truncate opacity-80">
                      {gridReorderEndDropZoneMoveLabel}
                    </span>
                  ) : null}
                  <span className="max-w-full truncate font-semibold">
                    {gridReorderEndDropZoneLabel}
                  </span>
                </div>
              </div>
            ) : null}
            </SessionGrid>
          </>
        )}
      </div>
    </div>
  )
}
