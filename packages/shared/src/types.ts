/**
 * Shared types for DotAgents apps (desktop and mobile)
 * These types are used for communication between the mobile app and the remote server,
 * as well as for consistent data structures across both platforms.
 */

/**
 * Tool call data - represents a call to an MCP tool
 */
export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Tool result data - represents the result of an MCP tool execution
 */
export interface ToolResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Base chat message interface shared between desktop and mobile.
 * This is the minimal structure needed for displaying messages with tool data.
 */
export interface BaseChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  /** Optional renderer-only override. Not intended for persistence or model replay. */
  displayContent?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

/**
 * Conversation history message - used in API responses and conversation storage.
 * Extends BaseChatMessage with an optional timestamp.
 */
export interface ConversationHistoryMessage extends BaseChatMessage {
  timestamp?: number;
  /**
   * Absolute index into the persisted raw conversation history to use when a UI
   * action (like branching) needs to target this displayed message.
   */
  branchMessageIndex?: number;
}

/**
 * Chat response from the remote server API.
 * Includes the assistant's response content and optional conversation history with tool data.
 */
export interface ChatApiResponse {
  content: string;
  conversationId?: string;
  conversationHistory?: ConversationHistoryMessage[];
  /** Indicates the message was queued instead of processed immediately */
  queued?: boolean;
  /** ID of the queued message if it was queued */
  queuedMessageId?: string;
}

/**
 * Queued message - represents a message waiting to be processed.
 * Used when the agent is busy processing and messages are queued for later.
 */
export interface QueuedMessage {
  id: string;
  conversationId: string;
  /** Session that was active when this message was queued. */
  sessionId?: string;
  text: string;
  createdAt: number;
  status: 'pending' | 'processing' | 'cancelled' | 'failed';
  errorMessage?: string;
  /** Indicates the message was added to conversation history before processing failed */
  addedToHistory?: boolean;
}

/**
 * Message queue - represents a queue of messages for a conversation.
 */
export interface MessageQueue {
  conversationId: string;
  messages: QueuedMessage[];
}

/**
 * Runtime states for the foreground handsfree voice loop.
 * Shared so mobile and desktop can converge on the same vocabulary.
 */
export type HandsFreePhase =
  | 'sleeping'
  | 'waking'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'paused'
  | 'error';

export type HandsFreeResumePhase = 'sleeping' | 'listening' | 'processing';

export type HandsFreeDebugEventType =
  | 'permission-denied'
  | 'recognizer-start'
  | 'recognizer-stop'
  | 'wake-phrase-matched'
  | 'sleep-phrase-matched'
  | 'auto-send'
  | 'tts-started'
  | 'tts-stopped'
  | 'background-pause'
  | 'foreground-resume'
  | 'recognizer-error'
  | 'mic-device-fallback'
  | 'state-transition'
  | 'session-timeout'
  | 'no-speech-timeout';

