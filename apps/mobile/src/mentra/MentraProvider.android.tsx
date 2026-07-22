import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import BluetoothSdk, { type Device, type MicPcmEvent } from '@mentra/bluetooth-sdk';
import { useBluetoothEvent, useMentraBluetooth } from '@mentra/bluetooth-sdk/react';
import { useConfigContext } from '../store/config';
import { MentraContext } from './MentraContext';
import { arrayBufferToBase64, getMentraPhotoCallbackUrl } from './mentraNetworking';
import type {
  MentraConnectionState,
  MentraContextValue,
  MentraDevice,
  FinishMentraCaptureOptions,
  PendingMentraPhoto,
} from './types';

const DEFAULT_DEVICE_STORAGE_KEY = 'mentra_default_device_v1';
const PHOTO_TTL_MS = 15 * 60 * 1000;
const MAX_CAPTURE_MS = 120_000;
const MAX_CAPTURE_BYTES = 16_000 * 2 * (MAX_CAPTURE_MS / 1_000);

const defaultDeviceStorage = {
  async load(): Promise<Device | null> {
    const raw = await AsyncStorage.getItem(DEFAULT_DEVICE_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Device;
      return parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string' ? parsed : null;
    } catch {
      return null;
    }
  },
  async save(device: Device | null): Promise<void> {
    if (device) await AsyncStorage.setItem(DEFAULT_DEVICE_STORAGE_KEY, JSON.stringify(device));
    else await AsyncStorage.removeItem(DEFAULT_DEVICE_STORAGE_KEY);
  },
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function asMentraDevice(device: Device | null): MentraDevice | null {
  return device ? { ...device } : null;
}

async function requestMentraPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // The Mentra SDK notes that some Android 12+ devices still suppress BLE scan
  // callbacks unless Location is granted and enabled, even with BLUETOOTH_SCAN.
  const permissions = [
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ];
  if (Number(Platform.Version) >= 31) {
    permissions.push(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    );
  }
  if (Number(Platform.Version) >= 33) {
    permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  const result = await PermissionsAndroid.requestMultiple(permissions);
  const denied = permissions.filter((permission) => result[permission] !== PermissionsAndroid.RESULTS.GRANTED);
  if (denied.length > 0) {
    throw new Error('Bluetooth, Location, microphone, and notification permissions are required for Mentra Live.');
  }
}

export function MentraProvider({ children }: { children: ReactNode }) {
  const { config } = useConfigContext();
  const enabled = config.mentraEnabled === true;
  const [error, setError] = useState<string | null>(null);
  const [audioConnected, setAudioConnected] = useState(false);
  const [audioPairingDeviceName, setAudioPairingDeviceName] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<PendingMentraPhoto | null>(null);
  const [captureState, setCaptureState] = useState<'idle' | 'capturing' | 'transcribing'>('idle');
  const [lastTouch, setLastTouch] = useState<MentraContextValue['lastTouch']>(null);
  const [lastSpeaking, setLastSpeaking] = useState<MentraContextValue['lastSpeaking']>(null);
  const touchSequenceRef = useRef(0);
  const speakingSequenceRef = useRef(0);
  const captureChunksRef = useRef<Uint8Array[]>([]);
  const captureBytesRef = useRef(0);
  const captureStartedAtRef = useRef(0);
  const captureStateRef = useRef(captureState);
  const lastHardwareEventRef = useRef('');
  captureStateRef.current = captureState;

  const session = useMentraBluetooth({
    autoConnectDefault: enabled,
    defaultDeviceStorage,
    scanTimeoutMs: 15_000,
    onError: (nextError) => setError(errorMessage(nextError)),
  });

  const handleError = useCallback((nextError: unknown) => {
    const message = errorMessage(nextError);
    setError(message);
    console.warn('[Mentra]', message);
  }, []);

  const clearPendingPhoto = useCallback(() => setPendingPhoto(null), []);
  const consumePendingPhoto = useCallback((photoId: string) => {
    setPendingPhoto((current) => current?.id === photoId ? null : current);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!enabled || !session.glasses.ready) return;
    if (!config.baseUrl || !config.apiKey) {
      handleError(new Error('Pair DotAgents with a reachable desktop before taking a Mentra photo.'));
      return;
    }

    const requestId = Crypto.randomUUID().replace(/-/g, '_');
    let callbackUrl: string;
    try {
      callbackUrl = getMentraPhotoCallbackUrl(config.baseUrl, requestId);
    } catch (nextError) {
      handleError(nextError);
      return;
    }

    setPhotoStatus('capturing');
    setError(null);
    try {
      await BluetoothSdk.requestPhoto({
        requestId,
        appId: 'dotagents',
        size: 'medium',
        webhookUrl: callbackUrl,
        authToken: config.apiKey,
        compress: 'medium',
        save: false,
        sound: true,
      });
      setPhotoStatus('downloading');
      const response = await fetch(callbackUrl, {
        headers: { Authorization: `Bearer ${config.apiKey}`, Accept: 'image/*' },
      });
      if (!response.ok) throw new Error(`Photo download returned ${response.status}`);
      const mimeType = response.headers.get('content-type')?.split(';', 1)[0] || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
      const createdAt = Date.now();
      setPendingPhoto({
        id: requestId,
        name: `mentra-${requestId}.${mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/avif' ? 'avif' : 'jpg'}`,
        previewUri: dataUrl,
        dataUrl,
        createdAt,
        expiresAt: createdAt + PHOTO_TTL_MS,
      });
      setPhotoStatus('ready for voice prompt');
      await fetch(callbackUrl, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${config.apiKey}` },
      }).catch(() => undefined);
    } catch (nextError) {
      setPhotoStatus('failed');
      handleError(nextError);
    }
  }, [config.apiKey, config.baseUrl, enabled, handleError, session.glasses.ready]);

  useBluetoothEvent('touch_event', (event) => {
    if (!enabled) return;
    const dedupeKey = `${event.gestureName}:${event.timestamp}`;
    if (lastHardwareEventRef.current === dedupeKey) return;
    lastHardwareEventRef.current = dedupeKey;
    touchSequenceRef.current += 1;
    setLastTouch({ sequence: touchSequenceRef.current, gestureName: event.gestureName, timestamp: event.timestamp });
  }, { enabled });

  useBluetoothEvent('button_press', (event) => {
    if (enabled && event.buttonId === 'camera' && event.pressType === 'short') {
      void capturePhoto();
    }
  }, { enabled });

  useBluetoothEvent('speaking_status', (event) => {
    if (!enabled) return;
    speakingSequenceRef.current += 1;
    setLastSpeaking({ sequence: speakingSequenceRef.current, speaking: event.speaking, timestamp: event.timestamp });
  }, { enabled });

  useBluetoothEvent('audio_pairing_needed', (event) => {
    setAudioConnected(false);
    setAudioPairingDeviceName(event.deviceName);
  }, { enabled });
  useBluetoothEvent('audio_connected', (event) => {
    setAudioConnected(true);
    setAudioPairingDeviceName(event.deviceName);
  }, { enabled });
  useBluetoothEvent('audio_disconnected', () => setAudioConnected(false), { enabled });
  useBluetoothEvent('photo_status', (event) => setPhotoStatus(event.status), { enabled });
  useBluetoothEvent('mic_pcm', (event: MicPcmEvent) => {
    if (captureStateRef.current !== 'capturing' || captureBytesRef.current >= MAX_CAPTURE_BYTES) return;
    const incoming = new Uint8Array(event.pcm);
    const remaining = MAX_CAPTURE_BYTES - captureBytesRef.current;
    const accepted = incoming.byteLength > remaining ? incoming.slice(0, remaining) : incoming.slice();
    captureChunksRef.current.push(accepted);
    captureBytesRef.current += accepted.byteLength;
    if (captureBytesRef.current >= MAX_CAPTURE_BYTES || Date.now() - captureStartedAtRef.current >= MAX_CAPTURE_MS) {
      void BluetoothSdk.setMicState(false, true, false, false).catch(handleError);
      speakingSequenceRef.current += 1;
      setLastSpeaking({
        sequence: speakingSequenceRef.current,
        speaking: false,
        timestamp: Date.now(),
      });
    }
  }, { enabled });

  useEffect(() => {
    if (!enabled || !session.glasses.ready) return;
    setError(null);
    void Promise.all([
      session.setGalleryModeEnabled(false),
      session.setVoiceActivityDetectionEnabled(true),
    ]).catch(handleError);
  }, [enabled, handleError, session.glasses.ready]);

  useEffect(() => {
    if (enabled) return;
    captureChunksRef.current = [];
    captureBytesRef.current = 0;
    setCaptureState('idle');
    setPendingPhoto(null);
    setAudioConnected(false);
    void BluetoothSdk.setMicState(false, true, false, false).catch(() => undefined);
    if (session.glasses.connected) void session.disconnect().catch(handleError);
  }, [enabled]);

  useEffect(() => {
    if (!pendingPhoto) return;
    const timeout = setTimeout(() => {
      setPendingPhoto((current) => current?.id === pendingPhoto.id ? null : current);
      setPhotoStatus((current) => current === 'ready for voice prompt' ? 'expired' : current);
    }, Math.max(0, pendingPhoto.expiresAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [pendingPhoto]);

  const beginCapture = useCallback(async () => {
    if (!enabled || !session.glasses.ready) throw new Error('Mentra Live is not ready.');
    if (!config.baseUrl || !config.apiKey) {
      throw new Error('Pair DotAgents with the desktop before using the Mentra Live microphone.');
    }
    if (captureStateRef.current !== 'idle') return;
    captureStateRef.current = 'capturing';
    setCaptureState('capturing');
    try {
      await requestMentraPermissions();
      captureChunksRef.current = [];
      captureBytesRef.current = 0;
      captureStartedAtRef.current = Date.now();
      setError(null);
      await BluetoothSdk.setMicState(true, true, false, false);
    } catch (nextError) {
      captureStateRef.current = 'idle';
      setCaptureState('idle');
      handleError(nextError);
      throw nextError;
    }
  }, [config.apiKey, config.baseUrl, enabled, handleError, session.glasses.ready]);

  const cancelCapture = useCallback(async () => {
    captureChunksRef.current = [];
    captureBytesRef.current = 0;
    captureStateRef.current = 'idle';
    setCaptureState('idle');
    await BluetoothSdk.setMicState(false, true, false, false).catch(handleError);
  }, [handleError]);

  const finishCapture = useCallback(async (options?: FinishMentraCaptureOptions): Promise<string> => {
    if (captureStateRef.current !== 'capturing') return '';
    captureStateRef.current = 'transcribing';
    setCaptureState('transcribing');
    await BluetoothSdk.setMicState(false, true, false, false).catch(handleError);
    await options?.onCaptureStopped?.();
    const byteLength = captureBytesRef.current;
    if (!byteLength) {
      captureStateRef.current = 'idle';
      setCaptureState('idle');
      throw new Error('No speech audio was received from Mentra Live.');
    }

    const pcm = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of captureChunksRef.current) {
      pcm.set(chunk, offset);
      offset += chunk.byteLength;
    }

    try {
      const response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}/stt/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          encoding: 'pcm_s16le',
          audioBase64: arrayBufferToBase64(pcm.buffer),
          sampleRate: 16_000,
          channels: 1,
          bitsPerSample: 16,
          durationMs: Math.round((byteLength / 2 / 16_000) * 1_000),
        }),
      });
      if (!response.ok) throw new Error(`Desktop transcription returned ${response.status}: ${await response.text()}`);
      const result = await response.json() as { text?: string };
      return result.text?.trim() || '';
    } catch (nextError) {
      handleError(nextError);
      throw nextError;
    } finally {
      captureChunksRef.current = [];
      captureBytesRef.current = 0;
      captureStateRef.current = 'idle';
      setCaptureState('idle');
    }
  }, [config.apiKey, config.baseUrl, handleError]);

  const value = useMemo<MentraContextValue>(() => ({
    supported: true,
    enabled,
    busy: session.busy,
    ready: enabled && session.glasses.ready,
    connectionState: session.glasses.connection.state as MentraConnectionState,
    audioConnected,
    audioPairingDeviceName,
    defaultDevice: asMentraDevice(session.defaultDevice),
    devices: session.scan.devices.map((device) => asMentraDevice(device)!),
    batteryLevel: session.glasses.connected ? session.glasses.battery.level : null,
    charging: session.glasses.connected ? session.glasses.battery.charging : false,
    firmwareVersion: session.glasses.connected ? session.glasses.firmware.version : null,
    error,
    photoStatus,
    captureState,
    lastTouch,
    lastSpeaking,
    pendingPhoto,
    startScan: async () => {
      await requestMentraPermissions();
      setError(null);
      await session.scan.start();
    },
    stopScan: session.scan.stop,
    selectDevice: (device) => session.scan.selectDevice(device as Device | null),
    connect: async (device) => {
      await requestMentraPermissions();
      setError(null);
      await session.connect(device as Device | undefined, { saveAsDefault: true, cancelExistingConnectionAttempt: true });
    },
    disconnect: async () => {
      await cancelCapture();
      await session.disconnect();
      setAudioConnected(false);
    },
    forget: async () => {
      await cancelCapture();
      await BluetoothSdk.forget();
      await session.clearDefaultDevice();
      setAudioConnected(false);
    },
    beginCapture,
    finishCapture,
    cancelCapture,
    clearPendingPhoto,
    consumePendingPhoto,
    setOwnAppAudioPlaying: BluetoothSdk.setOwnAppAudioPlaying,
  }), [
    audioConnected,
    audioPairingDeviceName,
    beginCapture,
    cancelCapture,
    captureState,
    clearPendingPhoto,
    consumePendingPhoto,
    enabled,
    error,
    finishCapture,
    lastSpeaking,
    lastTouch,
    pendingPhoto,
    photoStatus,
    session,
  ]);

  return <MentraContext.Provider value={value}>{children}</MentraContext.Provider>;
}

export function useMentra(): MentraContextValue {
  return useContext(MentraContext);
}
