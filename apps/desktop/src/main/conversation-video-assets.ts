import path from "path"
import {
  CONVERSATION_VIDEO_ASSETS_DIR_NAME as SHARED_CONVERSATION_VIDEO_ASSETS_DIR_NAME,
  isSafeConversationVideoAssetFileName,
} from "@dotagents/shared/conversation-media-assets"
import { conversationsFolder } from "./config"
import { assertSafeConversationId } from "@dotagents/shared/conversation-id"

export {
  CONVERSATION_VIDEO_ASSET_HOST,
  CONVERSATION_VIDEO_ASSETS_DIR_NAME,
  buildConversationVideoAssetUrl,
  getConversationVideoMimeTypeFromFileName,
} from "@dotagents/shared/conversation-media-assets"

export function getConversationVideoAssetsRoot(): string {
  return path.join(conversationsFolder, SHARED_CONVERSATION_VIDEO_ASSETS_DIR_NAME)
}

export function getConversationVideoAssetDir(conversationId: string): string {
  assertSafeConversationId(conversationId)
  const root = path.resolve(getConversationVideoAssetsRoot())
  const resolved = path.resolve(root, conversationId)
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error("Invalid conversation video asset directory")
  }
  return resolved
}

export function getConversationVideoAssetPath(conversationId: string, fileName: string): string {
  assertSafeConversationId(conversationId)
  if (path.basename(fileName) !== fileName || !isSafeConversationVideoAssetFileName(fileName)) {
    throw new Error("Invalid conversation video asset filename")
  }

  const dir = getConversationVideoAssetDir(conversationId)
  const resolved = path.resolve(dir, fileName)
  if (!resolved.startsWith(dir + path.sep)) {
    throw new Error("Invalid conversation video asset path")
  }
  return resolved
}
