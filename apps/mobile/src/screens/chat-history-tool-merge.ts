import type { ConversationHistoryMessage } from '@dotagents/shared';

import type { ChatMessage } from '../lib/openaiClient';

const BRACKETED_TOOL_RESULT_REGEX = /^\[([^\]]+)\]\s*(ERROR:\s*)?([\s\S]*)$/i;
const LEGACY_TOOL_RESULT_REGEX = /^Tool:\s*(.+?)\s*\r?\nResult:\s*([\s\S]*)$/i;
const TOOL_FAILURE_HINT_REGEX = /\b(error|failed|failure|denied|timeout|timed out|exception|invalid|unauthorized|forbidden|unavailable|not found|stopped)\b/i;

function normalizeLegacyToolResultContent(rawContent: string, expectedToolName?: string): string {
  const trimmed = rawContent.trim();
  if (!trimmed) return '';

  const bracketedMatch = trimmed.match(BRACKETED_TOOL_RESULT_REGEX);
  if (bracketedMatch) {
    const [, toolName, , resultContent] = bracketedMatch;
    if (!expectedToolName || toolName === expectedToolName) {
      return resultContent.trim();
    }
  }

  const legacyMatch = trimmed.match(LEGACY_TOOL_RESULT_REGEX);
  if (legacyMatch) {
    const [, toolName, resultContent] = legacyMatch;
    if (!expectedToolName || toolName === expectedToolName) {
      return resultContent.trim();
    }
  }

  return trimmed;
}

function inferLegacyToolResultSuccess(rawContent: string, normalizedContent: string): boolean {
  const combined = `${rawContent}\n${normalizedContent}`;
  return !TOOL_FAILURE_HINT_REGEX.test(combined);
}

function findLegacyToolResultTargetIndex(
  message: ChatMessage,
  hiddenToolNames: ReadonlySet<string>,
): number {
  return findNextToolResultTargetIndex(
    message.toolCalls ?? [],
    message.toolResults ?? [],
    hiddenToolNames,
  );
}

function findNextToolResultTargetIndex(
  toolCalls: NonNullable<ChatMessage['toolCalls']>,
  toolResults: NonNullable<ChatMessage['toolResults']>,
  hiddenToolNames: ReadonlySet<string>,
): number {
  for (let i = 0; i < toolCalls.length; i += 1) {
    if (hiddenToolNames.has(toolCalls[i].name)) continue;
    if (toolResults[i] !== undefined) continue;
    return i;
  }

  for (let i = 0; i < toolCalls.length; i += 1) {
    if (toolResults[i] !== undefined) continue;
    return i;
  }

  return -1;
}

export function alignStructuredToolResults(
  toolCalls: NonNullable<ChatMessage['toolCalls']>,
  existingToolResults: NonNullable<ChatMessage['toolResults']>,
  structuredResults: ReadonlyArray<NonNullable<ConversationHistoryMessage['toolResults']>[number]>,
  hiddenToolNames: ReadonlySet<string> = new Set(),
): NonNullable<ChatMessage['toolResults']> {
  const nextResults = [...existingToolResults];

  for (const structuredResult of structuredResults) {
    const targetIndex = findNextToolResultTargetIndex(
      toolCalls,
      nextResults,
      hiddenToolNames,
    );

    if (targetIndex < 0) {
      nextResults.push(structuredResult);
      continue;
    }

    nextResults[targetIndex] = structuredResult;
  }

  return nextResults as NonNullable<ChatMessage['toolResults']>;
}

export function mergeToolHistoryMessageIntoPreviousAssistant(
  messages: ChatMessage[],
  toolMessage: Pick<ConversationHistoryMessage, 'content' | 'toolResults'>,
  hiddenToolNames: ReadonlySet<string> = new Set(),
): boolean {
  if (messages.length === 0) return false;

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'assistant' || !lastMessage.toolCalls?.length) {
    return false;
  }

  const structuredResults = toolMessage.toolResults;
  if (structuredResults && structuredResults.length > 0) {
    const nextResults = alignStructuredToolResults(
      lastMessage.toolCalls ?? [],
      lastMessage.toolResults ?? [],
      structuredResults,
      hiddenToolNames,
    );
    lastMessage.toolResults = nextResults as typeof lastMessage.toolResults;
    return true;
  }

  const trimmedContent = toolMessage.content?.trim();
  if (!trimmedContent) {
    return false;
  }

  const targetIndex = findLegacyToolResultTargetIndex(lastMessage, hiddenToolNames);
  if (targetIndex < 0) {
    return false;
  }

  const expectedToolName = lastMessage.toolCalls[targetIndex]?.name;
  const normalizedContent = normalizeLegacyToolResultContent(trimmedContent, expectedToolName);
  const success = inferLegacyToolResultSuccess(trimmedContent, normalizedContent);
  const nextResults = [...(lastMessage.toolResults || [])];
  nextResults[targetIndex] = {
    success,
    content: normalizedContent || trimmedContent,
    error: success ? undefined : (normalizedContent || trimmedContent),
  };
  lastMessage.toolResults = nextResults as typeof lastMessage.toolResults;
  return true;
}
