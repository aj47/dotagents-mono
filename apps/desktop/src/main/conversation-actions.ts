import fs from "fs"
import { getConversationIdValidationError } from "@dotagents/shared/conversation-id"
import { getConversationVideoAssetPath } from "./conversation-video-assets"
import { conversationService } from "./conversation-service"
import { diagnosticsService } from "./diagnostics"
import {
  createConversationAction,
  getConversationAction,
  getConversationsAction,
  updateConversationAction,
  type ConversationActionOptions,
} from "@dotagents/shared/conversation-sync"
import {
  buildConversationVideoAssetStreamPlan,
} from "@dotagents/shared/conversation-media-assets"
import {
  buildMobileApiActionError,
  buildMobileApiActionResult,
  type MobileApiActionResult,
} from "@dotagents/shared/remote-server-route-contracts"

export type ConversationActionResult = MobileApiActionResult

type DesktopConversationActionConversation = NonNullable<Awaited<ReturnType<typeof conversationService.loadConversation>>>

const conversationActionOptions: ConversationActionOptions<DesktopConversationActionConversation> = {
  service: {
    loadConversation: (conversationId) => conversationService.loadConversation(conversationId),
    getConversationHistory: () => conversationService.getConversationHistory(),
    generateConversationId: () => conversationService.generateConversationIdPublic(),
    saveConversation: (conversation, preserveTimestamp) => conversationService.saveConversation(conversation, preserveTimestamp),
  },
  diagnostics: diagnosticsService,
  validateConversationId: getConversationIdValidationError,
  now: () => Date.now(),
}

export async function getConversation(id: string | undefined): Promise<ConversationActionResult> {
  return getConversationAction(id, conversationActionOptions)
}

export async function getConversationVideoAsset(
  id: string | undefined,
  fileName: string | undefined,
  rangeHeader: string | undefined,
): Promise<ConversationActionResult> {
  try {
    const conversationId = id ?? ""

    const conversationIdError = getConversationIdValidationError(conversationId)
    if (conversationIdError) {
      return buildMobileApiActionError(400, conversationIdError)
    }

    let assetPath: string
    try {
      assetPath = getConversationVideoAssetPath(conversationId, fileName ?? "")
    } catch (caughtError) {
      return buildMobileApiActionError(400, caughtError instanceof Error ? caughtError.message : "Invalid video asset")
    }

    const stat = await fs.promises.stat(assetPath)
    if (!stat.isFile() || stat.size <= 0) {
      return buildMobileApiActionError(404, "Video asset not found")
    }

    const streamPlan = buildConversationVideoAssetStreamPlan(fileName ?? "", rangeHeader, stat.size)
    if (!streamPlan.ok) {
      return {
        statusCode: streamPlan.statusCode,
        headers: streamPlan.headers,
      }
    }

    if (streamPlan.range) {
      return buildMobileApiActionResult(
        fs.createReadStream(assetPath, { start: streamPlan.range.start, end: streamPlan.range.end }),
        streamPlan.statusCode,
        streamPlan.headers,
      )
    }

    return buildMobileApiActionResult(fs.createReadStream(assetPath), streamPlan.statusCode, streamPlan.headers)
  } catch (caughtError: any) {
    if (caughtError?.code === "ENOENT") {
      return buildMobileApiActionError(404, "Video asset not found")
    }
    diagnosticsService.logError("conversation-actions", "Failed to stream conversation video asset", caughtError)
    return buildMobileApiActionError(500, caughtError?.message || "Failed to stream video asset")
  }
}

export async function getConversations(): Promise<ConversationActionResult> {
  return getConversationsAction(conversationActionOptions)
}

export async function createConversation(
  body: unknown,
  onChanged: () => void,
): Promise<ConversationActionResult> {
  return createConversationAction(body, onChanged, conversationActionOptions)
}

export async function updateConversation(
  id: string | undefined,
  body: unknown,
  onChanged: () => void,
): Promise<ConversationActionResult> {
  return updateConversationAction(id, body, onChanged, conversationActionOptions)
}
