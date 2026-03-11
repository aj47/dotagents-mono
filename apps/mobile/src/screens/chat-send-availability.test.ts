import { describe, expect, it } from 'vitest';

import {
  CHAT_SEND_BLOCKED_ACCESSIBILITY_HINT,
  CHAT_SEND_BLOCKED_HELPER_TEXT,
  CHAT_SEND_DEFAULT_ACCESSIBILITY_HINT,
  getChatSendAvailability,
  hasChatSendConnectionConfig,
} from './chat-send-availability';

describe('chat send availability', () => {
  it('treats blank or whitespace-only credentials as disconnected for sending', () => {
    expect(hasChatSendConnectionConfig({ baseUrl: ' https://api.example/v1 ', apiKey: ' sk-test ' })).toBe(true);
    expect(hasChatSendConnectionConfig({ baseUrl: 'https://api.example/v1', apiKey: '   ' })).toBe(false);
    expect(hasChatSendConnectionConfig({ baseUrl: '   ', apiKey: 'sk-test' })).toBe(false);
  });

  it('keeps the send action disabled and explanatory while disconnected', () => {
    expect(getChatSendAvailability({ hasConnectionConfig: false, composerHasContent: true })).toEqual({
      canSend: false,
      helperText: CHAT_SEND_BLOCKED_HELPER_TEXT,
      sendAccessibilityHint: CHAT_SEND_BLOCKED_ACCESSIBILITY_HINT,
    });
  });

  it('enables send only when both content and connection config are available', () => {
    expect(getChatSendAvailability({ hasConnectionConfig: true, composerHasContent: false })).toEqual({
      canSend: false,
      helperText: null,
      sendAccessibilityHint: CHAT_SEND_DEFAULT_ACCESSIBILITY_HINT,
    });

    expect(getChatSendAvailability({ hasConnectionConfig: true, composerHasContent: true })).toEqual({
      canSend: true,
      helperText: null,
      sendAccessibilityHint: CHAT_SEND_DEFAULT_ACCESSIBILITY_HINT,
    });
  });
});