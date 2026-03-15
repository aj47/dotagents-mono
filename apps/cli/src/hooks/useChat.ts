import { useState, useCallback, useRef } from 'react';
import {
  makeLLMCallWithStreaming,
} from '@dotagents/core';
import type { LLMToolCallResponse } from '@dotagents/core';
import type { ChatMessage, ChatStatus } from '../types/chat';

/**
 * useChat — React hook that manages chat state and wires messages
 * to the @dotagents/core LLM engine with streaming support.
 *
 * Handles:
 * - Message history (user + assistant)
 * - Empty message rejection
 * - Streaming token-by-token display
 * - Status transitions (idle → streaming → idle/error)
 * - Abort controller for cancellation
 */

let _msgCounter = 0;
function nextMsgId(): string {
  return `msg_${Date.now()}_${++_msgCounter}`;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | undefined;
  sendMessage: (content: string) => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (trimmed.length === 0) return;
      if (status === 'streaming') return;

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
          setStatus('idle');
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

  return { messages, status, error, sendMessage };
}
