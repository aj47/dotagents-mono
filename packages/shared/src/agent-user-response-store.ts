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
  shouldRenderSeparator: boolean;
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

export interface AgentResponseHistoryPanelToggleAccessibilityState {
  expanded: boolean;
}

export interface AgentResponseHistoryPanelState<T> {
  title: string;
  responseCount: number;
  countLabel: string;
  isExpanded: boolean;
  toggleAccessibilityLabel: string;
  toggleAccessibilityState: AgentResponseHistoryPanelToggleAccessibilityState;
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
      accessibilityRole: 'button',
      pressedOpacity: 0.78,
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
      showsVerticalScrollIndicator: true,
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
      speakButtonAccessibilityRole: 'button',
      speakButtonPressedOpacity: 0.78,
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

export interface AgentResponseHistorySpeechActionStateInput {
  isSpeaking: boolean;
  colors: AgentResponseHistoryMobileSurfaceColors['item'];
}

export interface AgentResponseHistorySpeechActionState {
  accessibilityLabel: string;
  icon: {
    name:
      | typeof AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.speakName
      | typeof AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.stopName;
    color: string;
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
  speakingIndex?: number | null;
}

export interface AgentResponseHistoryMobileRenderItem<T> extends AgentResponseHistoryRenderItem<T> {
  speechActionState: AgentResponseHistorySpeechActionState;
}

export interface AgentResponseHistoryMobileRenderState<T> {
  shouldRender: boolean;
  shouldRenderList: boolean;
  panel: AgentResponseHistoryPanelState<T>;
  items: AgentResponseHistoryMobileRenderItem<T>[];
  surface: AgentResponseHistoryMobileSurfaceRenderState['surface'];
  colors: AgentResponseHistoryMobileSurfaceRenderState['colors'];
  icons: typeof AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon;
  animation: AgentResponseHistoryMobileAnimationState;
}

type AgentResponseHistoryMobileSurface = typeof AGENT_RESPONSE_HISTORY_SURFACE_PRESENTATION.mobile;

export type AgentResponseHistoryMobileStyleSpacingToken =
  | AgentResponseHistoryMobileSurface['container']['marginHorizontal']
  | AgentResponseHistoryMobileSurface['container']['marginBottom'];

export type AgentResponseHistoryMobileStyleRadiusToken =
  AgentResponseHistoryMobileSurface['container']['borderRadius'];

export interface AgentResponseHistoryMobileStyleSlotsInput {
  renderState: Pick<AgentResponseHistoryMobileRenderState<unknown>, 'surface' | 'colors' | 'panel'>;
  spacing: Readonly<Record<AgentResponseHistoryMobileStyleSpacingToken, number>>;
  radius: Readonly<Record<AgentResponseHistoryMobileStyleRadiusToken, number>>;
}

export interface AgentResponseHistoryMobileStyleSlots {
  container: {
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    backgroundColor: string;
    overflow: AgentResponseHistoryMobileSurface['container']['overflow'];
    marginHorizontal: number;
    marginBottom: number;
  };
  header: {
    flexDirection: AgentResponseHistoryMobileSurface['header']['flexDirection'];
    alignItems: AgentResponseHistoryMobileSurface['header']['alignItems'];
    justifyContent: AgentResponseHistoryMobileSurface['header']['justifyContent'];
    paddingHorizontal: number;
    paddingVertical: number;
    borderBottomWidth: number;
    borderBottomColor: string;
    backgroundColor: string;
  };
  headerLeft: {
    flexDirection: AgentResponseHistoryMobileSurface['header']['leftFlexDirection'];
    alignItems: AgentResponseHistoryMobileSurface['header']['leftAlignItems'];
    gap: number;
  };
  headerTitle: {
    fontSize: number;
    fontWeight: AgentResponseHistoryMobileSurface['header']['titleFontWeight'];
    color: string;
  };
  badge: {
    backgroundColor: string;
    borderRadius: number;
    minWidth: number;
    height: number;
    alignItems: AgentResponseHistoryMobileSurface['badge']['alignItems'];
    justifyContent: AgentResponseHistoryMobileSurface['badge']['justifyContent'];
    paddingHorizontal: number;
  };
  badgeText: {
    fontSize: number;
    fontWeight: AgentResponseHistoryMobileSurface['badge']['fontWeight'];
    color: string;
  };
  list: {
    maxHeight: number;
  };
  responseItem: {
    paddingHorizontal: number;
    paddingVertical: number;
  };
  responseHeader: {
    flexDirection: AgentResponseHistoryMobileSurface['item']['headerFlexDirection'];
    alignItems: AgentResponseHistoryMobileSurface['item']['headerAlignItems'];
    justifyContent: AgentResponseHistoryMobileSurface['item']['headerJustifyContent'];
    marginBottom: number;
  };
  timestamp: {
    fontSize: number;
    color: string;
  };
  speakButton: {
    padding: number;
  };
  separator: {
    height: number;
    backgroundColor: string;
  };
  collapsedPreview: {
    paddingHorizontal: number;
    paddingBottom: number;
    gap: number;
    backgroundColor: string;
  };
  collapsedPreviewTimestamp: {
    fontSize: number;
    color: string;
  };
  collapsedPreviewText: {
    fontSize: number;
    lineHeight: number;
    color: string;
  };
}

export interface AgentResponseHistoryMobileStylesLike {
  container: unknown;
  header: unknown;
  headerLeft: unknown;
  headerTitle: unknown;
  badge: unknown;
  badgeText: unknown;
  list: unknown;
  responseItem: unknown;
  responseHeader: unknown;
  timestamp: unknown;
  speakButton: unknown;
  separator: unknown;
  collapsedPreview: unknown;
  collapsedPreviewTimestamp: unknown;
  collapsedPreviewText: unknown;
}

export interface AgentResponseHistoryMobilePropsPartsInput<
  T extends { id?: string | null; text: string; timestamp: number },
  TStyles extends AgentResponseHistoryMobileStylesLike = AgentResponseHistoryMobileStylesLike,
  TOnToggleCollapsed = unknown,
> {
  renderState: AgentResponseHistoryMobileRenderState<T>;
  styles: TStyles;
  onToggleCollapsed: TOnToggleCollapsed;
  onSpeakResponse: (text: string, index: number) => void;
}

export interface AgentResponseHistoryMobilePropsPartsItem<
  T extends { id?: string | null; text: string; timestamp: number },
  TStyles extends AgentResponseHistoryMobileStylesLike,
> {
  key: string;
  entry: T;
  originalIndex: number;
  shouldRenderSeparator: boolean;
  separator: {
    style: TStyles['separator'];
  } | null;
  animated: {
    isNewest: boolean;
    animation: AgentResponseHistoryMobileAnimationState;
  };
  container: {
    style: TStyles['responseItem'];
  };
  header: {
    style: TStyles['responseHeader'];
  };
  timestamp: {
    style: TStyles['timestamp'];
    text: string;
  };
  speakButton: {
    style: TStyles['speakButton'];
    onPress: () => void;
    activeOpacity: AgentResponseHistoryMobileSurface['item']['speakButtonPressedOpacity'];
    accessibilityRole: AgentResponseHistoryMobileSurface['item']['speakButtonAccessibilityRole'];
    accessibilityLabel: string;
  };
  speakIcon: {
    name: AgentResponseHistorySpeechActionState['icon']['name'];
    size: AgentResponseHistoryMobileSurface['item']['speakIconSize'];
    color: string;
  };
}

export interface AgentResponseHistoryMobilePropsParts<
  T extends { id?: string | null; text: string; timestamp: number },
  TStyles extends AgentResponseHistoryMobileStylesLike = AgentResponseHistoryMobileStylesLike,
  TOnToggleCollapsed = unknown,
> {
  shouldRender: boolean;
  container: {
    style: TStyles['container'];
  };
  header: {
    touchable: {
      style: TStyles['header'];
      onPress: TOnToggleCollapsed;
      activeOpacity: AgentResponseHistoryMobileSurface['header']['pressedOpacity'];
      accessibilityRole: AgentResponseHistoryMobileSurface['header']['accessibilityRole'];
      accessibilityLabel: string;
      accessibilityState: AgentResponseHistoryPanelToggleAccessibilityState;
    };
    left: {
      style: TStyles['headerLeft'];
    };
    icon: {
      name: typeof AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.headerName;
      size: AgentResponseHistoryMobileSurface['header']['iconSize'];
      color: string;
    };
    title: {
      style: TStyles['headerTitle'];
      text: string;
    };
    badge: {
      style: TStyles['badge'];
      text: {
        style: TStyles['badgeText'];
        value: string;
      };
    };
    toggleIcon: {
      name: AgentResponseHistoryPanelState<T>['toggleIconName'];
      size: AgentResponseHistoryMobileSurface['header']['toggleIconSize'];
      color: string;
    };
  };
  collapsedPreview: {
    style: TStyles['collapsedPreview'];
    timestamp: {
      style: TStyles['collapsedPreviewTimestamp'];
      text: string;
    };
    preview: {
      style: TStyles['collapsedPreviewText'];
      numberOfLines: AgentResponseHistoryMobileSurface['collapsedPreview']['previewNumberOfLines'];
      text: string;
    };
  } | null;
  list: {
    style: TStyles['list'];
    showsVerticalScrollIndicator: AgentResponseHistoryMobileSurface['list']['showsVerticalScrollIndicator'];
    items: Array<AgentResponseHistoryMobilePropsPartsItem<T, TStyles>>;
  } | null;
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

export function getAgentResponseHistorySpeechActionState({
  isSpeaking,
  colors,
}: AgentResponseHistorySpeechActionStateInput): AgentResponseHistorySpeechActionState {
  return {
    accessibilityLabel: getAgentResponseHistorySpeechAccessibilityLabel(isSpeaking),
    icon: {
      name: isSpeaking
        ? AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.stopName
        : AGENT_RESPONSE_HISTORY_PRESENTATION.mobileIcon.speakName,
      color: isSpeaking ? colors.activeSpeakIconColor : colors.speakIconColor,
    },
  };
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

export function createAgentResponseHistoryMobileStyleSlots({
  renderState,
  spacing,
  radius,
}: AgentResponseHistoryMobileStyleSlotsInput): AgentResponseHistoryMobileStyleSlots {
  const surface = renderState.surface;
  const colors = renderState.colors;
  const panel = renderState.panel;

  return {
    container: {
      borderRadius: radius[surface.container.borderRadius],
      borderWidth: surface.container.borderWidth,
      borderColor: colors.container.borderColor,
      backgroundColor: colors.container.backgroundColor,
      overflow: surface.container.overflow,
      marginHorizontal: spacing[surface.container.marginHorizontal],
      marginBottom: spacing[surface.container.marginBottom],
    },
    header: {
      flexDirection: surface.header.flexDirection,
      alignItems: surface.header.alignItems,
      justifyContent: surface.header.justifyContent,
      paddingHorizontal: surface.header.paddingHorizontal,
      paddingVertical: surface.header.paddingVertical,
      borderBottomWidth: panel.headerBorderBottomWidth,
      borderBottomColor: colors.header.borderBottomColor,
      backgroundColor: colors.header.backgroundColor,
    },
    headerLeft: {
      flexDirection: surface.header.leftFlexDirection,
      alignItems: surface.header.leftAlignItems,
      gap: surface.header.gap,
    },
    headerTitle: {
      fontSize: surface.header.titleFontSize,
      fontWeight: surface.header.titleFontWeight,
      color: colors.header.titleColor,
    },
    badge: {
      backgroundColor: colors.badge.backgroundColor,
      borderRadius: surface.badge.borderRadius,
      minWidth: surface.badge.minWidth,
      height: surface.badge.height,
      alignItems: surface.badge.alignItems,
      justifyContent: surface.badge.justifyContent,
      paddingHorizontal: surface.badge.paddingHorizontal,
    },
    badgeText: {
      fontSize: surface.badge.fontSize,
      fontWeight: surface.badge.fontWeight,
      color: colors.badge.textColor,
    },
    list: {
      maxHeight: surface.list.maxHeight,
    },
    responseItem: {
      paddingHorizontal: surface.item.paddingHorizontal,
      paddingVertical: surface.item.paddingVertical,
    },
    responseHeader: {
      flexDirection: surface.item.headerFlexDirection,
      alignItems: surface.item.headerAlignItems,
      justifyContent: surface.item.headerJustifyContent,
      marginBottom: surface.item.headerMarginBottom,
    },
    timestamp: {
      fontSize: surface.item.timestampFontSize,
      color: colors.item.timestampColor,
    },
    speakButton: {
      padding: surface.item.speakButtonPadding,
    },
    separator: {
      height: surface.list.separatorHeight,
      backgroundColor: colors.list.separatorColor,
    },
    collapsedPreview: {
      paddingHorizontal: surface.collapsedPreview.paddingHorizontal,
      paddingBottom: surface.collapsedPreview.paddingBottom,
      gap: surface.collapsedPreview.gap,
      backgroundColor: colors.collapsedPreview.backgroundColor,
    },
    collapsedPreviewTimestamp: {
      fontSize: surface.collapsedPreview.timestampFontSize,
      color: colors.collapsedPreview.timestampColor,
    },
    collapsedPreviewText: {
      fontSize: surface.collapsedPreview.previewFontSize,
      lineHeight: surface.collapsedPreview.previewLineHeight,
      color: colors.collapsedPreview.previewColor,
    },
  };
}

export function createAgentResponseHistoryMobilePropsParts<
  T extends { id?: string | null; text: string; timestamp: number },
  TStyles extends AgentResponseHistoryMobileStylesLike,
  TOnToggleCollapsed,
>({
  renderState,
  styles,
  onToggleCollapsed,
  onSpeakResponse,
}: AgentResponseHistoryMobilePropsPartsInput<T, TStyles, TOnToggleCollapsed>): AgentResponseHistoryMobilePropsParts<T, TStyles, TOnToggleCollapsed> {
  const surface = renderState.surface;
  const colors = renderState.colors;
  const icons = renderState.icons;
  const panel = renderState.panel;

  return {
    shouldRender: renderState.shouldRender,
    container: {
      style: styles.container,
    },
    header: {
      touchable: {
        style: styles.header,
        onPress: onToggleCollapsed,
        activeOpacity: surface.header.pressedOpacity,
        accessibilityRole: surface.header.accessibilityRole,
        accessibilityLabel: panel.toggleAccessibilityLabel,
        accessibilityState: panel.toggleAccessibilityState,
      },
      left: {
        style: styles.headerLeft,
      },
      icon: {
        name: icons.headerName,
        size: surface.header.iconSize,
        color: colors.header.iconColor,
      },
      title: {
        style: styles.headerTitle,
        text: panel.title,
      },
      badge: {
        style: styles.badge,
        text: {
          style: styles.badgeText,
          value: panel.countLabel,
        },
      },
      toggleIcon: {
        name: panel.toggleIconName,
        size: surface.header.toggleIconSize,
        color: colors.header.toggleIconColor,
      },
    },
    collapsedPreview: panel.collapsedPreview.shouldRender
      ? {
          style: styles.collapsedPreview,
          timestamp: {
            style: styles.collapsedPreviewTimestamp,
            text: panel.collapsedPreview.timestampLabel,
          },
          preview: {
            style: styles.collapsedPreviewText,
            numberOfLines: surface.collapsedPreview.previewNumberOfLines,
            text: panel.collapsedPreview.text,
          },
        }
      : null,
    list: renderState.shouldRenderList
      ? {
          style: styles.list,
          showsVerticalScrollIndicator: surface.list.showsVerticalScrollIndicator,
          items: renderState.items.map((item) => {
            const speechActionState = item.speechActionState;

            return {
              key: item.key,
              entry: item.entry,
              originalIndex: item.originalIndex,
              shouldRenderSeparator: item.shouldRenderSeparator,
              separator: item.shouldRenderSeparator
                ? {
                    style: styles.separator,
                  }
                : null,
              animated: {
                isNewest: item.isNewest,
                animation: renderState.animation,
              },
              container: {
                style: styles.responseItem,
              },
              header: {
                style: styles.responseHeader,
              },
              timestamp: {
                style: styles.timestamp,
                text: item.timestampLabel,
              },
              speakButton: {
                style: styles.speakButton,
                onPress: () => onSpeakResponse(item.entry.text, item.originalIndex),
                activeOpacity: surface.item.speakButtonPressedOpacity,
                accessibilityRole: surface.item.speakButtonAccessibilityRole,
                accessibilityLabel: speechActionState.accessibilityLabel,
              },
              speakIcon: {
                name: speechActionState.icon.name,
                size: surface.item.speakIconSize,
                color: speechActionState.icon.color,
              },
            };
          }),
        }
      : null,
  };
}

export function getAgentResponseHistoryMobileRenderState<T extends { id?: string | null; text: string; timestamp: number }>({
  responses,
  colors,
  isCollapsed,
  animateNewest,
  speakingIndex,
}: AgentResponseHistoryMobileRenderStateInput<T>): AgentResponseHistoryMobileRenderState<T> {
  const surfaceState = getAgentResponseHistoryMobileSurfaceRenderState({ colors });
  const panel = getAgentResponseHistoryPanelState(responses, {
    isCollapsed,
    animateNewest,
  });

  return {
    shouldRender: panel.responseCount > 0,
    shouldRenderList: panel.responseCount > 0 && panel.isExpanded,
    panel,
    items: panel.items.map((item) => ({
      ...item,
      speechActionState: getAgentResponseHistorySpeechActionState({
        isSpeaking: speakingIndex === item.originalIndex,
        colors: surfaceState.colors.item,
      }),
    })),
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
      shouldRenderSeparator: displayIndex > 0,
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
    toggleAccessibilityState: { expanded: isExpanded },
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
