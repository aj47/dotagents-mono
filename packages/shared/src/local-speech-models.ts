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

export interface LocalSpeechModelActionAuditContext {
  action: string;
  success: boolean;
  details?: Record<string, unknown>;
  failureReason?: string;
}

export type LocalSpeechModelActionResult = {
  statusCode: number;
  body: unknown;
  auditContext?: LocalSpeechModelActionAuditContext;
};

export interface LocalSpeechModelActionDiagnostics {
  logError(source: string, message: string, error: unknown): void;
  getErrorMessage(error: unknown): string;
}

export interface LocalSpeechModelActionService {
  getStatus(providerId: LocalSpeechModelProviderId): Promise<LocalSpeechModelStatus>;
  startDownload(providerId: LocalSpeechModelProviderId): void;
}

export interface LocalSpeechModelProviderRuntime {
  getStatus(): LocalSpeechModelStatus | Promise<LocalSpeechModelStatus>;
  download(): void | Promise<void>;
}

export type LocalSpeechModelProviderRuntimeRegistry = Record<
  LocalSpeechModelProviderId,
  LocalSpeechModelProviderRuntime
>;

export interface LocalSpeechModelRuntimeService extends LocalSpeechModelActionService {
  download(providerId: LocalSpeechModelProviderId): Promise<void>;
}

export interface LocalSpeechModelRuntimeServiceOptions {
  diagnostics: Pick<LocalSpeechModelActionDiagnostics, 'logError'>;
  providers: LocalSpeechModelProviderRuntimeRegistry;
  logSource?: string;
}

export interface LocalSpeechModelActionOptions {
  diagnostics: LocalSpeechModelActionDiagnostics;
  service: LocalSpeechModelActionService;
}

export interface OperatorLocalSpeechModelRouteActions {
  getOperatorLocalSpeechModelStatuses(): Promise<LocalSpeechModelActionResult>;
  getOperatorLocalSpeechModelStatus(providerId: unknown): Promise<LocalSpeechModelActionResult>;
  downloadOperatorLocalSpeechModel(providerId: unknown): Promise<LocalSpeechModelActionResult>;
}

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

export function createLocalSpeechModelActionService(
  options: LocalSpeechModelRuntimeServiceOptions,
): LocalSpeechModelRuntimeService {
  const logSource = options.logSource ?? 'local-speech-model-service';
  const download = async (providerId: LocalSpeechModelProviderId): Promise<void> => {
    await options.providers[providerId].download();
  };

  return {
    getStatus: async (providerId) => options.providers[providerId].getStatus(),
    download,
    startDownload: (providerId) => {
      void download(providerId).catch((caughtError) => {
        options.diagnostics.logError(
          logSource,
          `Failed to download ${providerId} local speech model`,
          caughtError,
        );
      });
    },
  };
}

function buildLocalSpeechModelActionAuditContext(
  response: Pick<OperatorActionResponse, 'action' | 'success' | 'message' | 'error' | 'details'>,
): LocalSpeechModelActionAuditContext {
  return {
    action: response.action,
    success: response.success,
    ...(response.details ? { details: response.details } : {}),
    ...(!response.success ? { failureReason: response.error || response.message } : {}),
  };
}

function localSpeechModelActionOk(
  body: unknown,
  auditContext?: LocalSpeechModelActionAuditContext,
): LocalSpeechModelActionResult {
  return {
    statusCode: 200,
    body,
    ...(auditContext ? { auditContext } : {}),
  };
}

function localSpeechModelActionError(
  statusCode: number,
  message: string,
  auditContext?: LocalSpeechModelActionAuditContext,
): LocalSpeechModelActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(auditContext ? { auditContext } : {}),
  };
}

export async function getOperatorLocalSpeechModelStatusesAction(
  options: LocalSpeechModelActionOptions,
): Promise<LocalSpeechModelActionResult> {
  try {
    return localSpeechModelActionOk(await buildLocalSpeechModelStatusesResponse((providerId) => (
      options.service.getStatus(providerId)
    )));
  } catch (caughtError) {
    options.diagnostics.logError('operator-local-speech-actions', 'Failed to build local speech model statuses', caughtError);
    return localSpeechModelActionError(500, 'Failed to build local speech model statuses');
  }
}

export async function getOperatorLocalSpeechModelStatusAction(
  providerId: unknown,
  options: LocalSpeechModelActionOptions,
): Promise<LocalSpeechModelActionResult> {
  if (!isLocalSpeechModelProviderId(providerId)) {
    return localSpeechModelActionError(400, `Invalid local speech model provider: ${providerId || 'missing'}`);
  }

  try {
    return localSpeechModelActionOk(await options.service.getStatus(providerId));
  } catch (caughtError) {
    options.diagnostics.logError('operator-local-speech-actions', `Failed to build ${providerId} local speech model status`, caughtError);
    return localSpeechModelActionError(500, `Failed to build ${providerId} local speech model status`);
  }
}

export async function downloadOperatorLocalSpeechModelAction(
  providerId: unknown,
  options: LocalSpeechModelActionOptions,
): Promise<LocalSpeechModelActionResult> {
  if (!isLocalSpeechModelProviderId(providerId)) {
    return localSpeechModelActionError(400, `Invalid local speech model provider: ${providerId || 'missing'}`);
  }

  try {
    const status = await options.service.getStatus(providerId);
    if (!status.downloaded && !status.downloading) {
      options.service.startDownload(providerId);
    }

    const response = buildLocalSpeechModelDownloadResponse(providerId, status);
    return localSpeechModelActionOk(response, buildLocalSpeechModelActionAuditContext(response));
  } catch (caughtError) {
    const message = options.diagnostics.getErrorMessage(caughtError);
    const response = buildLocalSpeechModelDownloadErrorResponse(providerId, message);
    return localSpeechModelActionOk(response, buildLocalSpeechModelActionAuditContext(response));
  }
}

export function createOperatorLocalSpeechModelRouteActions(
  options: LocalSpeechModelActionOptions,
): OperatorLocalSpeechModelRouteActions {
  return {
    getOperatorLocalSpeechModelStatuses: () => getOperatorLocalSpeechModelStatusesAction(options),
    getOperatorLocalSpeechModelStatus: (providerId) =>
      getOperatorLocalSpeechModelStatusAction(providerId, options),
    downloadOperatorLocalSpeechModel: (providerId) =>
      downloadOperatorLocalSpeechModelAction(providerId, options),
  };
}
