import type {
  BranchConversationRequest,
  CreateConversationRequest,
  ConversationDeleteResponse,
  ConversationsDeleteAllResponse,
  ServerConversation,
  ServerConversationFull,
  ServerConversationMessage,
  UpdateConversationRequest,
} from './api-types';
import { filterVisibleChatMessages } from './chat-utils';
import type { ConversationCompactionMetadata } from './conversation-domain';
import { extractHighSignalFactsFromConversationMessages } from './conversation-context-builder';
import { sanitizeMessageContentForDisplay } from './message-display-utils';
import {
  buildConversationPreview,
  generateConversationTitleFromMessage,
  generateSessionId,
  normalizeConversationTitleText,
  type Session,
  type SessionChatMessage,
} from './session';

export interface SyncResult {
  pulled: number;
  pushed: number;
  updated: number;
  errors: string[];
}

export interface SyncableSession extends Session {
  // Session already has serverConversationId optional field.
}

export interface SyncConversationOptions {
  /**
   * Session IDs that are in the middle of creating their first server-side
   * conversation through /v1/chat/completions.
   *
   * While that request is still linking its returned conversationId back into
   * local state, sync must not create another server conversation or pull an
   * unmatched server conversation into a duplicate local stub.
   */
  pendingCreateSessionIds?: ReadonlySet<string>;
}

export interface ConversationSyncClient {
  getConversations(): Promise<{ conversations: ServerConversation[] }>;
  getConversation(id: string): Promise<ServerConversationFull>;
  createConversation(data: CreateConversationRequest): Promise<ServerConversationFull>;
  updateConversation(id: string, data: UpdateConversationRequest): Promise<ServerConversationFull>;
}

export type ServerConversationsResponse = {
  conversations: ServerConversation[];
};

export type ConversationActionResult = {
  statusCode: number;
  body: unknown;
  headers?: Record<string, string>;
};

type ConversationMaybePromise<T> = T | Promise<T>;

export interface ConversationActionDiagnostics {
  logInfo(source: string, message: string): void;
  logError(source: string, message: string, error: unknown): void;
}

export interface ConversationActionService<TConversation extends ServerConversationRecord<any> = ServerConversationRecord<any>> {
  loadConversation(conversationId: string): ConversationMaybePromise<TConversation | null | undefined>;
  getConversationHistory(): ConversationMaybePromise<ServerConversation[]>;
  generateConversationId(): string;
  validateConversationId(conversationId: string): string | null | undefined;
  getTimestamp(): number;
  saveConversation(conversation: TConversation, preserveTimestamp: boolean): ConversationMaybePromise<void>;
  deleteConversation(conversationId: string): ConversationMaybePromise<void>;
  deleteAllConversations(): ConversationMaybePromise<void>;
}

export interface ConversationActionPersistenceService<TConversation extends ServerConversationRecord<any> = ServerConversationRecord<any>> {
  loadConversation(conversationId: string): ConversationMaybePromise<TConversation | null | undefined>;
  getConversationHistory(): ConversationMaybePromise<ServerConversation[]>;
  saveConversation(conversation: TConversation, preserveTimestamp: boolean): ConversationMaybePromise<void>;
  deleteConversation(conversationId: string): ConversationMaybePromise<void>;
  deleteAllConversations(): ConversationMaybePromise<void>;
}

export interface ConversationActionServiceAdapterOptions<TConversation extends ServerConversationRecord<any> = ServerConversationRecord<any>> {
  service: ConversationActionPersistenceService<TConversation>;
  generateConversationId(): string;
  validateConversationId(conversationId: string): string | null | undefined;
  now?: () => number;
}

export function createConversationActionService<TConversation extends ServerConversationRecord<any>>(
  options: ConversationActionServiceAdapterOptions<TConversation>,
): ConversationActionService<TConversation> {
  const { service } = options;
  return {
    loadConversation: (conversationId) => service.loadConversation(conversationId),
    getConversationHistory: () => service.getConversationHistory(),
    generateConversationId: () => options.generateConversationId(),
    validateConversationId: (conversationId) => options.validateConversationId(conversationId),
    getTimestamp: () => (options.now ?? Date.now)(),
    saveConversation: (conversation, preserveTimestamp) => service.saveConversation(conversation, preserveTimestamp),
    deleteConversation: (conversationId) => service.deleteConversation(conversationId),
    deleteAllConversations: () => service.deleteAllConversations(),
  };
}

export interface ConversationActionOptions<TConversation extends ServerConversationRecord<any> = ServerConversationRecord<any>> {
  service: ConversationActionService<TConversation>;
  diagnostics: ConversationActionDiagnostics;
}

export interface ConversationRouteActions {
  getConversation(id: string | undefined): Promise<ConversationActionResult>;
  getConversations(): Promise<ConversationActionResult>;
  createConversation(body: unknown, onChanged: () => void): Promise<ConversationActionResult>;
  updateConversation(
    id: string | undefined,
    body: unknown,
    onChanged: () => void,
  ): Promise<ConversationActionResult>;
  branchConversation(
    id: string | undefined,
    body: unknown,
    onChanged: () => void,
  ): Promise<ConversationActionResult>;
  deleteConversation(
    id: string | undefined,
    onChanged: () => void,
  ): Promise<ConversationActionResult>;
  deleteAllConversations(onChanged: () => void): Promise<ConversationActionResult>;
}

const VALID_ROLES = ['user', 'assistant', 'tool'] as const;

export interface ServerConversationRecordMessage extends ServerConversationMessage {
  id: string;
  timestamp: number;
  displayContent?: string;
  isSummary?: boolean;
  summarizedMessageCount?: number;
}

export interface ServerConversationRecord<TMetadata = unknown> {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ServerConversationRecordMessage[];
  rawMessages?: ServerConversationRecordMessage[];
  compaction?: ConversationCompactionMetadata;
  metadata?: TMetadata;
  branchSource?: {
    sourceConversationId: string;
    sourceMessageIndex: number;
    branchedAt: number;
  };
}

export type ConversationRequestParseResult<T> =
  | { ok: true; request: T }
  | { ok: false; statusCode: 400; error: string };

export type ConversationBuildResult =
  | { ok: true; conversation: ServerConversationRecord<never> }
  | { ok: false; statusCode: 400; error: string };

export type BranchConversationBuildResult<TConversation extends ServerConversationRecord<any>> =
  | { ok: true; conversation: TConversation }
  | { ok: false; statusCode: 400; error: string; messageCount: number };

export type ServerConversationMessageIdFactory = (timestamp: number, index: number) => string;

export interface AppendServerConversationMessageRequest {
  id: string;
  role: ServerConversationRecordMessage['role'];
  content: string;
  timestamp: number;
  toolCalls?: ServerConversationRecordMessage['toolCalls'];
  toolResults?: ServerConversationRecordMessage['toolResults'];
  displayContent?: string;
}

export interface AppendServerConversationMessageResult<TConversation extends ServerConversationRecord<any>> {
  conversation: TConversation;
  message: ServerConversationRecordMessage;
  appended: boolean;
}

export type RenameServerConversationTitleResult<TConversation extends ServerConversationRecord<any>> =
  | { ok: true; conversation: TConversation; title: string; changed: boolean }
  | { ok: false; error: string };

export interface BuildServerConversationHistoryItemOptions {
  maxLastMessageChars?: number;
  maxPreviewChars?: number;
}

export interface BuildServerConversationCompactionCheckpointMetadataOptions {
  existing?: ConversationCompactionMetadata;
  fullMessageHistory: ServerConversationRecordMessage[];
  summaryMessage: ServerConversationRecordMessage;
  summarizedMessageCount?: number;
  tokensBefore: number;
  compactedAt?: number;
  maxExtractedFacts?: number;
}

export interface BuildServerConversationCompactionSummaryInputOptions {
  maxContentChars?: number;
  maxToolArgumentChars?: number;
  maxToolResultChars?: number;
}

export type LimitedServerConversationRecord<TConversation extends ServerConversationRecord<any>> = TConversation & {
  messageOffset?: number;
  totalMessageCount?: number;
  branchMessageIndexOffset?: number;
};

export function createServerConversationMessageId(timestamp: number, index: number): string {
  return `msg_${timestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`;
}

function isRequestObject(body: unknown): body is Record<string, unknown> {
  return !!body && typeof body === 'object' && !Array.isArray(body);
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeOptionalTimestamp(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeServerConversationMessages(
  messages: unknown,
  invalidArrayError: string,
): { ok: true; messages: ServerConversationMessage[] } | { ok: false; error: string } {
  if (!Array.isArray(messages)) {
    return { ok: false, error: invalidArrayError };
  }

  const normalizedMessages: ServerConversationMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!isRequestObject(msg)) {
      return { ok: false, error: `Invalid message ${i}: expected an object` };
    }

    const role = msg.role;
    if (!role || !VALID_ROLES.includes(role as any)) {
      return { ok: false, error: `Invalid role in message ${i}: expected one of ${VALID_ROLES.join(', ')}` };
    }

    if (typeof msg.content !== 'string') {
      return { ok: false, error: `Invalid content in message ${i}: expected string` };
    }

    normalizedMessages.push({
      id: normalizeOptionalString(msg.id),
      role: role as ServerConversationMessage['role'],
      content: msg.content,
      timestamp: normalizeOptionalTimestamp(msg.timestamp),
      toolCalls: msg.toolCalls as ServerConversationMessage['toolCalls'],
      toolResults: msg.toolResults as ServerConversationMessage['toolResults'],
    });
  }

  return { ok: true, messages: normalizedMessages };
}

export function parseCreateConversationRequestBody(
  body: unknown,
): ConversationRequestParseResult<CreateConversationRequest> {
  if (!isRequestObject(body)) {
    return { ok: false, statusCode: 400, error: 'Request body must be a JSON object' };
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return { ok: false, statusCode: 400, error: 'Missing or invalid messages array' };
  }

  const normalizedMessages = normalizeServerConversationMessages(body.messages, 'Missing or invalid messages array');
  if (normalizedMessages.ok === false) {
    return { ok: false, statusCode: 400, error: normalizedMessages.error };
  }

  return {
    ok: true,
    request: {
      title: normalizeOptionalString(body.title),
      messages: normalizedMessages.messages,
      createdAt: normalizeOptionalTimestamp(body.createdAt),
      updatedAt: normalizeOptionalTimestamp(body.updatedAt),
    },
  };
}

export function parseUpdateConversationRequestBody(
  body: unknown,
): ConversationRequestParseResult<UpdateConversationRequest> {
  if (!isRequestObject(body)) {
    return { ok: false, statusCode: 400, error: 'Request body must be a JSON object' };
  }

  const request: UpdateConversationRequest = {
    title: normalizeOptionalString(body.title),
    updatedAt: normalizeOptionalTimestamp(body.updatedAt),
  };

  if (body.messages !== undefined) {
    const normalizedMessages = normalizeServerConversationMessages(body.messages, 'messages field must be an array');
    if (normalizedMessages.ok === false) {
      return { ok: false, statusCode: 400, error: normalizedMessages.error };
    }
    request.messages = normalizedMessages.messages;
  }

  return { ok: true, request };
}

export function parseBranchConversationRequestBody(
  body: unknown,
): ConversationRequestParseResult<BranchConversationRequest> {
  if (!isRequestObject(body)) {
    return { ok: false, statusCode: 400, error: 'Request body must be a JSON object' };
  }

  if (typeof body.messageIndex !== 'number' || !Number.isInteger(body.messageIndex)) {
    return { ok: false, statusCode: 400, error: 'Missing or invalid messageIndex' };
  }

  return {
    ok: true,
    request: {
      messageIndex: body.messageIndex,
    },
  };
}

export function buildServerConversationTitle(
  requestedTitle: string | undefined,
  messages: ServerConversationMessage[],
): string {
  if (requestedTitle) {
    return requestedTitle;
  }

  const firstMessageContent = messages[0]?.content || '';
  if (!firstMessageContent) {
    return 'New Conversation';
  }

  return generateConversationTitleFromMessage(firstMessageContent);
}

export function renameServerConversationTitle<TConversation extends ServerConversationRecord<any>>(
  conversation: TConversation,
  title: string,
  options: { maxChars?: number } = {},
): RenameServerConversationTitleResult<TConversation> {
  const normalizedTitle = normalizeConversationTitleText(title, { maxChars: options.maxChars });
  if (!normalizedTitle) {
    return { ok: false, error: 'Missing title' };
  }

  if (normalizeConversationTitleText(conversation.title, { maxChars: options.maxChars }) === normalizedTitle) {
    return {
      ok: true,
      conversation,
      title: normalizedTitle,
      changed: false,
    };
  }

  conversation.title = normalizedTitle;
  return {
    ok: true,
    conversation,
    title: normalizedTitle,
    changed: true,
  };
}

export function buildServerConversationMessages(
  messages: ServerConversationMessage[],
  timestamp: number,
  messageIdFactory: ServerConversationMessageIdFactory = createServerConversationMessageId,
): ServerConversationRecordMessage[] {
  return messages.map((msg, index) => ({
    id: messageIdFactory(timestamp, index),
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp ?? timestamp,
    toolCalls: msg.toolCalls,
    toolResults: msg.toolResults,
  }));
}

export function getStoredServerConversationMessages<TConversation extends ServerConversationRecord<any>>(
  conversation: TConversation,
): ServerConversationRecordMessage[] {
  return Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0
    ? conversation.rawMessages
    : conversation.messages;
}

export function toServerConversationHistorySnippet(value: string, maxChars: number): string {
  const sanitized = sanitizeMessageContentForDisplay(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized.length > maxChars
    ? `${sanitized.slice(0, maxChars).trim()}…`
    : sanitized;
}

export function getRepresentedServerConversationMessageCount<TConversation extends ServerConversationRecord<any>>(
  conversation: TConversation,
): number {
  const summaryMessages = conversation.messages.filter((message) => message.isSummary);
  if (summaryMessages.length > 0) {
    const summarizedMessageCount = summaryMessages.reduce(
      (total, message) => total + (message.summarizedMessageCount ?? 0),
      0,
    );
    return summarizedMessageCount + conversation.messages.filter((message) => !message.isSummary).length;
  }

  return getStoredServerConversationMessages(conversation).length;
}

export function estimateServerConversationCompactionTokensFromText(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function getValidServerConversationCompactionTimestamp(...candidates: Array<number | undefined>): number {
  for (const candidate of candidates) {
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) continue;
    if (!Number.isFinite(new Date(candidate).getTime())) continue;
    return candidate;
  }
  return Date.now();
}

export function normalizeServerConversationSummarizedMessageCount(
  count: number | undefined,
  rawMessageCount: number,
): number {
  if (typeof count !== 'number' || !Number.isFinite(count)) return 0;
  return Math.min(Math.max(0, Math.floor(count)), rawMessageCount);
}

export function hasPersistedServerConversationCompactionCheckpoint(
  compaction: ConversationCompactionMetadata | undefined,
): boolean {
  return !!(
    compaction?.summary?.trim() &&
    (
      compaction.firstKeptMessageId ||
      typeof compaction.firstKeptMessageIndex === 'number' ||
      compaction.summarizedRange
    )
  );
}

export function buildServerConversationCompactionSummaryInput(
  messages: ServerConversationRecordMessage[],
  options: BuildServerConversationCompactionSummaryInputOptions = {},
): string {
  const maxContentChars = options.maxContentChars ?? 500;
  const maxToolArgumentChars = options.maxToolArgumentChars ?? 200;
  const maxToolResultChars = options.maxToolResultChars ?? 200;

  return messages
    .map((message) => {
      const sanitizedContent = sanitizeMessageContentForDisplay(message.content || '');
      let text = `${message.role}: ${sanitizedContent.substring(0, maxContentChars) || '(empty)'}`;

      if (message.toolCalls && message.toolCalls.length > 0) {
        const toolCallsText = message.toolCalls
          .map((toolCall) => {
            const argsText = JSON.stringify(toolCall.arguments).substring(0, maxToolArgumentChars);
            return `${toolCall.name}(${argsText})`;
          })
          .join(', ');
        text += `\nTool calls: ${toolCallsText}`;
      }

      if (message.toolResults && message.toolResults.length > 0) {
        const toolResultsText = message.toolResults
          .map((toolResult) => {
            const status = toolResult.success ? 'success' : 'error';
            const content = (toolResult.error || toolResult.content || '').substring(0, maxToolResultChars);
            return `${status}: ${content}`;
          })
          .join(', ');
        text += `\nTool results: ${toolResultsText}`;
      }

      return text;
    })
    .join('\n\n');
}

export function buildServerConversationCompactionPrompt(summaryInput: string): string {
  return `Summarize this conversation history concisely, preserving key facts, decisions, and context:\n\n${summaryInput}`;
}

export function buildServerConversationCompactionCheckpointMetadata(
  options: BuildServerConversationCompactionCheckpointMetadataOptions,
): ConversationCompactionMetadata {
  const {
    existing,
    fullMessageHistory,
    summaryMessage,
    summarizedMessageCount,
    tokensBefore,
    compactedAt = Date.now(),
    maxExtractedFacts = 8,
  } = options;
  const normalizedSummarizedMessageCount = normalizeServerConversationSummarizedMessageCount(
    summarizedMessageCount,
    fullMessageHistory.length,
  );
  const summarizedMessages = fullMessageHistory.slice(0, normalizedSummarizedMessageCount);
  const firstKeptMessage = fullMessageHistory[normalizedSummarizedMessageCount];
  const firstSummarizedMessage = summarizedMessages[0];
  const lastSummarizedMessage = summarizedMessages[summarizedMessages.length - 1];

  return {
    ...existing,
    rawHistoryPreserved: true,
    storedRawMessageCount: fullMessageHistory.length,
    representedMessageCount: fullMessageHistory.length,
    compactedAt,
    summary: summaryMessage.content,
    summaryMessageId: summaryMessage.id,
    firstKeptMessageId: firstKeptMessage?.id,
    firstKeptMessageIndex: firstKeptMessage ? normalizedSummarizedMessageCount : undefined,
    summarizedRange: summarizedMessages.length > 0
      ? {
        startMessageId: firstSummarizedMessage?.id,
        endMessageId: lastSummarizedMessage?.id,
        startIndex: 0,
        endIndex: summarizedMessages.length - 1,
      }
      : undefined,
    summarizedMessageCount: normalizedSummarizedMessageCount,
    tokensBefore,
    extractedFacts: extractHighSignalFactsFromConversationMessages(summarizedMessages, {
      maxFacts: maxExtractedFacts,
    }),
  };
}

export function syncServerConversationStorageMetadata<TConversation extends ServerConversationRecord<any>>(
  conversation: TConversation,
): boolean {
  let changed = false;

  if (Array.isArray(conversation.rawMessages) && conversation.rawMessages.length === 0) {
    delete conversation.rawMessages;
    changed = true;
  }

  const hasSummaryMessages = conversation.messages.some((message) => message.isSummary);
  const hasRawMessages = Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0;
  const isLegacyPartial = hasSummaryMessages && !hasRawMessages;

  if (!hasSummaryMessages && !hasRawMessages) {
    if (conversation.compaction) {
      delete conversation.compaction;
      changed = true;
    }
    return changed;
  }

  const nextCompaction: ConversationCompactionMetadata = {
    ...conversation.compaction,
    rawHistoryPreserved: !isLegacyPartial,
    storedRawMessageCount: hasRawMessages ? conversation.rawMessages?.length : undefined,
    representedMessageCount: getRepresentedServerConversationMessageCount(conversation),
    partialReason: isLegacyPartial ? 'legacy_summary_without_raw_messages' : undefined,
  };

  if (!hasSummaryMessages) {
    delete nextCompaction.compactedAt;
    delete nextCompaction.summary;
    delete nextCompaction.summaryMessageId;
    delete nextCompaction.firstKeptMessageId;
    delete nextCompaction.firstKeptMessageIndex;
    delete nextCompaction.summarizedRange;
    delete nextCompaction.summarizedMessageCount;
    delete nextCompaction.tokensBefore;
    delete nextCompaction.extractedFacts;
  }

  const previousCompactionJson = conversation.compaction
    ? JSON.stringify(conversation.compaction)
    : null;
  const nextCompactionJson = JSON.stringify(nextCompaction);

  if (previousCompactionJson !== nextCompactionJson) {
    conversation.compaction = nextCompaction;
    changed = true;
  }

  return changed;
}

export function getRepresentedServerConversationMessageSliceCount(
  messages: ServerConversationRecordMessage[],
): number {
  return messages.reduce((total, message) => {
    if (message.isSummary) {
      return total + Math.max(message.summarizedMessageCount ?? 0, 1);
    }
    return total + 1;
  }, 0);
}

export function applyServerConversationMessageLimit<TConversation extends ServerConversationRecord<any>>(
  conversation: TConversation,
  messageLimit?: number,
): LimitedServerConversationRecord<TConversation> {
  const normalizedLimit = typeof messageLimit === 'number' && Number.isFinite(messageLimit)
    ? Math.max(0, Math.floor(messageLimit ?? 0))
    : 0;

  if (normalizedLimit <= 0) {
    return conversation;
  }

  const totalMessageCount = conversation.messages.length;
  const messageOffset = Math.max(0, totalMessageCount - normalizedLimit);
  const branchMessageIndexOffset = getRepresentedServerConversationMessageSliceCount(
    conversation.messages.slice(0, messageOffset),
  );
  const { rawMessages: _rawMessages, ...conversationWithoutRawMessages } = conversation;

  return {
    ...conversationWithoutRawMessages,
    messages: conversation.messages.slice(messageOffset),
    messageOffset,
    totalMessageCount,
    branchMessageIndexOffset,
  } as LimitedServerConversationRecord<TConversation>;
}

export function buildServerConversationHistoryItem<TConversation extends ServerConversationRecord<any>>(
  conversation: TConversation,
  options: BuildServerConversationHistoryItemOptions = {},
): ServerConversation {
  const maxLastMessageChars = options.maxLastMessageChars ?? 500;
  const maxPreviewChars = options.maxPreviewChars ?? 200;
  const storedMessages = getStoredServerConversationMessages(conversation);
  const visibleMessages = filterVisibleChatMessages(storedMessages);
  const lastMessage = visibleMessages[visibleMessages.length - 1] || storedMessages[storedMessages.length - 1];

  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messageCount: getRepresentedServerConversationMessageCount(conversation),
    lastMessage: toServerConversationHistorySnippet(lastMessage?.content || '', maxLastMessageChars),
    preview: buildConversationPreview(visibleMessages, { maxPreviewChars }),
  };
}

export function getBranchableServerConversationMessages<TConversation extends ServerConversationRecord<any>>(
  conversation: TConversation,
): ServerConversationRecordMessage[] {
  return getStoredServerConversationMessages(conversation);
}

export function isConsecutiveServerConversationMessageDuplicate(
  lastMessage: ServerConversationRecordMessage | undefined,
  role: ServerConversationRecordMessage['role'],
  content: string,
): boolean {
  const incomingContent = (content || '').trim();
  const lastContent = (lastMessage?.content || '').trim();
  return !!lastMessage && lastMessage.role === role && lastContent === incomingContent;
}

export function appendServerConversationMessage<TConversation extends ServerConversationRecord<any>>(
  conversation: TConversation,
  request: AppendServerConversationMessageRequest,
): AppendServerConversationMessageResult<TConversation> {
  const storedMessages = getStoredServerConversationMessages(conversation);
  const lastStoredMessage = storedMessages[storedMessages.length - 1];

  if (isConsecutiveServerConversationMessageDuplicate(lastStoredMessage, request.role, request.content)) {
    if (request.displayContent && lastStoredMessage.displayContent !== request.displayContent) {
      lastStoredMessage.displayContent = request.displayContent;
    }

    const displayedLastMessage = conversation.messages[conversation.messages.length - 1];
    if (
      displayedLastMessage &&
      displayedLastMessage !== lastStoredMessage &&
      isConsecutiveServerConversationMessageDuplicate(displayedLastMessage, request.role, request.content) &&
      request.displayContent &&
      displayedLastMessage.displayContent !== request.displayContent
    ) {
      displayedLastMessage.displayContent = request.displayContent;
    }

    conversation.updatedAt = request.timestamp;
    return {
      conversation,
      message: lastStoredMessage,
      appended: false,
    };
  }

  const message: ServerConversationRecordMessage = {
    id: request.id,
    role: request.role,
    content: request.content,
    timestamp: request.timestamp,
    toolCalls: request.toolCalls,
    toolResults: request.toolResults,
    ...(request.displayContent ? { displayContent: request.displayContent } : {}),
  };

  conversation.messages.push(message);
  if (Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0) {
    conversation.rawMessages.push(message);
  }
  conversation.updatedAt = request.timestamp;

  return {
    conversation,
    message,
    appended: true,
  };
}

export function buildBranchedServerConversation<TConversation extends ServerConversationRecord<any>>(
  sourceConversation: TConversation,
  options: {
    sourceConversationId: string;
    conversationId: string;
    messageIndex: number;
    timestamp: number;
    messageIdFactory?: ServerConversationMessageIdFactory;
  },
): BranchConversationBuildResult<TConversation> {
  const sourceMessages = getBranchableServerConversationMessages(sourceConversation);
  if (options.messageIndex < 0 || options.messageIndex >= sourceMessages.length) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Invalid messageIndex',
      messageCount: sourceMessages.length,
    };
  }

  const messageIdFactory = options.messageIdFactory ?? createServerConversationMessageId;
  const branchedMessages = sourceMessages
    .slice(0, options.messageIndex + 1)
    .map((message, index) => ({
      ...message,
      id: messageIdFactory(message.timestamp ?? options.timestamp, index),
      timestamp: message.timestamp ?? options.timestamp,
    }));

  return {
    ok: true,
    conversation: {
      id: options.conversationId,
      title: `Branch: ${sourceConversation.title}`,
      createdAt: options.timestamp,
      updatedAt: options.timestamp,
      messages: branchedMessages,
      branchSource: {
        sourceConversationId: options.sourceConversationId,
        sourceMessageIndex: options.messageIndex,
        branchedAt: options.timestamp,
      },
    } as TConversation,
  };
}

export function buildNewServerConversation(
  conversationId: string,
  request: CreateConversationRequest,
  timestamp: number,
  messageIdFactory: ServerConversationMessageIdFactory = createServerConversationMessageId,
): ServerConversationRecord<never> {
  return {
    id: conversationId,
    title: buildServerConversationTitle(request.title, request.messages),
    createdAt: request.createdAt ?? timestamp,
    updatedAt: request.updatedAt ?? timestamp,
    messages: buildServerConversationMessages(request.messages, timestamp, messageIdFactory),
  };
}

export function buildNewServerConversationFromUpdateRequest(
  conversationId: string,
  request: UpdateConversationRequest,
  timestamp: number,
  messageIdFactory: ServerConversationMessageIdFactory = createServerConversationMessageId,
): ConversationBuildResult {
  if (!request.messages || request.messages.length === 0) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Conversation not found and no messages provided to create it',
    };
  }

  return {
    ok: true,
    conversation: {
      id: conversationId,
      title: buildServerConversationTitle(request.title, request.messages),
      createdAt: timestamp,
      updatedAt: request.updatedAt ?? timestamp,
      messages: buildServerConversationMessages(request.messages, timestamp, messageIdFactory),
    },
  };
}

export function buildServerConversationsResponse(
  conversations: ServerConversation[],
): ServerConversationsResponse {
  return { conversations };
}

export function applyServerConversationUpdate<T extends ServerConversationRecord<any>>(
  conversation: T,
  request: UpdateConversationRequest,
  timestamp: number,
  messageIdFactory: ServerConversationMessageIdFactory = createServerConversationMessageId,
): T {
  return {
    ...conversation,
    title: request.title !== undefined ? request.title : conversation.title,
    messages: request.messages !== undefined
      ? buildServerConversationMessages(request.messages, timestamp, messageIdFactory)
      : conversation.messages,
    updatedAt: request.updatedAt ?? timestamp,
  } as T;
}

export function buildServerConversationFullResponse(
  conversation: ServerConversationRecord<any>,
  options: { includeMetadata?: boolean } = {},
): ServerConversationFull {
  const response: ServerConversationFull = {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: conversation.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      toolCalls: msg.toolCalls,
      toolResults: msg.toolResults,
    })),
  };

  if (options.includeMetadata && conversation.metadata !== undefined) {
    response.metadata = conversation.metadata as Record<string, unknown>;
  }

  return response;
}

export function buildServerConversationDeleteResponse(conversationId: string): ConversationDeleteResponse {
  return {
    success: true,
    id: conversationId,
  };
}

export function buildServerConversationsDeleteAllResponse(): ConversationsDeleteAllResponse {
  return { success: true };
}

function conversationActionOk(body: unknown, statusCode = 200, headers?: Record<string, string>): ConversationActionResult {
  return {
    statusCode,
    body,
    ...(headers ? { headers } : {}),
  };
}

function conversationActionError(statusCode: number, message: string, headers?: Record<string, string>): ConversationActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(headers ? { headers } : {}),
  };
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}

function getConversationIdActionError(
  conversationId: string | undefined,
  options: ConversationActionOptions<any>,
): string | null {
  if (!conversationId) {
    return 'Missing or invalid conversation ID';
  }

  return options.service.validateConversationId(conversationId) ?? null;
}

export async function getConversationAction<TConversation extends ServerConversationRecord<any>>(
  id: string | undefined,
  options: ConversationActionOptions<TConversation>,
): Promise<ConversationActionResult> {
  try {
    const conversationId = id;
    const conversationIdError = getConversationIdActionError(conversationId, options);
    if (conversationIdError) {
      return conversationActionError(400, conversationIdError);
    }
    if (!conversationId) {
      return conversationActionError(400, 'Missing or invalid conversation ID');
    }

    const conversation = await options.service.loadConversation(conversationId);

    if (!conversation) {
      return conversationActionError(404, 'Conversation not found');
    }

    options.diagnostics.logInfo('conversation-actions', `Fetched conversation ${conversationId} for recovery`);

    return conversationActionOk(buildServerConversationFullResponse(conversation, { includeMetadata: true }));
  } catch (caughtError) {
    options.diagnostics.logError('conversation-actions', 'Failed to fetch conversation', caughtError);
    return conversationActionError(500, getUnknownErrorMessage(caughtError, 'Failed to fetch conversation'));
  }
}

export async function getConversationsAction<TConversation extends ServerConversationRecord<any>>(
  options: ConversationActionOptions<TConversation>,
): Promise<ConversationActionResult> {
  try {
    const conversations = await options.service.getConversationHistory();
    options.diagnostics.logInfo('conversation-actions', `Listed ${conversations.length} conversations`);
    return conversationActionOk(buildServerConversationsResponse(conversations));
  } catch (caughtError) {
    options.diagnostics.logError('conversation-actions', 'Failed to list conversations', caughtError);
    return conversationActionError(500, getUnknownErrorMessage(caughtError, 'Failed to list conversations'));
  }
}

export async function createConversationAction<TConversation extends ServerConversationRecord<any>>(
  body: unknown,
  onChanged: () => void,
  options: ConversationActionOptions<TConversation>,
): Promise<ConversationActionResult> {
  try {
    const parsedRequest = parseCreateConversationRequestBody(body);
    if (parsedRequest.ok === false) {
      return conversationActionError(parsedRequest.statusCode, parsedRequest.error);
    }

    const conversationId = options.service.generateConversationId();
    const timestamp = options.service.getTimestamp();
    const conversation = buildNewServerConversation(conversationId, parsedRequest.request, timestamp) as unknown as TConversation;

    await options.service.saveConversation(conversation, true);
    options.diagnostics.logInfo(
      'conversation-actions',
      `Created conversation ${conversationId} with ${conversation.messages.length} messages`,
    );

    onChanged();

    return conversationActionOk(buildServerConversationFullResponse(conversation), 201);
  } catch (caughtError) {
    options.diagnostics.logError('conversation-actions', 'Failed to create conversation', caughtError);
    return conversationActionError(500, getUnknownErrorMessage(caughtError, 'Failed to create conversation'));
  }
}

export async function updateConversationAction<TConversation extends ServerConversationRecord<any>>(
  id: string | undefined,
  body: unknown,
  onChanged: () => void,
  options: ConversationActionOptions<TConversation>,
): Promise<ConversationActionResult> {
  try {
    const conversationId = id;
    const conversationIdError = getConversationIdActionError(conversationId, options);
    if (conversationIdError) {
      return conversationActionError(400, conversationIdError);
    }
    if (!conversationId) {
      return conversationActionError(400, 'Missing or invalid conversation ID');
    }

    const parsedRequest = parseUpdateConversationRequestBody(body);
    if (parsedRequest.ok === false) {
      return conversationActionError(parsedRequest.statusCode, parsedRequest.error);
    }

    const timestamp = options.service.getTimestamp();
    let conversation = await options.service.loadConversation(conversationId);

    if (!conversation) {
      const buildResult = buildNewServerConversationFromUpdateRequest(conversationId, parsedRequest.request, timestamp);
      if (buildResult.ok === false) {
        return conversationActionError(buildResult.statusCode, buildResult.error);
      }

      conversation = buildResult.conversation as unknown as TConversation;
      await options.service.saveConversation(conversation, true);
      options.diagnostics.logInfo(
        'conversation-actions',
        `Created conversation ${conversationId} via PUT with ${conversation.messages.length} messages`,
      );
    } else {
      conversation = applyServerConversationUpdate(conversation, parsedRequest.request, timestamp);
      await options.service.saveConversation(conversation, true);
      options.diagnostics.logInfo('conversation-actions', `Updated conversation ${conversationId}`);
    }

    onChanged();

    return conversationActionOk(buildServerConversationFullResponse(conversation));
  } catch (caughtError) {
    options.diagnostics.logError('conversation-actions', 'Failed to update conversation', caughtError);
    return conversationActionError(500, getUnknownErrorMessage(caughtError, 'Failed to update conversation'));
  }
}

export async function branchConversationAction<TConversation extends ServerConversationRecord<any>>(
  id: string | undefined,
  body: unknown,
  onChanged: () => void,
  options: ConversationActionOptions<TConversation>,
): Promise<ConversationActionResult> {
  try {
    const conversationId = id;
    const conversationIdError = getConversationIdActionError(conversationId, options);
    if (conversationIdError) {
      return conversationActionError(400, conversationIdError);
    }
    if (!conversationId) {
      return conversationActionError(400, 'Missing or invalid conversation ID');
    }

    const parsedRequest = parseBranchConversationRequestBody(body);
    if (parsedRequest.ok === false) {
      return conversationActionError(parsedRequest.statusCode, parsedRequest.error);
    }

    const sourceConversation = await options.service.loadConversation(conversationId);
    if (!sourceConversation) {
      return conversationActionError(404, 'Conversation not found');
    }

    const messageIndex = parsedRequest.request.messageIndex;
    const timestamp = options.service.getTimestamp();
    const branchConversationId = options.service.generateConversationId();
    const buildResult = buildBranchedServerConversation(sourceConversation, {
      sourceConversationId: conversationId,
      conversationId: branchConversationId,
      messageIndex,
      timestamp,
    });
    if (buildResult.ok === false) {
      return conversationActionError(buildResult.statusCode, buildResult.error);
    }

    await options.service.saveConversation(buildResult.conversation, true);
    options.diagnostics.logInfo(
      'conversation-actions',
      `Branched conversation ${conversationId} at message ${messageIndex} -> ${branchConversationId}`,
    );

    onChanged();

    return conversationActionOk(buildServerConversationFullResponse(buildResult.conversation), 201);
  } catch (caughtError) {
    options.diagnostics.logError('conversation-actions', 'Failed to branch conversation', caughtError);
    return conversationActionError(500, getUnknownErrorMessage(caughtError, 'Failed to branch conversation'));
  }
}

export async function deleteConversationAction<TConversation extends ServerConversationRecord<any>>(
  id: string | undefined,
  onChanged: () => void,
  options: ConversationActionOptions<TConversation>,
): Promise<ConversationActionResult> {
  try {
    const conversationId = id;
    const conversationIdError = getConversationIdActionError(conversationId, options);
    if (conversationIdError) {
      return conversationActionError(400, conversationIdError);
    }
    if (!conversationId) {
      return conversationActionError(400, 'Missing or invalid conversation ID');
    }

    const conversation = await options.service.loadConversation(conversationId);
    if (!conversation) {
      return conversationActionError(404, 'Conversation not found');
    }

    await options.service.deleteConversation(conversationId);
    options.diagnostics.logInfo('conversation-actions', `Deleted conversation ${conversationId}`);

    onChanged();

    return conversationActionOk(buildServerConversationDeleteResponse(conversationId));
  } catch (caughtError) {
    options.diagnostics.logError('conversation-actions', 'Failed to delete conversation', caughtError);
    return conversationActionError(500, getUnknownErrorMessage(caughtError, 'Failed to delete conversation'));
  }
}

export async function deleteAllConversationsAction<TConversation extends ServerConversationRecord<any>>(
  onChanged: () => void,
  options: ConversationActionOptions<TConversation>,
): Promise<ConversationActionResult> {
  try {
    await options.service.deleteAllConversations();
    options.diagnostics.logInfo('conversation-actions', 'Deleted all conversations');

    onChanged();

    return conversationActionOk(buildServerConversationsDeleteAllResponse());
  } catch (caughtError) {
    options.diagnostics.logError('conversation-actions', 'Failed to delete all conversations', caughtError);
    return conversationActionError(500, getUnknownErrorMessage(caughtError, 'Failed to delete all conversations'));
  }
}

export function createConversationRouteActions<TConversation extends ServerConversationRecord<any>>(
  options: ConversationActionOptions<TConversation>,
): ConversationRouteActions {
  return {
    getConversation: (id) => getConversationAction(id, options),
    getConversations: () => getConversationsAction(options),
    createConversation: (body, onChanged) => createConversationAction(body, onChanged, options),
    updateConversation: (id, body, onChanged) => updateConversationAction(id, body, onChanged, options),
    branchConversation: (id, body, onChanged) => branchConversationAction(id, body, onChanged, options),
    deleteConversation: (id, onChanged) => deleteConversationAction(id, onChanged, options),
    deleteAllConversations: (onChanged) => deleteAllConversationsAction(onChanged, options),
  };
}

/**
 * Convert an app session message to server message format.
 */
export function toServerConversationMessage(msg: SessionChatMessage): ServerConversationMessage {
  // Normalize role to valid values - default to 'user' for legacy/invalid data.
  const role: 'user' | 'assistant' | 'tool' = VALID_ROLES.includes(msg.role as any)
    ? (msg.role as 'user' | 'assistant' | 'tool')
    : 'user';

  return {
    role,
    content: msg.content,
    timestamp: msg.timestamp,
    toolCalls: msg.toolCalls,
    toolResults: msg.toolResults,
  };
}

/**
 * Convert a server message to app session message format.
 */
export function fromServerConversationMessage(msg: ServerConversationMessage, index: number): SessionChatMessage {
  // Use nullish coalescing so timestamp=0 is not treated as "missing".
  const timestamp = msg.timestamp ?? Date.now();
  return {
    id: createServerConversationMessageId(timestamp, index),
    role: msg.role,
    content: msg.content,
    timestamp,
    toolCalls: msg.toolCalls as SessionChatMessage['toolCalls'],
    toolResults: msg.toolResults as SessionChatMessage['toolResults'],
  };
}

/**
 * Convert a full server conversation to an app Session with messages.
 */
export function serverConversationToSession(conv: ServerConversationFull): Session {
  return {
    id: generateSessionId(),
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messages: conv.messages.map(fromServerConversationMessage),
    serverConversationId: conv.id,
    metadata: conv.metadata as Session['metadata'],
  };
}

/**
 * Convert a server conversation list item to a lazy stub Session.
 */
export function serverConversationToStubSession(item: ServerConversation): Session {
  return {
    id: generateSessionId(),
    title: item.title,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    messages: [],
    serverConversationId: item.id,
    serverMetadata: {
      messageCount: item.messageCount,
      lastMessage: (item.lastMessage || '').substring(0, 100),
      preview: (item.preview || '').substring(0, 200),
    },
  };
}

/**
 * Sync conversations between app-local sessions and the DotAgents server.
 *
 * Strategy:
 * 1. Fetch list of all server conversations
 * 2. For each local session:
 *    - If it has a serverConversationId: compare updatedAt, sync if needed
 *    - If no serverConversationId and has messages: push to server
 * 3. For each server conversation not in local sessions: pull and create local stub
 */
export async function syncConversations(
  client: ConversationSyncClient,
  localSessions: Session[],
  options: SyncConversationOptions = {},
): Promise<{ result: SyncResult; sessions: Session[] }> {
  const result: SyncResult = {
    pulled: 0,
    pushed: 0,
    updated: 0,
    errors: [],
  };

  const updatedSessions: Session[] = [...localSessions];
  const pendingCreateSessionIds = options.pendingCreateSessionIds ?? new Set<string>();
  const shouldDeferUnmatchedPulls = pendingCreateSessionIds.size > 0;

  try {
    const { conversations: serverList } = await client.getConversations();

    const localByServerId = new Map<string, { session: Session; index: number }>();
    localSessions.forEach((session, index) => {
      if (session.serverConversationId) {
        localByServerId.set(session.serverConversationId, { session, index });
      }
    });

    // Key: "createdAt|title" to most recently updated ServerConversation.
    const serverByContentKey = new Map<string, ServerConversation>();
    for (const serverConversation of serverList) {
      const key = `${serverConversation.createdAt}|${serverConversation.title}`;
      const existing = serverByContentKey.get(key);
      if (!existing || serverConversation.updatedAt > existing.updatedAt) {
        serverByContentKey.set(key, serverConversation);
      }
    }

    for (let i = 0; i < updatedSessions.length; i++) {
      const session = updatedSessions[i];

      if (session.serverConversationId) {
        const serverItem = serverList.find((conversation) => conversation.id === session.serverConversationId);

        if (serverItem) {
          if (serverItem.updatedAt > session.updatedAt) {
            try {
              const fullConv = await client.getConversation(session.serverConversationId);
              updatedSessions[i] = {
                ...session,
                title: fullConv.title,
                updatedAt: fullConv.updatedAt,
                messages: fullConv.messages.map(fromServerConversationMessage),
              };
              result.updated++;
            } catch (err: any) {
              result.errors.push(`Failed to pull ${session.serverConversationId}: ${err.message}`);
            }
          } else if (session.updatedAt > serverItem.updatedAt && session.messages.length > 0) {
            try {
              const updated = await client.updateConversation(session.serverConversationId, {
                title: session.title,
                messages: session.messages.map(toServerConversationMessage),
                updatedAt: session.updatedAt,
              });
              updatedSessions[i] = {
                ...session,
                updatedAt: updated.updatedAt,
              };
              result.updated++;
            } catch (err: any) {
              result.errors.push(`Failed to push ${session.serverConversationId}: ${err.message}`);
            }
          }
        }
      } else if (session.messages.length > 0) {
        if (pendingCreateSessionIds.has(session.id)) {
          continue;
        }

        const contentKey = `${session.createdAt}|${session.title}`;
        const existingMatch = serverByContentKey.get(contentKey);

        if (existingMatch && !localByServerId.has(existingMatch.id)) {
          updatedSessions[i] = {
            ...session,
            serverConversationId: existingMatch.id,
            updatedAt: existingMatch.updatedAt,
          };
          localByServerId.set(existingMatch.id, { session: updatedSessions[i], index: i });
          result.updated++;
        } else {
          try {
            const created = await client.createConversation({
              title: session.title,
              messages: session.messages.map(toServerConversationMessage),
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
            });

            updatedSessions[i] = {
              ...session,
              serverConversationId: created.id,
              updatedAt: created.updatedAt,
            };
            result.pushed++;
          } catch (err: any) {
            result.errors.push(`Failed to create on server: ${err.message}`);
          }
        }
      }
    }

    const newSessions: Session[] = [];
    for (const serverItem of serverList) {
      if (!localByServerId.has(serverItem.id)) {
        if (shouldDeferUnmatchedPulls) {
          continue;
        }

        newSessions.push(serverConversationToStubSession(serverItem));
        result.pulled++;
      }
    }

    updatedSessions.unshift(...newSessions);
  } catch (err: any) {
    result.errors.push(`Sync failed: ${err.message}`);
  }

  return { result, sessions: updatedSessions };
}

/**
 * Fetch full conversation messages from server for a lazy-loaded session.
 */
export async function fetchFullConversation(
  client: Pick<ConversationSyncClient, 'getConversation'>,
  serverConversationId: string,
): Promise<{ messages: SessionChatMessage[]; title: string; updatedAt: number } | null> {
  try {
    const fullConv = await client.getConversation(serverConversationId);
    return {
      messages: fullConv.messages.map(fromServerConversationMessage),
      title: fullConv.title,
      updatedAt: fullConv.updatedAt,
    };
  } catch (err: any) {
    console.error(`[syncService] Failed to fetch conversation ${serverConversationId}:`, err.message);
    return null;
  }
}
