import type { ACPDelegationProgress, AgentProgressStep } from '@dotagents/shared';
import type { ChatMessage } from '../lib/openaiClient';

function getDelegationSortTimestamp(step: AgentProgressStep): number {
  if (typeof step.timestamp === 'number' && Number.isFinite(step.timestamp)) {
    return step.timestamp;
  }

  const delegation = step.delegation;
  if (!delegation) return 0;
  return delegation.endTime ?? delegation.startTime ?? 0;
}

export function formatDelegationStatus(status: ACPDelegationProgress['status']): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'spawning':
      return 'Starting';
    case 'running':
      return 'Running';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function buildDelegationMessageContent(delegation: ACPDelegationProgress): string {
  const lines = [`Delegated to **${delegation.agentName}**`, `Status: ${formatDelegationStatus(delegation.status)}`];

  const task = delegation.task?.trim();
  if (task) {
    lines.push(`Task: ${task}`);
  }

  const detail =
    delegation.error?.trim() ||
    delegation.resultSummary?.trim() ||
    delegation.progressMessage?.trim();

  if (detail) {
    lines.push(detail);
  }

  return lines.join('\n');
}

export function extractDelegationMessages(steps: AgentProgressStep[] | undefined): ChatMessage[] {
  if (!steps?.length) {
    return [];
  }

  const latestByRunId = new Map<string, { delegation: ACPDelegationProgress; timestamp: number }>();

  for (const step of steps) {
    if (!step.delegation?.runId) continue;

    const timestamp = getDelegationSortTimestamp(step);
    const existing = latestByRunId.get(step.delegation.runId);
    if (!existing || timestamp >= existing.timestamp) {
      latestByRunId.set(step.delegation.runId, {
        delegation: step.delegation,
        timestamp,
      });
    }
  }

  return [...latestByRunId.values()]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ delegation, timestamp }) => ({
      role: 'assistant',
      kind: 'delegation',
      content: buildDelegationMessageContent(delegation),
      timestamp,
      delegationRunId: delegation.runId,
      delegationStatus: delegation.status,
    }));
}

function splitDelegationMessages(messages: ChatMessage[]): {
  delegationMessages: ChatMessage[];
  otherMessages: ChatMessage[];
} {
  const delegationMessages: ChatMessage[] = [];
  const otherMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (message.kind === 'delegation') {
      delegationMessages.push(message);
    } else {
      otherMessages.push(message);
    }
  }

  return { delegationMessages, otherMessages };
}

function replaceLastAssistantMessage(messages: ChatMessage[], replacement: ChatMessage): ChatMessage[] {
  const next = [...messages];
  for (let i = next.length - 1; i >= 0; i -= 1) {
    if (next[i].role === 'assistant') {
      next[i] = replacement;
      return next;
    }
  }
  return [...next, replacement];
}

export function findLastUpdatableAssistantMessageIndex(messages: ChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'assistant' && messages[i].kind !== 'delegation') {
      return i;
    }
  }

  return -1;
}

export function mergeProgressMessagesWithFinalTurn(
  progressMessages: ChatMessage[],
  finalTurnMessages: ChatMessage[]
): ChatMessage[] {
  const { delegationMessages } = splitDelegationMessages(progressMessages);
  const { otherMessages: progressNonDelegation } = splitDelegationMessages(progressMessages);
  const { otherMessages: finalNonDelegation } = splitDelegationMessages(finalTurnMessages);

  let mergedNonDelegation: ChatMessage[];
  if (progressNonDelegation.length > 0 && finalNonDelegation.length === 0) {
    mergedNonDelegation = progressNonDelegation;
  } else if (progressNonDelegation.length > finalNonDelegation.length && finalNonDelegation.length > 0) {
    mergedNonDelegation = replaceLastAssistantMessage(
      progressNonDelegation,
      finalNonDelegation[finalNonDelegation.length - 1]
    );
  } else {
    mergedNonDelegation = finalNonDelegation;
  }

  return [...delegationMessages, ...mergedNonDelegation];
}
