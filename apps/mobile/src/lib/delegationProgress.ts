import type { ACPDelegationProgress, AgentProgressStep } from '@dotagents/shared';
import type { ChatMessage } from './openaiClient';

const formatStatus = (status: ACPDelegationProgress['status']): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'spawning':
      return 'Spawning';
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
};

const summarizeDelegation = (delegation: ACPDelegationProgress): string => {
  if (delegation.status === 'failed') {
    return delegation.error || delegation.progressMessage || delegation.task;
  }
  if (delegation.status === 'completed') {
    return delegation.resultSummary || delegation.progressMessage || delegation.task;
  }

  const conversationSnippet = delegation.conversation?.[delegation.conversation.length - 1]?.content;
  return delegation.progressMessage || conversationSnippet || delegation.task;
};

const TOOL_RESULT_PREFIX = /^tool result:\s*/i;

const getDelegationToolMetadata = (delegation: ACPDelegationProgress): Pick<ChatMessage, 'toolCalls' | 'toolResults'> => {
  const toolCalls: NonNullable<ChatMessage['toolCalls']> = [];
  const toolResults: NonNullable<ChatMessage['toolResults']> = [];

  for (const message of delegation.conversation ?? []) {
    if (message.role !== 'tool' || !message.toolName) {
      continue;
    }

    toolCalls.push({
      name: message.toolName,
      arguments: (message.toolInput && typeof message.toolInput === 'object')
        ? message.toolInput as Record<string, unknown>
        : {},
    });

    const normalizedContent = (message.content ?? '').replace(TOOL_RESULT_PREFIX, '').trim();
    if (normalizedContent.length > 0) {
      toolResults.push({
        success: true,
        content: normalizedContent,
      });
    }
  }

  return {
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
  };
};

export const createDelegationProgressMessages = (steps?: AgentProgressStep[]): ChatMessage[] => {
  if (!steps || steps.length === 0) {
    return [];
  }

  const latestDelegationsByRunId = new Map<string, { delegation: ACPDelegationProgress; timestamp: number }>();

  for (const step of steps) {
    if (!step.delegation?.runId) {
      continue;
    }

    const timestamp = step.timestamp || step.delegation.endTime || step.delegation.startTime || Date.now();
    const existing = latestDelegationsByRunId.get(step.delegation.runId);

    if (!existing || timestamp >= existing.timestamp) {
      latestDelegationsByRunId.set(step.delegation.runId, {
        delegation: step.delegation,
        timestamp,
      });
    }
  }

  return Array.from(latestDelegationsByRunId.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ delegation, timestamp }) => {
      const summary = summarizeDelegation(delegation);
      const hasConversation = (delegation.conversation?.length ?? 0) > 0;
      const fallbackContent = hasConversation
        ? `Delegated to ${delegation.agentName} · ${formatStatus(delegation.status)}`
        : `Delegated to ${delegation.agentName} · ${formatStatus(delegation.status)}\n${summary}`;

      return {
        id: `delegation-${delegation.runId}`,
        role: 'assistant' as const,
        variant: 'delegation' as const,
        timestamp,
        content: fallbackContent,
        ...getDelegationToolMetadata(delegation),
      };
    });
};
