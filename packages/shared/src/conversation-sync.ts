import type {
  CreateConversationRequest,
  ServerConversation,
  ServerConversationFull,
  ServerConversationMessage,
  UpdateConversationRequest,
} from './api-types';
import { generateSessionId, type Session, type SessionChatMessage } from './session';

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
  saveConversation(conversation: TConversation, preserveTimestamp: boolean): ConversationMaybePromise<void>;
}

export interface ConversationActionOptions<TConversation extends ServerConversationRecord<any> = ServerConversationRecord<any>> {
  service: ConversationActionService<TConversation>;
  diagnostics: ConversationActionDiagnostics;
  validateConversationId(conversationId: string): string | null | undefined;
  now(): number;
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
}

const VALID_ROLES = ['user', 'assistant', 'tool'] as const;

export interface ServerConversationRecordMessage extends ServerConversationMessage {
  id: string;
  timestamp: number;
}

export interface ServerConversationRecord<TMetadata = unknown> {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ServerConversationRecordMessage[];
  metadata?: TMetadata;
}

export type ConversationRequestParseResult<T> =
  | { ok: true; request: T }
  | { ok: false; statusCode: 400; error: string };

export type ConversationBuildResult =
  | { ok: true; conversation: ServerConversationRecord<never> }
  | { ok: false; statusCode: 400; error: string };

export type ServerConversationMessageIdFactory = (timestamp: number, index: number) => string;

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

export function buildServerConversationTitle(
  requestedTitle: string | undefined,
  messages: ServerConversationMessage[],
): string {
  if (requestedTitle) {
    return requestedTitle;
  }

  const firstMessageContent = messages[0]?.content || '';
  if (firstMessageContent.length > 50) {
    return `${firstMessageContent.slice(0, 50)}...`;
  }

  return firstMessageContent || 'New Conversation';
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

  return options.validateConversationId(conversationId) ?? null;
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
    const timestamp = options.now();
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

    const timestamp = options.now();
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

export function createConversationRouteActions<TConversation extends ServerConversationRecord<any>>(
  options: ConversationActionOptions<TConversation>,
): ConversationRouteActions {
  return {
    getConversation: (id) => getConversationAction(id, options),
    getConversations: () => getConversationsAction(options),
    createConversation: (body, onChanged) => createConversationAction(body, onChanged, options),
    updateConversation: (id, body, onChanged) => updateConversationAction(id, body, onChanged, options),
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
