import type { ToolCall, ToolResult } from './types';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  displayContent?: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  isSummary?: boolean;
  summarizedMessageCount?: number;
}

export interface ConversationCompactionFact {
  sourceMessageIndex: number;
  sourceMessageId?: string;
  sourceRole: 'user' | 'assistant' | 'tool' | string;
  timestamp?: number;
  excerpt: string;
  repoSlugs?: string[];
  urls?: string[];
  paths?: string[];
  identifiers?: string[];
}

export interface ConversationCompactionMetadata {
  rawHistoryPreserved: boolean;
  storedRawMessageCount?: number;
  representedMessageCount: number;
  compactedAt?: number;
  summary?: string;
  summaryMessageId?: string;
  firstKeptMessageId?: string;
  firstKeptMessageIndex?: number;
  summarizedRange?: {
    startMessageId?: string;
    endMessageId?: string;
    startIndex: number;
    endIndex: number;
  };
  summarizedMessageCount?: number;
  tokensBefore?: number;
  extractedFacts?: ConversationCompactionFact[];
  partialReason?: 'legacy_summary_without_raw_messages';
}

export interface ConversationBranchSource {
  sourceConversationId: string;
  sourceMessageIndex: number;
  branchedAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ConversationMessage[];
  rawMessages?: ConversationMessage[];
  compaction?: ConversationCompactionMetadata;
  metadata?: {
    totalTokens?: number;
    model?: string;
    provider?: string;
    agentMode?: boolean;
  };
  branchSource?: ConversationBranchSource;
}

export interface LoadedConversation extends Conversation {
  messageOffset?: number;
  totalMessageCount?: number;
  branchMessageIndexOffset?: number;
}

export interface ConversationHistoryItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessage: string;
  preview: string;
}
