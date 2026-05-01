/**
 * Step summarization has been removed.
 */

import type { AgentStepSummary } from "../shared/types"

export interface SummarizationInput {
  sessionId: string
  stepNumber: number
  agentThought?: string
  toolCalls?: Array<{ name: string; arguments: any }>
  toolResults?: Array<{ success: boolean; content: string; error?: string }>
  assistantResponse?: string
  recentMessages?: Array<{ role: "user" | "assistant" | "tool"; content: string }>
}

export function isSummarizationEnabled(): boolean {
  return false
}

export function shouldSummarizeStep(_hasToolCalls: boolean, _isCompletion: boolean): boolean {
  return false
}

export async function summarizeAgentStep(_input: SummarizationInput): Promise<AgentStepSummary | null> {
  return null
}

class SummarizationService {
  addSummary(_summary: AgentStepSummary): void {}
  getSummaries(_sessionId: string): AgentStepSummary[] { return [] }
  getLatestSummary(_sessionId: string): AgentStepSummary | undefined { return undefined }
  clearSession(_sessionId: string): void {}
  getImportantSummaries(_sessionId: string): AgentStepSummary[] { return [] }
}

export const summarizationService = new SummarizationService()
