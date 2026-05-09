import type { ACPSubAgentMessage } from '../../shared/types';

type PersistedSeedMessage = {
  role: string;
  content?: string;
};

type QueueTargetSubSession = {
  id: string;
  conversationId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
};

export type QueuedSubSessionTargetResolution =
  | { status: 'ready'; subSessionId: string }
  | { status: 'wait'; subSessionId: string }
  | { status: 'failed'; error: string };

function normalizeSeedMessageContent(content?: string): string {
  return (content ?? '').replace(/\s+/g, ' ').trim();
}

function stripPersistedToolPrefix(content: string): string {
  return content.replace(/^\[[^\]]+\]\s*(?:ERROR:\s*)?/, '');
}

function isMatchingSeedMessage(
  seedMessage: ACPSubAgentMessage,
  persistedMessage: PersistedSeedMessage,
): boolean {
  if (persistedMessage.role !== seedMessage.role) {
    return false;
  }

  const seedContent = normalizeSeedMessageContent(seedMessage.content);
  const persistedContent = normalizeSeedMessageContent(persistedMessage.content);
  if (seedContent === persistedContent) {
    return true;
  }

  if (seedMessage.role !== 'tool' || !seedContent || !persistedContent) {
    return false;
  }

  const persistedToolContent = normalizeSeedMessageContent(stripPersistedToolPrefix(persistedMessage.content ?? ''));
  if (persistedToolContent === seedContent || persistedToolContent.includes(seedContent)) {
    return true;
  }

  return !!seedMessage.toolName && persistedContent.startsWith(`[${seedMessage.toolName}] `);
}

export function countPersistedSeedMessages(
  seedHistory: ACPSubAgentMessage[],
  persistedMessages: PersistedSeedMessage[],
): number {
  let seedIndex = 0;
  for (const persistedMessage of persistedMessages) {
    const seedMessage = seedHistory[seedIndex];
    if (!seedMessage) {
      break;
    }

    if (seedMessage.role === 'tool' && persistedMessage.role === 'tool') {
      let matchedToolCount = 0;
      while (
        seedHistory[seedIndex]?.role === 'tool' &&
        isMatchingSeedMessage(seedHistory[seedIndex], persistedMessage)
      ) {
        seedIndex += 1;
        matchedToolCount += 1;
      }
      if (matchedToolCount > 0) {
        continue;
      }
    }

    if (isMatchingSeedMessage(seedMessage, persistedMessage)) {
      seedIndex += 1;
    }
  }
  return seedIndex;
}

export function resolveQueuedSubSessionTarget(
  currentSubSessionId: string,
  conversationId: string,
  queuedSessionId: string | undefined,
  getSubSession: (subSessionId: string) => QueueTargetSubSession | undefined,
): QueuedSubSessionTargetResolution {
  const targetSubSessionId = queuedSessionId?.startsWith('subsession_')
    ? queuedSessionId
    : currentSubSessionId;

  if (targetSubSessionId === currentSubSessionId) {
    return { status: 'ready', subSessionId: targetSubSessionId };
  }

  const targetSubSession = getSubSession(targetSubSessionId);
  if (!targetSubSession) {
    return {
      status: 'failed',
      error: `Queued sub-session target no longer exists: ${targetSubSessionId}`,
    };
  }

  if (targetSubSession.conversationId !== conversationId) {
    return {
      status: 'failed',
      error: `Queued message target ${targetSubSessionId} belongs to conversation ${targetSubSession.conversationId ?? 'unknown'}, not ${conversationId}`,
    };
  }

  if (targetSubSession.status === 'running' || targetSubSession.status === 'pending') {
    return { status: 'wait', subSessionId: targetSubSessionId };
  }

  return { status: 'ready', subSessionId: targetSubSessionId };
}
