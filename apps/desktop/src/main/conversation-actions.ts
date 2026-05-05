import fs from "fs"
import { getConversationIdValidationError } from "./conversation-id"
import { getConversationVideoAssetPath } from "./conversation-video-assets"
import { conversationService } from "./conversation-service"
import { diagnosticsService } from "./diagnostics"
import {
  applyServerConversationUpdate,
  buildNewServerConversation,
  buildNewServerConversationFromUpdateRequest,
  buildServerConversationFullResponse,
  buildServerConversationsResponse,
  parseCreateConversationRequestBody,
  parseUpdateConversationRequestBody,
} from "@dotagents/shared/conversation-sync"
import {
  getConversationVideoByteRange,
  getConversationVideoMimeTypeFromFileName,
} from "@dotagents/shared/conversation-media-assets"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"

export type ConversationActionResult = MobileApiActionResult

function ok(body: unknown, statusCode = 200, headers?: Record<string, string>): ConversationActionResult {
  return {
    statusCode,
    body,
    ...(headers ? { headers } : {}),
  }
}

function error(statusCode: number, message: string, headers?: Record<string, string>): ConversationActionResult {
  return {
    statusCode,
    body: { error: message },
    ...(headers ? { headers } : {}),
  }
}

export async function getConversation(id: string | undefined): Promise<ConversationActionResult> {
  try {
    const conversationId = id

    if (!conversationId || typeof conversationId !== "string") {
      return error(400, "Missing or invalid conversation ID")
    }

    const conversationIdError = getConversationIdValidationError(conversationId)
    if (conversationIdError) {
      return error(400, conversationIdError)
    }

    const conversation = await conversationService.loadConversation(conversationId)

    if (!conversation) {
      return error(404, "Conversation not found")
    }

    diagnosticsService.logInfo("conversation-actions", `Fetched conversation ${conversationId} for recovery`)

    return ok(buildServerConversationFullResponse(conversation, { includeMetadata: true }))
  } catch (caughtError: any) {
    diagnosticsService.logError("conversation-actions", "Failed to fetch conversation", caughtError)
    return error(500, caughtError?.message || "Failed to fetch conversation")
  }
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
      return error(400, conversationIdError)
    }

    let assetPath: string
    try {
      assetPath = getConversationVideoAssetPath(conversationId, fileName ?? "")
    } catch (caughtError) {
      return error(400, caughtError instanceof Error ? caughtError.message : "Invalid video asset")
    }

    const stat = await fs.promises.stat(assetPath)
    if (!stat.isFile() || stat.size <= 0) {
      return error(404, "Video asset not found")
    }

    const contentType = getConversationVideoMimeTypeFromFileName(fileName ?? "")
    const range = getConversationVideoByteRange(rangeHeader, stat.size)
    if (range.satisfiable === false) {
      return {
        statusCode: 416,
        headers: { "Content-Range": range.contentRange },
      }
    }

    const headers: Record<string, string> = {
      "Accept-Ranges": "bytes",
      "Content-Type": contentType,
      "Content-Length": String(range.contentLength),
    }

    if (range.partial) {
      headers["Content-Range"] = range.contentRange
      return ok(fs.createReadStream(assetPath, { start: range.start, end: range.end }), 206, headers)
    }

    return ok(fs.createReadStream(assetPath), 200, headers)
  } catch (caughtError: any) {
    if (caughtError?.code === "ENOENT") {
      return error(404, "Video asset not found")
    }
    diagnosticsService.logError("conversation-actions", "Failed to stream conversation video asset", caughtError)
    return error(500, caughtError?.message || "Failed to stream video asset")
  }
}

export async function getConversations(): Promise<ConversationActionResult> {
  try {
    const conversations = await conversationService.getConversationHistory()
    diagnosticsService.logInfo("conversation-actions", `Listed ${conversations.length} conversations`)
    return ok(buildServerConversationsResponse(conversations))
  } catch (caughtError: any) {
    diagnosticsService.logError("conversation-actions", "Failed to list conversations", caughtError)
    return error(500, caughtError?.message || "Failed to list conversations")
  }
}

export async function createConversation(
  body: unknown,
  onChanged: () => void,
): Promise<ConversationActionResult> {
  try {
    const parsedRequest = parseCreateConversationRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const conversationId = conversationService.generateConversationIdPublic()
    const now = Date.now()
    const conversation = buildNewServerConversation(conversationId, parsedRequest.request, now)

    await conversationService.saveConversation(conversation, true)
    diagnosticsService.logInfo("conversation-actions", `Created conversation ${conversationId} with ${conversation.messages.length} messages`)

    onChanged()

    return ok(buildServerConversationFullResponse(conversation), 201)
  } catch (caughtError: any) {
    diagnosticsService.logError("conversation-actions", "Failed to create conversation", caughtError)
    return error(500, caughtError?.message || "Failed to create conversation")
  }
}

export async function updateConversation(
  id: string | undefined,
  body: unknown,
  onChanged: () => void,
): Promise<ConversationActionResult> {
  try {
    const conversationId = id

    if (!conversationId || typeof conversationId !== "string") {
      return error(400, "Missing or invalid conversation ID")
    }

    const conversationIdError = getConversationIdValidationError(conversationId)
    if (conversationIdError) {
      return error(400, conversationIdError)
    }

    const parsedRequest = parseUpdateConversationRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const now = Date.now()
    let conversation = await conversationService.loadConversation(conversationId)

    if (!conversation) {
      const buildResult = buildNewServerConversationFromUpdateRequest(conversationId, parsedRequest.request, now)
      if (buildResult.ok === false) {
        return error(buildResult.statusCode, buildResult.error)
      }

      conversation = buildResult.conversation
      await conversationService.saveConversation(conversation, true)
      diagnosticsService.logInfo("conversation-actions", `Created conversation ${conversationId} via PUT with ${conversation.messages.length} messages`)
    } else {
      conversation = applyServerConversationUpdate(conversation, parsedRequest.request, now)
      await conversationService.saveConversation(conversation, true)
      diagnosticsService.logInfo("conversation-actions", `Updated conversation ${conversationId}`)
    }

    onChanged()

    return ok(buildServerConversationFullResponse(conversation))
  } catch (caughtError: any) {
    diagnosticsService.logError("conversation-actions", "Failed to update conversation", caughtError)
    return error(500, caughtError?.message || "Failed to update conversation")
  }
}
