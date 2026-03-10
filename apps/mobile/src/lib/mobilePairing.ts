import { normalizeApiBaseUrl } from '@dotagents/shared';

export type MobilePairingConfig = {
  baseUrl: string;
  apiKey: string;
  model?: string;
};

export const EMPTY_MANUAL_PAIRING_LINK_ERROR = 'Paste the DotAgents desktop deep link before tapping Apply Link.';
export const INCOMPLETE_MANUAL_PAIRING_LINK_ERROR = 'The copied desktop link must include both Base URL and API Key.';
export const INVALID_MANUAL_PAIRING_LINK_ERROR = 'Paste the full dotagents://config deep link copied from DotAgents desktop.';

type PairingParseResult =
  | { kind: 'success'; config: MobilePairingConfig }
  | { kind: 'empty' | 'incomplete' | 'invalid' };

function normalizeDeepLinkPath(parsedUrl: URL): string {
  let fullPath = parsedUrl.pathname;
  if (parsedUrl.hostname) {
    fullPath = `/${parsedUrl.hostname}${parsedUrl.pathname}`;
  }
  return fullPath.replace(/^\/+/, '/') || '/';
}

function parseMobilePairingCandidate(candidate: string | null | undefined): PairingParseResult {
  const trimmed = candidate?.trim() ?? '';
  if (!trimmed) {
    return { kind: 'empty' };
  }

  try {
    const parsedUrl = new URL(trimmed);
    if (parsedUrl.protocol.toLowerCase() !== 'dotagents:' || normalizeDeepLinkPath(parsedUrl) !== '/config') {
      return { kind: 'invalid' };
    }

    const baseUrl = parsedUrl.searchParams.get('baseUrl')?.trim() ?? '';
    const apiKey = parsedUrl.searchParams.get('apiKey')?.trim() ?? '';
    const model = parsedUrl.searchParams.get('model')?.trim() ?? '';

    if (!baseUrl || !apiKey) {
      return { kind: 'incomplete' };
    }

    return {
      kind: 'success',
      config: {
        baseUrl: normalizeApiBaseUrl(baseUrl),
        apiKey,
        ...(model ? { model } : {}),
      },
    };
  } catch {
    return { kind: 'invalid' };
  }
}

export function parseMobilePairingDeepLink(candidate: string | null | undefined): MobilePairingConfig | null {
  const result = parseMobilePairingCandidate(candidate);
  return result.kind === 'success' ? result.config : null;
}

export function resolveManualMobilePairingDeepLink(candidate: string):
  | { ok: true; config: MobilePairingConfig }
  | { ok: false; errorMessage: string } {
  const result = parseMobilePairingCandidate(candidate);
  if (result.kind === 'success') {
    return { ok: true, config: result.config };
  }

  if (result.kind === 'empty') {
    return { ok: false, errorMessage: EMPTY_MANUAL_PAIRING_LINK_ERROR };
  }

  if (result.kind === 'incomplete') {
    return { ok: false, errorMessage: INCOMPLETE_MANUAL_PAIRING_LINK_ERROR };
  }

  return { ok: false, errorMessage: INVALID_MANUAL_PAIRING_LINK_ERROR };
}

export function applyMobilePairingConfig<T extends { baseUrl?: string; apiKey?: string; model?: string }>(
  currentConfig: T,
  pairingConfig: MobilePairingConfig,
): T {
  return {
    ...currentConfig,
    baseUrl: pairingConfig.baseUrl,
    apiKey: pairingConfig.apiKey,
    ...(pairingConfig.model ? { model: pairingConfig.model } : {}),
  };
}