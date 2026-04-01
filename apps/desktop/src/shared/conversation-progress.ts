import type { ConversationMessage } from "./types"

/**
 * Map each displayed conversation message to the raw-message index that should be
 * used for branching. Summary messages represent multiple raw messages, so their
 * branch target is the last raw message they summarize.
 */
export function getBranchMessageIndexMap(
  messages: Array<Pick<ConversationMessage, "isSummary" | "summarizedMessageCount">>,
): number[] {
  let rawMessageCount = 0

  return messages.map((message) => {
    const representedCount = message.isSummary
      ? Math.max(message.summarizedMessageCount ?? 0, 1)
      : 1

    rawMessageCount += representedCount
    return rawMessageCount - 1
  })
}