import type { PushStatusResponse, PushTokenRegistration } from './api-types';

export type PushTokenRecord = PushTokenRegistration & {
  registeredAt: number;
};

export type PushRegistrationParseResult =
  | { ok: true; registration: PushTokenRegistration }
  | { ok: false; statusCode: 400; error: string };

export type PushTokenParseResult =
  | { ok: true; token: string }
  | { ok: false; statusCode: 400; error: string };

export type PushTokenRegistrationResult = {
  tokens: PushTokenRecord[];
  updatedExisting: boolean;
};

export function parsePushTokenRegistrationBody(body: unknown): PushRegistrationParseResult {
  const requestBody = body && typeof body === 'object'
    ? body as { token?: unknown; type?: unknown; platform?: unknown; deviceId?: unknown }
    : {};

  if (typeof requestBody.token !== 'string' || requestBody.token.length === 0) {
    return { ok: false, statusCode: 400, error: 'Missing or invalid token' };
  }

  if (requestBody.platform !== 'ios' && requestBody.platform !== 'android') {
    return { ok: false, statusCode: 400, error: "Invalid platform. Must be 'ios' or 'android'" };
  }

  return {
    ok: true,
    registration: {
      token: requestBody.token,
      type: 'expo',
      platform: requestBody.platform,
      deviceId: typeof requestBody.deviceId === 'string' ? requestBody.deviceId : undefined,
    },
  };
}

export function parsePushTokenBody(body: unknown): PushTokenParseResult {
  const requestBody = body && typeof body === 'object'
    ? body as { token?: unknown }
    : {};

  if (typeof requestBody.token !== 'string' || requestBody.token.length === 0) {
    return { ok: false, statusCode: 400, error: 'Missing or invalid token' };
  }

  return { ok: true, token: requestBody.token };
}

export function upsertPushTokenRegistration(
  existingTokens: PushTokenRecord[],
  registration: PushTokenRegistration,
  registeredAt: number,
): PushTokenRegistrationResult {
  const newToken: PushTokenRecord = {
    ...registration,
    registeredAt,
  };

  const existingIndex = existingTokens.findIndex(token => token.token === registration.token);
  if (existingIndex >= 0) {
    const tokens = [...existingTokens];
    tokens[existingIndex] = newToken;
    return { tokens, updatedExisting: true };
  }

  return {
    tokens: [...existingTokens, newToken],
    updatedExisting: false,
  };
}

export function removePushTokenRegistration(
  existingTokens: PushTokenRecord[],
  token: string,
): { tokens: PushTokenRecord[]; removed: boolean } {
  const tokens = existingTokens.filter(entry => entry.token !== token);
  return {
    tokens,
    removed: tokens.length < existingTokens.length,
  };
}

export function buildPushRegistrationResponse(
  tokenCount: number,
  updatedExisting: boolean,
): { success: true; message: string; tokenCount: number } {
  return {
    success: true,
    message: updatedExisting ? 'Token updated' : 'Token registered',
    tokenCount,
  };
}

export function buildPushUnregistrationResponse(
  tokenCount: number,
  removed: boolean,
): { success: true; message: string; tokenCount: number } {
  return {
    success: true,
    message: removed ? 'Token unregistered' : 'Token not found',
    tokenCount,
  };
}

export function buildPushBadgeClearResponse(): { success: true } {
  return { success: true };
}

export function buildPushStatusResponse<T extends { platform: PushTokenRegistration['platform'] }>(
  tokens: T[],
): PushStatusResponse {
  return {
    enabled: tokens.length > 0,
    tokenCount: tokens.length,
    platforms: [...new Set(tokens.map(token => token.platform))],
  };
}
