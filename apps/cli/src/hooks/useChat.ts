import { useState, useCallback, useRef } from 'react';
import {
  makeLLMCallWithStreaming,
} from '@dotagents/core';
import type { LLMToolCallResponse } from '@dotagents/core';
import type { ChatMessage, ChatStatus, ToolCallInfo, ToolApprovalInfo } from '../types/chat';

/**
 * useChat — React hook that manages chat state and wires messages
 * to the @dotagents/core LLM engine with streaming support.
 *
 * Handles:
 * - Message history (user + assistant)
 * - Empty message rejection
 * - Streaming token-by-token display
 * - Tool call display (pending, running, completed, error)
 * - Tool approval flow (awaiting_approval status with approve/deny callbacks)
 * - Status transitions (idle → streaming → awaiting_approval → streaming → idle/error)
 * - Abort controller for cancellation
 * - Conversation persistence via onMessageSaved callback
 */

let _msgCounter = 0;
function nextMsgId(): string {
  return `msg_${Date.now()}_${++_msgCounter}`;
}

let _toolCallCounter = 0;
function nextToolCallId(): string {
  return `tc_${Date.now()}_${++_toolCallCounter}`;
}

export interface UseChatOptions {
  /** Callback invoked after a message is finalized, for persistence. */
  onMessageSaved?: (content: string, role: 'user' | 'assistant') => Promise<void>;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | undefined;
  pendingApproval: ToolApprovalInfo | undefined;
  sendMessage: (content: string) => void;
  /** Replace the message list (e.g., on conversation switch). */
  setMessages: (messages: ChatMessage[]) => void;
  approveToolCall: () => void;
  denyToolCall: () => void;
}

export function useChat(options?: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | undefined>(undefined);
  const [pendingApproval, setPendingApproval] = useState<ToolApprovalInfo | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  // Ref holding the resolve function for the current approval promise
  const approvalResolveRef = useRef<((approved: boolean) => void) | null>(null);

  /**
   * Approve the currently pending tool call.
   */
  const approveToolCall = useCallback(() => {
    if (approvalResolveRef.current) {
      approvalResolveRef.current(true);
      approvalResolveRef.current = null;
    }
    setPendingApproval(undefined);
    setStatus('streaming');
  }, []);

  /**
   * Deny the currently pending tool call.
   */
  const denyToolCall = useCallback(() => {
    if (approvalResolveRef.current) {
      approvalResolveRef.current(false);
      approvalResolveRef.current = null;
    }
    setPendingApproval(undefined);
    setStatus('streaming');
  }, []);

  /**
   * Add a tool call entry to the latest assistant message.
   */
  const addToolCallToLastAssistant = useCallback(
    (assistantMsgId: string, toolCall: ToolCallInfo) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, toolCalls: [...(m.toolCalls ?? []), toolCall] }
            : m,
        ),
      );
    },
    [],
  );

  /**
   * Update an existing tool call on the latest assistant message.
   */
  const updateToolCall = useCallback(
    (assistantMsgId: string, toolCallId: string, updates: Partial<ToolCallInfo>) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                toolCalls: (m.toolCalls ?? []).map((tc) =>
                  tc.id === toolCallId ? { ...tc, ...updates } : tc,
                ),
              }
            : m,
        ),
      );
    },
    [],
  );

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (trimmed.length === 0) return;
      if (status === 'streaming' || status === 'awaiting_approval') return;

      // Clear any previous error
      setError(undefined);

      // Create user message
      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      // Create placeholder assistant message for streaming
      const assistantMsgId = nextMsgId();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStatus('streaming');

      // Persist the user message
      options?.onMessageSaved?.(trimmed, 'user').catch(() => {
        // Best-effort persistence — don't block the chat flow
      });

      // Build conversation messages for the LLM
      const conversationMessages = [
        ...messages.map((m) => ({
          role: m.role as string,
          content: m.content,
        })),
        { role: 'user', content: trimmed },
      ];

      // Create abort controller for this request
      const abortController = new AbortController();
      abortRef.current = abortController;

      // Call LLM with streaming
      makeLLMCallWithStreaming(
        conversationMessages,
        // onChunk callback — update the assistant message incrementally
        (_chunk: string, accumulated: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: accumulated }
                : m,
            ),
          );
        },
        undefined, // providerId — use default from config
        undefined, // sessionId
        abortController,
      )
        .then((result: LLMToolCallResponse) => {
          // If the LLM returned tool calls, display them
          if (result.toolCalls && result.toolCalls.length > 0) {
            const toolCallInfos: ToolCallInfo[] = result.toolCalls.map((tc) => ({
              id: nextToolCallId(),
              toolName: tc.name,
              args: tc.arguments,
              status: 'completed' as const,
              result: `Tool "${tc.name}" executed`,
            }));

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: result.content ?? '',
                      isStreaming: false,
                      toolCalls: toolCallInfos,
                    }
                  : m,
              ),
            );
          } else {
            // Mark streaming complete
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: result.content ?? '',
                      isStreaming: false,
                    }
                  : m,
              ),
            );
          }
          setStatus('idle');

          // Persist the assistant response
          const assistantContent = result.content ?? '';
          if (assistantContent) {
            options?.onMessageSaved?.(assistantContent, 'assistant').catch(() => {
              // Best-effort persistence
            });
          }
        })
        .catch((err: unknown) => {
          const errMsg =
            err instanceof Error ? err.message : 'Unknown error';
          // If aborted, just complete silently
          if (
            err instanceof Error &&
            (err.name === 'AbortError' || errMsg.includes('abort'))
          ) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, isStreaming: false }
                  : m,
              ),
            );
            setStatus('idle');
            return;
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, isStreaming: false }
                : m,
            ),
          );
          setError(errMsg);
          setStatus('error');
        })
        .finally(() => {
          abortRef.current = null;
        });
    },
    [messages, status],
  );

  /**
   * Replace the entire message list.
   * Used when switching conversations to load saved history.
   */
  const replaceMessages = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    setError(undefined);
    setStatus('idle');
  }, []);

  return {
    messages,
    status,
    error,
    pendingApproval,
    sendMessage,
    setMessages: replaceMessages,
    approveToolCall,
    denyToolCall,
  };
}
