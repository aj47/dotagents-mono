import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable, StyleSheet, Alert, Platform, Image, GestureResponderEvent, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventEmitter } from 'expo-modules-core';
import { useConfigContext } from '../store/config';
import { useTheme } from '../ui/ThemeProvider';
import { spacing, radius, Theme } from '../ui/theme';
import { useSessionContext, SessionStore } from '../store/sessions';
import { useConnectionManager } from '../store/connectionManager';
import { useTunnelConnection } from '../store/tunnelConnection';
import { useProfile } from '../store/profile';
import { ConnectionStatusIndicator } from '../ui/ConnectionStatusIndicator';
import { AgentSelectorSheet } from '../ui/AgentSelectorSheet';
import { ExtendedSettingsApiClient } from '../lib/settingsApi';
import { getAcpMainAgentOptions, toMainAgentProfile } from '../lib/mainAgentOptions';
import { ChatMessage, AgentProgressUpdate } from '../lib/openaiClient';
import { SessionListItem, isStubSession } from '../types/session';
import { createButtonAccessibilityLabel, createMinimumTouchTargetStyle } from '../lib/accessibility';

const darkSpinner = require('../../assets/loading-spinner.gif');
const lightSpinner = require('../../assets/light-spinner.gif');

interface Props {
  navigation: any;
}

export default function SessionListScreen({ navigation }: Props) {
  const { config } = useConfigContext();
  const { theme, isDark } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, screenHeight), [theme, screenHeight]);
  const connectionManager = useConnectionManager();
  const { connectionInfo } = useTunnelConnection();
  const { currentProfile } = useProfile();
  const currentAgentId = currentProfile?.id;
  const [agentSelectorVisible, setAgentSelectorVisible] = useState(false);
  const [hasAgentSelectorOptions, setHasAgentSelectorOptions] = useState(false);
  const [isAcpMainAgentMode, setIsAcpMainAgentMode] = useState(false);
  const currentAgentLabel = currentProfile?.name || (isAcpMainAgentMode ? 'Main Agent' : 'Default Profile');
  const currentAgentAccessibilityPrefix = isAcpMainAgentMode ? 'Current main agent' : 'Current profile';
  const agentSelectionAccessibilityHint = isAcpMainAgentMode
    ? 'Opens main agent selection menu'
    : 'Opens profile selection menu';
  const noOtherAgentsAvailableText = isAcpMainAgentMode
    ? 'No other main agents are available to switch to right now.'
    : 'No other profiles are available to switch to right now.';

  const hasAlternativeAgentSelectorOption = useCallback((optionIds: string[]) => {
    if (optionIds.length === 0) return false;
    if (!currentAgentId) return true;
    return optionIds.some((optionId) => optionId !== currentAgentId);
  }, [currentAgentId]);

  const refreshAgentSelectorAvailability = useCallback(async () => {
    if (!config.baseUrl || !config.apiKey) {
      setIsAcpMainAgentMode(false);
      setHasAgentSelectorOptions(false);
      return;
    }

    try {
      const client = new ExtendedSettingsApiClient(config.baseUrl, config.apiKey);
      const settings = await client.getSettings();
      setIsAcpMainAgentMode(settings.mainAgentMode === 'acp');

      if (settings.mainAgentMode === 'acp') {
        const agentProfilesResponse = await client.getAgentProfiles().catch(() => ({ profiles: [] }));
        const mainAgentOptionIds = getAcpMainAgentOptions(settings, agentProfilesResponse.profiles || [])
          .map((option) => toMainAgentProfile(option).id);
        setHasAgentSelectorOptions(
          hasAlternativeAgentSelectorOption(mainAgentOptionIds)
        );
        return;
      }

      const profilesResponse = await client.getProfiles();
      setHasAgentSelectorOptions(
        hasAlternativeAgentSelectorOption((profilesResponse.profiles || []).map((profile) => profile.id))
      );
    } catch (error) {
      console.warn('[SessionListScreen] Failed to refresh agent selector availability:', error);
      setHasAgentSelectorOptions(false);
    }
  }, [config.baseUrl, config.apiKey, hasAlternativeAgentSelectorOption]);

  useEffect(() => {
    void refreshAgentSelectorAvailability();
  }, [refreshAgentSelectorAvailability]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      void refreshAgentSelectorAvailability();
    });
    return unsubscribe;
  }, [navigation, refreshAgentSelectorAvailability]);

  // ── Rapid Fire voice state ─────────────────────────────────────────────────
  const [rfListening, setRfListening] = useState(false);
  const [rfTranscript, setRfTranscript] = useState('');
  const [rfStatus, setRfStatus] = useState<
    'idle' | 'listening' | 'sending' | 'sent' | 'empty' | 'permissionDenied' | 'unavailable' | 'error'
  >('idle');
  const rfListeningRef = useRef(false);
  const rfStartingRef = useRef(false);
  const rfStoppingRef = useRef(false);
  const rfFinalRef = useRef('');
  const rfLiveRef = useRef('');
  const rfSrEmitterRef = useRef<any>(null);
  const rfSrSubsRef = useRef<any[]>([]);
  const rfGrantTimeRef = useRef(0);
  const rfUserReleasedRef = useRef(false);
  const rfWebRecRef = useRef<any>(null);
  const rfButtonRef = useRef<View>(null);
  const rfPressInSeenRef = useRef(false);
  const rfStopAndFireRef = useRef<(() => Promise<void>) | null>(null);
  const rfInFlightSessionIdsRef = useRef<Set<string>>(new Set());
  const rfMinHoldMs = 200;
  const sessionStoreRef = useRef<SessionStore | null>(null);
  const rfStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rfLog = useCallback((msg: string, extra?: any) => {
    if (!__DEV__) return;
    if (typeof extra !== 'undefined') console.log(`[RapidFireDebug] ${msg}`, extra);
    else console.log(`[RapidFireDebug] ${msg}`);
  }, []);

  const normalizeVoiceText = useCallback((t?: string) => (t || '').replace(/\s+/g, ' ').trim(), []);
  const mergeVoiceText = useCallback((base?: string, live?: string) => {
    const a = normalizeVoiceText(base);
    const b = normalizeVoiceText(live);
    if (!a) return b;
    if (!b) return a;
    if (a === b) return a;
    if (b.startsWith(a)) return b;
    if (a.startsWith(b)) return a;
    const bWordBoundary = new RegExp(`(?:^|\\s)${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`);
    if (bWordBoundary.test(a)) return a;
    const aWordBoundary = new RegExp(`(?:^|\\s)${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`);
    if (aWordBoundary.test(b)) return b;
    const aWords = a.split(' ');
    const bWords = b.split(' ');
    const maxOverlap = Math.min(aWords.length, bWords.length);
    for (let k = maxOverlap; k > 0; k--) {
      const aSuffix = aWords.slice(-k).join(' ');
      const bPrefix = bWords.slice(0, k).join(' ');
      if (aSuffix === bPrefix) {
        const prefix = aWords.slice(0, aWords.length - k).join(' ');
        return normalizeVoiceText(`${prefix} ${b}`);
      }
    }
    return normalizeVoiceText(`${a} ${b}`);
  }, [normalizeVoiceText]);

  const rfBuildMessagesFromHistory = useCallback((history: any[]): ChatMessage[] => {
    if (!history || history.length === 0) return [];

    let currentTurnStartIndex = 0;
    for (let i = 0; i < history.length; i++) {
      if (history[i]?.role === 'user') {
        currentTurnStartIndex = i;
      }
    }

    const messages: ChatMessage[] = [];
    for (let i = currentTurnStartIndex + 1; i < history.length; i++) {
      const historyMsg = history[i];
      if (!historyMsg) continue;

      // Merge tool results into the preceding assistant message, matching ChatScreen behavior.
      if (historyMsg.role === 'tool' && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.toolCalls && lastMessage.toolCalls.length > 0) {
          const hasToolResults = historyMsg.toolResults && historyMsg.toolResults.length > 0;
          const hasContent = historyMsg.content && historyMsg.content.trim().length > 0;
          if (hasToolResults) {
            lastMessage.toolResults = [
              ...(lastMessage.toolResults || []),
              ...(historyMsg.toolResults || []),
            ];
            if (hasContent) {
              lastMessage.content = (lastMessage.content || '') +
                (lastMessage.content ? '\n' : '') + historyMsg.content;
            }
            continue;
          }
        }
      }

      messages.push({
        role: historyMsg.role === 'tool' ? 'assistant' : historyMsg.role,
        content: historyMsg.content || '',
        toolCalls: historyMsg.toolCalls,
        toolResults: historyMsg.toolResults,
      });
    }

    return messages;
  }, []);

  const rfRunBackgroundSend = useCallback(async (sessionId: string, userText: string) => {
    const initialMessages: ChatMessage[] = [{ role: 'user', content: userText }];
    const ss = sessionStoreRef.current;
    if (!ss) return;

    const requestId = Date.now();

    rfInFlightSessionIdsRef.current.add(sessionId);
    connectionManager.setLatestRequestId(sessionId, requestId);
    connectionManager.incrementActiveRequests(sessionId);

    let streamingText = '';
    let persistTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingMessages: ChatMessage[] | null = null;
    let finalized = false;

    const isLatestForSession = () => connectionManager.getLatestRequestId(sessionId) === requestId;

    const schedulePersist = (messages: ChatMessage[]) => {
      pendingMessages = messages;
      if (persistTimer) return;
      persistTimer = setTimeout(() => {
        persistTimer = null;
        const toPersist = pendingMessages;
        pendingMessages = null;
        if (!toPersist || !isLatestForSession()) return;
        const latestStore = sessionStoreRef.current;
        if (!latestStore) return;
        void latestStore.setMessagesForSession(sessionId, toPersist);
      }, 180);
    };

    const flushPersist = async () => {
      if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
      }
      const toPersist = pendingMessages;
      pendingMessages = null;
      if (!toPersist || !isLatestForSession()) return;
      const latestStore = sessionStoreRef.current;
      if (!latestStore) return;
      await latestStore.setMessagesForSession(sessionId, toPersist);
    };

    const onToken = (tok: string) => {
      if (finalized) return;
      if (!isLatestForSession()) return;
      if (tok.startsWith(streamingText) && tok.length >= streamingText.length) {
        streamingText = tok;
      } else {
        streamingText += tok;
      }
      schedulePersist([...initialMessages, { role: 'assistant', content: streamingText }]);
    };

    const onProgress = (update: AgentProgressUpdate) => {
      if (finalized) return;
      if (!isLatestForSession()) return;
      if (update.conversationHistory && update.conversationHistory.length > 0) {
        const assistantMessages = rfBuildMessagesFromHistory(update.conversationHistory as any[]);
        schedulePersist([...initialMessages, ...assistantMessages]);
        return;
      }
      const fullText = update.streamingContent?.text;
      if (fullText) {
        streamingText = fullText;
        schedulePersist([...initialMessages, { role: 'assistant', content: streamingText }]);
      }
    };

    try {
      const connection = connectionManager.getOrCreateConnection(sessionId);
      const client = connection.client;
      rfLog('backgroundSend:start', { sessionId, requestId });
      const response = await client.chat(initialMessages, onToken, onProgress, undefined);
      if (!isLatestForSession()) return;
      finalized = true;

      if (response.conversationId) {
        await ss.setServerConversationIdForSession(sessionId, response.conversationId);
      }

      let finalMessages: ChatMessage[];
      if (response.conversationHistory && response.conversationHistory.length > 0) {
        finalMessages = [...initialMessages, ...rfBuildMessagesFromHistory(response.conversationHistory as any[])];
      } else {
        const finalText = (response.content || streamingText).trim();
        finalMessages = finalText
          ? [...initialMessages, { role: 'assistant', content: finalText }]
          : initialMessages;
      }

      const authoritativeFinalText = (response.content || streamingText).trim();
      if (authoritativeFinalText) {
        let lastAssistantIndex = -1;
        for (let i = finalMessages.length - 1; i >= 0; i--) {
          if (finalMessages[i].role === 'assistant') {
            lastAssistantIndex = i;
            break;
          }
        }
        if (lastAssistantIndex >= 0) {
          finalMessages[lastAssistantIndex] = {
            ...finalMessages[lastAssistantIndex],
            content: authoritativeFinalText,
          };
        } else {
          finalMessages = [...finalMessages, { role: 'assistant', content: authoritativeFinalText }];
        }
      }

      pendingMessages = finalMessages;
      await flushPersist();
      rfLog('backgroundSend:done', { sessionId, requestId, messageCount: finalMessages.length });
    } catch (err) {
      finalized = true;
      rfLog('backgroundSend:error', { sessionId, requestId, error: (err as any)?.message || String(err) });
      const errorContent = (err as any)?.message
        ? `Error: ${(err as any).message}`
        : 'Error: Failed to get response.';
      pendingMessages = [...initialMessages, { role: 'assistant', content: errorContent }];
      await flushPersist();
    } finally {
      if (persistTimer) {
        clearTimeout(persistTimer);
      }
      rfInFlightSessionIdsRef.current.delete(sessionId);
      connectionManager.decrementActiveRequests(sessionId);
    }
  }, [connectionManager, rfBuildMessagesFromHistory, rfLog]);

  const rfSetListening = useCallback((v: boolean) => {
    rfListeningRef.current = v;
    setRfListening(v);
  }, []);

  const rfCleanupSubs = useCallback(() => {
    for (const sub of rfSrSubsRef.current) {
      try { sub.remove(); } catch {}
    }
    rfSrSubsRef.current = [];
  }, []);

  const rfSetTransientStatus = useCallback((
    status: 'sent' | 'empty' | 'permissionDenied' | 'unavailable' | 'error',
    clearAfterMs = 2500
  ) => {
    if (rfStatusTimeoutRef.current) {
      clearTimeout(rfStatusTimeoutRef.current);
      rfStatusTimeoutRef.current = null;
    }
    setRfStatus(status);
    rfStatusTimeoutRef.current = setTimeout(() => {
      setRfStatus('idle');
      rfStatusTimeoutRef.current = null;
    }, clearAfterMs);
  }, []);

  // On web, capture raw DOM release events in case RN Pressable misses onPressOut on long-press.
  useEffect(() => {
    if (Platform.OS !== 'web' || !rfButtonRef.current) return;

    // @ts-ignore - React Native Web ref resolves to a DOM element at runtime
    const domNode = rfButtonRef.current as any;
    if (!domNode || typeof domNode.addEventListener !== 'function') return;

    const summarizeDomEvent = (e: any) => ({
      type: e?.type,
      cancelable: !!e?.cancelable,
      defaultPrevented: !!e?.defaultPrevented,
      touches: typeof e?.touches?.length === 'number' ? e.touches.length : undefined,
      changedTouches: typeof e?.changedTouches?.length === 'number' ? e.changedTouches.length : undefined,
      pointerType: e?.pointerType,
      targetTag: e?.target?.tagName,
    });

    const stopFromDomFallback = (source: string, e: any) => {
      const details = summarizeDomEvent(e);
      if (!rfPressInSeenRef.current || !rfListeningRef.current || rfUserReleasedRef.current) {
        rfLog(`web:dom:${source} (no-op)`, {
          ...details,
          pressInSeen: rfPressInSeenRef.current,
          listening: rfListeningRef.current,
          userReleased: rfUserReleasedRef.current,
        });
        return;
      }
      const dt = Date.now() - rfGrantTimeRef.current;
      const delay = Math.max(0, rfMinHoldMs - dt);
      rfLog(`web:dom:${source} -> fallback stop`, { ...details, dt, delay });
      const maybeStop = () => {
        if (!rfListeningRef.current || rfUserReleasedRef.current) return;
        rfPressInSeenRef.current = false;
        void rfStopAndFireRef.current?.();
      };
      if (delay > 0) setTimeout(maybeStop, delay);
      else maybeStop();
    };

    const handleTouchStart = (e: any) => {
      rfLog('web:dom:touchstart', summarizeDomEvent(e));
      if (e.cancelable) e.preventDefault();
    };
    const handleTouchEnd = (e: any) => stopFromDomFallback('touchend', e);
    const handleTouchCancel = (e: any) => stopFromDomFallback('touchcancel', e);
    const handlePointerUp = (e: any) => stopFromDomFallback('pointerup', e);
    const handlePointerCancel = (e: any) => stopFromDomFallback('pointercancel', e);
    const handleContextMenu = (e: any) => {
      rfLog('web:dom:contextmenu', summarizeDomEvent(e));
      e.preventDefault();
    };

    rfLog('web:dom listeners attached', { nodeTag: domNode?.tagName });
    domNode.addEventListener('touchstart', handleTouchStart, { passive: false });
    domNode.addEventListener('touchend', handleTouchEnd, { passive: false });
    domNode.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    domNode.addEventListener('pointerup', handlePointerUp, { passive: true });
    domNode.addEventListener('pointercancel', handlePointerCancel, { passive: true });
    domNode.addEventListener('contextmenu', handleContextMenu, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    document.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('pointercancel', handlePointerCancel, { passive: true });

    return () => {
      rfLog('web:dom listeners removed');
      domNode.removeEventListener('touchstart', handleTouchStart);
      domNode.removeEventListener('touchend', handleTouchEnd);
      domNode.removeEventListener('touchcancel', handleTouchCancel);
      domNode.removeEventListener('pointerup', handlePointerUp);
      domNode.removeEventListener('pointercancel', handlePointerCancel);
      domNode.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [rfLog]);

  const rfStartRecording = useCallback(async (e?: GestureResponderEvent) => {
    rfLog('startRecording called', {
      starting: rfStartingRef.current,
      listening: rfListeningRef.current,
      pageX: e?.nativeEvent?.pageX,
      pageY: e?.nativeEvent?.pageY,
    });
    if (rfStartingRef.current || rfListeningRef.current) return;
    rfStartingRef.current = true;
    rfStoppingRef.current = false;
    rfUserReleasedRef.current = false;
    rfFinalRef.current = '';
    rfLiveRef.current = '';
    setRfTranscript('');
    setRfStatus('listening');
    rfGrantTimeRef.current = Date.now();
    rfSetListening(true);
    try {
      if (Platform.OS !== 'web') {
        const SR: any = await import('expo-speech-recognition');
        if (SR?.ExpoSpeechRecognitionModule?.start) {
          if (!rfSrEmitterRef.current) {
            rfSrEmitterRef.current = new EventEmitter(SR.ExpoSpeechRecognitionModule);
          }
          rfCleanupSubs();
          const subResult = rfSrEmitterRef.current.addListener('result', (event: any) => {
            const t = event?.results?.[0]?.transcript ?? event?.text ?? event?.transcript ?? '';
            if (event?.isFinal && t) {
              rfFinalRef.current = mergeVoiceText(rfFinalRef.current, t);
            }
            const preview = mergeVoiceText(rfFinalRef.current, event?.isFinal ? '' : t);
            rfLiveRef.current = preview;
            setRfTranscript(preview);
            rfLog('native:onresult', {
              isFinal: !!event?.isFinal,
              chunk: normalizeVoiceText(t),
              preview,
            });
          });
          const subError = rfSrEmitterRef.current.addListener('error', (event: any) => {
            console.error('[RapidFire] SR error:', JSON.stringify(event));
            rfSetTransientStatus('error');
          });
          const subEnd = rfSrEmitterRef.current.addListener('end', async () => {
            // If user hasn't released, SR ended spuriously – try to restart
            if (!rfUserReleasedRef.current && !rfStoppingRef.current) {
              try {
                const SRInner: any = await import('expo-speech-recognition');
                if (SRInner?.ExpoSpeechRecognitionModule?.start) {
                  SRInner.ExpoSpeechRecognitionModule.start({
                    lang: 'en-US', interimResults: true, continuous: true,
                    volumeChangeEventOptions: { enabled: false, intervalMillis: 250 },
                  });
                  return; // restarted – stay in listening state
                }
              } catch {}
            }
            rfSetListening(false);
          });
          rfSrSubsRef.current.push(subResult, subError, subEnd);
          try {
            const perm = await SR.ExpoSpeechRecognitionModule.getPermissionsAsync();
            if (!perm?.granted) {
              const req = await SR.ExpoSpeechRecognitionModule.requestPermissionsAsync();
              if (!req?.granted) {
                rfSetListening(false);
                rfStartingRef.current = false;
                rfSetTransientStatus('permissionDenied', 4000);
                Alert.alert(
                  'Microphone Permission Required',
                  'Rapid Fire needs microphone permission. Enable it in system settings and try again.',
                  [{ text: 'OK' }]
                );
                return;
              }
            }
          } catch {}
          SR.ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, continuous: true,
            volumeChangeEventOptions: { enabled: false, intervalMillis: 250 } });
          rfStartingRef.current = false;
          return;
        }
      }
      // Web fallback – use Web Speech API
      if (Platform.OS === 'web') {
        const SRClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SRClass) {
          const rec = new SRClass();
          rec.lang = 'en-US';
          rec.interimResults = true;
          rec.continuous = true;
          rec.onresult = (ev: any) => {
            let interim = '';
            let finalText = '';
            for (let i = ev.resultIndex; i < ev.results.length; i++) {
              const res = ev.results[i];
              const txt = res[0]?.transcript || '';
              if (res.isFinal) finalText += txt;
              else interim += txt;
            }
            if (finalText) {
              rfFinalRef.current = mergeVoiceText(rfFinalRef.current, finalText);
            }
            const preview = mergeVoiceText(rfFinalRef.current, interim);
            rfLiveRef.current = preview;
            setRfTranscript(preview);
            rfLog('web:onresult', {
              interim: normalizeVoiceText(interim),
              finalChunk: normalizeVoiceText(finalText),
              preview,
            });
          };
          rec.onerror = (ev: any) => {
            console.error('[RapidFire] Web SR error:', ev?.error || ev);
            rfLog('web:onerror', ev?.error || ev);
            rfSetTransientStatus('error');
          };
          rec.onend = () => {
            rfLog('web:onend', {
              userReleased: rfUserReleasedRef.current,
              stopping: rfStoppingRef.current,
              hasRec: !!rfWebRecRef.current,
              final: rfFinalRef.current,
              live: rfLiveRef.current,
            });
            // If user hasn't released, SR ended spuriously – try to restart
            if (!rfUserReleasedRef.current && !rfStoppingRef.current && rfWebRecRef.current) {
              try { rfWebRecRef.current.start(); return; } catch {}
            }
            rfSetListening(false);
          };
          rfWebRecRef.current = rec;
          rec.start();
          rfStartingRef.current = false;
          return;
        }
      }
    } catch (err) {
      console.warn('[RapidFire] SR unavailable:', (err as any)?.message || err);
      rfSetTransientStatus('unavailable', 4000);
    }
    rfSetListening(false);
    rfStartingRef.current = false;
  }, [mergeVoiceText, normalizeVoiceText, rfCleanupSubs, rfLog, rfSetListening, rfSetTransientStatus]);

  const rfStopAndFire = useCallback(async () => {
    rfLog('stopAndFire called', {
      stopping: rfStoppingRef.current,
      listening: rfListeningRef.current,
      final: rfFinalRef.current,
      live: rfLiveRef.current,
    });
    if (rfStoppingRef.current) return;
    rfStoppingRef.current = true;
    rfUserReleasedRef.current = true;
    rfPressInSeenRef.current = false;
    try {
      if (Platform.OS !== 'web') {
        const SR: any = await import('expo-speech-recognition');
        if (SR?.ExpoSpeechRecognitionModule?.stop) SR.ExpoSpeechRecognitionModule.stop();
      }
      if (Platform.OS === 'web' && rfWebRecRef.current) {
        try { rfWebRecRef.current.stop(); } catch {}
        rfWebRecRef.current = null;
      }
    } catch {}
    rfCleanupSubs();
    rfSetListening(false);
    setRfStatus('sending');
    const finalText = mergeVoiceText(rfFinalRef.current, rfLiveRef.current).trim();
    rfFinalRef.current = '';
    rfLiveRef.current = '';
    setRfTranscript('');
    if (finalText) {
      // Create a new session and persist transcript, but keep user on Sessions screen.
      const ss = sessionStoreRef.current;
      if (ss) {
        try {
          // Save previous currentSessionId — createNewSession() will switch it,
          // but we need to restore it so the (possibly mounted) ChatScreen doesn't
          // race-load the new session while it still has 0 messages.
          const prevSessionId = ss.currentSessionId;
          const newSession = ss.createNewSession();
          // Restore immediately so ChatScreen's useEffect doesn't prematurely load
          // the new empty session. When the user later taps the session,
          // setCurrentSession(newId) will properly trigger the load with messages.
          ss.setCurrentSession(prevSessionId);
          await ss.setMessagesForSession(newSession.id, [{ role: 'user', content: finalText }]);
          setRfTranscript(finalText);
          // Fire the agent request in the background so the Sessions list updates live.
          void rfRunBackgroundSend(newSession.id, finalText);
          rfSetTransientStatus('sent');
        } catch (err) {
          console.error('[RapidFire] Failed to persist transcript:', err);
          rfSetTransientStatus('error');
        }
      } else {
        rfSetTransientStatus('error');
      }
    } else {
      rfSetTransientStatus('empty');
    }
    rfStoppingRef.current = false;
  }, [mergeVoiceText, rfCleanupSubs, rfLog, rfRunBackgroundSend, rfSetListening, rfSetTransientStatus]);

  rfStopAndFireRef.current = rfStopAndFire;
  // ── end Rapid Fire ─────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    return () => {
      rfCleanupSubs();
      if (rfWebRecRef.current) {
        try { rfWebRecRef.current.stop(); } catch {}
        rfWebRecRef.current = null;
      }
      if (rfStatusTimeoutRef.current) {
        clearTimeout(rfStatusTimeoutRef.current);
      }
    };
  }, [rfCleanupSubs]);

  useLayoutEffect(() => {
    navigation?.setOptions?.({
      headerTitle: () => (
        hasAgentSelectorOptions ? (
          <TouchableOpacity
            style={styles.headerAgentSelectorTrigger}
            onPress={() => setAgentSelectorVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`${currentAgentAccessibilityPrefix}: ${currentAgentLabel}. Tap to change.`}
            accessibilityHint={agentSelectionAccessibilityHint}
            activeOpacity={0.7}
          >
            <Text style={styles.headerAgentSelectorTitle}>Chats</Text>
            <View style={styles.headerAgentSelectorBadge}>
              <Text style={styles.headerAgentSelectorBadgeText} numberOfLines={1} ellipsizeMode="tail">
                {currentAgentLabel}
              </Text>
              <Text style={styles.headerAgentSelectorBadgeChevron}>
                ▼
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View
            style={styles.headerAgentSelectorTrigger}
            accessible
            accessibilityLabel={`${currentAgentAccessibilityPrefix}: ${currentAgentLabel}. ${noOtherAgentsAvailableText}`}
          >
            <Text style={styles.headerAgentSelectorTitle}>Chats</Text>
            <View style={[styles.headerAgentSelectorBadge, styles.headerAgentSelectorBadgeStatic]}>
              <Text
                style={[styles.headerAgentSelectorBadgeText, styles.headerAgentSelectorBadgeTextStatic]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {currentAgentLabel}
              </Text>
            </View>
          </View>
        )
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ConnectionStatusIndicator
            state={connectionInfo.state}
            retryCount={connectionInfo.retryCount}
            compact
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerSettingsButton}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel('Open settings')}
            accessibilityHint="Opens app settings."
          >
            <Text style={{ fontSize: 20, color: theme.colors.foreground }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, styles, theme, connectionInfo.state, connectionInfo.retryCount, currentAgentLabel, hasAgentSelectorOptions, currentAgentAccessibilityPrefix, agentSelectionAccessibilityHint, noOtherAgentsAvailableText]);
  const insets = useSafeAreaInsets();
  const sessionStore = useSessionContext();
  sessionStoreRef.current = sessionStore;
  const sessions = sessionStore.getSessionList();

  if (!sessionStore.ready) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Image
          source={isDark ? darkSpinner : lightSpinner}
          style={styles.spinner}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  const handleCreateSession = () => {
    sessionStore.createNewSession();
    navigation.navigate('Chat');
  };

  const handleSelectSession = async (sessionId: string) => {
    const selectedSession = sessionStore.sessions.find(s => s.id === sessionId) || null;
    const rfBackgroundInFlight = rfInFlightSessionIdsRef.current.has(sessionId);
    const pendingUserOnlyText = selectedSession && selectedSession.messages.length === 1
      && selectedSession.messages[0].role === 'user'
      && !selectedSession.serverConversationId
      && !rfBackgroundInFlight
      ? (selectedSession.messages[0].content || '').trim()
      : '';

    // Fallback only: if a user-only stub exists and no background rapid-fire request
    // is running, auto-send when opening chat.
    if (pendingUserOnlyText) {
      rfLog('selectSession -> pending user-only session detected', { sessionId, pendingUserOnlyText });
      try {
        await sessionStore.setMessagesForSession(sessionId, []);
      } catch (err) {
        console.warn('[RapidFire] Failed to clear pending user-only session before auto-send:', err);
      }
      sessionStore.setCurrentSession(sessionId);
      navigation.navigate('Chat', { initialMessage: pendingUserOnlyText });
      return;
    }

    sessionStore.setCurrentSession(sessionId);
    navigation.navigate('Chat');
  };

  const handleDeleteSession = (session: SessionListItem) => {
    const doDelete = () => {
      // Clean up connection for this session (fixes #608)
      connectionManager.removeConnection(session.id);
      sessionStore.deleteSession(session.id);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${session.title}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Session',
        `Are you sure you want to delete "${session.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleClearAll = () => {
    const doClear = () => {
      // Clean up all connections (fixes #608)
      connectionManager.manager.cleanupAll();
      sessionStore.clearAllSessions();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete all sessions? This cannot be undone.')) {
        doClear();
      }
    } else {
      Alert.alert(
        'Clear All Sessions',
        'Are you sure you want to delete all sessions? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete All', style: 'destructive', onPress: doClear },
        ]
      );
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Build a set of stub session IDs for display purposes
  const stubSessionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of sessionStore.sessions) {
      if (isStubSession(s)) ids.add(s.id);
    }
    return ids;
  }, [sessionStore.sessions]);

  const renderSession = ({ item }: { item: SessionListItem }) => {
    const isActive = item.id === sessionStore.currentSessionId;
    const isStub = stubSessionIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.sessionItem, isActive && styles.sessionItemActive]}
        onPress={() => handleSelectSession(item.id)}
        onLongPress={() => handleDeleteSession(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.messageCount} message${item.messageCount !== 1 ? 's' : ''}`}
      >
        <View style={styles.sessionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            {isStub && (
              <Text style={{ fontSize: 12, marginRight: 4 }}>💻</Text>
            )}
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.sessionDate}>{formatDate(item.updatedAt)}</Text>
        </View>
        <Text style={styles.sessionPreview} numberOfLines={2}>
          {item.preview || 'No messages yet'}
        </Text>
        <Text style={styles.sessionMeta}>
          {item.messageCount} message{item.messageCount !== 1 ? 's' : ''}
          {isStub ? ' · from desktop' : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Sessions Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a new chat to begin a conversation
      </Text>
    </View>
  );

  const rfHintText = rfStatus === 'listening'
    ? 'Release to send...'
    : rfStatus === 'sending'
      ? 'Sending...'
      : rfStatus === 'sent'
        ? 'Sent to a new chat. Tap it to open.'
        : rfStatus === 'empty'
          ? 'No speech detected. Try again.'
          : rfStatus === 'permissionDenied'
            ? 'Microphone permission denied. Enable it in settings.'
            : rfStatus === 'unavailable'
              ? 'Speech recognition unavailable on this build/device.'
              : rfStatus === 'error'
                ? 'Rapid Fire failed. Try again.'
                : 'Hold to talk (Rapid Fire)';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.newButton, styles.sessionActionTouchTarget]}
          onPress={handleCreateSession}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel('New chat')}
          accessibilityHint="Creates and opens a new chat."
        >
          <Text style={styles.newButtonText}>+ New Chat</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {sessionStore.isSyncing && (
            <Image
              source={isDark ? darkSpinner : lightSpinner}
              style={{ width: 16, height: 16, marginRight: 8 }}
              resizeMode="contain"
            />
          )}
          {sessions.length > 0 && (
            <TouchableOpacity
              style={[styles.clearButton, styles.sessionActionTouchTarget]}
              onPress={handleClearAll}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Clear all chats')}
              accessibilityHint="Deletes all chat sessions."
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={sessions.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={EmptyState}
      />

      {/* Rapid Fire hold-to-speak button */}
      <View style={styles.rfContainer}>
        {(rfListening || rfStatus === 'sent') && rfTranscript ? (
          <Text style={styles.rfTranscript} numberOfLines={2}>{rfTranscript}</Text>
        ) : null}
        <Text style={styles.rfHint}>
          {rfHintText}
        </Text>
        <Pressable
          ref={rfButtonRef}
          accessibilityRole="button"
          accessibilityLabel={rfListening ? 'Release to send' : 'Hold to talk, Rapid Fire'}
          style={({ pressed }) => [
            styles.rfButton,
            rfListening && styles.rfButtonOn,
            // @ts-ignore - Web-only CSS to disable long-press selection/callouts
            Platform.OS === 'web' && { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'manipulation' },
            pressed && !rfListening && { opacity: 0.8 },
          ]}
          onPressIn={(e: GestureResponderEvent) => {
            rfGrantTimeRef.current = Date.now();
            rfPressInSeenRef.current = true;
            rfLog('mic:onPressIn', {
              listening: rfListeningRef.current,
              starting: rfStartingRef.current,
              pageX: e.nativeEvent.pageX,
              pageY: e.nativeEvent.pageY,
            });
            if (!rfListeningRef.current) { void rfStartRecording(e); }
          }}
          onPressOut={() => {
            rfPressInSeenRef.current = false;
            const dt = Date.now() - rfGrantTimeRef.current;
            const delay = Math.max(0, rfMinHoldMs - dt);
            rfLog('mic:onPressOut', { listening: rfListeningRef.current, dt, delay });
            if (delay > 0) {
              setTimeout(() => {
                rfLog('mic:onPressOut -> delayed stop fired', { listening: rfListeningRef.current });
                if (rfListeningRef.current) { void rfStopAndFire(); }
              }, delay);
            } else {
              if (rfListeningRef.current) { void rfStopAndFire(); }
            }
          }}
        >
          <Text style={styles.rfButtonText}>{rfListening ? '\uD83C\uDF99\uFE0F' : '\uD83C\uDFA4'}</Text>
          <Text style={styles.rfButtonLabel}>
            {rfListening ? '...' : (rfStatus === 'sending' ? 'Sending' : 'Hold')}
          </Text>
        </Pressable>
      </View>
      <AgentSelectorSheet
        visible={agentSelectorVisible}
        onClose={() => setAgentSelectorVisible(false)}
      />
    </View>
  );
}

function createStyles(theme: Theme, screenHeight: number) {
  const rfButtonHeight = Math.round(screenHeight * 0.18);
  const headerAgentSelectorTouchTarget = createMinimumTouchTargetStyle({
    horizontalPadding: spacing.sm,
    verticalPadding: 4,
    horizontalMargin: 0,
  });
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    spinner: {
      width: 48,
      height: 48,
    },
    loadingText: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      marginTop: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: theme.hairline,
      borderBottomColor: theme.colors.border,
    },
    newButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: radius.lg,
    },
    sessionActionTouchTarget: {
      ...createMinimumTouchTargetStyle({
        horizontalPadding: spacing.md,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
    },
    newButtonText: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    clearButton: {
      borderRadius: radius.lg,
    },
    clearButtonText: {
      color: theme.colors.destructive,
      fontSize: 14,
    },
    headerSettingsButton: {
      ...createMinimumTouchTargetStyle({
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
      marginLeft: spacing.xs,
    },
    headerAgentSelectorTrigger: {
      ...headerAgentSelectorTouchTarget,
      flexDirection: 'column',
      borderRadius: radius.lg,
      gap: 2,
    },
    headerAgentSelectorTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    headerAgentSelectorBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      minHeight: 24,
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary + '1a',
      maxWidth: 180,
    },
    headerAgentSelectorBadgeStatic: {
      backgroundColor: theme.colors.muted,
    },
    headerAgentSelectorBadgeText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
      flexShrink: 1,
    },
    headerAgentSelectorBadgeChevron: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '700',
      marginLeft: 4,
      flexShrink: 0,
    },
    headerAgentSelectorBadgeTextStatic: {
      color: theme.colors.mutedForeground,
    },
    list: {
      padding: spacing.md,
    },
    emptyList: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sessionItem: {
      backgroundColor: theme.colors.card,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sessionItemActive: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    sessionTitle: {
      ...theme.typography.body,
      fontWeight: '600',
      flex: 1,
      marginRight: 8,
    },
    sessionDate: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
    },
    sessionPreview: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      marginBottom: 4,
    },
    sessionMeta: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
    },
    emptyState: {
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyTitle: {
      ...theme.typography.h2,
      marginBottom: spacing.sm,
    },
    emptySubtitle: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      textAlign: 'center',
    },
    rfContainer: {
      borderTopWidth: theme.hairline,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
      alignItems: 'center',
    },
    rfHint: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    rfTranscript: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      textAlign: 'center',
      marginBottom: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    rfButton: {
      width: '100%' as any,
      height: rfButtonHeight,
      borderRadius: radius.xl,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rfButtonOn: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    rfButtonText: {
      fontSize: 36,
    },
    rfButtonLabel: {
      fontSize: 13,
      color: theme.colors.mutedForeground,
      marginTop: 4,
      fontWeight: '600',
    },
  });
}
