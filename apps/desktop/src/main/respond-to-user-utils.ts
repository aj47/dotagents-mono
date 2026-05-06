import {
  extractRespondToUserContentFromArgs as extractSharedRespondToUserContentFromArgs,
} from "@dotagents/shared/chat-utils"

export {
  getLatestRespondToUserContentFromConversationHistory,
  getOrderedRespondToUserContentsFromToolCalls,
  getUnmaterializedUserResponseEvents,
  normalizeUserFacingResponseContent,
  resolveLatestUserFacingResponse,
} from "@dotagents/shared/chat-utils"

export function extractRespondToUserContentFromArgs(args: unknown): string | undefined {
  return extractSharedRespondToUserContentFromArgs(args) ?? undefined
}
