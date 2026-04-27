import path from "path"
import { conversationsFolder } from "./config"
import { assertSafeConversationId } from "./conversation-id"

export const CONVERSATION_VIDEO_ASSET_HOST = "conversation-video"
export const CONVERSATION_VIDEO_ASSETS_DIR_NAME = "_videos"

const SAFE_VIDEO_ASSET_FILE_REGEX = /^[a-f0-9]{16,64}\.(?:mp4|m4v|webm|mov|ogv)$/u

const VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".ogv": "video/ogg",
}

export function getConversationVideoAssetsRoot(): string {
  return path.join(conversationsFolder, CONVERSATION_VIDEO_ASSETS_DIR_NAME)
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
  if (path.basename(fileName) !== fileName || !SAFE_VIDEO_ASSET_FILE_REGEX.test(fileName)) {
    throw new Error("Invalid conversation video asset filename")
  }

  const dir = getConversationVideoAssetDir(conversationId)
  const resolved = path.resolve(dir, fileName)
  if (!resolved.startsWith(dir + path.sep)) {
    throw new Error("Invalid conversation video asset path")
  }
  return resolved
}

export function getConversationVideoMimeTypeFromFileName(fileName: string): string {
  return VIDEO_MIME_BY_EXTENSION[path.extname(fileName).toLowerCase()] ?? "application/octet-stream"
}

export function buildConversationVideoAssetUrl(conversationId: string, fileName: string): string {
  return `assets://${CONVERSATION_VIDEO_ASSET_HOST}/${encodeURIComponent(conversationId)}/${encodeURIComponent(fileName)}`
}
