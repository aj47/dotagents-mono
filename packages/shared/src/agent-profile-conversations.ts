export type AgentProfileConversationMap<TMessage> = Record<string, TMessage[]>

export type AgentProfileConversationIdLike = {
  conversationId?: string
}

export function getAgentProfileConversation<TMessage>(
  conversations: AgentProfileConversationMap<TMessage>,
  profileId: string,
): TMessage[] {
  return conversations[profileId] ?? []
}

export function setAgentProfileConversation<TMessage>(
  conversations: AgentProfileConversationMap<TMessage>,
  profileId: string,
  messages: TMessage[],
): AgentProfileConversationMap<TMessage> {
  return {
    ...conversations,
    [profileId]: messages,
  }
}

export function addAgentProfileConversationMessage<TMessage>(
  conversations: AgentProfileConversationMap<TMessage>,
  profileId: string,
  message: TMessage,
): AgentProfileConversationMap<TMessage> {
  return {
    ...conversations,
    [profileId]: [...(conversations[profileId] ?? []), message],
  }
}

export function removeAgentProfileConversation<TMessage>(
  conversations: AgentProfileConversationMap<TMessage>,
  profileId: string,
): AgentProfileConversationMap<TMessage> {
  const { [profileId]: _removedConversation, ...remainingConversations } = conversations
  return remainingConversations
}

export function clearAgentProfileConversationId<TProfile extends AgentProfileConversationIdLike>(
  profile: TProfile,
): TProfile {
  return {
    ...profile,
    conversationId: undefined,
  }
}
