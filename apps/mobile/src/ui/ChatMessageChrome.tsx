import { Fragment, type ComponentProps, type ReactNode, type Ref } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type ImageStyle,
  type Insets,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getChatMessageActionLayoutState,
  type ChatMessageActionLayoutStateInput,
  type ChatMessageActionSlot,
} from '@dotagents/shared/message-display-utils';
import type {
  AgentDelegationConversationPreviewRow,
  AgentDelegationPresentation,
} from '@dotagents/shared/agent-progress';
import type { ChatImageAttachmentMobileRenderState } from '@dotagents/shared/conversation-media-assets';
import type { HandsFreeComposerControlState } from '@dotagents/shared/hands-free-controller';
import {
  getPromptLibraryEditorDismissActionState,
  getPromptLibraryEditorSaveActionState,
  getPromptLibraryEditorTitle,
  getPromptLibraryMobileShortcutEmptyRenderState,
  getPromptLibraryMobileShortcutItemRenderState,
  type PromptLibraryEditorMobileRenderState,
  type PromptLibraryLauncherShortcutSource,
  type PromptLibraryMobileShortcutRenderState,
  type PromptLibraryShortcutItem,
  type PromptLibraryTaskLike,
} from '@dotagents/shared/predefined-prompts';
import type { PredefinedPromptSummary } from '@dotagents/shared/api-types';
import type { ToolActivityGroupMobileRenderState } from '@dotagents/shared/tool-activity-grouping';
import type {
  ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots,
  ChatRuntimeDelegationMorePreviewActionState,
  ChatRuntimeAgentSelectorMobileRenderState,
  ChatRuntimeBackMobileRenderState,
  ChatRuntimeConnectionBannerMobileRenderState,
  ChatRuntimeHandsFreeMobileRenderState,
  ChatRuntimeKillSwitchMobileRenderState,
  ChatRuntimeMessageHistoryBannerMobileRenderState,
  ChatRuntimePinMobileRenderState,
  ChatRuntimeScrollToBottomMobileRenderState,
  ChatRuntimeStepSummaryMobileRenderState,
  ChatRuntimeToolApprovalMobileRenderState,
  ChatRuntimeTurnDurationHeaderMobileRenderState,
  ChatRuntimeDelegationCardMobileRenderState,
  ChatRuntimeDebugPanelsMobileRenderState,
  ChatRuntimeInlineActivityMobileRenderState,
  ChatRuntimeLoadingStateMobileRenderState,
  ChatSessionStatusMobileRenderState,
  ChatSessionStatusMobileStyleState,
} from '@dotagents/shared/session-presentation';
import type {
  ToolExecutionCompactMobileRenderState,
  ToolExecutionDetailMobileCollapseControlRenderState,
  ToolExecutionDetailMobileCopyButtonRenderState,
  ToolExecutionDetailMobileEmptyStateRenderState,
  ToolExecutionDetailMobileExpandControlRenderState,
  ToolExecutionDetailMobileHeaderRenderState,
  ToolExecutionDetailMobilePendingResultRenderState,
  ToolExecutionDetailMobileSectionHeaderRenderState,
} from '@dotagents/shared/tool-execution-display';
import { AgentSelectorSheet } from './AgentSelectorSheet';
import { HandsFreeStatusChip } from './HandsFreeStatusChip';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageQueuePanel } from './MessageQueuePanel';
import { ResponseHistoryPanel } from './ResponseHistoryPanel';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ChatComposerTextEntryRef = TextInput;
export type ChatComposerTextEntryKeyPressEvent = Parameters<NonNullable<ComponentProps<typeof TextInput>['onKeyPress']>>[0];
export type ChatMessageScrollViewportRef = ScrollView;
export type ChatMessageScrollEvent = Parameters<NonNullable<ComponentProps<typeof ScrollView>['onScroll']>>[0];

type ChatMessageActionIcon = {
  name: IoniconName;
  size: number;
  color: string;
  isPending?: boolean;
};

type ChatMessageActionIconButtonProps = {
  icon: ChatMessageActionIcon;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  isActive?: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  ariaExpanded?: boolean;
  hitSlop?: number | Insets;
  style: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disabledStyle?: StyleProp<ViewStyle>;
};

type ChatMessageActionButtonRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string | null;
  accessibilityState?: AccessibilityState;
  ariaExpanded?: boolean;
  isDisabled?: boolean;
  icon: ChatMessageActionIcon;
};

type ChatMessageActionButtonSpec = {
  canRender: boolean;
  renderState: ChatMessageActionButtonRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  hitSlop?: number | Insets;
  style: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  disabledStyle?: StyleProp<ViewStyle>;
  isActive?: boolean;
};

type ChatMessageTurnDurationActionSpec = ChatMessageTurnDurationBadgeProps & {
  canRender: boolean;
};

type ChatMessageActionComponentsInput = {
  turnDuration: ChatMessageTurnDurationActionSpec;
  speech: ChatMessageActionButtonSpec;
  branch: ChatMessageActionButtonSpec;
  copy: ChatMessageActionButtonSpec;
  expansion: ChatMessageActionButtonSpec;
};

type ChatMessageActionSetInput = ChatMessageActionComponentsInput & {
  contentRenderState: ChatMessageActionLayoutStateInput['renderState'];
};

type ChatMessageActionSet = {
  components: Record<ChatMessageActionSlot, ReactNode>;
  visibleSlots: ChatMessageActionSlot[];
  shouldRenderStandaloneActions: boolean;
};

type ChatMessageActionStyleSlots = {
  turnDuration: Pick<
    ChatMessageTurnDurationActionSpec,
    'style' | 'liveStyle' | 'textStyle' | 'liveTextStyle'
  >;
  speech: Pick<ChatMessageActionButtonSpec, 'style' | 'activeStyle' | 'pressedStyle'>;
  branch: Pick<ChatMessageActionButtonSpec, 'style' | 'pressedStyle' | 'disabledStyle'>;
  copy: Pick<ChatMessageActionButtonSpec, 'style' | 'activeStyle' | 'pressedStyle'>;
  expansion: Pick<ChatMessageActionButtonSpec, 'style' | 'pressedStyle'>;
};

type ChatRuntimeHeaderAgentSelectorStyles = {
  button: StyleProp<ViewStyle>;
  chip: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
};

type ChatRuntimeHeaderAgentSelectorProps = {
  renderState: ChatRuntimeAgentSelectorMobileRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  labelNumberOfLines: number;
  styles: ChatRuntimeHeaderAgentSelectorStyles;
};

type ChatRuntimeHeaderActionsRowProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
};

type ChatRuntimeHeaderIconButtonRenderState =
  | ChatRuntimeBackMobileRenderState
  | ChatRuntimePinMobileRenderState
  | ChatRuntimeKillSwitchMobileRenderState
  | ChatRuntimeHandsFreeMobileRenderState;

type ChatRuntimeHeaderIconButtonProps = {
  shouldRender?: boolean;
  renderState: ChatRuntimeHeaderIconButtonRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  style: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
  iconContainerStyle?: StyleProp<ViewStyle>;
  isActive?: boolean;
};

type ChatRuntimeHeaderConversationStatusStyles = {
  chip: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  spinner: StyleProp<ImageStyle>;
};

type ChatRuntimeHeaderConversationStatusProps = {
  renderState: ChatSessionStatusMobileRenderState;
  spinnerSource: ImageSourcePropType;
  styles: ChatRuntimeHeaderConversationStatusStyles;
};

type ChatRuntimeHeaderTurnDurationStyles = {
  chip: StyleProp<ViewStyle>;
  liveChip: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  liveText: StyleProp<TextStyle>;
};

type ChatRuntimeHeaderTurnDurationProps = {
  renderState: ChatRuntimeTurnDurationHeaderMobileRenderState;
  styles: ChatRuntimeHeaderTurnDurationStyles;
};

type ChatRuntimeHeaderStyleSlots = {
  actionsRowStyle: ChatRuntimeHeaderActionsRowProps['style'];
  agentSelector: ChatRuntimeHeaderAgentSelectorStyles;
  conversationStatus: ChatRuntimeHeaderConversationStatusStyles;
  turnDuration: ChatRuntimeHeaderTurnDurationStyles;
  iconButtons: {
    edgeStyle: ChatRuntimeHeaderIconButtonProps['style'];
    pinStyle: ChatRuntimeHeaderIconButtonProps['style'];
    pinActiveStyle: ChatRuntimeHeaderIconButtonProps['activeStyle'];
    actionStyle: ChatRuntimeHeaderIconButtonProps['style'];
    killSwitchIconContainerStyle: ChatRuntimeHeaderIconButtonProps['iconContainerStyle'];
    handsFreeIconContainerStyle: ChatRuntimeHeaderIconButtonProps['iconContainerStyle'];
  };
};

type ChatRuntimeNavigationHeaderOptionsInput = {
  agentSelector: Pick<
    ChatRuntimeHeaderAgentSelectorProps,
    'renderState' | 'onPress' | 'labelNumberOfLines'
  >;
  backButton: Pick<ChatRuntimeHeaderIconButtonProps, 'renderState' | 'onPress'>;
  pinButton: Pick<
    ChatRuntimeHeaderIconButtonProps,
    'renderState' | 'onPress' | 'isActive'
  >;
  conversationStatus: Pick<
    ChatRuntimeHeaderConversationStatusProps,
    'renderState' | 'spinnerSource'
  >;
  turnDuration: Pick<ChatRuntimeHeaderTurnDurationProps, 'renderState'>;
  killSwitchButton: Pick<
    ChatRuntimeHeaderIconButtonProps,
    'shouldRender' | 'renderState' | 'onPress'
  >;
  handsFreeButton: Pick<ChatRuntimeHeaderIconButtonProps, 'renderState' | 'onPress'>;
  styles: ChatRuntimeHeaderStyleSlots;
};

type ChatRuntimeNavigationHeaderOptions = {
  headerTitle: () => ReactNode;
  headerLeft: () => ReactNode;
  headerRight: () => ReactNode;
};

export type ChatConversationHomeQuickStartSource = PromptLibraryLauncherShortcutSource;

export type ChatConversationHomeQuickStartItem<
  TPrompt extends PredefinedPromptSummary = PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string } = PromptLibraryTaskLike & { id: string },
> = PromptLibraryShortcutItem<TPrompt, TTask>;

type ChatConversationHomeQuickStartsStyles = {
  card: StyleProp<ViewStyle>;
  emptyText: StyleProp<TextStyle>;
  grid: StyleProp<ViewStyle>;
  shortcutCard: StyleProp<ViewStyle>;
  shortcutCardAdd: StyleProp<ViewStyle>;
  shortcutCardDisabled: StyleProp<ViewStyle>;
  shortcutCardPressed: StyleProp<ViewStyle>;
  sourcePill: StyleProp<ViewStyle>;
  sourceLabel: StyleProp<TextStyle>;
  addIcon: StyleProp<TextStyle>;
  title: StyleProp<TextStyle>;
  titleAdd: StyleProp<TextStyle>;
  description: StyleProp<TextStyle>;
  actions: StyleProp<ViewStyle>;
  actionButton: StyleProp<ViewStyle>;
  actionButtonPressed: StyleProp<ViewStyle>;
  actionText: StyleProp<TextStyle>;
  actionDangerText: StyleProp<TextStyle>;
};

type ChatConversationHomeQuickStartsProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  shouldRender: boolean;
  items: readonly ChatConversationHomeQuickStartItem<TPrompt, TTask>[];
  isLoading: boolean;
  runningTaskId?: string | null;
  onPress: (item: ChatConversationHomeQuickStartItem<TPrompt, TTask>) => void;
  onEditPrompt: (prompt: TPrompt) => void;
  onDeletePrompt: (prompt: TPrompt) => void;
  shortcutRenderState: PromptLibraryMobileShortcutRenderState;
  styles: ChatConversationHomeQuickStartsStyles;
};

type ChatConversationHomePromptEditorModalStyles = {
  keyboardAvoidingView: StyleProp<ViewStyle>;
  overlay: StyleProp<ViewStyle>;
  content: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  closeButton: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  input: StyleProp<TextStyle>;
  inputMultiline: StyleProp<TextStyle>;
  actions: StyleProp<ViewStyle>;
  cancelButton: StyleProp<ViewStyle>;
  cancelButtonText: StyleProp<TextStyle>;
  saveButton: StyleProp<ViewStyle>;
  saveButtonDisabled: StyleProp<ViewStyle>;
  saveButtonText: StyleProp<TextStyle>;
};

type ChatConversationHomePromptEditorModalProps = {
  visible: boolean;
  isEditing: boolean;
  nameValue: string;
  onNameChange: (value: string) => void;
  contentValue: string;
  onContentChange: (value: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  renderState: PromptLibraryEditorMobileRenderState;
  styles: ChatConversationHomePromptEditorModalStyles;
};

type ChatMessageRuntimeOverlaysProps = {
  agentSelector: ComponentProps<typeof AgentSelectorSheet>;
  promptEditor: ChatConversationHomePromptEditorModalProps;
};

type ChatMessageTurnDurationBadgeRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  isLive: boolean;
  label: string;
  badge: {
    numberOfLines: number;
  };
  icon: ChatMessageActionIcon;
};

type ChatMessageTurnDurationBadgeProps = {
  renderState: ChatMessageTurnDurationBadgeRenderState;
  style: StyleProp<ViewStyle>;
  liveStyle?: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  liveTextStyle?: StyleProp<TextStyle>;
};

type ChatMessageActionSlotListProps = {
  slots: readonly ChatMessageActionSlot[];
  components: Record<ChatMessageActionSlot, ReactNode>;
  rowStyle?: StyleProp<ViewStyle>;
};

type ChatMessageStandaloneActionsProps = ChatMessageActionSlotListProps & {
  shouldRender: boolean;
};

type ChatMessageRetryStatusRenderState = {
  shouldRender: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  title: string;
  attemptLabel: string;
  countdownLabel: string;
  description: string;
  icon: ChatMessageActionIcon;
  spinner: {
    size: ComponentProps<typeof ActivityIndicator>['size'];
    color: string;
  };
  surface: {
    titleNumberOfLines: number;
  };
};

type ChatMessageRetryStatusStyles = {
  card: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  metaRow: StyleProp<ViewStyle>;
  attempt: StyleProp<TextStyle>;
  countdown: StyleProp<TextStyle>;
  description: StyleProp<TextStyle>;
};

type ChatMessageRetryStatusProps = {
  renderState: ChatMessageRetryStatusRenderState;
  styles: ChatMessageRetryStatusStyles;
};

type ChatMessageToolApprovalStyles = {
  card: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  content: StyleProp<ViewStyle>;
  contentDisabled: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  toolRow: StyleProp<ViewStyle>;
  toolLabel: StyleProp<TextStyle>;
  toolName: StyleProp<TextStyle>;
  argumentsPreview: StyleProp<TextStyle>;
  argumentsToggle: StyleProp<ViewStyle>;
  argumentsTogglePressed: StyleProp<ViewStyle>;
  argumentsToggleText: StyleProp<TextStyle>;
  argumentsScroll: StyleProp<ViewStyle>;
  argumentsFull: StyleProp<TextStyle>;
  actions: StyleProp<ViewStyle>;
  button: StyleProp<ViewStyle>;
  buttonDisabled: StyleProp<ViewStyle>;
  approveButton: StyleProp<ViewStyle>;
  approveButtonText: StyleProp<TextStyle>;
  denyButton: StyleProp<ViewStyle>;
  denyButtonText: StyleProp<TextStyle>;
};

type ChatMessageToolApprovalProps = {
  renderState: ChatRuntimeToolApprovalMobileRenderState;
  toolName: string;
  argumentsPreview: string;
  argumentsContent: string;
  onToggleArguments: (event: GestureResponderEvent) => void;
  onDeny: (event: GestureResponderEvent) => void;
  onApprove: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolApprovalStyles;
};

type ChatMessageDelegationCardStyles = {
  card: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  statusBadge: StyleProp<ViewStyle>;
  statusText: StyleProp<TextStyle>;
  liveText: StyleProp<TextStyle>;
  subtitle: StyleProp<TextStyle>;
  metaRow: StyleProp<ViewStyle>;
  metaText: StyleProp<TextStyle>;
  conversationPreview: StyleProp<ViewStyle>;
  conversationPreviewLine: StyleProp<ViewStyle>;
  conversationPreviewRole: StyleProp<TextStyle>;
  conversationPreviewContent: StyleProp<TextStyle>;
  conversationPreviewTimestamp: StyleProp<TextStyle>;
  conversationPreviewMoreButton: StyleProp<ViewStyle>;
  conversationPreviewMoreButtonPressed: StyleProp<ViewStyle>;
  conversationPreviewMore: StyleProp<TextStyle>;
  toolPreview: StyleProp<ViewStyle>;
  toolPreviewLabel: StyleProp<TextStyle>;
  toolPreviewLine: StyleProp<ViewStyle>;
  toolPreviewStatusIcon: StyleProp<ViewStyle>;
  toolPreviewName: StyleProp<TextStyle>;
  toolPreviewNamePending: StyleProp<TextStyle>;
  toolPreviewNameSuccess: StyleProp<TextStyle>;
  toolPreviewNameError: StyleProp<TextStyle>;
  toolPreviewMoreButton: StyleProp<ViewStyle>;
  toolPreviewMoreButtonPressed: StyleProp<ViewStyle>;
  toolPreviewMore: StyleProp<TextStyle>;
};

type ChatMessageDelegationToolPreviewRow = {
  key: string;
  preview: string;
  renderState: ToolExecutionCompactMobileRenderState;
};

type ChatMessageDelegationCardProps = {
  surface: ChatRuntimeDelegationCardMobileRenderState['surface'];
  agentName: string;
  presentation: AgentDelegationPresentation;
  accessibilityLabel: string;
  messageCountLabel: string | null;
  statusStyles?: ChatSessionStatusMobileStyleState | null;
  conversationPreview: {
    rows: AgentDelegationConversationPreviewRow[];
    roleStyles: ChatRuntimeDelegationConversationPreviewRoleMobileStyleSlots;
    hiddenCount: number;
    moreAction: ChatRuntimeDelegationMorePreviewActionState;
    onShowAll?: (event: GestureResponderEvent) => void;
  };
  toolPreview: {
    shouldRender: boolean;
    label: string;
    rows: ChatMessageDelegationToolPreviewRow[];
    hiddenCount: number;
    moreAction: ChatRuntimeDelegationMorePreviewActionState;
    onShowAll?: (event: GestureResponderEvent) => void;
  };
  styles: ChatMessageDelegationCardStyles;
};

type ChatMessageToolActivityGroupHeaderKind = 'collapsed' | 'expanded';

type ChatMessageToolActivityGroupToggleStyles = {
  container: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
  headerRow: StyleProp<ViewStyle>;
  countBadge: StyleProp<ViewStyle>;
  countBadgeText: StyleProp<TextStyle>;
  previewLine: StyleProp<TextStyle>;
};

type ChatMessageToolActivityGroupToggleProps = {
  renderState: ToolActivityGroupMobileRenderState;
  headerKind: ChatMessageToolActivityGroupHeaderKind;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolActivityGroupToggleStyles;
};

type ChatMessageToolActivityGroupFooterStyles = {
  button: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatMessageToolActivityGroupFooterProps = {
  renderState: ToolActivityGroupMobileRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolActivityGroupFooterStyles;
};

type ChatMessageToolActivityGroupBoundaryKind = ChatMessageToolActivityGroupHeaderKind | 'footer';

type ChatMessageToolActivityGroupBoundaryStyles = {
  toggle: ChatMessageToolActivityGroupToggleStyles;
  footer: ChatMessageToolActivityGroupFooterStyles;
};

type ChatMessageToolActivityGroupBoundaryProps = {
  renderState: ToolActivityGroupMobileRenderState;
  kind: ChatMessageToolActivityGroupBoundaryKind;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolActivityGroupBoundaryStyles;
};

type ChatMessageToolExecutionCompactRowStyles = {
  line: StyleProp<ViewStyle>;
  leadingIcon: StyleProp<ViewStyle>;
  name: StyleProp<TextStyle>;
  namePending: StyleProp<TextStyle>;
  nameSuccess: StyleProp<TextStyle>;
  nameError: StyleProp<TextStyle>;
  statusIndicator: StyleProp<ViewStyle>;
  toggleIcon: StyleProp<ViewStyle>;
};

type ChatMessageToolExecutionCompactRowProps = {
  renderState: ToolExecutionCompactMobileRenderState;
  styles: ChatMessageToolExecutionCompactRowStyles;
};

type ChatMessageToolExecutionCompactListRow = {
  key: string;
  renderState: ToolExecutionCompactMobileRenderState;
};

type ChatMessageToolExecutionCompactGroupStyles = {
  container: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
};

type ChatMessageToolExecutionCompactGroupProps = {
  renderState: ToolExecutionDetailMobileExpandControlRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionCompactGroupStyles;
  children: ReactNode;
};

type ChatMessageToolExecutionCompactListProps = {
  shouldRender: boolean;
  renderState: ToolExecutionDetailMobileExpandControlRenderState;
  rows: readonly ChatMessageToolExecutionCompactListRow[];
  onPress?: (event: GestureResponderEvent) => void;
  groupStyles: ChatMessageToolExecutionCompactGroupStyles;
  rowStyles: ChatMessageToolExecutionCompactRowStyles;
};

type ChatMessageToolExecutionCollapseControlStyles = {
  button: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
  placement?: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionCollapseControlProps = {
  renderState: ToolExecutionDetailMobileCollapseControlRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionCollapseControlStyles;
};

type ChatMessageToolExecutionExpandedGroupStyles = {
  container: StyleProp<ViewStyle>;
  card: StyleProp<ViewStyle>;
  pending: StyleProp<ViewStyle>;
  success: StyleProp<ViewStyle>;
  error: StyleProp<ViewStyle>;
  collapseButton: StyleProp<ViewStyle>;
  collapsePressed: StyleProp<ViewStyle>;
  collapseTopPlacement: StyleProp<ViewStyle>;
  collapseBottomPlacement: StyleProp<ViewStyle>;
  collapseText: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionExpandedGroupProps = {
  topCollapseRenderState: ToolExecutionDetailMobileCollapseControlRenderState;
  bottomCollapseRenderState: ToolExecutionDetailMobileCollapseControlRenderState;
  onCollapsePress?: (event: GestureResponderEvent) => void;
  isPending: boolean;
  allSuccess: boolean;
  hasErrors: boolean;
  emptyState?: ReactNode;
  styles: ChatMessageToolExecutionExpandedGroupStyles;
  children: ReactNode;
};

type ChatMessageToolExecutionPanelProps = {
  shouldRender: boolean;
  isExpanded: boolean;
  compact: Omit<ChatMessageToolExecutionCompactListProps, 'shouldRender'>;
  expanded: Omit<ChatMessageToolExecutionExpandedGroupProps, 'children'>;
  children: ReactNode;
};

type ChatMessageToolExecutionStackStyles = {
  compactGroup: ChatMessageToolExecutionCompactGroupStyles;
  compactRow: ChatMessageToolExecutionCompactRowStyles;
  expandedGroup: ChatMessageToolExecutionExpandedGroupStyles;
  emptyStateText: StyleProp<TextStyle>;
  callDetail: ChatMessageToolExecutionCallDetailStyles;
};

type ChatMessageToolExecutionStackProps = {
  shouldRender: boolean;
  isExpanded: boolean;
  compact: Omit<ChatMessageToolExecutionCompactListProps, 'shouldRender' | 'groupStyles' | 'rowStyles'>;
  expanded: Omit<ChatMessageToolExecutionExpandedGroupProps, 'children' | 'emptyState' | 'styles'> & {
    emptyState?: {
      shouldRender: boolean;
      renderState: ToolExecutionDetailMobileEmptyStateRenderState;
    } | null;
  };
  detailRows: readonly ChatMessageToolExecutionCallListRow[];
  styles: ChatMessageToolExecutionStackStyles;
};

type ChatMessageToolExecutionCopyButtonStyles = {
  button: StyleProp<ViewStyle>;
  pressed: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionCopyButtonProps = {
  renderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionCopyButtonStyles;
};

type ChatMessageToolExecutionDetailHeaderStyles = {
  header: StyleProp<ViewStyle>;
  headerPressed: StyleProp<ViewStyle>;
  toolName: StyleProp<TextStyle>;
  expandHint: StyleProp<ViewStyle>;
  expandHintText: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionDetailHeaderProps = {
  renderState: ToolExecutionDetailMobileHeaderRenderState;
  toolName: string;
  onPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionDetailHeaderStyles;
};

type ChatMessageToolExecutionCallSectionStyles = {
  section: StyleProp<ViewStyle>;
  header: ChatMessageToolExecutionDetailHeaderStyles;
};

type ChatMessageToolExecutionCallSectionProps = {
  renderState: ToolExecutionDetailMobileHeaderRenderState;
  toolName: string;
  onHeaderPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionCallSectionStyles;
  children: ReactNode;
};

type ChatMessageToolExecutionResultBadgeStyles = {
  badge: StyleProp<ViewStyle>;
  badgeSuccess: StyleProp<ViewStyle>;
  badgeError: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  textSuccess: StyleProp<TextStyle>;
  textError: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionResultBadgeProps = {
  badge: ToolExecutionDetailMobileHeaderRenderState['resultBadge'];
  styles: ChatMessageToolExecutionResultBadgeStyles;
};

type ChatMessageToolExecutionPendingResultStyles = {
  row: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionPendingResultProps = {
  renderState: ToolExecutionDetailMobilePendingResultRenderState;
  styles: ChatMessageToolExecutionPendingResultStyles;
};

type ChatMessageToolExecutionEmptyStateProps = {
  renderState: ToolExecutionDetailMobileEmptyStateRenderState;
  style: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionPayloadMetaStyles = {
  row?: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  payloadType: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionPayloadMetaProps = {
  renderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  styles: ChatMessageToolExecutionPayloadMetaStyles;
};

type ChatMessageToolExecutionResultHeaderStyles = {
  header: StyleProp<ViewStyle>;
  meta: StyleProp<ViewStyle>;
  payloadMeta: Omit<ChatMessageToolExecutionPayloadMetaStyles, 'row'>;
  badge: ChatMessageToolExecutionResultBadgeStyles;
  characterCount: StyleProp<TextStyle>;
  copyButton: ChatMessageToolExecutionCopyButtonStyles;
};

type ChatMessageToolExecutionResultHeaderProps = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  resultBadge: ToolExecutionDetailMobileHeaderRenderState['resultBadge'];
  characterCountLabel: string;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionResultHeaderStyles;
};

type ChatMessageToolExecutionPayloadBlockStyles = {
  preview: StyleProp<TextStyle>;
  scroll: StyleProp<ViewStyle>;
  scrollExpanded: StyleProp<ViewStyle>;
  code: StyleProp<TextStyle>;
};

type ChatMessageToolExecutionPayloadBlockProps = {
  compactText?: string | null;
  content: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  styles: ChatMessageToolExecutionPayloadBlockStyles;
};

type ChatMessageToolExecutionPayloadSectionStyles = {
  section: StyleProp<ViewStyle>;
  headerRow: StyleProp<ViewStyle>;
  payloadMeta: ChatMessageToolExecutionPayloadMetaStyles;
  copyButton: ChatMessageToolExecutionCopyButtonStyles;
  payloadBlock: ChatMessageToolExecutionPayloadBlockStyles;
};

type ChatMessageToolExecutionPayloadSectionProps = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  compactText?: string | null;
  content: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionPayloadSectionStyles;
};

type ChatMessageToolExecutionErrorBlockStyles = {
  section: StyleProp<ViewStyle>;
  headerRow: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  text: StyleProp<TextStyle>;
  copyButton: ChatMessageToolExecutionCopyButtonStyles;
};

type ChatMessageToolExecutionErrorBlockProps = {
  renderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  error: string;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionErrorBlockStyles;
};

type ChatMessageToolExecutionResultSectionStyles = {
  item: StyleProp<ViewStyle>;
  header: ChatMessageToolExecutionResultHeaderStyles;
  payloadBlock: ChatMessageToolExecutionPayloadBlockStyles;
  errorBlock: ChatMessageToolExecutionErrorBlockStyles;
};

type ChatMessageToolExecutionResultSectionProps = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  resultBadge: ToolExecutionDetailMobileHeaderRenderState['resultBadge'];
  characterCountLabel: string;
  resultCompactText?: string | null;
  resultContent: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  errorRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  error?: string | null;
  errorCopyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onErrorCopyPress?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolExecutionResultSectionStyles;
};

type ChatMessageToolExecutionCallDetailInput = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  compactText?: string | null;
  content: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
};

type ChatMessageToolExecutionCallDetailResult = {
  payloadRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  resultBadge: ToolExecutionDetailMobileHeaderRenderState['resultBadge'];
  characterCountLabel: string;
  resultCompactText?: string | null;
  resultContent: string;
  isExpanded: boolean;
  previewNumberOfLines: number;
  copyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onCopyPress?: (event: GestureResponderEvent) => void;
  errorRenderState: ToolExecutionDetailMobileSectionHeaderRenderState;
  error?: string | null;
  errorCopyButtonRenderState: ToolExecutionDetailMobileCopyButtonRenderState;
  onErrorCopyPress?: (event: GestureResponderEvent) => void;
};

type ChatMessageToolExecutionCallDetailPendingResult = {
  renderState: ToolExecutionDetailMobilePendingResultRenderState;
};

type ChatMessageToolExecutionCallDetailStyles = {
  callSection: ChatMessageToolExecutionCallSectionStyles;
  payloadSection: ChatMessageToolExecutionPayloadSectionStyles;
  resultSection: ChatMessageToolExecutionResultSectionStyles;
  pendingResult: ChatMessageToolExecutionPendingResultStyles;
};

type ChatMessageToolExecutionCallDetailProps = {
  renderState: ToolExecutionDetailMobileHeaderRenderState;
  toolName: string;
  onHeaderPress?: (event: GestureResponderEvent) => void;
  input?: ChatMessageToolExecutionCallDetailInput | null;
  result?: ChatMessageToolExecutionCallDetailResult | null;
  pendingResult?: ChatMessageToolExecutionCallDetailPendingResult | null;
  styles: ChatMessageToolExecutionCallDetailStyles;
};

type ChatMessageToolExecutionCallListRow = Omit<ChatMessageToolExecutionCallDetailProps, 'styles'> & {
  key: string;
};

type ChatMessageToolExecutionCallListProps = {
  rows: readonly ChatMessageToolExecutionCallListRow[];
  styles: ChatMessageToolExecutionCallDetailStyles;
};

type ChatMessageHistoryBannerStyles = {
  container: StyleProp<ViewStyle>;
  summary: StyleProp<TextStyle>;
  loadButton: StyleProp<ViewStyle>;
  loadButtonPressed: StyleProp<ViewStyle>;
  loadButtonText: StyleProp<TextStyle>;
};

type ChatMessageHistoryBannerProps = {
  renderState: ChatRuntimeMessageHistoryBannerMobileRenderState;
  onLoadEarlier?: (event: GestureResponderEvent) => void;
  styles: ChatMessageHistoryBannerStyles;
};

type ChatMessageConversationFrameProps = {
  children: ReactNode;
  dock?: ReactNode;
  overlays?: ReactNode;
  keyboardAvoidingStyle: StyleProp<ViewStyle>;
  keyboardAvoidingBehavior: ComponentProps<typeof KeyboardAvoidingView>['behavior'];
  keyboardVerticalOffset: number;
  rootStyle: StyleProp<ViewStyle>;
};

type ChatMessageConversationOverlaysProps = {
  agentSelector?: ReactNode;
  promptEditor?: ReactNode;
};

type ChatMessageScrollViewportProps = {
  children: ReactNode;
  scrollRef?: Ref<ScrollView>;
  style: StyleProp<ViewStyle>;
  contentContainerStyle: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps: ComponentProps<typeof ScrollView>['keyboardShouldPersistTaps'];
  contentInsetAdjustmentBehavior: ComponentProps<typeof ScrollView>['contentInsetAdjustmentBehavior'];
  onScroll?: ComponentProps<typeof ScrollView>['onScroll'];
  onScrollBeginDrag?: ComponentProps<typeof ScrollView>['onScrollBeginDrag'];
  onScrollEndDrag?: ComponentProps<typeof ScrollView>['onScrollEndDrag'];
  scrollEventThrottle: number;
};

type ChatMessageConversationViewportContentProps = {
  loadingState?: ReactNode;
  homeState?: ReactNode;
  historyBanner?: ReactNode;
  stepSummary?: ReactNode;
  children: ReactNode;
  debugPanels?: ReactNode;
};

type ChatMessageConversationViewportProps =
  Omit<ChatMessageScrollViewportProps, 'children'>
  & ChatMessageConversationViewportContentProps;

type ChatMessageStepSummaryCardStyles = {
  card: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  badge: StyleProp<ViewStyle>;
  badgeText: StyleProp<TextStyle>;
  action: StyleProp<TextStyle>;
  meta: StyleProp<TextStyle>;
  preview: StyleProp<TextStyle>;
};

type ChatMessageStepSummaryCardProps = {
  renderState: ChatRuntimeStepSummaryMobileRenderState;
  styles: ChatMessageStepSummaryCardStyles;
};

type ChatMessageScrollToBottomButtonProps = {
  renderState: ChatRuntimeScrollToBottomMobileRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  style: StyleProp<ViewStyle>;
};

type ChatMessageLoadingStateProps = {
  renderState: ChatRuntimeLoadingStateMobileRenderState;
  spinnerSource: ImageSourcePropType;
  style: StyleProp<ViewStyle>;
  spinnerStyle: StyleProp<ImageStyle>;
};

type ChatMessageDebugPanelRow = ChatRuntimeDebugPanelsMobileRenderState['requestRows'][number];

type ChatMessageDebugPanelProps = {
  shouldRender: boolean;
  rows: readonly ChatMessageDebugPanelRow[];
  panelStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

type ChatMessageDebugPanelStackProps = ChatRuntimeDebugPanelsMobileRenderState & {
  panelStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

type ChatMessageConversationViewportStyleSlots = {
  frame: Pick<ChatMessageConversationFrameProps, 'keyboardAvoidingStyle' | 'rootStyle'>;
  scrollViewport: Pick<ChatMessageScrollViewportProps, 'style' | 'contentContainerStyle'>;
  loadingState: Pick<ChatMessageLoadingStateProps, 'style' | 'spinnerStyle'>;
  homeQuickStarts: ChatConversationHomeQuickStartsStyles;
  historyBanner: ChatMessageHistoryBannerStyles;
  stepSummary: ChatMessageStepSummaryCardStyles;
  debugPanels: Pick<ChatMessageDebugPanelStackProps, 'panelStyle' | 'textStyle'>;
};

type ChatMessageRuntimeViewportStyleSlots = Pick<
  ChatMessageConversationViewportStyleSlots,
  'scrollViewport' | 'loadingState' | 'homeQuickStarts' | 'historyBanner' | 'stepSummary' | 'debugPanels'
>;

type ChatMessageRuntimeViewportProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = Omit<
  ChatMessageConversationViewportProps,
  | 'style'
  | 'contentContainerStyle'
  | 'loadingState'
  | 'homeState'
  | 'historyBanner'
  | 'stepSummary'
  | 'debugPanels'
> & {
  loadingState: Omit<ChatMessageLoadingStateProps, 'style' | 'spinnerStyle'>;
  homeQuickStarts: Omit<ChatConversationHomeQuickStartsProps<TPrompt, TTask>, 'styles'>;
  historyBanner: Omit<ChatMessageHistoryBannerProps, 'styles'>;
  stepSummary: Omit<ChatMessageStepSummaryCardProps, 'styles'>;
  debugPanels: Omit<ChatMessageDebugPanelStackProps, 'panelStyle' | 'textStyle'>;
  styles: ChatMessageRuntimeViewportStyleSlots;
};

type ChatMessageResponseHistoryPanelDockProps = ComponentProps<typeof ResponseHistoryPanel>;

type ChatMessageQueuePanelDockProps = {
  shouldRender: boolean;
  panel: ComponentProps<typeof MessageQueuePanel>;
  style: StyleProp<ViewStyle>;
};

type ChatMessageConversationDockProps = {
  responseHistoryPanel?: ReactNode;
  scrollToBottomButton?: ReactNode;
  voiceOverlay?: ReactNode;
  queuePanel?: ReactNode;
  connectionBanner?: ReactNode;
  composer?: ReactNode;
};

type ChatMessageConnectionBannerStyles = {
  banner: StyleProp<ViewStyle>;
  reconnecting: StyleProp<ViewStyle>;
  failed: StyleProp<ViewStyle>;
  content: StyleProp<ViewStyle>;
  icon: StyleProp<ViewStyle>;
  textContainer: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  subtitle: StyleProp<TextStyle>;
  retryButton: StyleProp<ViewStyle>;
  retryButtonText: StyleProp<TextStyle>;
};

type ChatMessageConnectionBannerProps = {
  renderState: ChatRuntimeConnectionBannerMobileRenderState;
  onRetry?: (event: GestureResponderEvent) => void;
  styles: ChatMessageConnectionBannerStyles;
};

type ChatMessageConversationDockStyleSlots = {
  scrollToBottomButtonStyle: ChatMessageScrollToBottomButtonProps['style'];
  queuePanelStyle: ChatMessageQueuePanelDockProps['style'];
  connectionBanner: ChatMessageConnectionBannerStyles;
};

type ChatMessageRuntimeDockStyleSlots = {
  scrollToBottomButtonStyle: ChatMessageScrollToBottomButtonProps['style'];
  voiceOverlay: ChatComposerVoiceOverlayStyles;
  queuePanelStyle: ChatMessageQueuePanelDockProps['style'];
  connectionBanner: ChatMessageConnectionBannerStyles;
  composer: ChatComposerRuntimeDockStyleSlots;
};

type ChatMessageRuntimeDockProps = {
  responseHistoryPanel: ChatMessageResponseHistoryPanelDockProps;
  scrollToBottomButton: Omit<ChatMessageScrollToBottomButtonProps, 'style'>;
  voiceOverlay: Omit<ChatComposerVoiceOverlayProps, 'styles'>;
  queuePanel: Omit<ChatMessageQueuePanelDockProps, 'style'>;
  connectionBanner: Omit<ChatMessageConnectionBannerProps, 'styles'>;
  composer: Omit<ChatComposerRuntimeDockProps, 'styles'>;
  styles: ChatMessageRuntimeDockStyleSlots;
};

type ChatMessageRuntimeSurfaceStyleSlots = {
  frame: ChatMessageConversationViewportStyleSlots['frame'];
  dock: ChatMessageRuntimeDockStyleSlots;
  viewport: ChatMessageRuntimeViewportStyleSlots;
};

type ChatMessageRuntimeSurfaceProps<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
> = {
  frame: Pick<ChatMessageConversationFrameProps, 'keyboardAvoidingBehavior' | 'keyboardVerticalOffset'>;
  dock: Omit<ChatMessageRuntimeDockProps, 'styles'>;
  overlays: ChatMessageRuntimeOverlaysProps;
  viewport: Omit<ChatMessageRuntimeViewportProps<TPrompt, TTask>, 'children' | 'styles'>;
  styles: ChatMessageRuntimeSurfaceStyleSlots;
  children: ReactNode;
};

type ChatRuntimeMobileSafeAreaLayout = {
  chatScrollContent: {
    paddingBottom: number;
  };
  scrollToBottomButton: {
    bottom: number;
  };
  voiceOverlay: {
    bottom: number;
  };
  inputArea: {
    paddingBottom: number;
  };
};

type ChatRuntimeMobileSafeAreaStyleSlots = {
  chatScrollContent: StyleProp<ViewStyle>;
  scrollToBottomButton: StyleProp<ViewStyle>;
  voiceOverlay: StyleProp<ViewStyle>;
  inputArea: StyleProp<ViewStyle>;
};

type ChatRuntimeSafeAreaMergedStyleSlots = {
  scrollToBottomButtonStyle: ChatMessageScrollToBottomButtonProps['style'];
  scrollViewportContentContainerStyle: ChatMessageScrollViewportProps['contentContainerStyle'];
  voiceOverlay: ChatComposerVoiceOverlayStyles;
  inputDock: ChatComposerInputDockStyles;
};

type ChatComposerSpeechPreviewStyles = {
  box: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  text: StyleProp<TextStyle>;
};

type ChatComposerSpeechPreviewProps = {
  label: string;
  text?: string | null;
  styles: ChatComposerSpeechPreviewStyles;
};

type ChatComposerPendingImageItem = {
  id: string;
  previewUri: string;
};

type ChatComposerPendingImagesRailStyles = {
  row: StyleProp<ViewStyle>;
  card: StyleProp<ViewStyle>;
  preview: StyleProp<ImageStyle>;
  removeButton: StyleProp<ViewStyle>;
};

type ChatComposerPendingImagesRailProps = {
  images: readonly ChatComposerPendingImageItem[];
  renderState: ChatImageAttachmentMobileRenderState;
  onRemove: (imageId: string) => void;
  styles: ChatComposerPendingImagesRailStyles;
};

type ChatComposerVoiceOverlayStyles = {
  overlay: StyleProp<ViewStyle>;
  card: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  transcript: StyleProp<TextStyle>;
};

type ChatComposerVoiceOverlayProps = {
  isVisible: boolean;
  label: string;
  transcript?: string | null;
  transcriptNumberOfLines: number;
  styles: ChatComposerVoiceOverlayStyles;
};

type ChatComposerHandsFreeControlsStyles = {
  statusRow: StyleProp<ViewStyle>;
  controlsRow: StyleProp<ViewStyle>;
  controlButton: StyleProp<ViewStyle>;
  controlButtonText: StyleProp<TextStyle>;
};

type ChatComposerHandsFreeControlsProps = {
  isVisible: boolean;
  status: ReactNode;
  controlState: HandsFreeComposerControlState;
  onWake: (event: GestureResponderEvent) => void;
  onSleep: (event: GestureResponderEvent) => void;
  onResume: (event: GestureResponderEvent) => void;
  onPause: (event: GestureResponderEvent) => void;
  controlPressedOpacity: number;
  styles: ChatComposerHandsFreeControlsStyles;
};

type ChatComposerHandsFreeRuntimeStatusProps = ComponentProps<typeof HandsFreeStatusChip>;

type ChatComposerRuntimeHandsFreeControlsProps =
  Omit<ChatComposerHandsFreeControlsProps, 'status' | 'styles'>
  & {
    status: ChatComposerHandsFreeRuntimeStatusProps;
  };

type ChatComposerIconButtonRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string | null;
  accessibilityState?: AccessibilityState;
  ariaChecked?: boolean;
  isActive?: boolean;
  icon: ChatMessageActionIcon;
};

type ChatComposerIconButtonProps = {
  shouldRender?: boolean;
  renderState: ChatComposerIconButtonRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  activeOpacity: number;
  style: StyleProp<ViewStyle>;
  activeStyle?: StyleProp<ViewStyle>;
};

type ChatComposerLabeledActionRenderState = {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string | null;
  accessibilityState?: AccessibilityState;
  isDisabled?: boolean;
  label: string;
  icon: ChatMessageActionIcon;
};

type ChatComposerLabeledActionButtonStyles = {
  button: StyleProp<ViewStyle>;
  disabledButton: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
};

type ChatComposerLabeledActionButtonProps = {
  shouldRender?: boolean;
  renderState: ChatComposerLabeledActionRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  activeOpacity: number;
  styles: ChatComposerLabeledActionButtonStyles;
};

type ChatComposerMicButtonRenderState = ChatComposerIconButtonRenderState & {
  ariaBusy?: boolean;
  label: string;
  labelSelectable?: boolean;
};

type ChatComposerMicButtonStyles = {
  button: StyleProp<ViewStyle>;
  activeButton: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  activeLabel: StyleProp<TextStyle>;
};

type ChatComposerMicButtonProps = {
  renderState: ChatComposerMicButtonRenderState;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  onPress?: (event: GestureResponderEvent) => void;
  webPressedStyle?: StyleProp<ViewStyle>;
  styles: ChatComposerMicButtonStyles;
};

type ChatComposerTextEntryStyles = {
  input: StyleProp<TextStyle>;
  visuallyHiddenHint: StyleProp<TextStyle>;
};

type ChatComposerTextEntryWebAccessibility = {
  isWebPlatform: boolean;
  inputDescriptionNativeId: string;
  voiceStatusLiveRegionNativeId: string;
  voiceStatusLiveRegionPoliteness: ComponentProps<typeof Text>['accessibilityLiveRegion'];
};

type ChatComposerTextEntryProps = {
  inputRef?: Ref<TextInput>;
  value: string;
  onChangeText: ComponentProps<typeof TextInput>['onChangeText'];
  onKeyPress?: ComponentProps<typeof TextInput>['onKeyPress'];
  accessibilityLabel: string;
  accessibilityHint: string;
  placeholder: string;
  placeholderTextColor: string;
  voiceStatusLiveRegionAnnouncement: string;
  webAccessibility: ChatComposerTextEntryWebAccessibility;
  styles: ChatComposerTextEntryStyles;
};

type ChatComposerInputDockStyles = {
  area: StyleProp<ViewStyle>;
  row: StyleProp<ViewStyle>;
  micWrapper: StyleProp<ViewStyle>;
};

type ChatComposerInputDockProps = {
  speechPreview: ReactNode;
  pendingImagesRail: ReactNode;
  handsFreeControls: ReactNode;
  imageAttachmentControl: ReactNode;
  textToSpeechControl: ReactNode;
  editBeforeSendControl: ReactNode;
  textEntry: ReactNode;
  queueAction: ReactNode;
  submitAction: ReactNode;
  micButton: ReactNode;
  micWrapperRef?: Ref<View>;
  styles: ChatComposerInputDockStyles;
};

type ChatMessageSurfaceProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  toneStyle?: StyleProp<ViewStyle>;
};

type ChatMessageThreadItemProps = {
  children: ReactNode;
  leadingActivity?: ReactNode;
  trailingActivity?: ReactNode;
};

type ChatMessageThreadSurfaceProps = ChatMessageThreadItemProps & {
  surfaceStyle: StyleProp<ViewStyle>;
  surfaceToneStyle?: StyleProp<ViewStyle>;
};

type ChatMessageToolActivityGroupThreadSurfaceProps = Omit<
  ChatMessageThreadSurfaceProps,
  'leadingActivity' | 'trailingActivity' | 'surfaceStyle'
> & {
  groupRenderState?: ToolActivityGroupMobileRenderState | null;
  onToggleGroup?: (event: GestureResponderEvent) => void;
  styles: ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
};

type ChatMessageInlineActivityProps = {
  renderState: ChatRuntimeInlineActivityMobileRenderState;
  spinnerSource: ImageSourcePropType;
  style: StyleProp<ViewStyle>;
  spinnerStyle: StyleProp<ImageStyle>;
};

type ChatMessageContentRowProps = {
  children: ReactNode;
  slots: readonly ChatMessageActionSlot[];
  components: Record<ChatMessageActionSlot, ReactNode>;
  rowStyle: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
};

type ChatMessageConversationContentState = {
  shouldRenderExpandedContent: boolean;
  shouldRenderCollapsedTextPreview: boolean;
};

type ChatMessageStreamingContentRenderState = {
  shouldRender: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  title: string;
  badgeLabel: string;
  content: string;
  icon: ChatMessageActionIcon;
  spinner: {
    resizeMode: ComponentProps<typeof Image>['resizeMode'];
  };
  surface: {
    titleNumberOfLines: number;
  };
};

type ChatMessageExpandedContentStyles = {
  header: StyleProp<ViewStyle>;
  title: StyleProp<TextStyle>;
  spinner: StyleProp<ImageStyle>;
  badge: StyleProp<ViewStyle>;
  badgeText: StyleProp<TextStyle>;
  bodyRow: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  caret: StyleProp<ViewStyle>;
};

type ChatMessageExpandedContentProps = {
  streamingRenderState: ChatMessageStreamingContentRenderState;
  markdownContent: string;
  assetBaseUrl?: string;
  assetAuthToken?: string;
  spinnerSource: ImageSourcePropType;
  streamingStyles: ChatMessageExpandedContentStyles;
};

type ChatMessageCollapsedPreviewRenderState = {
  accessibilityRole: AccessibilityRole;
  hitSlop?: number | Insets;
  numberOfLines: number;
  text: string;
};

type ChatMessageCollapsedPreviewProps = {
  renderState: ChatMessageCollapsedPreviewRenderState;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  ariaExpanded?: boolean;
  style: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

type ChatMessageConversationContentProps = {
  contentState: ChatMessageConversationContentState;
  rowStyle: StyleProp<ViewStyle>;
  slots: readonly ChatMessageActionSlot[];
  components: Record<ChatMessageActionSlot, ReactNode>;
  expanded: ChatMessageExpandedContentProps & {
    bodyStyle: StyleProp<ViewStyle>;
  };
  collapsed: ChatMessageCollapsedPreviewProps;
};

type ChatMessageChromeStyleSource = Record<
  string,
  StyleProp<ViewStyle> | StyleProp<TextStyle> | StyleProp<ImageStyle>
>;

type ChatComposerStyleSlots = {
  speechPreview: ChatComposerSpeechPreviewStyles;
  pendingImagesRail: ChatComposerPendingImagesRailStyles;
  voiceOverlay: ChatComposerVoiceOverlayStyles;
  handsFreeControls: ChatComposerHandsFreeControlsStyles;
  accessoryButton: Pick<ChatComposerIconButtonProps, 'style' | 'activeStyle'>;
  textEntry: ChatComposerTextEntryStyles;
  queueAction: ChatComposerLabeledActionButtonStyles;
  submitAction: ChatComposerLabeledActionButtonStyles;
  micButton: ChatComposerMicButtonStyles;
  inputDock: ChatComposerInputDockStyles;
};

type ChatComposerRuntimeDockStyleSlots = ChatComposerStyleSlots;

type ChatComposerRuntimeDockProps = {
  speechPreview: Omit<ChatComposerSpeechPreviewProps, 'styles'>;
  pendingImagesRail: Omit<ChatComposerPendingImagesRailProps, 'styles'>;
  handsFreeControls: ChatComposerRuntimeHandsFreeControlsProps;
  imageAttachmentControl: Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>;
  textToSpeechControl: Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>;
  editBeforeSendControl: Omit<ChatComposerIconButtonProps, 'style' | 'activeStyle'>;
  textEntry: Omit<ChatComposerTextEntryProps, 'styles'>;
  queueAction: Omit<ChatComposerLabeledActionButtonProps, 'styles'>;
  submitAction: Omit<ChatComposerLabeledActionButtonProps, 'styles'>;
  micButton: Omit<ChatComposerMicButtonProps, 'styles'>;
  micWrapperRef?: ChatComposerInputDockProps['micWrapperRef'];
  styles: ChatComposerRuntimeDockStyleSlots;
};

type ChatComposerRuntimeDockChromeProps = {
  handsFreeControls: Pick<ChatComposerRuntimeHandsFreeControlsProps, 'controlPressedOpacity'>;
  imageAttachmentControl: Pick<ChatComposerIconButtonProps, 'activeOpacity'>;
  textToSpeechControl: Pick<ChatComposerIconButtonProps, 'activeOpacity'>;
  editBeforeSendControl: Pick<ChatComposerIconButtonProps, 'activeOpacity'>;
  textEntry: Pick<ChatComposerTextEntryProps, 'placeholderTextColor' | 'webAccessibility'>;
  queueAction: Pick<ChatComposerLabeledActionButtonProps, 'activeOpacity'>;
  submitAction: Pick<ChatComposerLabeledActionButtonProps, 'activeOpacity'>;
  micButton: Pick<ChatComposerMicButtonProps, 'webPressedStyle'>;
};

type ChatComposerRuntimeDockChromeInput = {
  composerSurface: {
    accessoryButton: {
      pressedOpacity: number;
    };
    queueButton: {
      pressedOpacity: number;
    };
    submitButton: {
      pressedOpacity: number;
    };
  };
  composerTextColors: {
    input: {
      placeholderColor: string;
    };
  };
  handsFreeSurface: {
    controlButton: {
      pressedOpacity: number;
    };
  };
  webAccessibility: Pick<
    ChatComposerTextEntryWebAccessibility,
    | 'inputDescriptionNativeId'
    | 'voiceStatusLiveRegionNativeId'
    | 'voiceStatusLiveRegionPoliteness'
  >;
  isWebPlatform: boolean;
  micWebPressedStyle?: ChatComposerMicButtonProps['webPressedStyle'];
};

type ChatMessageThreadBodyStyleSlots = {
  retryStatus: ChatMessageRetryStatusStyles;
  delegationCard: ChatMessageDelegationCardStyles;
  toolApproval: ChatMessageToolApprovalStyles;
  inlineActivity: Pick<ChatMessageInlineActivityProps, 'style' | 'spinnerStyle'>;
  content: {
    rowStyle: ChatMessageConversationContentProps['rowStyle'];
    expandedBodyStyle: ChatMessageConversationContentProps['expanded']['bodyStyle'];
    streamingStyles: ChatMessageExpandedContentStyles;
    collapsedStyle: ChatMessageCollapsedPreviewProps['style'];
    collapsedPressedStyle: ChatMessageCollapsedPreviewProps['pressedStyle'];
    collapsedTextStyle: ChatMessageCollapsedPreviewProps['textStyle'];
  };
  toolExecutionStack: ChatMessageToolExecutionStackStyles;
  standaloneActions: Pick<ChatMessageStandaloneActionsProps, 'rowStyle'>;
};

type ChatMessageToolActivityGroupThreadSurfaceStyleSlots = {
  surfaceStyle: ChatMessageThreadSurfaceProps['surfaceStyle'];
  boundary: ChatMessageToolActivityGroupBoundaryStyles;
  getToneStyle: (toneStyleSlot: string) => ChatMessageThreadSurfaceProps['surfaceToneStyle'];
};

type ChatMessageThreadBodyContentProps =
  Omit<ChatMessageConversationContentProps, 'rowStyle' | 'expanded' | 'collapsed'>
  & {
    expanded: Omit<ChatMessageConversationContentProps['expanded'], 'bodyStyle' | 'streamingStyles'>;
    collapsed: Omit<ChatMessageConversationContentProps['collapsed'], 'style' | 'pressedStyle' | 'textStyle'>;
  };

type ChatMessageThreadBodyProps = {
  styles: ChatMessageThreadBodyStyleSlots;
  retryStatus?: Omit<ChatMessageRetryStatusProps, 'styles'> | null;
  delegationCard?: Omit<ChatMessageDelegationCardProps, 'styles'> | null;
  toolApproval?: Omit<ChatMessageToolApprovalProps, 'styles'> | null;
  inlineActivity?: Omit<ChatMessageInlineActivityProps, 'style' | 'spinnerStyle'> | null;
  conversation: {
    content: ChatMessageThreadBodyContentProps;
    toolExecutionStack: Omit<ChatMessageToolExecutionStackProps, 'styles'>;
    standaloneActions: Omit<ChatMessageStandaloneActionsProps, 'rowStyle'>;
  };
};

type ChatMessageRuntimeThreadStyleSlots = {
  surface: ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
  body: ChatMessageThreadBodyStyleSlots;
};

type ChatMessageRuntimeThreadProps = Omit<
  ChatMessageToolActivityGroupThreadSurfaceProps,
  'children' | 'styles'
> & {
  body?: Omit<ChatMessageThreadBodyProps, 'styles'> | null;
  styles: ChatMessageRuntimeThreadStyleSlots;
};

export function ChatMessageActionIconButton({
  icon,
  onPress,
  disabled = false,
  isActive = false,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  ariaExpanded,
  hitSlop,
  style,
  activeStyle,
  pressedStyle,
  disabledStyle,
}: ChatMessageActionIconButtonProps) {
  const mergedAccessibilityState = disabled
    ? { ...accessibilityState, disabled: true }
    : accessibilityState;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={mergedAccessibilityState}
      aria-expanded={ariaExpanded}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        style,
        isActive && activeStyle,
        pressed && !disabled && pressedStyle,
        disabled && disabledStyle,
      ]}
    >
      {icon.isPending ? (
        <ActivityIndicator
          size={icon.size}
          color={icon.color}
        />
      ) : (
        <Ionicons
          name={icon.name}
          size={icon.size}
          color={icon.color}
        />
      )}
    </Pressable>
  );
}

function renderChatMessageActionButton(spec: ChatMessageActionButtonSpec) {
  if (!spec.canRender) return null;

  return (
    <ChatMessageActionIconButton
      onPress={spec.onPress}
      disabled={spec.renderState.isDisabled}
      accessibilityRole={spec.renderState.accessibilityRole}
      accessibilityLabel={spec.renderState.accessibilityLabel}
      accessibilityHint={spec.renderState.accessibilityHint ?? undefined}
      accessibilityState={spec.renderState.accessibilityState}
      ariaExpanded={spec.renderState.ariaExpanded}
      hitSlop={spec.hitSlop}
      style={spec.style}
      activeStyle={spec.activeStyle}
      pressedStyle={spec.pressedStyle}
      disabledStyle={spec.disabledStyle}
      isActive={spec.isActive}
      icon={spec.renderState.icon}
    />
  );
}

export function createChatMessageActionComponents({
  turnDuration,
  speech,
  branch,
  copy,
  expansion,
}: ChatMessageActionComponentsInput): Record<ChatMessageActionSlot, ReactNode> {
  return {
    turnDuration: turnDuration.canRender ? (
      <ChatMessageTurnDurationBadge
        renderState={turnDuration.renderState}
        style={turnDuration.style}
        liveStyle={turnDuration.liveStyle}
        textStyle={turnDuration.textStyle}
        liveTextStyle={turnDuration.liveTextStyle}
      />
    ) : null,
    speech: renderChatMessageActionButton(speech),
    branch: renderChatMessageActionButton(branch),
    copy: renderChatMessageActionButton(copy),
    expansion: renderChatMessageActionButton(expansion),
  };
}

export function createChatMessageActionSet({
  contentRenderState,
  ...input
}: ChatMessageActionSetInput): ChatMessageActionSet {
  const components = createChatMessageActionComponents(input);
  const layout = getChatMessageActionLayoutState({
    availability: {
      turnDuration: input.turnDuration.canRender,
      speech: input.speech.canRender,
      branch: input.branch.canRender,
      copy: input.copy.canRender,
      expansion: input.expansion.canRender,
    },
    renderState: contentRenderState,
  });

  return {
    components,
    visibleSlots: layout.visibleSlots,
    shouldRenderStandaloneActions: layout.shouldRenderStandaloneRow,
  };
}

export function createChatMessageActionStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageActionStyleSlots {
  return {
    turnDuration: {
      style: styles.messageTurnDurationBadge,
      liveStyle: styles.messageTurnDurationBadgeLive,
      textStyle: styles.messageTurnDurationText,
      liveTextStyle: styles.messageTurnDurationTextLive,
    },
    speech: {
      style: styles.speakButton,
      activeStyle: styles.speakButtonActive,
      pressedStyle: styles.speakButtonPressed,
    },
    branch: {
      style: styles.messageBranchButton,
      pressedStyle: styles.messageBranchButtonPressed,
      disabledStyle: styles.messageBranchButtonDisabled,
    },
    copy: {
      style: styles.messageCopyButton,
      activeStyle: styles.messageCopyButtonCopied,
      pressedStyle: styles.messageCopyButtonPressed,
    },
    expansion: {
      style: styles.messageExpandButton,
      pressedStyle: styles.messageExpandButtonPressed,
    },
  } as ChatMessageActionStyleSlots;
}

export function createChatRuntimeHeaderStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatRuntimeHeaderStyleSlots {
  return {
    actionsRowStyle: styles.headerActionsRow,
    agentSelector: {
      button: styles.headerAgentSelectorButton,
      chip: styles.headerAgentSelectorChip,
      label: styles.headerAgentSelectorText,
    },
    conversationStatus: {
      chip: styles.headerConversationChip,
      text: styles.headerConversationChipText,
      spinner: styles.headerConversationSpinner,
    },
    turnDuration: {
      chip: styles.headerDurationChip,
      liveChip: styles.headerDurationChipLive,
      text: styles.headerDurationChipText,
      liveText: styles.headerDurationChipTextLive,
    },
    iconButtons: {
      edgeStyle: styles.headerEdgeActionButton,
      pinStyle: styles.headerPinButton,
      pinActiveStyle: styles.headerPinButtonActive,
      actionStyle: styles.headerActionButton,
      killSwitchIconContainerStyle: styles.headerKillSwitchIconContainer,
      handsFreeIconContainerStyle: styles.headerHandsFreeIconContainer,
    },
  } as ChatRuntimeHeaderStyleSlots;
}

export function createChatRuntimeNavigationHeaderOptions({
  agentSelector,
  backButton,
  pinButton,
  conversationStatus,
  turnDuration,
  killSwitchButton,
  handsFreeButton,
  styles,
}: ChatRuntimeNavigationHeaderOptionsInput): ChatRuntimeNavigationHeaderOptions {
  return {
    headerTitle: () => (
      <ChatRuntimeHeaderAgentSelector
        {...agentSelector}
        styles={styles.agentSelector}
      />
    ),
    headerLeft: () => (
      <ChatRuntimeHeaderActionsRow style={styles.actionsRowStyle}>
        <ChatRuntimeHeaderIconButton
          {...backButton}
          style={styles.iconButtons.edgeStyle}
        />
        <ChatRuntimeHeaderIconButton
          {...pinButton}
          style={styles.iconButtons.pinStyle}
          activeStyle={styles.iconButtons.pinActiveStyle}
        />
      </ChatRuntimeHeaderActionsRow>
    ),
    headerRight: () => (
      <ChatRuntimeHeaderActionsRow style={styles.actionsRowStyle}>
        <ChatRuntimeHeaderConversationStatus
          {...conversationStatus}
          styles={styles.conversationStatus}
        />
        <ChatRuntimeHeaderTurnDuration
          {...turnDuration}
          styles={styles.turnDuration}
        />
        <ChatRuntimeHeaderIconButton
          {...killSwitchButton}
          style={styles.iconButtons.actionStyle}
          iconContainerStyle={styles.iconButtons.killSwitchIconContainerStyle}
        />
        <ChatRuntimeHeaderIconButton
          {...handsFreeButton}
          style={styles.iconButtons.actionStyle}
          iconContainerStyle={styles.iconButtons.handsFreeIconContainerStyle}
        />
      </ChatRuntimeHeaderActionsRow>
    ),
  };
}

export function createChatComposerStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatComposerStyleSlots {
  return {
    speechPreview: {
      box: styles.sttPreviewBox,
      label: styles.sttPreviewLabel,
      text: styles.sttPreviewText,
    },
    pendingImagesRail: {
      row: styles.pendingImagesRow,
      card: styles.pendingImageCard,
      preview: styles.pendingImagePreview,
      removeButton: styles.pendingImageRemoveButton,
    },
    voiceOverlay: {
      overlay: styles.overlay,
      card: styles.overlayCard,
      label: styles.overlayText,
      transcript: styles.overlayTranscript,
    },
    handsFreeControls: {
      statusRow: styles.handsFreeStatusRow,
      controlsRow: styles.handsFreeControlsRow,
      controlButton: styles.handsFreeControlButton,
      controlButtonText: styles.handsFreeControlButtonText,
    },
    accessoryButton: {
      style: styles.ttsToggle,
      activeStyle: styles.ttsToggleOn,
    },
    textEntry: {
      input: styles.input,
      visuallyHiddenHint: styles.visuallyHiddenComposerHint,
    },
    queueAction: {
      button: styles.queueButton,
      disabledButton: styles.sendButtonDisabled,
      text: styles.queueButtonText,
    },
    submitAction: {
      button: styles.sendButton,
      disabledButton: styles.sendButtonDisabled,
      text: styles.sendButtonText,
    },
    micButton: {
      button: styles.mic,
      activeButton: styles.micOn,
      label: styles.micLabel,
      activeLabel: styles.micLabelOn,
    },
    inputDock: {
      area: styles.inputArea,
      row: styles.inputRow,
      micWrapper: styles.micWrapper,
    },
  } as ChatComposerStyleSlots;
}

export function createChatComposerRuntimeDockStyleSlots({
  chatComposerStyles,
  safeAreaStyles,
}: {
  chatComposerStyles: ChatComposerStyleSlots;
  safeAreaStyles: Pick<ChatRuntimeSafeAreaMergedStyleSlots, 'inputDock'>;
}): ChatComposerRuntimeDockStyleSlots {
  return {
    ...chatComposerStyles,
    inputDock: safeAreaStyles.inputDock,
  } as ChatComposerRuntimeDockStyleSlots;
}

export function createChatComposerRuntimeDockChromeProps({
  composerSurface,
  composerTextColors,
  handsFreeSurface,
  webAccessibility,
  isWebPlatform,
  micWebPressedStyle,
}: ChatComposerRuntimeDockChromeInput): ChatComposerRuntimeDockChromeProps {
  const accessoryButton = {
    activeOpacity: composerSurface.accessoryButton.pressedOpacity,
  };

  return {
    handsFreeControls: {
      controlPressedOpacity: handsFreeSurface.controlButton.pressedOpacity,
    },
    imageAttachmentControl: accessoryButton,
    textToSpeechControl: accessoryButton,
    editBeforeSendControl: accessoryButton,
    textEntry: {
      placeholderTextColor: composerTextColors.input.placeholderColor,
      webAccessibility: {
        isWebPlatform,
        inputDescriptionNativeId: webAccessibility.inputDescriptionNativeId,
        voiceStatusLiveRegionNativeId: webAccessibility.voiceStatusLiveRegionNativeId,
        voiceStatusLiveRegionPoliteness: webAccessibility.voiceStatusLiveRegionPoliteness,
      },
    },
    queueAction: {
      activeOpacity: composerSurface.queueButton.pressedOpacity,
    },
    submitAction: {
      activeOpacity: composerSurface.submitButton.pressedOpacity,
    },
    micButton: {
      webPressedStyle: isWebPlatform ? micWebPressedStyle : undefined,
    },
  };
}

export function createChatMessageConversationDockStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageConversationDockStyleSlots {
  return {
    scrollToBottomButtonStyle: styles.scrollToBottomButton,
    queuePanelStyle: styles.messageQueuePanelWrapper,
    connectionBanner: {
      banner: styles.connectionBanner,
      reconnecting: styles.connectionBannerReconnecting,
      failed: styles.connectionBannerFailed,
      content: styles.connectionBannerContent,
      icon: styles.connectionBannerIcon,
      textContainer: styles.connectionBannerTextContainer,
      title: styles.connectionBannerText,
      subtitle: styles.connectionBannerSubtext,
      retryButton: styles.retryButton,
      retryButtonText: styles.retryButtonText,
    },
  } as ChatMessageConversationDockStyleSlots;
}

export function createChatMessageRuntimeDockStyleSlots({
  conversationDockStyles,
  composerStyles,
  safeAreaStyles,
}: {
  conversationDockStyles: ChatMessageConversationDockStyleSlots;
  composerStyles: ChatComposerRuntimeDockStyleSlots;
  safeAreaStyles: Pick<ChatRuntimeSafeAreaMergedStyleSlots, 'scrollToBottomButtonStyle' | 'voiceOverlay'>;
}): ChatMessageRuntimeDockStyleSlots {
  return {
    scrollToBottomButtonStyle: safeAreaStyles.scrollToBottomButtonStyle,
    voiceOverlay: safeAreaStyles.voiceOverlay,
    queuePanelStyle: conversationDockStyles.queuePanelStyle,
    connectionBanner: conversationDockStyles.connectionBanner,
    composer: composerStyles,
  } as ChatMessageRuntimeDockStyleSlots;
}

export function createChatRuntimeMobileSafeAreaStyleSlots(
  layout: ChatRuntimeMobileSafeAreaLayout,
): ChatRuntimeMobileSafeAreaStyleSlots {
  return StyleSheet.create({
    chatScrollContent: {
      paddingBottom: layout.chatScrollContent.paddingBottom,
    },
    scrollToBottomButton: {
      bottom: layout.scrollToBottomButton.bottom,
    },
    voiceOverlay: {
      bottom: layout.voiceOverlay.bottom,
    },
    inputArea: {
      paddingBottom: layout.inputArea.paddingBottom,
    },
  });
}

export function createChatRuntimeSafeAreaMergedStyleSlots({
  chatComposerStyles,
  conversationDockStyles,
  conversationViewportStyles,
  safeAreaStyles,
}: {
  chatComposerStyles: Pick<ChatComposerStyleSlots, 'voiceOverlay' | 'inputDock'>;
  conversationDockStyles: Pick<ChatMessageConversationDockStyleSlots, 'scrollToBottomButtonStyle'>;
  conversationViewportStyles: Pick<ChatMessageConversationViewportStyleSlots, 'scrollViewport'>;
  safeAreaStyles: ChatRuntimeMobileSafeAreaStyleSlots;
}): ChatRuntimeSafeAreaMergedStyleSlots {
  return {
    scrollToBottomButtonStyle: [
      conversationDockStyles.scrollToBottomButtonStyle,
      safeAreaStyles.scrollToBottomButton,
    ],
    scrollViewportContentContainerStyle: [
      conversationViewportStyles.scrollViewport.contentContainerStyle,
      safeAreaStyles.chatScrollContent,
    ],
    voiceOverlay: {
      ...chatComposerStyles.voiceOverlay,
      overlay: [
        chatComposerStyles.voiceOverlay.overlay,
        safeAreaStyles.voiceOverlay,
      ],
    },
    inputDock: {
      ...chatComposerStyles.inputDock,
      area: [
        chatComposerStyles.inputDock.area,
        safeAreaStyles.inputArea,
      ],
    },
  } as ChatRuntimeSafeAreaMergedStyleSlots;
}

export function createChatMessageToolActivityGroupBoundaryStyles(
  styles: ChatMessageChromeStyleSource,
): ChatMessageToolActivityGroupBoundaryStyles {
  return {
    toggle: {
      container: styles.toolActivityGroupCollapsed,
      pressed: styles.toolActivityGroupPressed,
      headerRow: styles.toolActivityGroupHeaderRow,
      countBadge: styles.toolActivityGroupCountBadge,
      countBadgeText: styles.toolActivityGroupCountBadgeText,
      previewLine: styles.toolActivityGroupPreviewLine,
    },
    footer: {
      button: styles.toolActivityGroupFooterButton,
      pressed: styles.toolActivityGroupPressed,
      text: styles.toolActivityGroupFooterText,
    },
  };
}

export function createChatMessageToolActivityGroupThreadSurfaceStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageToolActivityGroupThreadSurfaceStyleSlots {
  return {
    surfaceStyle: styles.msg,
    boundary: createChatMessageToolActivityGroupBoundaryStyles(styles),
    getToneStyle: (toneStyleSlot) => styles[toneStyleSlot] as ChatMessageThreadSurfaceProps['surfaceToneStyle'],
  } as ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
}

export function createChatMessageRuntimeThreadStyleSlots({
  threadSurfaceStyles,
  threadBodyStyles,
}: {
  threadSurfaceStyles: ChatMessageToolActivityGroupThreadSurfaceStyleSlots;
  threadBodyStyles: ChatMessageThreadBodyStyleSlots;
}): ChatMessageRuntimeThreadStyleSlots {
  return {
    surface: threadSurfaceStyles,
    body: threadBodyStyles,
  };
}

export function createChatMessageConversationViewportStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageConversationViewportStyleSlots {
  return {
    frame: {
      keyboardAvoidingStyle: styles.keyboardAvoidingContainer,
      rootStyle: styles.chatRoot,
    },
    scrollViewport: {
      style: styles.chatScroll,
      contentContainerStyle: styles.chatScrollContent,
    },
    loadingState: {
      style: styles.loadingState,
      spinnerStyle: styles.loadingSpinner,
    },
    homeQuickStarts: {
      card: styles.chatHomeCard,
      emptyText: styles.chatHomeEmptyText,
      grid: styles.chatHomeShortcutGrid,
      shortcutCard: styles.chatHomeShortcutCard,
      shortcutCardAdd: styles.chatHomeShortcutCardAdd,
      shortcutCardDisabled: styles.chatHomeShortcutCardDisabled,
      shortcutCardPressed: styles.chatHomeShortcutCardPressed,
      sourcePill: styles.chatHomeShortcutSourcePill,
      sourceLabel: styles.chatHomeShortcutSourceLabel,
      addIcon: styles.chatHomeShortcutAddIcon,
      title: styles.chatHomeShortcutTitle,
      titleAdd: styles.chatHomeShortcutTitleAdd,
      description: styles.chatHomeShortcutDescription,
      actions: styles.chatHomeShortcutActions,
      actionButton: styles.chatHomeShortcutActionButton,
      actionButtonPressed: styles.chatHomeShortcutActionButtonPressed,
      actionText: styles.chatHomeShortcutActionText,
      actionDangerText: styles.chatHomeShortcutActionDangerText,
    },
    historyBanner: {
      container: styles.loadOlderContainer,
      summary: styles.loadOlderText,
      loadButton: styles.loadOlderButton,
      loadButtonPressed: styles.loadOlderButtonPressed,
      loadButtonText: styles.loadOlderButtonText,
    },
    stepSummary: {
      card: styles.stepSummaryCard,
      header: styles.stepSummaryHeader,
      title: styles.stepSummaryTitle,
      badge: styles.stepSummaryBadge,
      badgeText: styles.stepSummaryBadgeText,
      action: styles.stepSummaryAction,
      meta: styles.stepSummaryMeta,
      preview: styles.stepSummaryPreview,
    },
    debugPanels: {
      panelStyle: styles.debugInfo,
      textStyle: styles.debugText,
    },
  } as ChatMessageConversationViewportStyleSlots;
}

export function createChatMessageRuntimeViewportStyleSlots({
  conversationViewportStyles,
  safeAreaStyles,
}: {
  conversationViewportStyles: ChatMessageConversationViewportStyleSlots;
  safeAreaStyles: Pick<ChatRuntimeSafeAreaMergedStyleSlots, 'scrollViewportContentContainerStyle'>;
}): ChatMessageRuntimeViewportStyleSlots {
  return {
    scrollViewport: {
      style: conversationViewportStyles.scrollViewport.style,
      contentContainerStyle: safeAreaStyles.scrollViewportContentContainerStyle,
    },
    loadingState: conversationViewportStyles.loadingState,
    homeQuickStarts: conversationViewportStyles.homeQuickStarts,
    historyBanner: conversationViewportStyles.historyBanner,
    stepSummary: conversationViewportStyles.stepSummary,
    debugPanels: conversationViewportStyles.debugPanels,
  } as ChatMessageRuntimeViewportStyleSlots;
}

export function createChatMessageRuntimeSurfaceStyleSlots({
  conversationViewportStyles,
  dockStyles,
  viewportStyles,
}: {
  conversationViewportStyles: Pick<ChatMessageConversationViewportStyleSlots, 'frame'>;
  dockStyles: ChatMessageRuntimeDockStyleSlots;
  viewportStyles: ChatMessageRuntimeViewportStyleSlots;
}): ChatMessageRuntimeSurfaceStyleSlots {
  return {
    frame: conversationViewportStyles.frame,
    dock: dockStyles,
    viewport: viewportStyles,
  } as ChatMessageRuntimeSurfaceStyleSlots;
}

export function createChatConversationHomePromptEditorModalStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatConversationHomePromptEditorModalStyles {
  return {
    keyboardAvoidingView: styles.modalKeyboardAvoidingView,
    overlay: styles.modalOverlay,
    content: styles.modalContent,
    header: styles.modalHeader,
    title: styles.modalTitle,
    closeButton: styles.modalCloseButton,
    label: styles.modalLabel,
    input: styles.modalInput,
    inputMultiline: styles.modalInputMultiline,
    actions: styles.modalActions,
    cancelButton: styles.modalCancelButton,
    cancelButtonText: styles.modalCancelButtonText,
    saveButton: styles.modalSaveButton,
    saveButtonDisabled: styles.modalSaveButtonDisabled,
    saveButtonText: styles.modalSaveButtonText,
  } as ChatConversationHomePromptEditorModalStyles;
}

export function createChatMessageThreadBodyStyleSlots(
  styles: ChatMessageChromeStyleSource,
): ChatMessageThreadBodyStyleSlots {
  return {
    retryStatus: {
      card: styles.retryStatusCard,
      header: styles.retryStatusHeader,
      title: styles.retryStatusTitle,
      metaRow: styles.retryStatusMetaRow,
      attempt: styles.retryStatusAttempt,
      countdown: styles.retryStatusCountdown,
      description: styles.retryStatusDescription,
    } as ChatMessageRetryStatusStyles,
    delegationCard: {
      card: styles.delegationCard,
      header: styles.delegationHeader,
      title: styles.delegationTitle,
      statusBadge: styles.delegationStatusBadge,
      statusText: styles.delegationStatusText,
      liveText: styles.delegationLiveText,
      subtitle: styles.delegationSubtitle,
      metaRow: styles.delegationMetaRow,
      metaText: styles.delegationMetaText,
      conversationPreview: styles.delegationConversationPreview,
      conversationPreviewLine: styles.delegationConversationPreviewLine,
      conversationPreviewRole: styles.delegationConversationPreviewRole,
      conversationPreviewContent: styles.delegationConversationPreviewContent,
      conversationPreviewTimestamp: styles.delegationConversationPreviewTimestamp,
      conversationPreviewMoreButton: styles.delegationConversationPreviewMoreButton,
      conversationPreviewMoreButtonPressed: styles.delegationConversationPreviewMoreButtonPressed,
      conversationPreviewMore: styles.delegationConversationPreviewMore,
      toolPreview: styles.delegationToolPreview,
      toolPreviewLabel: styles.delegationToolPreviewLabel,
      toolPreviewLine: styles.delegationToolPreviewLine,
      toolPreviewStatusIcon: styles.delegationToolPreviewStatusIcon,
      toolPreviewName: styles.delegationToolPreviewName,
      toolPreviewNamePending: styles.toolCallCompactNamePending,
      toolPreviewNameSuccess: styles.toolCallCompactNameSuccess,
      toolPreviewNameError: styles.toolCallCompactNameError,
      toolPreviewMoreButton: styles.delegationToolPreviewMoreButton,
      toolPreviewMoreButtonPressed: styles.delegationToolPreviewMoreButtonPressed,
      toolPreviewMore: styles.delegationToolPreviewMore,
    } as ChatMessageDelegationCardStyles,
    toolApproval: {
      card: styles.toolApprovalCard,
      header: styles.toolApprovalHeader,
      content: styles.toolApprovalContent,
      contentDisabled: styles.toolApprovalContentDisabled,
      title: styles.toolApprovalTitle,
      toolRow: styles.toolApprovalToolRow,
      toolLabel: styles.toolApprovalToolLabel,
      toolName: styles.toolApprovalTool,
      argumentsPreview: styles.toolApprovalArgumentsPreview,
      argumentsToggle: styles.toolApprovalArgumentsToggle,
      argumentsTogglePressed: styles.toolApprovalArgumentsTogglePressed,
      argumentsToggleText: styles.toolApprovalArgumentsToggleText,
      argumentsScroll: styles.toolApprovalArgumentsScroll,
      argumentsFull: styles.toolApprovalArgumentsFull,
      actions: styles.toolApprovalActions,
      button: styles.toolApprovalButton,
      buttonDisabled: styles.toolApprovalButtonDisabled,
      approveButton: styles.toolApprovalApproveButton,
      approveButtonText: styles.toolApprovalApproveButtonText,
      denyButton: styles.toolApprovalDenyButton,
      denyButtonText: styles.toolApprovalDenyButtonText,
    } as ChatMessageToolApprovalStyles,
    inlineActivity: {
      style: styles.inlineActivityIndicator,
      spinnerStyle: styles.inlineActivitySpinner,
    } as Pick<ChatMessageInlineActivityProps, 'style' | 'spinnerStyle'>,
    content: {
      rowStyle: styles.messageContentRow,
      expandedBodyStyle: styles.messageContentBody,
      streamingStyles: {
        header: styles.streamingContentHeader,
        title: styles.streamingContentTitle,
        spinner: styles.streamingContentSpinner,
        badge: styles.streamingContentBadge,
        badgeText: styles.streamingContentBadgeText,
        bodyRow: styles.streamingContentBodyRow,
        text: styles.streamingContentText,
        caret: styles.streamingContentCaret,
      } as ChatMessageExpandedContentStyles,
      collapsedStyle: styles.collapsedMessagePreviewToggle,
      collapsedPressedStyle: styles.collapsedMessagePreviewTogglePressed,
      collapsedTextStyle: styles.collapsedMessagePreview,
    } as ChatMessageThreadBodyStyleSlots['content'],
    toolExecutionStack: {
      compactGroup: {
        container: styles.toolCallCompactContainer,
        pressed: styles.toolCallCompactPressed,
      },
      compactRow: {
        line: styles.toolCallCompactLine,
        leadingIcon: styles.toolCallCompactLeadingIcon,
        name: styles.toolCallCompactName,
        namePending: styles.toolCallCompactNamePending,
        nameSuccess: styles.toolCallCompactNameSuccess,
        nameError: styles.toolCallCompactNameError,
        statusIndicator: styles.toolCallCompactStatusIndicator,
        toggleIcon: styles.toolCallCompactToggleIcon,
      },
      expandedGroup: {
        container: styles.toolExecutionExpandedContainer,
        card: styles.toolExecutionCard,
        pending: styles.toolExecutionPending,
        success: styles.toolExecutionSuccess,
        error: styles.toolExecutionError,
        collapseButton: styles.toolCallCompactContainer,
        collapsePressed: styles.toolCallCompactPressed,
        collapseTopPlacement: styles.toolExecutionCollapseTopButton,
        collapseBottomPlacement: styles.toolExecutionCollapseBottomButton,
        collapseText: styles.toolCallCompactName,
      },
      emptyStateText: styles.toolResponsePendingText,
      callDetail: {
        callSection: {
          section: styles.toolCallSection,
          header: {
            header: styles.toolCallHeader,
            headerPressed: styles.toolCallHeaderPressed,
            toolName: styles.toolName,
            expandHint: styles.toolCallExpandHint,
            expandHintText: styles.toolCallExpandHintText,
          },
        },
        payloadSection: {
          section: styles.toolParamsSection,
          headerRow: styles.toolDetailHeaderRow,
          payloadMeta: {
            row: styles.toolPayloadMetaRow,
            label: styles.toolSectionLabel,
            payloadType: styles.toolPayloadType,
          },
          copyButton: {
            button: styles.toolDetailCopyButton,
            pressed: styles.toolDetailCopyButtonPressed,
            text: styles.toolDetailCopyButtonText,
          },
          payloadBlock: {
            preview: styles.toolPayloadPreview,
            scroll: styles.toolParamsScroll,
            scrollExpanded: styles.toolParamsScrollExpanded,
            code: styles.toolParamsCode,
          },
        },
        resultSection: {
          item: styles.toolResultItem,
          header: {
            header: styles.toolResultHeader,
            meta: styles.toolResultHeaderMeta,
            payloadMeta: {
              label: styles.toolSectionLabel,
              payloadType: styles.toolPayloadType,
            },
            badge: {
              badge: styles.toolResultBadge,
              badgeSuccess: styles.toolResultBadgeSuccess,
              badgeError: styles.toolResultBadgeError,
              text: styles.toolResultBadgeText,
              textSuccess: styles.toolResultBadgeTextSuccess,
              textError: styles.toolResultBadgeTextError,
            },
            characterCount: styles.toolResultCharCount,
            copyButton: {
              button: styles.toolDetailCopyButton,
              pressed: styles.toolDetailCopyButtonPressed,
              text: styles.toolDetailCopyButtonText,
            },
          },
          payloadBlock: {
            preview: styles.toolPayloadPreview,
            scroll: styles.toolResultScroll,
            scrollExpanded: styles.toolResultScrollExpanded,
            code: styles.toolResultCode,
          },
          errorBlock: {
            section: styles.toolResultErrorSection,
            headerRow: styles.toolDetailHeaderRow,
            label: styles.toolResultErrorLabel,
            text: styles.toolResultErrorText,
            copyButton: {
              button: styles.toolDetailCopyButton,
              pressed: styles.toolDetailCopyButtonPressed,
              text: styles.toolDetailCopyButtonText,
            },
          },
        },
        pendingResult: {
          row: styles.toolResponsePendingRow,
          text: styles.toolResponsePendingText,
        },
      },
    } as ChatMessageToolExecutionStackStyles,
    standaloneActions: {
      rowStyle: styles.messageActionsRow,
    } as Pick<ChatMessageStandaloneActionsProps, 'rowStyle'>,
  };
}

export function ChatRuntimeHeaderAgentSelector({
  renderState,
  onPress,
  labelNumberOfLines,
  styles,
}: ChatRuntimeHeaderAgentSelectorProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={renderState.pressedOpacity}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint}
    >
      <View style={styles.chip}>
        <Text
          style={styles.label}
          numberOfLines={labelNumberOfLines}
        >
          {renderState.label}
        </Text>
        <Ionicons
          name={renderState.icon.name}
          size={renderState.icon.size}
          color={renderState.icon.color}
        />
      </View>
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderActionsRow({
  children,
  style,
}: ChatRuntimeHeaderActionsRowProps) {
  return (
    <View style={style}>
      {children}
    </View>
  );
}

export function ChatRuntimeHeaderIconButton({
  shouldRender = true,
  renderState,
  onPress,
  style,
  activeStyle,
  iconContainerStyle,
  isActive,
}: ChatRuntimeHeaderIconButtonProps) {
  if (!shouldRender) return null;

  const icon = (
    <Ionicons
      name={renderState.icon.name}
      size={renderState.icon.size}
      color={renderState.icon.color}
    />
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={renderState.pressedOpacity}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint}
      accessibilityState={'accessibilityState' in renderState ? renderState.accessibilityState : undefined}
      aria-checked={'ariaChecked' in renderState ? renderState.ariaChecked : undefined}
      style={[style, isActive && activeStyle]}
    >
      {iconContainerStyle ? (
        <View style={iconContainerStyle}>
          {icon}
        </View>
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
}

export function ChatRuntimeHeaderConversationStatus({
  renderState,
  spinnerSource,
  styles,
}: ChatRuntimeHeaderConversationStatusProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      style={[
        styles.chip,
        renderState.styles.chip,
      ]}
    >
      {renderState.runningIndicator.shouldRender && (
        <Image
          source={spinnerSource}
          style={styles.spinner}
          resizeMode={renderState.runningIndicator.resizeMode}
        />
      )}
      <Text
        style={[
          styles.text,
          renderState.styles.text,
        ]}
      >
        {renderState.label}
      </Text>
    </View>
  );
}

export function ChatRuntimeHeaderTurnDuration({
  renderState,
  styles,
}: ChatRuntimeHeaderTurnDurationProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={[
        styles.chip,
        renderState.isLive && styles.liveChip,
      ]}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text
        style={[
          styles.text,
          renderState.isLive && styles.liveText,
        ]}
        numberOfLines={renderState.badge.numberOfLines}
      >
        {renderState.label}
      </Text>
    </View>
  );
}

export function ChatConversationHomeQuickStarts<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  shouldRender,
  items,
  isLoading,
  runningTaskId,
  onPress,
  onEditPrompt,
  onDeletePrompt,
  shortcutRenderState,
  styles,
}: ChatConversationHomeQuickStartsProps<TPrompt, TTask>) {
  if (!shouldRender) return null;
  const { surface: shortcutSurface } = shortcutRenderState;
  const shortcutEmptyRenderState = getPromptLibraryMobileShortcutEmptyRenderState(shortcutRenderState, isLoading);

  return (
    <View style={styles.card}>
      {items.length > 0 ? (
        <View style={styles.grid}>
          {items.map((item) => {
            const shortcutItemRenderState = getPromptLibraryMobileShortcutItemRenderState(
              item,
              shortcutRenderState,
              runningTaskId,
            );
            const { interaction: shortcutInteraction } = shortcutItemRenderState;
            const addAction = shortcutItemRenderState.addAction;
            const promptActions = shortcutItemRenderState.promptActions;

            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.shortcutCard,
                  shortcutInteraction.isAddPrompt && styles.shortcutCardAdd,
                  shortcutInteraction.isRunning && styles.shortcutCardDisabled,
                  pressed && styles.shortcutCardPressed,
                ]}
                onPress={() => onPress(item)}
                disabled={shortcutInteraction.isDisabled}
                accessibilityRole={shortcutItemRenderState.accessibilityRole}
                accessibilityState={shortcutInteraction.accessibilityState}
                accessibilityLabel={shortcutItemRenderState.accessibilityLabel}
                accessibilityHint={shortcutItemRenderState.accessibilityHint}
              >
                {!shortcutInteraction.isAddPrompt ? (
                  <View style={styles.sourcePill}>
                    <Ionicons
                      name={shortcutItemRenderState.sourceIcon.name}
                      size={shortcutItemRenderState.sourceIcon.size}
                      color={shortcutItemRenderState.sourceIconColors.color}
                    />
                    <Text
                      style={styles.sourceLabel}
                      numberOfLines={shortcutSurface.shortcutSourceLabel.numberOfLines}
                    >
                      {shortcutItemRenderState.sourceLabel}
                    </Text>
                  </View>
                ) : addAction ? (
                  <Ionicons
                    name={addAction.icon.name}
                    size={addAction.icon.size}
                    color={addAction.iconColors.color}
                    style={styles.addIcon}
                  />
                ) : null}
                <Text
                  style={[
                    styles.title,
                    shortcutInteraction.isAddPrompt && styles.titleAdd,
                  ]}
                  numberOfLines={shortcutSurface.shortcutTitle.numberOfLines}
                >
                  {item.title}
                </Text>
                {item.description ? (
                  <Text
                    style={styles.description}
                    numberOfLines={shortcutSurface.shortcutDescription.numberOfLines}
                  >
                    {item.description}
                  </Text>
                ) : null}
                {item.prompt && promptActions ? (
                  <View style={styles.actions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        onEditPrompt(item.prompt!);
                      }}
                      accessibilityRole={promptActions.edit.accessibilityRole}
                      accessibilityLabel={promptActions.edit.accessibilityLabel}
                    >
                      <Ionicons
                        name={promptActions.edit.icon.name}
                        size={promptActions.edit.icon.size}
                        color={promptActions.edit.iconColors.color}
                      />
                      <Text style={styles.actionText}>{promptActions.edit.label}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        onDeletePrompt(item.prompt!);
                      }}
                      accessibilityRole={promptActions.delete.accessibilityRole}
                      accessibilityLabel={promptActions.delete.accessibilityLabel}
                    >
                      <Ionicons
                        name={promptActions.delete.icon.name}
                        size={promptActions.delete.icon.size}
                        color={promptActions.delete.iconColors.color}
                      />
                      <Text style={[styles.actionText, styles.actionDangerText]}>{promptActions.delete.label}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          {shortcutEmptyRenderState.label}
        </Text>
      )}
    </View>
  );
}

export function ChatConversationHomePromptEditorModal({
  visible,
  isEditing,
  nameValue,
  onNameChange,
  contentValue,
  onContentChange,
  isSaving,
  onClose,
  onSave,
  renderState,
  styles,
}: ChatConversationHomePromptEditorModalProps) {
  const editorDismissActionState = getPromptLibraryEditorDismissActionState(isSaving);
  const editorSaveActionState = getPromptLibraryEditorSaveActionState(
    { name: nameValue, content: contentValue },
    isEditing,
    isSaving,
  );
  const {
    chrome: editorChrome,
    colors,
    copy,
    keyboardAvoidingBehavior,
    surface,
  } = renderState;
  const title = getPromptLibraryEditorTitle(isEditing);

  return (
    <Modal
      visible={visible}
      transparent={surface.modal.transparent}
      animationType={surface.modal.animationType}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={keyboardAvoidingBehavior}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={editorDismissActionState.isDisabled}
                activeOpacity={surface.closeButton.pressedOpacity}
                accessibilityRole={surface.closeButton.accessibilityRole}
                accessibilityLabel={copy.closeAccessibilityLabel}
                accessibilityState={editorDismissActionState.accessibilityState}
              >
                <Ionicons
                  name={editorChrome.closeIcon.name}
                  size={editorChrome.closeIcon.size}
                  color={editorChrome.closeIconColors.color}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{copy.nameLabel}</Text>
            <TextInput
              style={styles.input}
              value={nameValue}
              onChangeText={onNameChange}
              accessibilityLabel={copy.nameAccessibilityLabel}
              placeholder={copy.namePlaceholder}
              placeholderTextColor={colors.input.placeholderColor}
            />

            <Text style={styles.label}>{copy.contentLabel}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={contentValue}
              onChangeText={onContentChange}
              accessibilityLabel={copy.contentAccessibilityLabel}
              placeholder={copy.contentPlaceholder}
              placeholderTextColor={colors.input.placeholderColor}
              multiline={surface.multilineInput.multiline}
              textAlignVertical={surface.multilineInput.textAlignVertical}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={editorDismissActionState.isDisabled}
                activeOpacity={surface.cancelButton.pressedOpacity}
                accessibilityRole={surface.cancelButton.accessibilityRole}
                accessibilityLabel={copy.cancelAccessibilityLabel}
                accessibilityState={editorDismissActionState.accessibilityState}
              >
                <Text style={styles.cancelButtonText}>{copy.cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  editorSaveActionState.isDisabled && styles.saveButtonDisabled,
                ]}
                onPress={onSave}
                disabled={editorSaveActionState.isDisabled}
                activeOpacity={surface.saveButton.pressedOpacity}
                accessibilityRole={surface.saveButton.accessibilityRole}
                accessibilityLabel={editorSaveActionState.accessibilityLabel}
                accessibilityState={editorSaveActionState.accessibilityState}
              >
                <Text style={styles.saveButtonText}>{editorSaveActionState.label}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ChatMessageSurface({
  children,
  style,
  toneStyle,
}: ChatMessageSurfaceProps) {
  return (
    <View style={[style, toneStyle]}>
      {children}
    </View>
  );
}

export function ChatMessageThreadItem({
  children,
  leadingActivity,
  trailingActivity,
}: ChatMessageThreadItemProps) {
  return (
    <View>
      {leadingActivity}
      {children}
      {trailingActivity}
    </View>
  );
}

export function ChatMessageThreadSurface({
  children,
  leadingActivity,
  trailingActivity,
  surfaceStyle,
  surfaceToneStyle,
}: ChatMessageThreadSurfaceProps) {
  return (
    <ChatMessageThreadItem
      leadingActivity={leadingActivity}
      trailingActivity={trailingActivity}
    >
      <ChatMessageSurface
        style={surfaceStyle}
        toneStyle={surfaceToneStyle}
      >
        {children}
      </ChatMessageSurface>
    </ChatMessageThreadItem>
  );
}

export function ChatMessageToolActivityGroupThreadSurface({
  children,
  groupRenderState,
  onToggleGroup,
  styles,
  surfaceToneStyle,
}: ChatMessageToolActivityGroupThreadSurfaceProps) {
  return (
    <ChatMessageThreadSurface
      surfaceStyle={styles.surfaceStyle}
      surfaceToneStyle={surfaceToneStyle}
      leadingActivity={groupRenderState?.shouldRenderExpandedHeader ? (
        <ChatMessageToolActivityGroupBoundary
          renderState={groupRenderState}
          kind="expanded"
          onPress={onToggleGroup}
          styles={styles.boundary}
        />
      ) : null}
      trailingActivity={groupRenderState?.shouldRenderExpandedFooter ? (
        <ChatMessageToolActivityGroupBoundary
          renderState={groupRenderState}
          kind="footer"
          onPress={onToggleGroup}
          styles={styles.boundary}
        />
      ) : null}
    >
      {children}
    </ChatMessageThreadSurface>
  );
}

export function ChatMessageRuntimeThread({
  groupRenderState,
  onToggleGroup,
  surfaceToneStyle,
  body,
  styles,
}: ChatMessageRuntimeThreadProps) {
  if (groupRenderState?.shouldSkipCollapsedItem) return null;

  if (groupRenderState?.shouldRenderCollapsedHeader) {
    return (
      <ChatMessageToolActivityGroupBoundary
        renderState={groupRenderState}
        kind="collapsed"
        onPress={onToggleGroup}
        styles={styles.surface.boundary}
      />
    );
  }

  if (!body) return null;

  return (
    <ChatMessageToolActivityGroupThreadSurface
      surfaceToneStyle={surfaceToneStyle}
      groupRenderState={groupRenderState}
      onToggleGroup={onToggleGroup}
      styles={styles.surface}
    >
      <ChatMessageThreadBody
        {...body}
        styles={styles.body}
      />
    </ChatMessageToolActivityGroupThreadSurface>
  );
}

export function ChatMessageThreadBody({
  styles,
  retryStatus,
  delegationCard,
  toolApproval,
  inlineActivity,
  conversation,
}: ChatMessageThreadBodyProps) {
  if (retryStatus) {
    return (
      <ChatMessageRetryStatus
        {...retryStatus}
        styles={styles.retryStatus}
      />
    );
  }

  if (delegationCard) {
    return (
      <ChatMessageDelegationCard
        {...delegationCard}
        styles={styles.delegationCard}
      />
    );
  }

  if (toolApproval) {
    return (
      <ChatMessageToolApproval
        {...toolApproval}
        styles={styles.toolApproval}
      />
    );
  }

  if (inlineActivity) {
    return (
      <ChatMessageInlineActivity
        {...inlineActivity}
        style={styles.inlineActivity.style}
        spinnerStyle={styles.inlineActivity.spinnerStyle}
      />
    );
  }

  return (
    <>
      <ChatMessageConversationContent
        {...conversation.content}
        rowStyle={styles.content.rowStyle}
        expanded={{
          ...conversation.content.expanded,
          bodyStyle: styles.content.expandedBodyStyle,
          streamingStyles: styles.content.streamingStyles,
        }}
        collapsed={{
          ...conversation.content.collapsed,
          style: styles.content.collapsedStyle,
          pressedStyle: styles.content.collapsedPressedStyle,
          textStyle: styles.content.collapsedTextStyle,
        }}
      />
      <ChatMessageToolExecutionStack
        {...conversation.toolExecutionStack}
        styles={styles.toolExecutionStack}
      />
      <ChatMessageStandaloneActions
        {...conversation.standaloneActions}
        rowStyle={styles.standaloneActions.rowStyle}
      />
    </>
  );
}

export function ChatMessageRetryStatus({
  renderState,
  styles,
}: ChatMessageRetryStatusProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={styles.card}
    >
      <View style={styles.header}>
        <Ionicons
          name={renderState.icon.name}
          size={renderState.icon.size}
          color={renderState.icon.color}
        />
        <Text
          style={styles.title}
          numberOfLines={renderState.surface.titleNumberOfLines}
        >
          {renderState.title}
        </Text>
        <ActivityIndicator
          size={renderState.spinner.size}
          color={renderState.spinner.color}
        />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.attempt}>
          {renderState.attemptLabel}
        </Text>
        <Text style={styles.countdown}>
          {renderState.countdownLabel}
        </Text>
      </View>
      <Text style={styles.description}>
        {renderState.description}
      </Text>
    </View>
  );
}

export function ChatMessageToolApproval({
  renderState,
  toolName,
  argumentsPreview,
  argumentsContent,
  onToggleArguments,
  onDeny,
  onApprove,
  styles,
}: ChatMessageToolApprovalProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons
          name={renderState.headerIcon.name}
          size={renderState.headerIcon.size}
          color={renderState.headerIcon.color}
        />
        <Text
          style={styles.title}
          numberOfLines={renderState.surface.title.numberOfLines}
        >
          {renderState.title}
        </Text>
        {renderState.approveButton.isDisabled ? (
          <ActivityIndicator
            size={renderState.spinner.size}
            color={renderState.spinner.color}
          />
        ) : null}
      </View>
      <View
        style={[
          styles.content,
          renderState.approveButton.isDisabled && styles.contentDisabled,
        ]}
      >
        <View style={styles.toolRow}>
          <Text style={styles.toolLabel}>
            {renderState.copy.toolLabel}:
          </Text>
          <Text
            style={styles.toolName}
            numberOfLines={renderState.surface.toolName.numberOfLines}
          >
            {toolName}
          </Text>
        </View>
        {argumentsPreview ? (
          <Text
            style={styles.argumentsPreview}
            numberOfLines={renderState.surface.argumentsPreview.numberOfLines}
          >
            {argumentsPreview}
          </Text>
        ) : null}
        <Pressable
          onPress={onToggleArguments}
          disabled={renderState.argumentsToggle.isDisabled}
          accessibilityRole={renderState.argumentsToggle.accessibilityRole}
          accessibilityLabel={renderState.argumentsToggle.accessibilityLabel}
          accessibilityState={renderState.argumentsToggle.accessibilityState}
          aria-expanded={renderState.argumentsToggle.ariaExpanded}
          style={({ pressed }) => [
            styles.argumentsToggle,
            pressed && styles.argumentsTogglePressed,
            renderState.argumentsToggle.isDisabled && styles.buttonDisabled,
          ]}
        >
          <Ionicons
            name={renderState.argumentsToggle.icon.name}
            size={renderState.argumentsToggle.icon.size}
            color={renderState.argumentsToggle.icon.color}
          />
          <Text style={styles.argumentsToggleText}>
            {renderState.argumentsToggle.label}
          </Text>
        </Pressable>
        {renderState.argumentsToggle.ariaExpanded ? (
          <ScrollView style={styles.argumentsScroll} nestedScrollEnabled>
            <Text style={styles.argumentsFull}>
              {argumentsContent}
            </Text>
          </ScrollView>
        ) : null}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.denyButton,
              renderState.denyButton.isDisabled && styles.buttonDisabled,
            ]}
            onPress={onDeny}
            disabled={renderState.denyButton.isDisabled}
            accessibilityRole={renderState.denyButton.accessibilityRole}
            accessibilityLabel={renderState.denyButton.accessibilityLabel}
            accessibilityState={renderState.denyButton.accessibilityState}
          >
            <Ionicons
              name={renderState.denyButton.icon.name}
              size={renderState.denyButton.icon.size}
              color={renderState.denyButton.icon.color}
            />
            <Text style={styles.denyButtonText}>
              {renderState.denyButton.label}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.approveButton,
              renderState.approveButton.isDisabled && styles.buttonDisabled,
            ]}
            onPress={onApprove}
            disabled={renderState.approveButton.isDisabled}
            accessibilityRole={renderState.approveButton.accessibilityRole}
            accessibilityLabel={renderState.approveButton.accessibilityLabel}
            accessibilityState={renderState.approveButton.accessibilityState}
          >
            {renderState.approveButton.isDisabled ? (
              <ActivityIndicator
                size={renderState.approveButton.spinner.size}
                color={renderState.approveButton.spinner.color}
              />
            ) : (
              <Ionicons
                name={renderState.approveButton.icon.name}
                size={renderState.approveButton.icon.size}
                color={renderState.approveButton.icon.color}
              />
            )}
            <Text style={styles.approveButtonText}>
              {renderState.approveButton.label}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function ChatMessageDelegationCard({
  surface,
  agentName,
  presentation,
  accessibilityLabel,
  messageCountLabel,
  statusStyles,
  conversationPreview,
  toolPreview,
  styles,
}: ChatMessageDelegationCardProps) {
  return (
    <View
      accessible
      accessibilityRole={surface.accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text
          style={styles.title}
          numberOfLines={surface.titleNumberOfLines}
        >
          {agentName}
        </Text>
        <View
          style={[
            styles.statusBadge,
            statusStyles?.chip,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              statusStyles?.text,
            ]}
            numberOfLines={surface.statusNumberOfLines}
          >
            {presentation.statusLabel}
          </Text>
        </View>
        {presentation.isActive ? (
          <Text style={styles.liveText}>
            {surface.liveLabel}
          </Text>
        ) : null}
      </View>
      {presentation.subtitle ? (
        <Text
          style={styles.subtitle}
          numberOfLines={surface.subtitleNumberOfLines}
        >
          {presentation.subtitle}
        </Text>
      ) : null}
      <View style={styles.metaRow}>
        <Text
          style={styles.metaText}
          numberOfLines={surface.metaNumberOfLines}
        >
          {presentation.sourceLabel}
        </Text>
        {presentation.trackingLabel ? (
          <Text
            style={styles.metaText}
            numberOfLines={surface.metaNumberOfLines}
          >
            {presentation.trackingLabel}
          </Text>
        ) : null}
        {messageCountLabel ? (
          <Text
            style={styles.metaText}
            numberOfLines={surface.metaNumberOfLines}
          >
            {messageCountLabel}
          </Text>
        ) : null}
      </View>
      {conversationPreview.rows.length > 0 ? (
        <View style={styles.conversationPreview}>
          {conversationPreview.rows.map((row, rowIndex) => (
            <View
              key={`${row.timestamp}-${row.role}-${rowIndex}`}
              style={styles.conversationPreviewLine}
            >
              <Text
                style={[
                  styles.conversationPreviewRole,
                  conversationPreview.roleStyles[row.role],
                ]}
                numberOfLines={surface.conversationPreviewRoleNumberOfLines}
                ellipsizeMode={surface.conversationPreviewRoleEllipsizeMode}
              >
                {row.roleLabel}
              </Text>
              <Text
                style={styles.conversationPreviewContent}
                numberOfLines={surface.conversationPreviewContentNumberOfLines}
                ellipsizeMode={surface.conversationPreviewContentEllipsizeMode}
              >
                {row.content}
              </Text>
              {row.timestampLabel ? (
                <Text
                  style={styles.conversationPreviewTimestamp}
                  numberOfLines={surface.conversationPreviewTimestampNumberOfLines}
                >
                  {row.timestampLabel}
                </Text>
              ) : null}
            </View>
          ))}
          {conversationPreview.hiddenCount > 0 && conversationPreview.onShowAll ? (
            <Pressable
              onPress={conversationPreview.onShowAll}
              accessibilityRole={conversationPreview.moreAction.accessibilityRole}
              accessibilityLabel={conversationPreview.moreAction.accessibilityLabel}
              style={({ pressed }) => [
                styles.conversationPreviewMoreButton,
                pressed && styles.conversationPreviewMoreButtonPressed,
              ]}
            >
              <Text
                style={styles.conversationPreviewMore}
                numberOfLines={conversationPreview.moreAction.numberOfLines}
              >
                {conversationPreview.moreAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {toolPreview.shouldRender ? (
        <View style={styles.toolPreview}>
          <Text
            style={styles.toolPreviewLabel}
            numberOfLines={surface.toolPreviewLabelNumberOfLines}
          >
            {toolPreview.label}
          </Text>
          {toolPreview.rows.map(({ key, preview, renderState }) => (
            <View
              key={key}
              style={styles.toolPreviewLine}
              accessibilityLabel={renderState.accessibilityLabel}
            >
              <View
                style={styles.toolPreviewStatusIcon}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {renderState.statusIndicator.spinner.shouldRender ? (
                  <ActivityIndicator
                    size={renderState.statusIndicator.spinner.size}
                    color={renderState.statusIndicator.spinner.color}
                  />
                ) : renderState.statusIndicator.icon.shouldRender ? (
                  <Ionicons
                    name={renderState.statusIndicator.icon.name}
                    size={renderState.statusIndicator.icon.size}
                    color={renderState.statusIndicator.icon.color}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.toolPreviewName,
                  renderState.isPending && styles.toolPreviewNamePending,
                  renderState.isSuccess && styles.toolPreviewNameSuccess,
                  renderState.isError && styles.toolPreviewNameError,
                ]}
                numberOfLines={renderState.name.numberOfLines}
                ellipsizeMode={renderState.name.ellipsizeMode}
              >
                {preview}
              </Text>
            </View>
          ))}
          {toolPreview.hiddenCount > 0 && toolPreview.onShowAll ? (
            <Pressable
              onPress={toolPreview.onShowAll}
              accessibilityRole={toolPreview.moreAction.accessibilityRole}
              accessibilityLabel={toolPreview.moreAction.accessibilityLabel}
              style={({ pressed }) => [
                styles.toolPreviewMoreButton,
                pressed && styles.toolPreviewMoreButtonPressed,
              ]}
            >
              <Text
                style={styles.toolPreviewMore}
                numberOfLines={toolPreview.moreAction.numberOfLines}
              >
                {toolPreview.moreAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function ChatMessageToolActivityGroupToggle({
  renderState,
  headerKind,
  onPress,
  styles,
}: ChatMessageToolActivityGroupToggleProps) {
  const headerState = headerKind === 'collapsed'
    ? renderState.collapsedHeader
    : renderState.expandedHeader;
  const { summary } = renderState;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={headerState.accessibilityRole}
      accessibilityLabel={headerState.accessibilityLabel}
      accessibilityState={headerState.accessibilityState}
      aria-expanded={headerState.ariaExpanded}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.headerRow}>
        <Ionicons
          name={renderState.leadingIcon.name}
          size={renderState.leadingIcon.size}
          color={renderState.leadingIcon.color}
        />
        {summary.shouldShowToolCallCount && (
          <View
            accessibilityLabel={summary.toolCallCountLabel}
            style={styles.countBadge}
          >
            <Text style={styles.countBadgeText}>
              {summary.toolCallCount}
            </Text>
          </View>
        )}
        <Text
          style={styles.previewLine}
          numberOfLines={renderState.surface.preview.numberOfLines}
          ellipsizeMode={renderState.surface.preview.ellipsizeMode}
        >
          {summary.previewText}
        </Text>
        <Ionicons
          name={renderState.headerToggleIcon.name}
          size={renderState.headerToggleIcon.size}
          color={renderState.headerToggleIcon.color}
        />
      </View>
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupFooter({
  renderState,
  onPress,
  styles,
}: ChatMessageToolActivityGroupFooterProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={renderState.footerButton.accessibilityRole}
      accessibilityLabel={renderState.footerButton.accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={renderState.footerToggleIcon.name}
        size={renderState.footerToggleIcon.size}
        color={renderState.footerToggleIcon.color}
      />
      <Text style={styles.text}>
        {renderState.footerButton.label}
      </Text>
    </Pressable>
  );
}

export function ChatMessageToolActivityGroupBoundary({
  renderState,
  kind,
  onPress,
  styles,
}: ChatMessageToolActivityGroupBoundaryProps) {
  if (kind === 'footer') {
    return (
      <ChatMessageToolActivityGroupFooter
        renderState={renderState}
        onPress={onPress}
        styles={styles.footer}
      />
    );
  }

  return (
    <ChatMessageToolActivityGroupToggle
      renderState={renderState}
      headerKind={kind}
      onPress={onPress}
      styles={styles.toggle}
    />
  );
}

export function ChatMessageToolExecutionCompactGroup({
  renderState,
  onPress,
  styles,
  children,
}: ChatMessageToolExecutionCompactGroupProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint}
      accessibilityState={renderState.accessibilityState}
      aria-expanded={renderState.ariaExpanded}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function ChatMessageToolExecutionCompactRow({
  renderState,
  styles,
}: ChatMessageToolExecutionCompactRowProps) {
  return (
    <View
      style={styles.line}
      accessibilityLabel={renderState.accessibilityLabel}
    >
      <View style={styles.leadingIcon}>
        <Ionicons
          name={renderState.toolIcon.name}
          size={renderState.toolIcon.size}
          color={renderState.toolIcon.color}
        />
      </View>
      <Text
        style={[
          styles.name,
          renderState.isPending && styles.namePending,
          renderState.isSuccess && styles.nameSuccess,
          renderState.isError && styles.nameError,
        ]}
        numberOfLines={renderState.name.numberOfLines}
        ellipsizeMode={renderState.name.ellipsizeMode}
      >
        {renderState.preview}
      </Text>
      <View style={styles.statusIndicator}>
        {renderState.statusIndicator.spinner.shouldRender ? (
          <ActivityIndicator
            size={renderState.statusIndicator.spinner.size}
            color={renderState.statusIndicator.spinner.color}
          />
        ) : renderState.statusIndicator.icon.shouldRender ? (
          <Ionicons
            name={renderState.statusIndicator.icon.name}
            size={renderState.statusIndicator.icon.size}
            color={renderState.statusIndicator.icon.color}
          />
        ) : null}
      </View>
      <View style={styles.toggleIcon}>
        <Ionicons
          name={renderState.toggleIcon.name}
          size={renderState.toggleIcon.size}
          color={renderState.toggleIcon.color}
        />
      </View>
    </View>
  );
}

export function ChatMessageToolExecutionCompactList({
  shouldRender,
  renderState,
  rows,
  onPress,
  groupStyles,
  rowStyles,
}: ChatMessageToolExecutionCompactListProps) {
  if (!shouldRender) return null;

  return (
    <ChatMessageToolExecutionCompactGroup
      renderState={renderState}
      onPress={onPress}
      styles={groupStyles}
    >
      {rows.map((row) => (
        <ChatMessageToolExecutionCompactRow
          key={row.key}
          renderState={row.renderState}
          styles={rowStyles}
        />
      ))}
    </ChatMessageToolExecutionCompactGroup>
  );
}

export function ChatMessageToolExecutionCollapseControl({
  renderState,
  onPress,
  styles,
}: ChatMessageToolExecutionCollapseControlProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        styles.placement,
      ]}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text style={styles.text}>
        {renderState.label}
      </Text>
    </Pressable>
  );
}

export function ChatMessageToolExecutionExpandedGroup({
  topCollapseRenderState,
  bottomCollapseRenderState,
  onCollapsePress,
  isPending,
  allSuccess,
  hasErrors,
  emptyState,
  styles,
  children,
}: ChatMessageToolExecutionExpandedGroupProps) {
  const collapseControlStyles = {
    button: styles.collapseButton,
    pressed: styles.collapsePressed,
    text: styles.collapseText,
  };

  return (
    <View style={styles.container}>
      <ChatMessageToolExecutionCollapseControl
        renderState={topCollapseRenderState}
        onPress={onCollapsePress}
        styles={{
          ...collapseControlStyles,
          placement: styles.collapseTopPlacement,
        }}
      />
      <View
        style={[
          styles.card,
          isPending && styles.pending,
          allSuccess && styles.success,
          hasErrors && styles.error,
        ]}
      >
        {children}
        {emptyState}
      </View>
      <ChatMessageToolExecutionCollapseControl
        renderState={bottomCollapseRenderState}
        onPress={onCollapsePress}
        styles={{
          ...collapseControlStyles,
          placement: styles.collapseBottomPlacement,
        }}
      />
    </View>
  );
}

export function ChatMessageToolExecutionPanel({
  shouldRender,
  isExpanded,
  compact,
  expanded,
  children,
}: ChatMessageToolExecutionPanelProps) {
  if (!shouldRender) return null;

  return (
    <>
      <ChatMessageToolExecutionCompactList
        shouldRender={!isExpanded}
        {...compact}
      />
      {isExpanded ? (
        <ChatMessageToolExecutionExpandedGroup {...expanded}>
          {children}
        </ChatMessageToolExecutionExpandedGroup>
      ) : null}
    </>
  );
}

export function ChatMessageToolExecutionStack({
  shouldRender,
  isExpanded,
  compact,
  expanded,
  detailRows,
  styles,
}: ChatMessageToolExecutionStackProps) {
  const { emptyState, ...expandedGroup } = expanded;

  return (
    <ChatMessageToolExecutionPanel
      shouldRender={shouldRender}
      isExpanded={isExpanded}
      compact={{
        ...compact,
        groupStyles: styles.compactGroup,
        rowStyles: styles.compactRow,
      }}
      expanded={{
        ...expandedGroup,
        emptyState: emptyState?.shouldRender ? (
          <ChatMessageToolExecutionEmptyState
            renderState={emptyState.renderState}
            style={styles.emptyStateText}
          />
        ) : null,
        styles: styles.expandedGroup,
      }}
    >
      <ChatMessageToolExecutionCallList
        rows={detailRows}
        styles={styles.callDetail}
      />
    </ChatMessageToolExecutionPanel>
  );
}

export function ChatMessageToolExecutionCopyButton({
  renderState,
  onPress,
  styles,
}: ChatMessageToolExecutionCopyButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text style={styles.text}>
        {renderState.label}
      </Text>
    </Pressable>
  );
}

export function ChatMessageToolExecutionDetailHeader({
  renderState,
  toolName,
  onPress,
  styles,
}: ChatMessageToolExecutionDetailHeaderProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.header,
        pressed && styles.headerPressed,
      ]}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityState={renderState.accessibilityState}
      aria-expanded={renderState.ariaExpanded}
      accessibilityHint={renderState.accessibilityHint}
    >
      <Text style={styles.toolName}>
        {toolName}
      </Text>
      <View style={styles.expandHint}>
        <Ionicons
          name={renderState.toggleIcon.name}
          size={renderState.toggleIcon.size}
          color={renderState.toggleIcon.color}
        />
        <Text style={styles.expandHintText}>
          {renderState.toggleLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export function ChatMessageToolExecutionCallSection({
  renderState,
  toolName,
  onHeaderPress,
  styles,
  children,
}: ChatMessageToolExecutionCallSectionProps) {
  return (
    <View style={styles.section}>
      <ChatMessageToolExecutionDetailHeader
        renderState={renderState}
        toolName={toolName}
        onPress={onHeaderPress}
        styles={styles.header}
      />
      {children}
    </View>
  );
}

export function ChatMessageToolExecutionResultBadge({
  badge,
  styles,
}: ChatMessageToolExecutionResultBadgeProps) {
  return (
    <View
      accessible
      accessibilityRole={badge.accessibilityRole}
      accessibilityLabel={badge.accessibilityLabel}
      style={[
        styles.badge,
        badge.isSuccess ? styles.badgeSuccess : styles.badgeError,
      ]}
    >
      <Ionicons
        name={badge.icon.name}
        size={badge.icon.size}
        color={badge.icon.color}
      />
      <Text
        style={[
          styles.text,
          badge.isSuccess ? styles.textSuccess : styles.textError,
        ]}
      >
        {badge.label}
      </Text>
    </View>
  );
}

export function ChatMessageToolExecutionPendingResult({
  renderState,
  styles,
}: ChatMessageToolExecutionPendingResultProps) {
  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={styles.row}
    >
      <ActivityIndicator
        size={renderState.spinner.size}
        color={renderState.spinner.color}
      />
      <Text style={styles.text}>
        {renderState.label}
      </Text>
    </View>
  );
}

export function ChatMessageToolExecutionEmptyState({
  renderState,
  style,
}: ChatMessageToolExecutionEmptyStateProps) {
  return (
    <Text
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={style}
    >
      {renderState.label}
    </Text>
  );
}

export function ChatMessageToolExecutionPayloadMeta({
  renderState,
  styles,
}: ChatMessageToolExecutionPayloadMetaProps) {
  const content = (
    <>
      <Text style={styles.label}>
        {renderState.label}
      </Text>
      {renderState.payloadTypeLabel ? (
        <Text style={styles.payloadType}>
          {renderState.payloadTypeLabel}
        </Text>
      ) : null}
    </>
  );

  if (!styles.row) {
    return content;
  }

  return (
    <View style={styles.row}>
      {content}
    </View>
  );
}

export function ChatMessageToolExecutionResultHeader({
  payloadRenderState,
  resultBadge,
  characterCountLabel,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatMessageToolExecutionResultHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.meta}>
        <ChatMessageToolExecutionPayloadMeta
          renderState={payloadRenderState}
          styles={styles.payloadMeta}
        />
        <ChatMessageToolExecutionResultBadge
          badge={resultBadge}
          styles={styles.badge}
        />
        <Text style={styles.characterCount}>
          {characterCountLabel}
        </Text>
      </View>
      <ChatMessageToolExecutionCopyButton
        renderState={copyButtonRenderState}
        onPress={onCopyPress}
        styles={styles.copyButton}
      />
    </View>
  );
}

export function ChatMessageToolExecutionPayloadBlock({
  compactText,
  content,
  isExpanded,
  previewNumberOfLines,
  styles,
}: ChatMessageToolExecutionPayloadBlockProps) {
  return (
    <>
      {compactText ? (
        <Text
          style={styles.preview}
          numberOfLines={previewNumberOfLines}
        >
          {compactText}
        </Text>
      ) : null}
      <ScrollView
        style={isExpanded ? styles.scrollExpanded : styles.scroll}
        nestedScrollEnabled
      >
        <Text style={styles.code}>
          {content}
        </Text>
      </ScrollView>
    </>
  );
}

export function ChatMessageToolExecutionPayloadSection({
  payloadRenderState,
  compactText,
  content,
  isExpanded,
  previewNumberOfLines,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatMessageToolExecutionPayloadSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <ChatMessageToolExecutionPayloadMeta
          renderState={payloadRenderState}
          styles={styles.payloadMeta}
        />
        <ChatMessageToolExecutionCopyButton
          renderState={copyButtonRenderState}
          onPress={onCopyPress}
          styles={styles.copyButton}
        />
      </View>
      <ChatMessageToolExecutionPayloadBlock
        compactText={compactText}
        content={content}
        isExpanded={isExpanded}
        previewNumberOfLines={previewNumberOfLines}
        styles={styles.payloadBlock}
      />
    </View>
  );
}

export function ChatMessageToolExecutionErrorBlock({
  renderState,
  error,
  copyButtonRenderState,
  onCopyPress,
  styles,
}: ChatMessageToolExecutionErrorBlockProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          {renderState.label}
        </Text>
        <ChatMessageToolExecutionCopyButton
          renderState={copyButtonRenderState}
          onPress={onCopyPress}
          styles={styles.copyButton}
        />
      </View>
      <Text style={styles.text}>
        {error}
      </Text>
    </View>
  );
}

export function ChatMessageToolExecutionResultSection({
  payloadRenderState,
  resultBadge,
  characterCountLabel,
  resultCompactText,
  resultContent,
  isExpanded,
  previewNumberOfLines,
  copyButtonRenderState,
  onCopyPress,
  errorRenderState,
  error,
  errorCopyButtonRenderState,
  onErrorCopyPress,
  styles,
}: ChatMessageToolExecutionResultSectionProps) {
  return (
    <View style={styles.item}>
      <ChatMessageToolExecutionResultHeader
        payloadRenderState={payloadRenderState}
        resultBadge={resultBadge}
        characterCountLabel={characterCountLabel}
        copyButtonRenderState={copyButtonRenderState}
        onCopyPress={onCopyPress}
        styles={styles.header}
      />
      <ChatMessageToolExecutionPayloadBlock
        compactText={resultCompactText}
        content={resultContent}
        isExpanded={isExpanded}
        previewNumberOfLines={previewNumberOfLines}
        styles={styles.payloadBlock}
      />
      {error ? (
        <ChatMessageToolExecutionErrorBlock
          renderState={errorRenderState}
          error={error}
          copyButtonRenderState={errorCopyButtonRenderState}
          onCopyPress={onErrorCopyPress}
          styles={styles.errorBlock}
        />
      ) : null}
    </View>
  );
}

export function ChatMessageToolExecutionCallDetail({
  renderState,
  toolName,
  onHeaderPress,
  input,
  result,
  pendingResult,
  styles,
}: ChatMessageToolExecutionCallDetailProps) {
  return (
    <ChatMessageToolExecutionCallSection
      renderState={renderState}
      toolName={toolName}
      onHeaderPress={onHeaderPress}
      styles={styles.callSection}
    >
      {input ? (
        <ChatMessageToolExecutionPayloadSection
          payloadRenderState={input.payloadRenderState}
          compactText={input.compactText}
          content={input.content}
          isExpanded={input.isExpanded}
          previewNumberOfLines={input.previewNumberOfLines}
          copyButtonRenderState={input.copyButtonRenderState}
          onCopyPress={input.onCopyPress}
          styles={styles.payloadSection}
        />
      ) : null}
      {result ? (
        <ChatMessageToolExecutionResultSection
          payloadRenderState={result.payloadRenderState}
          resultBadge={result.resultBadge}
          characterCountLabel={result.characterCountLabel}
          resultCompactText={result.resultCompactText}
          resultContent={result.resultContent}
          isExpanded={result.isExpanded}
          previewNumberOfLines={result.previewNumberOfLines}
          copyButtonRenderState={result.copyButtonRenderState}
          onCopyPress={result.onCopyPress}
          errorRenderState={result.errorRenderState}
          error={result.error}
          errorCopyButtonRenderState={result.errorCopyButtonRenderState}
          onErrorCopyPress={result.onErrorCopyPress}
          styles={styles.resultSection}
        />
      ) : pendingResult ? (
        <ChatMessageToolExecutionPendingResult
          renderState={pendingResult.renderState}
          styles={styles.pendingResult}
        />
      ) : null}
    </ChatMessageToolExecutionCallSection>
  );
}

export function ChatMessageToolExecutionCallList({
  rows,
  styles,
}: ChatMessageToolExecutionCallListProps) {
  return (
    <>
      {rows.map((row) => (
        <ChatMessageToolExecutionCallDetail
          key={row.key}
          renderState={row.renderState}
          toolName={row.toolName}
          onHeaderPress={row.onHeaderPress}
          input={row.input}
          result={row.result}
          pendingResult={row.pendingResult}
          styles={styles}
        />
      ))}
    </>
  );
}

export function ChatMessageConversationFrame({
  children,
  dock,
  overlays,
  keyboardAvoidingStyle,
  keyboardAvoidingBehavior,
  keyboardVerticalOffset,
  rootStyle,
}: ChatMessageConversationFrameProps) {
  return (
    <KeyboardAvoidingView
      style={keyboardAvoidingStyle}
      behavior={keyboardAvoidingBehavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={rootStyle}>
        {children}
        {dock}
      </View>
      {overlays}
    </KeyboardAvoidingView>
  );
}

export function ChatMessageConversationOverlays({
  agentSelector,
  promptEditor,
}: ChatMessageConversationOverlaysProps) {
  return (
    <>
      {agentSelector}
      {promptEditor}
    </>
  );
}

export function ChatMessageRuntimeOverlays({
  agentSelector,
  promptEditor,
}: ChatMessageRuntimeOverlaysProps) {
  return (
    <ChatMessageConversationOverlays
      agentSelector={<AgentSelectorSheet {...agentSelector} />}
      promptEditor={(
        <ChatConversationHomePromptEditorModal {...promptEditor} />
      )}
    />
  );
}

export function ChatMessageScrollViewport({
  children,
  scrollRef,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps,
  contentInsetAdjustmentBehavior,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  scrollEventThrottle,
}: ChatMessageScrollViewportProps) {
  return (
    <ScrollView
      ref={scrollRef}
      style={style}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      scrollEventThrottle={scrollEventThrottle}
    >
      {children}
    </ScrollView>
  );
}

export function ChatMessageConversationViewportContent({
  loadingState,
  homeState,
  historyBanner,
  stepSummary,
  children,
  debugPanels,
}: ChatMessageConversationViewportContentProps) {
  return (
    <>
      {loadingState}
      {homeState}
      {historyBanner}
      {stepSummary}
      {children}
      {debugPanels}
    </>
  );
}

export function ChatMessageConversationViewport({
  children,
  loadingState,
  homeState,
  historyBanner,
  stepSummary,
  debugPanels,
  ...scrollViewportProps
}: ChatMessageConversationViewportProps) {
  return (
    <ChatMessageScrollViewport {...scrollViewportProps}>
      <ChatMessageConversationViewportContent
        loadingState={loadingState}
        homeState={homeState}
        historyBanner={historyBanner}
        stepSummary={stepSummary}
        debugPanels={debugPanels}
      >
        {children}
      </ChatMessageConversationViewportContent>
    </ChatMessageScrollViewport>
  );
}

export function ChatMessageRuntimeViewport<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  children,
  loadingState,
  homeQuickStarts,
  historyBanner,
  stepSummary,
  debugPanels,
  styles,
  ...scrollViewportProps
}: ChatMessageRuntimeViewportProps<TPrompt, TTask>) {
  return (
    <ChatMessageConversationViewport
      {...scrollViewportProps}
      style={styles.scrollViewport.style}
      contentContainerStyle={styles.scrollViewport.contentContainerStyle}
      loadingState={(
        <ChatMessageLoadingState
          {...loadingState}
          style={styles.loadingState.style}
          spinnerStyle={styles.loadingState.spinnerStyle}
        />
      )}
      homeState={(
        <ChatConversationHomeQuickStarts
          {...homeQuickStarts}
          styles={styles.homeQuickStarts}
        />
      )}
      historyBanner={(
        <ChatMessageHistoryBanner
          {...historyBanner}
          styles={styles.historyBanner}
        />
      )}
      stepSummary={(
        <ChatMessageStepSummaryCard
          {...stepSummary}
          styles={styles.stepSummary}
        />
      )}
      debugPanels={(
        <ChatMessageDebugPanelStack
          {...debugPanels}
          panelStyle={styles.debugPanels.panelStyle}
          textStyle={styles.debugPanels.textStyle}
        />
      )}
    >
      {children}
    </ChatMessageConversationViewport>
  );
}

export function ChatMessageRuntimeSurface<
  TPrompt extends PredefinedPromptSummary,
  TTask extends PromptLibraryTaskLike & { id: string },
>({
  children,
  frame,
  dock,
  overlays,
  viewport,
  styles,
}: ChatMessageRuntimeSurfaceProps<TPrompt, TTask>) {
  return (
    <ChatMessageConversationFrame
      keyboardAvoidingStyle={styles.frame.keyboardAvoidingStyle}
      keyboardAvoidingBehavior={frame.keyboardAvoidingBehavior}
      keyboardVerticalOffset={frame.keyboardVerticalOffset}
      rootStyle={styles.frame.rootStyle}
      dock={(
        <ChatMessageRuntimeDock
          {...dock}
          styles={styles.dock}
        />
      )}
      overlays={(
        <ChatMessageRuntimeOverlays
          {...overlays}
        />
      )}
    >
      <ChatMessageRuntimeViewport
        {...viewport}
        styles={styles.viewport}
      >
        {children}
      </ChatMessageRuntimeViewport>
    </ChatMessageConversationFrame>
  );
}

export function ChatMessageHistoryBanner({
  renderState,
  onLoadEarlier,
  styles,
}: ChatMessageHistoryBannerProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        {renderState.summaryLabel}
      </Text>
      <Pressable
        onPress={onLoadEarlier}
        accessibilityRole={renderState.loadButton.accessibilityRole}
        accessibilityLabel={renderState.loadButton.accessibilityLabel}
        style={({ pressed }) => [
          styles.loadButton,
          pressed && styles.loadButtonPressed,
        ]}
      >
        <Ionicons
          name={renderState.loadButton.icon.name}
          size={renderState.loadButton.icon.size}
          color={renderState.loadButton.icon.color}
        />
        <Text style={styles.loadButtonText}>
          {renderState.loadButton.label}
        </Text>
      </Pressable>
    </View>
  );
}

export function ChatMessageStepSummaryCard({
  renderState,
  styles,
}: ChatMessageStepSummaryCardProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text
          style={styles.title}
          numberOfLines={renderState.surface.titleNumberOfLines}
        >
          {renderState.title}
        </Text>
        <View style={styles.badge}>
          <Text
            style={styles.badgeText}
            numberOfLines={renderState.surface.badgeNumberOfLines}
          >
            {renderState.badgeLabel}
          </Text>
        </View>
      </View>
      <Text
        style={styles.action}
        numberOfLines={renderState.surface.actionNumberOfLines}
      >
        {renderState.actionSummary}
      </Text>
      <Text
        style={styles.meta}
        numberOfLines={renderState.surface.metaNumberOfLines}
      >
        {renderState.meta}
      </Text>
      {renderState.preview ? (
        <Text
          style={styles.preview}
          numberOfLines={renderState.surface.previewNumberOfLines}
        >
          {renderState.preview}
        </Text>
      ) : null}
    </View>
  );
}

export function ChatMessageScrollToBottomButton({
  renderState,
  onPress,
  style,
}: ChatMessageScrollToBottomButtonProps) {
  if (!renderState.shouldRender) return null;

  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      activeOpacity={renderState.button.pressedOpacity}
      accessibilityRole={renderState.button.accessibilityRole}
      accessibilityLabel={renderState.button.accessibilityLabel}
      accessibilityHint={renderState.button.accessibilityHint}
    >
      <Ionicons
        name={renderState.button.icon.name}
        size={renderState.button.icon.size}
        color={renderState.button.icon.color}
      />
    </TouchableOpacity>
  );
}

export function ChatMessageLoadingState({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatMessageLoadingStateProps) {
  if (!renderState.shouldRender) return null;

  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityState={renderState.accessibilityState}
      style={style}
    >
      <Image
        source={spinnerSource}
        style={spinnerStyle}
        resizeMode={renderState.spinnerResizeMode}
      />
    </View>
  );
}

export function ChatMessageDebugPanel({
  shouldRender,
  rows,
  panelStyle,
  textStyle,
}: ChatMessageDebugPanelProps) {
  if (!shouldRender || rows.length === 0) return null;

  return (
    <View style={panelStyle}>
      {rows.map((row) => (
        <Text key={row.key} style={textStyle}>
          {row.text}
        </Text>
      ))}
    </View>
  );
}

export function ChatMessageDebugPanelStack({
  requestShouldRender,
  requestRows,
  voiceShouldRender,
  voiceRows,
  panelStyle,
  textStyle,
}: ChatMessageDebugPanelStackProps) {
  return (
    <>
      <ChatMessageDebugPanel
        shouldRender={requestShouldRender}
        rows={requestRows}
        panelStyle={panelStyle}
        textStyle={textStyle}
      />
      <ChatMessageDebugPanel
        shouldRender={voiceShouldRender}
        rows={voiceRows}
        panelStyle={panelStyle}
        textStyle={textStyle}
      />
    </>
  );
}

export function ChatMessageConversationDock({
  responseHistoryPanel,
  scrollToBottomButton,
  voiceOverlay,
  queuePanel,
  connectionBanner,
  composer,
}: ChatMessageConversationDockProps) {
  return (
    <>
      {responseHistoryPanel}
      {scrollToBottomButton}
      {voiceOverlay}
      {queuePanel}
      {connectionBanner}
      {composer}
    </>
  );
}

export function ChatMessageRuntimeDock({
  responseHistoryPanel,
  scrollToBottomButton,
  voiceOverlay,
  queuePanel,
  connectionBanner,
  composer,
  styles,
}: ChatMessageRuntimeDockProps) {
  return (
    <ChatMessageConversationDock
      responseHistoryPanel={(
        <ChatMessageResponseHistoryPanelDock
          {...responseHistoryPanel}
        />
      )}
      scrollToBottomButton={(
        <ChatMessageScrollToBottomButton
          {...scrollToBottomButton}
          style={styles.scrollToBottomButtonStyle}
        />
      )}
      voiceOverlay={(
        <ChatComposerVoiceOverlay
          {...voiceOverlay}
          styles={styles.voiceOverlay}
        />
      )}
      queuePanel={(
        <ChatMessageQueuePanelDock
          {...queuePanel}
          style={styles.queuePanelStyle}
        />
      )}
      connectionBanner={(
        <ChatMessageConnectionBanner
          {...connectionBanner}
          styles={styles.connectionBanner}
        />
      )}
      composer={(
        <ChatComposerRuntimeDock
          {...composer}
          styles={styles.composer}
        />
      )}
    />
  );
}

export function ChatMessageResponseHistoryPanelDock(panelProps: ChatMessageResponseHistoryPanelDockProps) {
  return <ResponseHistoryPanel {...panelProps} />;
}

export function ChatMessageQueuePanelDock({
  shouldRender,
  panel,
  style,
}: ChatMessageQueuePanelDockProps) {
  if (!shouldRender) return null;

  return (
    <View style={style}>
      <MessageQueuePanel {...panel} />
    </View>
  );
}

export function ChatMessageConnectionBanner({
  renderState,
  onRetry,
  styles,
}: ChatMessageConnectionBannerProps) {
  return (
    <>
      {renderState.reconnecting.shouldRender ? (
        <View
          accessible
          accessibilityRole={renderState.reconnecting.accessibilityRole}
          accessibilityLabel={renderState.reconnecting.accessibilityLabel}
          style={[styles.banner, styles.reconnecting]}
        >
          <View style={styles.content}>
            <ActivityIndicator
              size={renderState.reconnecting.spinner.size}
              color={renderState.reconnecting.spinner.color}
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {renderState.reconnecting.title}
              </Text>
              {renderState.reconnecting.subtitle ? (
                <Text
                  style={styles.subtitle}
                  numberOfLines={renderState.surface.subtitleNumberOfLines}
                >
                  {renderState.reconnecting.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
      {renderState.failed.shouldRender ? (
        <View
          accessible
          accessibilityRole={renderState.failed.accessibilityRole}
          accessibilityLabel={renderState.failed.accessibilityLabel}
          style={[styles.banner, styles.failed]}
        >
          <View style={styles.content}>
            <Ionicons
              name={renderState.failed.icon.name}
              size={renderState.failed.icon.size}
              color={renderState.failed.icon.color}
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {renderState.failed.title}
              </Text>
              <Text
                style={styles.subtitle}
                numberOfLines={renderState.surface.subtitleNumberOfLines}
              >
                {renderState.failed.subtitle}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              accessibilityRole={renderState.failed.retryButton.accessibilityRole}
              accessibilityLabel={renderState.failed.retryButton.accessibilityLabel}
              activeOpacity={renderState.failed.retryButton.pressedOpacity}
            >
              <Text style={styles.retryButtonText}>
                {renderState.failed.retryButton.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </>
  );
}

export function ChatComposerRuntimeDock({
  speechPreview,
  pendingImagesRail,
  handsFreeControls,
  imageAttachmentControl,
  textToSpeechControl,
  editBeforeSendControl,
  textEntry,
  queueAction,
  submitAction,
  micButton,
  micWrapperRef,
  styles,
}: ChatComposerRuntimeDockProps) {
  const { status: handsFreeStatus, ...handsFreeControlProps } = handsFreeControls;

  return (
    <ChatComposerInputDock
      speechPreview={(
        <ChatComposerSpeechPreview
          {...speechPreview}
          styles={styles.speechPreview}
        />
      )}
      pendingImagesRail={(
        <ChatComposerPendingImagesRail
          {...pendingImagesRail}
          styles={styles.pendingImagesRail}
        />
      )}
      handsFreeControls={(
        <ChatComposerHandsFreeControls
          {...handsFreeControlProps}
          status={<HandsFreeStatusChip {...handsFreeStatus} />}
          styles={styles.handsFreeControls}
        />
      )}
      imageAttachmentControl={(
        <ChatComposerIconButton
          {...imageAttachmentControl}
          style={styles.accessoryButton.style}
          activeStyle={styles.accessoryButton.activeStyle}
        />
      )}
      textToSpeechControl={(
        <ChatComposerIconButton
          {...textToSpeechControl}
          style={styles.accessoryButton.style}
          activeStyle={styles.accessoryButton.activeStyle}
        />
      )}
      editBeforeSendControl={(
        <ChatComposerIconButton
          {...editBeforeSendControl}
          style={styles.accessoryButton.style}
          activeStyle={styles.accessoryButton.activeStyle}
        />
      )}
      textEntry={(
        <ChatComposerTextEntry
          {...textEntry}
          styles={styles.textEntry}
        />
      )}
      queueAction={(
        <ChatComposerLabeledActionButton
          {...queueAction}
          styles={styles.queueAction}
        />
      )}
      submitAction={(
        <ChatComposerLabeledActionButton
          {...submitAction}
          styles={styles.submitAction}
        />
      )}
      micButton={(
        <ChatComposerMicButton
          {...micButton}
          styles={styles.micButton}
        />
      )}
      micWrapperRef={micWrapperRef}
      styles={styles.inputDock}
    />
  );
}

export function ChatComposerInputDock({
  speechPreview,
  pendingImagesRail,
  handsFreeControls,
  imageAttachmentControl,
  textToSpeechControl,
  editBeforeSendControl,
  textEntry,
  queueAction,
  submitAction,
  micButton,
  micWrapperRef,
  styles,
}: ChatComposerInputDockProps) {
  return (
    <View style={styles.area}>
      {speechPreview}
      {pendingImagesRail}
      {handsFreeControls}
      <View style={styles.row}>
        {imageAttachmentControl}
        {textToSpeechControl}
        {editBeforeSendControl}
        {textEntry}
        {queueAction}
        {submitAction}
      </View>
      <View
        ref={micWrapperRef}
        style={styles.micWrapper}
      >
        {micButton}
      </View>
    </View>
  );
}

export function ChatComposerSpeechPreview({
  label,
  text,
  styles,
}: ChatComposerSpeechPreviewProps) {
  if (!text) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.label}>
        {label}
      </Text>
      <Text style={styles.text}>
        {text}
      </Text>
    </View>
  );
}

export function ChatComposerPendingImagesRail({
  images,
  renderState,
  onRemove,
  styles,
}: ChatComposerPendingImagesRailProps) {
  if (images.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={renderState.surface.row.showsHorizontalScrollIndicator}
      contentContainerStyle={styles.row}
    >
      {images.map((image) => (
        <View key={image.id} style={styles.card}>
          <Image
            source={{ uri: image.previewUri }}
            style={styles.preview}
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(image.id)}
            activeOpacity={renderState.removeButton.pressedOpacity}
            accessibilityRole={renderState.removeButton.accessibilityRole}
            accessibilityLabel={renderState.removeButton.accessibilityLabel}
          >
            <Ionicons
              name={renderState.removeIcon.name}
              size={renderState.removeIcon.size}
              color={renderState.removeIcon.color}
            />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

export function ChatComposerVoiceOverlay({
  isVisible,
  label,
  transcript,
  transcriptNumberOfLines,
  styles,
}: ChatComposerVoiceOverlayProps) {
  if (!isVisible) return null;

  return (
    <View
      style={styles.overlay}
      pointerEvents="none"
    >
      <View style={styles.card}>
        <Text style={styles.label}>
          {label}
        </Text>
        {!!transcript && (
          <Text
            style={styles.transcript}
            numberOfLines={transcriptNumberOfLines}
          >
            {transcript}
          </Text>
        )}
      </View>
    </View>
  );
}

export function ChatComposerHandsFreeControls({
  isVisible,
  status,
  controlState,
  onWake,
  onSleep,
  onResume,
  onPause,
  controlPressedOpacity,
  styles,
}: ChatComposerHandsFreeControlsProps) {
  if (!isVisible) return null;

  const primaryOnPress = controlState.primary.action === 'wake'
    ? onWake
    : onSleep;
  const secondaryOnPress = controlState.secondary.action === 'resume'
    ? onResume
    : onPause;

  return (
    <>
      <View style={styles.statusRow}>
        {status}
      </View>
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={primaryOnPress}
          activeOpacity={controlPressedOpacity}
          accessibilityRole={controlState.primary.accessibilityRole}
          accessibilityLabel={controlState.primary.accessibilityLabel}
        >
          <Text style={styles.controlButtonText}>
            {controlState.primary.label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={secondaryOnPress}
          activeOpacity={controlPressedOpacity}
          accessibilityRole={controlState.secondary.accessibilityRole}
          accessibilityLabel={controlState.secondary.accessibilityLabel}
        >
          <Text style={styles.controlButtonText}>
            {controlState.secondary.label}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

export function ChatComposerIconButton({
  shouldRender = true,
  renderState,
  onPress,
  activeOpacity,
  style,
  activeStyle,
}: ChatComposerIconButtonProps) {
  if (!shouldRender) return null;

  return (
    <TouchableOpacity
      style={[style, renderState.isActive && activeStyle]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint ?? undefined}
      accessibilityState={renderState.accessibilityState}
      aria-checked={renderState.ariaChecked}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
    </TouchableOpacity>
  );
}

export function ChatComposerLabeledActionButton({
  shouldRender = true,
  renderState,
  onPress,
  activeOpacity,
  styles,
}: ChatComposerLabeledActionButtonProps) {
  if (!shouldRender) return null;

  return (
    <TouchableOpacity
      style={[styles.button, renderState.isDisabled && styles.disabledButton]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={renderState.isDisabled}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint ?? undefined}
      accessibilityState={renderState.accessibilityState}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text style={styles.text}>
        {renderState.label}
      </Text>
    </TouchableOpacity>
  );
}

export function ChatComposerMicButton({
  renderState,
  onPressIn,
  onPressOut,
  onPress,
  webPressedStyle,
  styles,
}: ChatComposerMicButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        renderState.isActive && styles.activeButton,
        webPressedStyle,
      ]}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityHint={renderState.accessibilityHint ?? undefined}
      accessibilityState={renderState.accessibilityState}
      aria-busy={renderState.ariaBusy}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text
        style={[styles.label, renderState.isActive && styles.activeLabel]}
        selectable={renderState.labelSelectable}
      >
        {renderState.label}
      </Text>
    </Pressable>
  );
}

export function ChatComposerTextEntry({
  inputRef,
  value,
  onChangeText,
  onKeyPress,
  accessibilityLabel,
  accessibilityHint,
  placeholder,
  placeholderTextColor,
  voiceStatusLiveRegionAnnouncement,
  webAccessibility,
  styles,
}: ChatComposerTextEntryProps) {
  const voiceStatusAriaLive: ComponentProps<typeof Text>['aria-live'] =
    webAccessibility.voiceStatusLiveRegionPoliteness === 'none'
      ? 'off'
      : webAccessibility.voiceStatusLiveRegionPoliteness;

  return (
    <>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        aria-describedby={webAccessibility.isWebPlatform ? webAccessibility.inputDescriptionNativeId : undefined}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline
      />
      {webAccessibility.isWebPlatform && (
        <Text
          nativeID={webAccessibility.inputDescriptionNativeId}
          style={styles.visuallyHiddenHint}
        >
          {accessibilityHint}
        </Text>
      )}
      {webAccessibility.isWebPlatform && (
        <Text
          nativeID={webAccessibility.voiceStatusLiveRegionNativeId}
          style={styles.visuallyHiddenHint}
          accessibilityLiveRegion={webAccessibility.voiceStatusLiveRegionPoliteness}
          aria-live={voiceStatusAriaLive}
        >
          {voiceStatusLiveRegionAnnouncement}
        </Text>
      )}
    </>
  );
}

export function ChatMessageInlineActivity({
  renderState,
  spinnerSource,
  style,
  spinnerStyle,
}: ChatMessageInlineActivityProps) {
  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      accessibilityState={renderState.accessibilityState}
      style={style}
    >
      <Image
        source={spinnerSource}
        style={spinnerStyle}
        resizeMode={renderState.spinnerResizeMode}
      />
    </View>
  );
}

export function ChatMessageTurnDurationBadge({
  renderState,
  style,
  liveStyle,
  textStyle,
  liveTextStyle,
}: ChatMessageTurnDurationBadgeProps) {
  return (
    <View
      accessible
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={renderState.accessibilityLabel}
      style={[
        style,
        renderState.isLive && liveStyle,
      ]}
    >
      <Ionicons
        name={renderState.icon.name}
        size={renderState.icon.size}
        color={renderState.icon.color}
      />
      <Text
        style={[
          textStyle,
          renderState.isLive && liveTextStyle,
        ]}
        numberOfLines={renderState.badge.numberOfLines}
      >
        {renderState.label}
      </Text>
    </View>
  );
}

export function ChatMessageExpandedContent({
  streamingRenderState,
  markdownContent,
  assetBaseUrl,
  assetAuthToken,
  spinnerSource,
  streamingStyles,
}: ChatMessageExpandedContentProps) {
  if (!streamingRenderState.shouldRender) {
    return (
      <MarkdownRenderer
        content={markdownContent}
        assetBaseUrl={assetBaseUrl}
        assetAuthToken={assetAuthToken}
      />
    );
  }

  return (
    <>
      <View
        accessible
        accessibilityRole={streamingRenderState.accessibilityRole}
        accessibilityLabel={streamingRenderState.accessibilityLabel}
        style={streamingStyles.header}
      >
        <Ionicons
          name={streamingRenderState.icon.name}
          size={streamingRenderState.icon.size}
          color={streamingRenderState.icon.color}
        />
        <Text
          style={streamingStyles.title}
          numberOfLines={streamingRenderState.surface.titleNumberOfLines}
        >
          {streamingRenderState.title}
        </Text>
        <Image
          source={spinnerSource}
          style={streamingStyles.spinner}
          resizeMode={streamingRenderState.spinner.resizeMode}
        />
        <View style={streamingStyles.badge}>
          <Text style={streamingStyles.badgeText}>
            {streamingRenderState.badgeLabel}
          </Text>
        </View>
      </View>
      <View style={streamingStyles.bodyRow}>
        <Text style={streamingStyles.text}>
          {streamingRenderState.content}
        </Text>
        <View style={streamingStyles.caret} />
      </View>
    </>
  );
}

export function ChatMessageCollapsedPreview({
  renderState,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  ariaExpanded,
  style,
  pressedStyle,
  textStyle,
}: ChatMessageCollapsedPreviewProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={renderState.accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      aria-expanded={ariaExpanded}
      hitSlop={renderState.hitSlop}
      style={({ pressed }) => [
        style,
        pressed && !disabled && pressedStyle,
      ]}
    >
      <Text
        style={textStyle}
        numberOfLines={renderState.numberOfLines}
      >
        {renderState.text}
      </Text>
    </Pressable>
  );
}

export function ChatMessageConversationContent({
  contentState,
  rowStyle,
  slots,
  components,
  expanded,
  collapsed,
}: ChatMessageConversationContentProps) {
  if (contentState.shouldRenderExpandedContent) {
    return (
      <ChatMessageContentRow
        rowStyle={rowStyle}
        bodyStyle={expanded.bodyStyle}
        slots={slots}
        components={components}
      >
        <ChatMessageExpandedContent
          streamingRenderState={expanded.streamingRenderState}
          markdownContent={expanded.markdownContent}
          assetBaseUrl={expanded.assetBaseUrl}
          assetAuthToken={expanded.assetAuthToken}
          spinnerSource={expanded.spinnerSource}
          streamingStyles={expanded.streamingStyles}
        />
      </ChatMessageContentRow>
    );
  }

  if (contentState.shouldRenderCollapsedTextPreview) {
    return (
      <ChatMessageContentRow
        rowStyle={rowStyle}
        slots={slots}
        components={components}
      >
        <ChatMessageCollapsedPreview
          renderState={collapsed.renderState}
          onPress={collapsed.onPress}
          disabled={collapsed.disabled}
          accessibilityLabel={collapsed.accessibilityLabel}
          accessibilityHint={collapsed.accessibilityHint}
          accessibilityState={collapsed.accessibilityState}
          ariaExpanded={collapsed.ariaExpanded}
          style={collapsed.style}
          pressedStyle={collapsed.pressedStyle}
          textStyle={collapsed.textStyle}
        />
      </ChatMessageContentRow>
    );
  }

  return null;
}

export function ChatMessageContentRow({
  children,
  slots,
  components,
  rowStyle,
  bodyStyle,
}: ChatMessageContentRowProps) {
  return (
    <View style={rowStyle}>
      {bodyStyle ? (
        <View style={bodyStyle}>
          {children}
        </View>
      ) : children}
      <ChatMessageActionSlotList
        slots={slots}
        components={components}
      />
    </View>
  );
}

export function ChatMessageStandaloneActions({
  shouldRender,
  slots,
  components,
  rowStyle,
}: ChatMessageStandaloneActionsProps) {
  if (!shouldRender) return null;

  return (
    <ChatMessageActionSlotList
      slots={slots}
      components={components}
      rowStyle={rowStyle}
    />
  );
}

export function ChatMessageActionSlotList({
  slots,
  components,
  rowStyle,
}: ChatMessageActionSlotListProps) {
  const content = slots.map((actionSlot) => (
    <Fragment key={actionSlot}>
      {components[actionSlot]}
    </Fragment>
  ));

  if (rowStyle) {
    return <View style={rowStyle}>{content}</View>;
  }

  return <>{content}</>;
}
