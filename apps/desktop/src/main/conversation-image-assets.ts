import path from "path"
import {
  getConversationImageAssetDir as getSharedConversationImageAssetDir,
  getConversationImageAssetPath as getSharedConversationImageAssetPath,
  getConversationImageAssetsRoot as getSharedConversationImageAssetsRoot,
  type ConversationMediaAssetPathOptions,
} from "@dotagents/shared/conversation-media-assets"
import { conversationsFolder } from "./config"

export {
  CONVERSATION_IMAGE_ASSET_HOST,
  CONVERSATION_IMAGE_ASSETS_DIR_NAME,
  buildConversationImageAssetUrl,
} from "@dotagents/shared/conversation-media-assets"

const conversationImageAssetPathOptions: ConversationMediaAssetPathOptions = {
  conversationsFolder,
  pathAdapter: path,
}

export function getConversationImageAssetsRoot(): string {
  return getSharedConversationImageAssetsRoot(conversationImageAssetPathOptions)
}

export function getConversationImageAssetDir(conversationId: string): string {
  return getSharedConversationImageAssetDir(conversationId, conversationImageAssetPathOptions)
}

export function getConversationImageAssetPath(conversationId: string, fileName: string): string {
  return getSharedConversationImageAssetPath(conversationId, fileName, conversationImageAssetPathOptions)
}
