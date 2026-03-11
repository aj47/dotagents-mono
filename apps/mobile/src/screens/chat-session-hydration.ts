export function shouldAutoCreateChatSession(options: {
  canComposeChat: boolean;
  currentSessionId: string | null;
  deletingSessionCount: number;
}): boolean {
  const { canComposeChat, currentSessionId, deletingSessionCount } = options;

  return canComposeChat && currentSessionId === null && deletingSessionCount === 0;
}