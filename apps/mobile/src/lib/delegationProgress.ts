import {
  createAgentDelegationProgressMessages,
  type AgentProgressStep,
} from '@dotagents/shared/agent-progress';
import type { ChatMessage } from './openaiClient';

export const createDelegationProgressMessages = (steps?: AgentProgressStep[]): ChatMessage[] => (
  createAgentDelegationProgressMessages(steps)
);
