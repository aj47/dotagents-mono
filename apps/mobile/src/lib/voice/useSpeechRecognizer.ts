import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  GestureResponderEvent,
  Platform,
  View,
} from 'react-native';
import { EventEmitter } from 'expo-modules-core';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS } from '../../store/config';
import { logRemoteSttFailure, transcribeRemoteSttRecording } from '../remoteStt';
import type { VoiceDebugLog } from './voiceDebug';
import { mergeVoiceText, normalizeVoiceText } from './mergeVoiceText';
import {
  appendWebSpeechSessionText,
  applyWebSpeechTranscriptEvent,
  createWebSpeechTranscriptState,
  getWebSpeechTranscriptText,
  resetWebSpeechTranscriptState,
} from './webTranscriptAssembly';

export type VoiceFinalizationMode = 'edit' | 'send' | 'handsfree';

type VoiceFinalizedPayload = {
  text: string;
  mode: VoiceFinalizationMode;
  source: 'native' | 'web';
};

type SuppressedHandsFreeTranscriptPayload = {
  text: string;
  source: 'native' | 'web';
  isFinal?: boolean;
};

type HandsFreeTranscriptPayload = {
  text: string;
  source: 'native' | 'web';
  isFinal?: boolean;
};

type DeferredPushToTalkFinal = {
  gestureId: number;
  text: string;
  source: 'native' | 'web';
};

type UseSpeechRecognizerOptions = {
  enabled?: boolean;
  handsFree: boolean;
  handsFreeDebounceMs?: number;
  desktopStt?: {
    enabled?: boolean;
    baseUrl?: string;
    apiKey?: string;
  };
  willCancel: boolean;
  onVoiceFinalized: (payload: VoiceFinalizedPayload) => void;
  onRecognizerError?: (message: string) => void;
  onPermissionDenied?: () => void;
  shouldSuppressHandsFreeTranscript?: () => boolean;
  shouldFinalizeHandsFreeTranscript?: (payload?: HandsFreeTranscriptPayload) => boolean;
  shouldImmediatelyFinalizeHandsFreeTranscript?: (payload: HandsFreeTranscriptPayload) => boolean;
  onSuppressedHandsFreeTranscript?: (payload: SuppressedHandsFreeTranscriptPayload) => boolean;
  log?: VoiceDebugLog;
  /** Preferred microphone device ID (web only). When set, getUserMedia is called
   *  with this deviceId before starting the Web Speech API recognizer so the
   *  browser routes audio from the selected input device. On native platforms
   *  this value is ignored — device selection is managed by the OS. */
  audioInputDeviceId?: string;
};

const MIN_HOLD_MS = 200;
const DEBUG_TRANSCRIPT_MAX_LENGTH = 160;
const WEB_HANDS_FREE_RECOGNIZER_WATCHDOG_MS = 15_000;
const WEB_RECOGNITION_ALREADY_STARTED_PATTERN = /recognition has already started/i;

const truncateDebugText = (text?: string) => {
  const normalized = normalizeVoiceText(text);
  return normalized.length > DEBUG_TRANSCRIPT_MAX_LENGTH
    ? `${normalized.slice(0, DEBUG_TRANSCRIPT_MAX_LENGTH)}...`
    : normalized;
};

const getRecognitionSource = (): 'native' | 'web' => (Platform.OS === 'web' ? 'web' : 'native');

const createNativeSpeechStartOptions = (
  _SR: any,
  options: {
    continuous: boolean;
    volumeChangeEvents: boolean;
  },
) => {
  return {
    lang: 'en-US',
    interimResults: true,
    continuous: options.continuous,
    volumeChangeEventOptions: { enabled: options.volumeChangeEvents, intervalMillis: 250 },
  };
};

const isWebRecognitionAlreadyStartedError = (error: unknown) => {
  const message = (error as any)?.message || String(error);
  return WEB_RECOGNITION_ALREADY_STARTED_PATTERN.test(message);
};

export function useSpeechRecognizer(options: UseSpeechRecognizerOptions) {
  const {
    enabled = true,
    handsFree,
    handsFreeDebounceMs = DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
    desktopStt,
    willCancel,
    onVoiceFinalized,
    onRecognizerError,
    onPermissionDenied,
    shouldSuppressHandsFreeTranscript,
    shouldFinalizeHandsFreeTranscript,
    shouldImmediatelyFinalizeHandsFreeTranscript,
    onSuppressedHandsFreeTranscript,
    log,
    audioInputDeviceId,
  } = options;
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [sttPreview, setSttPreview] = useState('');
  const [handsFreeDebounceEndsAt, setHandsFreeDebounceEndsAt] = useState<number | null>(null);
  const desktopSttRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const listeningRef = useRef(false);
  const webRecognitionRef = useRef<any>(null);
  const webRecognizerActiveRef = useRef(false);
  const webRecognizerStartPendingRef = useRef(false);
  const webRecognizerWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webFinalRef = useRef('');
  const webHandsFreeTranscriptStateRef = useRef(createWebSpeechTranscriptState());
  const webHandsFreeCaptureTextRef = useRef('');
  const liveTranscriptRef = useRef('');
  const nativeFinalRef = useRef('');
  const pendingHandsFreeFinalRef = useRef('');
  const handsFreeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handsFreeCaptureGenerationRef = useRef(0);
  const sttPreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startingRef = useRef(false);
  const stoppingRef = useRef(false);
  const userReleasedButtonRef = useRef(false);
  const webPressInSeenRef = useRef(false);
  const lastGrantTimeRef = useRef(0);
  const micButtonRef = useRef<View>(null);
  const stopRecordingAndHandleRef = useRef<(() => Promise<void>) | null>(null);
  const stopDesktopSttRecordingRef = useRef<((options?: { finalize?: boolean }) => Promise<boolean>) | null>(null);
  const cleanupNativeSubsRef = useRef<(() => void) | null>(null);
  const clearHandsFreeDebounceRef = useRef<(() => void) | null>(null);
  const nativeSRUnavailableShownRef = useRef(false);
  const srEmitterRef = useRef<any>(null);
  const srSubsRef = useRef<any[]>([]);
  const voiceGestureIdRef = useRef(0);
  const voiceGestureFinalizedIdRef = useRef(0);
  const pendingPushToTalkFinalRef = useRef<DeferredPushToTalkFinal | null>(null);
  const desktopSttRecordingRef = useRef(false);
  const desktopSttStartedAtRef = useRef<number | null>(null);
  const suppressFinalizeRef = useRef(false);
  const shouldSuppressHandsFreeTranscriptRef = useRef(shouldSuppressHandsFreeTranscript);
  const shouldFinalizeHandsFreeTranscriptRef = useRef(shouldFinalizeHandsFreeTranscript);
  const shouldImmediatelyFinalizeHandsFreeTranscriptRef = useRef(shouldImmediatelyFinalizeHandsFreeTranscript);
  const onSuppressedHandsFreeTranscriptRef = useRef(onSuppressedHandsFreeTranscript);
  const enabledRef = useRef(enabled);
  shouldSuppressHandsFreeTranscriptRef.current = shouldSuppressHandsFreeTranscript;
  shouldFinalizeHandsFreeTranscriptRef.current = shouldFinalizeHandsFreeTranscript;
  shouldImmediatelyFinalizeHandsFreeTranscriptRef.current = shouldImmediatelyFinalizeHandsFreeTranscript;
  onSuppressedHandsFreeTranscriptRef.current = onSuppressedHandsFreeTranscript;
  enabledRef.current = enabled;
  const desktopSttEnabled = !!desktopStt?.enabled && !handsFree;

  const setListeningValue = useCallback((value: boolean) => {
    listeningRef.current = value;
    setListening(value);
  }, []);

  const setLiveTranscriptValue = useCallback((value: string) => {
    liveTranscriptRef.current = value;
    setLiveTranscript(value);
  }, []);

  const setSttPreviewWithExpiry = useCallback((value: string) => {
    if (sttPreviewTimeoutRef.current) {
      clearTimeout(sttPreviewTimeoutRef.current);
      sttPreviewTimeoutRef.current = null;
    }
    setSttPreview(value);
    if (!value) {
      return;
    }
    sttPreviewTimeoutRef.current = setTimeout(() => {
      setSttPreview('');
      sttPreviewTimeoutRef.current = null;
    }, 5000);
  }, []);

  const cleanupNativeSubs = useCallback(() => {
    srSubsRef.current.forEach((sub) => sub?.remove?.());
    srSubsRef.current = [];
  }, []);
  cleanupNativeSubsRef.current = cleanupNativeSubs;

  const clearHandsFreeDebounce = useCallback(() => {
    if (handsFreeDebounceRef.current) {
      clearTimeout(handsFreeDebounceRef.current);
      handsFreeDebounceRef.current = null;
    }
    setHandsFreeDebounceEndsAt(null);
  }, []);
  clearHandsFreeDebounceRef.current = clearHandsFreeDebounce;

  const resetWebHandsFreeTranscript = useCallback((preserveCaptureText = false) => {
    resetWebSpeechTranscriptState(webHandsFreeTranscriptStateRef.current);
    if (!preserveCaptureText) {
      webHandsFreeCaptureTextRef.current = '';
    }
  }, []);

  const getWebHandsFreeCaptureText = useCallback(() => appendWebSpeechSessionText(
    webHandsFreeCaptureTextRef.current,
    getWebSpeechTranscriptText(webHandsFreeTranscriptStateRef.current),
  ), []);

  const commitWebHandsFreeSession = useCallback(() => {
    webHandsFreeCaptureTextRef.current = appendWebSpeechSessionText(
      webHandsFreeCaptureTextRef.current,
      getWebSpeechTranscriptText(webHandsFreeTranscriptStateRef.current),
    );
    resetWebSpeechTranscriptState(webHandsFreeTranscriptStateRef.current);
    return webHandsFreeCaptureTextRef.current;
  }, []);

  const invalidateHandsFreeCapture = useCallback((reason?: string) => {
    const hadPending = !!handsFreeDebounceRef.current || !!pendingHandsFreeFinalRef.current;
    handsFreeCaptureGenerationRef.current += 1;
    clearHandsFreeDebounce();
    pendingHandsFreeFinalRef.current = '';
    webFinalRef.current = '';
    resetWebHandsFreeTranscript();
    nativeFinalRef.current = '';
    if (hadPending) {
      log?.('finalization-cancelled', 'Hands-free transcript capture invalidated.', {
        reason: reason ?? 'unspecified',
        generation: handsFreeCaptureGenerationRef.current,
      });
    }
  }, [clearHandsFreeDebounce, log, resetWebHandsFreeTranscript]);

  const isHandsFreeTranscriptSuppressed = useCallback(() => (
    handsFree && shouldSuppressHandsFreeTranscriptRef.current?.() === true
  ), [handsFree]);

  const isHandsFreeFinalizationEligible = useCallback((payload?: HandsFreeTranscriptPayload) => (
    !handsFree || shouldFinalizeHandsFreeTranscriptRef.current?.(payload) !== false
  ), [handsFree]);

  const clearSuppressedHandsFreeTranscript = useCallback((source: 'native' | 'web', text?: string, isFinal?: boolean) => {
    const normalizedText = normalizeVoiceText(text);
    const handled = normalizedText
      ? onSuppressedHandsFreeTranscriptRef.current?.({
        text: normalizedText,
        source,
        isFinal,
      }) === true
      : false;
    clearHandsFreeDebounce();
    pendingHandsFreeFinalRef.current = '';
    nativeFinalRef.current = '';
    webFinalRef.current = '';
    resetWebHandsFreeTranscript();
    setLiveTranscriptValue('');
    setSttPreviewWithExpiry('');
    log?.('transcript-ignored', handled
      ? 'Hands-free transcript handled as a TTS control command.'
      : 'Hands-free transcript ignored before finalization while the assistant is busy or speaking.', {
      source,
      text: truncateDebugText(normalizedText),
      textLength: normalizedText.length,
    });
  }, [clearHandsFreeDebounce, log, resetWebHandsFreeTranscript, setLiveTranscriptValue, setSttPreviewWithExpiry]);

  const emitFinalized = useCallback((text: string, source: 'native' | 'web') => {
    if (!enabledRef.current) {
      log?.('transcript-ignored', 'Voice transcript ignored while speech recognizer is inactive.', {
        source,
        text: truncateDebugText(text),
        textLength: normalizeVoiceText(text).length,
      });
      return;
    }

    const finalText = normalizeVoiceText(text);
    if (!finalText) {
      log?.('transcript-ignored', 'Empty voice transcript ignored.', { source });
      return;
    }
    const mode = handsFree ? 'handsfree' : (willCancel ? 'edit' : 'send');
    if (mode === 'handsfree' && isHandsFreeTranscriptSuppressed()) {
      clearSuppressedHandsFreeTranscript(source, finalText);
      return;
    }
    if (mode === 'handsfree' && !isHandsFreeFinalizationEligible({ text: finalText, source })) {
      log?.('transcript-ignored', 'Hands-free transcript ignored because the capture turn is no longer eligible.', {
        source,
        text: truncateDebugText(finalText),
        textLength: finalText.length,
      });
      return;
    }
    log?.('transcript-finalized', 'Voice transcript finalized.', {
      source,
      mode,
      text: truncateDebugText(finalText),
      textLength: finalText.length,
    });
    setSttPreviewWithExpiry(finalText);
    onVoiceFinalized({
      text: finalText,
      mode,
      source,
    });
  }, [
    clearSuppressedHandsFreeTranscript,
    handsFree,
    isHandsFreeFinalizationEligible,
    isHandsFreeTranscriptSuppressed,
    log,
    onVoiceFinalized,
    setSttPreviewWithExpiry,
    willCancel,
  ]);

  const deferPushToTalkFinalization = useCallback((text: string, source: 'native' | 'web') => {
    const finalText = normalizeVoiceText(text);
    if (!finalText) {
      return false;
    }

    pendingPushToTalkFinalRef.current = {
      gestureId: voiceGestureIdRef.current,
      text: finalText,
      source,
    };
    log?.('finalization-scheduled', 'Push-to-talk finalization deferred until release.', {
      source,
      gestureId: voiceGestureIdRef.current,
      text: truncateDebugText(finalText),
      textLength: finalText.length,
    });
    setSttPreviewWithExpiry(finalText);
    return true;
  }, [log, setSttPreviewWithExpiry]);

  const flushPendingPushToTalkFinalization = useCallback(() => {
    const pendingFinal = pendingPushToTalkFinalRef.current;
    if (!pendingFinal) {
      return false;
    }

    pendingPushToTalkFinalRef.current = null;
    voiceGestureFinalizedIdRef.current = pendingFinal.gestureId;
    log?.('finalization-fired', 'Deferred push-to-talk transcript finalized.', {
      source: pendingFinal.source,
      gestureId: pendingFinal.gestureId,
      text: truncateDebugText(pendingFinal.text),
      textLength: pendingFinal.text.length,
    });
    emitFinalized(pendingFinal.text, pendingFinal.source);
    return true;
  }, [emitFinalized, log]);

  const startDesktopSttRecording = useCallback(async () => {
    if (!desktopSttEnabled) {
      return false;
    }
    if (!desktopStt?.baseUrl || !desktopStt?.apiKey) {
      const message = 'Desktop speech-to-text requires a paired DotAgents desktop URL and API key.';
      log?.('recognizer-error', message, { source: getRecognitionSource() });
      onRecognizerError?.(message);
      setListeningValue(false);
      return true;
    }

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission?.granted) {
        setListeningValue(false);
        onPermissionDenied?.();
        log?.('permission-denied', 'Microphone permission was denied for desktop speech-to-text.');
        return true;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      });
      await desktopSttRecorder.prepareToRecordAsync();
      desktopSttRecorder.record();
      desktopSttRecordingRef.current = true;
      desktopSttStartedAtRef.current = Date.now();
      log?.('recognizer-start', 'Desktop provider speech-to-text recording started.', {
        source: getRecognitionSource(),
      });
      return true;
    } catch (error) {
      const message = (error as any)?.message || String(error);
      setListeningValue(false);
      desktopSttRecordingRef.current = false;
      desktopSttStartedAtRef.current = null;
      log?.('recognizer-error', 'Desktop provider speech-to-text recording failed to start.', {
        source: getRecognitionSource(),
        message,
      });
      onRecognizerError?.(message);
      return true;
    }
  }, [
    desktopStt?.apiKey,
    desktopStt?.baseUrl,
    desktopSttEnabled,
    desktopSttRecorder,
    log,
    onPermissionDenied,
    onRecognizerError,
    setListeningValue,
  ]);

  const stopDesktopSttRecording = useCallback(async (options?: { finalize?: boolean }) => {
    if (!desktopSttRecordingRef.current) {
      return false;
    }

    const shouldFinalize = options?.finalize !== false;
    const startedAt = desktopSttStartedAtRef.current;
    const durationMs = startedAt ? Date.now() - startedAt : undefined;
    desktopSttRecordingRef.current = false;
    desktopSttStartedAtRef.current = null;
    log?.('recognizer-stop', 'Desktop provider speech-to-text recording stopping.', {
      source: getRecognitionSource(),
      finalize: shouldFinalize,
      durationMs,
    });

    try {
      await desktopSttRecorder.stop();
    } catch (error) {
      const message = (error as any)?.message || String(error);
      log?.('recognizer-error', 'Desktop provider speech-to-text recording failed to stop.', {
        source: getRecognitionSource(),
        message,
      });
      onRecognizerError?.(message);
    } finally {
      setListeningValue(false);
      setLiveTranscriptValue('');
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }

    if (!shouldFinalize) {
      return true;
    }

    const status = desktopSttRecorder.getStatus();
    const uri = status.url;
    if (!uri) {
      const message = 'Desktop speech-to-text recording did not produce an audio file.';
      log?.('transcript-ignored', message, { source: getRecognitionSource() });
      onRecognizerError?.(message);
      return true;
    }

    try {
      log?.('finalization-scheduled', 'Desktop provider speech-to-text transcription started.', {
        source: getRecognitionSource(),
        durationMs,
      });
      const result = await transcribeRemoteSttRecording({
        baseUrl: desktopStt?.baseUrl || '',
        apiKey: desktopStt?.apiKey || '',
        uri,
        durationMs,
      });
      log?.('recognizer-result', 'Desktop provider speech-to-text produced a result.', {
        source: getRecognitionSource(),
        provider: result.provider,
        model: result.model,
        text: truncateDebugText(result.text),
        textLength: result.text?.length ?? 0,
      });
      voiceGestureFinalizedIdRef.current = voiceGestureIdRef.current;
      emitFinalized(result.text || '', getRecognitionSource());
    } catch (error) {
      logRemoteSttFailure(error);
      const message = (error as any)?.message || String(error);
      log?.('recognizer-error', 'Desktop provider speech-to-text transcription failed.', {
        source: getRecognitionSource(),
        message,
      });
      onRecognizerError?.(message);
    }

    return true;
  }, [
    desktopStt?.apiKey,
    desktopStt?.baseUrl,
    desktopSttRecorder,
    emitFinalized,
    log,
    onRecognizerError,
    setListeningValue,
    setLiveTranscriptValue,
  ]);
  stopDesktopSttRecordingRef.current = stopDesktopSttRecording;

  const stopRecognitionOnly = useCallback(async (options?: { preservePendingHandsFreeFinal?: boolean }) => {
    const pendingHandsFreeFinal = normalizeVoiceText(pendingHandsFreeFinalRef.current);
    const shouldPreservePendingHandsFreeFinal = !!options?.preservePendingHandsFreeFinal
      && handsFree
      && !!pendingHandsFreeFinal
      && !!handsFreeDebounceRef.current
      && !isHandsFreeTranscriptSuppressed();
    suppressFinalizeRef.current = true;
    userReleasedButtonRef.current = true;
    if (!shouldPreservePendingHandsFreeFinal) {
      clearHandsFreeDebounce();
    }
    log?.('recognizer-stop', 'Stopping speech recognizer without finalization.', {
      source: getRecognitionSource(),
      handsFree,
      listening: listeningRef.current,
      preservePendingHandsFreeFinal: shouldPreservePendingHandsFreeFinal,
      pendingText: truncateDebugText(pendingHandsFreeFinal),
    });

    try {
      if (await stopDesktopSttRecording({ finalize: false })) {
        return;
      }

      if (Platform.OS !== 'web') {
        try {
          const SR: any = await import('expo-speech-recognition');
          SR?.ExpoSpeechRecognitionModule?.stop?.();
        } catch {}
      }

      if (Platform.OS === 'web' && webRecognitionRef.current) {
        try {
          webRecognitionRef.current.stop();
        } catch {}
      }
    } finally {
      if (Platform.OS !== 'web') {
        cleanupNativeSubs();
      }
      setListeningValue(false);
      if (!shouldPreservePendingHandsFreeFinal) {
        setLiveTranscriptValue('');
        pendingHandsFreeFinalRef.current = '';
      }
      if (shouldPreservePendingHandsFreeFinal) {
        webHandsFreeCaptureTextRef.current = pendingHandsFreeFinal;
      }
      resetWebHandsFreeTranscript(shouldPreservePendingHandsFreeFinal);
      pendingPushToTalkFinalRef.current = null;
      nativeFinalRef.current = '';
      webFinalRef.current = '';
      webPressInSeenRef.current = false;
      log?.('recognizer-stop', 'Speech recognizer stopped.');
    }
  }, [cleanupNativeSubs, clearHandsFreeDebounce, handsFree, isHandsFreeTranscriptSuppressed, log, resetWebHandsFreeTranscript, setListeningValue, setLiveTranscriptValue, stopDesktopSttRecording]);

  useEffect(() => {
    if (enabled || !listeningRef.current) {
      return;
    }
    void stopRecognitionOnly();
  }, [enabled, stopRecognitionOnly]);

  useEffect(() => {
    if (enabled || Platform.OS === 'web') {
      return;
    }
    cleanupNativeSubs();
  }, [cleanupNativeSubs, enabled]);

  const finalizePendingHandsFree = useCallback((source: 'native' | 'web') => {
    if (!enabledRef.current) {
      pendingHandsFreeFinalRef.current = '';
      if (source === 'web') {
        webFinalRef.current = '';
      } else {
        nativeFinalRef.current = '';
      }
      setLiveTranscriptValue('');
      log?.('transcript-ignored', 'Hands-free finalization skipped while speech recognizer is inactive.', { source });
      return false;
    }

    const textToSend = normalizeVoiceText(
      pendingHandsFreeFinalRef.current
      || (source === 'web' ? webFinalRef.current : nativeFinalRef.current)
      || liveTranscriptRef.current,
    );

    pendingHandsFreeFinalRef.current = '';
    setHandsFreeDebounceEndsAt(null);
    if (source === 'web') {
      webFinalRef.current = '';
    } else {
      nativeFinalRef.current = '';
    }
    setLiveTranscriptValue('');

    if (!textToSend) {
      log?.('transcript-ignored', 'Hands-free finalization fired with no transcript.', { source });
      return false;
    }

    if (isHandsFreeTranscriptSuppressed()) {
      clearSuppressedHandsFreeTranscript(source, textToSend);
      return false;
    }

    if (!isHandsFreeFinalizationEligible({ text: textToSend, source })) {
      log?.('transcript-ignored', 'Hands-free finalization skipped because the capture turn is no longer eligible.', {
        source,
        text: truncateDebugText(textToSend),
        textLength: textToSend.length,
      });
      return false;
    }

    log?.('finalization-fired', 'Hands-free transcript debounce elapsed.', {
      source,
      text: truncateDebugText(textToSend),
      textLength: textToSend.length,
    });
    void stopRecognitionOnly();
    emitFinalized(textToSend, source);
    return true;
  }, [clearSuppressedHandsFreeTranscript, emitFinalized, isHandsFreeFinalizationEligible, isHandsFreeTranscriptSuppressed, log, setLiveTranscriptValue, stopRecognitionOnly]);

  const maybeFinalizeHandsFreeImmediately = useCallback((source: 'native' | 'web', text: string, isFinal?: boolean) => {
    if (!handsFree || !enabledRef.current) {
      return false;
    }

    const finalText = normalizeVoiceText(text);
    if (!finalText) {
      return false;
    }

    if (isHandsFreeTranscriptSuppressed()) {
      clearSuppressedHandsFreeTranscript(source, finalText, isFinal);
      return true;
    }

    if (!isHandsFreeFinalizationEligible({ text: finalText, source, isFinal })) {
      return false;
    }

    const shouldFinalizeImmediately = shouldImmediatelyFinalizeHandsFreeTranscriptRef.current?.({
      text: finalText,
      source,
      isFinal,
    }) === true;
    if (!shouldFinalizeImmediately) {
      return false;
    }

    clearHandsFreeDebounce();
    pendingHandsFreeFinalRef.current = '';
    if (source === 'web') {
      webFinalRef.current = '';
    } else {
      nativeFinalRef.current = '';
    }
    setLiveTranscriptValue(finalText);
    setSttPreviewWithExpiry(finalText);
    setHandsFreeDebounceEndsAt(null);
    log?.('finalization-fired', 'Hands-free transcript finalized immediately.', {
      source,
      isFinal: !!isFinal,
      text: truncateDebugText(finalText),
      textLength: finalText.length,
    });
    void stopRecognitionOnly();
    emitFinalized(finalText, source);
    return true;
  }, [
    clearHandsFreeDebounce,
    clearSuppressedHandsFreeTranscript,
    emitFinalized,
    handsFree,
    isHandsFreeFinalizationEligible,
    isHandsFreeTranscriptSuppressed,
    log,
    setLiveTranscriptValue,
    setSttPreviewWithExpiry,
    stopRecognitionOnly,
  ]);

  const scheduleHandsFreeFinalization = useCallback((source: 'native' | 'web', text: string) => {
    if (!enabledRef.current) {
      return false;
    }

    const finalText = normalizeVoiceText(text);
    if (!finalText) {
      return false;
    }
    if (isHandsFreeTranscriptSuppressed()) {
      clearSuppressedHandsFreeTranscript(source, finalText);
      return false;
    }
    if (!isHandsFreeFinalizationEligible({ text: finalText, source })) {
      clearHandsFreeDebounce();
      pendingHandsFreeFinalRef.current = '';
      log?.('transcript-ignored', 'Hands-free finalization schedule skipped because the capture turn is no longer eligible.', {
        source,
        text: truncateDebugText(finalText),
        textLength: finalText.length,
      });
      return false;
    }

    const hadPendingCountdown = !!handsFreeDebounceRef.current;
    pendingHandsFreeFinalRef.current = finalText;
    if (source === 'web') {
      webFinalRef.current = '';
    } else {
      nativeFinalRef.current = '';
    }

    clearHandsFreeDebounce();
    const debounceMs = Math.max(0, handsFreeDebounceMs);
    const scheduledGeneration = handsFreeCaptureGenerationRef.current;
    setHandsFreeDebounceEndsAt(Date.now() + debounceMs);
    log?.('finalization-scheduled', 'Hands-free transcript debounce scheduled.', {
      source,
      debounceMs,
      generation: scheduledGeneration,
      extended: hadPendingCountdown,
      text: truncateDebugText(finalText),
      textLength: finalText.length,
    });
    handsFreeDebounceRef.current = setTimeout(() => {
      handsFreeDebounceRef.current = null;
      setHandsFreeDebounceEndsAt(null);
      if (handsFreeCaptureGenerationRef.current !== scheduledGeneration) {
        pendingHandsFreeFinalRef.current = '';
        if (source === 'web') {
          webFinalRef.current = '';
        } else {
          nativeFinalRef.current = '';
        }
        log?.('finalization-cancelled', 'Hands-free transcript debounce fired after capture invalidation.', {
          source,
          scheduledGeneration,
          currentGeneration: handsFreeCaptureGenerationRef.current,
        });
        return;
      }
      finalizePendingHandsFree(source);
    }, debounceMs);
    return true;
  }, [clearHandsFreeDebounce, clearSuppressedHandsFreeTranscript, finalizePendingHandsFree, handsFreeDebounceMs, isHandsFreeFinalizationEligible, isHandsFreeTranscriptSuppressed, log]);

  const startWebRecognizer = useCallback((reason: string) => {
    if (Platform.OS !== 'web' || !webRecognitionRef.current) {
      return false;
    }

    if (!enabledRef.current) {
      log?.('recognizer-start', 'Web speech recognizer start skipped while inactive.', {
        source: 'web',
        reason,
      });
      return false;
    }

    if (webRecognizerActiveRef.current || webRecognizerStartPendingRef.current) {
      setListeningValue(true);
      log?.('recognizer-start', 'Web speech recognizer start skipped; already active.', {
        source: 'web',
        reason,
        active: webRecognizerActiveRef.current,
        startPending: webRecognizerStartPendingRef.current,
      });
      return true;
    }

    try {
      webRecognizerStartPendingRef.current = true;
      webRecognitionRef.current.start();
      return true;
    } catch (error) {
      webRecognizerStartPendingRef.current = false;
      if (isWebRecognitionAlreadyStartedError(error)) {
        webRecognizerActiveRef.current = true;
        setListeningValue(true);
        log?.('recognizer-start', 'Web speech recognizer was already active.', {
          source: 'web',
          reason,
          error: (error as any)?.message || String(error),
        });
        return true;
      }
      throw error;
    }
  }, [log, setListeningValue]);

  const restartWebHandsFreeRecognition = useCallback(() => {
    try {
      const restarted = startWebRecognizer('handsfree-restart');
      if (restarted) {
        log?.('recognizer-restart', 'Web speech recognizer restarted for hands-free mode.', {
          source: 'web',
        });
      }
      return restarted;
    } catch (error) {
      log?.('recognizer-restart', 'Web speech recognizer restart failed.', {
        source: 'web',
        error: (error as any)?.message || String(error),
      });
      return false;
    }
  }, [log, startWebRecognizer]);

  const restartNativeHandsFreeRecognition = useCallback(async () => {
    if (Platform.OS === 'web') {
      return false;
    }

    if (!enabledRef.current) {
      log?.('recognizer-restart', 'Native speech recognizer restart skipped while inactive.', {
        source: 'native',
      });
      return false;
    }

    try {
      const SR: any = await import('expo-speech-recognition');
      if (!SR?.ExpoSpeechRecognitionModule?.start) {
        return false;
      }

      SR.ExpoSpeechRecognitionModule.start(createNativeSpeechStartOptions(SR, {
        continuous: true,
        volumeChangeEvents: true,
      }));
      log?.('recognizer-restart', 'Native speech recognizer restarted for hands-free mode.', {
        source: 'native',
      });
      return true;
    } catch (error) {
      log?.('recognizer-restart', 'Native speech recognizer restart failed.', {
        source: 'native',
        error: (error as any)?.message || String(error),
      });
      return false;
    }
  }, [log]);

  const clearWebRecognizerWatchdog = useCallback(() => {
    if (webRecognizerWatchdogRef.current) {
      clearTimeout(webRecognizerWatchdogRef.current);
      webRecognizerWatchdogRef.current = null;
    }
  }, []);

  const armWebRecognizerWatchdog = useCallback((rec: any) => {
    clearWebRecognizerWatchdog();
    if (!handsFree || !enabledRef.current) return;

    webRecognizerWatchdogRef.current = setTimeout(() => {
      webRecognizerWatchdogRef.current = null;
      if (
        !handsFree
        || !enabledRef.current
        || webRecognitionRef.current !== rec
        || !webRecognizerActiveRef.current
      ) {
        return;
      }

      console.info(
        `[DotAgentsSpeech] web watchdog=restart inactiveMs=${WEB_HANDS_FREE_RECOGNIZER_WATCHDOG_MS}`,
      );
      log?.('recognizer-restart', 'Web speech recognizer watchdog restarting an unresponsive instance.', {
        source: 'web',
        inactiveMs: WEB_HANDS_FREE_RECOGNIZER_WATCHDOG_MS,
      });
      webRecognizerActiveRef.current = false;
      webRecognizerStartPendingRef.current = false;
      setListeningValue(false);

      try { rec.abort?.(); } catch {}

      // `abort()` normally emits `end`, whose handler restarts recognition. A
      // wedged Chrome instance may emit nothing, so keep a guarded fallback.
      webRecognizerWatchdogRef.current = setTimeout(() => {
        webRecognizerWatchdogRef.current = null;
        if (
          !handsFree
          || !enabledRef.current
          || webRecognitionRef.current !== rec
          || webRecognizerActiveRef.current
          || webRecognizerStartPendingRef.current
        ) {
          return;
        }
        try {
          webRecognizerStartPendingRef.current = true;
          rec.start();
          log?.('recognizer-restart', 'Web speech recognizer watchdog fallback started recognition.', {
            source: 'web',
          });
        } catch (error) {
          webRecognizerStartPendingRef.current = false;
          log?.('recognizer-restart', 'Web speech recognizer watchdog fallback failed.', {
            source: 'web',
            error: (error as any)?.message || String(error),
          });
        }
      }, 250);
    }, WEB_HANDS_FREE_RECOGNIZER_WATCHDOG_MS);
  }, [clearWebRecognizerWatchdog, handsFree, log, setListeningValue]);

  const bindWebRecognizerHandlers = useCallback((rec: any) => {
    rec.onstart = () => {
      webRecognizerActiveRef.current = true;
      webRecognizerStartPendingRef.current = false;
      resetWebHandsFreeTranscript(true);
      setListeningValue(true);
      armWebRecognizerWatchdog(rec);
      log?.('recognizer-start', 'Speech recognizer started.', { source: 'web' });
    };
    rec.onerror = (event: any) => {
      clearWebRecognizerWatchdog();
      const message = event?.error || 'Unknown web speech error';
      console.info(
        `[DotAgentsSpeech] web error=${String(message)} message=${String(event?.message || '')} active=${String(webRecognizerActiveRef.current)} pending=${String(webRecognizerStartPendingRef.current)} enabled=${String(enabledRef.current)} handsFree=${String(handsFree)}`,
      );
      log?.('recognizer-error', 'Web speech recognizer error.', {
        source: 'web',
        message,
      });
      onRecognizerError?.(message);
    };
    rec.onresult = (event: any) => {
      armWebRecognizerWatchdog(rec);
      if (!enabledRef.current) {
        clearHandsFreeDebounce();
        pendingHandsFreeFinalRef.current = '';
        webFinalRef.current = '';
        resetWebHandsFreeTranscript();
        setLiveTranscriptValue('');
        log?.('transcript-ignored', 'Web speech recognizer result ignored while inactive.', {
          source: 'web',
        });
        return;
      }

      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) finalText += text;
        else interim += text;
      }

      const webSessionText = handsFree
        ? applyWebSpeechTranscriptEvent(webHandsFreeTranscriptStateRef.current, event)
        : '';
      const assembledHandsFreeText = handsFree ? getWebHandsFreeCaptureText() : '';
      const rawResultText = handsFree
        ? webSessionText
        : normalizeVoiceText(mergeVoiceText(finalText, interim));
      const transcriptSuppressed = handsFree && rawResultText
        ? isHandsFreeTranscriptSuppressed()
        : false;

      console.info(
        `[DotAgentsSpeech] web result final=${JSON.stringify(truncateDebugText(finalText))} interim=${JSON.stringify(truncateDebugText(interim))} session=${JSON.stringify(truncateDebugText(webSessionText))} assembled=${JSON.stringify(truncateDebugText(assembledHandsFreeText))} suppressed=${String(transcriptSuppressed)} resultIndex=${String(event.resultIndex)} resultCount=${String(event.results?.length ?? 0)}`,
      );

      log?.('recognizer-result', 'Web speech recognizer produced a result.', {
        source: 'web',
        handsFree,
        resultIndex: event.resultIndex,
        resultCount: event.results?.length,
        finalText: truncateDebugText(finalText),
        interimText: truncateDebugText(interim),
        sessionText: truncateDebugText(webSessionText),
        assembledText: truncateDebugText(assembledHandsFreeText),
        pendingText: truncateDebugText(pendingHandsFreeFinalRef.current || webFinalRef.current),
      });

      if (handsFree && rawResultText && transcriptSuppressed) {
        clearSuppressedHandsFreeTranscript('web', rawResultText, !!finalText);
        return;
      }
      if (
        handsFree
        && rawResultText
        && maybeFinalizeHandsFreeImmediately(
          'web',
          assembledHandsFreeText,
          !!finalText,
        )
      ) {
        return;
      }

      if (finalText) {
        if (handsFree) {
          const captureText = assembledHandsFreeText;
          if (captureText) scheduleHandsFreeFinalization('web', captureText);
        } else {
          webFinalRef.current = mergeVoiceText(webFinalRef.current, finalText);
        }
      }

      const previewText = handsFree
        ? assembledHandsFreeText
        : mergeVoiceText(webFinalRef.current, interim);
      if (previewText) {
        setLiveTranscriptValue(previewText);
        setSttPreviewWithExpiry(previewText);
        if (handsFree && rawResultText) {
          scheduleHandsFreeFinalization('web', previewText);
        }
      }
    };
    rec.onend = () => {
      clearWebRecognizerWatchdog();
      webRecognizerActiveRef.current = false;
      webRecognizerStartPendingRef.current = false;
      log?.('recognizer-end', 'Web speech recognizer ended.', {
        source: 'web',
        handsFree,
        suppressFinalize: suppressFinalizeRef.current,
        pendingText: truncateDebugText(pendingHandsFreeFinalRef.current || webFinalRef.current),
        liveText: truncateDebugText(liveTranscriptRef.current),
        debouncePending: !!handsFreeDebounceRef.current,
      });

      if (suppressFinalizeRef.current) {
        suppressFinalizeRef.current = false;
        resetWebHandsFreeTranscript();
        setListeningValue(false);
        setLiveTranscriptValue('');
        log?.('recognizer-end', 'Web recognizer end suppressed finalization.', { source: 'web' });
        return;
      }

      if (!enabledRef.current) {
        clearHandsFreeDebounce();
        pendingHandsFreeFinalRef.current = '';
        pendingPushToTalkFinalRef.current = null;
        webFinalRef.current = '';
        resetWebHandsFreeTranscript();
        setListeningValue(false);
        setLiveTranscriptValue('');
        log?.('recognizer-end', 'Web recognizer end ignored while inactive.', { source: 'web' });
        return;
      }

      if (handsFree) {
        if (isHandsFreeTranscriptSuppressed()) {
          clearSuppressedHandsFreeTranscript('web', pendingHandsFreeFinalRef.current || webFinalRef.current || liveTranscriptRef.current);
          if (!restartWebHandsFreeRecognition()) {
            setListeningValue(false);
          }
          return;
        }
        pendingPushToTalkFinalRef.current = null;
        const finalText = commitWebHandsFreeSession();

        if (finalText) {
          pendingHandsFreeFinalRef.current = finalText;
          webFinalRef.current = '';
          if (!handsFreeDebounceRef.current) {
            scheduleHandsFreeFinalization('web', finalText);
          }
          if (!restartWebHandsFreeRecognition()) {
            setListeningValue(false);
          }
          return;
        }

        clearHandsFreeDebounce();
        pendingHandsFreeFinalRef.current = '';
        webFinalRef.current = '';
        resetWebHandsFreeTranscript();
        setListeningValue(false);
        setLiveTranscriptValue('');
        log?.('transcript-ignored', 'Web recognizer ended without hands-free transcript.', { source: 'web' });
        return;
      }

      clearHandsFreeDebounce();

      if (!handsFree && !userReleasedButtonRef.current && webRecognitionRef.current) {
        try {
          if (startWebRecognizer('push-to-talk-continuation')) {
            return;
          }
          return;
        } catch {
          const accumulatedText = mergeVoiceText(webFinalRef.current, liveTranscriptRef.current);
          setListeningValue(false);
          setLiveTranscriptValue('');
          deferPushToTalkFinalization(accumulatedText, 'web');
          webFinalRef.current = '';
          pendingHandsFreeFinalRef.current = '';
          log?.('recognizer-restart', 'Web push-to-talk restart failed; deferring finalization.', {
            source: 'web',
            text: truncateDebugText(accumulatedText),
          });
          return;
        }
      }

      const gestureId = voiceGestureIdRef.current;
      const alreadyFinalizedPushToTalk = !handsFree && voiceGestureFinalizedIdRef.current === gestureId;
      const finalText = mergeVoiceText(
        pendingHandsFreeFinalRef.current || webFinalRef.current,
        liveTranscriptRef.current,
      );

      pendingHandsFreeFinalRef.current = '';
      pendingPushToTalkFinalRef.current = null;
      setListeningValue(false);
      setLiveTranscriptValue('');
      if (finalText && !alreadyFinalizedPushToTalk) {
        if (!handsFree) {
          voiceGestureFinalizedIdRef.current = gestureId;
        }
        emitFinalized(finalText, 'web');
      } else if (!finalText) {
        log?.('transcript-ignored', 'Web recognizer ended without transcript.', { source: 'web' });
      }
      webFinalRef.current = '';
    };
  }, [
    applyWebSpeechTranscriptEvent,
    armWebRecognizerWatchdog,
    clearHandsFreeDebounce,
    clearSuppressedHandsFreeTranscript,
    clearWebRecognizerWatchdog,
    deferPushToTalkFinalization,
    emitFinalized,
    commitWebHandsFreeSession,
    getWebHandsFreeCaptureText,
    handsFree,
    isHandsFreeTranscriptSuppressed,
    log,
    maybeFinalizeHandsFreeImmediately,
    onRecognizerError,
    restartWebHandsFreeRecognition,
    resetWebHandsFreeTranscript,
    scheduleHandsFreeFinalization,
    setListeningValue,
    setLiveTranscriptValue,
    setSttPreviewWithExpiry,
    startWebRecognizer,
  ]);

  const ensureWebRecognizer = useCallback(() => {
    if (Platform.OS !== 'web') return false;
    const SRClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRClass) {
      log?.('recognizer-unavailable', 'Web Speech API is not available in this browser.', {
        source: 'web',
      });
      return false;
    }

    if (!webRecognitionRef.current) {
      const rec = new SRClass();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.continuous = true;
      webRecognitionRef.current = rec;
      log?.('runtime-state', 'Web speech recognizer instance created.', {
        source: 'web',
        lang: rec.lang,
        continuous: rec.continuous,
        interimResults: rec.interimResults,
      });
    }

    bindWebRecognizerHandlers(webRecognitionRef.current);

    return true;
  }, [bindWebRecognizerHandlers, log]);

  const startRecording = useCallback(async (event?: GestureResponderEvent) => {
    if (!enabledRef.current) {
      log?.('recognizer-start', 'Speech recognizer start skipped while inactive.', {
        source: getRecognitionSource(),
        handsFree,
      });
      return;
    }

    if (startingRef.current || listeningRef.current) {
      log?.('recognizer-start', 'Speech recognizer start skipped.', {
        source: getRecognitionSource(),
        starting: startingRef.current,
        listening: listeningRef.current,
        handsFree,
      });
      return;
    }

    startingRef.current = true;
    voiceGestureIdRef.current += 1;
    userReleasedButtonRef.current = false;
    suppressFinalizeRef.current = false;
    setLiveTranscriptValue('');
    setListeningValue(true);
    nativeFinalRef.current = '';
    webFinalRef.current = '';
    resetWebHandsFreeTranscript();
    pendingHandsFreeFinalRef.current = '';
    pendingPushToTalkFinalRef.current = null;
    clearHandsFreeDebounce();
    log?.('recognizer-start', 'Starting speech recognizer.', {
      source: getRecognitionSource(),
      handsFree,
      handsFreeDebounceMs,
      hasGestureEvent: !!event,
      audioInputDeviceId: Platform.OS === 'web' ? audioInputDeviceId : undefined,
    });

    if (event) {
      lastGrantTimeRef.current = Date.now();
    }

    try {
      if (desktopSttEnabled && await startDesktopSttRecording()) {
        startingRef.current = false;
        return;
      }

      if (Platform.OS !== 'web') {
        try {
          const SR: any = await import('expo-speech-recognition');
          if (SR?.ExpoSpeechRecognitionModule?.start) {
            if (!srEmitterRef.current) {
              srEmitterRef.current = new EventEmitter(SR.ExpoSpeechRecognitionModule);
            }
            cleanupNativeSubs();

            const subResult = srEmitterRef.current.addListener('result', (nativeEvent: any) => {
              if (!enabledRef.current) {
                clearHandsFreeDebounce();
                pendingHandsFreeFinalRef.current = '';
                nativeFinalRef.current = '';
                setLiveTranscriptValue('');
                log?.('transcript-ignored', 'Native speech recognizer result ignored while inactive.', {
                  source: 'native',
                });
                return;
              }

              const text = nativeEvent?.results?.[0]?.transcript ?? nativeEvent?.text ?? nativeEvent?.transcript ?? '';
              log?.('recognizer-result', 'Native speech recognizer produced a result.', {
                source: 'native',
                handsFree,
                isFinal: !!nativeEvent?.isFinal,
                text: truncateDebugText(text),
                pendingText: truncateDebugText(pendingHandsFreeFinalRef.current || nativeFinalRef.current),
              });
              if (handsFree && text && isHandsFreeTranscriptSuppressed()) {
                clearSuppressedHandsFreeTranscript('native', text, !!nativeEvent?.isFinal);
                return;
              }
              if (
                handsFree
                && text
                && maybeFinalizeHandsFreeImmediately(
                  'native',
                  mergeVoiceText(pendingHandsFreeFinalRef.current, text),
                  !!nativeEvent?.isFinal,
                )
              ) {
                return;
              }
              if (nativeEvent?.isFinal && text) {
                if (handsFree) {
                  const final = text.trim();
                  if (final) {
                    scheduleHandsFreeFinalization('native', mergeVoiceText(pendingHandsFreeFinalRef.current, final));
                  }
                } else {
                  nativeFinalRef.current = mergeVoiceText(nativeFinalRef.current, text);
                }
              }

              if (text) {
                const baseFinal = handsFree ? pendingHandsFreeFinalRef.current : nativeFinalRef.current;
                const livePart = nativeEvent?.isFinal ? '' : text;
                const previewText = mergeVoiceText(baseFinal, livePart);
                if (previewText) {
                  setLiveTranscriptValue(previewText);
                  setSttPreviewWithExpiry(previewText);
                  if (handsFree && !nativeEvent?.isFinal) {
                    scheduleHandsFreeFinalization('native', previewText);
                  }
                }
              }
            });

            const subError = srEmitterRef.current.addListener('error', (nativeEvent: any) => {
              const message = typeof nativeEvent === 'string'
                ? nativeEvent
                : nativeEvent?.message || nativeEvent?.error || 'Unknown native speech error';
              log?.('recognizer-error', 'Native speech recognizer error.', {
                source: 'native',
                message,
              });
              onRecognizerError?.(message);
            });

            const subEnd = srEmitterRef.current.addListener('end', async () => {
              log?.('recognizer-end', 'Native speech recognizer ended.', {
                source: 'native',
                handsFree,
                suppressFinalize: suppressFinalizeRef.current,
                pendingText: truncateDebugText(pendingHandsFreeFinalRef.current || nativeFinalRef.current),
                liveText: truncateDebugText(liveTranscriptRef.current),
                debouncePending: !!handsFreeDebounceRef.current,
              });

              if (suppressFinalizeRef.current) {
                suppressFinalizeRef.current = false;
                setListeningValue(false);
                setLiveTranscriptValue('');
                log?.('recognizer-end', 'Native recognizer end suppressed finalization.', { source: 'native' });
                return;
              }

              if (!enabledRef.current) {
                clearHandsFreeDebounce();
                pendingHandsFreeFinalRef.current = '';
                pendingPushToTalkFinalRef.current = null;
                nativeFinalRef.current = '';
                setListeningValue(false);
                setLiveTranscriptValue('');
                log?.('recognizer-end', 'Native recognizer end ignored while inactive.', { source: 'native' });
                return;
              }

              if (handsFree) {
                if (isHandsFreeTranscriptSuppressed()) {
                  clearSuppressedHandsFreeTranscript('native', pendingHandsFreeFinalRef.current || nativeFinalRef.current || liveTranscriptRef.current);
                  if (!await restartNativeHandsFreeRecognition()) {
                    setListeningValue(false);
                  }
                  return;
                }
                pendingPushToTalkFinalRef.current = null;
                const finalText = normalizeVoiceText(
                  mergeVoiceText(
                    pendingHandsFreeFinalRef.current || nativeFinalRef.current,
                    liveTranscriptRef.current,
                  ),
                );

                if (finalText) {
                  pendingHandsFreeFinalRef.current = finalText;
                  nativeFinalRef.current = '';
                  if (!handsFreeDebounceRef.current) {
                    scheduleHandsFreeFinalization('native', finalText);
                  }
                  if (!await restartNativeHandsFreeRecognition()) {
                    setListeningValue(false);
                  }
                  return;
                }

                clearHandsFreeDebounce();
                pendingHandsFreeFinalRef.current = '';
                nativeFinalRef.current = '';
                setListeningValue(false);
                setLiveTranscriptValue('');
                log?.('transcript-ignored', 'Native recognizer ended without hands-free transcript.', { source: 'native' });
                return;
              }

              clearHandsFreeDebounce();

              if (!handsFree && !userReleasedButtonRef.current) {
                try {
                  const SRRestart: any = await import('expo-speech-recognition');
                  if (SRRestart?.ExpoSpeechRecognitionModule?.start) {
                    SRRestart.ExpoSpeechRecognitionModule.start(createNativeSpeechStartOptions(SRRestart, {
                      continuous: true,
                      volumeChangeEvents: false,
                    }));
                    return;
                  }
                } catch {}

                const accumulatedText = mergeVoiceText(nativeFinalRef.current, liveTranscriptRef.current);
                setListeningValue(false);
                setLiveTranscriptValue('');
                deferPushToTalkFinalization(accumulatedText, 'native');
                pendingHandsFreeFinalRef.current = '';
                nativeFinalRef.current = '';
                log?.('recognizer-restart', 'Native push-to-talk restart unavailable; deferring finalization.', {
                  source: 'native',
                  text: truncateDebugText(accumulatedText),
                });
                return;
              }

              const gestureId = voiceGestureIdRef.current;
              const alreadyFinalizedPushToTalk = !handsFree && voiceGestureFinalizedIdRef.current === gestureId;
              setListeningValue(false);
              const finalText = mergeVoiceText(
                pendingHandsFreeFinalRef.current || nativeFinalRef.current,
                liveTranscriptRef.current,
              );
              pendingHandsFreeFinalRef.current = '';
              pendingPushToTalkFinalRef.current = null;
              setLiveTranscriptValue('');
              if (finalText && !alreadyFinalizedPushToTalk) {
                if (!handsFree) {
                  voiceGestureFinalizedIdRef.current = gestureId;
                }
                emitFinalized(finalText, 'native');
              } else if (!finalText) {
                log?.('transcript-ignored', 'Native recognizer ended without transcript.', { source: 'native' });
              }
              nativeFinalRef.current = '';
            });

            srSubsRef.current.push(subResult, subError, subEnd);

            try {
              const permission = await SR.ExpoSpeechRecognitionModule.getPermissionsAsync();
              if (!permission?.granted) {
                log?.('runtime-state', 'Requesting native speech recognition permission.', { source: 'native' });
                const requested = await SR.ExpoSpeechRecognitionModule.requestPermissionsAsync();
                if (!requested?.granted) {
                  setListeningValue(false);
                  onPermissionDenied?.();
                  log?.('permission-denied', 'Microphone or speech permission was denied.');
                  startingRef.current = false;
                  return;
                }
              }
            } catch {}

            SR.ExpoSpeechRecognitionModule.start(createNativeSpeechStartOptions(SR, {
              continuous: true,
              volumeChangeEvents: handsFree,
            }));
            log?.('recognizer-start', 'Speech recognizer started.', { source: 'native' });
            startingRef.current = false;
            return;
          }
        } catch (error) {
          const message = (error as any)?.message || String(error);
          if (!nativeSRUnavailableShownRef.current && message.includes('ExpoSpeechRecognition')) {
            nativeSRUnavailableShownRef.current = true;
            setListeningValue(false);
            startingRef.current = false;
            log?.('recognizer-unavailable', 'Native speech recognition module is unavailable.', {
              source: 'native',
              error: message,
            });
            Alert.alert(
              'Development Build Required',
              'Speech recognition requires a development build. Expo Go does not support native modules like expo-speech-recognition.\n\nRun "npx expo run:android" or "npx expo run:ios" to build and install the development app.',
              [{ text: 'OK' }],
            );
            return;
          }
        }
      }

      if (ensureWebRecognizer()) {
        try {
          // When a specific microphone is selected, acquire a getUserMedia stream
          // with that deviceId first. This primes the browser's audio subsystem so
          // the Web Speech API recognizer uses the chosen input device.
          if (audioInputDeviceId && navigator.mediaDevices?.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: audioInputDeviceId } },
              });
              // Stop the tracks immediately — we only needed to prime the device.
              stream.getTracks().forEach((t) => t.stop());
              log?.('runtime-state', 'Selected web microphone primed.', {
                source: 'web',
                audioInputDeviceId,
              });
            } catch (deviceErr) {
              // If the selected device is unavailable, fall back to system default.
              log?.('mic-device-fallback', `Selected mic device unavailable, falling back to default.`, {
                deviceId: audioInputDeviceId,
                error: (deviceErr as any)?.message,
              });
            }
          }

          webFinalRef.current = '';
          pendingHandsFreeFinalRef.current = '';
          if (webRecognitionRef.current) {
            try { webRecognitionRef.current.continuous = true; } catch {}
          }
          startWebRecognizer('initial-start');
        } catch (error) {
          setListeningValue(false);
          log?.('recognizer-error', 'Unable to start web speech recognizer.', {
            source: 'web',
            error: (error as any)?.message || String(error),
          });
          onRecognizerError?.((error as any)?.message || 'Unable to start web speech recognizer');
        }
      } else {
        setListeningValue(false);
      }
    } finally {
      startingRef.current = false;
    }
  }, [
    audioInputDeviceId,
    cleanupNativeSubs,
    clearHandsFreeDebounce,
    clearSuppressedHandsFreeTranscript,
    deferPushToTalkFinalization,
    desktopSttEnabled,
    emitFinalized,
    ensureWebRecognizer,
    handsFree,
    handsFreeDebounceMs,
    isHandsFreeTranscriptSuppressed,
    log,
    maybeFinalizeHandsFreeImmediately,
    onPermissionDenied,
    onRecognizerError,
    restartNativeHandsFreeRecognition,
    scheduleHandsFreeFinalization,
    setListeningValue,
    setLiveTranscriptValue,
    setSttPreviewWithExpiry,
    startDesktopSttRecording,
    startWebRecognizer,
    resetWebHandsFreeTranscript,
  ]);

  const stopRecordingAndHandle = useCallback(async () => {
    if (stoppingRef.current) {
      log?.('recognizer-stop', 'Speech recognizer stop skipped; stop already in progress.', {
        source: getRecognitionSource(),
      });
      return;
    }
    stoppingRef.current = true;
    userReleasedButtonRef.current = true;
    log?.('recognizer-stop', 'Stopping speech recognizer and handling pending transcript.', {
      source: getRecognitionSource(),
      handsFree,
      listening: listeningRef.current,
    });

    try {
      if (!listeningRef.current) {
        flushPendingPushToTalkFinalization();
        return;
      }

      if (desktopSttRecordingRef.current && await stopDesktopSttRecording({ finalize: true })) {
        return;
      }

      if (Platform.OS !== 'web') {
        try {
          const SR: any = await import('expo-speech-recognition');
          SR?.ExpoSpeechRecognitionModule?.stop?.();
        } catch {}
      }

      if (Platform.OS === 'web' && webRecognitionRef.current) {
        try {
          webRecognitionRef.current.stop();
        } catch {
          setListeningValue(false);
        }
      }
    } finally {
      webPressInSeenRef.current = false;
      stoppingRef.current = false;
      log?.('recognizer-stop', 'Speech recognizer stopped.');
    }
  }, [flushPendingPushToTalkFinalization, handsFree, log, setListeningValue, stopDesktopSttRecording]);

  stopRecordingAndHandleRef.current = stopRecordingAndHandle;

  const handlePushToTalkPressIn = useCallback((event: GestureResponderEvent) => {
    lastGrantTimeRef.current = Date.now();
    webPressInSeenRef.current = true;
    if (!listeningRef.current) {
      void startRecording(event);
    }
  }, [startRecording]);

  const stopOrFinalizePushToTalk = useCallback(() => {
    if (listeningRef.current) {
      void stopRecordingAndHandle();
      return;
    }

    flushPendingPushToTalkFinalization();
  }, [flushPendingPushToTalkFinalization, stopRecordingAndHandle]);

  const handlePushToTalkPressOut = useCallback(() => {
    webPressInSeenRef.current = false;
    const delay = Math.max(0, MIN_HOLD_MS - (Date.now() - lastGrantTimeRef.current));
    if (delay > 0) {
      setTimeout(() => {
        stopOrFinalizePushToTalk();
      }, delay);
      return;
    }
    stopOrFinalizePushToTalk();
  }, [stopOrFinalizePushToTalk]);

  useEffect(() => {
    if (Platform.OS === 'web' && webRecognitionRef.current) {
      bindWebRecognizerHandlers(webRecognitionRef.current);
    }
  }, [bindWebRecognizerHandlers]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !micButtonRef.current) return;

    // @ts-ignore React Native Web ref resolves to a DOM node at runtime.
    const domNode = micButtonRef.current as any;
    if (!domNode || typeof domNode.addEventListener !== 'function') return;

    const stopFromDomFallback = () => {
      if (handsFree || !webPressInSeenRef.current || !listeningRef.current || userReleasedButtonRef.current) {
        return;
      }
      const delay = Math.max(0, MIN_HOLD_MS - (Date.now() - lastGrantTimeRef.current));
      const maybeStop = () => {
        if (!listeningRef.current || userReleasedButtonRef.current) return;
        webPressInSeenRef.current = false;
        void stopRecordingAndHandleRef.current?.();
      };
      if (delay > 0) setTimeout(maybeStop, delay);
      else maybeStop();
    };

    const handleTouchStart = (event: any) => {
      if (event.cancelable) event.preventDefault();
    };

    const handleTouchEnd = () => stopFromDomFallback();
    const handleTouchCancel = () => stopFromDomFallback();
    const handlePointerUp = () => stopFromDomFallback();
    const handlePointerCancel = () => stopFromDomFallback();
    const handleContextMenu = (event: any) => event.preventDefault();

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
  }, [handsFree]);

  useEffect(() => () => {
    enabledRef.current = false;
    void stopDesktopSttRecordingRef.current?.({ finalize: false });
    cleanupNativeSubsRef.current?.();
    clearHandsFreeDebounceRef.current?.();
    if (webRecognizerWatchdogRef.current) {
      clearTimeout(webRecognizerWatchdogRef.current);
    }
    const webRecognizer = webRecognitionRef.current;
    if (webRecognizer) {
      webRecognizer.onstart = null;
      webRecognizer.onerror = null;
      webRecognizer.onresult = null;
      webRecognizer.onend = null;
      try { webRecognizer.abort?.(); } catch {}
      webRecognitionRef.current = null;
      webRecognizerActiveRef.current = false;
      webRecognizerStartPendingRef.current = false;
    }
    if (sttPreviewTimeoutRef.current) {
      clearTimeout(sttPreviewTimeoutRef.current);
    }
  }, []);

  return {
    listening,
    liveTranscript,
    sttPreview,
    handsFreeDebounceEndsAt,
    micButtonRef,
    startRecording,
    stopRecordingAndHandle,
    stopRecognitionOnly,
    handlePushToTalkPressIn,
    handlePushToTalkPressOut,
    setSttPreviewWithExpiry,
    invalidateHandsFreeCapture,
  } as const;
}
