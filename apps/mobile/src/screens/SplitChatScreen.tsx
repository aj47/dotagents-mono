import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ChatMessage } from '../lib/openaiClient';
import { createButtonAccessibilityLabel } from '@dotagents/shared/accessibility-utils';
import { ConfigContext, useConfigContext } from '../store/config';
import { SessionContext, useSessionContext } from '../store/sessions';
import type { SessionStore } from '../store/sessions';
import type { SessionListItem } from '@dotagents/shared/session';
import { useTheme } from '../ui/ThemeProvider';
import { radius, spacing } from '../ui/theme';
import type { Theme } from '../ui/theme';
import ChatScreen from './ChatScreen';
import {
  formatSplitPaneChooseAccessibilityLabel,
  formatSplitPaneModalTitle,
  formatSplitPaneOpenAccessibilityLabel,
  getSplitPaneEmptyStateActionMobileIconState,
  getSplitPaneModalCreateMobileIconState,
  getSplitPaneCopyState,
  getSplitPaneMobileSurfaceColors,
  getSplitPaneMobileSurfaceState,
  getSplitPaneToolbarActionMobileIconState,
  reconcileSplitPaneSelection,
  replaceSplitPaneSelection,
  resolveSplitOrientation,
  type SplitOrientationPreference,
  type SplitPane,
  type SplitPaneMobileSurfaceColors,
} from '@dotagents/shared/split-pane-selection';

const splitPaneCopy = getSplitPaneCopyState();
const splitPaneSurface = getSplitPaneMobileSurfaceState();
const splitPaneToolbarChooseIcon = getSplitPaneToolbarActionMobileIconState('choose');
const splitPaneToolbarOpenIcon = getSplitPaneToolbarActionMobileIconState('open');
const splitPaneEmptyChooseIcon = getSplitPaneEmptyStateActionMobileIconState('choose');
const splitPaneEmptyNewChatIcon = getSplitPaneEmptyStateActionMobileIconState('newChat');
const splitPaneModalCreateIcon = getSplitPaneModalCreateMobileIconState();

interface Props {
  navigation: any;
}

function createSplitPaneSessionStore(
  baseStore: SessionStore,
  sessionId: string | null,
  onPaneSessionChange: (nextSessionId: string | null) => void,
): SessionStore {
  const getPaneSession = () => sessionId ? baseStore.sessions.find((entry) => entry.id === sessionId) ?? null : null;

  return {
    ...baseStore,
    currentSessionId: sessionId,
    createNewSession: () => {
      const createdSession = baseStore.createNewSession();
      onPaneSessionChange(createdSession.id);
      return createdSession;
    },
    setCurrentSession: (id) => {
      onPaneSessionChange(id);
      baseStore.setCurrentSession(id);
    },
    deleteSession: async (id) => {
      const fallbackSessionId = sessionId === id
        ? baseStore.getSessionList().find((entry) => entry.id !== id)?.id ?? null
        : sessionId;
      await baseStore.deleteSession(id);
      if (sessionId === id) {
        onPaneSessionChange(fallbackSessionId);
      }
    },
    clearAllSessions: async () => {
      await baseStore.clearAllSessions();
      onPaneSessionChange(null);
    },
    addMessage: async (role, content, toolCalls, toolResults) => {
      const paneSession = getPaneSession();
      if (!paneSession) return;
      const nextMessages: ChatMessage[] = [
        ...paneSession.messages,
        { role, content, toolCalls, toolResults, timestamp: Date.now() } as ChatMessage,
      ];
      await baseStore.setMessagesForSession(paneSession.id, nextMessages);
    },
    getCurrentSession: () => getPaneSession(),
    setMessages: async (messages) => {
      if (!sessionId) return;
      await baseStore.setMessagesForSession(sessionId, messages);
    },
    setServerConversationId: async (serverConversationId) => {
      if (!sessionId) return;
      await baseStore.setServerConversationIdForSession(sessionId, serverConversationId);
    },
    getServerConversationId: () => getPaneSession()?.serverConversationId,
  };
}

export default function SplitChatScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const splitPaneColors = useMemo(
    () => getSplitPaneMobileSurfaceColors(theme.colors),
    [theme.colors],
  );
  const styles = useMemo(() => createStyles(theme, splitPaneColors), [theme, splitPaneColors]);
  const configStore = useConfigContext();
  const sessionStore = useSessionContext();
  const sessionList = useMemo(() => sessionStore.getSessionList(), [sessionStore.sessions]);
  const sessionIdsKey = useMemo(() => sessionList.map((entry) => entry.id).join('|'), [sessionList]);
  const [layoutPreference, setLayoutPreference] = useState<SplitOrientationPreference>('auto');
  const [pickerPane, setPickerPane] = useState<SplitPane | null>(null);
  const [selection, setSelection] = useState({ primary: null as string | null, secondary: null as string | null });

  useEffect(() => {
    if (!sessionStore.ready) return;
    setSelection((current) => reconcileSplitPaneSelection(current, sessionList.map((entry) => entry.id), sessionStore.currentSessionId));
  }, [sessionStore.ready, sessionStore.currentSessionId, sessionIdsKey]);

  const setPrimarySessionId = useCallback((nextSessionId: string | null) => {
    setSelection((current) => replaceSplitPaneSelection(current, 'primary', nextSessionId));
  }, []);

  const setSecondarySessionId = useCallback((nextSessionId: string | null) => {
    setSelection((current) => replaceSplitPaneSelection(current, 'secondary', nextSessionId));
  }, []);

  const primaryStore = useMemo(
    () => createSplitPaneSessionStore(sessionStore, selection.primary, setPrimarySessionId),
    [selection.primary, sessionStore, setPrimarySessionId],
  );
  const secondaryStore = useMemo(
    () => createSplitPaneSessionStore(sessionStore, selection.secondary, setSecondarySessionId),
    [selection.secondary, sessionStore, setSecondarySessionId],
  );

  const effectiveOrientation = resolveSplitOrientation(layoutPreference, width, height);
  const splitConfigValue = useMemo(() => ({
    ...configStore,
    config: {
      ...configStore.config,
      handsFree: false,
      handsFreeDebug: false,
    },
  }), [configStore]);

  const createSessionForPane = useCallback((pane: SplitPane) => {
    const createdSession = sessionStore.createNewSession();
    if (pane === 'primary') {
      setPrimarySessionId(createdSession.id);
      return;
    }
    setSecondarySessionId(createdSession.id);
  }, [sessionStore, setPrimarySessionId, setSecondarySessionId]);

  const openFullScreenChat = useCallback((sessionId: string | null) => {
    if (!sessionId) return;
    sessionStore.setCurrentSession(sessionId);
    navigation.navigate('Chat');
  }, [navigation, sessionStore]);

  const renderPane = useCallback((pane: SplitPane, sessionId: string | null, store: SessionStore) => {
    const session = sessionList.find((entry) => entry.id === sessionId) ?? null;
    return (
      <View style={[styles.pane, effectiveOrientation === 'vertical' ? styles.paneVertical : styles.paneHorizontal]}>
        <View style={styles.paneToolbar}>
          <View style={styles.paneToolbarTextWrap}>
            <Text style={styles.paneLabel}>{splitPaneCopy.paneLabel[pane]}</Text>
            <Text style={styles.paneTitle} numberOfLines={splitPaneSurface.paneTitle.numberOfLines}>{session?.title || splitPaneCopy.noChatSelected}</Text>
          </View>
          <View style={styles.paneToolbarActions}>
            <TouchableOpacity
              onPress={() => setPickerPane(pane)}
              style={styles.toolbarButton}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(formatSplitPaneChooseAccessibilityLabel(pane))}
            >
              <Ionicons
                name={splitPaneToolbarChooseIcon.name}
                size={splitPaneToolbarChooseIcon.size}
                color={splitPaneColors.toolbarButton.iconColor}
              />
              <Text style={styles.toolbarButtonText}>{splitPaneCopy.toolbar.chooseLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openFullScreenChat(sessionId)}
              disabled={!sessionId}
              style={[styles.toolbarButton, !sessionId && styles.toolbarButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(formatSplitPaneOpenAccessibilityLabel(pane))}
            >
              <Ionicons
                name={splitPaneToolbarOpenIcon.name}
                size={splitPaneToolbarOpenIcon.size}
                color={splitPaneColors.toolbarButton.iconColor}
              />
              <Text style={styles.toolbarButtonText}>{splitPaneCopy.toolbar.openLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.paneBody}>
          {sessionId ? (
            <SessionContext.Provider value={store}>
              <ChatScreen route={{ params: { splitView: true, pane } }} navigation={undefined} />
            </SessionContext.Provider>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>{splitPaneCopy.emptyState.title}</Text>
              <Text style={styles.emptyStateCopy}>
                {splitPaneCopy.emptyState.copy}
              </Text>
              <View style={styles.emptyStateActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setPickerPane(pane)}>
                  <Ionicons
                    name={splitPaneEmptyChooseIcon.name}
                    size={splitPaneEmptyChooseIcon.size}
                    color={splitPaneColors.primaryButton.iconColor}
                  />
                  <Text style={styles.primaryButtonText}>{splitPaneCopy.emptyState.chooseLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => createSessionForPane(pane)}>
                  <Ionicons
                    name={splitPaneEmptyNewChatIcon.name}
                    size={splitPaneEmptyNewChatIcon.size}
                    color={splitPaneColors.secondaryButton.iconColor}
                  />
                  <Text style={styles.secondaryButtonText}>{splitPaneCopy.emptyState.newChatLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }, [createSessionForPane, effectiveOrientation, openFullScreenChat, sessionList, splitPaneColors, styles]);

  return (
    <ConfigContext.Provider value={splitConfigValue}>
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <View style={styles.controlBar}>
          <Text style={styles.controlBarTitle}>{splitPaneCopy.title}</Text>
          <Text style={styles.controlBarCopy}>{splitPaneCopy.description}</Text>
          <View style={styles.segmentedRow}>
            {(['auto', 'horizontal', 'vertical'] as SplitOrientationPreference[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => setLayoutPreference(option)}
                style={[styles.segmentButton, layoutPreference === option && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentButtonText, layoutPreference === option && styles.segmentButtonTextActive]}>
                  {splitPaneCopy.orientationLabel[option]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.splitContainer, effectiveOrientation === 'vertical' ? styles.splitVertical : styles.splitHorizontal]}>
          {renderPane('primary', selection.primary, primaryStore)}
          {renderPane('secondary', selection.secondary, secondaryStore)}
        </View>

        <Modal transparent visible={pickerPane !== null} animationType="fade" onRequestClose={() => setPickerPane(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setPickerPane(null)}>
            <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
              <Text style={styles.modalTitle}>{formatSplitPaneModalTitle(pickerPane)}</Text>
              <FlatList<SessionListItem>
                data={sessionList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = (pickerPane === 'primary' ? selection.primary : selection.secondary) === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.sessionOption, isSelected && styles.sessionOptionActive]}
                      onPress={() => {
                        if (pickerPane === 'primary') setPrimarySessionId(item.id);
                        if (pickerPane === 'secondary') setSecondarySessionId(item.id);
                        setPickerPane(null);
                      }}
                    >
                      <Text style={styles.sessionOptionTitle} numberOfLines={splitPaneSurface.sessionOption.title.numberOfLines}>{item.title}</Text>
                      <Text style={styles.sessionOptionPreview} numberOfLines={splitPaneSurface.sessionOption.preview.numberOfLines}>{item.preview || splitPaneCopy.modal.sessionPreviewFallback}</Text>
                    </TouchableOpacity>
                  );
                }}
                ListFooterComponent={(
                  <TouchableOpacity
                    style={styles.newChatOption}
                    onPress={() => {
                      if (pickerPane) createSessionForPane(pickerPane);
                      setPickerPane(null);
                    }}
                  >
                    <Ionicons
                      name={splitPaneModalCreateIcon.name}
                      size={splitPaneModalCreateIcon.size}
                      color={splitPaneColors.newChatOption.iconColor}
                    />
                    <Text style={styles.newChatOptionText}>{splitPaneCopy.modal.createNewChatLabel}</Text>
                  </TouchableOpacity>
                )}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </ConfigContext.Provider>
  );
}

function createStyles(theme: Theme, splitPaneColors: SplitPaneMobileSurfaceColors) {
  const screenSurface = splitPaneSurface.screen;
  const controlBarSurface = splitPaneSurface.controlBar;
  const segmentedRowSurface = splitPaneSurface.segmentedRow;
  const segmentButtonSurface = splitPaneSurface.segmentButton;
  const splitContainerSurface = splitPaneSurface.splitContainer;
  const paneSurface = splitPaneSurface.pane;
  const paneToolbarSurface = splitPaneSurface.paneToolbar;
  const toolbarButtonSurface = splitPaneSurface.toolbarButton;
  const emptyStateSurface = splitPaneSurface.emptyState;
  const emptyStateActionsSurface = splitPaneSurface.emptyStateActions;
  const primaryButtonSurface = splitPaneSurface.primaryButton;
  const secondaryButtonSurface = splitPaneSurface.secondaryButton;
  const modalOverlaySurface = splitPaneSurface.modalOverlay;
  const modalCardSurface = splitPaneSurface.modalCard;
  const sessionOptionSurface = splitPaneSurface.sessionOption;
  const newChatOptionSurface = splitPaneSurface.newChatOption;
  const newChatOptionTextSurface = splitPaneSurface.newChatOptionText;
  return StyleSheet.create({
    screen: {
      flex: screenSurface.flex,
      backgroundColor: splitPaneColors.screen.backgroundColor,
      padding: spacing[screenSurface.padding],
      gap: spacing[screenSurface.gap],
    },
    controlBar: {
      backgroundColor: splitPaneColors.controlBar.backgroundColor,
      borderRadius: radius[controlBarSurface.borderRadius],
      padding: spacing[controlBarSurface.padding],
      borderWidth: controlBarSurface.borderWidth,
      borderColor: splitPaneColors.controlBar.borderColor,
      gap: spacing[controlBarSurface.gap],
    },
    controlBarTitle: { ...theme.typography.h2, color: splitPaneColors.controlBarTitle.color },
    controlBarCopy: { ...theme.typography.body, color: splitPaneColors.controlBarCopy.color },
    segmentedRow: {
      flexDirection: segmentedRowSurface.flexDirection,
      gap: spacing[segmentedRowSurface.gap],
      flexWrap: segmentedRowSurface.flexWrap,
    },
    segmentButton: {
      borderRadius: radius[segmentButtonSurface.borderRadius],
      borderWidth: segmentButtonSurface.borderWidth,
      borderColor: splitPaneColors.segmentButton.borderColor,
      paddingHorizontal: spacing[segmentButtonSurface.paddingHorizontal],
      paddingVertical: spacing[segmentButtonSurface.paddingVertical],
      backgroundColor: splitPaneColors.segmentButton.backgroundColor,
    },
    segmentButtonActive: {
      borderColor: splitPaneColors.segmentButton.activeBorderColor,
      backgroundColor: splitPaneColors.segmentButton.activeBackgroundColor,
    },
    segmentButtonText: {
      ...theme.typography.caption,
      color: splitPaneColors.segmentButton.textColor,
      fontWeight: segmentButtonSurface.fontWeight,
    },
    segmentButtonTextActive: { color: splitPaneColors.segmentButton.activeTextColor },
    splitContainer: { flex: splitContainerSurface.flex, gap: spacing[splitContainerSurface.gap] },
    splitHorizontal: { flexDirection: splitPaneSurface.splitHorizontal.flexDirection },
    splitVertical: { flexDirection: splitPaneSurface.splitVertical.flexDirection },
    pane: {
      flex: paneSurface.flex,
      minHeight: paneSurface.minHeight,
      backgroundColor: splitPaneColors.pane.backgroundColor,
      borderRadius: radius[paneSurface.borderRadius],
      borderWidth: paneSurface.borderWidth,
      borderColor: splitPaneColors.pane.borderColor,
      overflow: paneSurface.overflow,
    },
    paneHorizontal: { minHeight: splitPaneSurface.paneHorizontal.minHeight },
    paneVertical: { minWidth: splitPaneSurface.paneVertical.minWidth },
    paneToolbar: {
      flexDirection: paneToolbarSurface.flexDirection,
      alignItems: paneToolbarSurface.alignItems,
      justifyContent: paneToolbarSurface.justifyContent,
      gap: spacing[paneToolbarSurface.gap],
      paddingHorizontal: spacing[paneToolbarSurface.paddingHorizontal],
      paddingVertical: spacing[paneToolbarSurface.paddingVertical],
      borderBottomWidth: paneToolbarSurface.borderBottomWidth,
      borderBottomColor: splitPaneColors.paneToolbar.borderBottomColor,
      backgroundColor: splitPaneColors.paneToolbar.backgroundColor,
    },
    paneToolbarTextWrap: {
      flex: splitPaneSurface.paneToolbarTextWrap.flex,
      minWidth: splitPaneSurface.paneToolbarTextWrap.minWidth,
    },
    paneLabel: {
      ...theme.typography.caption,
      color: splitPaneColors.paneLabel.color,
      textTransform: splitPaneSurface.paneLabel.textTransform,
      letterSpacing: splitPaneSurface.paneLabel.letterSpacing,
    },
    paneTitle: {
      ...theme.typography.body,
      color: splitPaneColors.paneTitle.color,
      fontWeight: splitPaneSurface.paneTitle.fontWeight,
    },
    paneToolbarActions: {
      flexDirection: splitPaneSurface.paneToolbarActions.flexDirection,
      gap: spacing[splitPaneSurface.paneToolbarActions.gap],
    },
    toolbarButton: {
      flexDirection: toolbarButtonSurface.flexDirection,
      alignItems: toolbarButtonSurface.alignItems,
      justifyContent: toolbarButtonSurface.justifyContent,
      gap: toolbarButtonSurface.gap,
      borderRadius: radius[toolbarButtonSurface.borderRadius],
      paddingHorizontal: spacing[toolbarButtonSurface.paddingHorizontal],
      paddingVertical: spacing[toolbarButtonSurface.paddingVertical],
      backgroundColor: splitPaneColors.toolbarButton.backgroundColor,
      borderWidth: toolbarButtonSurface.borderWidth,
      borderColor: splitPaneColors.toolbarButton.borderColor,
    },
    toolbarButtonDisabled: { opacity: toolbarButtonSurface.disabledOpacity },
    toolbarButtonText: {
      ...theme.typography.caption,
      color: splitPaneColors.toolbarButton.textColor,
      fontWeight: toolbarButtonSurface.fontWeight,
    },
    paneBody: { flex: paneSurface.flex, minHeight: paneSurface.minHeight },
    emptyState: {
      flex: emptyStateSurface.flex,
      alignItems: emptyStateSurface.alignItems,
      justifyContent: emptyStateSurface.justifyContent,
      padding: spacing[emptyStateSurface.padding],
      gap: spacing[emptyStateSurface.gap],
    },
    emptyStateTitle: {
      ...theme.typography.h2,
      color: splitPaneColors.emptyStateTitle.color,
      textAlign: splitPaneSurface.emptyStateTitle.textAlign,
    },
    emptyStateCopy: {
      ...theme.typography.body,
      color: splitPaneColors.emptyStateCopy.color,
      textAlign: splitPaneSurface.emptyStateCopy.textAlign,
      maxWidth: splitPaneSurface.emptyStateCopy.maxWidth,
    },
    emptyStateActions: {
      flexDirection: emptyStateActionsSurface.flexDirection,
      flexWrap: emptyStateActionsSurface.flexWrap,
      justifyContent: emptyStateActionsSurface.justifyContent,
      gap: spacing[emptyStateActionsSurface.gap],
    },
    primaryButton: {
      flexDirection: primaryButtonSurface.flexDirection,
      alignItems: primaryButtonSurface.alignItems,
      justifyContent: primaryButtonSurface.justifyContent,
      gap: spacing[primaryButtonSurface.gap],
      borderRadius: radius[primaryButtonSurface.borderRadius],
      backgroundColor: splitPaneColors.primaryButton.backgroundColor,
      paddingHorizontal: spacing[primaryButtonSurface.paddingHorizontal],
      paddingVertical: spacing[primaryButtonSurface.paddingVertical],
    },
    primaryButtonText: {
      ...theme.typography.body,
      color: splitPaneColors.primaryButton.textColor,
      fontWeight: primaryButtonSurface.fontWeight,
    },
    secondaryButton: {
      flexDirection: secondaryButtonSurface.flexDirection,
      alignItems: secondaryButtonSurface.alignItems,
      justifyContent: secondaryButtonSurface.justifyContent,
      gap: spacing[secondaryButtonSurface.gap],
      borderRadius: radius[secondaryButtonSurface.borderRadius],
      borderWidth: secondaryButtonSurface.borderWidth,
      borderColor: splitPaneColors.secondaryButton.borderColor,
      paddingHorizontal: spacing[secondaryButtonSurface.paddingHorizontal],
      paddingVertical: spacing[secondaryButtonSurface.paddingVertical],
      backgroundColor: splitPaneColors.secondaryButton.backgroundColor,
    },
    secondaryButtonText: {
      ...theme.typography.body,
      color: splitPaneColors.secondaryButton.textColor,
      fontWeight: secondaryButtonSurface.fontWeight,
    },
    modalOverlay: {
      flex: modalOverlaySurface.flex,
      backgroundColor: splitPaneColors.modalOverlay.backgroundColor,
      justifyContent: modalOverlaySurface.justifyContent,
      padding: spacing[modalOverlaySurface.padding],
    },
    modalCard: {
      maxHeight: modalCardSurface.maxHeight,
      borderRadius: radius[modalCardSurface.borderRadius],
      backgroundColor: splitPaneColors.modalCard.backgroundColor,
      borderWidth: modalCardSurface.borderWidth,
      borderColor: splitPaneColors.modalCard.borderColor,
      padding: spacing[modalCardSurface.padding],
      gap: spacing[modalCardSurface.gap],
    },
    modalTitle: {
      ...theme.typography.h2,
      color: splitPaneColors.modalTitle.color,
    },
    sessionOption: {
      borderRadius: radius[sessionOptionSurface.borderRadius],
      borderWidth: sessionOptionSurface.borderWidth,
      borderColor: splitPaneColors.sessionOption.borderColor,
      padding: spacing[sessionOptionSurface.padding],
      marginBottom: spacing[sessionOptionSurface.marginBottom],
      backgroundColor: splitPaneColors.sessionOption.backgroundColor,
    },
    sessionOptionActive: {
      borderColor: splitPaneColors.sessionOption.activeBorderColor,
      backgroundColor: splitPaneColors.sessionOption.activeBackgroundColor,
    },
    sessionOptionTitle: {
      ...theme.typography.body,
      color: splitPaneColors.sessionOptionTitle.color,
      fontWeight: sessionOptionSurface.title.fontWeight,
      marginBottom: sessionOptionSurface.title.marginBottom,
    },
    sessionOptionPreview: {
      ...theme.typography.caption,
      color: splitPaneColors.sessionOptionPreview.color,
    },
    newChatOption: {
      flexDirection: newChatOptionSurface.flexDirection,
      alignItems: newChatOptionSurface.alignItems,
      justifyContent: newChatOptionSurface.justifyContent,
      gap: spacing[newChatOptionSurface.gap],
      paddingVertical: spacing[newChatOptionSurface.paddingVertical],
    },
    newChatOptionText: {
      ...theme.typography.body,
      color: splitPaneColors.newChatOptionText.color,
      fontWeight: newChatOptionTextSurface.fontWeight,
    },
  });
}
