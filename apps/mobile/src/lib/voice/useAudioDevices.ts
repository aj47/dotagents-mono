import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export type AudioInputDevice = {
  deviceId: string;
  label: string;
};

/**
 * Hook to enumerate available audio input (microphone) devices.
 *
 * - On **web** (Expo Web), uses `navigator.mediaDevices.enumerateDevices()`.
 *   Re-enumerates when devices change (e.g. USB mic plugged in).
 * - On **native** (iOS/Android), device selection is managed by the OS.
 *   `expo-speech-recognition` uses the system default microphone and does not
 *   expose a device-selection API. The hook returns an empty list on native.
 */
export function useAudioDevices(enabled: boolean = true) {
  const [inputDevices, setInputDevices] = useState<AudioInputDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const enumerate = useCallback(async () => {
    if (Platform.OS !== 'web') {
      // Native platforms don't support device enumeration via web APIs
      return;
    }

    try {
      // Request permission first so device labels are populated
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          // Permission denied — we'll still enumerate, labels may be missing
        }
      }

      if (!navigator.mediaDevices?.enumerateDevices) {
        setError('Audio device enumeration not supported');
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs: AudioInputDevice[] = devices
        .filter((d) => d.kind === 'audioinput' && d.deviceId)
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone (${d.deviceId.slice(0, 8)})`,
        }));

      setInputDevices(inputs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enumerate audio devices');
    }
  }, []);

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return undefined;

    enumerate();

    // Re-enumerate when devices change (e.g. USB device plugged/unplugged)
    const mediaDevices = navigator.mediaDevices;
    if (mediaDevices?.addEventListener) {
      mediaDevices.addEventListener('devicechange', enumerate);
      return () => {
        mediaDevices.removeEventListener('devicechange', enumerate);
      };
    }

    return undefined;
  }, [enumerate, enabled]);

  return { inputDevices, error, refresh: enumerate };
}
