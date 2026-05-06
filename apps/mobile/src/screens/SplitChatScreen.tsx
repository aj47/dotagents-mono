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
  reconcileSplitPaneSelection,
  replaceSplitPaneSelection,
  resolveSplitOrientation,
  type SplitOrientationPreference,
  type SplitPane,
} from '@dotagents/shared/split-pane-selection';

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
  const styles = useMemo(() => createStyles(theme), [theme]);
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
            <Text style={styles.paneLabel}>{pane === 'primary' ? 'Primary chat' : 'Secondary chat'}</Text>
            <Text style={styles.paneTitle} numberOfLines={1}>{session?.title || 'No chat selected'}</Text>
          </View>
          <View style={styles.paneToolbarActions}>
            <TouchableOpacity
              onPress={() => setPickerPane(pane)}
              style={styles.toolbarButton}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(`Choose ${pane} split chat`)}
            >
              <Text style={styles.toolbarButtonText}>Choose</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openFullScreenChat(sessionId)}
              disabled={!sessionId}
              style={[styles.toolbarButton, !sessionId && styles.toolbarButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(`Open ${pane} split chat full screen`)}
            >
              <Text style={styles.toolbarButtonText}>Open</Text>
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
              <Text style={styles.emptyStateTitle}>Pick a chat for this pane</Text>
              <Text style={styles.emptyStateCopy}>
                Compare two active conversations side by side, or create a fresh chat for this split pane.
              </Text>
              <View style={styles.emptyStateActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setPickerPane(pane)}>
                  <Text style={styles.primaryButtonText}>Choose chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => createSessionForPane(pane)}>
                  <Text style={styles.secondaryButtonText}>New chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }, [createSessionForPane, effectiveOrientation, openFullScreenChat, sessionList, styles]);

  return (
    <ConfigContext.Provider value={splitConfigValue}>
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <View style={styles.controlBar}>
          <Text style={styles.controlBarTitle}>Split view</Text>
          <Text style={styles.controlBarCopy}>Run and compare two sessions at once. Hands-free mode is paused while split view is open.</Text>
          <View style={styles.segmentedRow}>
            {(['auto', 'horizontal', 'vertical'] as SplitOrientationPreference[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => setLayoutPreference(option)}
                style={[styles.segmentButton, layoutPreference === option && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentButtonText, layoutPreference === option && styles.segmentButtonTextActive]}>
                  {option === 'auto' ? 'Auto' : option === 'horizontal' ? 'Horizontal' : 'Vertical'}
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
              <Text style={styles.modalTitle}>Choose {pickerPane === 'primary' ? 'primary' : 'secondary'} chat</Text>
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
                      <Text style={styles.sessionOptionTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.sessionOptionPreview} numberOfLines={2}>{item.preview || 'No messages yet'}</Text>
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
                    <Text style={styles.newChatOptionText}>Create a new chat for this pane</Text>
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

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background, padding: spacing.sm, gap: spacing.sm },
    controlBar: { backgroundColor: theme.colors.card, borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: theme.colors.border, gap: spacing.xs },
    controlBarTitle: { ...theme.typography.h2, color: theme.colors.foreground },
    controlBarCopy: { ...theme.typography.body, color: theme.colors.mutedForeground },
    segmentedRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
    segmentButton: { borderRadius: radius.lg, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: theme.colors.background },
    segmentButtonActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '18' },
    segmentButtonText: { ...theme.typography.caption, color: theme.colors.foreground, fontWeight: '600' },
    segmentButtonTextActive: { color: theme.colors.primary },
    splitContainer: { flex: 1, gap: spacing.sm },
    splitHorizontal: { flexDirection: 'column' },
    splitVertical: { flexDirection: 'row' },
    pane: { flex: 1, minHeight: 0, backgroundColor: theme.colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
    paneHorizontal: { minHeight: 260 },
    paneVertical: { minWidth: 0 },
    paneToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background },
    paneToolbarTextWrap: { flex: 1, minWidth: 0 },
    paneLabel: { ...theme.typography.caption, color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
    paneTitle: { ...theme.typography.body, color: theme.colors.foreground, fontWeight: '600' },
    paneToolbarActions: { flexDirection: 'row', gap: spacing.xs },
    toolbarButton: { borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
    toolbarButtonDisabled: { opacity: 0.45 },
    toolbarButtonText: { ...theme.typography.caption, color: theme.colors.foreground, fontWeight: '600' },
    paneBody: { flex: 1, minHeight: 0 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
    emptyStateTitle: { ...theme.typography.h2, color: theme.colors.foreground, textAlign: 'center' },
    emptyStateCopy: { ...theme.typography.body, color: theme.colors.mutedForeground, textAlign: 'center', maxWidth: 360 },
    emptyStateActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
    primaryButton: { borderRadius: radius.lg, backgroundColor: theme.colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    primaryButtonText: { ...theme.typography.body, color: theme.colors.background, fontWeight: '700' },
    secondaryButton: { borderRadius: radius.lg, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: theme.colors.card },
    secondaryButtonText: { ...theme.typography.body, color: theme.colors.foreground, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', padding: spacing.lg },
    modalCard: { maxHeight: '75%', borderRadius: radius.xl, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: spacing.md, gap: spacing.sm },
    modalTitle: { ...theme.typography.h2, color: theme.colors.foreground },
    sessionOption: { borderRadius: radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: theme.colors.background },
    sessionOptionActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '12' },
    sessionOptionTitle: { ...theme.typography.body, color: theme.colors.foreground, fontWeight: '600', marginBottom: 4 },
    sessionOptionPreview: { ...theme.typography.caption, color: theme.colors.mutedForeground },
    newChatOption: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
    newChatOptionText: { ...theme.typography.body, color: theme.colors.primary, fontWeight: '700' },
  });
}
