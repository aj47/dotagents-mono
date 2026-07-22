export type MentraDevice = {
  id: string;
  model: string;
  name: string;
  address?: string;
  rssi?: number;
};

export type MentraConnectionState =
  | 'unsupported'
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'bonding'
  | 'connected';

export type MentraTouchGesture = {
  sequence: number;
  gestureName: string;
  timestamp: number;
};

export type MentraSpeakingEvent = {
  sequence: number;
  speaking: boolean;
  timestamp: number;
};

export type PendingMentraPhoto = {
  id: string;
  name: string;
  previewUri: string;
  dataUrl: string;
  createdAt: number;
  expiresAt: number;
};

export type MentraContextValue = {
  supported: boolean;
  enabled: boolean;
  busy: boolean;
  ready: boolean;
  connectionState: MentraConnectionState;
  audioConnected: boolean;
  audioPairingDeviceName: string | null;
  defaultDevice: MentraDevice | null;
  devices: MentraDevice[];
  batteryLevel: number | null;
  charging: boolean;
  firmwareVersion: string | null;
  error: string | null;
  photoStatus: string | null;
  captureState: 'idle' | 'capturing' | 'transcribing';
  lastTouch: MentraTouchGesture | null;
  lastSpeaking: MentraSpeakingEvent | null;
  pendingPhoto: PendingMentraPhoto | null;
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  selectDevice(device: MentraDevice | null): void;
  connect(device?: MentraDevice): Promise<void>;
  disconnect(): Promise<void>;
  forget(): Promise<void>;
  beginCapture(): Promise<void>;
  finishCapture(): Promise<string>;
  cancelCapture(): Promise<void>;
  clearPendingPhoto(): void;
  setOwnAppAudioPlaying(playing: boolean): Promise<void>;
};
