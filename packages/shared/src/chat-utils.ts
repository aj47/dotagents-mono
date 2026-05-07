/**
 * Shared chat utilities for DotAgents apps (desktop and mobile)
 *
 * These utilities provide consistent behavior for chat UI features
 * across both platforms while allowing platform-specific rendering.
 */

import type { AgentProgressUpdate, AgentUserResponseEvent } from './agent-progress';
import type { AgentRunExecutor } from './agent-run-utils';
import type { ModelInfo, ModelsResponse, OpenAICompatibleModelSummary, OpenAICompatibleModelsResponse } from './api-types';
import { CHAT_PROVIDER_IDS, isChatProviderId, type CHAT_PROVIDER_ID } from './providers';
import { resolveActiveModelId, type ActiveModelConfigLike } from './model-presets';
import { stripMarkdownImageReferences } from './conversation-media-assets';
import type { ConversationHistoryMessage, ToolCall, ToolResult } from './types';

export type ChatRequestMessageLike = {
  role: 'user' | 'assistant' | 'tool';
  content?: string;
  displayContent?: string;
  toolCalls?: ToolCall[];
  toolResults?: Array<ToolResult | null | undefined>;
  toolExecutions?: Array<{ toolCall: ToolCall; result?: ToolResult }>;
};

export type ConversationHistoryForApiEntryLike = {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  displayContent?: string;
  toolCalls?: Array<{
    name: string;
    arguments: unknown;
  }>;
  toolResults?: unknown[];
  timestamp?: number;
};

export type ChatCompletionRequestBody<T extends ChatRequestMessageLike = ChatRequestMessageLike> = {
  model?: string;
  messages: T[];
  stream: boolean;
  conversation_id?: string;
  profile_id?: string;
  send_push_notification?: boolean;
};

export type BuildChatCompletionRequestOptions<T extends ChatRequestMessageLike = ChatRequestMessageLike> = {
  model?: string;
  messages: T[];
  stream?: boolean;
  conversationId?: string;
  profileId?: string;
  sendPushNotification?: boolean;
};

export type ParsedChatCompletionRequestBody = {
  prompt: string | null;
  conversationId?: string;
  profileId?: string;
  stream: boolean;
  sendPushNotification: boolean;
};

export type ValidatedChatCompletionRequestBody = ParsedChatCompletionRequestBody & {
  prompt: string;
};

export type ChatCompletionRequestValidationResult =
  | { ok: true; request: ValidatedChatCompletionRequestBody }
  | { ok: false; statusCode: 400; body: { error: string } };

export interface ChatCompletionRequestValidationOptions {
  validateConversationId?: (conversationId: string) => string | null | undefined;
}

export type ChatCompletionPushNotificationPlan = {
  conversationId: string;
  conversationTitle: string;
  content: string;
};

export type BuildChatCompletionPushNotificationPlanOptions = {
  sendPushNotification: boolean;
  pushEnabled: boolean;
  prompt: string;
  conversationId: string;
  content: string;
  maxTitleLength?: number;
};

export type OpenAIChatCompletionResponse = {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop';
  }>;
};

export type DotAgentsChatCompletionResponse = OpenAIChatCompletionResponse & {
  conversation_id: string;
  conversation_history: ConversationHistoryMessage[];
};

export type BuildOpenAIChatCompletionResponseOptions = {
  id?: string;
  created?: number;
};

export type BuildDotAgentsChatCompletionResponseOptions = BuildOpenAIChatCompletionResponseOptions & {
  content: string;
  model: string;
  conversationId: string;
  conversationHistory: ConversationHistoryMessage[];
};

export type OpenAICompatibleModelInput = string | OpenAICompatibleModelSummary;
export type ProviderModelInfoInput = Pick<ModelInfo, 'id' | 'name' | 'description' | 'context_length'>;

export type ModelActionResult = {
  statusCode: number;
  body: unknown;
};

export interface ModelActionDiagnostics {
  logError(source: string, message: string, error: unknown): void;
}

export interface ModelActionOptions {
  getConfig(): ActiveModelConfigLike;
  fetchAvailableModels(providerId: CHAT_PROVIDER_ID): Promise<ProviderModelInfoInput[]>;
  diagnostics: ModelActionDiagnostics;
}

export interface ModelRouteActions {
  getModels(): ModelActionResult;
  getProviderModels(providerId: string | undefined): Promise<ModelActionResult>;
}

export type ParsedChatCompletionSseEvent =
  | { type: 'done' }
  | { type: 'progress'; update: AgentProgressUpdate }
  | {
    type: 'complete';
    content: string;
    conversationId?: string;
    conversationHistory?: ConversationHistoryMessage[];
    model?: string;
  }
  | { type: 'error'; message: string }
  | { type: 'token'; token: string };

export type DotAgentsChatCompletionProgressSsePayload = {
  type: 'progress';
  data: AgentProgressUpdate;
};

export type DotAgentsChatCompletionDoneSsePayload = {
  type: 'done';
  data: {
    content: string;
    conversation_id?: string;
    conversation_history?: ConversationHistoryMessage[];
    model?: string;
  };
};

export type DotAgentsChatCompletionErrorSsePayload = {
  type: 'error';
  data: {
    message: string;
  };
};

export type DotAgentsChatCompletionSsePayload =
  | DotAgentsChatCompletionProgressSsePayload
  | DotAgentsChatCompletionDoneSsePayload
  | DotAgentsChatCompletionErrorSsePayload;

export type ChatCompletionSseHeaders = {
  'Content-Type': 'text/event-stream';
  'Cache-Control': 'no-cache';
  Connection: 'keep-alive';
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Credentials': 'true';
};

export type BuildChatCompletionDoneSsePayloadOptions = {
  content: string;
  conversationId?: string;
  conversationHistory?: ConversationHistoryMessage[];
  model?: string;
};

export interface ChatCompletionActionRawReplyLike {
  writeHead(statusCode: number, headers: ChatCompletionSseHeaders): unknown;
  write(chunk: string): unknown;
  end(): unknown;
}

export interface ChatCompletionActionReplyLike {
  raw: ChatCompletionActionRawReplyLike;
  code(statusCode: number): { send(body?: unknown): unknown };
  send(body?: unknown): unknown;
}

export interface ChatCompletionActionDiagnostics {
  logInfo(source: string, message: string): void;
  logWarning(source: string, message: string, error: unknown): void;
  logError(source: string, message: string, error: unknown): void;
}

export interface ChatCompletionActionLogger {
  log(message?: unknown, ...optionalParams: unknown[]): void;
}

export interface ChatCompletionActionOptions {
  diagnostics: ChatCompletionActionDiagnostics;
  getActiveModelConfig(): ActiveModelConfigLike;
  validateConversationId?: ChatCompletionRequestValidationOptions['validateConversationId'];
  recordHistory(transcript: string): void;
  isPushEnabled(): boolean;
  sendPushNotification(
    conversationId: string,
    conversationTitle: string,
    content: string,
  ): Promise<void>;
  logger?: ChatCompletionActionLogger;
}

export type ToolArgumentEntry = {
  key: string;
  value: unknown;
};

export type RespondToUserToolCallLike = {
  name?: string;
  arguments?: unknown;
};

export type RespondToUserConversationHistoryLike = Array<{
  role?: string;
  timestamp?: number;
  toolCalls?: RespondToUserToolCallLike[];
}>;

const COLLAPSE_THRESHOLD = 200;
const TOOL_PAYLOAD_PREFIX_REGEX = /^(?:using tool:|tool result:)/i;
const TOOL_RESULT_BRACKET_REGEX = /^\[[\w_.-]+\]\s*[{\[#]/;
const INLINE_TOOL_BRACKET_REGEX = /\[[\w_.-]+\]\s*(?:\{[\s\S]*?\}|\[[\s\S]*?\])/g;
const GARBLED_TOOL_CALL_REGEX = /(?:multi_tool_use[.\s]|to=(?:multi_tool_use|functions)\.|recipient_name.*functions\.)/i;
const RAW_TOOL_MARKER_TOKEN_REGEX = /<\|[^|]*\|>/g;
const RAW_TOOL_MARKER_DETECT_REGEX = /<\|[^|]*\|>/;
const RAW_TOOL_CALL_MARKER_DETECT_REGEX = /<\|tool_calls_section_begin\|>|<\|tool_call_begin\|>/i;
const DEFAULT_CHAT_COMPLETION_PUSH_NOTIFICATION_TITLE_LENGTH = 30;

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
  const contentLength = content
    ? stripMarkdownImageReferences(content, { mediaOnly: true }).length
    : 0;
  return contentLength > COLLAPSE_THRESHOLD || hasExtras;
}

export function sanitizeMessagesForRequest<T extends ChatRequestMessageLike>(messages: T[]): T[] {
  return messages.map((message) => {
    const requestMessage = { ...message };
    delete requestMessage.toolExecutions;
    delete requestMessage.displayContent;

    if (message.toolExecutions?.length) {
      delete requestMessage.toolCalls;
      delete requestMessage.toolResults;
      return requestMessage as T;
    }

    if (!Array.isArray(message.toolResults)) {
      return requestMessage as T;
    }

    const originalToolCalls = Array.isArray(message.toolCalls) ? message.toolCalls : undefined;
    const toolResults = message.toolResults.filter((result): result is ToolResult => result != null);

    if (toolResults.length === 0) {
      delete requestMessage.toolResults;
      if (Array.isArray(message.toolCalls)) {
        delete requestMessage.toolCalls;
      }
      return requestMessage as T;
    }

    const originalCallsAreIndexAligned =
      Array.isArray(originalToolCalls) && originalToolCalls.length === toolResults.length;
    const sanitizedToolCalls = originalCallsAreIndexAligned
      ? originalToolCalls.every((toolCall): toolCall is ToolCall => !!toolCall)
        ? originalToolCalls
        : undefined
      : undefined;
    const shouldDropToolCalls = !!originalToolCalls && !sanitizedToolCalls;

    const sanitizedMessage = {
      ...requestMessage,
      ...(sanitizedToolCalls ? { toolCalls: sanitizedToolCalls } : {}),
      toolResults,
    };

    if (shouldDropToolCalls) {
      delete sanitizedMessage.toolCalls;
    }

    return sanitizedMessage as T;
  });
}

function formatConversationToolResultContent(content: unknown): string {
  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (entry && typeof entry === 'object' && 'text' in entry) {
          const text = (entry as { text?: unknown }).text;
          return text === undefined || text === null ? String(entry) : String(text);
        }
        return String(entry ?? '');
      })
      .join('\n');
  }

  return String(content || '');
}

function formatConversationToolResultForApi(result: unknown): ToolResult {
  const record = result && typeof result === 'object' && !Array.isArray(result)
    ? result as Record<string, unknown>
    : {};
  const contentText = formatConversationToolResultContent(record.content);
  const isError = record.isError ?? (record.success === false);

  return {
    success: !isError,
    content: contentText,
    error: isError ? contentText : undefined,
  };
}

function formatConversationToolCallForApi(toolCall: { name: string; arguments: unknown }): ToolCall {
  return {
    name: toolCall.name,
    arguments: toolCall.arguments && typeof toolCall.arguments === 'object' && !Array.isArray(toolCall.arguments)
      ? toolCall.arguments as Record<string, unknown>
      : {},
  };
}

export function formatConversationHistoryForApi(
  history: ConversationHistoryForApiEntryLike[],
): ConversationHistoryMessage[] {
  return history.map((entry) => ({
    role: entry.role,
    content: entry.content,
    toolCalls: entry.toolCalls?.map(formatConversationToolCallForApi),
    toolResults: entry.toolResults?.map(formatConversationToolResultForApi),
    timestamp: entry.timestamp,
  }));
}

export function buildChatCompletionRequestBody<T extends ChatRequestMessageLike>(
  options: BuildChatCompletionRequestOptions<T>,
): ChatCompletionRequestBody<T> {
  const body: ChatCompletionRequestBody<T> = {
    model: options.model,
    messages: sanitizeMessagesForRequest(options.messages),
    stream: options.stream ?? true,
  };

  const conversationId = options.conversationId?.trim();
  if (conversationId) {
    body.conversation_id = conversationId;
  }

  const profileId = options.profileId?.trim();
  if (profileId) {
    body.profile_id = profileId;
  }

  if (typeof options.sendPushNotification === 'boolean') {
    body.send_push_notification = options.sendPushNotification;
  }

  return body;
}

export function normalizeChatCompletionContent(content: unknown): string | null {
  if (!content) return null;
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    const parts = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          if (typeof (part as { text?: unknown }).text === 'string') {
            return (part as { text: string }).text;
          }
          if (typeof (part as { content?: unknown }).content === 'string') {
            return (part as { content: string }).content;
          }
        }
        return '';
      })
      .filter(Boolean);

    return parts.length ? parts.join(' ') : null;
  }

  if (typeof content === 'object' && content !== null) {
    if (typeof (content as { text?: unknown }).text === 'string') {
      return (content as { text: string }).text;
    }
  }

  return null;
}

export function extractUserPromptFromChatCompletionBody(body: unknown): string | null {
  try {
    if (!body || typeof body !== 'object') return null;

    const requestBody = body as {
      messages?: unknown;
      prompt?: unknown;
      input?: unknown;
    };

    if (Array.isArray(requestBody.messages)) {
      for (let i = requestBody.messages.length - 1; i >= 0; i--) {
        const message = requestBody.messages[i];
        if (!message || typeof message !== 'object') continue;

        const role = String((message as { role?: unknown }).role || '').toLowerCase();
        if (role === 'user') {
          const content = normalizeChatCompletionContent((message as { content?: unknown }).content);
          if (content && content.trim()) return content.trim();
        }
      }
    }

    const prompt = normalizeChatCompletionContent(requestBody.prompt);
    if (prompt && prompt.trim()) return prompt.trim();

    const input = normalizeChatCompletionContent(requestBody.input);
    if (input && input.trim()) return input.trim();

    return null;
  } catch {
    return null;
  }
}

export function parseChatCompletionRequestBody(body: unknown): ParsedChatCompletionRequestBody {
  const requestBody = body && typeof body === 'object'
    ? body as {
      conversation_id?: unknown;
      profile_id?: unknown;
      stream?: unknown;
      send_push_notification?: unknown;
    }
    : {};

  const rawConversationId = typeof requestBody.conversation_id === 'string'
    ? requestBody.conversation_id
    : undefined;
  const rawProfileId = typeof requestBody.profile_id === 'string'
    ? requestBody.profile_id
    : undefined;

  return {
    prompt: extractUserPromptFromChatCompletionBody(body),
    conversationId: rawConversationId !== '' ? rawConversationId : undefined,
    profileId: rawProfileId !== '' ? rawProfileId : undefined,
    stream: requestBody.stream === true,
    sendPushNotification: requestBody.send_push_notification !== false,
  };
}

export function validateChatCompletionRequestBody(
  body: unknown,
  options: ChatCompletionRequestValidationOptions = {},
): ChatCompletionRequestValidationResult {
  const request = parseChatCompletionRequestBody(body);
  if (!request.prompt) {
    return {
      ok: false,
      statusCode: 400,
      body: { error: 'Missing user prompt' },
    };
  }

  if (request.conversationId && options.validateConversationId) {
    const conversationIdError = options.validateConversationId(request.conversationId);
    if (conversationIdError) {
      return {
        ok: false,
        statusCode: 400,
        body: { error: conversationIdError },
      };
    }
  }

  return {
    ok: true,
    request: {
      ...request,
      prompt: request.prompt,
    },
  };
}

export function buildChatCompletionPushNotificationPlan(
  options: BuildChatCompletionPushNotificationPlanOptions,
): ChatCompletionPushNotificationPlan | null {
  if (!options.sendPushNotification || !options.pushEnabled) {
    return null;
  }

  const maxTitleLength = Math.max(
    0,
    Math.floor(options.maxTitleLength ?? DEFAULT_CHAT_COMPLETION_PUSH_NOTIFICATION_TITLE_LENGTH),
  );
  const conversationTitle = options.prompt.length > maxTitleLength
    ? `${options.prompt.substring(0, maxTitleLength)}...`
    : options.prompt;

  return {
    conversationId: options.conversationId,
    conversationTitle,
    content: options.content,
  };
}

export function buildOpenAIChatCompletionResponse(
  content: string,
  model: string,
  options: BuildOpenAIChatCompletionResponseOptions = {},
): OpenAIChatCompletionResponse {
  const now = Date.now();

  return {
    id: options.id ?? `chatcmpl-${now.toString(36)}`,
    object: 'chat.completion',
    created: options.created ?? Math.floor(now / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop',
      },
    ],
  };
}

export function buildDotAgentsChatCompletionResponse(
  options: BuildDotAgentsChatCompletionResponseOptions,
): DotAgentsChatCompletionResponse {
  return {
    ...buildOpenAIChatCompletionResponse(options.content, options.model, {
      id: options.id,
      created: options.created,
    }),
    conversation_id: options.conversationId,
    conversation_history: options.conversationHistory,
  };
}

export function buildOpenAICompatibleModelsResponse(
  models: OpenAICompatibleModelInput[],
  defaultOwner = 'system',
): OpenAICompatibleModelsResponse {
  return {
    object: 'list',
    data: models.map((model) => {
      if (typeof model === 'string') {
        return { id: model, object: 'model', owned_by: defaultOwner };
      }
      return model;
    }),
  };
}

export function buildProviderModelsResponse(
  providerId: CHAT_PROVIDER_ID,
  models: ProviderModelInfoInput[],
): ModelsResponse {
  return {
    providerId,
    models: models.map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
      context_length: model.context_length,
    })),
  };
}

function modelActionOk(body: unknown): ModelActionResult {
  return {
    statusCode: 200,
    body,
  };
}

function modelActionError(statusCode: number, message: string): ModelActionResult {
  return {
    statusCode,
    body: { error: message },
  };
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function getModelsAction(options: Pick<ModelActionOptions, 'getConfig'>): ModelActionResult {
  const model = resolveActiveModelId(options.getConfig());
  return modelActionOk(buildOpenAICompatibleModelsResponse([model]));
}

export async function getProviderModelsAction(
  providerId: string | undefined,
  options: ModelActionOptions,
): Promise<ModelActionResult> {
  try {
    if (!isChatProviderId(providerId)) {
      return modelActionError(
        400,
        `Invalid provider: ${providerId}. Valid providers: ${CHAT_PROVIDER_IDS.join(', ')}`,
      );
    }

    const models = await options.fetchAvailableModels(providerId);
    return modelActionOk(buildProviderModelsResponse(providerId, models));
  } catch (caughtError) {
    options.diagnostics.logError('model-actions', 'Failed to fetch models', caughtError);
    return modelActionError(500, getUnknownErrorMessage(caughtError, 'Failed to fetch models'));
  }
}

export function createModelRouteActions(options: ModelActionOptions): ModelRouteActions {
  return {
    getModels: () => getModelsAction(options),
    getProviderModels: (providerId) => getProviderModelsAction(providerId, options),
  };
}

export function buildChatCompletionProgressSsePayload(update: AgentProgressUpdate): DotAgentsChatCompletionProgressSsePayload {
  return {
    type: 'progress',
    data: update,
  };
}

export function buildChatCompletionDoneSsePayload(
  options: BuildChatCompletionDoneSsePayloadOptions,
): DotAgentsChatCompletionDoneSsePayload {
  return {
    type: 'done',
    data: {
      content: options.content,
      conversation_id: options.conversationId,
      conversation_history: options.conversationHistory,
      model: options.model,
    },
  };
}

export function buildChatCompletionErrorSsePayload(message: string): DotAgentsChatCompletionErrorSsePayload {
  return {
    type: 'error',
    data: { message },
  };
}

export function formatServerSentEventData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export function normalizeServerSentEventOrigin(origin: string | string[] | undefined): string {
  if (Array.isArray(origin)) {
    return origin[0] || '*';
  }

  return origin || '*';
}

export function buildChatCompletionSseHeaders(
  origin: string | string[] | undefined,
): ChatCompletionSseHeaders {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': normalizeServerSentEventOrigin(origin),
    'Access-Control-Allow-Credentials': 'true',
  };
}

function sendChatCompletionPushNotification(
  request: ValidatedChatCompletionRequestBody,
  conversationId: string,
  content: string,
  options: ChatCompletionActionOptions,
): void {
  const notificationPlan = buildChatCompletionPushNotificationPlan({
    sendPushNotification: request.sendPushNotification,
    pushEnabled: request.sendPushNotification ? options.isPushEnabled() : false,
    prompt: request.prompt,
    conversationId,
    content,
  });
  if (!notificationPlan) {
    return;
  }

  void options.sendPushNotification(
    notificationPlan.conversationId,
    notificationPlan.conversationTitle,
    notificationPlan.content,
  ).catch((caughtError) => {
    options.diagnostics.logWarning('remote-server', 'Failed to send push notification', caughtError);
  });
}

export async function handleChatCompletionRequestAction<Reply extends ChatCompletionActionReplyLike>(
  body: unknown,
  origin: string | string[] | undefined,
  reply: Reply,
  runAgent: AgentRunExecutor,
  options: ChatCompletionActionOptions,
): Promise<unknown> {
  try {
    const validatedRequest = validateChatCompletionRequestBody(body, {
      validateConversationId: options.validateConversationId,
    });
    if (validatedRequest.ok === false) {
      return reply.code(validatedRequest.statusCode).send(validatedRequest.body);
    }

    const chatRequest = validatedRequest.request;
    const { prompt, conversationId, profileId, stream: isStreaming } = chatRequest;

    options.logger?.log('[remote-server] Chat request:', {
      conversationId: conversationId || 'new',
      promptLength: prompt.length,
      streaming: isStreaming,
    });
    options.diagnostics.logInfo(
      'remote-server',
      `Handling completion request${conversationId ? ` for conversation ${conversationId}` : ''}${isStreaming ? ' (streaming)' : ''}`,
    );

    if (isStreaming) {
      reply.raw.writeHead(200, buildChatCompletionSseHeaders(origin));

      const writeSSE = (data: object) => {
        reply.raw.write(formatServerSentEventData(data));
      };

      const onProgress = (update: AgentProgressUpdate) => {
        writeSSE(buildChatCompletionProgressSsePayload(update));
      };

      try {
        const result = await runAgent({ prompt, conversationId, profileId, onProgress });
        options.recordHistory(result.content);

        const model = resolveActiveModelId(options.getActiveModelConfig());
        writeSSE(buildChatCompletionDoneSsePayload({
          content: result.content,
          conversationId: result.conversationId,
          conversationHistory: result.conversationHistory,
          model,
        }));

        sendChatCompletionPushNotification(chatRequest, result.conversationId, result.content, options);
      } catch (caughtError) {
        writeSSE(buildChatCompletionErrorSsePayload(getUnknownErrorMessage(caughtError, 'Internal Server Error')));
      } finally {
        reply.raw.end();
      }

      return reply;
    }

    const result = await runAgent({ prompt, conversationId, profileId });
    options.recordHistory(result.content);

    const model = resolveActiveModelId(options.getActiveModelConfig());
    const response = buildDotAgentsChatCompletionResponse({
      content: result.content,
      model,
      conversationId: result.conversationId,
      conversationHistory: result.conversationHistory,
    });

    options.logger?.log('[remote-server] Chat response:', {
      conversationId: result.conversationId,
      responseLength: result.content.length,
    });
    sendChatCompletionPushNotification(chatRequest, result.conversationId, result.content, options);

    return reply.send(response);
  } catch (caughtError) {
    options.diagnostics.logError('remote-server', 'Handler error', caughtError);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

export function parseChatCompletionSseEvent(event: string): ParsedChatCompletionSseEvent[] {
  if (!event.trim()) return [];

  const lines = event
    .split(/\r?\n/)
    .map((line) => line.replace(/^data:\s?/, '').trim())
    .filter(Boolean);

  const parsedEvents: ParsedChatCompletionSseEvent[] = [];

  for (const line of lines) {
    if (line === '[DONE]' || line === '"[DONE]"') {
      parsedEvents.push({ type: 'done' });
      continue;
    }

    try {
      const obj = JSON.parse(line);

      if (obj.type === 'progress' && obj.data) {
        parsedEvents.push({ type: 'progress', update: obj.data as AgentProgressUpdate });
        continue;
      }

      if (obj.type === 'done' && obj.data) {
        const completeEvent: ParsedChatCompletionSseEvent = {
          type: 'complete',
          content: obj.data.content || '',
          conversationId: obj.data.conversation_id,
          conversationHistory: obj.data.conversation_history,
        };
        if (typeof obj.data.model === 'string') {
          completeEvent.model = obj.data.model;
        }
        parsedEvents.push(completeEvent);
        continue;
      }

      if (obj.type === 'error' && obj.data) {
        parsedEvents.push({ type: 'error', message: obj.data.message || 'Server error' });
        continue;
      }

      const token = obj?.choices?.[0]?.delta?.content;
      if (typeof token === 'string' && token.length > 0) {
        parsedEvents.push({ type: 'token', token });
      }
    } catch {
      // Ignore malformed SSE lines. The transport layer can decide whether the
      // stream itself failed; a partial/incomplete event should not fail parsing.
    }
  }

  return parsedEvents;
}

/**
 * Generate a summary of tool calls for collapsed view
 * @param toolCalls Array of tool calls
 * @returns A formatted string showing only tool names
 */
export function getToolCallsSummary(toolCalls: ToolCall[]): string {
  if (!toolCalls || toolCalls.length === 0) return '';
  return toolCalls.map(tc => getToolCallPreview(tc)).join(', ');
}

/**
 * Generate a compact single-token label for a collapsed tool call.
 * Details belong in expanded tool views, not collapsed rows.
 *
 * For `execute_command`, the first command token (e.g. `git`, `pnpm`) is
 * preferred over the generic tool name so collapsed group previews still
 * communicate which command was run.
 */
export function getToolCallPreview(toolCall: ToolCall): string {
  const toolName = toolCall.name?.trim() || '';
  const normalizedName = toolName.toLowerCase();
  if (normalizedName === 'execute_command' || normalizedName.endsWith(':execute_command')) {
    const args = normalizeToolArguments(toolCall.arguments);
    const command = args?.command;
    if (typeof command === 'string') {
      const firstToken = command.trim().split(/\s+/)[0];
      if (firstToken) return firstToken;
    }
  }
  return toolName.replace(/\s+/g, '_') || 'tool';
}

/**
 * Generate a collapsed preview for an individual tool row.
 * Grouped tool previews intentionally stay tool-name-only via getToolCallPreview.
 */
export function getIndividualToolCallPreview(toolCall: ToolCall): string {
  const toolName = toolCall.name?.trim() || '';
  const normalizedName = toolName.toLowerCase();
  if (normalizedName === 'execute_command' || normalizedName.endsWith(':execute_command')) {
    const args = normalizeToolArguments(toolCall.arguments);
    const command = args?.command;
    if (typeof command === 'string' && command.trim()) {
      return command.replace(/\s+/g, ' ').trim();
    }
  }

  return getToolCallPreview(toolCall);
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
      displayValue = truncatePreview(value, 30);
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

const sanitizeRespondToUserMarkdownLabel = (label: string) => label.replace(/[\[\]\(\)`\\]/g, '').trim();

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
  const videos = Array.isArray(parsedArgs.videos) ? parsedArgs.videos : [];

  const imagesMd = images
    .map((img, index) => {
      if (!img || typeof img !== 'object') return '';

      const image = img as Record<string, unknown>;
      const alt = typeof image.alt === 'string' && image.alt.trim().length > 0
        ? image.alt.trim()
        : typeof image.altText === 'string' && image.altText.trim().length > 0
          ? image.altText.trim()
          : `Image ${index + 1}`;
      const safeAlt = sanitizeRespondToUserMarkdownLabel(alt) || `Image ${index + 1}`;

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

  const videosMd = videos
    .map((video, index) => {
      if (!video || typeof video !== 'object') return '';

      const parsedVideo = video as Record<string, unknown>;
      const label = typeof parsedVideo.label === 'string' && parsedVideo.label.trim().length > 0
        ? parsedVideo.label.trim()
        : `Video ${index + 1}`;
      const safeLabel = sanitizeRespondToUserMarkdownLabel(label) || `Video ${index + 1}`;
      const url = typeof parsedVideo.url === 'string' ? parsedVideo.url.trim() : '';

      if (url) return `[${safeLabel}](${url})`;
      return '';
    })
    .filter(Boolean)
    .join('\n\n');

  const combined = [text, imagesMd, videosMd].filter(Boolean).join('\n\n').trim();
  return combined || null;
}

export function normalizeUserFacingResponseContent(content: string | null | undefined): string | undefined {
  return typeof content === 'string' && content.trim().length > 0
    ? content
    : undefined;
}

export function getOrderedRespondToUserContentsFromToolCalls(toolCalls?: RespondToUserToolCallLike[]): string[] {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return [];

  const orderedResponses: string[] = [];
  for (const toolCall of toolCalls) {
    if (toolCall?.name !== RESPOND_TO_USER_TOOL) continue;
    const content = extractRespondToUserContentFromArgs(toolCall.arguments);
    if (content) {
      orderedResponses.push(content);
    }
  }

  return orderedResponses;
}

export function getUnmaterializedUserResponseEvents<T extends { id: string }>(
  responseEvents: T[],
  materializedEventIds: Iterable<string>,
): T[] {
  const materializedIds = new Set(materializedEventIds);
  return responseEvents.filter((responseEvent) => !materializedIds.has(responseEvent.id));
}

export function sortAgentUserResponseEvents<T extends Pick<AgentUserResponseEvent, 'ordinal' | 'timestamp' | 'runId'>>(
  events: T[],
): T[] {
  return [...events].sort((a, b) => {
    if ((a.runId ?? 0) !== (b.runId ?? 0)) return (a.runId ?? 0) - (b.runId ?? 0);
    if (a.ordinal !== b.ordinal) return a.ordinal - b.ordinal;
    return a.timestamp - b.timestamp;
  });
}

export function getNextAgentUserResponseEventOrdinal<T extends { ordinal: number }>(events: T[]): number {
  return events.reduce((maxOrdinal, event) => Math.max(maxOrdinal, event.ordinal), 0) + 1;
}

function getLatestRespondToUserContentFromToolCalls(toolCalls?: RespondToUserToolCallLike[]): string | undefined {
  const orderedResponses = getOrderedRespondToUserContentsFromToolCalls(toolCalls);
  return orderedResponses[orderedResponses.length - 1];
}

export function getLatestRespondToUserContentFromConversationHistory(
  conversationHistory: RespondToUserConversationHistoryLike,
  sinceIndex = 0,
): string | undefined {
  if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) return undefined;

  let latestResponse: string | undefined;
  for (const message of conversationHistory.slice(Math.max(0, sinceIndex))) {
    if (message?.role !== 'assistant') continue;
    const content = getLatestRespondToUserContentFromToolCalls(message.toolCalls);
    if (content) {
      latestResponse = content;
    }
  }

  return latestResponse;
}

function getLatestRespondToUserEventTextFromResponseEvents(
  responseEvents?: AgentUserResponseEvent[],
): string | undefined {
  if (!Array.isArray(responseEvents) || responseEvents.length === 0) return undefined;

  for (const responseEvent of sortAgentUserResponseEvents(responseEvents).reverse()) {
    const normalizedText = normalizeUserFacingResponseContent(responseEvent.text);
    if (normalizedText) {
      return normalizedText;
    }
  }

  return undefined;
}

export function resolveLatestUserFacingResponse({
  storedResponse,
  plannedToolCalls,
  conversationHistory,
  sinceIndex,
  responseEvents,
}: {
  storedResponse?: string;
  plannedToolCalls?: RespondToUserToolCallLike[];
  conversationHistory?: RespondToUserConversationHistoryLike;
  sinceIndex?: number;
  responseEvents?: AgentUserResponseEvent[];
}): string | undefined {
  const normalizedStoredResponse = normalizeUserFacingResponseContent(storedResponse);

  return getLatestRespondToUserContentFromToolCalls(plannedToolCalls)
    ?? getLatestRespondToUserEventTextFromResponseEvents(responseEvents)
    ?? normalizedStoredResponse
    ?? getLatestRespondToUserContentFromConversationHistory(conversationHistory ?? [], sinceIndex);
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
    sinceIndex?: number;
    toolNameNormalizer?: (name: string) => string | undefined;
  },
): AgentUserResponseEvent[] {
  const events: AgentUserResponseEvent[] = [];
  const idPrefix = options?.idPrefix ?? 'history';
  const sinceIndex = Math.max(0, options?.sinceIndex ?? 0);
  const scopedMessages = messages.slice(sinceIndex);
  const resolvedTimestamps = resolveMessageTimestamps(scopedMessages);

  for (let localMessageIndex = 0; localMessageIndex < scopedMessages.length; localMessageIndex += 1) {
    const messageIndex = sinceIndex + localMessageIndex;
    const message = scopedMessages[localMessageIndex];
    if (message.role !== 'assistant' || !message.toolCalls?.length) continue;

    for (let toolCallIndex = 0; toolCallIndex < message.toolCalls.length; toolCallIndex += 1) {
      const call = message.toolCalls[toolCallIndex];
      const toolName = options?.toolNameNormalizer ? options.toolNameNormalizer(call.name) : call.name;
      if (toolName !== RESPOND_TO_USER_TOOL) continue;
      const content = extractRespondToUserContentFromArgs(call.arguments);
      if (!content) continue;

      events.push({
        id: `${idPrefix}-${messageIndex}-${toolCallIndex}-${events.length + 1}`,
        sessionId: options?.sessionId ?? 'history',
        runId: options?.runId,
        ordinal: events.length + 1,
        text: content,
        timestamp: resolvedTimestamps[localMessageIndex],
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

export function getRenderableMessageContent(message: {
  content?: string;
  displayContent?: string;
}): string {
  return message.displayContent ?? message.content ?? '';
}

export function getRespondToUserContentFromMessage(message: {
  role: 'user' | 'assistant' | 'tool';
  toolCalls?: Array<{ name: string; arguments: unknown }>;
}): string | null {
  if (message.role !== 'assistant' || !message.toolCalls?.length) {
    return null;
  }

  for (const call of message.toolCalls) {
    if (call.name !== RESPOND_TO_USER_TOOL) {
      continue;
    }

    const extractedContent = extractRespondToUserContentFromArgs(call.arguments);
    if (extractedContent) {
      return extractedContent;
    }
  }

  return null;
}

export function looksLikeToolPayloadContent(content?: string): boolean {
  const trimmedContent = content?.trim();
  if (!trimmedContent) {
    return false;
  }

  if (hasRawToolCallMarkerTokens(trimmedContent)) {
    return true;
  }

  if (TOOL_PAYLOAD_PREFIX_REGEX.test(trimmedContent)) {
    return true;
  }

  if (/^tool_call$/i.test(trimmedContent)) {
    return true;
  }

  if (TOOL_RESULT_BRACKET_REGEX.test(trimmedContent)) {
    return true;
  }

  if (GARBLED_TOOL_CALL_REGEX.test(trimmedContent)) {
    return true;
  }

  return false;
}

export function hasRawToolMarkerTokens(content?: string | null): boolean {
  return RAW_TOOL_MARKER_DETECT_REGEX.test(content ?? '');
}

export function hasRawToolCallMarkerTokens(content?: string | null): boolean {
  return RAW_TOOL_CALL_MARKER_DETECT_REGEX.test(content ?? '');
}

export function stripRawToolMarkerTokens(
  content: string | undefined | null,
  options: { trim?: boolean } = {},
): string {
  const stripped = (content ?? '').replace(RAW_TOOL_MARKER_TOKEN_REGEX, '');
  return options.trim ? stripped.trim() : stripped;
}

export function stripRawToolTextFromContent(content: string): string {
  if (!content) return content;

  return stripRawToolMarkerTokens(content)
    .replace(INLINE_TOOL_BRACKET_REGEX, '')
    .replace(/(?:multi_tool_use[.\s]|to=(?:multi_tool_use|functions)\.)[\s\S]*$/i, '')
    .trim();
}

export function getVisibleMessageContent(message: {
  role: 'user' | 'assistant' | 'tool';
  content?: string;
  displayContent?: string;
  toolCalls?: Array<{ name: string; arguments?: unknown }>;
  toolResults?: Array<unknown>;
}): string {
  if (message.role === 'tool') {
    return '';
  }

  if (message.role !== 'assistant') {
    return getRenderableMessageContent(message);
  }

  const respondToUserContent = getRespondToUserContentFromMessage(
    message as { role: 'user' | 'assistant' | 'tool'; toolCalls?: Array<{ name: string; arguments: unknown }> },
  );
  if (respondToUserContent) {
    return respondToUserContent;
  }

  const hasToolMetadata =
    (message.toolCalls?.length ?? 0) > 0 ||
    (message.toolResults?.length ?? 0) > 0;
  const renderContent = getRenderableMessageContent(message);
  const displayMessage = { ...message, content: renderContent };

  if (isToolOnlyMessage(displayMessage)) {
    return '';
  }

  if (hasToolMetadata && looksLikeToolPayloadContent(renderContent)) {
    return '';
  }

  if (looksLikeToolPayloadContent(renderContent)) {
    return '';
  }

  const stripped = stripRawToolTextFromContent(renderContent);
  if (stripped.length > 0) {
    return stripped;
  }

  return stripped === renderContent ? renderContent : '';
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
