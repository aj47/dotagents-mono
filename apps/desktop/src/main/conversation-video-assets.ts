import path from "path"
import {
  getConversationVideoAssetDir as getSharedConversationVideoAssetDir,
  getConversationVideoAssetPath as getSharedConversationVideoAssetPath,
  getConversationVideoAssetsRoot as getSharedConversationVideoAssetsRoot,
  type ConversationMediaAssetPathOptions,
} from "@dotagents/shared/conversation-media-assets"
import { conversationsFolder } from "./config"

export {
  CONVERSATION_VIDEO_ASSET_HOST,
  CONVERSATION_VIDEO_ASSETS_DIR_NAME,
  buildConversationVideoAssetUrl,
  getConversationVideoMimeTypeFromFileName,
} from "@dotagents/shared/conversation-media-assets"

const conversationVideoAssetPathOptions: ConversationMediaAssetPathOptions = {
  conversationsFolder,
  pathAdapter: path,
}

export function getConversationVideoAssetsRoot(): string {
  return getSharedConversationVideoAssetsRoot(conversationVideoAssetPathOptions)
}

export function getConversationVideoAssetDir(conversationId: string): string {
  return getSharedConversationVideoAssetDir(conversationId, conversationVideoAssetPathOptions)
}

export function getConversationVideoAssetPath(conversationId: string, fileName: string): string {
  return getSharedConversationVideoAssetPath(conversationId, fileName, conversationVideoAssetPathOptions)
}
