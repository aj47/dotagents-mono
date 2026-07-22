import { createContext } from 'react';
import type { MentraContextValue } from './types';

export const unsupportedMentraValue: MentraContextValue = {
  supported: false,
  enabled: false,
  busy: false,
  ready: false,
  connectionState: 'unsupported',
  audioConnected: false,
  audioPairingDeviceName: null,
  defaultDevice: null,
  devices: [],
  batteryLevel: null,
  charging: false,
  firmwareVersion: null,
  error: null,
  photoStatus: null,
  captureState: 'idle',
  lastTouch: null,
  lastSpeaking: null,
  pendingPhoto: null,
  startScan: async () => {},
  stopScan: async () => {},
  selectDevice: () => {},
  connect: async () => {},
  disconnect: async () => {},
  forget: async () => {},
  beginCapture: async () => {},
  finishCapture: async () => '',
  cancelCapture: async () => {},
  clearPendingPhoto: () => {},
  consumePendingPhoto: () => {},
  setOwnAppAudioPlaying: async () => {},
};

export const MentraContext = createContext<MentraContextValue>(unsupportedMentraValue);
