export const CONVERSATION_VIDEO_ASSET_HOST = 'conversation-video';

const CONVERSATION_VIDEO_ASSET_URL_REGEX = /^assets:\/\/conversation-video\/([^/]+)\/([^/?#]+)(?:[?#].*)?$/i;
const RECORDING_ASSET_URL_REGEX = /^assets:\/\/recording\//i;
const VIDEO_EXTENSION_REGEX = /\.(?:mp4|m4v|webm|mov|ogv)(?:[?#].*)?$/i;

export interface ConversationVideoAssetRef {
  conversationId: string;
  fileName: string;
}

export function parseConversationVideoAssetUrl(rawUrl: string): ConversationVideoAssetRef | null {
  const match = rawUrl.trim().match(CONVERSATION_VIDEO_ASSET_URL_REGEX);
  if (!match) return null;

  try {
    return {
      conversationId: decodeURIComponent(match[1]),
      fileName: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

export function isConversationVideoAssetUrl(rawUrl?: string): boolean {
  return !!rawUrl && parseConversationVideoAssetUrl(rawUrl) !== null;
}

export function isRenderableVideoUrl(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  if (isConversationVideoAssetUrl(url) || RECORDING_ASSET_URL_REGEX.test(lower)) {
    return true;
  }

  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return VIDEO_EXTENSION_REGEX.test(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  } catch {
    return VIDEO_EXTENSION_REGEX.test(lower);
  }
}

export function getVideoAssetLabel(label: string | undefined, rawUrl: string): string {
  const trimmed = label?.trim();
  if (trimmed) return trimmed;

  const assetRef = parseConversationVideoAssetUrl(rawUrl);
  if (assetRef) return assetRef.fileName;

  try {
    const parsed = new URL(rawUrl);
    const fileName = parsed.pathname.split('/').filter(Boolean).pop();
    return decodeURIComponent(fileName || 'Video');
  } catch {
    return rawUrl.split('/').filter(Boolean).pop() || 'Video';
  }
}

export function buildConversationVideoAssetHttpUrl(apiBaseUrl: string, assetUrl: string): string | null {
  const assetRef = parseConversationVideoAssetUrl(assetUrl);
  if (!assetRef) return null;

  const base = apiBaseUrl.trim().replace(/\/+$/, '');
  if (!base) return null;

  return `${base}/conversations/${encodeURIComponent(assetRef.conversationId)}/assets/videos/${encodeURIComponent(assetRef.fileName)}`;
}
