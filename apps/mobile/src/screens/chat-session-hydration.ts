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