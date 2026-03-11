export function shouldAutoCreateChatSession(options: {
  canComposeChat: boolean;
  currentSessionId: string | null;
  deletingSessionCount: number;
}): boolean {
  const { canComposeChat, currentSessionId, deletingSessionCount } = options;

  return canComposeChat && currentSessionId === null && deletingSessionCount === 0;
}

export function shouldAllowManualChatSessionCreation(options: {
  canComposeChat: boolean;
}): boolean {
  return options.canComposeChat;
}

export const DESKTOP_STUB_LOAD_ERROR_MESSAGE = 'Couldn’t load messages from desktop. Check your connection settings and retry.';

export function shouldAttemptStubSessionLoad(options: {
  hasServerAuth: boolean;
  failedSessionId: string | null;
  hydratedEmptySessionId: string | null;
  currentSession:
    | {
        id: string;
        messages: Array<unknown>;
        serverConversationId?: string;
      }
    | null;
}): boolean {
  const { currentSession, failedSessionId, hasServerAuth, hydratedEmptySessionId } = options;

  return Boolean(
    currentSession &&
      currentSession.messages.length === 0 &&
      currentSession.serverConversationId &&
      hasServerAuth &&
      failedSessionId !== currentSession.id &&
      hydratedEmptySessionId !== currentSession.id,
  );
}