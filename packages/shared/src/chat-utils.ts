/**
 * Shared chat utilities for DotAgents apps (desktop and mobile)
 * 
 * These utilities provide consistent behavior for chat UI features
 * across both platforms while allowing platform-specific rendering.
 */

import type { AgentUserResponseEvent } from './agent-progress';
import { ToolCall, ToolResult } from './types';

export type ToolArgumentEntry = {
  key: string;
  value: unknown;
};

const COLLAPSE_THRESHOLD = 200;
const MARKDOWN_IMAGE_PAYLOAD_REGEX = /!\[[^\]]*\]\((?:data:image\/|https?:\/\/|assets:\/\/conversation-image\/)[^)]*\)/gi;

/**
 * Determine if a message should be collapsible based on its content
 * @param content The message content
 * @param toolCalls Optional array of tool calls
 * @param toolResults Optional array of tool results
 * @returns True if the message should be collapsible
 */
export function shouldCollapseMessage(
  content: string | undefined,
  toolCalls?: ToolCall[],
  toolResults?: ToolResult[]
): boolean {
  const hasExtras = (toolCalls?.length ?? 0) > 0 || (toolResults?.length ?? 0) > 0;
  const contentLength = content?.replace(MARKDOWN_IMAGE_PAYLOAD_REGEX, '').length ?? 0;
  return contentLength > COLLAPSE_THRESHOLD || hasExtras;
}

/**
 * Generate a summary of tool calls for collapsed view
 * @param toolCalls Array of tool calls
 * @returns A formatted string showing only tool names
 */
export function getToolCallsSummary(toolCalls: ToolCall[]): string {
  if (!toolCalls || toolCalls.length === 0) return '';
  return `🔧 ${toolCalls.map(tc => getToolCallPreview(tc)).join(', ')}`;
}

/**
 * Generate a compact single-token label for a collapsed tool call.
 * Details belong in expanded tool views, not collapsed rows.
 */
export function getToolCallPreview(toolCall: ToolCall): string {
  return toolCall.name?.trim() || 'tool';
}

/**
 * Generate a summary of tool results for collapsed view
 * @param toolResults Array of tool results
 * @returns A formatted string showing result status and key information
 */
export function getToolResultsSummary(toolResults: ToolResult[]): string {
  if (!toolResults || toolResults.length === 0) return '';
  const allSuccess = toolResults.every(r => r.success);
  const icon = allSuccess ? '✅' : '⚠️';
  const count = toolResults.length;

  if (count === 1) {
    const preview = generateToolResultPreview(toolResults[0]);
    if (preview) {
      return `${icon} ${preview}`;
    }
  }

  const previews = toolResults
    .map(r => generateToolResultPreview(r))
    .filter(Boolean)
    .slice(0, 2);

  if (previews.length > 0) {
    const suffix = count > previews.length ? ` (+${count - previews.length} more)` : '';
    return `${icon} ${previews.join(', ')}${suffix}`;
  }

  return `${icon} ${count} result${count > 1 ? 's' : ''}`;
}

/**
 * Generate a preview string for a single tool result.
 * @param result Tool result to preview
 * @returns A short preview string or empty string if no meaningful preview
 */
function generateToolResultPreview(result: ToolResult): string {
  if (!result) return '';

  if (!result.success) {
    const errorText = result.error || result.content || 'Error';
    return truncatePreview(errorText, 40);
  }

  const content = result.content || '';
  if (!content) return '';

  try {
    const parsed = JSON.parse(content);
    return extractJsonPreview(parsed);
  } catch {
    return extractTextPreview(content);
  }
}

/**
 * Extract a preview from a parsed JSON object
 */
function extractJsonPreview(data: unknown): string {
  if (data === null || data === undefined) return '';

  if (Array.isArray(data)) {
    const len = data.length;
    if (len === 0) return 'empty list';

    const firstItem = data[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      const item = firstItem as Record<string, unknown>;
      const getString = (value: unknown): string | null => {
        return typeof value === 'string' ? value : null;
      };
      const name = getString(item.name) || getString(item.title) || getString(item.path) || getString(item.filename);
      if (name) {
        return len === 1 ? truncatePreview(name, 30) : `${len} items: ${truncatePreview(name, 20)}...`;
      }
    }
    return `${len} item${len > 1 ? 's' : ''}`;
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    if ('success' in obj && typeof obj.success === 'boolean') {
      if ('message' in obj && typeof obj.message === 'string') {
        return truncatePreview(obj.message, 50);
      }
      if ('result' in obj) {
        return extractJsonPreview(obj.result);
      }
    }

    if ('path' in obj || 'file' in obj || 'filename' in obj) {
      const path = obj.path || obj.file || obj.filename;
      return truncatePreview(String(path), 40);
    }

    if ('content' in obj && typeof obj.content === 'string') {
      return truncatePreview(obj.content, 50);
    }

    if ('data' in obj) {
      return extractJsonPreview(obj.data);
    }

    if ('count' in obj && typeof obj.count === 'number') {
      return `${obj.count} item${obj.count !== 1 ? 's' : ''}`;
    }

    if ('items' in obj && Array.isArray(obj.items)) {
      return extractJsonPreview(obj.items);
    }
    if ('results' in obj && Array.isArray(obj.results)) {
      return extractJsonPreview(obj.results);
    }

    const keys = Object.keys(obj);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstValue = obj[firstKey];
      if (typeof firstValue === 'string' || typeof firstValue === 'number' || typeof firstValue === 'boolean') {
        return `${firstKey}: ${truncatePreview(String(firstValue), 30)}`;
      }
      return `${keys.length} field${keys.length > 1 ? 's' : ''}`;
    }
  }

  if (typeof data === 'string') {
    return truncatePreview(data, 50);
  }
  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  return '';
}

/**
 * Extract a preview from plain text content
 */
function extractTextPreview(content: string): string {
  if (!content) return '';

  const cleaned = content.trim();

  if (cleaned.length <= 50) {
    return cleaned.replace(/\n/g, ' ').trim();
  }

  const lines = cleaned.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    const cleanedLine = firstLine.replace(/^(successfully|done|completed|created|updated|deleted|read|wrote|found|error:?)\s*/i, '');
    return truncatePreview(cleanedLine || firstLine, 50);
  }

  return truncatePreview(cleaned, 50);
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
function truncatePreview(text: string, maxLength: number): string {
  if (!text) return '';
  const cleaned = text.replace(/\n/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 3) + '...';
}

// ============================================================================
// Tool Argument Formatting
// ============================================================================

/**
 * Format tool arguments as pretty-printed JSON
 * @param args Tool call arguments object
 * @returns Formatted JSON string with 2-space indentation
 */
export function formatToolArguments(args: unknown): string {
  if (args === null || args === undefined) return '';
  const normalizedArgs = parseJsonStringIfPossible(args);
  try {
    if (typeof normalizedArgs === 'string') return normalizedArgs;
    return JSON.stringify(normalizedArgs, null, 2);
  } catch {
    return String(args);
  }
}

function parseJsonStringIfPossible(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeArgumentsRecord(args: unknown): Record<string, unknown> {
  return normalizeToolArguments(args) ?? {};
}

/**
 * Normalize tool arguments into an object suitable for field-by-field rendering.
 * Accepts either an object or a JSON string containing an object.
 */
export function normalizeToolArguments(args: unknown): Record<string, unknown> | null {
  const normalizedArgs = parseJsonStringIfPossible(args);
  if (!normalizedArgs || typeof normalizedArgs !== 'object' || Array.isArray(normalizedArgs)) {
    return null;
  }
  return normalizedArgs as Record<string, unknown>;
}

/**
 * Return normalized tool argument entries in insertion order for UI renderers.
 */
export function getToolArgumentEntries(args: unknown): ToolArgumentEntry[] {
  const normalizedArgs = normalizeToolArguments(args);
  return normalizedArgs ? Object.entries(normalizedArgs).map(([key, value]) => ({ key, value })) : [];
}

/**
 * Format tool arguments as a compact preview for collapsed view.
 * Shows key parameter names and truncated values.
 * @param args Tool call arguments object
 * @returns A compact preview string like "path: /foo/bar, content: Hello..."
 */
export function formatArgumentsPreview(args: unknown): string {
  const normalizedArgs = normalizeToolArguments(args);
  if (!normalizedArgs) return '';
  const entries = Object.entries(normalizedArgs);
  if (entries.length === 0) return '';

  const preview = entries.slice(0, 3).map(([key, value]) => {
    let displayValue: string;
    if (typeof value === 'string') {
      displayValue = value.length > 30 ? value.slice(0, 30) + '...' : value;
    } else if (typeof value === 'object') {
      displayValue = value === null ? 'null' : Array.isArray(value) ? `[${value.length} items]` : '{...}';
    } else {
      displayValue = String(value);
    }
    return `${key}: ${displayValue}`;
  }).join(', ');

  if (entries.length > 3) {
    return preview + ` (+${entries.length - 3} more)`;
  }
  return preview;
}

// ============================================================================
// respond_to_user Content Extraction
// ============================================================================

/** The tool name used to explicitly respond to the user */
export const RESPOND_TO_USER_TOOL = 'respond_to_user';
export const MARK_WORK_COMPLETE_TOOL = 'mark_work_complete';

function isCompletionControlTool(name: string | undefined): boolean {
  return name === RESPOND_TO_USER_TOOL || name === MARK_WORK_COMPLETE_TOOL;
}

/**
 * Extract text content from respond_to_user tool call arguments
 * @param args Tool call arguments
 * @returns Extracted text content or null if not valid
 */
export function extractRespondToUserContentFromArgs(args: unknown): string | null {
  if (!args || typeof args !== 'object') return null;

  const parsedArgs = args as Record<string, unknown>;
  const text = typeof parsedArgs.text === 'string' ? parsedArgs.text.trim() : '';
  const images = Array.isArray(parsedArgs.images) ? parsedArgs.images : [];
  const sanitizeImageAltText = (alt: string) => alt.replace(/[\[\]\(\)`\\]/g, '').trim();

  const imagesMd = images
    .map((img, index) => {
      if (!img || typeof img !== 'object') return '';

      const image = img as Record<string, unknown>;
      const alt = typeof image.alt === 'string' && image.alt.trim().length > 0
        ? image.alt.trim()
        : typeof image.altText === 'string' && image.altText.trim().length > 0
          ? image.altText.trim()
          : `Image ${index + 1}`;
      const safeAlt = sanitizeImageAltText(alt) || `Image ${index + 1}`;

      const url = typeof image.url === 'string' ? image.url.trim() : '';
      const dataUrl = typeof image.dataUrl === 'string' ? image.dataUrl.trim() : '';
      const mimeType = typeof image.mimeType === 'string' ? image.mimeType.trim() : '';
      const data = typeof image.data === 'string' ? image.data.trim() : '';
      const legacyDataUrl = mimeType && data ? `data:${mimeType};base64,${data}` : '';
      const uri = url || dataUrl || legacyDataUrl;

      if (uri) return `![${safeAlt}](${uri})`;
      return '';
    })
    .filter(Boolean)
    .join('\n\n');

  const combined = [text, imagesMd].filter(Boolean).join('\n\n').trim();
  return combined || null;
}

/**
 * Resolve a monotonic timestamp for each message, filling missing or invalid
 * timestamps relative to neighboring messages when possible.
 */
export function resolveMessageTimestamps(
  messages: Array<{
    timestamp?: number;
  }>,
): number[] {
  const resolved: Array<number | null> = messages.map((message) => (
    typeof message.timestamp === 'number' && Number.isFinite(message.timestamp)
      ? message.timestamp
      : null
  ));

  for (let index = 1; index < resolved.length; index += 1) {
    if (resolved[index] === null && resolved[index - 1] !== null) {
      resolved[index] = (resolved[index - 1] as number) + 1;
    }
  }

  for (let index = resolved.length - 2; index >= 0; index -= 1) {
    if (resolved[index] === null && resolved[index + 1] !== null) {
      resolved[index] = (resolved[index + 1] as number) - 1;
    }
  }

  for (let index = 0; index < resolved.length; index += 1) {
    if (resolved[index] === null) {
      resolved[index] = index;
    }
  }

  return resolved as number[];
}

/**
 * Extract ordered respond_to_user events from saved chat messages.
 * This preserves duplicates and order from the saved assistant tool calls.
 */
export function extractRespondToUserResponseEvents(
  messages: Array<{
    role: 'user' | 'assistant' | 'tool';
    timestamp?: number;
    toolCalls?: Array<{ name: string; arguments: unknown }>;
  }>,
  options?: {
    sessionId?: string;
    runId?: number;
    idPrefix?: string;
  },
): AgentUserResponseEvent[] {
  const events: AgentUserResponseEvent[] = [];
  const idPrefix = options?.idPrefix ?? 'history';
  const resolvedTimestamps = resolveMessageTimestamps(messages);

  for (let messageIndex = 0; messageIndex < messages.length; messageIndex += 1) {
    const message = messages[messageIndex];
    if (message.role !== 'assistant' || !message.toolCalls?.length) continue;

    for (let toolCallIndex = 0; toolCallIndex < message.toolCalls.length; toolCallIndex += 1) {
      const call = message.toolCalls[toolCallIndex];
      if (call.name !== RESPOND_TO_USER_TOOL) continue;
      const content = extractRespondToUserContentFromArgs(call.arguments);
      if (!content) continue;

      events.push({
        id: `${idPrefix}-${messageIndex}-${toolCallIndex}-${events.length + 1}`,
        sessionId: options?.sessionId ?? 'history',
        runId: options?.runId,
        ordinal: events.length + 1,
        text: content,
        timestamp: resolvedTimestamps[messageIndex],
      });
    }
  }

  return events;
}

/**
 * Check if a message is purely a tool call message (no user-facing content).
 * Used to determine if a message should be collapsed by default.
 * @param message A chat message object
 * @returns True if the message is only tool calls with no real content
 */
export function isToolOnlyMessage(message: {
  content?: string;
  toolCalls?: Array<{ name: string }>;
  toolResults?: Array<unknown>;
}): boolean {
  const hasToolCalls = (message.toolCalls?.length ?? 0) > 0;
  const hasToolResults = (message.toolResults?.length ?? 0) > 0;
  const hasContent = !!(message.content && message.content.trim().length > 0);

  // A message is "tool-only" if it has tool calls but no meaningful content
  // or only placeholder content like "Executing tools..."
  if (!hasToolCalls && !hasToolResults) return false;
  if (!hasContent) return true;

  const trimmedContent = message.content?.trim().toLowerCase() || '';
  const placeholderPhrases = [
    'executing tools...',
    'executing tools',
    'running tools...',
    'running tools',
  ];
  return placeholderPhrases.includes(trimmedContent);
}

export function isInternalCompletionControlMessage(message: {
  role: 'user' | 'assistant' | 'tool';
  content?: string;
  toolCalls?: Array<{ name: string }>;
  toolResults?: Array<unknown>;
}): boolean {
  if (message.role === 'assistant' && (message.toolCalls?.length ?? 0) > 0) {
    const onlyCompletionControlTools = message.toolCalls!.every((call) => isCompletionControlTool(call.name));
    if (onlyCompletionControlTools && isToolOnlyMessage(message)) {
      return true;
    }
  }

  if (message.role === 'tool') {
    const normalized = message.content?.trim().toLowerCase() || '';
    if (normalized.startsWith(`[${RESPOND_TO_USER_TOOL}]`) || normalized.startsWith(`[${MARK_WORK_COMPLETE_TOOL}]`)) {
      return true;
    }
  }

  return false;
}

export function filterVisibleChatMessages<
  T extends {
    role: 'user' | 'assistant' | 'tool';
    content?: string;
    toolCalls?: Array<{ name: string }>;
    toolResults?: Array<unknown>;
  },
>(messages: T[]): T[] {
  const filtered = messages.filter((message) => !isInternalCompletionControlMessage(message));
  return filtered.length > 0 ? filtered : messages;
}
