import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  GestureResponderEvent,
  Platform,
  View,
} from 'react-native';
import { EventEmitter } from 'expo-modules-core';
import type { VoiceDebugLog } from './voiceDebug';
import { mergeVoiceText } from './mergeVoiceText';

export type VoiceFinalizationMode = 'edit' | 'send' | 'handsfree';

type VoiceFinalizedPayload = {
  text: string;
  mode: VoiceFinalizationMode;
  source: 'native' | 'web';
};

type UseSpeechRecognizerOptions = {
  handsFree: boolean;
  willCancel: boolean;
  onVoiceFinalized: (payload: VoiceFinalizedPayload) => void;
  onRecognizerError?: (message: string) => void;
  onPermissionDenied?: () => void;
  log?: VoiceDebugLog;
};

const HANDS_FREE_DEBOUNCE_MS = 1500;
const MIN_HOLD_MS = 200;

const normalizeVoiceText = (text?: string) => (text || '').replace(/\s+/g, ' ').trim();

export function useSpeechRecognizer(options: UseSpeechRecognizerOptions) {
  const { handsFree, willCancel, onVoiceFinalized, onRecognizerError, onPermissionDenied, log } = options;
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [sttPreview, setSttPreview] = useState('');

  const listeningRef = useRef(false);
  const webRecognitionRef = useRef<any>(null);
  const webFinalRef = useRef('');
  const liveTranscriptRef = useRef('');
  const nativeFinalRef = useRef('');
  const pendingHandsFreeFinalRef = useRef('');
  const handsFreeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sttPreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startingRef = useRef(false);
  const stoppingRef = useRef(false);
  const userReleasedButtonRef = useRef(false);
  const webPressInSeenRef = useRef(false);
  const lastGrantTimeRef = useRef(0);
  const micButtonRef = useRef<View>(null);
  const stopRecordingAndHandleRef = useRef<(() => Promise<void>) | null>(null);
  const nativeSRUnavailableShownRef = useRef(false);
  const srEmitterRef = useRef<any>(null);
  const srSubsRef = useRef<any[]>([]);
  const voiceGestureIdRef = useRef(0);
  const voiceGestureFinalizedIdRef = useRef(0);
  const suppressFinalizeRef = useRef(false);

  const setListeningValue = useCallback((value: boolean) => {
    listeningRef.current = value;
    setListening(value);
  }, []);

  const setLiveTranscriptValue = useCallback((value: string) => {
    liveTranscriptRef.current = value;
    setLiveTranscript(value);
  }, []);

  const setSttPreviewWithExpiry = useCallback((value: string) => {
    setSttPreview(value);
    if (sttPreviewTimeoutRef.current) {
      clearTimeout(sttPreviewTimeoutRef.current);
    }
    sttPreviewTimeoutRef.current = setTimeout(() => {
      setSttPreview('');
    }, 5000);
  }, []);

  const cleanupNativeSubs = useCallback(() => {
    srSubsRef.current.forEach((sub) => sub?.remove?.());
    srSubsRef.current = [];
  }, []);

  const clearHandsFreeDebounce = useCallback(() => {
    if (handsFreeDebounceRef.current) {
      clearTimeout(handsFreeDebounceRef.current);
      handsFreeDebounceRef.current = null;
    }
  }, []);

  const emitFinalized = useCallback((text: string, source: 'native' | 'web') => {
    const finalText = normalizeVoiceText(text);
    if (!finalText) {
      return;
    }
    setSttPreviewWithExpiry(finalText);
    onVoiceFinalized({
      text: finalText,
      mode: handsFree ? 'handsfree' : (willCancel ? 'edit' : 'send'),
      source,
    });
  }, [handsFree, onVoiceFinalized, setSttPreviewWithExpiry, willCancel]);

  const stopRecognitionOnly = useCallback(async () => {
    suppressFinalizeRef.current = true;
    userReleasedButtonRef.current = true;
    clearHandsFreeDebounce();

    try {
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
      setListeningValue(false);
      setLiveTranscriptValue('');
      pendingHandsFreeFinalRef.current = '';
      nativeFinalRef.current = '';
      webFinalRef.current = '';
      webPressInSeenRef.current = false;
      log?.('recognizer-stop', 'Speech recognizer stopped.');
    }
  }, [clearHandsFreeDebounce, log, setListeningValue, setLiveTranscriptValue]);

  const ensureWebRecognizer = useCallback(() => {
    if (Platform.OS !== 'web') return false;
    const SRClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRClass) {
      return false;
    }

    if (!webRecognitionRef.current) {
      const rec = new SRClass();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.continuous = true;
      rec.onstart = () => {
        log?.('recognizer-start', 'Speech recognizer started.', { source: 'web' });
      };
      rec.onerror = (event: any) => {
        const message = event?.error || 'Unknown web speech error';
        onRecognizerError?.(message);
      };
      rec.onresult = (event: any) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) finalText += text;
          else interim += text;
        }

        if (finalText) {
          if (handsFree) {
            clearHandsFreeDebounce();
            const final = finalText.trim();
            if (final) {
              pendingHandsFreeFinalRef.current = mergeVoiceText(pendingHandsFreeFinalRef.current, final);
              handsFreeDebounceRef.current = setTimeout(() => {
                const textToSend = pendingHandsFreeFinalRef.current.trim();
                pendingHandsFreeFinalRef.current = '';
                webFinalRef.current = '';
                setLiveTranscriptValue('');
                if (textToSend) {
                  void stopRecognitionOnly();
                  emitFinalized(textToSend, 'web');
                }
              }, HANDS_FREE_DEBOUNCE_MS);
            }
          } else {
            webFinalRef.current = mergeVoiceText(webFinalRef.current, finalText);
          }
        }

        const baseFinal = handsFree ? pendingHandsFreeFinalRef.current : webFinalRef.current;
        const previewText = mergeVoiceText(baseFinal, interim);
        if (previewText) {
          setLiveTranscriptValue(previewText);
          setSttPreviewWithExpiry(previewText);
        }
      };
      rec.onend = () => {
        clearHandsFreeDebounce();

        if (suppressFinalizeRef.current) {
          suppressFinalizeRef.current = false;
          setListeningValue(false);
          setLiveTranscriptValue('');
          return;
        }

        if (!handsFree && !userReleasedButtonRef.current && webRecognitionRef.current) {
          try {
            webRecognitionRef.current.start();
            return;
          } catch {
            const accumulatedText = mergeVoiceText(webFinalRef.current, liveTranscriptRef.current);
            setListeningValue(false);
            setLiveTranscriptValue('');
            if (accumulatedText) {
              setSttPreviewWithExpiry(accumulatedText);
              voiceGestureFinalizedIdRef.current = voiceGestureIdRef.current;
            }
            webFinalRef.current = '';
            pendingHandsFreeFinalRef.current = '';
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
        setListeningValue(false);
        setLiveTranscriptValue('');
        if (finalText && !alreadyFinalizedPushToTalk) {
          if (!handsFree) {
            voiceGestureFinalizedIdRef.current = gestureId;
          }
          emitFinalized(finalText, 'web');
        }
        webFinalRef.current = '';
      };
      webRecognitionRef.current = rec;
    }

    return true;
  }, [
    clearHandsFreeDebounce,
    emitFinalized,
    handsFree,
    log,
    onRecognizerError,
    setListeningValue,
    setLiveTranscriptValue,
    setSttPreviewWithExpiry,
    stopRecognitionOnly,
  ]);

  const startRecording = useCallback(async (event?: GestureResponderEvent) => {
    if (startingRef.current || listeningRef.current) {
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
    pendingHandsFreeFinalRef.current = '';
    clearHandsFreeDebounce();

    if (event) {
      lastGrantTimeRef.current = Date.now();
    }

    try {
      if (Platform.OS !== 'web') {
        try {
          const SR: any = await import('expo-speech-recognition');
          if (SR?.ExpoSpeechRecognitionModule?.start) {
            if (!srEmitterRef.current) {
              srEmitterRef.current = new EventEmitter(SR.ExpoSpeechRecognitionModule);
            }
            cleanupNativeSubs();

            const subResult = srEmitterRef.current.addListener('result', (nativeEvent: any) => {
              const text = nativeEvent?.results?.[0]?.transcript ?? nativeEvent?.text ?? nativeEvent?.transcript ?? '';
              if (nativeEvent?.isFinal && text) {
                if (handsFree) {
                  clearHandsFreeDebounce();
                  const final = text.trim();
                  if (final) {
                    pendingHandsFreeFinalRef.current = mergeVoiceText(pendingHandsFreeFinalRef.current, final);
                    handsFreeDebounceRef.current = setTimeout(() => {
                      const textToSend = pendingHandsFreeFinalRef.current.trim();
                      pendingHandsFreeFinalRef.current = '';
                      nativeFinalRef.current = '';
                      setLiveTranscriptValue('');
                      if (textToSend) {
                        void stopRecognitionOnly();
                        emitFinalized(textToSend, 'native');
                      }
                    }, HANDS_FREE_DEBOUNCE_MS);
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
                }
              }
            });

            const subError = srEmitterRef.current.addListener('error', (nativeEvent: any) => {
              const message = typeof nativeEvent === 'string'
                ? nativeEvent
                : nativeEvent?.message || nativeEvent?.error || 'Unknown native speech error';
              onRecognizerError?.(message);
            });

            const subEnd = srEmitterRef.current.addListener('end', async () => {
              clearHandsFreeDebounce();

              if (suppressFinalizeRef.current) {
                suppressFinalizeRef.current = false;
                setListeningValue(false);
                setLiveTranscriptValue('');
                return;
              }

              if (!handsFree && !userReleasedButtonRef.current) {
                try {
                  const SRRestart: any = await import('expo-speech-recognition');
                  if (SRRestart?.ExpoSpeechRecognitionModule?.start) {
                    SRRestart.ExpoSpeechRecognitionModule.start({
                      lang: 'en-US',
                      interimResults: true,
                      continuous: true,
                      volumeChangeEventOptions: { enabled: false, intervalMillis: 250 },
                    });
                    return;
                  }
                } catch {}
              }

              const gestureId = voiceGestureIdRef.current;
              const alreadyFinalizedPushToTalk = !handsFree && voiceGestureFinalizedIdRef.current === gestureId;
              setListeningValue(false);
              const finalText = mergeVoiceText(
                pendingHandsFreeFinalRef.current || nativeFinalRef.current,
                liveTranscriptRef.current,
              );
              pendingHandsFreeFinalRef.current = '';
              setLiveTranscriptValue('');
              if (finalText && !alreadyFinalizedPushToTalk) {
                if (!handsFree) {
                  voiceGestureFinalizedIdRef.current = gestureId;
                }
                emitFinalized(finalText, 'native');
              }
              nativeFinalRef.current = '';
            });

            srSubsRef.current.push(subResult, subError, subEnd);

            try {
              const permission = await SR.ExpoSpeechRecognitionModule.getPermissionsAsync();
              if (!permission?.granted) {
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

            SR.ExpoSpeechRecognitionModule.start({
              lang: 'en-US',
              interimResults: true,
              continuous: true,
              volumeChangeEventOptions: { enabled: handsFree, intervalMillis: 250 },
            });
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
          webFinalRef.current = '';
          pendingHandsFreeFinalRef.current = '';
          if (webRecognitionRef.current) {
            try { webRecognitionRef.current.continuous = true; } catch {}
          }
          webRecognitionRef.current?.start();
        } catch (error) {
          setListeningValue(false);
          onRecognizerError?.((error as any)?.message || 'Unable to start web speech recognizer');
        }
      } else {
        setListeningValue(false);
      }
    } finally {
      startingRef.current = false;
    }
  }, [
    cleanupNativeSubs,
    clearHandsFreeDebounce,
    emitFinalized,
    ensureWebRecognizer,
    handsFree,
    log,
    onPermissionDenied,
    onRecognizerError,
    setListeningValue,
    setLiveTranscriptValue,
    setSttPreviewWithExpiry,
    stopRecognitionOnly,
  ]);

  const stopRecordingAndHandle = useCallback(async () => {
    if (stoppingRef.current) {
      return;
    }
    stoppingRef.current = true;
    userReleasedButtonRef.current = true;

    try {
      const hasWebRecognizer = Platform.OS === 'web' && webRecognitionRef.current;
      if (!listeningRef.current && !hasWebRecognizer) {
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
  }, [log, setListeningValue]);

  stopRecordingAndHandleRef.current = stopRecordingAndHandle;

  const handlePushToTalkPressIn = useCallback((event: GestureResponderEvent) => {
    lastGrantTimeRef.current = Date.now();
    webPressInSeenRef.current = true;
    if (!listeningRef.current) {
      void startRecording(event);
    }
  }, [startRecording]);

  const handlePushToTalkPressOut = useCallback(() => {
    webPressInSeenRef.current = false;
    const delay = Math.max(0, MIN_HOLD_MS - (Date.now() - lastGrantTimeRef.current));
    if (delay > 0) {
      setTimeout(() => {
        if (listeningRef.current) {
          void stopRecordingAndHandle();
        }
      }, delay);
      return;
    }
    if (listeningRef.current) {
      void stopRecordingAndHandle();
    }
  }, [stopRecordingAndHandle]);

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
    cleanupNativeSubs();
    clearHandsFreeDebounce();
    if (sttPreviewTimeoutRef.current) {
      clearTimeout(sttPreviewTimeoutRef.current);
    }
  }, [cleanupNativeSubs, clearHandsFreeDebounce]);

  return {
    listening,
    liveTranscript,
    sttPreview,
    micButtonRef,
    startRecording,
    stopRecordingAndHandle,
    stopRecognitionOnly,
    handlePushToTalkPressIn,
    handlePushToTalkPressOut,
    setSttPreviewWithExpiry,
  } as const;
}