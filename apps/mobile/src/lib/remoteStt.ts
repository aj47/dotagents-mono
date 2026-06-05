import { File } from 'expo-file-system';
import type { RemoteSttTranscriptionResponse } from '@dotagents/shared';

export type RemoteSttOptions = {
  baseUrl: string;
  apiKey: string;
  uri: string;
  durationMs?: number;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  m4a: 'audio/m4a',
  mp4: 'audio/mp4',
  webm: 'audio/webm',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  '3gp': 'audio/3gpp',
};

function logRemoteStt(level: 'warn' | 'info', message: string, extra?: unknown): void {
  const prefix = '[remote-stt]';
  if (extra !== undefined) {
    if (level === 'warn') console.warn(prefix, message, extra);
    else console.log(prefix, message, extra);
  } else {
    if (level === 'warn') console.warn(prefix, message);
    else console.log(prefix, message);
  }
}

function summarizeRemoteSttError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack?.split('\n').slice(0, 3).join(' | ') };
  }
  return { message: String(error) };
}

function getFileNameFromUri(uri: string): string {
  const withoutQuery = uri.split('?', 1)[0] || uri;
  const lastSegment = withoutQuery.split('/').filter(Boolean).pop();
  return lastSegment || 'mobile-recording.m4a';
}

function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_BY_EXTENSION[extension] || 'audio/m4a';
}

function safeUrlHost(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return 'invalid-url';
  }
}

export async function transcribeRemoteSttRecording(options: RemoteSttOptions): Promise<RemoteSttTranscriptionResponse> {
  if (!options.baseUrl || !options.apiKey) {
    throw new Error('Missing paired desktop URL or API key');
  }
  if (!options.uri) {
    throw new Error('Missing recording URI');
  }

  const file = new File(options.uri);
  const fileName = getFileNameFromUri(options.uri);
  const mimeType = getMimeTypeFromFileName(fileName);
  const audioBase64 = await file.base64();
  const base = options.baseUrl.replace(/\/+$/, '');
  const url = `${base}/stt/transcribe`;

  logRemoteStt('info', 'transcribe request', {
    host: safeUrlHost(url),
    fileName,
    mimeType,
    durationMs: options.durationMs,
    base64Length: audioBase64.length,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({
      audioBase64,
      mimeType,
      fileName,
      durationMs: options.durationMs,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Remote STT returned ${response.status}: ${detail}`);
  }

  const result = await response.json() as RemoteSttTranscriptionResponse;
  logRemoteStt('info', 'transcribe response', {
    provider: result.provider,
    model: result.model,
    textLength: result.text?.length ?? 0,
  });
  return result;
}

export function logRemoteSttFailure(error: unknown): void {
  logRemoteStt('warn', 'transcribe failed', summarizeRemoteSttError(error));
}
