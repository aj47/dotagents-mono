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

export type PushActionResult = {
  statusCode: number;
  body: unknown;
};

export interface PushActionTokenStore {
  getPushNotificationTokens(): PushTokenRecord[];
  savePushNotificationTokens(tokens: PushTokenRecord[]): void;
}

export interface PushActionDiagnostics {
  logError(source: string, message: string, error: unknown): void;
  logInfo?(source: string, message: string): void;
}

export interface PushActionBadgeService {
  clearBadgeCount(token: string): void;
}

export interface PushActionOptions {
  tokenStore: PushActionTokenStore;
  diagnostics: PushActionDiagnostics;
  badgeService?: PushActionBadgeService;
  now?: () => number;
}

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

function pushActionOk(body: unknown): PushActionResult {
  return {
    statusCode: 200,
    body,
  };
}

function pushActionError(statusCode: number, message: string): PushActionResult {
  return {
    statusCode,
    body: { error: message },
  };
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function registerPushTokenAction(body: unknown, options: PushActionOptions): PushActionResult {
  try {
    const parsedRequest = parsePushTokenRegistrationBody(body);
    if (parsedRequest.ok === false) {
      return pushActionError(parsedRequest.statusCode, parsedRequest.error);
    }

    const existingTokens = options.tokenStore.getPushNotificationTokens();
    const registrationResult = upsertPushTokenRegistration(
      existingTokens,
      parsedRequest.registration,
      (options.now ?? Date.now)(),
    );

    if (registrationResult.updatedExisting) {
      options.diagnostics.logInfo?.(
        'push-actions',
        `Updated push notification token for ${parsedRequest.registration.platform}`,
      );
    } else {
      options.diagnostics.logInfo?.(
        'push-actions',
        `Registered new push notification token for ${parsedRequest.registration.platform}`,
      );
    }

    options.tokenStore.savePushNotificationTokens(registrationResult.tokens);

    return pushActionOk(buildPushRegistrationResponse(
      registrationResult.tokens.length,
      registrationResult.updatedExisting,
    ));
  } catch (caughtError) {
    options.diagnostics.logError('push-actions', 'Failed to register push token', caughtError);
    return pushActionError(500, getUnknownErrorMessage(caughtError, 'Failed to register push token'));
  }
}

export function unregisterPushTokenAction(body: unknown, options: PushActionOptions): PushActionResult {
  try {
    const parsedRequest = parsePushTokenBody(body);
    if (parsedRequest.ok === false) {
      return pushActionError(parsedRequest.statusCode, parsedRequest.error);
    }

    const existingTokens = options.tokenStore.getPushNotificationTokens();
    const unregisterResult = removePushTokenRegistration(existingTokens, parsedRequest.token);

    if (unregisterResult.removed) {
      options.tokenStore.savePushNotificationTokens(unregisterResult.tokens);
      options.diagnostics.logInfo?.('push-actions', 'Unregistered push notification token');
    }

    return pushActionOk(buildPushUnregistrationResponse(
      unregisterResult.tokens.length,
      unregisterResult.removed,
    ));
  } catch (caughtError) {
    options.diagnostics.logError('push-actions', 'Failed to unregister push token', caughtError);
    return pushActionError(500, getUnknownErrorMessage(caughtError, 'Failed to unregister push token'));
  }
}

export function getPushStatusAction(options: PushActionOptions): PushActionResult {
  try {
    return pushActionOk(buildPushStatusResponse(options.tokenStore.getPushNotificationTokens()));
  } catch (caughtError) {
    options.diagnostics.logError('push-actions', 'Failed to get push status', caughtError);
    return pushActionError(500, getUnknownErrorMessage(caughtError, 'Failed to get push status'));
  }
}

export function clearPushBadgeAction(body: unknown, options: PushActionOptions): PushActionResult {
  try {
    const parsedRequest = parsePushTokenBody(body);
    if (parsedRequest.ok === false) {
      return pushActionError(parsedRequest.statusCode, parsedRequest.error);
    }

    options.badgeService?.clearBadgeCount(parsedRequest.token);

    return pushActionOk(buildPushBadgeClearResponse());
  } catch (caughtError) {
    options.diagnostics.logError('push-actions', 'Failed to clear badge count', caughtError);
    return pushActionError(500, getUnknownErrorMessage(caughtError, 'Failed to clear badge count'));
  }
}
