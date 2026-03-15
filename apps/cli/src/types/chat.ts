/**
 * Chat message types for the CLI TUI.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Whether the message is still being streamed */
  isStreaming?: boolean;
}

export type ChatStatus = 'idle' | 'streaming' | 'error';

export interface ChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  error?: string;
}
