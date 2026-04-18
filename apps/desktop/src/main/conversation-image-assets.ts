import path from "path"
import { conversationsFolder } from "./config"
import { assertSafeConversationId } from "./conversation-id"

export const CONVERSATION_IMAGE_ASSET_HOST = "conversation-image"
export const CONVERSATION_IMAGE_ASSETS_DIR_NAME = "_images"

const SAFE_IMAGE_ASSET_FILE_REGEX = /^[a-f0-9]{16,64}\.(?:png|apng|gif|jpe?g|webp|bmp|avif)$/u

export function getConversationImageAssetsRoot(): string {
  return path.join(conversationsFolder, CONVERSATION_IMAGE_ASSETS_DIR_NAME)
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
  if (path.basename(fileName) !== fileName || !SAFE_IMAGE_ASSET_FILE_REGEX.test(fileName)) {
    throw new Error("Invalid conversation image asset filename")
  }

  const dir = getConversationImageAssetDir(conversationId)
  const resolved = path.resolve(dir, fileName)
  if (!resolved.startsWith(dir + path.sep)) {
    throw new Error("Invalid conversation image asset path")
  }
  return resolved
}

export function buildConversationImageAssetUrl(conversationId: string, fileName: string): string {
  return `assets://${CONVERSATION_IMAGE_ASSET_HOST}/${encodeURIComponent(conversationId)}/${encodeURIComponent(fileName)}`
}
