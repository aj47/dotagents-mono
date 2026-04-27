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

const TOOL_USE_PREFIX = /^using tool:\s*/i;
const TOOL_RESULT_PREFIX = /^tool result:\s*/i;

type DelegationToolEntry = {
  toolCall: NonNullable<ChatMessage['toolCalls']>[number];
  result?: Exclude<NonNullable<ChatMessage['toolResults']>[number], undefined>;
  source: 'structured' | 'legacy';
};

const normalizeToolArguments = (input: unknown): Record<string, unknown> => {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  if (input === undefined) {
    return {};
  }
  return { input };
};

const parseToolUsePayload = (content?: string): { name?: string; input?: unknown } | null => {
  const trimmedContent = (content ?? '').trim();
  if (!TOOL_USE_PREFIX.test(trimmedContent)) {
    return null;
  }

  const nameMatch = trimmedContent.match(/^using tool:\s*([^\n]+)/i);
  const inputMatch = trimmedContent.match(/\ninput:\s*([\s\S]*)$/i);
  const rawInput = inputMatch?.[1]?.trim();

  let parsedInput: unknown = undefined;
  if (rawInput) {
    try {
      parsedInput = JSON.parse(rawInput);
    } catch {
      parsedInput = rawInput;
    }
  }

  return {
    name: nameMatch?.[1]?.trim() || undefined,
    input: parsedInput,
  };
};

const normalizeToolResultContent = (content?: string): string => {
  return (content ?? '').replace(TOOL_RESULT_PREFIX, '').trim();
};

const hasToolError = (result: { error?: string }): boolean => result.error !== undefined && result.error !== null;

const defaultToolResultContent = (result: { success?: boolean; content?: string; error?: string }): string => {
  if (typeof result.content === 'string') {
    return result.content;
  }
  if (result.success === false || hasToolError(result)) {
    return 'Tool failed';
  }
  return 'Tool completed';
};

const normalizeToolResult = (
  result: Partial<Exclude<NonNullable<ChatMessage['toolResults']>[number], undefined>>,
): Exclude<NonNullable<ChatMessage['toolResults']>[number], undefined> => ({
  success: !hasToolError(result) && result.success !== false,
  content: defaultToolResultContent(result),
  error: result.error,
});

const attachResultToEarliestPendingEntry = (
  entries: DelegationToolEntry[],
  result: Exclude<NonNullable<ChatMessage['toolResults']>[number], undefined>,
) => {
  for (let index = 0; index < entries.length; index += 1) {
    if (!entries[index].result) {
      entries[index].result = result;
      return true;
    }
  }

  return false;
};

const attachResultToLatestPendingLegacyEntry = (
  entries: DelegationToolEntry[],
  result: Exclude<NonNullable<ChatMessage['toolResults']>[number], undefined>,
) => {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry.source !== 'legacy' || entry.result) {
      continue;
    }
    entry.result = result;
    return true;
  }

  return attachResultToEarliestPendingEntry(entries, result);
};

const getDelegationToolMetadata = (delegation: ACPDelegationProgress): Pick<ChatMessage, 'toolCalls' | 'toolResults'> => {
  const entries: DelegationToolEntry[] = [];

  for (const message of delegation.conversation ?? []) {
    const structuredCalls = Array.isArray(message.toolCalls) ? message.toolCalls : [];
    const structuredResults = Array.isArray(message.toolResults) ? message.toolResults : [];
    if (structuredCalls.length > 0 || structuredResults.length > 0) {
      for (let index = 0; index < structuredCalls.length; index += 1) {
        const call = structuredCalls[index];
        const result = structuredResults[index];

        entries.push({
          toolCall: {
            name: call?.name?.trim() || 'tool_call',
            arguments: normalizeToolArguments(call?.arguments),
          },
          result: result
            ? normalizeToolResult(result)
            : undefined,
          source: 'structured',
        });
      }
      if (structuredResults.length > structuredCalls.length) {
        for (let index = structuredCalls.length; index < structuredResults.length; index += 1) {
          const result = structuredResults[index];
          if (!result) {
            continue;
          }
          const normalizedResult = normalizeToolResult(result);
          const attached = attachResultToEarliestPendingEntry(entries, normalizedResult);
          if (!attached) {
            entries.push({
              toolCall: {
                name: 'tool_call',
                arguments: {},
              },
              result: normalizedResult,
              source: 'structured',
            });
          }
        }
      }
      continue;
    }

    if (message.role !== 'tool') {
      continue;
    }

    const parsedToolUse = parseToolUsePayload(message.content);
    if (parsedToolUse) {
      entries.push({
        toolCall: {
          name: message.toolName || parsedToolUse.name || 'tool_call',
          arguments: normalizeToolArguments(message.toolInput ?? parsedToolUse.input),
        },
        source: 'legacy',
      });
      continue;
    }

    const normalizedMessageContent = (message.content ?? '').trim();
    if (TOOL_RESULT_PREFIX.test(normalizedMessageContent)) {
      const attached = attachResultToLatestPendingLegacyEntry(
        entries,
        normalizeToolResult({
          success: true,
          content: normalizeToolResultContent(message.content),
        }),
      );
      if (!attached) {
        entries.push({
          toolCall: {
            name: message.toolName || 'tool_call',
            arguments: normalizeToolArguments(message.toolInput),
          },
          result: normalizeToolResult({
            success: true,
            content: normalizeToolResultContent(message.content),
          }),
          source: 'legacy',
        });
      }
      continue;
    }

    if (message.toolName || message.toolInput !== undefined) {
      const normalizedContent = normalizeToolResultContent(message.content);
      entries.push({
        toolCall: {
          name: message.toolName || 'tool_call',
          arguments: normalizeToolArguments(message.toolInput),
        },
        result: normalizedContent
          ? normalizeToolResult({
              success: true,
              content: normalizedContent,
            })
          : undefined,
        source: 'legacy',
      });
      continue;
    }
  }

  const toolCalls: NonNullable<ChatMessage['toolCalls']> = entries.map((entry) => entry.toolCall);
  const alignedToolResults = entries.map((entry) => entry.result);
  // Preserve positional alignment with toolCalls so renderers using toolResults[index]
  // do not mis-associate later results when earlier calls are still pending.
  const toolResults = alignedToolResults.some((result) => !!result)
    ? alignedToolResults
    : undefined;

  return {
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    toolResults,
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
      const fallbackContent = `Delegated to ${delegation.agentName} · ${formatStatus(delegation.status)}${summary ? `\n${summary}` : ''}`;

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
