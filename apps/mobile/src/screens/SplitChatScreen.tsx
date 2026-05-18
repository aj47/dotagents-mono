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
import { ConfigContext, useConfigContext } from '../store/config';
import { SessionContext, useSessionContext } from '../store/sessions';
import type { SessionStore } from '../store/sessions';
import type { SessionListItem } from '@dotagents/shared/session';
import { useTheme } from '../ui/ThemeProvider';
import { radius, spacing } from '../ui/theme';
import type { Theme } from '../ui/theme';
import ChatScreen from './ChatScreen';
import {
  formatSplitPaneModalTitle,
  createSplitPaneEmptyStateActionMobilePropsParts,
  createSplitPaneModalCreateActionMobilePropsParts,
  createSplitPaneSegmentButtonMobilePropsParts,
  createSplitPaneMobileStyleSlots,
  createSplitPaneSessionOptionMobilePropsParts,
  createSplitPaneToolbarActionMobilePropsParts,
  getSplitPaneCopyState,
  getSplitPaneMobileSurfaceColors,
  getSplitPaneMobileSurfaceState,
  reconcileSplitPaneSelection,
  replaceSplitPaneSelection,
  resolveSplitOrientation,
  SPLIT_PANE_ORIENTATION_OPTIONS,
  type SplitOrientationPreference,
  type SplitPane,
  type SplitPaneMobileSurfaceColors,
} from '@dotagents/shared/split-pane-selection';

const splitPaneCopy = getSplitPaneCopyState();
const splitPaneSurface = getSplitPaneMobileSurfaceState();

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
    const toolbarActionStyles = {
      button: styles.toolbarButton,
      disabledButton: styles.toolbarButtonDisabled,
      label: styles.toolbarButtonText,
    };
    const chooseToolbarActionParts = createSplitPaneToolbarActionMobilePropsParts({
      action: 'choose',
      pane,
      onPress: () => setPickerPane(pane),
      iconColor: splitPaneColors.toolbarButton.iconColor,
      styles: toolbarActionStyles,
    });
    const openToolbarActionParts = createSplitPaneToolbarActionMobilePropsParts({
      action: 'open',
      pane,
      isDisabled: !sessionId,
      onPress: () => openFullScreenChat(sessionId),
      iconColor: splitPaneColors.toolbarButton.iconColor,
      styles: toolbarActionStyles,
    });
    const chooseEmptyStateActionParts = createSplitPaneEmptyStateActionMobilePropsParts({
      action: 'choose',
      onPress: () => setPickerPane(pane),
      iconColor: splitPaneColors.primaryButton.iconColor,
      styles: {
        button: styles.primaryButton,
        label: styles.primaryButtonText,
      },
    });
    const newChatEmptyStateActionParts = createSplitPaneEmptyStateActionMobilePropsParts({
      action: 'newChat',
      onPress: () => createSessionForPane(pane),
      iconColor: splitPaneColors.secondaryButton.iconColor,
      styles: {
        button: styles.secondaryButton,
        label: styles.secondaryButtonText,
      },
    });

    return (
      <View style={[styles.pane, effectiveOrientation === 'vertical' ? styles.paneVertical : styles.paneHorizontal]}>
        <View style={styles.paneToolbar}>
          <View style={styles.paneToolbarTextWrap}>
            <Text style={styles.paneLabel}>{splitPaneCopy.paneLabel[pane]}</Text>
            <Text style={styles.paneTitle} numberOfLines={splitPaneSurface.paneTitle.numberOfLines}>{session?.title || splitPaneCopy.noChatSelected}</Text>
          </View>
          <View style={styles.paneToolbarActions}>
            <TouchableOpacity
              {...chooseToolbarActionParts.touchable.props}
            >
              <Ionicons
                {...chooseToolbarActionParts.touchable.content.icon.props}
              />
              <Text {...chooseToolbarActionParts.touchable.content.label.props}>
                {chooseToolbarActionParts.touchable.content.label.text}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              {...openToolbarActionParts.touchable.props}
            >
              <Ionicons
                {...openToolbarActionParts.touchable.content.icon.props}
              />
              <Text {...openToolbarActionParts.touchable.content.label.props}>
                {openToolbarActionParts.touchable.content.label.text}
              </Text>
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
                <TouchableOpacity
                  {...chooseEmptyStateActionParts.touchable.props}
                >
                  <Ionicons
                    {...chooseEmptyStateActionParts.touchable.content.icon.props}
                  />
                  <Text {...chooseEmptyStateActionParts.touchable.content.label.props}>
                    {chooseEmptyStateActionParts.touchable.content.label.text}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  {...newChatEmptyStateActionParts.touchable.props}
                >
                  <Ionicons
                    {...newChatEmptyStateActionParts.touchable.content.icon.props}
                  />
                  <Text {...newChatEmptyStateActionParts.touchable.content.label.props}>
                    {newChatEmptyStateActionParts.touchable.content.label.text}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }, [createSessionForPane, effectiveOrientation, openFullScreenChat, sessionList, splitPaneColors, styles]);

  const modalCreateActionParts = createSplitPaneModalCreateActionMobilePropsParts({
    onPress: () => {
      if (pickerPane) createSessionForPane(pickerPane);
      setPickerPane(null);
    },
    iconColor: splitPaneColors.newChatOption.iconColor,
    styles: {
      button: styles.newChatOption,
      label: styles.newChatOptionText,
    },
  });

  return (
    <ConfigContext.Provider value={splitConfigValue}>
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <View style={styles.controlBar}>
          <Text style={styles.controlBarTitle}>{splitPaneCopy.title}</Text>
          <Text style={styles.controlBarCopy}>{splitPaneCopy.description}</Text>
          <View style={styles.segmentedRow}>
            {SPLIT_PANE_ORIENTATION_OPTIONS.map((option) => {
              const isSelected = layoutPreference === option;
              const segmentButtonParts = createSplitPaneSegmentButtonMobilePropsParts({
                option,
                isSelected,
                onSelect: setLayoutPreference,
                styles: {
                  button: styles.segmentButton,
                  activeButton: styles.segmentButtonActive,
                  pressedButton: styles.segmentButtonPressed,
                  label: styles.segmentButtonText,
                  activeLabel: styles.segmentButtonTextActive,
                },
              });
              return (
                <Pressable
                  key={option}
                  {...segmentButtonParts.pressable.props}
                >
                  <Text {...segmentButtonParts.pressable.content.label.props}>
                    {segmentButtonParts.pressable.content.label.text}
                  </Text>
                </Pressable>
              );
            })}
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
                  const sessionOptionParts = createSplitPaneSessionOptionMobilePropsParts({
                    title: item.title,
                    preview: item.preview,
                    isSelected,
                    onPress: () => {
                      if (pickerPane === 'primary') setPrimarySessionId(item.id);
                      if (pickerPane === 'secondary') setSecondarySessionId(item.id);
                      setPickerPane(null);
                    },
                    styles: {
                      option: styles.sessionOption,
                      activeOption: styles.sessionOptionActive,
                      title: styles.sessionOptionTitle,
                      preview: styles.sessionOptionPreview,
                    },
                  });
                  return (
                    <TouchableOpacity
                      {...sessionOptionParts.touchable.props}
                    >
                      <Text {...sessionOptionParts.touchable.content.title.props}>
                        {sessionOptionParts.touchable.content.title.text}
                      </Text>
                      <Text {...sessionOptionParts.touchable.content.preview.props}>
                        {sessionOptionParts.touchable.content.preview.text}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                ListFooterComponent={(
                  <TouchableOpacity
                    {...modalCreateActionParts.touchable.props}
                  >
                    <Ionicons
                      {...modalCreateActionParts.touchable.content.icon.props}
                    />
                    <Text {...modalCreateActionParts.touchable.content.label.props}>
                      {modalCreateActionParts.touchable.content.label.text}
                    </Text>
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
  return StyleSheet.create(createSplitPaneMobileStyleSlots({
    colors: splitPaneColors,
    spacing,
    radius,
    typography: theme.typography,
  }));
}
