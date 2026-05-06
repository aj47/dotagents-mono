import { describe, expect, it } from 'vitest';
import {
  buildMessagePushNotificationPayload,
  buildPushBadgeClearResponse,
  buildPushNotificationDispatchPlan,
  buildPushRegistrationResponse,
  buildPushStatusResponse,
  buildPushUnregistrationResponse,
  clearPushBadgeAction,
  getPushStatusAction,
  parsePushTokenBody,
  parsePushTokenRegistrationBody,
  registerPushTokenAction,
  removePushTokenRegistration,
  summarizeExpoPushTickets,
  unregisterPushTokenAction,
  upsertPushTokenRegistration,
  type PushTokenRecord,
} from './push-notifications';

describe('push notification API helpers', () => {
  it('parses push token registration bodies', () => {
    expect(parsePushTokenRegistrationBody({
      token: 'ExponentPushToken[abc]',
      type: 'ignored',
      platform: 'ios',
      deviceId: 'device-1',
    })).toEqual({
      ok: true,
      registration: {
        token: 'ExponentPushToken[abc]',
        type: 'expo',
        platform: 'ios',
        deviceId: 'device-1',
      },
    });

    expect(parsePushTokenRegistrationBody({ platform: 'ios' })).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Missing or invalid token',
    });
    expect(parsePushTokenRegistrationBody({ token: 't', platform: 'web' })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Invalid platform. Must be 'ios' or 'android'",
    });
  });

  it('parses token-only request bodies', () => {
    expect(parsePushTokenBody({ token: 't' })).toEqual({ ok: true, token: 't' });
    expect(parsePushTokenBody({ token: '' })).toEqual({
      ok: false,
      statusCode: 400,
      error: 'Missing or invalid token',
    });
  });

  it('upserts and removes push token registrations', () => {
    const first = upsertPushTokenRegistration([], {
      token: 't1',
      type: 'expo',
      platform: 'ios',
    }, 100);
    expect(first).toEqual({
      tokens: [{ token: 't1', type: 'expo', platform: 'ios', registeredAt: 100 }],
      updatedExisting: false,
    });

    const updated = upsertPushTokenRegistration(first.tokens, {
      token: 't1',
      type: 'expo',
      platform: 'android',
      deviceId: 'device-2',
    }, 200);
    expect(updated).toEqual({
      tokens: [{ token: 't1', type: 'expo', platform: 'android', deviceId: 'device-2', registeredAt: 200 }],
      updatedExisting: true,
    });

    expect(removePushTokenRegistration(updated.tokens, 't1')).toEqual({
      tokens: [],
      removed: true,
    });
    expect(removePushTokenRegistration(updated.tokens, 'missing')).toEqual({
      tokens: updated.tokens,
      removed: false,
    });
  });

  it('builds registration, unregistration, and status responses', () => {
    expect(buildPushRegistrationResponse(2, false)).toEqual({
      success: true,
      message: 'Token registered',
      tokenCount: 2,
    });
    expect(buildPushRegistrationResponse(2, true)).toEqual({
      success: true,
      message: 'Token updated',
      tokenCount: 2,
    });
    expect(buildPushUnregistrationResponse(1, true)).toEqual({
      success: true,
      message: 'Token unregistered',
      tokenCount: 1,
    });
    expect(buildPushUnregistrationResponse(1, false)).toEqual({
      success: true,
      message: 'Token not found',
      tokenCount: 1,
    });
    expect(buildPushBadgeClearResponse()).toEqual({
      success: true,
    });
    expect(buildPushStatusResponse([
      { token: 't1', type: 'expo', platform: 'ios' },
      { token: 't2', type: 'expo', platform: 'ios' },
      { token: 't3', type: 'expo', platform: 'android' },
    ])).toEqual({
      enabled: true,
      tokenCount: 3,
      platforms: ['ios', 'android'],
    });
  });

  it('builds message push notification payloads with capped previews', () => {
    expect(buildMessagePushNotificationPayload({
      conversationId: 'conv-1',
      conversationTitle: 'Planning',
      messagePreview: 'Done',
    })).toEqual({
      title: 'DotAgents',
      body: 'Done',
      data: {
        type: 'message',
        conversationId: 'conv-1',
        conversationTitle: 'Planning',
      },
      sound: 'default',
      priority: 'high',
    });

    expect(buildMessagePushNotificationPayload({
      conversationId: 'conv-1',
      conversationTitle: 'Planning',
      messagePreview: 'x'.repeat(105),
    }).body).toBe(`${'x'.repeat(100)}...`);
  });

  it('builds Expo push dispatch plans with per-token badge increments', () => {
    expect(buildPushNotificationDispatchPlan([
      { token: 't1', badgeCount: 4, platform: 'ios' },
      { token: 't2', platform: 'android' },
    ], {
      title: 'DotAgents',
      body: 'Done',
      data: { conversationId: 'conv-1' },
      priority: 'normal',
    })).toEqual({
      updatedTokens: [
        { token: 't1', badgeCount: 5, platform: 'ios' },
        { token: 't2', badgeCount: 1, platform: 'android' },
      ],
      messages: [
        {
          to: 't1',
          title: 'DotAgents',
          body: 'Done',
          data: { conversationId: 'conv-1' },
          badge: 5,
          sound: 'default',
          channelId: 'default',
          priority: 'normal',
        },
        {
          to: 't2',
          title: 'DotAgents',
          body: 'Done',
          data: { conversationId: 'conv-1' },
          badge: 1,
          sound: 'default',
          channelId: 'default',
          priority: 'normal',
        },
      ],
    });
  });

  it('summarizes Expo push tickets and invalid device tokens', () => {
    expect(summarizeExpoPushTickets([
      { status: 'ok', id: 'ticket-1' },
      { status: 'error', message: 'Bad token', details: { error: 'DeviceNotRegistered' } },
      { status: 'error', details: { error: 'MessageTooBig' } },
      { status: 'error' },
    ], [
      { token: 't1' },
      { token: 't2' },
      { token: 't3' },
    ])).toEqual({
      sent: 1,
      failed: 3,
      errors: ['Bad token', 'MessageTooBig', 'Unknown error'],
      invalidTokens: ['t2'],
    });
  });

  it('runs push registration actions through shared token store adapters', () => {
    let tokens: PushTokenRecord[] = [];
    const logs: string[] = [];
    const options = {
      tokenStore: {
        getPushNotificationTokens: () => tokens,
        savePushNotificationTokens: (nextTokens: PushTokenRecord[]) => {
          tokens = nextTokens;
        },
      },
      diagnostics: {
        logError: (_source: string, message: string) => logs.push(message),
        logInfo: (_source: string, message: string) => logs.push(message),
      },
      now: () => 123,
    };

    expect(registerPushTokenAction({
      token: 't1',
      platform: 'ios',
      deviceId: 'device-1',
    }, options)).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Token registered',
        tokenCount: 1,
      },
    });
    expect(tokens).toEqual([{
      token: 't1',
      type: 'expo',
      platform: 'ios',
      deviceId: 'device-1',
      registeredAt: 123,
    }]);
    expect(registerPushTokenAction({ token: 't1', platform: 'android' }, options)).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Token updated',
        tokenCount: 1,
      },
    });
    expect(getPushStatusAction(options)).toEqual({
      statusCode: 200,
      body: {
        enabled: true,
        tokenCount: 1,
        platforms: ['android'],
      },
    });
    expect(unregisterPushTokenAction({ token: 't1' }, options)).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: 'Token unregistered',
        tokenCount: 0,
      },
    });
    expect(tokens).toEqual([]);
    expect(logs).toEqual([
      'Registered new push notification token for ios',
      'Updated push notification token for android',
      'Unregistered push notification token',
    ]);
  });

  it('runs push badge clearing and parse failures through shared adapters', () => {
    const clearedTokens: string[] = [];
    const options = {
      tokenStore: {
        getPushNotificationTokens: () => [],
        savePushNotificationTokens: () => undefined,
      },
      diagnostics: {
        logError: () => undefined,
      },
      badgeService: {
        clearBadgeCount: (token: string) => clearedTokens.push(token),
      },
    };

    expect(clearPushBadgeAction({ token: 't1' }, options)).toEqual({
      statusCode: 200,
      body: { success: true },
    });
    expect(clearedTokens).toEqual(['t1']);
    expect(registerPushTokenAction({ platform: 'ios' }, options)).toEqual({
      statusCode: 400,
      body: { error: 'Missing or invalid token' },
    });
  });
});
