import path from "path"
import {
  CONVERSATION_IMAGE_ASSETS_DIR_NAME as SHARED_CONVERSATION_IMAGE_ASSETS_DIR_NAME,
  isSafeConversationImageAssetFileName,
} from "@dotagents/shared/conversation-media-assets"
import { conversationsFolder } from "./config"
import { assertSafeConversationId } from "@dotagents/shared/conversation-id"

export {
  CONVERSATION_IMAGE_ASSET_HOST,
  CONVERSATION_IMAGE_ASSETS_DIR_NAME,
  buildConversationImageAssetUrl,
} from "@dotagents/shared/conversation-media-assets"

export function getConversationImageAssetsRoot(): string {
  return path.join(conversationsFolder, SHARED_CONVERSATION_IMAGE_ASSETS_DIR_NAME)
}

export function getConversationImageAssetDir(conversationId: string): string {
  assertSafeConversationId(conversationId)
  const root = path.resolve(getConversationImageAssetsRoot())
  const resolved = path.resolve(root, conversationId)
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error("Invalid conversation image asset directory")
  }
  return resolved
}

export function getConversationImageAssetPath(conversationId: string, fileName: string): string {
  assertSafeConversationId(conversationId)
  if (path.basename(fileName) !== fileName || !isSafeConversationImageAssetFileName(fileName)) {
    throw new Error("Invalid conversation image asset filename")
  }

  const dir = getConversationImageAssetDir(conversationId)
  const resolved = path.resolve(dir, fileName)
  if (!resolved.startsWith(dir + path.sep)) {
    throw new Error("Invalid conversation image asset path")
  }
  return resolved
}
