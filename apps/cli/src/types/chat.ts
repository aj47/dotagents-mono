/**
 * Chat message types for the CLI TUI.
 */

/** Represents a tool call invoked by the agent during a conversation. */
export interface ToolCallInfo {
  /** Unique identifier for this tool call */
  id: string;
  /** Name of the tool being called */
  toolName: string;
  /** Arguments passed to the tool */
  args: Record<string, unknown>;
  /** Current status of the tool call */
  status: 'pending' | 'running' | 'completed' | 'error';
  /** Result text returned by the tool (when completed) */
  result?: string;
  /** Error message if the tool call failed */
  error?: string;
}

/** Represents a pending tool approval request. */
export interface ToolApprovalInfo {
  /** Unique approval request identifier */
  approvalId: string;
  /** Name of the tool requesting approval */
  toolName: string;
  /** Arguments the tool will be called with */
  args: Record<string, unknown>;
  /** Optional human-readable description */
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Whether the message is still being streamed */
  isStreaming?: boolean;
  /** Tool calls associated with this assistant message */
  toolCalls?: ToolCallInfo[];
}

export type ChatStatus = 'idle' | 'streaming' | 'error' | 'awaiting_approval';

export interface ChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  error?: string;
  /** Currently pending tool approval (if any) */
  pendingApproval?: ToolApprovalInfo;
}
