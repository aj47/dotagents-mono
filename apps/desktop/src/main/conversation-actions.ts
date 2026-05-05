import fs from "fs"
import { getConversationIdValidationError } from "./conversation-id"
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
  getConversationVideoByteRange,
  getConversationVideoMimeTypeFromFileName,
} from "@dotagents/shared/conversation-media-assets"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"

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
