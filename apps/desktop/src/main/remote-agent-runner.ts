import { runRemoteAgent, type RunAgentOptions, type RunAgentResult } from "./agent-run-actions"
import { notifyConversationHistoryChanged } from "./conversation-history-notifier"

export async function runAgent(options: RunAgentOptions): Promise<RunAgentResult> {
  return runRemoteAgent(options, notifyConversationHistoryChanged)
}
