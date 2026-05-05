import { describe, expect, it } from 'vitest';
import {
  LOCAL_SPEECH_MODEL_LABELS,
  LOCAL_SPEECH_MODEL_DOWNLOAD_ACTION,
  LOCAL_SPEECH_MODEL_PROVIDER_IDS,
  LOCAL_TTS_SPEECH_MODEL_PROVIDER_IDS,
  buildLocalSpeechModelDownloadErrorResponse,
  buildLocalSpeechModelDownloadResponse,
  buildLocalSpeechModelStatusesResponse,
  formatLocalSpeechModelStatusesResponse,
  getLocalSpeechModelLabel,
  getLocalTtsSpeechModelProviderId,
  isLocalSpeechModelProviderId,
  isLocalTtsSpeechModelProviderId,
} from './local-speech-models';

describe('local speech model metadata', () => {
  it('exports provider ids, labels, and validation', () => {
    expect(LOCAL_SPEECH_MODEL_PROVIDER_IDS).toEqual(['parakeet', 'kitten', 'supertonic']);
    expect(LOCAL_SPEECH_MODEL_LABELS).toEqual({
      parakeet: 'Parakeet',
      kitten: 'Kitten',
      supertonic: 'Supertonic',
    });
    expect(getLocalSpeechModelLabel('parakeet')).toBe('Parakeet');
    expect(isLocalSpeechModelProviderId('kitten')).toBe(true);
    expect(isLocalSpeechModelProviderId('edge')).toBe(false);
  });

  it('identifies local TTS model providers separately from local STT providers', () => {
    expect(LOCAL_TTS_SPEECH_MODEL_PROVIDER_IDS).toEqual(['kitten', 'supertonic']);
    expect(isLocalTtsSpeechModelProviderId('kitten')).toBe(true);
    expect(isLocalTtsSpeechModelProviderId('supertonic')).toBe(true);
    expect(isLocalTtsSpeechModelProviderId('parakeet')).toBe(false);
    expect(getLocalTtsSpeechModelProviderId('kitten')).toBe('kitten');
    expect(getLocalTtsSpeechModelProviderId('openai')).toBeUndefined();
  });

  it('formats status responses for the operator API', () => {
    expect(formatLocalSpeechModelStatusesResponse({
      parakeet: { downloaded: true, downloading: false, progress: 1 },
      kitten: { downloaded: false, downloading: true, progress: 0.3 },
      supertonic: { downloaded: false, downloading: false, progress: 0 },
    })).toEqual({
      models: {
        parakeet: { downloaded: true, downloading: false, progress: 1 },
        kitten: { downloaded: false, downloading: true, progress: 0.3 },
        supertonic: { downloaded: false, downloading: false, progress: 0 },
      },
    });
  });

  it('collects local speech model statuses from provider-specific readers', async () => {
    await expect(buildLocalSpeechModelStatusesResponse((providerId) => ({
      downloaded: providerId === 'parakeet',
      downloading: providerId === 'kitten',
      progress: providerId === 'supertonic' ? 0.5 : 0,
    }))).resolves.toEqual({
      models: {
        parakeet: { downloaded: true, downloading: false, progress: 0 },
        kitten: { downloaded: false, downloading: true, progress: 0 },
        supertonic: { downloaded: false, downloading: false, progress: 0.5 },
      },
    });
  });

  it('builds local speech model download responses', () => {
    expect(LOCAL_SPEECH_MODEL_DOWNLOAD_ACTION).toBe('local-speech-model-download');

    expect(buildLocalSpeechModelDownloadResponse('kitten', {
      downloaded: true,
      downloading: false,
      progress: 1,
    })).toEqual({
      success: true,
      action: 'local-speech-model-download',
      message: 'Kitten model is already downloaded.',
      details: {
        providerId: 'kitten',
        downloaded: true,
        progress: 1,
      },
    });

    expect(buildLocalSpeechModelDownloadResponse('supertonic', {
      downloaded: false,
      downloading: true,
      progress: 0.4,
    })).toEqual({
      success: true,
      action: 'local-speech-model-download',
      message: 'Supertonic model download is already in progress.',
      scheduled: false,
      details: {
        providerId: 'supertonic',
        downloading: true,
        progress: 0.4,
      },
    });

    expect(buildLocalSpeechModelDownloadResponse('parakeet', {
      downloaded: false,
      downloading: false,
      progress: 0,
    })).toEqual({
      success: true,
      action: 'local-speech-model-download',
      message: 'Parakeet model download started on the desktop machine.',
      scheduled: true,
      details: {
        providerId: 'parakeet',
        downloading: true,
        progress: 0,
      },
    });
  });

  it('builds local speech model download error responses', () => {
    expect(buildLocalSpeechModelDownloadErrorResponse('kitten', 'Download failed')).toEqual({
      success: false,
      action: 'local-speech-model-download',
      message: 'Download failed',
      error: 'Download failed',
      details: {
        providerId: 'kitten',
      },
    });
  });
});
