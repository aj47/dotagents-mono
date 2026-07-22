import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type AudioPlayerStub = {
  play: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
};

const playAndroidHandsFreeCueMock = vi.fn<[
  { cueId: string; filePath: string },
], Promise<boolean>>();
const createAudioPlayerMock = vi.fn<[unknown], AudioPlayerStub>();
const setAudioModeAsyncMock = vi.fn<[unknown], Promise<void>>();
const fileWriteMock = vi.fn();
const fileCreateMock = vi.fn();

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('expo-audio', () => ({
  createAudioPlayer: createAudioPlayerMock,
  setAudioModeAsync: setAudioModeAsyncMock,
}));

vi.mock('expo-file-system', () => ({
  Paths: { cache: '/cache' },
  File: class FileStub {
    uri: string;
    constructor(_dir: unknown, name: string) {
      this.uri = `file:///cache/${name}`;
    }
    create = fileCreateMock;
    write = fileWriteMock;
  },
}));

vi.mock('./androidHandsFreeService', () => ({
  playAndroidHandsFreeCue: playAndroidHandsFreeCueMock,
}));

async function loadModule() {
  vi.resetModules();
  return import('./handsFreeAudioCues');
}

beforeEach(() => {
  playAndroidHandsFreeCueMock.mockReset();
  createAudioPlayerMock.mockReset();
  setAudioModeAsyncMock.mockReset();
  fileWriteMock.mockReset();
  fileCreateMock.mockReset();

  setAudioModeAsyncMock.mockResolvedValue(undefined);
  createAudioPlayerMock.mockImplementation((): AudioPlayerStub => ({
    play: vi.fn(),
    remove: vi.fn(),
    addListener: vi.fn(() => ({ remove: vi.fn() })) as unknown as AudioPlayerStub['addListener'],
  }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('handsFreeAudioCues', () => {
  it('reports cue durations for sequencing Mentra microphone capture', async () => {
    const mod = await loadModule();

    expect(mod.getHandsFreeAudioCueDurationMs('listening')).toBe(252);
    expect(mod.getHandsFreeAudioCueDurationMs('processing')).toBe(192);
    expect(mod.getHandsFreeAudioCueDurationMs('stopped')).toBe(228);
  });

  it('routes cue playback through the Android service when service routing is enabled', async () => {
    const mod = await loadModule();
    playAndroidHandsFreeCueMock.mockResolvedValue(true);

    mod.setAndroidHandsFreeCueRoutingEnabled(true);
    expect(mod.isAndroidHandsFreeCueRoutingEnabled()).toBe(true);

    mod.playHandsFreeAudioCue('listening');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(playAndroidHandsFreeCueMock).toHaveBeenCalledTimes(1);
    const args = playAndroidHandsFreeCueMock.mock.calls[0][0];
    expect(args.cueId).toBe('listening');
    expect(args.filePath).toBe('file:///cache/handsfree-cue-listening.wav');
    // Service path handled playback, so expo-audio should not be used.
    expect(createAudioPlayerMock).not.toHaveBeenCalled();
  });

  it('falls back to expo-audio when the Android service rejects routing', async () => {
    const mod = await loadModule();
    playAndroidHandsFreeCueMock.mockResolvedValue(false);

    mod.setAndroidHandsFreeCueRoutingEnabled(true);
    mod.playHandsFreeAudioCue('stopped');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(playAndroidHandsFreeCueMock).toHaveBeenCalledTimes(1);
    // Native fallback path should still attempt local playback.
    expect(createAudioPlayerMock).toHaveBeenCalledTimes(1);
  });

  it('uses expo-audio directly when service routing is disabled', async () => {
    const mod = await loadModule();
    mod.setAndroidHandsFreeCueRoutingEnabled(false);
    expect(mod.isAndroidHandsFreeCueRoutingEnabled()).toBe(false);

    mod.playHandsFreeAudioCue('enabled');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(playAndroidHandsFreeCueMock).not.toHaveBeenCalled();
    expect(createAudioPlayerMock).toHaveBeenCalledTimes(1);
  });

  it('debounces rapid repeated cue requests for the same cue', async () => {
    const mod = await loadModule();
    playAndroidHandsFreeCueMock.mockResolvedValue(true);
    mod.setAndroidHandsFreeCueRoutingEnabled(true);

    mod.playHandsFreeAudioCue('listening');
    mod.playHandsFreeAudioCue('listening');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(playAndroidHandsFreeCueMock).toHaveBeenCalledTimes(1);
  });
});
