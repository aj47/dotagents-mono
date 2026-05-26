import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConfigContext } from '../store/config';
import { playRealtimePcm16Audio, stopRealtimeAudio } from '../lib/realtimeAudio';
import { RealtimeConnectionStatus, RealtimeTextAudioClient } from '../lib/realtimeClient';
import { useSpeechRecognizer } from '../lib/voice/useSpeechRecognizer';
import { useHandsFreeController } from '../lib/voice/useHandsFreeController';
import { useTheme } from '../ui/ThemeProvider';
import { Theme, radius, spacing } from '../ui/theme';
import { createButtonAccessibilityLabel, createTextInputAccessibilityLabel } from '../lib/accessibility';

type RealtimeMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type AudioStatus = 'idle' | 'collecting' | 'preparing' | 'playing' | 'error';

const DEFAULT_REALTIME_MODEL = 'gpt-realtime-mini';
const REALTIME_VOICE = 'alloy';
const REALTIME_INSTRUCTIONS = 'You are a concise hands-free voice assistant inside the DotAgents mobile prototype. Reply naturally, keep most answers under three sentences, and ask a brief follow-up when needed.';

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export default function RealtimeChatScreen() {
  const { config } = useConfigContext();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [model, setModel] = useState(DEFAULT_REALTIME_MODEL);
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastLog, setLastLog] = useState<string | null>(null);

  const clientRef = useRef<RealtimeTextAudioClient | null>(null);
  const audioChunksRef = useRef<Uint8Array[]>([]);
  const currentAssistantIdRef = useRef<string | null>(null);
  const statusRef = useRef(status);
  const audioStatusRef = useRef(audioStatus);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { audioStatusRef.current = audioStatus; }, [audioStatus]);

  const isConnected = status === 'connected' || status === 'responding';
  const isBusy = status === 'responding' || audioStatus === 'collecting' || audioStatus === 'preparing' || audioStatus === 'playing';
  const isPairedDesktopRoute = !/(^|\.)openai\.com\/v1$/i.test(config.baseUrl.trim());

  const handsFree = useHandsFreeController({
    enabled: isConnected,
    runtimeActive: true,
    wakePhrase: config.handsFreeWakePhrase || 'hey dot agents',
    sleepPhrase: config.handsFreeSleepPhrase || 'go to sleep',
    allowDirectSpeechWhileSleeping: true,
  });

  const addUserMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: createMessageId('user'), role: 'user', text }]);
  }, []);

  const appendAssistantDelta = useCallback((delta: string) => {
    setMessages((prev) => {
      let assistantId = currentAssistantIdRef.current;
      if (!assistantId) {
        assistantId = createMessageId('assistant');
        currentAssistantIdRef.current = assistantId;
        return [...prev, { id: assistantId, role: 'assistant', text: delta }];
      }
      return prev.map((message) => (
        message.id === assistantId
          ? { ...message, text: `${message.text}${delta}` }
          : message
      ));
    });
  }, []);

  const finishAssistantTurn = useCallback(() => {
    setAudioStatus('idle');
    currentAssistantIdRef.current = null;
    handsFree.onSpeechFinished();
    handsFree.onRequestCompleted();
  }, [handsFree]);

  const handleRealtimeError = useCallback((message: string) => {
    setError(message);
    setAudioStatus('error');
    setStatus('error');
  }, []);

  const handleAudioDone = useCallback(() => {
    const chunks = audioChunksRef.current;
    audioChunksRef.current = [];
    if (chunks.length === 0) {
      finishAssistantTurn();
      return;
    }

    setAudioStatus('preparing');
    void playRealtimePcm16Audio(chunks, {
      onStart: () => {
        setAudioStatus('playing');
        handsFree.onSpeechStarted();
      },
      onDone: finishAssistantTurn,
      onStopped: finishAssistantTurn,
      onError: (message) => {
        handleRealtimeError(message);
        finishAssistantTurn();
      },
    });
  }, [finishAssistantTurn, handleRealtimeError, handsFree]);

  const connect = useCallback(async () => {
    if (!config.apiKey.trim()) {
      Alert.alert('Desktop pairing required', 'Pair this phone with DotAgents desktop before starting the Realtime prototype. The desktop forwards Realtime traffic with its configured OpenAI key.');
      return;
    }

    setError(null);
    setMessages([]);
    audioChunksRef.current = [];
    currentAssistantIdRef.current = null;
    stopRealtimeAudio(false);

    const client = new RealtimeTextAudioClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: model.trim() || DEFAULT_REALTIME_MODEL,
      voice: REALTIME_VOICE,
      instructions: REALTIME_INSTRUCTIONS,
      onStatus: setStatus,
      onTextDelta: appendAssistantDelta,
      onAudioDelta: (chunk) => {
        audioChunksRef.current.push(chunk);
        setAudioStatus('collecting');
      },
      onAudioDone: handleAudioDone,
      onResponseDone: () => {
        currentAssistantIdRef.current = null;
        if (audioChunksRef.current.length === 0 && audioStatusRef.current !== 'playing' && audioStatusRef.current !== 'preparing') {
          finishAssistantTurn();
        }
      },
      onError: handleRealtimeError,
      onLog: (message, detail) => {
        if (__DEV__) console.log('[RealtimePrototype]', message, detail ?? '');
        setLastLog(message);
      },
    });

    clientRef.current = client;
    try {
      await client.connect();
      handsFree.wakeByUser();
    } catch (err) {
      handleRealtimeError((err as any)?.message || 'Failed to connect to Realtime.');
    }
  }, [appendAssistantDelta, config.apiKey, config.baseUrl, finishAssistantTurn, handleAudioDone, handleRealtimeError, handsFree, model]);

  const disconnect = useCallback(async () => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    audioChunksRef.current = [];
    currentAssistantIdRef.current = null;
    stopRealtimeAudio(true);
    setStatus('disconnected');
    setAudioStatus('idle');
    setError(null);
  }, []);

  const sendText = useCallback((rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    if (!clientRef.current || !isConnected) {
      Alert.alert('Realtime not connected', 'Tap Start Realtime first, then speak or send a test message.');
      return;
    }

    try {
      setError(null);
      stopRealtimeAudio(true);
      audioChunksRef.current = [];
      currentAssistantIdRef.current = null;
      addUserMessage(text);
      handsFree.onRequestStarted();
      clientRef.current.sendUserText(text);
      setDraft('');
    } catch (err) {
      handleRealtimeError((err as any)?.message || 'Failed to send Realtime message.');
    }
  }, [addUserMessage, handleRealtimeError, handsFree, isConnected]);

  const handleVoiceFinalized = useCallback((payload: { text: string }) => {
    const action = handsFree.handleFinalTranscript(payload.text);
    if (action.type === 'send') {
      sendText(action.text);
    }
  }, [handsFree, sendText]);

  const speech = useSpeechRecognizer({
    enabled: isConnected && !isBusy,
    handsFree: true,
    handsFreeDebounceMs: config.handsFreeMessageDebounceMs,
    willCancel: false,
    onVoiceFinalized: handleVoiceFinalized,
    onRecognizerError: handsFree.onRecognizerError,
    shouldSuppressHandsFreeTranscript: () => isBusy,
    audioInputDeviceId: config.audioInputDeviceId,
  });

  useEffect(() => {
    const shouldListen = isConnected && !isBusy && handsFree.shouldKeepRecognizerActive;
    if (shouldListen && !speech.listening) {
      void speech.startRecording();
      return;
    }
    if (!shouldListen && speech.listening) {
      void speech.stopRecognitionOnly();
    }
  }, [handsFree.shouldKeepRecognizerActive, isBusy, isConnected, speech]);

  useEffect(() => () => {
    clientRef.current?.disconnect();
    stopRealtimeAudio(false);
    void speech.stopRecognitionOnly();
  }, []);

  const statusLabel = isConnected
    ? `${handsFree.statusLabel}${isBusy ? ' · busy' : speech.listening ? ' · mic on' : ''}`
    : status === 'connecting' ? 'Connecting' : status === 'error' ? 'Error' : 'Disconnected';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 64}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.kicker}>Prototype</Text>
              <Text style={styles.title}>GPT Realtime Hands-Free</Text>
            </View>
            <View style={[styles.statusPill, isConnected && styles.statusPillConnected]}>
              <Text style={[styles.statusPillText, isConnected && styles.statusPillTextConnected]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.description}>
            Uses mobile speech recognition for hands-free input, connects through the paired DotAgents desktop Realtime proxy, then plays returned PCM16 audio.
          </Text>
          {isPairedDesktopRoute ? (
            <Text style={styles.metaText}>Using paired desktop route: {config.baseUrl}</Text>
          ) : (
            <Text style={styles.warningText}>Direct OpenAI URL detected. For desktop-mediated hands-free mode, pair with DotAgents desktop and use its remote-server URL.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Realtime model</Text>
          <TextInput
            value={model}
            onChangeText={setModel}
            editable={!isConnected && status !== 'connecting'}
            placeholder={DEFAULT_REALTIME_MODEL}
            placeholderTextColor={theme.colors.mutedForeground}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={createTextInputAccessibilityLabel('Realtime model')}
          />
          <Text style={styles.metaText}>Voice: {REALTIME_VOICE} · Audio: PCM16 24kHz</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={isConnected || status === 'connecting' ? disconnect : connect}
              style={[styles.primaryButton, (isConnected || status === 'connecting') && styles.stopButton]}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(isConnected ? 'Stop Realtime' : 'Start Realtime')}
            >
              {status === 'connecting' ? <ActivityIndicator color={theme.colors.primaryForeground} /> : (
                <Text style={styles.primaryButtonText}>{isConnected ? 'Stop Realtime' : 'Start Realtime'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handsFree.state.phase === 'sleeping' ? handsFree.wakeByUser : handsFree.sleepByUser}
              style={styles.secondaryButton}
              disabled={!isConnected}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(handsFree.state.phase === 'sleeping' ? 'Wake hands-free' : 'Sleep hands-free')}
            >
              <Ionicons name={handsFree.state.phase === 'sleeping' ? 'radio-outline' : 'moon-outline'} size={16} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>{handsFree.state.phase === 'sleeping' ? 'Wake' : 'Sleep'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Hands-free transcript</Text>
          <Text style={styles.liveTranscript}>{speech.liveTranscript || speech.sttPreview || 'Start Realtime, then speak. The prototype sends after a short pause.'}</Text>
          <Text style={styles.metaText}>Sleep phrase: “{config.handsFreeSleepPhrase || 'go to sleep'}”</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Manual fallback</Text>
          <View style={styles.composerRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a test message"
              placeholderTextColor={theme.colors.mutedForeground}
              style={[styles.input, styles.composerInput]}
              returnKeyType="send"
              onSubmitEditing={() => sendText(draft)}
              accessibilityLabel={createTextInputAccessibilityLabel('Realtime test message')}
            />
            <TouchableOpacity
              onPress={() => sendText(draft)}
              style={styles.sendButton}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel('Send Realtime test message')}
            >
              <Ionicons name="send" size={18} color={theme.colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.messagesCard}>
          {messages.length === 0 ? (
            <Text style={styles.emptyText}>No Realtime turns yet.</Text>
          ) : messages.map((message) => (
            <View key={message.id} style={[styles.messageBubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={styles.messageRole}>{message.role === 'user' ? 'You' : 'Realtime'}</Text>
              <Text style={styles.messageText}>{message.text || '…'}</Text>
            </View>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {lastLog && __DEV__ ? <Text style={styles.metaText}>Last event: {lastLog}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
    heroCard: { ...theme.card, gap: spacing.sm },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'flex-start' },
    kicker: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '700', textTransform: 'uppercase' },
    title: { ...theme.typography.h1, flexShrink: 1 },
    description: { ...theme.typography.body, color: theme.colors.mutedForeground },
    warningText: { ...theme.typography.caption, color: theme.colors.destructive },
    card: { ...theme.card, gap: spacing.sm },
    messagesCard: { gap: spacing.sm },
    statusPill: { borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    statusPillConnected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    statusPillText: { ...theme.typography.caption, color: theme.colors.mutedForeground, fontWeight: '700' },
    statusPillTextConnected: { color: theme.colors.primaryForeground },
    label: { ...theme.typography.label },
    input: { ...theme.input },
    metaText: { ...theme.typography.caption, color: theme.colors.mutedForeground },
    liveTranscript: { ...theme.typography.body, color: theme.colors.foreground, minHeight: 44 },
    actionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    primaryButton: { flex: 1, minHeight: 44, borderRadius: radius.lg, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
    stopButton: { backgroundColor: theme.colors.destructive },
    primaryButtonText: { color: theme.colors.primaryForeground, fontWeight: '700' },
    secondaryButton: { minHeight: 44, borderRadius: radius.lg, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    secondaryButtonText: { color: theme.colors.primary, fontWeight: '700' },
    composerRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    composerInput: { flex: 1 },
    sendButton: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
    messageBubble: { borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.colors.border, gap: spacing.xs },
    userBubble: { backgroundColor: theme.colors.primary + '14', marginLeft: spacing.xl },
    assistantBubble: { backgroundColor: theme.colors.card, marginRight: spacing.xl },
    messageRole: { ...theme.typography.caption, color: theme.colors.mutedForeground, fontWeight: '700' },
    messageText: { ...theme.typography.body, color: theme.colors.foreground },
    emptyText: { ...theme.typography.body, color: theme.colors.mutedForeground, textAlign: 'center', padding: spacing.lg },
    errorText: { ...theme.typography.body, color: theme.colors.destructive },
  });
}