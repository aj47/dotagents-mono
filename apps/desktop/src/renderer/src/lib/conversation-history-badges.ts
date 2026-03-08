import type { ConversationHistoryItem } from "@shared/types"

export interface ConversationHistoryBadgeInfo {
  label: "History compacted" | "History partial"
  title: string
  className: string
}

export function getConversationHistoryBadge(
  session: Pick<ConversationHistoryItem, "compaction">,
): ConversationHistoryBadgeInfo | null {
  if (!session.compaction) {
    return null
  }

  if (session.compaction.partialReason === "legacy_summary_without_raw_messages") {
    return {
      label: "History partial",
      title: "Earlier raw history is unavailable for this legacy summarized session.",
      className: "border-amber-500/40 text-amber-700 dark:text-amber-300",
    }
  }

  const storedCount =
    session.compaction.storedRawMessageCount ??
    session.compaction.representedMessageCount

  return {
    label: "History compacted",
    title: storedCount
      ? `Earlier history in this session has been summarized for the active context, with ${storedCount} raw messages preserved on disk.`
      : "Earlier history in this session has been summarized for the active context, with raw history preserved on disk.",
    className: "border-primary/40 text-primary",
  }
}

