import { useState, useCallback, useRef } from 'react';
import {
  makeLLMCallWithStreamingAndTools,
  mcpService,
} from '@dotagents/core';
import type { MCPTool, MCPToolCall, LLMToolCallResponse } from '@dotagents/core';
import type { ChatMessage, ChatStatus, ToolCallInfo, ToolApprovalInfo } from '../types/chat';

/**
 * useChat — React hook that manages chat state and wires messages
 * to the @dotagents/core LLM engine with streaming support.
 *
 * Handles:
 * - Message history (user + assistant)
 * - Empty message rejection
 * - Streaming token-by-token display
 * - MCP tool cycle: agent calls tool → execute → result displayed → agent uses result
 * - Tool approval flow (awaiting_approval status with approve/deny callbacks)
 * - Status transitions (idle → streaming → awaiting_approval → streaming → idle/error)
 * - Abort controller for cancellation (Ctrl+C graceful cancel)
 * - Network error display as inline error message
 * - Invalid input protection (no crash on bad input)
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
  /** Available MCP tools to pass to the LLM for tool calling. */
  tools?: MCPTool[];
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
  /** Cancel the current streaming request (e.g., on Ctrl+C). */
  cancelStreaming: () => void;
}

/** Maximum number of tool call rounds to prevent infinite loops. */
const MAX_TOOL_ROUNDS = 10;

/**
 * Classify an error for user-friendly display.
 */
function classifyError(err: unknown): string {
  if (!(err instanceof Error)) return 'An unexpected error occurred.';

  const msg = err.message;

  // Abort / cancellation — not really an error
  if (err.name === 'AbortError' || msg.includes('abort')) {
    return '';
  }

  // Network errors
  if (
    msg.includes('fetch') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('network') ||
    msg.includes('NetworkError') ||
    msg.includes('socket hang up')
  ) {
    return `Network error: ${msg}. Check your connection and API key configuration.`;
  }

  // API key / auth errors
  if (
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('Unauthorized') ||
    msg.includes('API key') ||
    msg.includes('api_key')
  ) {
    return `Authentication error: ${msg}. Check your API key in settings.`;
  }

  // Rate limiting
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Rate limit')) {
    return `Rate limited: ${msg}. Please wait a moment and try again.`;
  }

  // Generic
  return msg;
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
   * Cancel the current streaming request.
   * Called when user presses Ctrl+C during streaming.
   */
  const cancelStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    // If awaiting approval, deny it
    if (approvalResolveRef.current) {
      approvalResolveRef.current(false);
      approvalResolveRef.current = null;
    }
    setPendingApproval(undefined);
    // Mark any streaming messages as complete
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    );
    setStatus('idle');
  }, []);

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
   * Execute a single tool call via the MCP service and return the result text.
   */
  const executeToolCallViaService = useCallback(
    async (
      toolCall: MCPToolCall,
      assistantMsgId: string,
      tcId: string,
    ): Promise<string> => {
      // Mark tool call as running
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                toolCalls: (m.toolCalls ?? []).map((tc) =>
                  tc.id === tcId ? { ...tc, status: 'running' as const } : tc,
                ),
              }
            : m,
        ),
      );

      try {
        const result = await mcpService.executeToolCall(
          { name: toolCall.name, arguments: toolCall.arguments },
          undefined, // onProgress
          true, // skipApprovalCheck — we handle approval in the hook
        );

        const resultText = result.content
          .map((c) => c.text)
          .join('\n');

        // Mark tool call as completed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  toolCalls: (m.toolCalls ?? []).map((tc) =>
                    tc.id === tcId
                      ? {
                          ...tc,
                          status: (result.isError ? 'error' : 'completed') as ToolCallInfo['status'],
                          result: result.isError ? undefined : resultText,
                          error: result.isError ? resultText : undefined,
                        }
                      : tc,
                  ),
                }
              : m,
          ),
        );

        return resultText;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Tool execution failed';

        // Mark tool call as error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  toolCalls: (m.toolCalls ?? []).map((tc) =>
                    tc.id === tcId
                      ? { ...tc, status: 'error' as const, error: errMsg }
                      : tc,
                  ),
                }
              : m,
          ),
        );

        return `Error: ${errMsg}`;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    (content: string) => {
      // Guard against invalid input
      let trimmed: string;
      try {
        trimmed = String(content ?? '').trim();
      } catch {
        // If content is somehow not stringifiable, ignore
        return;
      }

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

      // Get available tools
      const tools = options?.tools ?? [];

      // Start the streaming + tool loop
      (async () => {
        let currentMessages = [...conversationMessages];
        let rounds = 0;

        try {
          while (rounds < MAX_TOOL_ROUNDS) {
            rounds++;

            // Check if aborted
            if (abortController.signal.aborted) break;

            // Call LLM with streaming and tools
            const result: LLMToolCallResponse = await makeLLMCallWithStreamingAndTools(
              currentMessages,
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
              undefined, // onRetryProgress
              undefined, // sessionId
              tools.length > 0 ? tools : undefined,
            );

            // Check if aborted after the call
            if (abortController.signal.aborted) break;

            // If no tool calls, we're done
            if (!result.toolCalls || result.toolCalls.length === 0) {
              // Mark streaming complete with final content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: result.content ?? m.content, isStreaming: false }
                    : m,
                ),
              );
              break;
            }

            // Process tool calls
            const toolResults: Array<{ name: string; result: string }> = [];

            for (const tc of result.toolCalls) {
              if (abortController.signal.aborted) break;

              // Create tool call info entry
              const tcId = nextToolCallId();
              const toolCallInfo: ToolCallInfo = {
                id: tcId,
                toolName: tc.name,
                args: tc.arguments,
                status: 'pending',
              };

              // Add tool call to the assistant message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, toolCalls: [...(m.toolCalls ?? []), toolCallInfo] }
                    : m,
                ),
              );

              // Execute the tool
              const resultText = await executeToolCallViaService(tc, assistantMsgId, tcId);
              toolResults.push({ name: tc.name, result: resultText });
            }

            if (abortController.signal.aborted) break;

            // Build follow-up messages with tool results for the next round
            currentMessages = [
              ...currentMessages,
              {
                role: 'assistant',
                content: result.content || `[Called tools: ${result.toolCalls.map((t) => t.name).join(', ')}]`,
              },
              ...toolResults.map((tr) => ({
                role: 'tool' as string,
                content: `[Tool "${tr.name}" result]: ${tr.result}`,
              })),
            ];

            // Reset streaming content for the next round
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: '', isStreaming: true }
                  : m,
              ),
            );
          }

          // Final state
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, isStreaming: false }
                : m,
            ),
          );
          setStatus('idle');

          // Persist the assistant response
          setMessages((prev) => {
            const assistantMsg = prev.find((m) => m.id === assistantMsgId);
            if (assistantMsg?.content) {
              options?.onMessageSaved?.(assistantMsg.content, 'assistant').catch(() => {
                // Best-effort persistence
              });
            }
            return prev;
          });
        } catch (err: unknown) {
          const errorMsg = classifyError(err);

          // If aborted (Ctrl+C), just complete silently
          if (!errorMsg) {
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
          setError(errorMsg);
          setStatus('error');
        } finally {
          abortRef.current = null;
        }
      })();
    },
    [messages, status, options, executeToolCallViaService],
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
    cancelStreaming,
  };
}
