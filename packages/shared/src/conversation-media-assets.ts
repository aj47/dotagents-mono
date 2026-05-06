import { REMOTE_SERVER_API_BUILDERS } from './remote-server-api';

export const CONVERSATION_VIDEO_ASSET_HOST = 'conversation-video';
export const CONVERSATION_VIDEO_ASSETS_DIR_NAME = '_videos';
export const CONVERSATION_IMAGE_ASSET_HOST = 'conversation-image';
export const CONVERSATION_IMAGE_ASSETS_DIR_NAME = '_images';

const CONVERSATION_VIDEO_ASSET_URL_REGEX = /^assets:\/\/conversation-video\/([^/]+)\/([^/?#]+)(?:[?#].*)?$/i;
const CONVERSATION_IMAGE_ASSET_URL_REGEX = /^assets:\/\/conversation-image\/([^/]+)\/([^/?#]+)(?:[?#].*)?$/i;
const VIDEO_EXTENSION_REGEX = /\.(?:mp4|m4v|webm|mov|ogv)(?:[?#].*)?$/i;
const SAFE_VIDEO_ASSET_FILE_REGEX = /^[a-f0-9]{16,64}\.(?:mp4|m4v|webm|mov|ogv)$/u;
const SAFE_IMAGE_ASSET_FILE_REGEX = /^[a-f0-9]{16,64}\.(?:png|apng|gif|jpe?g|webp|bmp|avif)$/u;
const MARKDOWN_DATA_IMAGE_URL_REGEX =
  /^data:image\/(?:png|apng|gif|jpe?g|webp|bmp|avif)(?:;|,)/i;
const RECORDING_ASSET_URL_REGEX = /^assets:\/\/recording\//i;

const VIDEO_MIME_BY_EXTENSION: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogv': 'video/ogg',
};

const VIDEO_EXTENSION_BY_MIME_SUBTYPE: Record<string, string> = {
  mp4: 'mp4',
  m4v: 'm4v',
  webm: 'webm',
  quicktime: 'mov',
  ogg: 'ogv',
};

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.apng': 'image/apng',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
};

const IMAGE_EXTENSION_BY_MIME_SUBTYPE: Record<string, string> = {
  png: 'png',
  apng: 'apng',
  gif: 'gif',
  jpeg: 'jpg',
  jpg: 'jpg',
  webp: 'webp',
  bmp: 'bmp',
  avif: 'avif',
};

const DATA_IMAGE_BASE64_PREFIX_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i;
const DATA_IMAGE_URL_REGEX = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i;
const DATA_IMAGE_MARKDOWN_REFERENCE_REGEX =
  /!\[([^\]]*)\]\((data:image\/[a-z0-9.+-]+;base64,[^)]+)\)/gi;
const CONVERSATION_IMAGE_MARKDOWN_REFERENCE_REGEX =
  /!\[([^\]]*)\]\((data:image\/[a-z0-9.+-]+;base64,[^)]+|assets:\/\/conversation-image\/[^)]+)\)/gi;
const MARKDOWN_IMAGE_REFERENCE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/gi;
const MARKDOWN_MEDIA_IMAGE_URL_REGEX = /^(?:data:image\/|https?:\/\/|assets:\/\/conversation-image\/)/i;

export const MAX_RESPOND_TO_USER_IMAGES = 4;
export const MAX_RESPOND_TO_USER_VIDEOS = 2;
export const MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES = 250 * 1024 * 1024;
export const MAX_RESPOND_TO_USER_TOTAL_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES = 12 * 1024 * 1024;

export interface ConversationVideoAssetRef {
  conversationId: string;
  fileName: string;
}

export interface ConversationImageAssetRef {
  conversationId: string;
  fileName: string;
}

export interface ParsedDataImageUrl {
  mimeType: string;
  base64: string;
}

export interface ConversationImageMarkdownReference {
  fullMatch: string;
  altText: string;
  url: string;
  index: number;
}

export interface ConversationImageMarkdownInput {
  url: string;
  altText?: string | null;
  fallbackAltText?: string | null;
}

export interface StripMarkdownImageReferencesOptions {
  mediaOnly?: boolean;
}

export type ConversationVideoByteRange =
  | {
      satisfiable: true;
      partial: false;
      contentLength: number;
    }
  | {
      satisfiable: true;
      partial: true;
      start: number;
      end: number;
      contentLength: number;
      contentRange: string;
    }
  | {
      satisfiable: false;
      contentRange: string;
    };

export type ConversationVideoAssetStreamPlan =
  | {
      ok: true;
      statusCode: 200 | 206;
      headers: Record<string, string>;
      range?: { start: number; end: number };
    }
  | {
      ok: false;
      statusCode: 416;
      headers: Record<string, string>;
    };

export type RespondToUserLocalAssetResolution = {
  resolvedPath: string;
  fileBytes: number;
};

export type RespondToUserLocalFileInfo = {
  rawPath: string;
  resolvedPath: string;
  isFile: boolean;
  fileBytes: number;
};

export type RespondToUserLocalFileValidation =
  | { success: true }
  | { success: false; error: string };

export type RespondToUserAssetHandlers = {
  storeDataImageUrlAsAsset: (url: string) => Promise<string>;
  resolveImagePath: (rawPath: string) => Promise<RespondToUserLocalAssetResolution>;
  storeImagePathAsAsset: (resolvedPath: string) => Promise<string>;
  resolveVideoPath: (rawPath: string) => Promise<RespondToUserLocalAssetResolution>;
  storeVideoPathAsAsset: (resolvedPath: string) => Promise<string>;
};

export type RespondToUserParsedArgs = {
  success: true;
  text: string;
  imageInputs: unknown[];
  videoInputs: unknown[];
};

export type RespondToUserArgsParseFailure = {
  success: false;
  error: string;
};

export type RespondToUserArgsParseResult =
  | RespondToUserParsedArgs
  | RespondToUserArgsParseFailure;

export type RespondToUserMaterializedResponse = {
  success: true;
  text: string;
  responseContent: string;
  responseContentBytes: number;
  imageCount: number;
  videoCount: number;
  localImageCount: number;
  localVideoCount: number;
  embeddedImageBytes: number;
  localVideoBytes: number;
};

export type RespondToUserMaterializationFailure = {
  success: false;
  error: string;
};

export type RespondToUserMaterializationResult =
  | RespondToUserMaterializedResponse
  | RespondToUserMaterializationFailure;

export type MarkdownUrlGuardOptions = {
  allowRecordingAssetUrls?: boolean;
};

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

export function parseConversationImageAssetUrl(rawUrl: string): ConversationImageAssetRef | null {
  const match = rawUrl.trim().match(CONVERSATION_IMAGE_ASSET_URL_REGEX);
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

export function isConversationImageAssetUrl(rawUrl?: string): boolean {
  return !!rawUrl && parseConversationImageAssetUrl(rawUrl) !== null;
}

export function parseDataImageUrl(rawUrl: string): ParsedDataImageUrl | null {
  const match = rawUrl.trim().match(DATA_IMAGE_URL_REGEX);
  if (!match) return null;

  return {
    mimeType: match[1].toLowerCase(),
    base64: match[2],
  };
}

export function extractConversationImageMarkdownReferences(content: string): ConversationImageMarkdownReference[] {
  return Array.from(content.matchAll(CONVERSATION_IMAGE_MARKDOWN_REFERENCE_REGEX), (match) => ({
    fullMatch: match[0],
    altText: match[1] ?? '',
    url: match[2] ?? '',
    index: match.index ?? 0,
  }));
}

export function extractDataImageMarkdownReferences(content: string): ConversationImageMarkdownReference[] {
  return Array.from(content.matchAll(DATA_IMAGE_MARKDOWN_REFERENCE_REGEX), (match) => ({
    fullMatch: match[0],
    altText: match[1] ?? '',
    url: match[2] ?? '',
    index: match.index ?? 0,
  }));
}

export function extractMarkdownImageReferences(content: string): ConversationImageMarkdownReference[] {
  return Array.from(content.matchAll(MARKDOWN_IMAGE_REFERENCE_REGEX), (match) => ({
    fullMatch: match[0],
    altText: match[1] ?? '',
    url: match[2] ?? '',
    index: match.index ?? 0,
  }));
}

export function isMarkdownMediaImageUrl(rawUrl: string): boolean {
  return MARKDOWN_MEDIA_IMAGE_URL_REGEX.test(rawUrl.trim());
}

export function replaceMarkdownImageReferences(
  content: string,
  replacer: (reference: ConversationImageMarkdownReference) => string,
): string {
  const references = extractMarkdownImageReferences(content);
  if (references.length === 0) return content;

  let nextContent = '';
  let lastIndex = 0;
  for (const reference of references) {
    nextContent += content.slice(lastIndex, reference.index);
    nextContent += replacer(reference);
    lastIndex = reference.index + reference.fullMatch.length;
  }

  return nextContent + content.slice(lastIndex);
}

export function stripMarkdownImageReferences(
  content: string,
  options: StripMarkdownImageReferencesOptions = {},
): string {
  return replaceMarkdownImageReferences(content, (reference) => {
    if (options.mediaOnly && !isMarkdownMediaImageUrl(reference.url)) {
      return reference.fullMatch;
    }
    return '';
  });
}

export function hasMarkdownMediaImageReference(content: string): boolean {
  return extractMarkdownImageReferences(content).some((reference) => isMarkdownMediaImageUrl(reference.url));
}

export function isRenderableVideoUrl(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  if (isConversationVideoAssetUrl(url)) {
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

export function isAllowedRespondToUserImageUrl(rawUrl: string): boolean {
  const normalized = rawUrl.trim().toLowerCase();
  return (
    normalized.startsWith('https://') ||
    normalized.startsWith('http://') ||
    DATA_IMAGE_BASE64_PREFIX_REGEX.test(normalized)
  );
}

export function isAllowedRespondToUserVideoUrl(rawUrl: string): boolean {
  return isRenderableVideoUrl(rawUrl);
}

export function isAllowedMarkdownLinkUrl(rawUrl?: string, options: MarkdownUrlGuardOptions = {}): boolean {
  if (!rawUrl) return false;

  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  if (
    lower.startsWith('#') ||
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    isConversationVideoAssetUrl(url)
  ) {
    return true;
  }

  return options.allowRecordingAssetUrls === true && RECORDING_ASSET_URL_REGEX.test(url);
}

export function isAllowedMarkdownImageUrl(rawUrl?: string): boolean {
  if (!rawUrl) return false;

  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    isConversationImageAssetUrl(url) ||
    MARKDOWN_DATA_IMAGE_URL_REGEX.test(url)
  );
}

export function transformMarkdownUrl(
  url: string,
  key?: string,
  options: MarkdownUrlGuardOptions = {},
): string {
  const isImageSrc = key === 'src';
  const isAllowed = isImageSrc
    ? isAllowedMarkdownImageUrl(url)
    : isAllowedMarkdownLinkUrl(url, options);
  return isAllowed ? url : '';
}

export function getConversationImageMimeTypeFromFileName(fileName: string): string | undefined {
  const normalized = fileName.toLowerCase();
  const dotIndex = normalized.lastIndexOf('.');
  const extension = dotIndex >= 0 ? normalized.slice(dotIndex) : '';
  return IMAGE_MIME_BY_EXTENSION[extension];
}

export function getConversationImageExtensionForMimeType(mimeType: string): string | undefined {
  const normalized = mimeType.toLowerCase().replace(/^image\//u, '');
  return IMAGE_EXTENSION_BY_MIME_SUBTYPE[normalized];
}

export function getRenderableVideoMimeTypeFromFileName(fileName: string): string | undefined {
  const mimeType = getConversationVideoMimeTypeFromFileName(fileName);
  return mimeType === 'application/octet-stream' ? undefined : mimeType;
}

export function getConversationVideoExtensionForMimeType(mimeType: string): string | undefined {
  const normalized = mimeType.toLowerCase().replace(/^video\//u, '');
  return VIDEO_EXTENSION_BY_MIME_SUBTYPE[normalized];
}

export function escapeMarkdownAltText(value: string): string {
  return value.replace(/[\[\]\\]/g, '').trim();
}

export function buildConversationImageMarkdownReference(input: ConversationImageMarkdownInput): string {
  const fallbackAltText = input.fallbackAltText?.trim() || 'Image';
  const safeAltText = escapeMarkdownAltText(input.altText || fallbackAltText) || fallbackAltText;
  return `![${safeAltText}](${input.url})`;
}

export function buildConversationImageMarkdownMessage(
  text: string,
  images: ConversationImageMarkdownInput[],
): string {
  const trimmedText = text.trim();
  const imageMarkdown = images.map(buildConversationImageMarkdownReference).join('\n\n');
  return [trimmedText, imageMarkdown].filter(Boolean).join('\n\n');
}

export function getDecodedBase64ByteLength(rawBase64: string): number {
  const normalized = rawBase64.replace(/\s+/g, '');
  if (!normalized) {
    return 0;
  }
  const padding = normalized.endsWith('==')
    ? 2
    : normalized.endsWith('=')
      ? 1
      : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

export function getDataImageBytesFromUrl(rawUrl: string): number | null {
  const trimmed = rawUrl.trim();
  if (!DATA_IMAGE_BASE64_PREFIX_REGEX.test(trimmed)) {
    return null;
  }
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex < 0 || commaIndex === trimmed.length - 1) {
    return 0;
  }
  const base64Payload = trimmed.slice(commaIndex + 1);
  return getDecodedBase64ByteLength(base64Payload);
}

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function getPathBaseName(rawPath: string): string {
  return rawPath.split(/[\\/]+/).filter(Boolean).pop() || rawPath;
}

function maxMegabytes(byteLimit: number): number {
  return Math.round(byteLimit / (1024 * 1024));
}

export function validateRespondToUserImagePath(
  rawPath: string,
  resolvedPath: string,
): RespondToUserLocalFileValidation {
  if (resolvedPath.toLowerCase().endsWith('.svg')) {
    return {
      success: false,
      error: `SVG images are not supported for conversation assets; use a raster image path: ${rawPath}`,
    };
  }

  return { success: true };
}

export function validateRespondToUserImageFile(
  fileInfo: RespondToUserLocalFileInfo,
): RespondToUserLocalFileValidation {
  if (!fileInfo.isFile) {
    return { success: false, error: `Image path is not a file: ${fileInfo.rawPath}` };
  }
  if (fileInfo.fileBytes <= 0) {
    return { success: false, error: `Image file is empty: ${fileInfo.rawPath}` };
  }
  if (fileInfo.fileBytes > MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES) {
    return { success: false, error: `Image file is larger than ${maxMegabytes(MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES)}MB: ${fileInfo.rawPath}` };
  }

  const mimeType = getConversationImageMimeTypeFromFileName(fileInfo.resolvedPath);
  if (!mimeType) {
    return { success: false, error: `Unsupported image extension for path: ${fileInfo.rawPath}` };
  }

  return { success: true };
}

export function validateRespondToUserVideoFile(
  fileInfo: RespondToUserLocalFileInfo,
): RespondToUserLocalFileValidation {
  if (!fileInfo.isFile) {
    return { success: false, error: `Video path is not a file: ${fileInfo.rawPath}` };
  }
  if (fileInfo.fileBytes <= 0) {
    return { success: false, error: `Video file is empty: ${fileInfo.rawPath}` };
  }
  if (fileInfo.fileBytes > MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES) {
    return { success: false, error: `Video file is larger than ${maxMegabytes(MAX_RESPOND_TO_USER_VIDEO_FILE_BYTES)}MB: ${fileInfo.rawPath}` };
  }

  const mimeType = getRenderableVideoMimeTypeFromFileName(fileInfo.resolvedPath);
  if (!mimeType) {
    return { success: false, error: `Unsupported video extension for path: ${fileInfo.rawPath}` };
  }

  return { success: true };
}

export function parseRespondToUserArgs(args: Record<string, unknown>): RespondToUserArgsParseResult {
  const text = typeof args.text === 'string' ? args.text.trim() : '';
  if (args.text !== undefined && typeof args.text !== 'string') {
    return { success: false, error: 'text must be a string if provided' };
  }

  if (args.images !== undefined && !Array.isArray(args.images)) {
    return { success: false, error: 'images must be an array if provided' };
  }

  if (args.videos !== undefined && !Array.isArray(args.videos)) {
    return { success: false, error: 'videos must be an array if provided' };
  }

  const imageInputs = Array.isArray(args.images) ? args.images : [];
  const videoInputs = Array.isArray(args.videos) ? args.videos : [];

  if (imageInputs.length > MAX_RESPOND_TO_USER_IMAGES) {
    return { success: false, error: `You can include up to ${MAX_RESPOND_TO_USER_IMAGES} images.` };
  }

  if (videoInputs.length > MAX_RESPOND_TO_USER_VIDEOS) {
    return { success: false, error: `You can include up to ${MAX_RESPOND_TO_USER_VIDEOS} videos.` };
  }

  return {
    success: true,
    text,
    imageInputs,
    videoInputs,
  };
}

export async function materializeParsedRespondToUserResponse(
  parsedArgs: RespondToUserParsedArgs,
  handlers: RespondToUserAssetHandlers,
): Promise<RespondToUserMaterializationResult> {
  const { text, imageInputs, videoInputs } = parsedArgs;
  const imageMarkdownBlocks: string[] = [];
  const videoMarkdownBlocks: string[] = [];
  let localImageCount = 0;
  let localVideoCount = 0;
  let embeddedImageBytes = 0;
  let localVideoBytes = 0;

  for (let index = 0; index < imageInputs.length; index++) {
    const rawItem = imageInputs[index];
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      return { success: false, error: `images[${index}] must be an object` };
    }

    const imageItem = rawItem as Record<string, unknown>;
    const url = typeof imageItem.url === 'string' ? imageItem.url.trim() : '';
    const imagePath = typeof imageItem.path === 'string' ? imageItem.path.trim() : '';
    const preferredAlt = typeof imageItem.alt === 'string' ? imageItem.alt.trim() : '';

    if (!url && !imagePath) {
      return { success: false, error: `images[${index}] must include either url or path` };
    }

    if (url && imagePath) {
      return { success: false, error: `images[${index}] cannot include both url and path` };
    }

    const fallbackAlt = imagePath ? getPathBaseName(imagePath) : `Image ${index + 1}`;
    const safeAlt = escapeMarkdownAltText(preferredAlt || fallbackAlt) || `Image ${index + 1}`;

    if (url) {
      if (!isAllowedRespondToUserImageUrl(url)) {
        return { success: false, error: `images[${index}].url must be http(s) or data:image` };
      }

      const dataImageBytes = getDataImageBytesFromUrl(url);
      if (dataImageBytes !== null) {
        if (dataImageBytes <= 0) {
          return { success: false, error: `images[${index}].url contains an invalid data:image payload` };
        }
        if (dataImageBytes > MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES) {
          return { success: false, error: `images[${index}].url exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_IMAGE_FILE_BYTES)}MB limit` };
        }
        if (embeddedImageBytes + dataImageBytes > MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES) {
          return { success: false, error: `Total embedded image payload exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES)}MB limit` };
        }
        embeddedImageBytes += dataImageBytes;

        try {
          const assetUrl = await handlers.storeDataImageUrlAsAsset(url);
          imageMarkdownBlocks.push(`![${safeAlt}](${assetUrl})`);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error
              ? `Failed to store images[${index}].url: ${error.message}`
              : `Failed to store images[${index}].url`,
          };
        }
        continue;
      }

      imageMarkdownBlocks.push(`![${safeAlt}](${url})`);
      continue;
    }

    try {
      const { resolvedPath, fileBytes } = await handlers.resolveImagePath(imagePath);
      if (embeddedImageBytes + fileBytes > MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES) {
        return { success: false, error: `Total embedded image payload exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_TOTAL_EMBEDDED_IMAGE_BYTES)}MB limit` };
      }
      embeddedImageBytes += fileBytes;
      const assetUrl = await handlers.storeImagePathAsAsset(resolvedPath);
      imageMarkdownBlocks.push(`![${safeAlt}](${assetUrl})`);
      localImageCount++;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? `Failed to load images[${index}].path: ${error.message}`
          : `Failed to load images[${index}].path`,
      };
    }
  }

  for (let index = 0; index < videoInputs.length; index++) {
    const rawItem = videoInputs[index];
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      return { success: false, error: `videos[${index}] must be an object` };
    }

    const videoItem = rawItem as Record<string, unknown>;
    const url = typeof videoItem.url === 'string' ? videoItem.url.trim() : '';
    const videoPath = typeof videoItem.path === 'string' ? videoItem.path.trim() : '';
    const preferredLabel = typeof videoItem.label === 'string' ? videoItem.label.trim() : '';

    if (!url && !videoPath) {
      return { success: false, error: `videos[${index}] must include either url or path` };
    }

    if (url && videoPath) {
      return { success: false, error: `videos[${index}] cannot include both url and path` };
    }

    const fallbackLabel = videoPath ? getPathBaseName(videoPath) : `Video ${index + 1}`;
    const safeLabel = escapeMarkdownAltText(preferredLabel || fallbackLabel) || `Video ${index + 1}`;

    if (url) {
      if (!isAllowedRespondToUserVideoUrl(url)) {
        return { success: false, error: `videos[${index}].url must be a valid http(s) video URL (recognized extension: mp4, m4v, webm, mov, ogv) or an assets://conversation-video/ URL` };
      }
      videoMarkdownBlocks.push(`[${safeLabel}](${url})`);
      continue;
    }

    try {
      const { resolvedPath, fileBytes } = await handlers.resolveVideoPath(videoPath);
      if (localVideoBytes + fileBytes > MAX_RESPOND_TO_USER_TOTAL_VIDEO_BYTES) {
        return { success: false, error: `Total local video payload exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_TOTAL_VIDEO_BYTES)}MB limit` };
      }
      localVideoBytes += fileBytes;
      const assetUrl = await handlers.storeVideoPathAsAsset(resolvedPath);
      videoMarkdownBlocks.push(`[${safeLabel}](${assetUrl})`);
      localVideoCount++;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? `Failed to load videos[${index}].path: ${error.message}`
          : `Failed to load videos[${index}].path`,
      };
    }
  }

  const imageMarkdown = imageMarkdownBlocks.join('\n\n');
  const videoMarkdown = videoMarkdownBlocks.join('\n\n');
  const responseContent = [text, imageMarkdown, videoMarkdown].filter(Boolean).join('\n\n');
  const responseContentBytes = getUtf8ByteLength(responseContent);

  if (!responseContent.trim()) {
    return { success: false, error: 'respond_to_user requires text, images, and/or videos' };
  }

  if (responseContentBytes > MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES) {
    return { success: false, error: `Response content exceeds the ${maxMegabytes(MAX_RESPOND_TO_USER_RESPONSE_CONTENT_BYTES)}MB limit` };
  }

  return {
    success: true,
    text,
    responseContent,
    responseContentBytes,
    imageCount: imageMarkdownBlocks.length,
    videoCount: videoMarkdownBlocks.length,
    localImageCount,
    localVideoCount,
    embeddedImageBytes,
    localVideoBytes,
  };
}

export async function materializeRespondToUserResponse(
  args: Record<string, unknown>,
  handlers: RespondToUserAssetHandlers,
): Promise<RespondToUserMaterializationResult> {
  const parsedArgs = parseRespondToUserArgs(args);
  if (parsedArgs.success === false) {
    return parsedArgs;
  }

  return materializeParsedRespondToUserResponse(parsedArgs, handlers);
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

  return `${base}${REMOTE_SERVER_API_BUILDERS.conversationVideoAsset(assetRef.conversationId, assetRef.fileName)}`;
}

export function buildConversationVideoAssetUrl(conversationId: string, fileName: string): string {
  return `assets://${CONVERSATION_VIDEO_ASSET_HOST}/${encodeURIComponent(conversationId)}/${encodeURIComponent(fileName)}`;
}

export function buildConversationImageAssetUrl(conversationId: string, fileName: string): string {
  return `assets://${CONVERSATION_IMAGE_ASSET_HOST}/${encodeURIComponent(conversationId)}/${encodeURIComponent(fileName)}`;
}

export function isSafeConversationVideoAssetFileName(fileName: string): boolean {
  return SAFE_VIDEO_ASSET_FILE_REGEX.test(fileName);
}

export function isSafeConversationImageAssetFileName(fileName: string): boolean {
  return SAFE_IMAGE_ASSET_FILE_REGEX.test(fileName);
}

export function getConversationVideoMimeTypeFromFileName(fileName: string): string {
  const normalized = fileName.toLowerCase();
  const dotIndex = normalized.lastIndexOf('.');
  const extension = dotIndex >= 0 ? normalized.slice(dotIndex) : '';
  return VIDEO_MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
}

export function getConversationVideoByteRange(
  rangeHeader: string | string[] | undefined,
  totalSize: number,
): ConversationVideoByteRange {
  const size = Number.isFinite(totalSize) ? Math.max(0, Math.floor(totalSize)) : 0;
  const header = Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader;

  if (!header) {
    return {
      satisfiable: true,
      partial: false,
      contentLength: size,
    };
  }

  const unsatisfiable = (): ConversationVideoByteRange => ({
    satisfiable: false,
    contentRange: `bytes */${size}`,
  });

  const match = header.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2]) || size <= 0) {
    return unsatisfiable();
  }

  const suffixLength = !match[1] && match[2] ? Number.parseInt(match[2], 10) : null;
  const start = suffixLength !== null
    ? Math.max(size - suffixLength, 0)
    : Number.parseInt(match[1], 10);
  const end = suffixLength !== null
    ? size - 1
    : match[2] ? Number.parseInt(match[2], 10) : size - 1;

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
    return unsatisfiable();
  }

  const boundedEnd = Math.min(end, size - 1);
  const contentLength = boundedEnd - start + 1;

  return {
    satisfiable: true,
    partial: true,
    start,
    end: boundedEnd,
    contentLength,
    contentRange: `bytes ${start}-${boundedEnd}/${size}`,
  };
}

export function buildConversationVideoAssetStreamPlan(
  fileName: string,
  rangeHeader: string | string[] | undefined,
  totalSize: number,
): ConversationVideoAssetStreamPlan {
  const contentType = getConversationVideoMimeTypeFromFileName(fileName);
  const range = getConversationVideoByteRange(rangeHeader, totalSize);
  if (range.satisfiable === false) {
    return {
      ok: false,
      statusCode: 416,
      headers: { 'Content-Range': range.contentRange },
    };
  }

  const headers: Record<string, string> = {
    'Accept-Ranges': 'bytes',
    'Content-Type': contentType,
    'Content-Length': String(range.contentLength),
  };

  if (!range.partial) {
    return {
      ok: true,
      statusCode: 200,
      headers,
    };
  }

  headers['Content-Range'] = range.contentRange;
  return {
    ok: true,
    statusCode: 206,
    headers,
    range: { start: range.start, end: range.end },
  };
}
