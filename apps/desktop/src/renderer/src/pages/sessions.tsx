import React, { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { useParams, useOutletContext } from "react-router-dom"
import { tipcClient } from "@renderer/lib/tipc-client"
import { useAgentStore } from "@renderer/stores"
import {
  getResponsiveStackedTileLayoutMinimumWidth,
  SessionGrid,
  SessionTileWrapper,
  isResponsiveStackedTileLayout,
  shouldPreserveTileWidthAcrossLayoutChange,
  type SessionGridMeasurements,
  type TileLayoutMode,
} from "@renderer/components/session-grid"
import { clearPersistedSize } from "@renderer/hooks/use-resizable"
import { SIDEBAR_DIMENSIONS } from "@renderer/hooks/use-sidebar"
import { AgentProgress } from "@renderer/components/agent-progress"
import {
  MessageCircle,
  Mic,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ChevronsRight,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Grid2x2,
  Keyboard,
  Clock,
  Loader2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
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
  resetSidebar: () => void
  panelVisible: boolean
  panelWidth: number | null
}

interface SessionReorderFeedback {
  id: number
  sessionLabel: string
  position: number
  total: number
}

interface RecentNewSessionFeedback {
  id: number
  sessionIds: string[]
  latestSessionLabel: string
  count: number
}

interface RecentSingleViewRestoreFeedback {
  id: number
  sessionId: string
  announcement: string
}

type TilePressureRecoverySource = "sidebar" | "panel" | "both" | "panel-hidden"

interface RecentTilePressureRecoveryFeedback {
  id: number
  source: TilePressureRecoverySource
  announcement: string
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

function moveSessionOrderEntry(
  sessionIds: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= sessionIds.length ||
    toIndex >= sessionIds.length ||
    fromIndex === toIndex
  ) {
    return sessionIds
  }

  const nextSessionIds = [...sessionIds]
  const [movedSessionId] = nextSessionIds.splice(fromIndex, 1)

  if (!movedSessionId) {
    return sessionIds
  }

  nextSessionIds.splice(toIndex, 0, movedSessionId)
  return nextSessionIds
}

function getSessionReorderAnnouncementLabel({
  sessionLabel,
  position,
  total,
}: Pick<SessionReorderFeedback, "sessionLabel" | "position" | "total">): string {
  return `Moved ${sessionLabel} to position ${position} of ${total}`
}

function getSessionReorderChipLabel(
  position: number,
  total: number,
  options?: { compact?: boolean; veryCompact?: boolean },
): string {
  if (options?.veryCompact) {
    return `${position}/${total}`
  }

  if (options?.compact) {
    return `Moved ${position}/${total}`
  }

  return `Moved to ${position} of ${total}`
}

function getNewSessionFeedbackAnnouncementLabel({
  latestSessionLabel,
  count,
  hiddenInSingleView,
}: Pick<RecentNewSessionFeedback, "latestSessionLabel" | "count"> & {
  hiddenInSingleView?: boolean
}): string {
  const baseAnnouncement =
    count === 1
      ? `Added ${latestSessionLabel} at the end of the current tile order`
      : `Added ${count} new sessions at the end of the current tile order`

  if (!hiddenInSingleView) {
    return baseAnnouncement
  }

  return `${baseAnnouncement}. Hidden while Single view is active`
}

function getNewSessionFeedbackChipLabel(
  count: number,
  options?: { compact?: boolean; veryCompact?: boolean },
): string {
  if (count <= 1) {
    if (options?.veryCompact) return "New"
    if (options?.compact) return "1 new"
    return "New at end"
  }

  if (options?.veryCompact || options?.compact) {
    return `${count} new`
  }

  return `${count} new at end`
}

function getSingleViewRestoreAnnouncementLabel({
  sessionLabel,
  layoutLabel,
}: {
  sessionLabel?: string | null
  layoutLabel: string
}): string {
  if (!sessionLabel) {
    return `Returned to ${layoutLabel}`
  }

  return `Returned ${sessionLabel} to ${layoutLabel}`
}

function getTilePressureRecoveryAnnouncementLabel({
  source,
  sidebarStillWide,
}: {
  source: TilePressureRecoverySource
  sidebarStillWide?: boolean
}): string {
  if (source === "both") {
    return "Reset the sidebar width and floating panel size to recover room for tiled sessions"
  }

  if (source === "sidebar") {
    return "Reset the sidebar width to recover room for tiled sessions"
  }

  if (source === "panel-hidden") {
    if (sidebarStillWide) {
      return "Hid the floating panel. The sidebar is still wide, so tiled sessions may remain tight"
    }

    return "Hid the floating panel to recover room for tiled sessions"
  }

  if (sidebarStillWide) {
    return "Reset the floating panel size. The sidebar is still wide, so tiled sessions may remain tight"
  }

  return "Reset the floating panel size to recover room for tiled sessions"
}

function getTilePressureRecoveryChipLabel(
  source: TilePressureRecoverySource,
  options?: { compact?: boolean; veryCompact?: boolean },
): string {
  if (source === "both") {
    if (options?.veryCompact) return "Both"
    if (options?.compact) return "Reset both"
    return "Sidebar + panel reset"
  }

  if (source === "panel-hidden") {
    if (options?.veryCompact) {
      return "Hidden"
    }

    return "Panel hidden"
  }

  const label = source === "sidebar" ? "Sidebar" : "Panel"

  if (options?.veryCompact) {
    return label
  }

  return `${label} reset`
}

function getSingleViewNewSessionBadgeLabel(
  count: number,
  options?: { compact?: boolean; veryCompact?: boolean },
): string | null {
  if (count <= 0) return null

  if (options?.veryCompact) {
    return "New"
  }

  if (options?.compact) {
    return count === 1 ? "1 new" : `${count} new`
  }

  return count === 1 ? "1 new hidden" : `${count} new hidden`
}

function getJumpToNewestHiddenSessionActionLabel({
  targetSessionLabel,
  hiddenNewSessionCount,
}: {
  targetSessionLabel?: string | null
  hiddenNewSessionCount: number
}): string {
  const baseActionLabel =
    hiddenNewSessionCount <= 1
      ? "Show newest hidden session in Single view"
      : `Show newest of ${hiddenNewSessionCount} newly added hidden sessions in Single view`

  if (!targetSessionLabel) {
    return baseActionLabel
  }

  return `${baseActionLabel}: ${targetSessionLabel}`
}

function getSessionDragTargetPosition(
  fromIndex: number,
  targetIndex: number,
): "before" | "after" | null {
  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) {
    return null
  }

  return fromIndex < targetIndex ? "after" : "before"
}

const RECENT_SESSIONS_LIMIT = 8
const PENDING_CONTINUATION_TIMEOUT_MS = 20_000

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

const RESPONSIVE_STACKED_LAYOUT_DESCRIPTION = "Stacked to fit"
const RESPONSIVE_STACKED_LAYOUT_SHORT_LABEL = "Stacked"
const TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION =
  "Expanded for one visible session"
const TEMPORARY_SINGLE_VISIBLE_LAYOUT_SHORT_LABEL = "One visible"
const COMPACT_SESSION_HEADER_WIDTH = 760
const TIGHT_SESSION_HEADER_WIDTH = 620
const AGENT_PANEL_DEFAULT_WIDTH = 600
const SIDEBAR_TILE_PRESSURE_WIDTH = SIDEBAR_DIMENSIONS.width.default + 64
const PANEL_TILE_PRESSURE_WIDTH = AGENT_PANEL_DEFAULT_WIDTH + 64
const NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER = 96
const EARLY_TILE_PRESSURE_RECOVERY_WIDTH = 96
const TILE_LAYOUT_MODE_STORAGE_KEY = "dotagents-sessions-tile-layout-mode"
const PREVIOUS_TILE_LAYOUT_MODE_STORAGE_KEY =
  "dotagents-sessions-previous-layout-mode"
const DEFAULT_TILE_LAYOUT_MODE: TileLayoutMode = "1x2"

type RestorableTileLayoutMode = Exclude<TileLayoutMode, "1x1">
const DEFAULT_RESTORABLE_TILE_LAYOUT_MODE: RestorableTileLayoutMode = "1x2"

const STACKED_LAYOUT_RECOVERY_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Make room to compare",
    compactLabel: "Make room",
    title:
      "Compare view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to compare side by side again.",
  },
  "2x2": {
    fullLabel: "Make room for grid",
    compactLabel: "Make room",
    title:
      "Grid view stacked to fit. Widen the sessions area, narrow the sidebar, or shrink the floating panel to restore multiple columns.",
  },
}

const SIDEBAR_STACKED_LAYOUT_RECOVERY_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Narrow sidebar to compare",
    compactLabel: "Narrow sidebar",
    title:
      "Compare view stacked to fit while the sidebar is wide. Narrow or collapse the sidebar first, or shrink the floating panel, to compare side by side again.",
  },
  "2x2": {
    fullLabel: "Narrow sidebar for grid",
    compactLabel: "Narrow sidebar",
    title:
      "Grid view stacked to fit while the sidebar is wide. Narrow or collapse the sidebar first, or shrink the floating panel, to restore multiple columns.",
  },
}

const COMBINED_STACKED_LAYOUT_RECOVERY_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Shrink sidebar + panel",
    compactLabel: "Both wide",
    title:
      "Compare view stacked to fit while both the sidebar and floating panel are wide. Narrow or collapse the sidebar, shrink the floating panel, or widen the sessions area to compare side by side again.",
  },
  "2x2": {
    fullLabel: "Shrink sidebar + panel",
    compactLabel: "Both wide",
    title:
      "Grid view stacked to fit while both the sidebar and floating panel are wide. Narrow or collapse the sidebar, shrink the floating panel, or widen the sessions area to restore multiple columns.",
  },
}

const PANEL_STACKED_LAYOUT_RECOVERY_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Narrow panel to compare",
    compactLabel: "Narrow panel",
    title:
      "Compare view stacked to fit while the floating panel is wide. Shrink the floating panel first, or widen the sessions area, to compare side by side again.",
  },
  "2x2": {
    fullLabel: "Narrow panel for grid",
    compactLabel: "Narrow panel",
    title:
      "Grid view stacked to fit while the floating panel is wide. Shrink the floating panel first, or widen the sessions area, to restore multiple columns.",
  },
}

const NEAR_STACKED_LAYOUT_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Close to stacking",
    compactLabel: "Tight fit",
    title:
      "Compare view will stack if the sessions area gets a little narrower. Widen the sessions area, narrow the sidebar, or shrink the floating panel to keep sessions side by side.",
  },
  "2x2": {
    fullLabel: "Close to stacking",
    compactLabel: "Tight fit",
    title:
      "Grid view will stack if the sessions area gets a little narrower. Widen the sessions area, narrow the sidebar, or shrink the floating panel to keep multiple columns visible.",
  },
}

const COMBINED_NEAR_STACKED_LAYOUT_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Sidebar + panel crowd tiles",
    compactLabel: "Both tight",
    title:
      "Compare view is close to stacking because both the sidebar and floating panel are wide. Narrow or collapse the sidebar, shrink the floating panel, or widen the sessions area to keep sessions side by side.",
  },
  "2x2": {
    fullLabel: "Sidebar + panel crowd tiles",
    compactLabel: "Both tight",
    title:
      "Grid view is close to stacking because both the sidebar and floating panel are wide. Narrow or collapse the sidebar, shrink the floating panel, or widen the sessions area to keep multiple columns visible.",
  },
}

const PANEL_NEAR_STACKED_LAYOUT_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Panel is crowding compare",
    compactLabel: "Panel tight",
    title:
      "Compare view is close to stacking because the floating panel is wide. Shrink the floating panel first, or widen the sessions area, to keep sessions side by side.",
  },
  "2x2": {
    fullLabel: "Panel is crowding grid",
    compactLabel: "Panel tight",
    title:
      "Grid view is close to stacking because the floating panel is wide. Shrink the floating panel first, or widen the sessions area, to keep multiple columns visible.",
  },
}

const SIDEBAR_NEAR_STACKED_LAYOUT_HINTS: Record<
  RestorableTileLayoutMode,
  {
    fullLabel: string
    compactLabel: string
    title: string
  }
> = {
  "1x2": {
    fullLabel: "Sidebar is crowding compare",
    compactLabel: "Sidebar tight",
    title:
      "Compare view is close to stacking because the sidebar is wide. Narrow or collapse the sidebar first, or shrink the floating panel, to keep sessions side by side.",
  },
  "2x2": {
    fullLabel: "Sidebar is crowding grid",
    compactLabel: "Sidebar tight",
    title:
      "Grid view is close to stacking because the sidebar is wide. Narrow or collapse the sidebar first, or shrink the floating panel, to keep multiple columns visible.",
  },
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

  return `Session ${sessionId.slice(0, 8)}`
}

function getHiddenSessionCountLabel(
  hiddenSessionCount: number,
  options?: { compact?: boolean },
): string | null {
  if (hiddenSessionCount <= 0) return null
  if (options?.compact) return `${hiddenSessionCount} hidden`
  return hiddenSessionCount === 1
    ? "1 other hidden"
    : `${hiddenSessionCount} others hidden`
}

function getRestoreLayoutActionLabel(
  layoutLabel: string,
  hiddenSessionCount: number,
): string {
  if (hiddenSessionCount <= 0) return `Return to ${layoutLabel}`
  return `Return to ${layoutLabel} and show ${hiddenSessionCount} hidden ${hiddenSessionCount === 1 ? "session" : "sessions"}`
}

function getSidebarTilePressureWidth(sidebarWidth: number | null | undefined): number {
  if (typeof sidebarWidth !== "number" || !Number.isFinite(sidebarWidth)) {
    return 0
  }

  return Math.max(0, Math.round(sidebarWidth - SIDEBAR_TILE_PRESSURE_WIDTH))
}

function getPanelTilePressureWidth(panelWidth: number | null | undefined): number {
  if (typeof panelWidth !== "number" || !Number.isFinite(panelWidth)) {
    return 0
  }

  return Math.max(0, Math.round(panelWidth - PANEL_TILE_PRESSURE_WIDTH))
}

function getTilePressureBadgeLabel(
  pressureWidth: number,
  options?: { compact?: boolean },
): string | null {
  if (pressureWidth <= 0) {
    return null
  }

  return options?.compact ? `+${pressureWidth}px` : `${pressureWidth}px over`
}

function getSidebarTileComfortWidthLabel(): string {
  return `${SIDEBAR_TILE_PRESSURE_WIDTH}px`
}

function getPanelTileComfortWidthLabel(): string {
  return `${PANEL_TILE_PRESSURE_WIDTH}px`
}

function getSidebarTilePressureTitleSuffix(
  sidebarWidth: number | null | undefined,
): string {
  const sidebarTilePressureWidth = getSidebarTilePressureWidth(sidebarWidth)

  if (sidebarTilePressureWidth <= 0) {
    return ""
  }

  const sidebarTileComfortWidthLabel = getSidebarTileComfortWidthLabel()

  return ` The sidebar is currently about ${sidebarTilePressureWidth}px past the tiled-session comfort threshold. Aim for about ${sidebarTileComfortWidthLabel} wide or narrower.`
}

function getPanelTilePressureTitleSuffix(
  panelWidth: number | null | undefined,
): string {
  const panelTilePressureWidth = getPanelTilePressureWidth(panelWidth)

  if (panelTilePressureWidth <= 0) {
    return ""
  }

  const panelTileComfortWidthLabel = getPanelTileComfortWidthLabel()

  return ` The floating panel is currently about ${panelTilePressureWidth}px past the tiled-session comfort threshold. Aim for about ${panelTileComfortWidthLabel} wide or narrower.`
}

function getCombinedTilePressureWidth({
  sidebarWidth,
  panelWidth,
}: {
  sidebarWidth: number | null | undefined
  panelWidth: number | null | undefined
}): number {
  return getSidebarTilePressureWidth(sidebarWidth) + getPanelTilePressureWidth(panelWidth)
}

function getCombinedTilePressureTitleSuffix({
  sidebarWidth,
  panelWidth,
}: {
  sidebarWidth: number | null | undefined
  panelWidth: number | null | undefined
}): string {
  return `${getSidebarTilePressureTitleSuffix(sidebarWidth)}${getPanelTilePressureTitleSuffix(panelWidth)}`
}

function getResponsiveStackedWidthDeficitBadgeLabel(
  deficitWidth: number,
  options?: { compact?: boolean },
): string | null {
  if (deficitWidth <= 0) {
    return null
  }

  return options?.compact ? `Need ${deficitWidth}px` : `Need ~${deficitWidth}px`
}

function getResponsiveStackedWidthDeficitTitleSuffix(deficitWidth: number): string {
  if (deficitWidth <= 0) {
    return ""
  }

  return ` The sessions area is about ${deficitWidth}px narrower than the minimum width needed for side-by-side tiles.`
}

function getResponsiveStackedWidthHeadroomBadgeLabel(
  remainingWidth: number,
  options?: { compact?: boolean },
): string | null {
  if (remainingWidth <= 0) {
    return null
  }

  return options?.compact ? `${remainingWidth}px left` : `~${remainingWidth}px left`
}

function getResponsiveStackedWidthHeadroomTitleSuffix(remainingWidth: number): string {
  if (remainingWidth <= 0) {
    return ""
  }

  return ` The sessions area only has about ${remainingWidth}px left before compare or grid tiles stack into one column.`
}

function getVisibleTilePressureHintBadgeLabel({
  sidebarTilePressureWidth,
  panelTilePressureWidth,
  compact,
}: {
  sidebarTilePressureWidth: number
  panelTilePressureWidth: number
  compact?: boolean
}): string | null {
  if (sidebarTilePressureWidth > 0 && panelTilePressureWidth > 0) {
    return getTilePressureBadgeLabel(
      sidebarTilePressureWidth + panelTilePressureWidth,
      { compact },
    )
  }

  if (sidebarTilePressureWidth > 0) {
    return getTilePressureBadgeLabel(sidebarTilePressureWidth, { compact })
  }

  return getTilePressureBadgeLabel(panelTilePressureWidth, { compact })
}

function getAdaptiveTileLayoutDescription({
  mode,
  visibleTileCount,
  hasMeasuredSessionGridWidth,
  containerWidth,
  gap,
}: {
  mode: TileLayoutMode
  visibleTileCount: number
  hasMeasuredSessionGridWidth: boolean
  containerWidth: number
  gap: number
}): string | null {
  if (mode === "1x1") {
    return null
  }

  if (visibleTileCount === 1) {
    return TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION
  }

  if (
    hasMeasuredSessionGridWidth &&
    isResponsiveStackedTileLayout(containerWidth, gap, mode, visibleTileCount)
  ) {
    return RESPONSIVE_STACKED_LAYOUT_DESCRIPTION
  }

  return null
}

function getTileLayoutOptionTitle({
  mode,
  currentLayoutMode,
  activeLayoutDescription,
  baseTitle,
  visibleTileCount,
  hasMeasuredSessionGridWidth,
  containerWidth,
  gap,
}: {
  mode: TileLayoutMode
  currentLayoutMode: TileLayoutMode
  activeLayoutDescription: string
  baseTitle: string
  visibleTileCount: number
  hasMeasuredSessionGridWidth: boolean
  containerWidth: number
  gap: number
}): string {
  if (mode === currentLayoutMode) {
    return `Current layout: ${LAYOUT_LABELS[mode]} — ${activeLayoutDescription}`
  }

  const adaptiveLayoutDescription = getAdaptiveTileLayoutDescription({
    mode,
    visibleTileCount,
    hasMeasuredSessionGridWidth,
    containerWidth,
    gap,
  })

  if (!adaptiveLayoutDescription) {
    return baseTitle
  }

  return adaptiveLayoutDescription === TEMPORARY_SINGLE_VISIBLE_LAYOUT_DESCRIPTION
    ? `Switch to ${LAYOUT_LABELS[mode]} — expanded for one visible session`
    : `Switch to ${LAYOUT_LABELS[mode]} — stacked to fit at the current width`
}

function getSingleViewBrowseActionLabel({
  direction,
  targetSessionLabel,
  isAtBoundary,
}: {
  direction: "previous" | "next"
  targetSessionLabel: string | null
  isAtBoundary: boolean
}): string {
  if (isAtBoundary) {
    return direction === "previous"
      ? "Already showing the first session in single view"
      : "Already showing the last session in single view"
  }

  if (!targetSessionLabel) {
    return `Show ${direction} session in single view`
  }

  return `Show ${direction} session in single view: ${targetSessionLabel}`
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

const SessionProgressTile = React.memo(function SessionProgressTile({
  sessionId,
  progress,
  index,
  isCollapsed,
  isDraggable,
  isReorderInteractionActive,
  isFocused,
  isExpanded,
  isDragTarget,
  dragTargetPosition,
  isDragging,
  isNewlyAdded,
  isRestoredFromSingleView,
  showTileMaximize,
  onFocusSession,
  onDismissSession,
  onCollapsedChange,
  onMaximizeTile,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveBackward,
  onMoveForward,
  canMoveBackward,
  canMoveForward,
  setSessionRef,
}: {
  sessionId: string
  progress: AgentProgressUpdate
  index: number
  isCollapsed: boolean
  isDraggable: boolean
  isReorderInteractionActive?: boolean
  isFocused: boolean
  isExpanded: boolean
  isDragTarget: boolean
  dragTargetPosition?: "before" | "after" | null
  isDragging: boolean
  isNewlyAdded: boolean
  isRestoredFromSingleView: boolean
  showTileMaximize: boolean
  onFocusSession: (sessionId: string) => Promise<void>
  onDismissSession: (sessionId: string) => Promise<void>
  onCollapsedChange: (sessionId: string, collapsed: boolean) => void
  onMaximizeTile: (sessionId?: string) => void
  onDragStart: (sessionId: string, index: number) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
  onMoveBackward: (sessionId: string) => void
  onMoveForward: (sessionId: string) => void
  canMoveBackward: boolean
  canMoveForward: boolean
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

  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      setSessionRef(sessionId, el)
    },
    [sessionId, setSessionRef],
  )

  return (
    <div ref={handleRef}>
      <SessionTileWrapper
        sessionId={sessionId}
        index={index}
        isCollapsed={isCollapsed}
        isDraggable={isDraggable}
        isReorderInteractionActive={isReorderInteractionActive}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onMoveBackward={onMoveBackward}
        onMoveForward={onMoveForward}
        canMoveBackward={canMoveBackward}
        canMoveForward={canMoveForward}
        isDragTarget={isDragTarget}
        dragTargetPosition={dragTargetPosition}
        isDragging={isDragging}
        isNewlyAdded={isNewlyAdded}
        isRestoredFromSingleView={isRestoredFromSingleView}
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
  const {
    onOpenPastSessionsDialog,
    sidebarWidth,
    resetSidebar,
    panelVisible = false,
    panelWidth,
  } = (useOutletContext<LayoutContext>() ?? {}) as Partial<LayoutContext>
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
  const [recentReorderFeedback, setRecentReorderFeedback] =
    useState<SessionReorderFeedback | null>(null)
  const [recentNewSessionFeedback, setRecentNewSessionFeedback] =
    useState<RecentNewSessionFeedback | null>(null)
  const [recentSingleViewRestoreFeedback, setRecentSingleViewRestoreFeedback] =
    useState<RecentSingleViewRestoreFeedback | null>(null)
  const [recentTilePressureRecoveryFeedback, setRecentTilePressureRecoveryFeedback] =
    useState<RecentTilePressureRecoveryFeedback | null>(null)
  const [isResettingPanelSize, setIsResettingPanelSize] = useState(false)
  const [isHidingCrowdingPanel, setIsHidingCrowdingPanel] = useState(false)
  const [collapsedSessions, setCollapsedSessions] = useState<
    Record<string, boolean>
  >({})
  const [tileResetKey, setTileResetKey] = useState(0)
  const [tileLayoutMode, setTileLayoutMode] = useState<TileLayoutMode>(
    initialTileLayoutPreferenceRef.current.currentLayoutMode,
  )
  const [sessionGridMeasurements, setSessionGridMeasurements] = useState<
    Pick<SessionGridMeasurements, "containerWidth" | "gap">
  >({
    containerWidth: 0,
    gap: 16,
  })

  const sessionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const pendingSessionScrollRafRef = useRef<number | null>(null)
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
    ({ containerWidth, gap }: SessionGridMeasurements) => {
      setSessionGridMeasurements((previous) => {
        if (
          previous.containerWidth === containerWidth &&
          previous.gap === gap
        ) {
          return previous
        }

        return { containerWidth, gap }
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
        // Once the user is already working in a tiled layout, keep the current
        // arrangement stable and let new sessions join at the end instead of
        // reshuffling everything upward.
        if (aIndex === -1 && bIndex === -1) {
          // If multiple new sessions arrive together, keep the newest one first
          // within the appended tail so the freshest addition is closest to the
          // existing arranged tiles.
          return getLastActivityTimestamp(b[1]) - getLastActivityTimestamp(a[1])
        }
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
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

  const currentSessionOrder = useMemo(
    () =>
      sessionOrder.length > 0
        ? sessionOrder
        : allProgressEntries.map(([id]) => id),
    [allProgressEntries, sessionOrder],
  )

  // Sync session order when new sessions appear
  useEffect(() => {
    const currentIds = Array.from(agentProgressById.keys())
    const newIds = currentIds.filter((id) => !sessionOrder.includes(id))

    if (newIds.length > 0) {
      const isInitialLoad = sessionOrder.length === 0

      // On initial load, sort sessions by most recently modified first so the
      // freshest sessions appear at the top of the list.
      // After that, preserve the current tile arrangement and append brand-new
      // sessions so compare/grid layouts do not jump when work is already in progress.
      const sortedNewIds = [...newIds].sort(
        (a, b) =>
          getLastActivityTimestamp(agentProgressById.get(b)) -
          getLastActivityTimestamp(agentProgressById.get(a)),
      )

      if (!isInitialLoad) {
        const latestSessionId = sortedNewIds[0]

        if (latestSessionId) {
          setRecentNewSessionFeedback({
            id: Date.now(),
            sessionIds: sortedNewIds,
            latestSessionLabel: getSessionTileLabel(
              latestSessionId,
              agentProgressById.get(latestSessionId),
            ),
            count: sortedNewIds.length,
          })
        }
      }

      setSessionOrder((prev) => {
        const validExistingIds = prev.filter((id) => currentIds.includes(id))

        return isInitialLoad
          ? [...sortedNewIds, ...validExistingIds]
          : [...validExistingIds, ...sortedNewIds]
      })
    } else {
      // Remove sessions that no longer exist
      const validOrder = sessionOrder.filter((id) => currentIds.includes(id))
      if (validOrder.length !== sessionOrder.length) {
        setSessionOrder(validOrder)
      }
    }
  }, [agentProgressById, getLastActivityTimestamp])

  useEffect(() => {
    const currentIds = new Set(agentProgressById.keys())

    setRecentNewSessionFeedback((current) => {
      if (!current) return null

      const validRecentSessionIds = current.sessionIds.filter((id) =>
        currentIds.has(id),
      )

      if (validRecentSessionIds.length === 0) {
        return null
      }

      if (validRecentSessionIds.length === current.sessionIds.length) {
        return current
      }

      const latestSessionId = validRecentSessionIds[0]
      if (!latestSessionId) return null

      return {
        ...current,
        sessionIds: validRecentSessionIds,
        latestSessionLabel: getSessionTileLabel(
          latestSessionId,
          agentProgressById.get(latestSessionId),
        ),
        count: validRecentSessionIds.length,
      }
    })
  }, [agentProgressById])

  const captureSessionReorderFeedback = useCallback(
    (sessionId: string, nextOrder: string[]) => {
      const movedProgress = allProgressEntries.find(([id]) => id === sessionId)?.[1]
      const nextIndex = nextOrder.indexOf(sessionId)

      if (nextIndex < 0) {
        return
      }

      setRecentReorderFeedback({
        id: Date.now(),
        sessionLabel: getSessionTileLabel(sessionId, movedProgress),
        position: nextIndex + 1,
        total: nextOrder.length,
      })
    },
    [allProgressEntries],
  )

  useEffect(() => {
    if (!recentReorderFeedback) return

    const timeoutId = window.setTimeout(() => {
      setRecentReorderFeedback((current) =>
        current?.id === recentReorderFeedback.id ? null : current,
      )
    }, 2400)

    return () => window.clearTimeout(timeoutId)
  }, [recentReorderFeedback])

  useEffect(() => {
    if (!recentNewSessionFeedback) return

    const timeoutId = window.setTimeout(() => {
      setRecentNewSessionFeedback((current) =>
        current?.id === recentNewSessionFeedback.id ? null : current,
      )
    }, 4200)

    return () => window.clearTimeout(timeoutId)
  }, [recentNewSessionFeedback])

  useEffect(() => {
    if (!recentSingleViewRestoreFeedback) return

    const timeoutId = window.setTimeout(() => {
      setRecentSingleViewRestoreFeedback((current) =>
        current?.id === recentSingleViewRestoreFeedback.id ? null : current,
      )
    }, 2600)

    return () => window.clearTimeout(timeoutId)
  }, [recentSingleViewRestoreFeedback])

  useEffect(() => {
    if (!recentTilePressureRecoveryFeedback) return

    const timeoutId = window.setTimeout(() => {
      setRecentTilePressureRecoveryFeedback((current) =>
        current?.id === recentTilePressureRecoveryFeedback.id ? null : current,
      )
    }, 2800)

    return () => window.clearTimeout(timeoutId)
  }, [recentTilePressureRecoveryFeedback])

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
    setRecentReorderFeedback(null)
    setDraggedSessionId(sessionId)
  }, [])

  const handleDragOver = useCallback((targetIndex: number) => {
    setDragTargetIndex(targetIndex)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (draggedSessionId && dragTargetIndex !== null) {
      const draggedIndex = currentSessionOrder.indexOf(draggedSessionId)
      const nextOrder = moveSessionOrderEntry(
        currentSessionOrder,
        draggedIndex,
        dragTargetIndex,
      )

      if (nextOrder !== currentSessionOrder) {
        setSessionOrder(nextOrder)
        captureSessionReorderFeedback(draggedSessionId, nextOrder)
      }
    }
    setDraggedSessionId(null)
    setDragTargetIndex(null)
  }, [
    captureSessionReorderFeedback,
    currentSessionOrder,
    dragTargetIndex,
    draggedSessionId,
  ])

  const handleKeyboardReorder = useCallback(
    (sessionId: string, direction: "backward" | "forward") => {
      const currentIndex = currentSessionOrder.indexOf(sessionId)
      const targetIndex =
        direction === "backward" ? currentIndex - 1 : currentIndex + 1
      const nextOrder = moveSessionOrderEntry(
        currentSessionOrder,
        currentIndex,
        targetIndex,
      )

      if (nextOrder !== currentSessionOrder) {
        setSessionOrder(nextOrder)
        captureSessionReorderFeedback(sessionId, nextOrder)
        scrollSessionTileIntoView(sessionId)
      }
    },
    [captureSessionReorderFeedback, currentSessionOrder, scrollSessionTileIntoView],
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

  const handleSelectTileLayout = useCallback(
    (nextMode: TileLayoutMode) => {
      if (nextMode === tileLayoutMode) {
        return
      }

      const isSingleViewTransition =
        tileLayoutMode === "1x1" || nextMode === "1x1"
      const shouldPreserveWidthAcrossLayoutChange =
        shouldPreserveTileWidthAcrossLayoutChange(tileLayoutMode, nextMode)

      if (nextMode === "1x1") {
        previousLayoutModeRef.current =
          tileLayoutMode === "1x1"
            ? previousLayoutModeRef.current
            : tileLayoutMode
      } else {
        previousLayoutModeRef.current = nextMode
      }

      if (!isSingleViewTransition && !shouldPreserveWidthAcrossLayoutChange) {
        clearPersistedSize("session-tile")
        setTileResetKey((prev) => prev + 1)
      }

      persistTileLayoutPreference(nextMode, previousLayoutModeRef.current)
      setTileLayoutMode(nextMode)
    },
    [tileLayoutMode],
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
  const previousIsFocusLayoutRef = useRef(isFocusLayout)
  const previousTileLayoutModeRef = useRef(tileLayoutMode)
  const latestSingleViewSessionIdRef = useRef<string | null>(null)

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
    previousFocusableSessionIdsRef.current = focusableSessionIds
  }, [focusableSessionIds])

  useEffect(() => {
    if (!isFocusLayout || !maximizedSessionId) return

    latestSingleViewSessionIdRef.current = maximizedSessionId
  }, [isFocusLayout, maximizedSessionId])

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

  useEffect(() => {
    if (!isFocusLayout || !maximizedSessionId) return

    scrollSessionTileIntoView(maximizedSessionId)
  }, [isFocusLayout, maximizedSessionId, scrollSessionTileIntoView])

  useEffect(() => {
    const previousTileLayoutMode = previousTileLayoutModeRef.current
    previousTileLayoutModeRef.current = tileLayoutMode

    if (
      previousTileLayoutMode === tileLayoutMode ||
      previousTileLayoutMode === "1x1" ||
      tileLayoutMode === "1x1" ||
      !focusedSessionId ||
      !focusableSessionIds.includes(focusedSessionId)
    ) {
      return
    }

    scrollSessionTileIntoView(focusedSessionId)
  }, [
    focusableSessionIds,
    focusedSessionId,
    scrollSessionTileIntoView,
    tileLayoutMode,
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
  const draggedSessionIndex = draggedSessionId
    ? currentSessionOrder.indexOf(draggedSessionId)
    : -1
  const visibleTileCount =
    visibleProgressEntries.length + (hasVisiblePendingTile ? 1 : 0)
  const isTemporarySingleVisibleLayout =
    !isFocusLayout && visibleTileCount === 1
  const showTileMaximize =
    !isFocusLayout && !isTemporarySingleVisibleLayout
  const canReorderTiles = !isFocusLayout && allProgressEntries.length > 1
  const focusedLayoutSessionIndex = maximizedSessionId
    ? focusableSessionIds.indexOf(maximizedSessionId)
    : -1
  const focusableSessionCount = focusableSessionIds.length
  const showFocusLayoutHint =
    isFocusLayout && focusableSessionCount > 1 && !!maximizedSessionId
  const canBrowseFocusedSessions =
    showFocusLayoutHint && focusedLayoutSessionIndex >= 0
  const hasMeasuredSessionGridWidth = sessionGridMeasurements.containerWidth > 0
  const activeAdaptiveLayoutDescription = getAdaptiveTileLayoutDescription({
    mode: tileLayoutMode,
    visibleTileCount,
    hasMeasuredSessionGridWidth,
    containerWidth: sessionGridMeasurements.containerWidth,
    gap: sessionGridMeasurements.gap,
  })
  const isResponsiveStackedLayout =
    activeAdaptiveLayoutDescription === RESPONSIVE_STACKED_LAYOUT_DESCRIPTION
  const usesAdaptiveLayoutDescription = !!activeAdaptiveLayoutDescription
  const activeLayoutDescription =
    activeAdaptiveLayoutDescription ?? LAYOUT_DESCRIPTIONS[tileLayoutMode]
  const activeLayoutCompactDescription = isTemporarySingleVisibleLayout
    ? TEMPORARY_SINGLE_VISIBLE_LAYOUT_SHORT_LABEL
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
  const isSidebarLikelyCrowdingTiles =
    typeof sidebarWidth === "number" &&
    sidebarWidth >= SIDEBAR_TILE_PRESSURE_WIDTH
  const isPanelLikelyCrowdingTiles =
    panelVisible &&
    typeof panelWidth === "number" &&
    panelWidth >= PANEL_TILE_PRESSURE_WIDTH
  const isSidebarAndPanelLikelyCrowdingTiles =
    isSidebarLikelyCrowdingTiles && isPanelLikelyCrowdingTiles
  const sidebarTilePressureWidth = getSidebarTilePressureWidth(sidebarWidth)
  const panelTilePressureWidth = getPanelTilePressureWidth(panelWidth)
  const sessionGridLayoutChangeKey = `${sidebarWidth ?? "none"}:${panelVisible ? panelWidth ?? "auto" : "hidden"}`
  const combinedTilePressureWidth = getCombinedTilePressureWidth({
    sidebarWidth,
    panelWidth,
  })
  const responsiveStackedLayoutMinimumWidth =
    hasMeasuredSessionGridWidth && tileLayoutMode !== "1x1" && visibleTileCount > 1
      ? getResponsiveStackedTileLayoutMinimumWidth(
          sessionGridMeasurements.gap,
          visibleTileCount,
        )
      : 0
  const stackedLayoutRecoveryHint =
    isResponsiveStackedLayout && tileLayoutMode !== "1x1"
      ? isSidebarAndPanelLikelyCrowdingTiles
        ? COMBINED_STACKED_LAYOUT_RECOVERY_HINTS[tileLayoutMode]
        : isSidebarLikelyCrowdingTiles
        ? SIDEBAR_STACKED_LAYOUT_RECOVERY_HINTS[tileLayoutMode]
        : isPanelLikelyCrowdingTiles
          ? PANEL_STACKED_LAYOUT_RECOVERY_HINTS[tileLayoutMode]
        : STACKED_LAYOUT_RECOVERY_HINTS[tileLayoutMode]
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
      ? isSidebarAndPanelLikelyCrowdingTiles
        ? COMBINED_NEAR_STACKED_LAYOUT_HINTS[tileLayoutMode]
        : isSidebarLikelyCrowdingTiles
        ? SIDEBAR_NEAR_STACKED_LAYOUT_HINTS[tileLayoutMode]
        : isPanelLikelyCrowdingTiles
          ? PANEL_NEAR_STACKED_LAYOUT_HINTS[tileLayoutMode]
        : NEAR_STACKED_LAYOUT_HINTS[tileLayoutMode]
      : null
  const showStackedLayoutRecoveryHint = !!stackedLayoutRecoveryHint
  const showNearStackedLayoutHint = !!nearStackedLayoutHint
  const stackedLayoutWidthDeficit =
    showStackedLayoutRecoveryHint && responsiveStackedLayoutMinimumWidth > 0
      ? Math.max(
          0,
          responsiveStackedLayoutMinimumWidth - sessionGridMeasurements.containerWidth,
        )
      : 0
  const nearStackedLayoutWidthHeadroom =
    showNearStackedLayoutHint && responsiveStackedLayoutMinimumWidth > 0
      ? Math.max(
          0,
          sessionGridMeasurements.containerWidth - responsiveStackedLayoutMinimumWidth,
        )
      : 0
  const shouldOfferEarlyTilePressureRecovery =
    !showFocusLayoutHint &&
    isCompactSessionHeader &&
    !isVeryCompactSessionHeader &&
    visibleTileCount > 1 &&
    !showStackedLayoutRecoveryHint &&
    !showNearStackedLayoutHint
  const hasMeaningfulSidebarTilePressure =
    sidebarTilePressureWidth >= EARLY_TILE_PRESSURE_RECOVERY_WIDTH
  const hasMeaningfulPanelTilePressure =
    panelTilePressureWidth >= EARLY_TILE_PRESSURE_RECOVERY_WIDTH
  const tilePressureRecoveryUrgency = showStackedLayoutRecoveryHint
    ? "stacked"
    : showNearStackedLayoutHint
      ? "near-stacked"
      : shouldOfferEarlyTilePressureRecovery &&
          (hasMeaningfulSidebarTilePressure || hasMeaningfulPanelTilePressure)
        ? "early"
        : null
  const showSingleViewRestore = isFocusLayout && !!restoreLayoutOption
  const showCurrentLayoutChip =
    usesAdaptiveLayoutDescription &&
    !(isCompactSessionHeader && showStackedLayoutRecoveryHint)
  const showLayoutDescriptionSuffix = !isCompactSessionHeader
  const showCompactAdaptiveLayoutDescription =
    usesAdaptiveLayoutDescription &&
    isCompactSessionHeader &&
    !isVeryCompactSessionHeader
  const stackedLayoutRecoveryLabel = !showStackedLayoutRecoveryHint
    ? null
    : isVeryCompactSessionHeader
      ? "Make room"
      : isCompactSessionHeader
        ? stackedLayoutRecoveryHint.compactLabel
        : stackedLayoutRecoveryHint.fullLabel
  const stackedLayoutRecoveryTitle = !showStackedLayoutRecoveryHint || !stackedLayoutRecoveryHint
    ? null
    : `${stackedLayoutRecoveryHint.title}${getResponsiveStackedWidthDeficitTitleSuffix(
        stackedLayoutWidthDeficit,
      )}`
  const nearStackedLayoutHintLabel = !showNearStackedLayoutHint
    ? null
    : isVeryCompactSessionHeader
      ? "Tight"
      : isCompactSessionHeader
        ? nearStackedLayoutHint.compactLabel
        : nearStackedLayoutHint.fullLabel
  const nearStackedLayoutHintTitle = !showNearStackedLayoutHint || !nearStackedLayoutHint
    ? null
    : `${nearStackedLayoutHint.title}${getResponsiveStackedWidthHeadroomTitleSuffix(
        nearStackedLayoutWidthHeadroom,
      )}`
  const stackedLayoutRecoveryWidthLabel =
    !showStackedLayoutRecoveryHint || isVeryCompactSessionHeader
      ? null
      : getResponsiveStackedWidthDeficitBadgeLabel(
          stackedLayoutWidthDeficit,
          { compact: isCompactSessionHeader },
        )
  const nearStackedLayoutWidthLabel =
    !showNearStackedLayoutHint || isVeryCompactSessionHeader
      ? null
      : getResponsiveStackedWidthHeadroomBadgeLabel(
          nearStackedLayoutWidthHeadroom,
          { compact: isCompactSessionHeader },
        )
  const showCombinedSizeRecoveryAction =
    !!resetSidebar &&
    isSidebarAndPanelLikelyCrowdingTiles &&
    (showStackedLayoutRecoveryHint ||
      showNearStackedLayoutHint ||
      (tilePressureRecoveryUrgency === "early" &&
        hasMeaningfulSidebarTilePressure &&
        hasMeaningfulPanelTilePressure))
  const showTilePressureRecoveryActionBadges =
    !isVeryCompactSessionHeader &&
    (!isCompactSessionHeader ||
      (tilePressureRecoveryUrgency !== "stacked" &&
        tilePressureRecoveryUrgency !== "near-stacked"))
  const combinedSizeRecoveryActionLabel = !showCombinedSizeRecoveryAction
    ? null
    : isVeryCompactSessionHeader
      ? "Both"
      : isCompactSessionHeader
      ? "Reset both"
      : "Reset sidebar + panel"
  const combinedSizeRecoveryPressureLabel =
    !showCombinedSizeRecoveryAction || !showTilePressureRecoveryActionBadges
      ? null
      : getTilePressureBadgeLabel(combinedTilePressureWidth, {
          compact: isCompactSessionHeader,
        })
  const combinedSizeRecoveryActionTitle = !showCombinedSizeRecoveryAction
    ? null
    : `Reset the sidebar width and floating panel size to their defaults to recover room for tiled sessions.${getCombinedTilePressureTitleSuffix({
        sidebarWidth,
        panelWidth,
      })}`
  const showPanelSizeRecoveryAction =
    !showCombinedSizeRecoveryAction &&
    isPanelLikelyCrowdingTiles &&
    (showStackedLayoutRecoveryHint ||
      showNearStackedLayoutHint ||
      (tilePressureRecoveryUrgency === "early" && hasMeaningfulPanelTilePressure))
  const showSidebarSizeRecoveryAction =
    !showCombinedSizeRecoveryAction &&
    !!resetSidebar &&
    isSidebarLikelyCrowdingTiles &&
    (showStackedLayoutRecoveryHint ||
      showNearStackedLayoutHint ||
      (tilePressureRecoveryUrgency === "early" && hasMeaningfulSidebarTilePressure))
  const sidebarSizeRecoveryActionLabel = !showSidebarSizeRecoveryAction
    ? null
    : isVeryCompactSessionHeader
      ? "Sidebar"
      : isCompactSessionHeader
      ? "Reset sidebar"
      : "Reset sidebar width"
  const sidebarSizeRecoveryPressureLabel =
    !showSidebarSizeRecoveryAction || !showTilePressureRecoveryActionBadges
      ? null
      : getTilePressureBadgeLabel(sidebarTilePressureWidth, {
          compact: isCompactSessionHeader,
        })
  const sidebarSizeRecoveryActionTitle = !showSidebarSizeRecoveryAction
    ? null
    : `Reset the sidebar to the default width to recover room for tiled sessions.${getSidebarTilePressureTitleSuffix(sidebarWidth)}`
  const panelSizeRecoveryActionLabel = !showPanelSizeRecoveryAction
    ? null
    : isVeryCompactSessionHeader
      ? "Panel"
      : isCompactSessionHeader
      ? "Reset panel"
      : "Reset panel size"
  const panelSizeRecoveryPressureLabel =
    !showPanelSizeRecoveryAction || !showTilePressureRecoveryActionBadges
      ? null
      : getTilePressureBadgeLabel(panelTilePressureWidth, {
          compact: isCompactSessionHeader,
        })
  const panelSizeRecoveryActionTitle = !showPanelSizeRecoveryAction
    ? null
    : isSidebarLikelyCrowdingTiles
      ? `Reset the floating panel to the default size for the current mode. The sidebar is still wide, but this should recover some room for tiled sessions.${getPanelTilePressureTitleSuffix(panelWidth)}`
      : `Reset the floating panel to the default size for the current mode to recover room for tiled sessions.${getPanelTilePressureTitleSuffix(panelWidth)}`
  const shouldOfferUrgentHidePanelRecoveryAction =
    tilePressureRecoveryUrgency === "stacked" ||
    tilePressureRecoveryUrgency === "near-stacked"
  const showHidePanelRecoveryAction =
    !isVeryCompactSessionHeader &&
    shouldOfferUrgentHidePanelRecoveryAction &&
    panelVisible &&
    isPanelLikelyCrowdingTiles &&
    (showPanelSizeRecoveryAction || showCombinedSizeRecoveryAction)
  const hidePanelRecoveryActionLabel = !showHidePanelRecoveryAction
    ? null
    : isCompactSessionHeader
      ? "Hide"
      : "Hide panel"
  const hidePanelRecoveryActionTitle = !showHidePanelRecoveryAction
    ? null
    : isSidebarLikelyCrowdingTiles
      ? `Hide the floating panel to reclaim room immediately for tiled sessions. The sidebar is still wide, but this removes the panel entirely instead of only resetting its size.${getPanelTilePressureTitleSuffix(panelWidth)}`
      : `Hide the floating panel to reclaim room immediately for tiled sessions. Sessions continue in background and you can reopen the panel later.${getPanelTilePressureTitleSuffix(panelWidth)}`
  const isUpdatingPanelRecovery = isResettingPanelSize || isHidingCrowdingPanel
  const tilePressureRecoveryActionToneClasses =
    tilePressureRecoveryUrgency === "stacked"
      ? "border-blue-500/35 bg-background/80 text-blue-700 hover:bg-blue-500/10 dark:text-blue-300"
      : tilePressureRecoveryUrgency === "near-stacked"
        ? "border-amber-500/35 bg-background/80 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
        : "border-border/60 bg-background/80 text-foreground hover:bg-muted/40"
  const shouldPrioritizeWidthPressureHint =
    !showFocusLayoutHint &&
    isCompactSessionHeader &&
    tilePressureRecoveryUrgency !== null
  const showReorderHint =
    canReorderTiles &&
    visibleTileCount > 1 &&
    !isResponsiveStackedLayout &&
    !showNearStackedLayoutHint
  const showReorderFeedback =
    canReorderTiles && visibleTileCount > 1 && !!recentReorderFeedback
  const showNewSessionFeedback =
    !showReorderFeedback &&
    !isFocusLayout &&
    visibleTileCount > 1 &&
    !shouldPrioritizeWidthPressureHint &&
    !!recentNewSessionFeedback
  const captureTilePressureRecoveryFeedback = useCallback(
    (source: TilePressureRecoverySource) => {
      setRecentTilePressureRecoveryFeedback({
        id: Date.now(),
        source,
        announcement: getTilePressureRecoveryAnnouncementLabel({
          source,
          sidebarStillWide:
            source === "panel" || source === "panel-hidden"
              ? isSidebarLikelyCrowdingTiles
              : false,
        }),
      })
    },
    [isSidebarLikelyCrowdingTiles],
  )
  const handleRestorePreviousLayout = useCallback(() => {
    if (!isFocusLayout) return

    handleSelectTileLayout(previousLayoutModeRef.current)
  }, [handleSelectTileLayout, isFocusLayout])
  const handleResetCrowdingPanel = useCallback(async () => {
    if (isUpdatingPanelRecovery || !isPanelLikelyCrowdingTiles) return

    setIsResettingPanelSize(true)

    try {
      await tipcClient.resetPanelSizeForCurrentMode({})
      captureTilePressureRecoveryFeedback("panel")
    } catch (error) {
      console.error("Failed to reset floating panel size from tiled sessions:", error)
      toast.error("Failed to reset panel size")
    } finally {
      setIsResettingPanelSize(false)
    }
  }, [
    captureTilePressureRecoveryFeedback,
    isPanelLikelyCrowdingTiles,
    isUpdatingPanelRecovery,
  ])
  const handleHideCrowdingPanel = useCallback(async () => {
    if (isUpdatingPanelRecovery || !panelVisible || !isPanelLikelyCrowdingTiles) {
      return
    }

    setIsHidingCrowdingPanel(true)

    try {
      await tipcClient.hidePanelWindow({})
      captureTilePressureRecoveryFeedback("panel-hidden")
    } catch (error) {
      console.error("Failed to hide floating panel from tiled sessions:", error)
      toast.error("Failed to hide panel")
    } finally {
      setIsHidingCrowdingPanel(false)
    }
  }, [
    captureTilePressureRecoveryFeedback,
    isPanelLikelyCrowdingTiles,
    isUpdatingPanelRecovery,
    panelVisible,
  ])
  const handleResetCrowdingSidebarAndPanel = useCallback(async () => {
    if (
      !resetSidebar ||
      isUpdatingPanelRecovery ||
      !isSidebarAndPanelLikelyCrowdingTiles
    ) {
      return
    }

    setIsResettingPanelSize(true)

    try {
      resetSidebar()
      await tipcClient.resetPanelSizeForCurrentMode({})
      captureTilePressureRecoveryFeedback("both")
    } catch (error) {
      console.error(
        "Failed to reset sidebar and floating panel size from tiled sessions:",
        error,
      )
      toast.error("Reset the sidebar, but failed to reset panel size")
    } finally {
      setIsResettingPanelSize(false)
    }
  }, [
    isUpdatingPanelRecovery,
    isSidebarAndPanelLikelyCrowdingTiles,
    resetSidebar,
    captureTilePressureRecoveryFeedback,
  ])
  const handleResetCrowdingSidebar = useCallback(() => {
    if (!resetSidebar || !isSidebarLikelyCrowdingTiles || showCombinedSizeRecoveryAction) {
      return
    }

    resetSidebar()
    captureTilePressureRecoveryFeedback("sidebar")
  }, [
    captureTilePressureRecoveryFeedback,
    isSidebarLikelyCrowdingTiles,
    resetSidebar,
    showCombinedSizeRecoveryAction,
  ])
  const getFocusableSessionLabel = useCallback(
    (sessionId: string | null | undefined) => {
      if (!sessionId) return null

      if (pendingSessionId && sessionId === pendingSessionId) {
        return getSessionTileLabel(pendingSessionId, pendingProgress)
      }

      const sessionEntry = allProgressEntries.find(
        ([progressSessionId]) => progressSessionId === sessionId,
      )

      return getSessionTileLabel(sessionId, sessionEntry?.[1])
    },
    [allProgressEntries, pendingProgress, pendingSessionId],
  )
  const focusedLayoutSessionLabel = useMemo(() => {
    if (!showFocusLayoutHint || !maximizedSessionId) return null

    return getFocusableSessionLabel(maximizedSessionId)
  }, [getFocusableSessionLabel, maximizedSessionId, showFocusLayoutHint])

  useEffect(() => {
    const wasFocusLayout = previousIsFocusLayoutRef.current
    previousIsFocusLayoutRef.current = isFocusLayout

    if (!wasFocusLayout || isFocusLayout) return

    const restoredSessionId =
      (focusedSessionId && focusableSessionIds.includes(focusedSessionId)
        ? focusedSessionId
        : latestSingleViewSessionIdRef.current) ?? null

    if (!restoredSessionId) return

    scrollSessionTileIntoView(restoredSessionId)
    setRecentSingleViewRestoreFeedback({
      id: Date.now(),
      sessionId: restoredSessionId,
      announcement: getSingleViewRestoreAnnouncementLabel({
        sessionLabel: getFocusableSessionLabel(restoredSessionId),
        layoutLabel: LAYOUT_LABELS[tileLayoutMode],
      }),
    })
  }, [
    focusableSessionIds,
    focusedSessionId,
    getFocusableSessionLabel,
    isFocusLayout,
    scrollSessionTileIntoView,
    tileLayoutMode,
  ])

  const shouldPrioritizeSingleViewHeaderControls =
    showFocusLayoutHint && isCompactSessionHeader
  const showFocusedSessionLabel =
    !!focusedLayoutSessionLabel && !isCompactSessionHeader
  const showBrowsingSessionsLabel =
    !focusedLayoutSessionLabel && !isCompactSessionHeader
  const hiddenFocusLayoutSessionCount = showFocusLayoutHint
    ? Math.max(0, focusableSessionCount - 1)
    : 0
  const hiddenNewFocusLayoutSessionCount =
    showFocusLayoutHint && recentNewSessionFeedback
      ? recentNewSessionFeedback.sessionIds.filter(
          (sessionId) => sessionId !== maximizedSessionId,
        ).length
      : 0
  const newestHiddenFocusLayoutSessionId =
    !showFocusLayoutHint || !recentNewSessionFeedback
      ? null
      : (recentNewSessionFeedback.sessionIds.find(
          (sessionId) =>
            sessionId !== maximizedSessionId && focusableSessionIds.includes(sessionId),
        ) ?? null)
  const focusedLayoutSessionPositionLabel = !showFocusLayoutHint
    ? null
    : shouldPrioritizeSingleViewHeaderControls
      ? `${focusedLayoutSessionIndex + 1}/${focusableSessionCount}`
      : `${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}`
  const hiddenFocusLayoutSessionLabel =
    !showFocusLayoutHint ||
    isVeryCompactSessionHeader ||
    shouldPrioritizeSingleViewHeaderControls
      ? null
      : hiddenNewFocusLayoutSessionCount > 0
        ? getSingleViewNewSessionBadgeLabel(hiddenNewFocusLayoutSessionCount, {
            compact: isCompactSessionHeader,
          })
        : getHiddenSessionCountLabel(hiddenFocusLayoutSessionCount, {
            compact: isCompactSessionHeader,
          })
  const hiddenFocusLayoutSessionTitleParts: string[] = []
  if (hiddenFocusLayoutSessionCount > 0) {
    hiddenFocusLayoutSessionTitleParts.push(
      `${hiddenFocusLayoutSessionCount} other ${hiddenFocusLayoutSessionCount === 1 ? "session" : "sessions"} hidden`,
    )
  }
  if (hiddenNewFocusLayoutSessionCount > 0) {
    hiddenFocusLayoutSessionTitleParts.push(
      `${hiddenNewFocusLayoutSessionCount} newly added ${hiddenNewFocusLayoutSessionCount === 1 ? "session" : "sessions"} waiting in Single view`,
    )
  }
  const hiddenFocusLayoutSessionTitleSuffix =
    hiddenFocusLayoutSessionTitleParts.length > 0
      ? `; ${hiddenFocusLayoutSessionTitleParts.join("; ")}`
      : ""
  const restoreLayoutNewSessionTitleSuffix =
    hiddenNewFocusLayoutSessionCount > 0
      ? `, including ${hiddenNewFocusLayoutSessionCount} newly added ${hiddenNewFocusLayoutSessionCount === 1 ? "session" : "sessions"}`
      : ""
  const restoreLayoutActionLabel = restoreLayoutOption
    ? `${getRestoreLayoutActionLabel(
        LAYOUT_LABELS[restoreLayoutOption.mode],
        hiddenFocusLayoutSessionCount,
      )}${restoreLayoutNewSessionTitleSuffix}`
    : null
  const shouldCondenseSingleViewRestoreButton =
    showSingleViewRestore && isCompactSessionHeader
  const restoreLayoutButtonLabel = !showSingleViewRestore || !restoreLayoutOption
    ? null
    : shouldCondenseSingleViewRestoreButton
      ? "Back"
      : `Back to ${restoreLayoutOption.label}`
  const previousFocusedSessionId =
    focusedLayoutSessionIndex > 0
      ? (focusableSessionIds[focusedLayoutSessionIndex - 1] ?? null)
      : null
  const nextFocusedSessionId =
    focusedLayoutSessionIndex >= 0 &&
    focusedLayoutSessionIndex < focusableSessionCount - 1
      ? (focusableSessionIds[focusedLayoutSessionIndex + 1] ?? null)
      : null
  const previousFocusedSessionLabel = getFocusableSessionLabel(
    previousFocusedSessionId,
  )
  const nextFocusedSessionLabel = getFocusableSessionLabel(nextFocusedSessionId)
  const newestHiddenFocusLayoutSessionLabel = getFocusableSessionLabel(
    newestHiddenFocusLayoutSessionId,
  )
  const previousFocusedSessionActionLabel = getSingleViewBrowseActionLabel({
    direction: "previous",
    targetSessionLabel: previousFocusedSessionLabel,
    isAtBoundary: focusedLayoutSessionIndex <= 0,
  })
  const nextFocusedSessionActionLabel = getSingleViewBrowseActionLabel({
    direction: "next",
    targetSessionLabel: nextFocusedSessionLabel,
    isAtBoundary: focusedLayoutSessionIndex >= focusableSessionCount - 1,
  })
  const showJumpToNewestHiddenSessionAction =
    !!newestHiddenFocusLayoutSessionId && hiddenNewFocusLayoutSessionCount > 0
  const jumpToNewestHiddenSessionActionLabel =
    !showJumpToNewestHiddenSessionAction || !newestHiddenFocusLayoutSessionId
      ? null
      : getJumpToNewestHiddenSessionActionLabel({
          targetSessionLabel: newestHiddenFocusLayoutSessionLabel,
          hiddenNewSessionCount: hiddenNewFocusLayoutSessionCount,
        })
  const shouldCondenseLayoutSelector =
    !isVeryCompactSessionHeader &&
    (shouldPrioritizeSingleViewHeaderControls || shouldPrioritizeWidthPressureHint)
  const showLayoutButtonLabels =
    !isVeryCompactSessionHeader && !shouldCondenseLayoutSelector
  const showSelectedLayoutButtonLabel = shouldCondenseLayoutSelector
  const selectedAdaptiveLayoutButtonBadgeLabel =
    showSelectedLayoutButtonLabel && usesAdaptiveLayoutDescription
      ? activeLayoutCompactDescription
      : null
  const showSingleViewPagerLabels = !isCompactSessionHeader
  const showJumpToNewestHiddenSessionBadge =
    showJumpToNewestHiddenSessionAction && !showSingleViewPagerLabels
  const jumpToNewestHiddenSessionBadgeLabel =
    showJumpToNewestHiddenSessionBadge
      ? getSingleViewNewSessionBadgeLabel(hiddenNewFocusLayoutSessionCount, {
          compact: !isVeryCompactSessionHeader,
          veryCompact: isVeryCompactSessionHeader,
        })
      : null
  const reorderHintLabel = isVeryCompactSessionHeader
    ? null
    : isCompactSessionHeader
      ? "Grab"
      : "Grab to reorder"
  const reorderFeedbackAnnouncement = recentReorderFeedback
    ? getSessionReorderAnnouncementLabel(recentReorderFeedback)
    : null
  const reorderFeedbackLabel = !recentReorderFeedback
    ? null
    : getSessionReorderChipLabel(
        recentReorderFeedback.position,
        recentReorderFeedback.total,
        {
          compact: isCompactSessionHeader,
          veryCompact: isVeryCompactSessionHeader,
        },
      )
  const showNewSessionAnnouncement =
    !showReorderFeedback &&
    !recentTilePressureRecoveryFeedback &&
    !!recentNewSessionFeedback
  const newSessionFeedbackAnnouncement = recentNewSessionFeedback
    ? getNewSessionFeedbackAnnouncementLabel({
        ...recentNewSessionFeedback,
        hiddenInSingleView: isFocusLayout,
      })
    : null
  const newSessionFeedbackLabel = !recentNewSessionFeedback
    ? null
    : getNewSessionFeedbackChipLabel(recentNewSessionFeedback.count, {
        compact: isCompactSessionHeader,
        veryCompact: isVeryCompactSessionHeader,
      })
  const showTilePressureRecoveryFeedback =
    !showReorderFeedback && !!recentTilePressureRecoveryFeedback
  const tilePressureRecoveryFeedbackLabel = !recentTilePressureRecoveryFeedback
    ? null
    : getTilePressureRecoveryChipLabel(recentTilePressureRecoveryFeedback.source, {
        compact: isCompactSessionHeader,
        veryCompact: isVeryCompactSessionHeader,
      })

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
  const handleJumpToNewestHiddenSession = useCallback(() => {
    if (!isFocusLayout || !newestHiddenFocusLayoutSessionId) return

    setFocusedSessionId(newestHiddenFocusLayoutSessionId)
  }, [isFocusLayout, newestHiddenFocusLayoutSessionId, setFocusedSessionId])

  const hasSessions = allProgressEntries.length > 0 || hasPendingTile

  return (
    <div className="group/tile flex h-full flex-col">
      {/* Header with start buttons - outside the scroll area so its height is excluded
          when SessionGrid measures the parent to size tiles. */}
      {hasSessions && (
        <div className="bg-muted/20 flex-shrink-0 border-b px-3 py-2">
          {showReorderFeedback && reorderFeedbackAnnouncement ? (
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {reorderFeedbackAnnouncement}
            </div>
          ) : null}
          {recentSingleViewRestoreFeedback ? (
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {recentSingleViewRestoreFeedback.announcement}
            </div>
          ) : null}
          {showTilePressureRecoveryFeedback && recentTilePressureRecoveryFeedback ? (
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {recentTilePressureRecoveryFeedback.announcement}
            </div>
          ) : null}
          {showNewSessionAnnouncement && newSessionFeedbackAnnouncement ? (
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {newSessionFeedbackAnnouncement}
            </div>
          ) : null}
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
                  className="text-muted-foreground hover:text-foreground h-7 px-2"
                  title={`Clear ${inactiveSessionCount} completed sessions (conversations are saved to history)`}
                  aria-label={`Clear ${inactiveSessionCount} completed sessions`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="border-border/50 mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {showCurrentLayoutChip && (
                <div
                  className="border-border/60 bg-background/70 text-muted-foreground flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]"
                  title={`Current layout: ${LAYOUT_LABELS[tileLayoutMode]} — ${activeLayoutDescription}`}
                >
                  <activeLayoutOption.Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground/90 whitespace-nowrap font-medium">
                    {LAYOUT_LABELS[tileLayoutMode]}
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
              {showStackedLayoutRecoveryHint &&
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
                    {stackedLayoutRecoveryWidthLabel ? (
                      <span
                        data-tile-layout-stacked-width-badge
                        className="border-current/15 bg-background/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap"
                      >
                        {stackedLayoutRecoveryWidthLabel}
                      </span>
                    ) : null}
                  </div>
                )}
              {showNearStackedLayoutHint &&
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
                    {nearStackedLayoutWidthLabel ? (
                      <span
                        data-tile-layout-near-width-badge
                        className="border-current/15 bg-background/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap"
                      >
                        {nearStackedLayoutWidthLabel}
                      </span>
                    ) : null}
                  </div>
                )}
              {showCombinedSizeRecoveryAction &&
                combinedSizeRecoveryActionLabel &&
                combinedSizeRecoveryActionTitle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetCrowdingSidebarAndPanel}
                    disabled={isUpdatingPanelRecovery}
                    data-tile-pressure-combined-recovery={
                      tilePressureRecoveryUrgency ?? undefined
                    }
                    className={cn(
                      isVeryCompactSessionHeader
                        ? "h-6 gap-1 rounded-md px-1.5 text-[10px]"
                        : "h-6 gap-1 rounded-md px-2 text-[11px]",
                      tilePressureRecoveryActionToneClasses,
                    )}
                    aria-label={combinedSizeRecoveryActionTitle}
                    title={combinedSizeRecoveryActionTitle}
                  >
                    {isResettingPanelSize ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isVeryCompactSessionHeader ? (
                      <RotateCcw className="h-3 w-3 shrink-0" />
                    ) : null}
                    <span className="whitespace-nowrap">
                      {combinedSizeRecoveryActionLabel}
                    </span>
                    {combinedSizeRecoveryPressureLabel ? (
                      <span
                        data-tile-pressure-combined-badge
                        className="border-current/15 bg-background/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap"
                      >
                        {combinedSizeRecoveryPressureLabel}
                      </span>
                    ) : null}
                  </Button>
                )}
              {showSidebarSizeRecoveryAction &&
                sidebarSizeRecoveryActionLabel &&
                sidebarSizeRecoveryActionTitle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetCrowdingSidebar}
                    data-tile-pressure-sidebar-recovery={
                      tilePressureRecoveryUrgency ?? undefined
                    }
                    className={cn(
                      isVeryCompactSessionHeader
                        ? "h-6 gap-1 rounded-md px-1.5 text-[10px]"
                        : "h-6 gap-1 rounded-md px-2 text-[11px]",
                      tilePressureRecoveryActionToneClasses,
                    )}
                    aria-label={sidebarSizeRecoveryActionTitle}
                    title={sidebarSizeRecoveryActionTitle}
                  >
                    {isVeryCompactSessionHeader ? (
                      <RotateCcw className="h-3 w-3 shrink-0" />
                    ) : null}
                    <span className="whitespace-nowrap">
                      {sidebarSizeRecoveryActionLabel}
                    </span>
                    {sidebarSizeRecoveryPressureLabel ? (
                      <span
                        data-tile-pressure-sidebar-badge
                        className="border-current/15 bg-background/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap"
                      >
                        {sidebarSizeRecoveryPressureLabel}
                      </span>
                    ) : null}
                  </Button>
                )}
              {showPanelSizeRecoveryAction &&
                panelSizeRecoveryActionLabel &&
                panelSizeRecoveryActionTitle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetCrowdingPanel}
                    disabled={isUpdatingPanelRecovery}
                    data-tile-pressure-panel-recovery={
                      tilePressureRecoveryUrgency ?? undefined
                    }
                    className={cn(
                      isVeryCompactSessionHeader
                        ? "h-6 gap-1 rounded-md px-1.5 text-[10px]"
                        : "h-6 gap-1 rounded-md px-2 text-[11px]",
                      tilePressureRecoveryActionToneClasses,
                    )}
                    aria-label={panelSizeRecoveryActionTitle}
                    title={panelSizeRecoveryActionTitle}
                  >
                    {isResettingPanelSize ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isVeryCompactSessionHeader ? (
                      <RotateCcw className="h-3 w-3 shrink-0" />
                    ) : null}
                    <span className="whitespace-nowrap">
                      {panelSizeRecoveryActionLabel}
                    </span>
                    {panelSizeRecoveryPressureLabel ? (
                      <span
                        data-tile-pressure-panel-badge
                        className="border-current/15 bg-background/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap"
                      >
                        {panelSizeRecoveryPressureLabel}
                      </span>
                    ) : null}
                  </Button>
                )}
              {showHidePanelRecoveryAction && hidePanelRecoveryActionTitle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleHideCrowdingPanel}
                  disabled={isUpdatingPanelRecovery}
                  data-tile-pressure-hide-panel={tilePressureRecoveryUrgency ?? undefined}
                  className={cn(
                    "h-6 gap-1 rounded-md px-2 text-[11px]",
                    tilePressureRecoveryUrgency === "stacked"
                      ? "text-blue-700 hover:bg-blue-500/10 dark:text-blue-300"
                      : tilePressureRecoveryUrgency === "near-stacked"
                        ? "text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                  aria-label={hidePanelRecoveryActionTitle}
                  title={hidePanelRecoveryActionTitle}
                >
                  {isHidingCrowdingPanel ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Minimize2 className="h-3 w-3 shrink-0" />
                  )}
                  {hidePanelRecoveryActionLabel ? (
                    <span className="whitespace-nowrap">{hidePanelRecoveryActionLabel}</span>
                  ) : null}
                </Button>
              )}
              {showFocusLayoutHint && (
                <div
                  className={cn(
                    "border-border/60 bg-background/80 text-muted-foreground flex min-w-0 max-w-full items-center rounded-md border px-2 py-1 text-[11px]",
                    shouldPrioritizeSingleViewHeaderControls ? "gap-1" : "gap-1.5",
                  )}
                  title={
                    focusedLayoutSessionLabel
                      ? `Single view: ${focusedLayoutSessionLabel} (${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}${hiddenFocusLayoutSessionTitleSuffix})`
                      : `Single view: showing session ${focusedLayoutSessionIndex + 1} of ${focusableSessionCount}${hiddenFocusLayoutSessionTitleSuffix}`
                  }
                >
                  <span className="border-border/60 bg-muted/40 text-foreground/80 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                    {focusedLayoutSessionPositionLabel}
                  </span>
                  {hiddenFocusLayoutSessionLabel ? (
                    <span className="border-border/60 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full border border-dashed px-1.5 py-0.5 text-[10px] font-medium">
                      {hiddenFocusLayoutSessionLabel}
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
                </div>
              )}
              {showTilePressureRecoveryFeedback &&
              recentTilePressureRecoveryFeedback &&
              tilePressureRecoveryFeedbackLabel ? (
                <div
                  data-tile-pressure-recovery-feedback={
                    recentTilePressureRecoveryFeedback.source
                  }
                  className={cn(
                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex max-w-full items-center gap-1.5 rounded-md border border-dashed py-1 text-[11px]",
                    isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                  )}
                  title={recentTilePressureRecoveryFeedback.announcement}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{tilePressureRecoveryFeedbackLabel}</span>
                </div>
              ) : showNewSessionFeedback && newSessionFeedbackLabel ? (
                <div
                  className={cn(
                    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 flex max-w-full items-center gap-1.5 rounded-md border border-dashed py-1 text-[11px]",
                    isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                  )}
                  title={newSessionFeedbackAnnouncement ?? undefined}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{newSessionFeedbackLabel}</span>
                </div>
              ) : showReorderFeedback && reorderFeedbackLabel ? (
                <div
                  className={cn(
                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex max-w-full items-center gap-1.5 rounded-md border border-dashed py-1 text-[11px]",
                    isVeryCompactSessionHeader ? "px-1.5" : "px-2",
                  )}
                  title={reorderFeedbackAnnouncement ?? undefined}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{reorderFeedbackLabel}</span>
                </div>
              ) : showReorderHint ? (
                <div
                  className={cn(
                    "border-border/60 bg-background/70 text-muted-foreground flex max-w-full items-center gap-1.5 rounded-md border border-dashed py-1 text-[11px]",
                    reorderHintLabel ? "px-2" : "px-1.5",
                  )}
                  title="Grab the reorder handle on any session tile to drag the grid order, or focus it and use arrow keys to move a session."
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0" />
                  {reorderHintLabel ? (
                    <span className="whitespace-nowrap">
                      {reorderHintLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
              {showSingleViewRestore && restoreLayoutOption && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRestorePreviousLayout}
                  aria-label={
                    restoreLayoutActionLabel ??
                    `Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]}`
                  }
                  title={
                    restoreLayoutActionLabel ??
                    `Return to ${LAYOUT_LABELS[restoreLayoutOption.mode]}`
                  }
                  className={cn(
                    "border-border/60 bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground h-7 border text-[11px]",
                    restoreLayoutButtonLabel
                      ? shouldCondenseSingleViewRestoreButton
                        ? "gap-1 px-1.5"
                        : "gap-1 px-2"
                      : "px-1.5",
                  )}
                >
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                  {restoreLayoutButtonLabel ? (
                    <span>{restoreLayoutButtonLabel}</span>
                  ) : null}
                </Button>
              )}
              {canBrowseFocusedSessions && (
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
                    aria-label={previousFocusedSessionActionLabel}
                    title={previousFocusedSessionActionLabel}
                    className={cn(
                      "text-muted-foreground hover:text-foreground h-7 disabled:cursor-default disabled:opacity-40",
                      showSingleViewPagerLabels ? "gap-1 px-2 text-[11px]" : "w-7 px-0",
                    )}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {showSingleViewPagerLabels ? <span>Previous</span> : null}
                  </Button>
                  {showJumpToNewestHiddenSessionAction &&
                    jumpToNewestHiddenSessionActionLabel && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleJumpToNewestHiddenSession}
                        aria-label={jumpToNewestHiddenSessionActionLabel}
                        title={jumpToNewestHiddenSessionActionLabel}
                        data-single-view-jump-newest
                        className={cn(
                          "hover:bg-blue-500/10 text-blue-700 hover:text-blue-800 dark:text-blue-300 h-7",
                          showSingleViewPagerLabels
                            ? "gap-1 px-2 text-[11px]"
                            : jumpToNewestHiddenSessionBadgeLabel
                              ? "gap-1 px-1.5 text-[10px]"
                              : "w-7 px-0",
                        )}
                      >
                        <ChevronsRight className="h-3.5 w-3.5" />
                        {showSingleViewPagerLabels ? <span>Newest</span> : null}
                        {jumpToNewestHiddenSessionBadgeLabel ? (
                          <span className="border-current/15 bg-background/80 rounded-full border border-dashed px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap">
                            {jumpToNewestHiddenSessionBadgeLabel}
                          </span>
                        ) : null}
                      </Button>
                    )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStepFocusedSession("next")}
                    disabled={
                      focusedLayoutSessionIndex >= focusableSessionCount - 1
                    }
                    aria-label={nextFocusedSessionActionLabel}
                    title={nextFocusedSessionActionLabel}
                    className={cn(
                      "text-muted-foreground hover:text-foreground h-7 disabled:cursor-default disabled:opacity-40",
                      showSingleViewPagerLabels ? "gap-1 px-2 text-[11px]" : "w-7 px-0",
                    )}
                  >
                    {showSingleViewPagerLabels ? <span>Next</span> : null}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <div
                role="group"
                aria-label="Session tile layout"
                className="border-border/60 bg-background/80 flex items-center gap-0.5 rounded-lg border p-0.5"
              >
                {TILE_LAYOUT_OPTIONS.map(({ mode, label, title, Icon }) => {
                  const showThisLayoutButtonLabel =
                    showLayoutButtonLabels ||
                    (showSelectedLayoutButtonLabel && tileLayoutMode === mode)
                  const showSelectedAdaptiveLayoutBadge =
                    tileLayoutMode === mode &&
                    showThisLayoutButtonLabel &&
                    !!selectedAdaptiveLayoutButtonBadgeLabel
                  const showSelectedAdaptiveLayoutEmphasis =
                    tileLayoutMode === mode && showSelectedAdaptiveLayoutBadge
                  const layoutOptionTitle = getTileLayoutOptionTitle({
                    mode,
                    currentLayoutMode: tileLayoutMode,
                    activeLayoutDescription,
                    baseTitle: title,
                    visibleTileCount,
                    hasMeasuredSessionGridWidth,
                    containerWidth: sessionGridMeasurements.containerWidth,
                    gap: sessionGridMeasurements.gap,
                  })

                  return (
                    <Button
                      key={mode}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectTileLayout(mode)}
                      aria-label={layoutOptionTitle}
                      data-session-layout-selected-adaptive={
                        showSelectedAdaptiveLayoutEmphasis ? mode : undefined
                      }
                      aria-pressed={tileLayoutMode === mode}
                      title={layoutOptionTitle}
                      className={cn(
                        "text-muted-foreground hover:text-foreground h-7 text-[11px] transition-[background-color,color,box-shadow]",
                        showThisLayoutButtonLabel ? "gap-1 px-2" : "px-1.5",
                        tileLayoutMode === mode &&
                          (showSelectedAdaptiveLayoutEmphasis
                            ? "bg-blue-500/10 text-blue-700 hover:bg-blue-500/12 shadow-sm ring-1 ring-inset ring-blue-500/35 dark:text-blue-200"
                            : "bg-accent text-foreground hover:bg-accent shadow-sm"),
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {showThisLayoutButtonLabel ? <span>{label}</span> : null}
                      {showSelectedAdaptiveLayoutBadge ? (
                        <span
                          data-session-layout-adaptive-badge={mode}
                          className="border-current/15 bg-background/80 text-foreground/80 rounded-full border border-dashed px-1.5 py-0.5 text-[9px] leading-none font-medium whitespace-nowrap"
                        >
                          {selectedAdaptiveLayoutButtonBadgeLabel}
                        </span>
                      ) : null}
                    </Button>
                  )
                })}
              </div>
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
          <SessionGrid
            sessionCount={visibleTileCount}
            resetKey={tileResetKey}
            layoutMode={tileLayoutMode}
            layoutChangeKey={sessionGridLayoutChangeKey}
            onMeasurementsChange={handleSessionGridMeasurementsChange}
          >
            {/* Pending continuation tile first */}
            {showPendingProgressTile && pendingSessionId && pendingProgress && (
              <div ref={(el) => setSessionRef(pendingSessionId, el)}>
                <SessionTileWrapper
                  key={pendingSessionId}
                  sessionId={pendingSessionId}
                  index={0}
                  isCollapsed={collapsedSessions[pendingSessionId] ?? false}
                  isDraggable={false}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDragEnd={() => {}}
                  isDragTarget={false}
                  isDragging={false}
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
              </div>
            )}
            {showPendingLoadingTile && pendingSessionId && (
              <div ref={(el) => setSessionRef(pendingSessionId, el)}>
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
              </div>
            )}
            {/* Regular sessions */}
            {visibleProgressEntries.map(([sessionId, progress], index) => {
              const isCollapsed = collapsedSessions[sessionId] ?? false
              const isSessionFocused =
                focusedSessionId === sessionId ||
                (isFocusLayout && maximizedSessionId === sessionId)
              return (
                <SessionProgressTile
                  key={sessionId}
                  sessionId={sessionId}
                  progress={progress}
                  index={index}
                  isCollapsed={isCollapsed}
                  isDraggable={canReorderTiles}
                  isReorderInteractionActive={canReorderTiles && draggedSessionId !== null}
                  isFocused={isSessionFocused}
                  isExpanded={isFocusLayout}
                  isDragTarget={
                    canReorderTiles &&
                    dragTargetIndex === index &&
                    draggedSessionId !== sessionId
                  }
                  dragTargetPosition={
                    canReorderTiles &&
                    dragTargetIndex === index &&
                    draggedSessionId !== sessionId
                      ? getSessionDragTargetPosition(draggedSessionIndex, index)
                      : null
                  }
                  isDragging={canReorderTiles && draggedSessionId === sessionId}
                  isNewlyAdded={recentNewSessionFeedback?.sessionIds.includes(sessionId) ?? false}
                  isRestoredFromSingleView={
                    recentSingleViewRestoreFeedback?.sessionId === sessionId
                  }
                  showTileMaximize={showTileMaximize}
                  onFocusSession={handleFocusSession}
                  onDismissSession={handleDismissSession}
                  onCollapsedChange={handleCollapsedChange}
                  onMaximizeTile={handleMaximizeTile}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onMoveBackward={(sessionId) =>
                    handleKeyboardReorder(sessionId, "backward")
                  }
                  onMoveForward={(sessionId) =>
                    handleKeyboardReorder(sessionId, "forward")
                  }
                  canMoveBackward={index > 0}
                  canMoveForward={index < visibleProgressEntries.length - 1}
                  setSessionRef={setSessionRef}
                />
              )
            })}
          </SessionGrid>
        )}
      </div>
    </div>
  )
}
