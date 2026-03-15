import { useState, useCallback, useRef, useEffect } from 'react';
import { ConversationService } from '@dotagents/core';
import type { Conversation, ConversationHistoryItem } from '@dotagents/core';
import type { ChatMessage } from '../types/chat';

/**
 * useConversationManager — manages conversation lifecycle for the CLI.
 *
 * Wraps the @dotagents/core ConversationService to provide:
 * - Creating new conversations (/new)
 * - Listing existing conversations (/list)
 * - Switching between conversations (/switch)
 * - Persisting messages to disk
 * - Loading messages on conversation switch
 */

export interface ConversationManagerReturn {
  /** Current conversation ID (null = no active conversation) */
  currentConversationId: string | null;
  /** Current conversation title */
  currentConversationTitle: string | null;
  /** List of conversations (populated after calling listConversations) */
  conversations: ConversationHistoryItem[];
  /** Whether a conversation list is currently being displayed */
  showingConversationList: boolean;
  /** Create a new empty conversation */
  createNewConversation: () => Promise<void>;
  /** List all conversations */
  listConversations: () => Promise<ConversationHistoryItem[]>;
  /** Switch to a conversation by ID or list index (1-based) */
  switchConversation: (idOrIndex: string) => Promise<ChatMessage[]>;
  /** Save a message to the current conversation */
  saveMessage: (content: string, role: 'user' | 'assistant') => Promise<void>;
  /** Dismiss the conversation list view */
  dismissConversationList: () => void;
  /** Get the underlying conversation service */
  getService: () => ConversationService;
}

/**
 * Convert core ConversationMessage to CLI ChatMessage format.
 */
function coreMessageToChatMessage(
  msg: { id: string; role: string; content: string; timestamp: number; toolCalls?: unknown[] },
): ChatMessage {
  return {
    id: msg.id,
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
    timestamp: msg.timestamp,
  };
}

export function useConversationManager(): ConversationManagerReturn {
  const serviceRef = useRef<ConversationService>(new ConversationService());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentConversationTitle, setCurrentConversationTitle] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationHistoryItem[]>([]);
  const [showingConversationList, setShowingConversationList] = useState(false);

  const getService = useCallback(() => serviceRef.current, []);

  /**
   * Create a new, empty conversation.
   * The conversation will be persisted once the first message is sent.
   */
  const createNewConversation = useCallback(async () => {
    // Reset current conversation to signal a fresh state.
    // The actual conversation file is created when the first message is sent.
    setCurrentConversationId(null);
    setCurrentConversationTitle(null);
    setShowingConversationList(false);
  }, []);

  /**
   * List all existing conversations.
   */
  const listConversations = useCallback(async (): Promise<ConversationHistoryItem[]> => {
    const history = await serviceRef.current.getConversationHistory();
    setConversations(history);
    setShowingConversationList(true);
    return history;
  }, []);

  /**
   * Switch to a conversation by ID or by list index (1-based).
   * Returns the loaded messages converted to ChatMessage format.
   */
  const switchConversation = useCallback(async (idOrIndex: string): Promise<ChatMessage[]> => {
    const service = serviceRef.current;

    // Determine the conversation ID
    let conversationId = idOrIndex;
    const asNumber = parseInt(idOrIndex, 10);

    if (!isNaN(asNumber) && asNumber > 0) {
      // User provided a 1-based index — look up from the latest conversation list
      const history = await service.getConversationHistory();
      const idx = asNumber - 1;
      if (idx < 0 || idx >= history.length) {
        throw new Error(
          `Invalid conversation number: ${asNumber}. Use /list to see available conversations (1-${history.length}).`,
        );
      }
      conversationId = history[idx].id;
    }

    // Load the conversation
    const conversation = await service.loadConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    setCurrentConversationId(conversation.id);
    setCurrentConversationTitle(conversation.title);
    setShowingConversationList(false);

    // Convert messages to ChatMessage format
    const chatMessages = conversation.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map(coreMessageToChatMessage);

    return chatMessages;
  }, []);

  /**
   * Save a message to the current conversation.
   * If no conversation exists yet, creates one with the first user message.
   */
  const saveMessage = useCallback(async (content: string, role: 'user' | 'assistant') => {
    const service = serviceRef.current;

    if (!currentConversationId) {
      // Create a new conversation with this first message
      if (role === 'user') {
        const conversation = await service.createConversation(content, role);
        setCurrentConversationId(conversation.id);
        setCurrentConversationTitle(conversation.title);
      }
      return;
    }

    // Add to existing conversation
    await service.addMessageToConversation(currentConversationId, content, role);
  }, [currentConversationId]);

  /**
   * Dismiss the conversation list view.
   */
  const dismissConversationList = useCallback(() => {
    setShowingConversationList(false);
  }, []);

  return {
    currentConversationId,
    currentConversationTitle,
    conversations,
    showingConversationList,
    createNewConversation,
    listConversations,
    switchConversation,
    saveMessage,
    dismissConversationList,
    getService,
  };
}
