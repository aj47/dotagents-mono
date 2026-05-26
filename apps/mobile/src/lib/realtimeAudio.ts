import { Platform } from 'react-native';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { concatenateUint8Arrays, createPcm16WavFile } from './realtimeAudioUtils';
import { ensureNativeTtsAudioMode } from './remoteTts';

type PlaybackCallbacks = {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (message: string) => void;
  onStopped?: () => void;
};

type WebRealtimePlayback = {
  kind: 'web';
  audio: HTMLAudioElement;
  objectUrl: string;
  stopped: boolean;
  onStopped?: () => void;
};

type NativeRealtimePlayback = {
  kind: 'native';
  player: AudioPlayer;
  file: File;
  subscription: { remove: () => void } | null;
  stopped: boolean;
  onStopped?: () => void;
};

let currentPlayback: WebRealtimePlayback | NativeRealtimePlayback | null = null;

export async function playRealtimePcm16Audio(
  pcmChunks: Uint8Array[],
  callbacks: PlaybackCallbacks = {},
): Promise<boolean> {
  const pcm = concatenateUint8Arrays(pcmChunks);
  if (pcm.length === 0) return false;

  const wav = createPcm16WavFile(pcm, { sampleRate: 24000, channels: 1 });
  stopRealtimeAudio(true);

  if (Platform.OS === 'web') {
    return startWebPlayback(wav, callbacks);
  }

  await ensureNativeTtsAudioMode();
  return startNativePlayback(wav, callbacks);
}

export function stopRealtimeAudio(notifyStopped = true): void {
  const playback = currentPlayback;
  if (!playback) return;
  currentPlayback = null;
  const shouldNotifyStopped = notifyStopped && !playback.stopped;
  playback.stopped = true;

  if (playback.kind === 'web') {
    try { playback.audio.pause(); } catch {}
    try { playback.audio.currentTime = 0; } catch {}
    try { URL.revokeObjectURL(playback.objectUrl); } catch {}
    if (shouldNotifyStopped) playback.onStopped?.();
    return;
  }

  try { playback.subscription?.remove(); } catch {}
  try { playback.player.pause(); } catch {}
  try { playback.player.remove(); } catch {}
  try { playback.file.delete(); } catch {}
  if (shouldNotifyStopped) playback.onStopped?.();
}

function startWebPlayback(wav: Uint8Array, callbacks: PlaybackCallbacks): boolean {
  const wavBuffer = new ArrayBuffer(wav.byteLength);
  new Uint8Array(wavBuffer).set(wav);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  const playback: WebRealtimePlayback = {
    kind: 'web',
    audio,
    objectUrl,
    stopped: false,
    onStopped: callbacks.onStopped,
  };
  currentPlayback = playback;
  let started = false;

  const markStarted = () => {
    if (started || playback.stopped) return;
    started = true;
    callbacks.onStart?.();
  };
  const cleanup = () => {
    try { URL.revokeObjectURL(objectUrl); } catch {}
    if (currentPlayback === playback) currentPlayback = null;
  };

  audio.onplaying = markStarted;
  audio.onended = () => {
    playback.stopped = true;
    cleanup();
    callbacks.onDone?.();
  };
  audio.onerror = () => {
    playback.stopped = true;
    cleanup();
    callbacks.onError?.('Realtime audio playback failed.');
  };

  void audio.play().then(markStarted).catch((error) => {
    playback.stopped = true;
    cleanup();
    callbacks.onError?.((error as any)?.message || 'Realtime audio playback failed.');
  });
  return true;
}

function startNativePlayback(wav: Uint8Array, callbacks: PlaybackCallbacks): boolean {
  const file = new File(Paths.cache, `realtime-${Date.now()}-${Math.floor(Math.random() * 1e6)}.wav`);
  try { file.create({ overwrite: true }); } catch {}
  file.write(wav);

  const player = createAudioPlayer({ uri: file.uri });
  const playback: NativeRealtimePlayback = {
    kind: 'native',
    player,
    file,
    subscription: null,
    stopped: false,
    onStopped: callbacks.onStopped,
  };
  currentPlayback = playback;
  let started = false;

  const finalize = (reason: 'done' | 'error' | 'stopped') => {
    try { playback.subscription?.remove(); } catch {}
    try { player.remove(); } catch {}
    try { file.delete(); } catch {}
    if (currentPlayback === playback) currentPlayback = null;
    if (reason === 'done') callbacks.onDone?.();
    else if (reason === 'error') callbacks.onError?.('Realtime audio playback failed.');
    else callbacks.onStopped?.();
  };

  try {
    playback.subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (playback.stopped) return;
      if (status.playing && !started) {
        started = true;
        callbacks.onStart?.();
      }
      if (status.didJustFinish) {
        playback.stopped = true;
        finalize('done');
      }
    });
  } catch {}

  try {
    player.play();
  } catch (error) {
    playback.stopped = true;
    finalize('error');
    callbacks.onError?.((error as any)?.message || 'Realtime audio playback failed.');
    return false;
  }
  return true;
}