export const CHAT_SEND_DEFAULT_ACCESSIBILITY_HINT = 'Sends your typed text and any attached images to the selected agent.';
export const CHAT_SEND_BLOCKED_ACCESSIBILITY_HINT = 'Connect your server in Settings before sending messages. Saved chats stay viewable while disconnected.';
export const CHAT_SEND_BLOCKED_HELPER_TEXT = 'Saved chats stay viewable while disconnected. Connect in Settings before sending a new message.';
export const CHAT_SEND_BLOCKED_DEBUG_MESSAGE = 'Connect your server in Settings before sending new messages.';
export const CHAT_SEND_BLOCKED_PLACEHOLDER = 'Connect in Settings before sending a new message';

export function hasChatSendConnectionConfig(config: {
  baseUrl?: string | null;
  apiKey?: string | null;
}) {
  return Boolean(config.baseUrl?.trim() && config.apiKey?.trim());
}

export function getChatSendAvailability({
  hasConnectionConfig,
  composerHasContent,
}: {
  hasConnectionConfig: boolean;
  composerHasContent: boolean;
}) {
  return {
    canSend: hasConnectionConfig && composerHasContent,
    helperText: hasConnectionConfig ? null : CHAT_SEND_BLOCKED_HELPER_TEXT,
    sendAccessibilityHint: hasConnectionConfig
      ? CHAT_SEND_DEFAULT_ACCESSIBILITY_HINT
      : CHAT_SEND_BLOCKED_ACCESSIBILITY_HINT,
  };
}