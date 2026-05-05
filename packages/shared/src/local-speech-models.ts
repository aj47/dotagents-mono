import type {
  LocalSpeechModelProviderId,
  LocalSpeechModelStatus,
  LocalSpeechModelStatusesResponse,
  OperatorActionResponse,
} from './api-types';

export const LOCAL_SPEECH_MODEL_PROVIDER_IDS = [
  'parakeet',
  'kitten',
  'supertonic',
] as const satisfies readonly LocalSpeechModelProviderId[];

export const LOCAL_TTS_SPEECH_MODEL_PROVIDER_IDS = [
  'kitten',
  'supertonic',
] as const satisfies readonly LocalSpeechModelProviderId[];

export type LocalTtsSpeechModelProviderId = (typeof LOCAL_TTS_SPEECH_MODEL_PROVIDER_IDS)[number];

export const LOCAL_SPEECH_MODEL_DOWNLOAD_ACTION = 'local-speech-model-download';

export const LOCAL_SPEECH_MODEL_LABELS: Record<LocalSpeechModelProviderId, string> = {
  parakeet: 'Parakeet',
  kitten: 'Kitten',
  supertonic: 'Supertonic',
};

export function isLocalSpeechModelProviderId(value: unknown): value is LocalSpeechModelProviderId {
  return typeof value === 'string' && LOCAL_SPEECH_MODEL_PROVIDER_IDS.includes(value as LocalSpeechModelProviderId);
}

export function isLocalTtsSpeechModelProviderId(value: unknown): value is LocalTtsSpeechModelProviderId {
  return typeof value === 'string' && LOCAL_TTS_SPEECH_MODEL_PROVIDER_IDS.includes(value as LocalTtsSpeechModelProviderId);
}

export function getLocalTtsSpeechModelProviderId(value: unknown): LocalTtsSpeechModelProviderId | undefined {
  return isLocalTtsSpeechModelProviderId(value) ? value : undefined;
}

export function getLocalSpeechModelLabel(providerId: LocalSpeechModelProviderId): string {
  return LOCAL_SPEECH_MODEL_LABELS[providerId];
}

export function formatLocalSpeechModelStatusesResponse(
  models: Record<LocalSpeechModelProviderId, LocalSpeechModelStatus>,
): LocalSpeechModelStatusesResponse {
  return { models };
}

export async function buildLocalSpeechModelStatusesResponse(
  getStatus: (providerId: LocalSpeechModelProviderId) => LocalSpeechModelStatus | Promise<LocalSpeechModelStatus>,
  providerIds: readonly LocalSpeechModelProviderId[] = LOCAL_SPEECH_MODEL_PROVIDER_IDS,
): Promise<LocalSpeechModelStatusesResponse> {
  const entries = await Promise.all(
    providerIds.map(async (providerId) => [
      providerId,
      await getStatus(providerId),
    ] as const),
  );

  return formatLocalSpeechModelStatusesResponse(
    Object.fromEntries(entries) as Record<LocalSpeechModelProviderId, LocalSpeechModelStatus>,
  );
}

export function buildLocalSpeechModelDownloadResponse(
  providerId: LocalSpeechModelProviderId,
  status: LocalSpeechModelStatus,
): OperatorActionResponse {
  const label = getLocalSpeechModelLabel(providerId);

  if (status.downloaded) {
    return {
      success: true,
      action: LOCAL_SPEECH_MODEL_DOWNLOAD_ACTION,
      message: `${label} model is already downloaded.`,
      details: {
        providerId,
        downloaded: true,
        progress: status.progress,
      },
    };
  }

  return {
    success: true,
    action: LOCAL_SPEECH_MODEL_DOWNLOAD_ACTION,
    message: status.downloading
      ? `${label} model download is already in progress.`
      : `${label} model download started on the desktop machine.`,
    scheduled: !status.downloading,
    details: {
      providerId,
      downloading: true,
      progress: status.progress,
    },
  };
}

export function buildLocalSpeechModelDownloadErrorResponse(
  providerId: LocalSpeechModelProviderId,
  message: string,
): OperatorActionResponse {
  return {
    success: false,
    action: LOCAL_SPEECH_MODEL_DOWNLOAD_ACTION,
    message,
    error: message,
    details: {
      providerId,
    },
  };
}
