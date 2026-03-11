import { describe, expect, it } from 'vitest';

import { shouldAutoCreateChatSession } from './chat-session-hydration';

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