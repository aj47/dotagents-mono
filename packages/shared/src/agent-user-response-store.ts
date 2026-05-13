import type { AgentUserResponseEvent } from './agent-progress';
import { sortAgentUserResponseEvents } from './chat-utils';
import { hexToRgba } from './colors';
import { sanitizeMessageMediaContentForPreview } from './message-display-utils';

export interface AgentUserResponseStoreState {
  responseEventsBySession: Map<string, AgentUserResponseEvent[]>;
  runOrdinalsBySession: Map<string, Map<string, number>>;
}

export interface AgentResponseHistoryRenderItem<T> {
  entry: T;
  originalIndex: number;
  displayIndex: number;
  key: string;
  isNewest: boolean;
  timestampLabel: string;
}

export interface AgentResponseHistoryRenderItemsOptions {
  animateNewest?: boolean;
}

export interface AgentResponseHistoryPanelStateInput {
  isCollapsed: boolean;
  animateNewest?: boolean;
}

export interface AgentResponseHistoryPanelCollapsedPreviewState {
  shouldRender: boolean;
  timestampLabel: string;
  text: string;
}

export interface AgentResponseHistoryPanelState<T> {
  title: string;
  responseCount: number;
  countLabel: string;
  isExpanded: boolean;
  toggleAccessibilityLabel: string;
  toggleIconName:
    | typeof AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.expandName
    | typeof AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.collapseName;
  headerBorderBottomWidth: number;
  latestResponse?: T;
  collapsedPreview: AgentResponseHistoryPanelCollapsedPreviewState;
  items: AgentResponseHistoryRenderItem<T>[];
}

export interface AppendAgentUserResponseEventParams {
  sessionId: string;
  text: string;
  runId?: number;
  timestamp?: number;
}

export const AGENT_RESPONSE_HISTORY_PRESENTATION = {
  title: 'Agent Responses',
  toggle: {
    showLabel: 'Show agent responses',
    hideLabel: 'Hide agent responses',
  },
  speech: {
    speakLabel: 'Speak this response',
    stopLabel: 'Stop speaking',
  },
  mobileIcon: {
    headerName: 'chatbubbles-outline',
    expandName: 'chevron-down',
    collapseName: 'chevron-up',
    speakName: 'volume-medium',
    stopName: 'stop-circle',
  },
  preview: {
    maxLength: 110,
    fallbackText: 'Response with media',
  },
  animation: {
    newestInitialOpacity: 0,
    visibleOpacity: 1,
    newestFadeDurationMs: 300,
  },
} as const;

export const AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION = {
  mobile: {
    container: {
      borderRadius: 'md',
      borderWidth: 1,
      borderColorToken: 'border',
      backgroundColorToken: 'muted',
      backgroundAlpha: 0.19,
      overflow: 'hidden',
      marginHorizontal: 'sm',
      marginBottom: 'sm',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      expandedBorderBottomWidth: 1,
      collapsedBorderBottomWidth: 0,
      borderColorToken: 'border',
      backgroundColorToken: 'muted',
      backgroundAlpha: 0.31,
      leftFlexDirection: 'row',
      leftAlignItems: 'center',
      gap: 8,
      iconSize: 16,
      iconColorToken: 'mutedForeground',
      toggleIconSize: 16,
      toggleIconColorToken: 'mutedForeground',
      titleFontSize: 14,
      titleFontWeight: '500',
      titleColorToken: 'foreground',
    },
    badge: {
      backgroundColorToken: 'primary',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      fontSize: 11,
      fontWeight: '600',
      textColorToken: 'primaryForeground',
    },
    list: {
      maxHeight: 300,
      separatorHeight: 1,
      separatorColorToken: 'border',
    },
    collapsedPreview: {
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 3,
      timestampFontSize: 10,
      timestampColorToken: 'mutedForeground',
      previewFontSize: 12,
      previewLineHeight: 16,
      previewColorToken: 'foreground',
      previewNumberOfLines: 2,
      backgroundColorToken: 'muted',
      backgroundAlpha: 0.19,
    },
    item: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      headerFlexDirection: 'row',
      headerAlignItems: 'center',
      headerJustifyContent: 'space-between',
      headerMarginBottom: 4,
      timestampFontSize: 11,
      timestampColorToken: 'mutedForeground',
      speakButtonPadding: 4,
      speakIconSize: 18,
      speakIconColorToken: 'mutedForeground',
      activeSpeakIconColorToken: 'primary',
    },
  },
} as const;

export type AgentResponseHistoryMobileSurfaceColorToken =
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.container.borderColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.container.backgroundColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.borderColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.backgroundColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.iconColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.toggleIconColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.titleColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.badge.backgroundColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.badge.textColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.list.separatorColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.collapsedPreview.backgroundColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.collapsedPreview.timestampColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.collapsedPreview.previewColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.item.timestampColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.item.speakIconColorToken
  | typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.item.activeSpeakIconColorToken;

export type AgentResponseHistoryMobileSurfaceColorPalette =
  Readonly<Record<AgentResponseHistoryMobileSurfaceColorToken, string>>;

export interface AgentResponseHistoryMobileSurfaceColors {
  container: {
    borderColor: string;
    backgroundColor: string;
  };
  header: {
    borderBottomColor: string;
    backgroundColor: string;
    iconColor: string;
    toggleIconColor: string;
    titleColor: string;
  };
  badge: {
    backgroundColor: string;
    textColor: string;
  };
  list: {
    separatorColor: string;
  };
  collapsedPreview: {
    backgroundColor: string;
    timestampColor: string;
    previewColor: string;
  };
  item: {
    timestampColor: string;
    speakIconColor: string;
    activeSpeakIconColor: string;
  };
}

export interface AgentResponseHistoryMobileSurfaceRenderStateInput {
  colors: AgentResponseHistoryMobileSurfaceColorPalette;
}

export interface AgentResponseHistoryMobileSurfaceRenderState {
  surface: typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile;
  colors: AgentResponseHistoryMobileSurfaceColors;
}

export interface AgentResponseHistoryMobileAnimationState {
  newestInitialOpacity: number;
  visibleOpacity: number;
  newestFadeDurationMs: number;
}

export interface AgentResponseHistoryMobileRenderStateInput<T extends { id?: string | null; text: string; timestamp: number }>
  extends AgentResponseHistoryPanelStateInput {
  responses: readonly T[];
  colors: AgentResponseHistoryMobileSurfaceColorPalette;
}

export interface AgentResponseHistoryMobileRenderState<T> {
  panel: AgentResponseHistoryPanelState<T>;
  surface: AgentResponseHistoryMobileSurfaceRenderState['surface'];
  colors: AgentResponseHistoryMobileSurfaceRenderState['colors'];
  icons: typeof AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon;
  animation: AgentResponseHistoryMobileAnimationState;
}

const NO_RUN_ORDINAL_KEY = 'no-run';

export function getAgentResponseHistoryToggleAccessibilityLabel(isCollapsed: boolean): string {
  return isCollapsed
    ? AGENT_RESPONSE_HISTORY_PRESENTATION.toggle.showLabel
    : AGENT_RESPONSE_HISTORY_PRESENTATION.toggle.hideLabel;
}

export function getAgentResponseHistorySpeechAccessibilityLabel(isSpeaking: boolean): string {
  return isSpeaking
    ? AGENT_RESPONSE_HISTORY_PRESENTATION.speech.stopLabel
    : AGENT_RESPONSE_HISTORY_PRESENTATION.speech.speakLabel;
}

export function getAgentResponseHistoryMobileIconState(): typeof AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon {
  return AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon;
}

export function getAgentResponseHistoryTitle(): string {
  return AGENT_RESPONSE_HISTORY_PRESENTATION.title;
}

export function getAgentResponseHistoryNewestFadeDurationMs(): number {
  return AGENT_RESPONSE_HISTORY_PRESENTATION.animation.newestFadeDurationMs;
}

export function getAgentResponseHistoryNewestInitialOpacity(): number {
  return AGENT_RESPONSE_HISTORY_PRESENTATION.animation.newestInitialOpacity;
}

export function getAgentResponseHistoryVisibleOpacity(): number {
  return AGENT_RESPONSE_HISTORY_PRESENTATION.animation.visibleOpacity;
}

export function getAgentResponseHistoryMobileAnimationState(): AgentResponseHistoryMobileAnimationState {
  return {
    newestInitialOpacity: getAgentResponseHistoryNewestInitialOpacity(),
    visibleOpacity: getAgentResponseHistoryVisibleOpacity(),
    newestFadeDurationMs: getAgentResponseHistoryNewestFadeDurationMs(),
  };
}

export function getAgentResponseHistoryMobileSurfaceState(): typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile {
  return AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile;
}

export function getAgentResponseHistoryMobileSurfaceColors(
  colors: AgentResponseHistoryMobileSurfaceColorPalette,
): AgentResponseHistoryMobileSurfaceColors {
  const surface = AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile;

  return {
    container: {
      borderColor: colors[surface.container.borderColorToken],
      backgroundColor: hexToRgba(
        colors[surface.container.backgroundColorToken],
        surface.container.backgroundAlpha,
      ),
    },
    header: {
      borderBottomColor: colors[surface.header.borderColorToken],
      backgroundColor: hexToRgba(
        colors[surface.header.backgroundColorToken],
        surface.header.backgroundAlpha,
      ),
      iconColor: colors[surface.header.iconColorToken],
      toggleIconColor: colors[surface.header.toggleIconColorToken],
      titleColor: colors[surface.header.titleColorToken],
    },
    badge: {
      backgroundColor: colors[surface.badge.backgroundColorToken],
      textColor: colors[surface.badge.textColorToken],
    },
    list: {
      separatorColor: colors[surface.list.separatorColorToken],
    },
    collapsedPreview: {
      backgroundColor: hexToRgba(
        colors[surface.collapsedPreview.backgroundColorToken],
        surface.collapsedPreview.backgroundAlpha,
      ),
      timestampColor: colors[surface.collapsedPreview.timestampColorToken],
      previewColor: colors[surface.collapsedPreview.previewColorToken],
    },
    item: {
      timestampColor: colors[surface.item.timestampColorToken],
      speakIconColor: colors[surface.item.speakIconColorToken],
      activeSpeakIconColor: colors[surface.item.activeSpeakIconColorToken],
    },
  };
}

export function getAgentResponseHistoryMobileSurfaceRenderState({
  colors,
}: AgentResponseHistoryMobileSurfaceRenderStateInput): AgentResponseHistoryMobileSurfaceRenderState {
  return {
    surface: getAgentResponseHistoryMobileSurfaceState(),
    colors: getAgentResponseHistoryMobileSurfaceColors(colors),
  };
}

export function getAgentResponseHistoryMobileRenderState<T extends { id?: string | null; text: string; timestamp: number }>({
  responses,
  colors,
  isCollapsed,
  animateNewest,
}: AgentResponseHistoryMobileRenderStateInput<T>): AgentResponseHistoryMobileRenderState<T> {
  const surfaceState = getAgentResponseHistoryMobileSurfaceRenderState({ colors });

  return {
    panel: getAgentResponseHistoryPanelState(responses, {
      isCollapsed,
      animateNewest,
    }),
    surface: surfaceState.surface,
    colors: surfaceState.colors,
    icons: getAgentResponseHistoryMobileIconState(),
    animation: getAgentResponseHistoryMobileAnimationState(),
  };
}

export function getLatestAgentResponseHistoryEntry<T extends { timestamp: number }>(
  responses: readonly T[],
): T | undefined {
  return responses.length > 0 ? responses[responses.length - 1] : undefined;
}

export function getAgentResponseHistoryNewestTimestamp<T extends { timestamp: number }>(
  responses: readonly T[],
): number | null {
  if (responses.length === 0) return null;
  return Math.max(...responses.map((response) => response.timestamp));
}

export function getAgentResponseHistoryRenderItems<T extends { id?: string | null; timestamp: number }>(
  responses: readonly T[],
  options: AgentResponseHistoryRenderItemsOptions = {},
): AgentResponseHistoryRenderItem<T>[] {
  const newestTimestamp = getAgentResponseHistoryNewestTimestamp(responses);
  const animateNewest = options.animateNewest === true;

  return responses
    .map((entry, originalIndex) => ({ entry, originalIndex }))
    .reverse()
    .map(({ entry, originalIndex }, displayIndex) => ({
      entry,
      originalIndex,
      displayIndex,
      key: entry.id ?? `${entry.timestamp}-${displayIndex}`,
      isNewest: animateNewest && displayIndex === 0 && entry.timestamp === newestTimestamp,
      timestampLabel: formatAgentResponseHistoryTimestamp(entry.timestamp),
    }));
}

export function getAgentResponseHistoryPanelState<T extends { id?: string | null; text: string; timestamp: number }>(
  responses: readonly T[],
  input: AgentResponseHistoryPanelStateInput,
): AgentResponseHistoryPanelState<T> {
  const latestResponse = getLatestAgentResponseHistoryEntry(responses);
  const isExpanded = !input.isCollapsed;

  return {
    title: getAgentResponseHistoryTitle(),
    responseCount: responses.length,
    countLabel: String(responses.length),
    isExpanded,
    toggleAccessibilityLabel: getAgentResponseHistoryToggleAccessibilityLabel(input.isCollapsed),
    toggleIconName: input.isCollapsed
      ? AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.expandName
      : AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.collapseName,
    headerBorderBottomWidth: input.isCollapsed
      ? AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.collapsedBorderBottomWidth
      : AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile.header.expandedBorderBottomWidth,
    latestResponse,
    collapsedPreview: {
      shouldRender: input.isCollapsed && latestResponse != null,
      timestampLabel: latestResponse ? formatAgentResponseHistoryTimestamp(latestResponse.timestamp) : '',
      text: latestResponse ? formatAgentResponseHistoryPreviewText(latestResponse.text) : '',
    },
    items: getAgentResponseHistoryRenderItems(responses, {
      animateNewest: input.animateNewest,
    }),
  };
}

export function formatAgentResponseHistoryTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatAgentResponseHistoryPreviewText(
  text: string,
  maxLength: number = AGENT_RESPONSE_HISTORY_PRESENTATION.preview.maxLength,
): string {
  const normalized = sanitizeMessageMediaContentForPreview(text).replace(/\s+/g, ' ').trim();
  if (!normalized) return AGENT_RESPONSE_HISTORY_PRESENTATION.preview.fallbackText;

  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function createAgentUserResponseStoreState(): AgentUserResponseStoreState {
  return {
    responseEventsBySession: new Map(),
    runOrdinalsBySession: new Map(),
  };
}

function getRunOrdinalKey(runId?: number): string {
  return typeof runId === 'number' ? String(runId) : NO_RUN_ORDINAL_KEY;
}

function formatResponseEventRunKey(sessionId: string, runId?: number): string {
  return `${sessionId}:${typeof runId === 'number' ? runId : NO_RUN_ORDINAL_KEY}`;
}

function getSessionRunOrdinals(
  state: AgentUserResponseStoreState,
  sessionId: string,
): Map<string, number> {
  const existingRunOrdinals = state.runOrdinalsBySession.get(sessionId);
  if (existingRunOrdinals) return existingRunOrdinals;

  const runOrdinals = new Map<string, number>();
  state.runOrdinalsBySession.set(sessionId, runOrdinals);
  return runOrdinals;
}

export function appendAgentUserResponseEvent(
  state: AgentUserResponseStoreState,
  params: AppendAgentUserResponseEventParams,
): AgentUserResponseEvent {
  const { sessionId, text, runId, timestamp = Date.now() } = params;
  const events = state.responseEventsBySession.get(sessionId) ?? [];
  const runOrdinals = getSessionRunOrdinals(state, sessionId);
  const runOrdinalKey = getRunOrdinalKey(runId);
  const ordinal = (runOrdinals.get(runOrdinalKey) ?? 0) + 1;
  runOrdinals.set(runOrdinalKey, ordinal);

  const event: AgentUserResponseEvent = {
    id: `${formatResponseEventRunKey(sessionId, runId)}:${ordinal}:${timestamp}`,
    sessionId,
    runId,
    ordinal,
    text,
    timestamp,
  };

  state.responseEventsBySession.set(sessionId, [...events, event]);
  return event;
}

export function getAgentUserResponseEventsForSession(
  state: AgentUserResponseStoreState,
  sessionId: string,
): AgentUserResponseEvent[] {
  return [...(state.responseEventsBySession.get(sessionId) ?? [])];
}

export function getAgentUserResponseEventsForRun(
  state: AgentUserResponseStoreState,
  sessionId: string,
  runId?: number,
): AgentUserResponseEvent[] {
  return sortAgentUserResponseEvents(
    getAgentUserResponseEventsForSession(state, sessionId).filter((event) => event.runId === runId),
  );
}

export function getLatestAgentUserResponseEvent(
  state: AgentUserResponseStoreState,
  sessionId: string,
  runId?: number,
): AgentUserResponseEvent | undefined {
  const events = getAgentUserResponseEventsForRun(state, sessionId, runId);
  return events[events.length - 1];
}

export function getAgentUserResponseText(
  state: AgentUserResponseStoreState,
  sessionId: string,
  runId?: number,
): string | undefined {
  return getLatestAgentUserResponseEvent(state, sessionId, runId)?.text;
}

export function getAgentUserResponseHistory(
  state: AgentUserResponseStoreState,
  sessionId: string,
  runId?: number,
): string[] {
  const events = getAgentUserResponseEventsForRun(state, sessionId, runId);
  return events.slice(0, -1).map((event) => event.text);
}

export function clearAgentUserResponseEvents(
  state: AgentUserResponseStoreState,
  sessionId: string,
): number {
  const clearedEvents = state.responseEventsBySession.get(sessionId)?.length ?? 0;
  state.responseEventsBySession.delete(sessionId);
  state.runOrdinalsBySession.delete(sessionId);
  return clearedEvents;
}
