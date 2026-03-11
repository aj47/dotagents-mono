import { describe, expect, it } from 'vitest';

import {
  DESKTOP_STUB_LOAD_ERROR_MESSAGE,
  shouldAllowManualChatSessionCreation,
  shouldAutoCreateChatSession,
  shouldAttemptStubSessionLoad,
} from './chat-session-hydration';

describe('shouldAutoCreateChatSession', () => {
  it('does not auto-create a session for disconnected direct /chat visits', () => {
    expect(
      shouldAutoCreateChatSession({
        canComposeChat: false,
        currentSessionId: null,
        deletingSessionCount: 0,
      }),
    ).toBe(false);
  });

  it('auto-creates a session for configured direct /chat visits with no current session', () => {
    expect(
      shouldAutoCreateChatSession({
        canComposeChat: true,
        currentSessionId: null,
        deletingSessionCount: 0,
      }),
    ).toBe(true);
  });

  it('does not auto-create a session while a deletion is still in progress', () => {
    expect(
      shouldAutoCreateChatSession({
        canComposeChat: true,
        currentSessionId: null,
        deletingSessionCount: 1,
      }),
    ).toBe(false);
  });
});

describe('shouldAllowManualChatSessionCreation', () => {
  it('blocks the chat header new-chat action until connection settings are configured', () => {
    expect(
      shouldAllowManualChatSessionCreation({
        canComposeChat: false,
      }),
    ).toBe(false);
  });

  it('allows the chat header new-chat action once chat is configured', () => {
    expect(
      shouldAllowManualChatSessionCreation({
        canComposeChat: true,
      }),
    ).toBe(true);
  });
});

describe('shouldAttemptStubSessionLoad', () => {
  it('allows a desktop-backed stub session to lazy-load when auth is configured', () => {
    expect(
      shouldAttemptStubSessionLoad({
        hasServerAuth: true,
        failedSessionId: null,
        hydratedEmptySessionId: null,
        currentSession: {
          id: 'session-1',
          messages: [],
          serverConversationId: 'server-1',
        },
      }),
    ).toBe(true);
  });

  it('stops auto-retrying a stub session that already failed to load', () => {
    expect(
      shouldAttemptStubSessionLoad({
        hasServerAuth: true,
        failedSessionId: 'session-1',
        hydratedEmptySessionId: null,
        currentSession: {
          id: 'session-1',
          messages: [],
          serverConversationId: 'server-1',
        },
      }),
    ).toBe(false);
  });

  it('does not lazy-load when the session already has local messages', () => {
    expect(
      shouldAttemptStubSessionLoad({
        hasServerAuth: true,
        failedSessionId: null,
        hydratedEmptySessionId: null,
        currentSession: {
          id: 'session-1',
          messages: [{ role: 'assistant', content: 'hello' }],
          serverConversationId: 'server-1',
        },
      }),
    ).toBe(false);
  });

  it('does not lazy-load once the desktop stub metadata has already been cleared after a successful hydration', () => {
    expect(
      shouldAttemptStubSessionLoad({
        hasServerAuth: true,
        failedSessionId: null,
        hydratedEmptySessionId: 'session-1',
        currentSession: {
          id: 'session-1',
          messages: [],
          serverConversationId: 'server-1',
        },
      }),
    ).toBe(false);
  });
});

describe('DESKTOP_STUB_LOAD_ERROR_MESSAGE', () => {
  it('guides the user toward connection settings and a manual retry after a desktop stub load failure', () => {
    expect(DESKTOP_STUB_LOAD_ERROR_MESSAGE).toContain('connection settings');
    expect(DESKTOP_STUB_LOAD_ERROR_MESSAGE).toContain('retry');
  });
});