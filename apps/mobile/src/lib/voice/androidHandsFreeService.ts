import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';

export type AndroidHandsFreeVoiceEvent =
  | { type: 'service-started'; language?: string; listeningEnabled?: boolean }
  | { type: 'service-stopped' }
  | { type: 'capture-state'; listeningEnabled?: boolean }
  | { type: 'recognizer-started'; language?: string }
  | { type: 'recognizer-stopped' }
  | { type: 'ready-for-speech' }
  | { type: 'speech-started' }
  | { type: 'speech-ended' }
  | { type: 'partial-result'; text?: string; isFinal?: false }
  | { type: 'result'; text?: string; isFinal?: true }
  | { type: 'tts-loading'; utteranceId?: string; textLength?: number }
  | { type: 'tts-started'; utteranceId?: string; textLength?: number }
  | { type: 'tts-done'; utteranceId?: string }
  | { type: 'tts-error'; utteranceId?: string; message?: string; errorCode?: number }
  | { type: 'tts-stopped'; utteranceId?: string; message?: string }
  | { type: 'tts-native-fallback'; utteranceId?: string; language?: string; voice?: string }
  | { type: 'cue-played'; cueId?: string }
  | { type: 'cue-error'; cueId?: string; message?: string; errorCode?: number }
  | { type: 'error'; message?: string; errorCode?: number; recoverable?: boolean };

export type AndroidHandsFreeAudioRoute = {
  hasHeadset: boolean;
  route: string;
  inputTypes?: string;
  outputTypes?: string;
  communicationDevice?: string;
  routingActive?: boolean;
  routingRequested?: boolean;
  routeApplied?: boolean;
  requesters?: string;
  mode?: string;
};

type AndroidHandsFreeVoiceModule = {
  start(options?: { language?: string; listeningEnabled?: boolean }): Promise<void>;
  stop(): Promise<void>;
  setListeningEnabled(enabled: boolean): Promise<boolean>;
  isRunning(): Promise<boolean>;
  speak(options: {
    utteranceId?: string;
    text: string;
    language?: string;
    rate?: number;
    pitch?: number;
    voice?: string;
    restoreListeningAfterDone?: boolean;
    allowBargeIn?: boolean;
  }): Promise<string | null>;
  stopSpeaking(): Promise<boolean>;
  isSpeaking(): Promise<boolean>;
  playCue(options: { cueId: string; filePath: string }): Promise<boolean>;
  getAudioRoute(): Promise<AndroidHandsFreeAudioRoute>;
  setAudioRoutingEnabled(enabled: boolean, reason?: string): Promise<AndroidHandsFreeAudioRoute>;
};

const EVENT_NAME = 'DotAgentsHandsFreeVoiceEvent';

const nativeModule = Platform.OS === 'android'
  ? (NativeModules.DotAgentsHandsFreeVoice as AndroidHandsFreeVoiceModule | undefined)
  : undefined;

const eventEmitter = nativeModule ? new NativeEventEmitter(nativeModule as any) : null;

export function isAndroidHandsFreeServiceAvailable(): boolean {
  return Platform.OS === 'android' && !!nativeModule;
}

export async function startAndroidHandsFreeService(options?: {
  language?: string;
  listeningEnabled?: boolean;
}): Promise<void> {
  if (!nativeModule) return;
  await ensureAndroidHandsFreePermissions();
  await nativeModule.start(options);
}

export async function stopAndroidHandsFreeService(): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.stop();
}

export async function setAndroidHandsFreeListeningEnabled(enabled: boolean): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.setListeningEnabled(enabled);
}

export async function isAndroidHandsFreeServiceRunning(): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.isRunning();
}

export async function speakAndroidHandsFreeTts(options: {
  utteranceId?: string;
  text: string;
  language?: string;
  rate?: number;
  pitch?: number;
  voice?: string;
  restoreListeningAfterDone?: boolean;
  allowBargeIn?: boolean;
}): Promise<string | null> {
  if (!nativeModule) return null;
  return nativeModule.speak(options);
}

export async function stopAndroidHandsFreeTts(): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.stopSpeaking();
}

export async function isAndroidHandsFreeTtsSpeaking(): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.isSpeaking();
}

export async function playAndroidHandsFreeCue(options: {
  cueId: string;
  filePath: string;
}): Promise<boolean> {
  if (!nativeModule || typeof nativeModule.playCue !== 'function') return false;
  return nativeModule.playCue(options);
}

export async function getAndroidHandsFreeAudioRoute(): Promise<AndroidHandsFreeAudioRoute | null> {
  if (!nativeModule) return null;
  return nativeModule.getAudioRoute();
}

export async function setAndroidHandsFreeAudioRoutingEnabled(
  enabled: boolean,
  reason = 'foreground',
): Promise<AndroidHandsFreeAudioRoute | null> {
  if (!nativeModule) return null;
  return nativeModule.setAudioRoutingEnabled(enabled, reason);
}

export function subscribeAndroidHandsFreeVoiceEvents(
  listener: (event: AndroidHandsFreeVoiceEvent) => void,
): { remove: () => void } {
  if (!eventEmitter) {
    return { remove: () => undefined };
  }

  return eventEmitter.addListener(EVENT_NAME, listener);
}

async function ensureAndroidHandsFreePermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const recordAudio = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  if (!recordAudio) {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Microphone permission is required for locked-screen hands-free mode.');
    }
  }

  if (Platform.Version >= 33) {
    const notificationPermission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    const notifications = await PermissionsAndroid.check(notificationPermission);
    if (!notifications) {
      await PermissionsAndroid.request(notificationPermission);
    }
  }
}
